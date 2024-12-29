import { db } from "@/server/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { type PgTable } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

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
    async create<TSelect extends Record<string, unknown>>(
        data: Partial<T["_"]["inferInsert"]>,
    ): Promise<T["_"]["inferSelect"]> {
        const id = (data[this.idField as keyof typeof data] as string) || nanoid();
        const now = new Date();

        const [record] = await this.db
            .insert(this.table)
            .values({
                ...data,
                [this.idField]: id,
                createdAt: now,
                updatedAt: now,
            } as T["_"]["inferInsert"])
            .returning();

        return record;
    }

    /**
     * Find a record by ID
     * @param id - The ID of the record
     * @returns The found record or null
     */
    async findById(id: string): Promise<T["_"]["inferSelect"] | null> {
        const conditions: any[] = [eq(this.table[this.idField], id)];

        if (this.softDelete) {
            conditions.push(eq(this.table["deletedAt" as keyof T], null));
        }

        const record = await this.db.query[this.table].findFirst({
            where: conditions.length > 1 ? and(...conditions) : conditions[0],
        });

        return record || null;
    }

    /**
     * Find records by a where clause
     * @param where - The where clause
     * @returns The found records
     */
    async find(
        where: Partial<T["_"]["inferSelect"]>,
    ): Promise<T["_"]["inferSelect"][]> {
        const conditions: any[] = Object.entries(where).map(([key, value]) =>
            eq(this.table[key as keyof T], value),
        );

        if (this.softDelete) {
            conditions.push(eq(this.table["deletedAt" as keyof T], null));
        }

        const records = await this.db.query[this.table].findMany({
            where: conditions.length > 1 ? and(...conditions) : conditions[0],
        });

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
        data: Partial<T["_"]["inferInsert"]>,
    ): Promise<T["_"]["inferSelect"] | null> {
        const [record] = await this.db
            .update(this.table)
            .set({
                ...data,
                updatedAt: new Date(),
            } as T["_"]["inferInsert"])
            .where(eq(this.table[this.idField], id))
            .returning();

        return record || null;
    }

    /**
     * Delete a record by ID
     * @param id - The ID of the record
     * @returns True if deleted, false if not found
     */
    async delete(id: string): Promise<boolean> {
        if (this.softDelete) {
            const [record] = await this.db
                .update(this.table)
                .set({ deletedAt: new Date() } as T["_"]["inferInsert"])
                .where(eq(this.table[this.idField], id))
                .returning();
            return !!record;
        }

        const [record] = await this.db
            .delete(this.table)
            .where(eq(this.table[this.idField], id))
            .returning();
        return !!record;
    }

    /**
     * Count records by a where clause
     * @param where - The where clause
     * @returns The count of records
     */
    async count(where: Partial<T["_"]["inferSelect"]> = {}): Promise<number> {
        const conditions: any[] = Object.entries(where).map(([key, value]) =>
            eq(this.table[key as keyof T], value),
        );

        if (this.softDelete) {
            conditions.push(eq(this.table["deletedAt" as keyof T], null));
        }

        const result = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(this.table)
            .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

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
        } = {},
    ) {
        const {
            where = {},
            page = 1,
            limit = 10,
            orderBy = this.idField,
            orderDir = "desc",
        } = options;

        const offset = (page - 1) * limit;
        const conditions: any[] = Object.entries(where).map(([key, value]) =>
            eq(this.table[key as keyof T], value),
        );

        if (this.softDelete) {
            conditions.push(eq(this.table["deletedAt" as keyof T], null));
        }

        const [records, [{ count }]] = await Promise.all([
            this.db.query[this.table].findMany({
                where: conditions.length > 1 ? and(...conditions) : conditions[0],
                limit,
                offset,
                orderBy:
                    orderDir === "desc"
                        ? desc(this.table[orderBy])
                        : asc(this.table[orderBy]),
            }),
            this.db
                .select({ count: sql<number>`count(*)` })
                .from(this.table)
                .where(conditions.length > 1 ? and(...conditions) : conditions[0]),
        ]);

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
