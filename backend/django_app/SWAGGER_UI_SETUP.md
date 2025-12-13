# Swagger UI Setup Guide

## Overview

Swagger UI is fully configured and ready to use for visualizing and interacting with the OCH Cyber Talent Engine API.

## Access Points

### Swagger UI (Interactive)
- **Primary**: http://localhost:8000/api/schema/swagger-ui/
- **Alternative**: http://localhost:8000/swagger/
- **Alternative**: http://localhost:8000/api-docs/

### ReDoc (Alternative Documentation)
- http://localhost:8000/api/schema/redoc/

### OpenAPI Schema (JSON)
- http://localhost:8000/api/schema/

## Features

### Authentication
Swagger UI supports JWT Bearer token authentication:
1. Click the **"Authorize"** button (🔒) at the top right
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Click **"Authorize"** to authenticate
4. All subsequent requests will include the token

### Getting a Token
1. Use the `/api/v1/auth/login/` endpoint in Swagger UI
2. Enter your credentials:
   ```json
   {
     "email": "your@email.com",
     "password": "yourpassword"
   }
   ```
3. Copy the `access_token` from the response
4. Use it in the Authorize dialog

## API Organization

Endpoints are organized by tags:
- **Authentication** - Login, signup, token management
- **Users** - User management and profiles
- **Programs** - Program, Track, and Cohort CRUD operations
- **Director Dashboard** - Director dashboard endpoints
- **Mentorship** - Mentorship coordination
- **Missions** - Mission submissions
- **Coaching** - Coaching and habits
- **Portfolio** - Portfolio management
- **Organizations** - Organization management
- **Progress** - Progress tracking
- **Subscriptions** - Billing and subscriptions

## Testing Endpoints

### Example: Create a Program
1. Navigate to **Programs** section
2. Find `POST /api/v1/programs/`
3. Click **"Try it out"**
4. Enter request body:
   ```json
   {
     "name": "Test Program",
     "category": "technical",
     "description": "Test description",
     "duration_months": 6,
     "default_price": 1000.00,
     "currency": "USD",
     "status": "active"
   }
   ```
5. Click **"Execute"**
6. View the response

### Example: Get Director Dashboard
1. Navigate to **Director Dashboard** section
2. Find `GET /api/v1/director/dashboard/summary/`
3. Click **"Try it out"**
4. Click **"Execute"**
5. View the cached dashboard data

## Configuration

Swagger UI is configured in `core/settings/base.py`:

```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'OCH Cyber Talent Engine API',
    'VERSION': '1.0.0',
    'SCHEMA_PATH_PREFIX': '/api/v1/',
    'TAGS': [...],
    'SECURITY': [{'type': 'http', 'scheme': 'bearer', 'bearerFormat': 'JWT'}],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'tryItOutEnabled': True,
        ...
    },
}
```

## Troubleshooting

### Schema Validation Errors
Some views may show warnings in schema generation. These are non-critical and don't prevent Swagger UI from working. To fix:
- Add `@extend_schema` decorators to custom views
- Add serializer classes to ViewSets
- Use `@extend_schema_field` for custom serializer methods

### Authentication Issues
- Ensure token is in format: `Bearer <token>` (include "Bearer" prefix)
- Check token hasn't expired (default: 60 minutes)
- Verify user has proper permissions

### CORS Issues
If accessing from frontend, ensure CORS is configured in `CORS_ALLOWED_ORIGINS`.

## Exporting Schema

Export OpenAPI schema to file:
```bash
python manage.py spectacular --file schema.yaml --format openapi
python manage.py spectacular --file schema.json --format openapi-json
```

## Best Practices

1. **Always authenticate** before testing protected endpoints
2. **Use Try it out** to test endpoints interactively
3. **Check response examples** to understand data structures
4. **Review error responses** to understand failure cases
5. **Use filters** to find endpoints quickly

## Next Steps

1. Access Swagger UI at http://localhost:8000/api/schema/swagger-ui/
2. Authenticate using your credentials
3. Explore endpoints by tag
4. Test CRUD operations for Programs, Tracks, and Cohorts
5. Use Director Dashboard endpoints to view analytics








