# Chiến lược Branching cho Dự án Laptech (Gitflow)

## 1. Giới thiệu về Gitflow

Gitflow là một mô hình quản lý branch phổ biến, giúp tổ chức quy trình phát triển phần mềm một cách hiệu quả và có hệ thống. Mô hình này định nghĩa các branch với vai trò cụ thể và cách chúng tương tác, hỗ trợ phát triển song song nhiều tính năng, chuẩn bị cho các bản phát hành (release), và xử lý các lỗi khẩn cấp (hotfix) một cách trơn tru.

Gitflow xoay quanh hai branch chính tồn tại vĩnh viễn và các branch hỗ trợ có vòng đời ngắn, đảm bảo sự ổn định và dễ dàng quản lý mã nguồn.

## 2. Các Branch Chính (Main Branches)

Hai branch chính là nền tảng của dự án, đảm bảo sự ổn định và tích hợp code.

### a. main (hoặc master)

**Mục đích**: Chứa mã nguồn đã được phát hành và đang chạy trên môi trường Production.

**Quy tắc**:

- Code trên branch `main` phải luôn ổn định và sẵn sàng triển khai.
- Không bao giờ commit trực tiếp lên `main`.
- Mỗi commit trên `main` đại diện cho một phiên bản phát hành mới và phải được đánh dấu bằng tag (ví dụ: `v1.0.0`, `v1.1.0`).

### b. develop

**Mục đích**: Là branch tích hợp chính, chứa mã nguồn mới nhất đã hoàn thành và sẵn sàng cho phiên bản phát hành tiếp theo.

**Quy tắc**:

- Tất cả các branch tính năng (`feature`) được tạo từ `develop`.
- Khi một tính năng hoàn thành, nó sẽ được merge trở lại `develop`.
- Code trên `develop` nên luôn ở trạng thái ổn định, đã qua kiểm thử đơn vị và tích hợp.

## 3. Các Branch Hỗ trợ (Supporting Branches)

Các branch hỗ trợ có vòng đời ngắn, được tạo ra để phục vụ các mục đích cụ thể trong quá trình phát triển.

### a. feature/* (Branch Tính năng)

**Mục đích**: Phát triển các tính năng mới cho dự án.

**Quy trình**:

- **Tạo từ**: `develop`.
- **Quy tắc đặt tên**: `feature/<tên-tính-năng>` (ví dụ: `feature/user-authentication`, `feature/add-product-to-cart`).
- **Merge về**: `develop` sau khi hoàn thành và được kiểm thử đầy đủ.
- **Ví dụ**:

  ```bash
  git checkout develop
  git checkout -b feature/add-wishlist
  ```

### b. release/* (Branch Phát hành)

**Mục đích**: Chuẩn bị cho một phiên bản phát hành mới, bao gồm sửa lỗi nhỏ, cập nhật phiên bản, và chuẩn bị tài liệu.

**Quy trình**:

- **Tạo từ**: `develop`.
- **Quy tắc đặt tên**: `release/<phiên-bản>` (ví dụ: `release/v1.2.0`).
- **Merge về**:
  - Merge vào `main` và đánh tag phiên bản mới (ví dụ: `v1.2.0`).
  - Merge trở lại `develop` để đồng bộ các bản sửa lỗi cuối cùng.
- **Lưu ý**: Chỉ thực hiện các sửa đổi nhỏ (bug fixes, tài liệu, hoặc metadata) trên branch này.

### c. hotfix/* (Branch Sửa lỗi nóng)

**Mục đích**: Xử lý nhanh các lỗi nghiêm trọng trên môi trường Production.

**Quy trình**:

- **Tạo từ**: `main`.
- **Quy tắc đặt tên**: `hotfix/<tên-lỗi>` (ví dụ: `hotfix/fix-payment-gateway-bug`).
- **Merge về**:
  - Merge vào `main` và đánh tag phiên bản sửa lỗi mới (ví dụ: `v1.1.1`).
  - Merge trở lại `develop` để đảm bảo bản vá lỗi được tích hợp vào mã phát triển.
- **Ví dụ**:

  ```bash
  git checkout main
  git checkout -b hotfix/critical-security-patch
  ```

## 4. Luồng làm việc Ví dụ

### Phát triển tính năng "Wishlist"

