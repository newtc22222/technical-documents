---
id: introduction
title: Giới thiệu về Module Xác thực
sidebar_position: 1
sidebar_label: Flashcard Learning - Nền tảng Giáo dục
description: Tổng quan về module xác thực trong Flashcard Learning.
---

Module Xác thực là một phần của Laptech API, một dịch vụ backend dựa trên Spring Boot. Module này xử lý đăng ký người dùng, đăng nhập, xác thực dựa trên JWT, refresh token và quản lý phiên làm việc. Module đảm bảo truy cập an toàn vào API bằng cách sử dụng access token và cookie HttpOnly cho refresh token.

## Tính năng chính

- Đăng ký người dùng với xác thực dữ liệu.
- Đăng nhập với JWT access token.
- Xoay vòng và thu hồi refresh token.
- Tích hợp kiểm soát truy cập theo vai trò (RBAC).
- Lưu trữ an toàn refresh token trong cơ sở dữ liệu.

Tài liệu này bao gồm thiết lập, kiến trúc, chi tiết API, ví dụ, xử lý sự cố và các đề xuất cải tiến.
