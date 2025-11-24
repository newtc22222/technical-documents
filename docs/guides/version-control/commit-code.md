# Professional Commit Guide

---

## 1. Golden Rule: Atomic Commits ⚛️

Each commit should represent a single, logical, complete change that works on its own. Avoid bundling unrelated changes into one commit.

**Example:**
Instead of a big commit:
`feat: Add Brand, Category and Product features`

Split into atomic commits:

* `feat(brand): Add Brand entity and repository`
* `feat(category): Add Category entity with self-referencing relationship`
* `feat(product): Add Product entity with relations to Brand and Category`
* `feat(product): Implement ProductService logic`
* `test(product): Add unit tests for ProductService`

**Benefits:**

* **Easier reviews:** Small focused changes are quicker to review.
* **Safer reverts:** Revert only the commit that caused the problem.
* **Clear history:** Makes the project timeline understandable.

---

## 2. Good Commit Message Structure: Conventional Commits 📝

This convention helps generate changelogs automatically and keeps git history consistent.

**Format:**
`<type>(<scope>): <subject>`

### a. **type (Change kind):**

* `feat` — new feature
* `fix` — bug fix
* `docs` — documentation
* `style` — formatting (whitespace, lint, no logic changes)
* `refactor` — code restructure, no new feature or bug fix
* `test` — tests added/changed
* `chore` — maintenance tasks (e.g. update .gitignore, build config)
* `build` — build system changes (e.g. pom.xml)

### b. **scope (Optional):**

Indicates affected module/area, e.g. `(product)`, `(user)`, `(order)`, `(security)`, `(config)`.

### c. **subject:**

* Use imperative present tense (“Add” not “Added” or “Adding”).
* Capitalize first letter.
* Keep it short (under ~50 characters).
* Don’t end with a period.

---

## 3. Suggested Workflow 🚀

1. **Create a branch:** Always start features/bugfixes on a separate branch. Name it clearly:

   * `feature/add-brand-crud`
   * `fix/login-authentication-bug`

2. **Work & commit often:** After each atomic change, `git add` and `git commit`. Don’t wait until the end.

3. **Write standardized commit messages:** Follow Conventional Commits.

4. **Open a Pull Request (PR):** Push branch and create PR for code review.

5. **Merge to main:** After approval, merge into `develop` or `main`.

---

## 4. Real-world Example (Laptech project)

Task: “Build CRUD for Brand”. A possible commit sequence:

* `feat(brand): Add Brand entity with JPA and Lombok setup`
* `feat(brand): Create BrandRepository interface`
* `feat(brand): Add DTO records and MapStruct mapper for Brand`
* `feat(brand): Implement BrandService with CRUD business logic`
* `feat(brand): Create BrandController with REST endpoints`
* `docs(brand): Add Swagger documentation for Brand APIs`
* `test(brand): Add unit tests for BrandServiceImpl`
* `test(brand): Add integration tests for BrandController`
* `refactor(common): Move SlugGenerator to common util package`
* `fix(brand): Correctly handle unique slug generation in BrandService`