1. Tạo branch `feature/add-wishlist` từ `develop`.
2. Hoàn thành mã nguồn và các bài kiểm thử.
3. Merge `feature/add-wishlist` trở lại `develop` sau khi được review và kiểm thử.

### Chuẩn bị cho phiên bản `v2.0.0`

1. Tạo branch `release/v2.0.0` từ `develop`.
2. Thực hiện các chỉnh sửa cuối cùng (sửa lỗi nhỏ, cập nhật tài liệu).
3. Merge `release/v2.0.0` vào `main` và đánh tag `v2.0.0`.
4. Merge `release/v2.0.0` trở lại `develop`.

### Phát hiện lỗi nghiêm trọng trên Production (phiên bản `v2.0.0`)

1. Tạo branch `hotfix/critical-security-patch` từ `main`.
2. Sửa lỗi và kiểm thử.
3. Merge `hotfix/critical-security-patch` vào `main` và đánh tag `v2.0.1`.
4. Merge `hotfix/critical-security-patch` trở lại `develop`.

## 5. Best Practices

Để đảm bảo Gitflow được áp dụng hiệu quả trong dự án Laptech, dưới đây là một số best practice:

### a. Quản lý Branch

- **Giữ branch gọn nhẹ**: Xóa các branch `feature`, `release`, và `hotfix` sau khi merge để tránh lộn xộn trong kho lưu trữ.

  ```bash
  git branch -d feature/add-wishlist
  ```

- **Sử dụng Pull Request (PR)**: Mọi merge vào `develop` hoặc `main` nên được thực hiện thông qua PR, kèm theo code review để đảm bảo chất lượng mã nguồn.
- **Đồng bộ thường xuyên**: Đảm bảo `develop` và `main` được đồng bộ thường xuyên để tránh xung đột lâu dài.

### b. Commit và Kiểm thử

- **Viết commit message rõ ràng**: Sử dụng các thông điệp commit ngắn gọn, mô tả chính xác thay đổi (ví dụ: `Add user authentication endpoint`, `Fix payment gateway timeout error`).
- **Kiểm thử đầy đủ**: Mọi tính năng hoặc sửa lỗi phải đi kèm với các bài kiểm thử (unit test, integration test) trước khi merge.
- **Tự động hóa kiểm thử**: Sử dụng CI/CD pipeline để tự động chạy kiểm thử và kiểm tra chất lượng mã nguồn trước khi merge.

### c. Quản lý Phiên bản

- **Tuân thủ Semantic Versioning**: Sử dụng định dạng phiên bản `MAJOR.MINOR.PATCH` (ví dụ: `v1.2.3`) để đánh tag trên `main`.
- **Tài liệu hóa thay đổi**: Duy trì một tệp `CHANGELOG.md` để ghi lại các thay đổi trong mỗi phiên bản phát hành.
- **Đánh tag chính xác**: Đảm bảo mọi tag trên `main` tương ứng với một phiên bản phát hành hoặc sửa lỗi cụ thể.

### d. Giải quyết Xung đột

- **Xử lý xung đột sớm**: Nếu xảy ra xung đột khi merge, hãy giải quyết ngay trên branch liên quan và kiểm thử lại.
- **Rebase cẩn thận**: Nếu cần rebase branch `feature` để cập nhật từ `develop`, hãy thực hiện cẩn thận và thông báo cho team để tránh mất dữ liệu.

### e. Hợp tác trong Team

- **Phân chia công việc rõ ràng**: Mỗi developer chỉ làm việc trên branch `feature` của mình để tránh xung đột.
- **Giao tiếp thường xuyên**: Sử dụng công cụ như Slack hoặc Jira để thông báo về tiến độ merge hoặc các thay đổi quan trọng.
- **Đào tạo team**: Đảm bảo tất cả thành viên trong team hiểu rõ quy trình Gitflow và các best practice.

## 6. Kết luận

Bằng cách áp dụng mô hình Gitflow và tuân thủ các best practice trên, dự án Laptech sẽ có một quy trình phát triển rõ ràng, chuyên nghiệp, và dễ dàng quản lý. Điều này không chỉ giúp cải thiện chất lượng mã nguồn mà còn tăng cường khả năng hợp tác trong team và đảm bảo các bản phát hành ổn định.
