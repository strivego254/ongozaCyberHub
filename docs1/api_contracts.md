# API Contracts

This document defines the API contracts for all services in the Ongoza CyberHub platform.

## Django API Contracts

### Base URL
`http://localhost:8000/api/v1`

### Authentication
All endpoints (except `/health/`) require JWT authentication:
```
Authorization: Bearer <token>
```

### Users API

#### GET /users/me/
Get current user profile.

**Response**: `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "user",
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Software developer",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### GET /users/
List all users (admin only).

**Query Parameters**:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20)

**Response**: `200 OK`
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/users/?page=2",
  "previous": null,
  "results": [...]
}
```

#### POST /users/
Create a new user.

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response**: `201 Created`
```json
{
  "id": 2,
  "email": "newuser@example.com",
  ...
}
```

### Organizations API

#### GET /organizations/
List organizations for current user.

**Response**: `200 OK`
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Acme Corp",
      "slug": "acme-corp",
      "description": "Technology company",
      "logo_url": "https://example.com/logo.png",
      "website": "https://acme.com",
      "owner": {...},
      "member_count": 10,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /organizations/
Create a new organization.

**Request Body**:
```json
{
  "name": "New Organization",
  "slug": "new-org",
  "description": "Organization description"
}
```

**Response**: `201 Created`

### Progress API

#### GET /progress/
List progress records for current user.

**Query Parameters**:
- `user`: Filter by user ID
- `content_type`: Filter by content type
- `status`: Filter by status
- `page`: Page number

**Response**: `200 OK`
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "user": 1,
      "content_id": "course-123",
      "content_type": "course",
      "status": "completed",
      "completion_percentage": 100,
      "score": 95.5,
      "started_at": "2024-01-01T00:00:00Z",
      "completed_at": "2024-01-15T00:00:00Z",
      "metadata": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T00:00:00Z"
    }
  ]
}
```

#### POST /progress/
Create a new progress record.

**Request Body**:
```json
{
  "content_id": "course-456",
  "content_type": "course",
  "status": "in_progress",
  "completion_percentage": 25
}
```

**Response**: `201 Created`

#### PATCH /progress/{id}/
Update a progress record.

**Request Body**:
```json
{
  "status": "completed",
  "completion_percentage": 100,
  "score": 98.0
}
```

**Response**: `200 OK`

## FastAPI AI Service Contracts

### Base URL
`http://localhost:8001/api/v1`

### Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <token>
```

### Recommendations API

#### POST /recommendations
Get personalized recommendations.

**Request Body**:
```json
{
  "user_id": 1,
  "content_type": "course",
  "limit": 10
}
```

**Response**: `200 OK`
```json
{
  "user_id": 1,
  "recommendations": [
    {
      "content_id": "course-789",
      "content_type": "course",
      "title": "Advanced Cybersecurity",
      "description": "Learn advanced security concepts",
      "score": 0.95,
      "reason": "Based on your progress in similar courses"
    }
  ],
  "total": 1
}
```

#### GET /recommendations/{user_id}
Get recommendations for a specific user.

**Query Parameters**:
- `content_type`: Filter by content type
- `limit`: Number of recommendations (default: 10)

**Response**: `200 OK`

### Embeddings API

#### POST /embeddings
Generate embeddings for texts.

**Request Body**:
```json
{
  "texts": [
    "Introduction to Cybersecurity",
    "Network Security Fundamentals"
  ]
}
```

**Response**: `200 OK`
```json
{
  "embeddings": [
    {
      "text": "Introduction to Cybersecurity",
      "embedding": [0.1, 0.2, 0.3, ...]
    }
  ],
  "model": "sentence-transformers/all-MiniLM-L6-v2",
  "dimension": 384
}
```

#### POST /embeddings/store
Generate and store embeddings.

**Request Body**:
```json
{
  "texts": ["Course content text"],
  "content_type": "course",
  "content_id": "course-123"
}
```

**Response**: `200 OK`
```json
{
  "status": "success",
  "stored_count": 1,
  "ids": ["1"]
}
```

### Personality Analysis API

#### POST /personality/analyze
Analyze user personality.

**Request Body**:
```json
{
  "user_id": 1,
  "progress_data": [...]
}
```

**Response**: `200 OK`
```json
{
  "user_id": 1,
  "traits": [
    {
      "name": "Learning Style",
      "score": 0.75,
      "description": "Prefers hands-on learning"
    },
    {
      "name": "Persistence",
      "score": 0.80,
      "description": "High completion rate"
    }
  ],
  "summary": "User shows strong learning engagement...",
  "recommendations": [
    "Focus on interactive content",
    "Provide progress milestones"
  ]
}
```

#### GET /personality/{user_id}
Get cached personality analysis.

**Response**: `200 OK` or `404 Not Found`

## Error Responses

All endpoints return errors in this format:

```json
{
  "detail": "Error message here"
}
```

**Status Codes**:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting (Future)

Rate limiting will be implemented:
- Django: 100 requests/minute per user
- FastAPI: 200 requests/minute per user

## Versioning

Current version: `v1`

Future versions will be available at `/api/v2/`, etc.

## OpenAPI Documentation

- Django: `http://localhost:8000/api/schema/swagger-ui/`
- FastAPI: `http://localhost:8001/docs`


