import { describe, expect, it } from "vitest";
import { extractComponentId, transformImports } from "@/app/(app)/install/utils";

describe("install utils", () => {
	describe("extractComponentId", () => {
		it("returns the ID when given just an ID", () => {
			expect(extractComponentId("b_123456")).toBe("b_123456");
			expect(extractComponentId("b_abcdef")).toBe("b_abcdef");
		});

		it("extracts the ID from a valid v0.dev URL", () => {
			expect(extractComponentId("https://v0.dev/b/b_123456")).toBe("b_123456");
			expect(extractComponentId("https://v0.dev/chat/b/b_abcdef")).toBe("b_abcdef");
		});

		it("returns null for invalid inputs", () => {
			expect(extractComponentId("not_an_id")).toBeNull();
			expect(extractComponentId("https://example.com/123")).toBeNull();
		});
	});

	describe("transformImports", () => {
		it("should not change code if structures are the same", () => {
			const code = `import { Button } from "/app/components/ui/button";\nconsole.log("hello");`;
			expect(transformImports(code, "app", "app")).toBe(code);
			expect(transformImports(code, "src", "src")).toBe(code);
		});

		it("should transform imports from /app/ to /src/app/", () => {
			const code = `import { Button } from "/app/components/ui/button";\nimport { Input } from "/app/components/ui/input";`;
			const expected = `import { Button } from "/src/app/components/ui/button";\nimport { Input } from "/src/app/components/ui/input";`;
			expect(transformImports(code, "app", "src")).toBe(expected);
		});

		it("should transform imports from /src/app/ to /app/", () => {
			const code = `import { Card } from "/src/app/components/ui/card";\nimport { Label } from "/src/app/components/ui/label";`;
			const expected = `import { Card } from "/app/components/ui/card";\nimport { Label } from "/app/components/ui/label";`;
			expect(transformImports(code, "src", "app")).toBe(expected);
		});

		it("should handle code with no matching imports", () => {
			const code = `console.log("No imports here");\nconst x = 5;`;
			expect(transformImports(code, "app", "src")).toBe(code);
			expect(transformImports(code, "src", "app")).toBe(code);
		});

		it("should handle multiple imports correctly", () => {
			const code = `import A from "/app/a";\nfunction test() {\n  import B from "/app/b";\n}\nimport C from "/app/c";`;
			const expected = `import A from "/src/app/a";\nfunction test() {\n  import B from "/src/app/b";\n}\nimport C from "/src/app/c";`;
			expect(transformImports(code, "app", "src")).toBe(expected);
		});
	});
});
