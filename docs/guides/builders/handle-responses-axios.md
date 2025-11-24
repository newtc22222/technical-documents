# Handle Response with Axios on the FE Side (React examples)

## 1. Setting up `axios` (Best Practice)

First, you should create a custom `axios` instance so you don’t repeat the base URL everywhere and can easily add headers (like auth tokens) later.

**Create file `api/axiosConfig.js`:**

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api', // API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can add interceptors here for handling tokens or errors.
// Example: add token to every request
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

## 2. Handling CRUD Scenarios

Now in your React components, you import and use this `apiClient`.

### **a. Fetch brand list (GET `/api/brands`)**

* **Backend returns:** `200 OK` with an array of `BrandDTO`.
* **UI handling:** Use `response.data` and update state.

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
        setBrands(response.data); // Data is inside response.data
        setError(null);
      } catch (err) {
        setError('Unable to load brand list.');
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

---

### **b. Create a new brand (POST `/api/brands`)**

* **Backend returns:** `201 Created` with the created `BrandDTO`.
* **UI handling:** Send request data, then update state with the returned brand.

```javascript
const createNewBrand = async (brandData) => {
  try {
    // brandData example: { name: 'Asus', description: '...' }
    const response = await apiClient.post('/brands', brandData);

    // Add the new brand into the current list
    setBrands(prevBrands => [...prevBrands, response.data]);

    alert('Brand created successfully!');
  } catch (err) {
    // Handle validation errors from backend
    if (err.response && err.response.status === 400) {
      alert('Error: ' + err.response.data.message); // Assuming backend puts error inside "message"
    } else {
      alert('Something went wrong.');
    }
    console.error(err);
  }
};
```

---

### **c. Update brand (PUT `/api/brands/{id}`)**

* **Backend returns:** `200 OK` with updated `BrandDTO`.
* **UI handling:** Replace the old brand in state.

```javascript
const updateBrand = async (brandId, updatedData) => {
  try {
    const response = await apiClient.put(`/brands/${brandId}`, updatedData);

    setBrands(prevBrands =>
      prevBrands.map(brand =>
        brand.id === brandId ? response.data : brand
      )
    );

    alert('Updated successfully!');
  } catch (err) {
    alert('Update failed.');
    console.error(err);
  }
};
```

---

### **d. Delete brand (DELETE `/api/brands/{id}`)**

* **Backend returns:** `204 No Content`.
  Important: **`response.data` will be `undefined`**.
* **UI handling:** Check status code `204` and remove the brand from state.

```javascript
const deleteBrand = async (brandId) => {
  if (!window.confirm('Are you sure you want to delete this brand?')) {
    return;
  }

  try {
    const response = await apiClient.delete(`/brands/${brandId}`);

    if (response.status === 204) {
      setBrands(prevBrands => prevBrands.filter(brand => brand.id !== brandId));
      alert('Deleted successfully!');
    }
  } catch (err) {
    alert('Delete failed.');
    console.error(err);
  }
};
```
