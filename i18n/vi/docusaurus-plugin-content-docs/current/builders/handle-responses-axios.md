# Handle Response with Axios on FE Side (React examples)

## 1. Thiết lập `axios` (Best Practice)

Đầu tiên, bạn nên tạo một instance `axios` tùy chỉnh để không phải lặp lại base URL và có thể dễ dàng thêm các header (như token xác thực) sau này.

**Tạo file `api/axiosConfig.js`:**

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api', // Base URL của API
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bạn có thể thêm interceptor để xử lý token hoặc lỗi ở đây
// Ví dụ: Thêm token vào mỗi request
// apiClient.interceptors.request.use(config => {
//   const token = localStorage.getItem('authToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default apiClient;
```

---

## 2. Xử lý các trường hợp CRUD

Bây giờ, trong các component React của bạn, bạn sẽ import và sử dụng `apiClient` này.

### **a. Lấy danh sách thương hiệu (GET `/api/brands`)**

* **Backend trả về:** `200 OK` với một mảng các `BrandDTO`.
* **UI xử lý:** Lấy dữ liệu từ `response.data` và cập nhật state.

<!-- end list -->

```javascript
import React, { useState, useEffect } from 'react';
import apiClient from './api/axiosConfig';

function BrandList() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/brands');
        setBrands(response.data); // Dữ liệu nằm trong response.data
        setError(null);
      } catch (err) {
        setError('Không thể tải danh sách thương hiệu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <ul>
      {brands.map(brand => (
        <li key={brand.id}>{brand.name}</li>
      ))}
    </ul>
  );
}
```

### **b. Tạo mới thương hiệu (POST `/api/brands`)**

* **Backend trả về:** `201 Created` với `BrandDTO` vừa được tạo.
* **UI xử lý:** Gửi dữ liệu request, sau đó cập nhật state với dữ liệu trả về.

<!-- end list -->

```javascript
const createNewBrand = async (brandData) => {
  try {
    // brandData là một object, ví dụ: { name: 'Asus', description: '...' }
    const response = await apiClient.post('/brands', brandData);

    // Thêm thương hiệu mới vào danh sách hiện tại
    setBrands(prevBrands => [...prevBrands, response.data]);
    
    // Xử lý thành công (ví dụ: hiển thị thông báo)
    alert('Tạo thương hiệu thành công!');
  } catch (err) {
    // Xử lý lỗi validation từ server
    if (err.response && err.response.status === 400) {
      alert('Lỗi: ' + err.response.data.message); // Giả sử server trả về lỗi trong message
    } else {
      alert('Đã có lỗi xảy ra.');
    }
    console.error(err);
  }
};
```

### **c. Cập nhật thương hiệu (PUT `/api/brands/{id}`)**

* **Backend trả về:** `200 OK` với `BrandDTO` đã được cập nhật.
* **UI xử lý:** Tìm và thay thế thương hiệu trong state với dữ liệu mới.

<!-- end list -->

```javascript
const updateBrand = async (brandId, updatedData) => {
  try {
    const response = await apiClient.put(`/brands/${brandId}`, updatedData);
    
    // Cập nhật lại danh sách thương hiệu trong state
    setBrands(prevBrands => 
      prevBrands.map(brand => 
        brand.id === brandId ? response.data : brand
      )
    );
    
    alert('Cập nhật thành công!');
  } catch (err) {
    alert('Cập nhật thất bại.');
    console.error(err);
  }
};
```

### **d. Xóa thương hiệu (DELETE `/api/brands/{id}`)**

* **Backend trả về:** `204 No Content`. Đây là điểm quan trọng, **response sẽ không có body (`response.data` sẽ là `undefined`)**.
* **UI xử lý:** Kiểm tra `status code` là 204 và loại bỏ thương hiệu khỏi state.

<!-- end list -->

```javascript
const deleteBrand = async (brandId) => {
  // Hỏi người dùng để xác nhận
  if (!window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) {
    return;
  }

  try {
    const response = await apiClient.delete(`/brands/${brandId}`);

    // Kiểm tra status code là 204
    if (response.status === 204) {
      // Lọc bỏ thương hiệu đã xóa khỏi danh sách
      setBrands(prevBrands => prevBrands.filter(brand => brand.id !== brandId));
      alert('Xóa thành công!');
    }
  } catch (err) {
    alert('Xóa thất bại.');
    console.error(err);
  }
};
```