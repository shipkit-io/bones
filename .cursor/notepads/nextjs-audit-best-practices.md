**Goal:** Audit the Shipkit codebase (`src/`) to identify deviations from Next.js App Router best practices and project-specific guidelines (referencing `nextjs.mdc`, `dont-do.mdc`, `react.mdc` where relevant).

**Scope:** The entire `/src` directory of the Shipkit project.

**Key Areas and Anti-patterns to Check:**

1. **Component Boundaries (`"use client"` usage):**
    * Identify components marked with `"use client"` that *do not* use client-specific hooks (like `useState`, `useEffect`, `useContext`) or browser APIs. These might be convertible to Server Components.
    * Check for Server Components nested directly within the JSX of Client Components. Server Components should be passed as `children` or props.

2. **Data Fetching:**
    * Locate data fetching performed within `useEffect` hooks in Client Components. This should ideally be moved to ancestor Server Components.
    * Find instances where Server Actions (`"use server"`) are used primarily for *fetching* data rather than mutations. Data fetching should occur directly in Server Components.
    * Verify that data fetching in Server Components follows recommended patterns (e.g., direct `await` in async components).

3. **Server Actions:**
    * Review Server Actions (`"use server"` functions) to ensure they are primarily used for data *mutations* (create, update, delete).
    * Check if complex business logic resides within Server Actions; this logic should ideally be extracted into separate service functions (`@/server/services`) called by the action.

4. **Routing and Linking:**
    * Identify uses of imperative navigation (e.g., `router.push` from `useRouter`) in Client Components where a declarative `<Link>` component (`@/components/primitives/link-with-transition`) would be sufficient and preferred.

5. **State Management:**
    * Look for client-side state (`useState`, `useReducer`) used to store data fetched from the server. Consider if this state is necessary or if the data can be directly passed down from Server Components.

6. **Deprecated Patterns:**
    * Ensure there are no remnants of the `pages` router (e.g., `getServerSideProps`, `getStaticProps` functions, `_app.tsx`, `_document.tsx` files within `src/pages`).

**Output Format:**

For each identified deviation:

* **File:** Provide the full path to the file (e.g., `src/app/some/path/component.tsx`).
* **Line(s):** Specify the relevant line number(s).
* **Issue:** Briefly describe the deviation found (e.g., "Data fetching in useEffect", "Server component nested in client component", "Server action used for fetching").
* **Suggestion:** Recommend the appropriate refactoring approach based on App Router best practices (e.g., "Convert to Server Component and fetch data directly", "Pass Server Component as children prop", "Move data fetching to parent Server Component").

**Example Finding:**

* **File:** `src/app/some/client-page.tsx`
* **Line(s):** 25-35
* **Issue:** Data fetching performed in `useEffect` using a Server Action (`fetchDataAction`).
* **Suggestion:** Refactor the page to be a Server Component, remove `useEffect` and related state, and `await` the data fetching logic (potentially moved to a service function) directly within the component.
