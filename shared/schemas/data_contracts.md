# Data Contracts

This document defines the data contracts and API communication patterns between Django and FastAPI services.

## Service Communication

### Django → FastAPI

Django makes HTTP requests to FastAPI for:
- Recommendation generation
- Embedding generation
- Personality analysis

**Authentication**: JWT tokens (shared secret)

**Base URL**: `FASTAPI_BASE_URL` (default: `http://localhost:8001`)

### FastAPI → Django

FastAPI makes HTTP requests to Django for:
- User data retrieval
- Progress data retrieval
- Organization data retrieval

**Authentication**: JWT tokens (shared secret)

**Base URL**: `DJANGO_API_URL` (default: `http://localhost:8000`)

## API Contracts

### Recommendation Request (FastAPI)

**Endpoint**: `POST /api/v1/recommendations`

**Request Body**:
```json
{
  "user_id": 1,
  "content_type": "course",
  "limit": 10
}
```

**Response**:
```json
{
  "user_id": 1,
  "recommendations": [
    {
      "content_id": "course-123",
      "content_type": "course",
      "title": "Introduction to Cybersecurity",
      "description": "Learn the basics...",
      "score": 0.95,
      "reason": "Based on your progress in similar courses"
    }
  ],
  "total": 1
}
```

### Embedding Request (FastAPI)

**Endpoint**: `POST /api/v1/embeddings`

**Request Body**:
```json
{
  "texts": [
    "Introduction to Cybersecurity",
    "Advanced Network Security"
  ]
}
```

**Response**:
```json
{
  "embeddings": [
    {
      "text": "Introduction to Cybersecurity",
      "embedding": [0.1, 0.2, ...]
    }
  ],
  "model": "sentence-transformers/all-MiniLM-L6-v2",
  "dimension": 384
}
```

### Personality Analysis Request (FastAPI)

**Endpoint**: `POST /api/v1/personality/analyze`

**Request Body**:
```json
{
  "user_id": 1,
  "progress_data": [
    {
      "id": 1,
      "user_id": 1,
      "content_id": "course-123",
      "content_type": "course",
      "status": "completed",
      "completion_percentage": 100,
      "score": 95.5,
      "metadata": {}
    }
  ]
}
```

**Response**:
```json
{
  "user_id": 1,
  "traits": [
    {
      "name": "Learning Style",
      "score": 0.75,
      "description": "Prefers hands-on learning"
    }
  ],
  "summary": "User shows strong learning engagement...",
  "recommendations": [
    "Focus on interactive content",
    "Provide progress milestones"
  ]
}
```

### User Progress Request (Django → FastAPI)

**Endpoint**: `GET /api/v1/progress/`

**Query Parameters**:
- `user`: User ID (required)

**Response**:
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 1,
      "content_id": "course-123",
      "content_type": "course",
      "status": "completed",
      "completion_percentage": 100,
      "score": 95.5,
      "metadata": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Error Responses

All services return errors in the following format:

```json
{
  "detail": "Error message here"
}
```

**HTTP Status Codes**:
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Schema Validation

Both services validate incoming requests against their respective schemas:
- Django: DRF Serializers
- FastAPI: Pydantic Models

Validation errors return `400 Bad Request` with details about the validation failure.


