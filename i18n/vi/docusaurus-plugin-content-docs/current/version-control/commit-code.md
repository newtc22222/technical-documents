# Hướng dẫn Tạo Commit Chuyên nghiệp

## 1. Nguyên tắc Vàng: "Atomic Commits" (Commit Nguyên tử) ⚛️

Mỗi commit nên đại diện cho một thay đổi logic duy nhất, hoàn chỉnh và có thể hoạt động được. Tránh gộp nhiều thay đổi không liên quan vào một commit.

**Ví dụ:**
Thay vì commit lớn:  
`feat: Add Brand, Category and Product features`

Hãy chia nhỏ thành các commit "nguyên tử":

- `feat(brand): Add Brand entity and repository`
- `feat(category): Add Category entity with self-referencing relationship`
- `feat(product): Add Product entity with relations to Brand and Category`
- `feat(product): Implement ProductService logic`
- `test(product): Add unit tests for ProductService`

**Lợi ích:**

- **Dễ dàng xem lại (Review):** Dễ kiểm tra thay đổi nhỏ và cụ thể.
- **Dễ dàng hoàn tác (Revert):** Chỉ cần hoàn tác commit gây lỗi mà không ảnh hưởng chức năng khác.
- **Lịch sử rõ ràng:** Giúp hiểu rõ quá trình phát triển.

## 2. Cấu trúc một Commit Message Tốt: "Conventional Commits" 📝

Quy chuẩn này giúp tự động tạo changelog và giữ lịch sử Git nhất quán.

**Cấu trúc:**  
`<type>(<scope>): <subject>`

### a. **type (Loại thay đổi):**

- `feat`: Tính năng mới (feature).
- `fix`: Sửa lỗi (bug fix).
- `docs`: Thay đổi tài liệu (documentation).
- `style`: Định dạng code (formatting, white-space...), không ảnh hưởng logic.
- `refactor`: Tái cấu trúc code, không thêm tính năng hay sửa lỗi.
- `test`: Thêm/sửa bài kiểm thử (test case).
- `chore`: Công việc vặt (ví dụ: cập nhật .gitignore, cấu hình build).
- `build`: Thay đổi hệ thống build (ví dụ: pom.xml).

### b. **scope (Phạm vi - Tùy chọn):**

Chỉ định module/feature bị ảnh hưởng, ví dụ: `(product)`, `(user)`, `(order)`, `(security)`, `(config)`.

### c. **subject (Tiêu đề):**

- Viết ở thì hiện tại, dạng mệnh lệnh (ví dụ: "Add" thay vì "Added" hay "Adding").
- Viết hoa chữ cái đầu.
- Ngắn gọn (dưới 50 ký tự).
- Không có dấu chấm cuối.

## 3. Luồng làm việc Đề xuất (Suggested Workflow) 🚀

1. **Tạo Branch mới:** Luôn bắt đầu tính năng/sửa lỗi trên branch riêng. Đặt tên rõ ràng:
    - `feature/add-brand-crud`
    - `fix/login-authentication-bug`

2. **Làm việc và Commit thường xuyên:** Sau mỗi thay đổi "nguyên tử", thực hiện `git add` và `git commit` ngay. Không đợi đến cuối ngày.

3. **Viết Commit Message theo Chuẩn:** Tuân thủ cấu trúc Conventional Commits.

4. **Tạo Pull Request (hoặc Merge Request):** Đẩy branch lên và tạo Pull Request để review code.

5. **Merge vào Branch chính:** Sau khi được duyệt, merge vào branch chính (`develop` hoặc `main`).

## 4. Ví dụ Thực tế cho Dự án Laptech

Nhiệm vụ: "Xây dựng các chức năng CRUD cho Brand". Chuỗi commit có thể như sau:

- `feat(brand): Add Brand entity with JPA and Lombok setup`
- `feat(brand): Create BrandRepository interface`
- `feat(brand): Add DTO records and MapStruct mapper for Brand`
- `feat(brand): Implement BrandService with CRUD business logic`
- `feat(brand): Create BrandController with REST endpoints`
- `docs(brand): Add Swagger documentation for Brand APIs`
- `test(brand): Add unit tests for BrandServiceImpl`
- `test(brand): Add integration tests for BrandController`
- `refactor(common): Move SlugGenerator to common util package`
- `fix(brand): Correctly handle unique slug generation in BrandService`
