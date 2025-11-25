# Base Schema Definitions

This document defines the base schemas shared across Django (DRF) and FastAPI (Pydantic) services.

## User Schema

### UserBase
```json
{
  "email": "string (email, required)",
  "username": "string (max 150, required)",
  "first_name": "string (max 150, required)",
  "last_name": "string (max 150, required)",
  "bio": "string (optional)",
  "avatar_url": "string (URL, optional)"
}
```

### UserResponse
```json
{
  "id": "integer (required)",
  "email": "string (email, required)",
  "username": "string (required)",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "bio": "string (nullable)",
  "avatar_url": "string (URL, nullable)",
  "is_active": "boolean (required)",
  "created_at": "datetime (ISO 8601, required)",
  "updated_at": "datetime (ISO 8601, required)"
}
```

## Organization Schema

### OrganizationBase
```json
{
  "name": "string (max 255, required)",
  "slug": "string (slug, required, unique)",
  "description": "string (optional)",
  "logo_url": "string (URL, optional)",
  "website": "string (URL, optional)"
}
```

### OrganizationResponse
```json
{
  "id": "integer (required)",
  "name": "string (required)",
  "slug": "string (required)",
  "description": "string (nullable)",
  "logo_url": "string (URL, nullable)",
  "website": "string (URL, nullable)",
  "owner_id": "integer (required)",
  "is_active": "boolean (required)",
  "created_at": "datetime (ISO 8601, required)",
  "updated_at": "datetime (ISO 8601, required)"
}
```

## Progress Schema

### ProgressBase
```json
{
  "content_id": "string (max 255, required)",
  "content_type": "string (max 100, required)",
  "status": "enum: 'not_started' | 'in_progress' | 'completed' | 'paused' (required)",
  "completion_percentage": "integer (0-100, default: 0)",
  "score": "float (nullable)",
  "metadata": "object (default: {})"
}
```

### ProgressResponse
```json
{
  "id": "integer (required)",
  "user_id": "integer (required)",
  "content_id": "string (required)",
  "content_type": "string (required)",
  "status": "string (required)",
  "completion_percentage": "integer (required)",
  "score": "float (nullable)",
  "started_at": "datetime (ISO 8601, nullable)",
  "completed_at": "datetime (ISO 8601, nullable)",
  "metadata": "object (required)",
  "created_at": "datetime (ISO 8601, required)",
  "updated_at": "datetime (ISO 8601, required)"
}
```

## Schema Synchronization

Both Django and FastAPI services must maintain these schemas in sync:

- **Django**: `backend/django_app/shared_schemas/` (DRF Serializers)
- **FastAPI**: `backend/fastapi_app/schemas/` (Pydantic Models)

When updating schemas:
1. Update the base definition in this document
2. Update Django serializers
3. Update FastAPI Pydantic models
4. Regenerate OpenAPI schemas
5. Update API contract documentation


