import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getChangelogEntries,
	getChangelogEntry,
	isLegacyUnreleasedSlug,
	UNRELEASED_SLUG,
} from "@/lib/changelog";

// unstable_cache needs a Next request scope. Pass the function through and
// keep a handle on it so a test can call the uncached unit directly.
// (tests/setup.ts clears mock call history, so mock.calls is not usable.)
const cache = vi.hoisted(() => ({ fn: null as null | (() => Promise<unknown>) }));
vi.mock("next/cache", () => ({
	unstable_cache: (fn: () => Promise<unknown>) => {
		cache.fn = fn;
		return fn;
	},
}));

interface Commit {
	sha: string;
	commit: { message: string; author: { date: string; name: string } };
}

const commit = (sha: string, date: string, message: string): Commit => ({
	sha,
	commit: { message, author: { date, name: "dev" } },
});

// Newest first, as the GitHub API returns them.
const TAGGED = [
	commit("c2", "2026-06-30T03:21:07Z", "fix: tagged release"),
	commit("c1", "2026-06-01T10:00:00Z", "chore: first"),
];
const TAGS = [{ name: "v1.0.0", commit: { sha: "c2" } }];

/** Commits on main after the last tag, before and after one more merge. */
const BEFORE_MERGE = [commit("c3", "2026-09-02T18:14:12Z", "feat: three"), ...TAGGED];
const AFTER_MERGE = [commit("c4", "2026-09-12T18:10:37Z", "fix: four"), ...BEFORE_MERGE];

const mockGitHub = (commits: Commit[], tags = TAGS) =>
	vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
		const url = String(input);
		if (url.includes("/commits?")) return Response.json(commits);
		if (url.includes("/tags?")) return Response.json(tags);
		throw new Error(`unexpected fetch: ${url}`);
	});

describe("changelog slugs", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("every slug listed by getChangelogEntries resolves via getChangelogEntry", async () => {
		mockGitHub(BEFORE_MERGE);
		const entries = await getChangelogEntries();
		expect(entries.length).toBeGreaterThan(1);

		for (const entry of entries) {
			const found = await getChangelogEntry(entry.slug);
			expect(found?.slug, `slug "${entry.slug}" from the list must resolve`).toBe(entry.slug);
		}
	});

	it("keeps the unreleased slug stable when a new commit lands on main", async () => {
		const fetchSpy = mockGitHub(BEFORE_MERGE);
		const before = (await getChangelogEntries()).find((e) => !e.badge);

		fetchSpy.mockRestore();
		mockGitHub(AFTER_MERGE);
		const after = await getChangelogEntry(before!.slug);

		expect(before?.slug).toBe(UNRELEASED_SLUG);
		expect(after?.slug).toBe(UNRELEASED_SLUG);
		expect(after?.commitCount).toBe(before!.commitCount + 1);
		expect(after?.publishedAt).toBe("2026-09-12");
	});

	it("derives release slugs from the tag name", async () => {
		mockGitHub(BEFORE_MERGE);
		const release = await getChangelogEntry("v1.0.0");
		expect(release?.badge).toBe("v1.0.0");
		expect(release?.commitCount).toBe(2);
	});

	it("uses the unreleased slug for the whole history when there are no tags", async () => {
		mockGitHub(BEFORE_MERGE, []);
		const entries = await getChangelogEntries();
		expect(entries.map((e) => e.slug)).toEqual([UNRELEASED_SLUG]);
		expect(entries[0]?.commitCount).toBe(3);
	});

	it("returns null for an unknown slug", async () => {
		mockGitHub(BEFORE_MERGE);
		expect(await getChangelogEntry("nope-xyz")).toBeNull();
	});

	it("recognises the old date-based slugs so they can redirect", () => {
		expect(isLegacyUnreleasedSlug("updates-2026-09-02")).toBe(true);
		expect(isLegacyUnreleasedSlug(UNRELEASED_SLUG)).toBe(false);
		expect(isLegacyUnreleasedSlug("v1.7.6")).toBe(false);
	});

	it("does not hand a GitHub failure to the cache", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("rate limited", { status: 403 }));

		// The unit inside unstable_cache must reject, so the failure is not
		// stored for an hour; the public getter still degrades to an empty list.
		await expect(cache.fn!()).rejects.toThrow(/GitHub API 403/);
		expect(await getChangelogEntries()).toEqual([]);
	});
});
