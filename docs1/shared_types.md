# Shared Types System

## Overview

TypeScript types in `/services/types/` mirror backend schemas (Django DRF serializers and FastAPI Pydantic models) to ensure type safety across the stack.

## Type Organization

```
services/types/
├── index.ts          # Central exports
├── user.ts           # User, Auth types (Django)
├── org.ts            # Organization types (Django)
├── progress.ts       # Progress types (Django)
└── recommendations.ts # AI/Recommendation types (FastAPI)
```

## Type Mapping

### Django → TypeScript

**Django Serializer:**
```python
# backend/django_app/users/serializers.py
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', ...]
```

**TypeScript Type:**
```typescript
// frontend/nextjs_app/services/types/user.ts
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  // ... match serializer fields exactly
}
```

### FastAPI → TypeScript

**Pydantic Model:**
```python
# backend/fastapi_app/schemas/recommendations.py
class RecommendationRequest(BaseModel):
    user_id: int
    content_type: Optional[str] = None
    limit: int = 10
```

**TypeScript Type:**
```typescript
// frontend/nextjs_app/services/types/recommendations.ts
export interface RecommendationRequest {
  user_id: number;
  content_type?: string;
  limit?: number;
}
```

## Keeping Types in Sync

### Manual Sync (Current Approach)

1. **Update backend schema**
2. **Update TypeScript type** to match
3. **Run type check**: `npm run type-check`

### Automated Sync (Future)

Options for future automation:
- Generate types from OpenAPI/Swagger schema
- Use code generation tools (e.g., `openapi-typescript`)
- Shared schema definitions (JSON Schema, Zod)

## Type Structure

### User Types (`user.ts`)

```typescript
// Core user data
export interface User {
  id: number;
  email: string;
  // ... all fields from UserSerializer
}

// Request/Response types
export interface SignupRequest {
  email: string;
  password?: string;
  // ...
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
```

### Organization Types (`org.ts`)

```typescript
export interface Organization {
  id: number;
  name: string;
  slug: string;
  org_type: 'sponsor' | 'employer' | 'partner';
  // ...
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  // ...
}
```

### Recommendation Types (`recommendations.ts`)

```typescript
export interface RecommendationRequest {
  user_id: number;
  content_type?: string;
  limit?: number;
}

export interface RecommendationResponse {
  user_id: number;
  recommendations: RecommendationItem[];
  total: number;
}
```

## Type Safety Benefits

### 1. Compile-Time Checks

```typescript
// ✅ Type-safe
const user: User = await djangoClient.auth.getCurrentUser();
console.log(user.email); // TypeScript knows this exists

// ❌ Type error
const user: User = await djangoClient.auth.getCurrentUser();
console.log(user.invalidField); // Error: Property doesn't exist
```

### 2. IntelliSense Support

IDEs provide autocomplete for all type properties:

```typescript
const org: Organization = await djangoClient.organizations.getOrganization('slug');
org. // IDE shows: name, slug, org_type, etc.
```

### 3. Refactoring Safety

When backend changes, TypeScript errors highlight all places that need updates.

## Type Patterns

### Optional Fields

Match backend nullable/optional fields:

```typescript
export interface User {
  id: number;
  email: string;
  bio?: string; // Optional (nullable in backend)
  avatar_url?: string; // Optional
}
```

### Enums

Use TypeScript union types for choices:

```typescript
export interface User {
  account_status: 'pending_verification' | 'active' | 'suspended' | 'deactivated' | 'erased';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}
```

### Nested Types

```typescript
export interface User {
  roles?: UserRole[]; // Array of nested type
}

export interface UserRole {
  role: string;
  scope: 'global' | 'org' | 'cohort' | 'track';
  scope_ref?: string;
}
```

### Date Strings

Backend returns ISO date strings:

```typescript
export interface User {
  created_at: string; // ISO 8601 date string
  updated_at: string;
}
```

## Runtime Validation (Optional)

Use Zod for runtime validation:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  // ...
});

// Validate at runtime
const user = UserSchema.parse(apiResponse);
```

## Updating Types Safely

### Step-by-Step Process

1. **Update backend schema** (Django serializer or FastAPI model)
2. **Update TypeScript type** to match
3. **Run type check**: `npm run type-check`
4. **Fix all TypeScript errors** in frontend code
5. **Test integration** - Ensure API calls work correctly

### Breaking Changes

When backend removes or renames fields:

1. Update TypeScript type
2. Find all usages (TypeScript will show errors)
3. Update components/hooks that use the field
4. Test thoroughly

## Type Exports

Central export file (`index.ts`):

```typescript
export * from './user';
export * from './org';
export * from './progress';
export * from './recommendations';
```

Usage:

```typescript
import type { User, Organization, RecommendationRequest } from '@/services/types';
```

## Best Practices

1. **Match backend exactly** - Field names, types, optionality
2. **Use descriptive names** - `User`, `CreateUserRequest`, not `U`, `CUR`
3. **Document complex types** - Add JSDoc comments
4. **Group related types** - Keep request/response types together
5. **Export from index** - Use central export file
6. **Validate at boundaries** - Use Zod for API responses if needed

## Example: Adding New Type

### 1. Backend Schema

```python
# Django serializer
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'duration']
```

### 2. TypeScript Type

```typescript
// services/types/course.ts
export interface Course {
  id: number;
  title: string;
  description: string;
  duration: number;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  duration: number;
}
```

### 3. Export

```typescript
// services/types/index.ts
export * from './course';
```

### 4. Use in Client

```typescript
// services/djangoClient.ts
export const djangoClient = {
  courses: {
    async getCourse(id: number): Promise<Course> {
      return apiGateway.get(`/courses/${id}`);
    },
    async createCourse(data: CreateCourseRequest): Promise<Course> {
      return apiGateway.post('/courses', data);
    },
  },
};
```

## Troubleshooting

### Type Mismatch Errors

**Error:** `Type 'string' is not assignable to type 'number'`

**Solution:** Check backend schema - field type may have changed

### Missing Properties

**Error:** `Property 'newField' does not exist on type 'User'`

**Solution:** Add field to TypeScript type to match backend

### Optional vs Required

**Error:** `Argument of type 'undefined' is not assignable`

**Solution:** Check if field is optional in backend, add `?` to TypeScript type

