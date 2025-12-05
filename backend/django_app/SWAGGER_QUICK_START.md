# Swagger UI - Quick Start Guide

## 🚀 Access Swagger UI

Once your Django server is running, access Swagger UI at:

**http://localhost:8000/api/schema/swagger-ui/**

Alternative URLs:
- http://localhost:8000/swagger/
- http://localhost:8000/api-docs/

## 🔐 Authentication

1. **Get a JWT Token**:
   - Use `POST /api/v1/auth/login` or `POST /api/v1/auth/login/` endpoint (both work)
   - Enter credentials:
     ```json
     {
       "email": "director@example.com",
       "password": "yourpassword"
     }
     ```
   - Copy the `access_token` from response

2. **Authorize in Swagger UI**:
   - Click the **🔒 Authorize** button (top right)
   - Enter: `Bearer <your-access-token>`
   - Click **Authorize**
   - Click **Close**

## 📋 Testing Director Endpoints

### 1. Get Dashboard Summary
- Navigate to **Director Dashboard** tag
- Find `GET /api/v1/director/dashboard/summary/`
- Click **Try it out** → **Execute**
- View cached dashboard metrics

### 2. List Cohorts
- Find `GET /api/v1/director/dashboard/cohorts/`
- Click **Try it out**
- Optionally add query params: `?page=1&page_size=20&status=active`
- Click **Execute**

### 3. Get Cohort Detail
- Find `GET /api/v1/director/dashboard/cohorts/{cohort_id}/`
- Click **Try it out**
- Enter a cohort UUID
- Click **Execute**

### 4. Create Program
- Navigate to **Programs** tag
- Find `POST /api/v1/programs/`
- Click **Try it out**
- Enter program data:
  ```json
  {
    "name": "Cybersecurity Fundamentals",
    "category": "technical",
    "description": "Learn cybersecurity basics",
    "duration_months": 6,
    "default_price": 1000.00,
    "currency": "USD",
    "status": "active"
  }
  ```
- Click **Execute**

### 5. Read Program
- Find `GET /api/v1/programs/{id}/`
- Click **Try it out**
- Enter program UUID
- Click **Execute**

### 6. Update Program
- Find `PATCH /api/v1/programs/{id}/`
- Click **Try it out**
- Enter program UUID and updated fields:
  ```json
  {
    "name": "Updated Program Name"
  }
  ```
- Click **Execute**

### 7. Delete Program
- Find `DELETE /api/v1/programs/{id}/`
- Click **Try it out**
- Enter program UUID
- Click **Execute**

## 🎯 Key Features

- **Interactive Testing**: Try endpoints directly from the browser
- **Request/Response Examples**: See data structures
- **Authentication**: JWT Bearer token support
- **Filtering**: Search endpoints by tag or name
- **Schema Export**: Download OpenAPI schema

## 📊 API Organization

Endpoints are organized by tags:
- **Authentication** - Login, tokens, signup
- **Programs** - CRUD operations
- **Director Dashboard** - Analytics and metrics
- **Mentorship** - Mentor coordination
- **Missions** - Mission management
- **Coaching** - Habits and goals
- **Users** - User management

## 💡 Tips

1. **Always authenticate first** - Most endpoints require JWT tokens
2. **Check response codes** - 200 = success, 400 = bad request, 401 = unauthorized, 404 = not found
3. **Use filters** - Type in the search box to find endpoints quickly
4. **Review schemas** - Click on models to see data structures
5. **Try different methods** - GET, POST, PATCH, DELETE are all supported

## 🔧 Troubleshooting

**Can't see endpoints?**
- Ensure you're authenticated
- Check server is running on port 8000
- Verify URL is correct

**401 Unauthorized?**
- Token may have expired (default: 60 minutes)
- Re-authenticate to get a new token
- Ensure token format is: `Bearer <token>`

**404 Not Found?**
- Check the endpoint URL
- Verify the resource ID exists
- Check user permissions

## 📝 Export Schema

Export OpenAPI schema for external tools:
```bash
python manage.py spectacular --file schema.yaml --format openapi
python manage.py spectacular --file schema.json --format openapi-json
```

