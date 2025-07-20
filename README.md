# Product Catalog API

## Overview

This is a RESTful API for managing a product catalog, designed to support an e-commerce platform. The API allows users to perform CRUD operations on products, organize them into categories, search for products, track inventory, and apply pricing and discounts.

## Features

- User authentication and authorization (JWT-based)
- CRUD operations for products and categories
- Role-based access control (Admin/Customer)
- Search and filtering functionality
- Product variants (e.g., size, color)
- Inventory tracking
- Error handling and validation

## Technologies Used

- Node.js
- Express.js
- MongoDB (with Mongoose ORM)
- JSON for data exchange
- Postman for API testing
- JWT for authentication

## Installation

1. Clone this repository:

   ```sh
   git clone https://github.com/dazeez1/ProductCatalogAPI.git
   cd productCatalogAPI
   ```

2. Install dependencies: You can check package.json to see the list of dependencies to be installed.

   ```sh
   npm install
   ```

3. Set up a `.env` file for environment variables:

   ```sh
   MONGO_URI=mongodb_connection_string
   PORT=3000
   JWT_SECRET=jwt_secret_key
   ```

4. Start the server:
   ```sh
   npx nodemon server.js // This will make the server.js to auto restart
   ```
   The API will run on `http://127.0.0.1:3000`.

## API Endpoints

### 1. Authentication & User Management

- **Register a new user:**

  ```http
  POST http://localhost:3000/auth/register
  ```

  **Request Body:**

  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secertpassword",
    "role": "admin"
  }
  ```

- **Login user:**

  ```http
  POST http://localhost:3000/auth/login
  ```

  **Request Body:**

  ```json
  {
    "email": "john@example.com",
    "password": "secertpassword"
  }
  ```

- **Get all users (Admin Only):**
  ```http
  GET http://localhost:3000/users
  Authorization: Bearer <jwt-token>
  ```

### 2. Product Management

- **Create a product (Admin Only):**

  ```http
  POST http://localhost:3000/products
  Content-Type: application/json
  Authorization: Bearer <jwt-token>
  ```

  **Request Body:**

  ```json
  {
    "name": "Adidas Shoes",
    "description": "Some Adidas shoes Descriptions",
    "category": "Shoes",
    "price": 150,
    "stock": 50,
    "image": "null",
    "variants": [
      { "size": "M", "color": "Red", "quantity": 20 },
      { "size": "L", "color": "Blue", "quantity": 10 }
    ]
  }
  ```

- **Get all products:**

  ```http
  GET http://localhost:3000/products
  ```

  **Response Body:**

  ```json
  {
    "name": "Adidas Shoes",
    "description": "Some Adidas shoes Descriptions",
    "category": "Shoes",
    "price": 150,
    "stock": 50,
    "image": "null"
    "variants": [
        { "size": "M", "color": "Red", "quantity": 5 },
        { "size": "L", "color": "Blue", "quantity": 10 }
    ]
  }
  ```

- **Get a specific product:**

  ```http
  GET http://localhost:3000/products/:id
  ```

- **Update a product (Admin Only):**

  ```http
  PUT http://localhost:3000/products/:id
  Content-Type: application/json
  Authorization: Bearer <jwt-token>
  ```

- **Delete a product (Admin Only):**
  ```http
  DELETE http://localhost:3000/products/:id
  Authorization: Bearer <jwt-token>
  ```

### 3. Category Management

- **Create a category (Admin Only):**

  ```http
  POST http://localhost:3000/categories
  Content-Type: application/json
  Authorization: Bearer <jwt-token>
  ```

- **Get all categories:**

  ```http
  GET http://localhost:3000/categories
  ```

- **Get a specific category:**

  ```http
  GET http://localhost:3000/categories/:id
  ```

- **Update a category (Admin Only):**

  ```http
  PUT http://localhost:3000/categories/:id
  Authorization: Bearer <jwt-token>
  ```

- **Delete a category (Admin Only):**
  ```http
  DELETE http://localhost:3000/categories/:id
  Authorization: Bearer <jwt-token>
  ```

### 4. Search and Filtering

- **Search by name or description:**

  ```http
  GET http://localhost:3000/products?search=nike
  ```

- **Filter by price range:**

  ```http
  GET http://localhost:3000/products?minPrice=50&maxPrice=200
  ```

- **Filter by stock availability (admin):**
  ```http
  GET http://localhost:3000/products?inStock=true
  ```

## Error Handling

The API returns structured error messages. Example:

```json
{
  "error": "Validation failed",
  "error": "Product not found",
  "details": "Specific error details"
}
```

## Testing

- Use **Postman** or **cURL** for API testing
- e.g. cURL -X GET http://localhost:3000/categories,
- cURL -X GET http://localhost:3000/products
- npm test
