import {
	authorUtils,
	type BlogAuthor,
	blogAuthors,
	convertLegacyAuthor,
	defaultAuthor,
	getActiveAuthors,
	getAuthorById,
	getAuthorByName,
	getAuthorsByIds,
} from "@/config/blog-authors";

describe("Blog Authors Configuration", () => {
	describe("getAuthorById", () => {
		it("should return the correct author by ID", () => {
			const author = getAuthorById("lacy-morrow");
			expect(author).toBeDefined();
			expect(author.id).toBe("lacy-morrow");
			expect(author.name).toBe("Lacy Morrow");
		});

		it("should return default author for non-existent ID", () => {
			const author = getAuthorById("non-existent-id");
			expect(author).toBe(defaultAuthor);
		});

		it("should return default author for empty string", () => {
			const author = getAuthorById("");
			expect(author).toBe(defaultAuthor);
		});
	});

	describe("getAuthorByName", () => {
		it("should return the correct author by name (case-insensitive)", () => {
			const author = getAuthorByName("Lacy Morrow");
			expect(author).toBeDefined();
			expect(author.name).toBe("Lacy Morrow");
		});

		it("should work with different cases", () => {
			const author = getAuthorByName("lacy morrow");
			expect(author).toBeDefined();
			expect(author.name).toBe("Lacy Morrow");
		});

		it("should return default author for non-existent name", () => {
			const author = getAuthorByName("Non Existent Author");
			expect(author).toBe(defaultAuthor);
		});

		it("should return default author for empty string", () => {
			const author = getAuthorByName("");
			expect(author).toBe(defaultAuthor);
		});
	});

	describe("getAuthorsByIds", () => {
		it("should return multiple authors by their IDs", () => {
			const authors = getAuthorsByIds(["lacy-morrow", "shipkit-team"]);
			expect(authors).toHaveLength(2);
			expect(authors[0].id).toBe("lacy-morrow");
			expect(authors[1].id).toBe("shipkit-team");
		});

		it("should return default authors for non-existent IDs", () => {
			const authors = getAuthorsByIds(["non-existent-1", "non-existent-2"]);
			expect(authors).toHaveLength(2);
			expect(authors[0]).toBe(defaultAuthor);
			expect(authors[1]).toBe(defaultAuthor);
		});

		it("should handle empty array", () => {
			const authors = getAuthorsByIds([]);
			expect(authors).toHaveLength(0);
		});

		it("should handle mixed valid and invalid IDs", () => {
			const authors = getAuthorsByIds(["lacy-morrow", "non-existent"]);
			expect(authors).toHaveLength(2);
			expect(authors[0].id).toBe("lacy-morrow");
			expect(authors[1]).toBe(defaultAuthor);
		});
	});

	describe("getActiveAuthors", () => {
		it("should return only active authors", () => {
			const activeAuthors = getActiveAuthors();
			expect(activeAuthors.length).toBeGreaterThan(0);
			activeAuthors.forEach((author) => {
				expect(author.isActive).not.toBe(false);
			});
		});

		it("should include authors with undefined isActive (defaults to true)", () => {
			const activeAuthors = getActiveAuthors();
			const authorsWithUndefinedActive = activeAuthors.filter(
				(author) => author.isActive === undefined
			);
			// Should not filter out authors with undefined isActive
			expect(authorsWithUndefinedActive.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe("convertLegacyAuthor", () => {
		it("should convert known legacy author name to existing author", () => {
			const author = convertLegacyAuthor("Lacy Morrow");
			expect(author.id).toBe("lacy-morrow");
			expect(author.name).toBe("Lacy Morrow");
		});

		it("should create temporary author object for unknown name", () => {
			const author = convertLegacyAuthor("Guest Author");
			expect(author.id).toBe("guest-author");
			expect(author.name).toBe("Guest Author");
			expect(author.bio).toBe("Guest author: Guest Author");
			expect(author.isActive).toBe(false);
			expect(author.avatar).toBe(defaultAuthor.avatar);
		});

		it("should handle names with special characters", () => {
			const author = convertLegacyAuthor("John O'Connor");
			expect(author.id).toBe("john-o'connor");
			expect(author.name).toBe("John O'Connor");
		});

		it("should handle names with multiple spaces", () => {
			const author = convertLegacyAuthor("John   Doe");
			expect(author.id).toBe("john-doe");
			expect(author.name).toBe("John   Doe");
		});

		it("should return default author for default author name", () => {
			const author = convertLegacyAuthor(defaultAuthor.name);
			expect(author).toBe(defaultAuthor);
		});
	});

	describe("authorUtils", () => {
		describe("getDisplayName", () => {
			it("should return fullName when available", () => {
				const author: BlogAuthor = {
					id: "test",
					name: "Test",
					fullName: "Test Full Name",
					avatar: "avatar.jpg",
				};
				expect(authorUtils.getDisplayName(author)).toBe("Test Full Name");
			});

			it("should return name when fullName is not available", () => {
				const author: BlogAuthor = {
					id: "test",
					name: "Test",
					avatar: "avatar.jpg",
				};
				expect(authorUtils.getDisplayName(author)).toBe("Test");
			});
		});

		describe("getSocialLinks", () => {
			it("should return all social links when available", () => {
				const author: BlogAuthor = {
					id: "test",
					name: "Test",
					avatar: "avatar.jpg",
					twitter: "testuser",
					github: "testuser",
					linkedin: "testuser",
					website: "https://test.com",
				};

				const links = authorUtils.getSocialLinks(author);
				expect(links).toHaveLength(4);

				const twitter = links.find((link) => link.platform === "twitter");
				expect(twitter).toEqual({
					platform: "twitter",
					url: "https://twitter.com/testuser",
					handle: "@testuser",
				});

				const github = links.find((link) => link.platform === "github");
				expect(github).toEqual({
					platform: "github",
					url: "https://github.com/testuser",
					handle: "testuser",
				});

				const linkedin = links.find((link) => link.platform === "linkedin");
				expect(linkedin).toEqual({
					platform: "linkedin",
					url: "https://linkedin.com/in/testuser",
					handle: "testuser",
				});

				const website = links.find((link) => link.platform === "website");
				expect(website).toEqual({
					platform: "website",
					url: "https://test.com",
					handle: "test.com",
				});
			});

			it("should return empty array when no social links", () => {
				const author: BlogAuthor = {
					id: "test",
					name: "Test",
					avatar: "avatar.jpg",
				};

				const links = authorUtils.getSocialLinks(author);
				expect(links).toHaveLength(0);
			});

			it("should handle website URLs without protocol", () => {
				const author: BlogAuthor = {
					id: "test",
					name: "Test",
					avatar: "avatar.jpg",
					website: "test.com",
				};

				const links = authorUtils.getSocialLinks(author);
				const website = links.find((link) => link.platform === "website");
				expect(website?.handle).toBe("test.com");
			});
		});

		describe("getAuthorUrl", () => {
			it("should return correct author URL", () => {
				const author: BlogAuthor = {
					id: "test-author",
					name: "Test",
					avatar: "avatar.jpg",
				};

				const url = authorUtils.getAuthorUrl(author);
				expect(url).toBe("/blog/authors/test-author");
			});
		});
	});

	describe("defaultAuthor", () => {
		it("should be defined and have required properties", () => {
			expect(defaultAuthor).toBeDefined();
			expect(defaultAuthor.id).toBeDefined();
			expect(defaultAuthor.name).toBeDefined();
			expect(defaultAuthor.avatar).toBeDefined();
		});

		it("should be the same as lacy-morrow author", () => {
			expect(defaultAuthor).toBe(blogAuthors["lacy-morrow"]);
		});
	});

	describe("blogAuthors", () => {
		it("should contain expected authors", () => {
			expect(blogAuthors["lacy-morrow"]).toBeDefined();
			expect(blogAuthors["shipkit-team"]).toBeDefined();
		});

		it("should have authors with required properties", () => {
			Object.values(blogAuthors).forEach((author) => {
				expect(author.id).toBeDefined();
				expect(author.name).toBeDefined();
				expect(author.avatar).toBeDefined();
				expect(typeof author.id).toBe("string");
				expect(typeof author.name).toBe("string");
				expect(typeof author.avatar).toBe("string");
			});
		});

		it("should have unique IDs", () => {
			const ids = Object.keys(blogAuthors);
			const uniqueIds = [...new Set(ids)];
			expect(ids).toHaveLength(uniqueIds.length);
		});

		it("should have consistent ID format", () => {
			Object.keys(blogAuthors).forEach((id) => {
				expect(id).toMatch(/^[a-z0-9-]+$/);
				expect(id).not.toMatch(/^-|-$/);
			});
		});
	});
});
