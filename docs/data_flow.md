# Data Flow Documentation

## Overview

This document describes how data flows through the Ongoza CyberHub platform, including interactions between Django, FastAPI, and the frontend.

## User Registration Flow

```
Frontend → Django API → PostgreSQL (Relational)
```

1. User submits registration form in Frontend
2. Frontend sends POST request to `/api/v1/users/`
3. Django validates data and creates user
4. Django generates JWT token
5. Django returns user data and token
6. Frontend stores token in localStorage
7. Frontend redirects to dashboard

## User Login Flow

```
Frontend → Django API → PostgreSQL (Relational)
```

1. User submits login credentials
2. Frontend sends POST request to `/api/v1/token/` (JWT endpoint)
3. Django validates credentials
4. Django returns access and refresh tokens
5. Frontend stores tokens
6. Frontend makes authenticated requests with Bearer token

## Progress Tracking Flow

```
Frontend → Django API → PostgreSQL (Relational)
         ↓
    FastAPI AI (optional sync)
```

1. User completes a lesson/course
2. Frontend sends PATCH request to `/api/v1/progress/{id}/`
3. Django updates progress record
4. Django returns updated progress
5. (Optional) Django triggers FastAPI to update embeddings

## Recommendation Generation Flow

```
Frontend → FastAPI → Django API → PostgreSQL (Relational)
                    ↓
              FastAPI → Vector DB → Similarity Search
                    ↓
              FastAPI → Frontend
```

1. User requests recommendations
2. Frontend sends POST request to FastAPI `/api/v1/recommendations`
3. FastAPI receives user_id and content_type
4. FastAPI calls Django API: `GET /api/v1/progress/?user={user_id}`
5. Django returns user progress data
6. FastAPI analyzes progress and generates user profile embedding
7. FastAPI performs similarity search in vector database
8. FastAPI filters and ranks results
9. FastAPI returns recommendations to Frontend
10. Frontend displays recommendations

## Embedding Generation Flow

```
Frontend → FastAPI → Sentence Transformers
                    ↓
              Vector DB (PGVector)
```

1. Admin/content creator uploads new content
2. Frontend sends POST request to FastAPI `/api/v1/embeddings/store`
3. FastAPI receives text content
4. FastAPI generates embeddings using sentence transformers
5. FastAPI stores embeddings in vector database
6. FastAPI returns stored embedding IDs

## Personality Analysis Flow

```
Frontend → FastAPI → Django API → PostgreSQL (Relational)
                    ↓
              FastAPI → Analysis Engine
                    ↓
              FastAPI → Frontend
```

1. User requests personality analysis
2. Frontend sends POST request to FastAPI `/api/v1/personality/analyze`
3. FastAPI receives user_id and optional progress_data
4. If progress_data not provided, FastAPI calls Django API
5. FastAPI analyzes progress patterns:
   - Completion rates
   - Learning speed
   - Content preferences
   - Time spent patterns
6. FastAPI calculates personality traits
7. FastAPI generates summary and recommendations
8. FastAPI returns analysis to Frontend
9. Frontend displays personality insights

## Data Synchronization

### Django → FastAPI

**When**: Progress updates, new content creation

**How**:
- Django can make HTTP requests to FastAPI
- FastAPI endpoints accept data from Django
- JWT authentication for secure communication

**Example**:
```python
# In Django view
import httpx

async def sync_to_fastapi(progress_data):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.FASTAPI_BASE_URL}/api/v1/embeddings/store",
            json=progress_data,
            headers={"Authorization": f"Bearer {token}"}
        )
```

### FastAPI → Django

**When**: Recommendation generation, personality analysis

**How**:
- FastAPI uses `httpx` to call Django endpoints
- Standard REST API calls
- JWT token validation

**Example**:
```python
# In FastAPI service
async def get_user_progress(user_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.DJANGO_API_URL}/api/v1/progress/",
            params={"user": user_id},
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()
```

## Caching Strategy (Future)

### Recommended Caching Points:
1. **User Progress**: Cache in Redis (TTL: 5 minutes)
2. **Recommendations**: Cache per user (TTL: 1 hour)
3. **Personality Analysis**: Cache per user (TTL: 24 hours)
4. **Embeddings**: Cache frequently accessed embeddings

## Error Handling Flow

```
Request → Service → Error → Standardized Response
```

All services return errors in consistent format:
```json
{
  "detail": "Error message here"
}
```

**HTTP Status Codes**:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (server-side error)

## Data Consistency

### Eventual Consistency
- Vector database updates may lag behind relational updates
- Recommendations may not reflect latest progress immediately
- Cache invalidation ensures eventual consistency

### Strong Consistency (Critical Operations)
- User authentication (immediate)
- Progress updates (immediate)
- Payment transactions (immediate)

## Monitoring and Observability

### Logging
- All API requests logged
- Error logs with stack traces
- Performance metrics

### Metrics
- Request latency
- Error rates
- Database query performance
- Vector search performance

### Tracing
- Request IDs propagated across services
- Distributed tracing (to be implemented)


