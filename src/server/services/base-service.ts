import { and, asc, type Column, desc, eq, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { db } from "@/server/db";

export interface BaseServiceOptions<T extends PgTable> {
	table: T;
	idField: keyof T["_"]["columns"];
	softDelete?: boolean;
}

export class BaseService<T extends PgTable> {
	protected db;
	protected table: T;
	protected idField: keyof T["_"]["columns"];
	protected softDelete: boolean;

	constructor(options: BaseServiceOptions<T>) {
		this.db = db;
		this.table = options.table;
		this.idField = options.idField;
		this.softDelete = options.softDelete ?? false;
	}

	/**
	 * Create a new record
	 * @param data - The data to create
	 * @returns The created record
	 */
	async create(data: Partial<T["_"]["inferInsert"]>): Promise<T["_"]["inferSelect"]> {
		if (!this.db) {
			throw new Error("Database connection not available");
		}

		const id = (data as any)[this.idField] ?? nanoid();
		const now = new Date();

		const values = {
			...data,
			[this.idField as string]: id,
			createdAt: now,
			updatedAt: now,
		};

		const [record] = await this.db.insert(this.table).values(values).returning();

		if (!record) {
			throw new Error("Failed to create record");
		}

		return record;
	}

	/**
	 * Find a record by ID
	 * @param id - The ID of the record
	 * @returns The found record or null
	 */
	async findById(id: string): Promise<T["_"]["inferSelect"] | null> {
		if (!this.db) {
			return null;
		}

		const idColumn = this.table[this.idField as keyof T] as Column;
		const conditions: (SQL<unknown> | undefined)[] = [eq(idColumn, id)];

		if (this.softDelete) {
			const deletedAtColumn = this.table["deletedAt" as keyof T] as Column | undefined;
			if (deletedAtColumn) {
				conditions.push(eq(deletedAtColumn, null));
			}
		}

		const [record] = await this.db
			.select()
			.from(this.table as any)
			.where(and(...conditions.filter((c): c is SQL<unknown> => !!c)))
			.limit(1);

		return record || null;
	}

	/**
	 * Find records by a where clause
	 * @param where - The where clause
	 * @returns The found records
	 */
	async find(where: Partial<T["_"]["inferSelect"]>): Promise<T["_"]["inferSelect"][]> {
		if (!this.db) {
			return [];
		}

		const conditions: (SQL<unknown> | undefined)[] = Object.entries(where).map(([key, value]) => {
			const column = this.table[key as keyof T] as Column | undefined;
			return column ? eq(column, value) : undefined;
		});

		if (this.softDelete) {
			const deletedAtColumn = this.table["deletedAt" as keyof T] as Column | undefined;
			if (deletedAtColumn) {
				conditions.push(eq(deletedAtColumn, null));
			}
		}

		const finalConditions = conditions.filter((c): c is SQL<unknown> => !!c);

		if (finalConditions.length === 0) {
			return this.db.select().from(this.table as any);
		}

		const records = await this.db
			.select()
			.from(this.table as any)
			.where(and(...finalConditions));

		return records;
	}

	/**
	 * Update a record by ID
	 * @param id - The ID of the record
	 * @param data - The data to update
	 * @returns The updated record
	 */
	async update(
		id: string,
		data: Partial<T["_"]["inferInsert"]>
	): Promise<T["_"]["inferSelect"] | null> {
		if (!this.db) {
			return null;
		}

		const idColumn = this.table[this.idField as keyof T] as Column;
		const [record] = await this.db
			.update(this.table)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(idColumn, id))
			.returning();

		return record || null;
	}

	/**
	 * Delete a record by ID
	 * @param id - The ID of the record
	 * @returns True if deleted, false if not found
	 */
	async delete(id: string): Promise<boolean> {
		if (!this.db) {
			return false;
		}

		const idColumn = this.table[this.idField as keyof T] as Column;

		if (this.softDelete) {
			const deletedAtColumn = this.table["deletedAt" as keyof T] as Column | undefined;
			if (deletedAtColumn) {
				const [record] = await this.db
					.update(this.table)
					.set({ deletedAt: new Date() } as any)
					.where(eq(idColumn, id))
					.returning();
				return !!record;
			}
		}

		const [record] = await this.db.delete(this.table).where(eq(idColumn, id)).returning();
		return !!record;
	}

	/**
	 * Count records by a where clause
	 * @param where - The where clause
	 * @returns The count of records
	 */
	async count(where: Partial<T["_"]["inferSelect"]> = {}): Promise<number> {
		if (!this.db) {
			return 0;
		}

		const conditions: (SQL<unknown> | undefined)[] = Object.entries(where).map(([key, value]) => {
			const column = this.table[key as keyof T] as Column | undefined;
			return column ? eq(column, value) : undefined;
		});

		if (this.softDelete) {
			const deletedAtColumn = this.table["deletedAt" as keyof T] as Column | undefined;
			if (deletedAtColumn) {
				conditions.push(eq(deletedAtColumn, null));
			}
		}

		const finalConditions = conditions.filter((c): c is SQL<unknown> => !!c);

		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(this.table as any)
			.where(finalConditions.length > 0 ? and(...finalConditions) : undefined);

		return Number(result[0]?.count ?? 0);
	}

	/**
	 * Find records with pagination
	 * @param options - Pagination options
	 * @returns The paginated records and total count
	 */
	async findWithPagination(
		options: {
			where?: Partial<T["_"]["inferSelect"]>;
			page?: number;
			limit?: number;
			orderBy?: keyof T["_"]["columns"];
			orderDir?: "asc" | "desc";
		} = {}
	) {
		if (!this.db) {
			return {
				data: [],
				pagination: {
					total: 0,
					page: options.page || 1,
					limit: options.limit || 10,
					totalPages: 0,
				},
			};
		}

		const { where = {}, page = 1, limit = 10, orderBy = this.idField, orderDir = "desc" } = options;

		const offset = (page - 1) * limit;

		const conditions: (SQL<unknown> | undefined)[] = Object.entries(where).map(([key, value]) => {
			const column = this.table[key as keyof T] as Column | undefined;
			return column ? eq(column, value) : undefined;
		});

		if (this.softDelete) {
			const deletedAtColumn = this.table["deletedAt" as keyof T] as Column | undefined;
			if (deletedAtColumn) {
				conditions.push(eq(deletedAtColumn, null));
			}
		}

		const finalConditions = conditions.filter((c): c is SQL<unknown> => !!c);
		const whereClause = finalConditions.length > 0 ? and(...finalConditions) : undefined;

		const orderByColumn = this.table[orderBy as keyof T] as Column;

		const recordsQuery = this.db
			.select()
			.from(this.table as any)
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(orderDir === "desc" ? desc(orderByColumn) : asc(orderByColumn));

		const countQuery = this.db
			.select({ count: sql<number>`count(*)` })
			.from(this.table as any)
			.where(whereClause);

		const [records, countResult] = await Promise.all([
			recordsQuery,
			countQuery,
		]);

		const count = countResult?.[0]?.count || 0;

		return {
			data: records,
			pagination: {
				total: Number(count),
				page,
				limit,
				totalPages: Math.ceil(Number(count) / limit),
			},
		};
	}
}
