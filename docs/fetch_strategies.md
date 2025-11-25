# Data Fetching Strategies

## Overview

Next.js App Router supports multiple data fetching strategies. Choose the right one based on your use case.

## Strategy Comparison

| Strategy | When to Use | Data Freshness | SEO | Performance |
|----------|-------------|----------------|-----|-------------|
| **SSR** | Initial page load, auth required | Always fresh | ✅ Yes | Slower initial load |
| **CSR** | User interactions, real-time updates | Fresh on mount | ❌ No | Fast after initial load |
| **ISR** | Public content, infrequent updates | Cached, revalidated | ✅ Yes | Fast, cached |
| **SSG** | Static content, never changes | Build time | ✅ Yes | Fastest |

## Server-Side Rendering (SSR)

### Use Case
- Initial page load with user-specific data
- Data that requires authentication
- SEO-important content

### Example: Organizations Page

```typescript
// app/dashboard/organizations/page.tsx
async function getOrganizations(): Promise<Organization[]> {
  const headers = await getServerAuthHeaders();
  
  if (!headers.Authorization) {
    redirect('/login');
  }

  const response = await djangoClient.organizations.listOrganizations();
  return response.results || [];
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div>
      <h1>Organizations</h1>
      <OrganizationsClient initialOrganizations={organizations} />
    </div>
  );
}
```

### Benefits
- ✅ Data fetched server-side (faster initial render)
- ✅ SEO-friendly
- ✅ Authentication handled server-side
- ✅ No loading state needed for initial data

### Drawbacks
- ❌ Slower Time to First Byte (TTFB)
- ❌ Requires server for every request

## Client-Side Rendering (CSR)

### Use Case
- User interactions (clicks, form submissions)
- Real-time updates
- Data that changes frequently

### Example: Recommendations Widget

```typescript
// app/dashboard/recommendations/page.tsx
'use client';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        const data = await fastapiClient.recommendations.getRecommendations({
          user_id: user.id,
        });
        setRecommendations(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [user]);

  if (isLoading) return <LoadingSkeleton />;
  if (!recommendations) return <EmptyState />;

  return <RecommendationsList data={recommendations} />;
}
```

### Benefits
- ✅ Fast after initial load
- ✅ Good for interactive features
- ✅ Can show loading states
- ✅ No server required for updates

### Drawbacks
- ❌ Slower initial render (needs JavaScript)
- ❌ Not SEO-friendly
- ❌ Requires loading state handling

## Incremental Static Regeneration (ISR)

### Use Case
- Public content that updates infrequently
- Analytics dashboards
- Cached API responses

### Example: Analytics Page

```typescript
// app/dashboard/analytics/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

async function getAnalyticsData() {
  const headers = await getServerAuthHeaders();
  
  const [auditStats, organizations] = await Promise.all([
    djangoClient.audit.getAuditStats(),
    djangoClient.organizations.listOrganizations(),
  ]);

  return { auditStats, organizationCount: organizations.count };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return <AnalyticsClient initialData={data} />;
}
```

### Benefits
- ✅ Fast (served from cache)
- ✅ SEO-friendly
- ✅ Automatic revalidation
- ✅ Reduces server load

### Drawbacks
- ❌ Stale data until revalidation
- ❌ Requires revalidation strategy

## Hybrid Approach (SSR + CSR)

### Pattern: Server Fetch + Client Mutations

```typescript
// Server Component (SSR)
export default async function Page() {
  const data = await fetchInitialData(); // SSR
  return <ClientComponent initialData={data} />;
}

// Client Component (CSR)
'use client';
export function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData); // Hydrate from SSR
  
  const handleUpdate = async () => {
    // Client-side mutation
    const updated = await updateData();
    setData(updated); // Update client state
  };
  
  return (
    <div>
      <DataDisplay data={data} />
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}
```

### Example: Organizations Page

```typescript
// Server Component
export default async function OrganizationsPage() {
  const orgs = await getOrganizations(); // SSR
  return <OrganizationsClient initialOrganizations={orgs} />;
}

// Client Component
'use client';
export function OrganizationsClient({ initialOrganizations }) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  
  const createOrg = async (data) => {
    const newOrg = await djangoClient.organizations.createOrganization(data);
    setOrganizations([...organizations, newOrg]); // Optimistic update
  };
  
  return <OrganizationsList orgs={organizations} onCreate={createOrg} />;
}
```

## Error Boundary Patterns

### Server Component Error

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  try {
    const data = await fetchData();
    return <Dashboard data={data} />;
  } catch (error) {
    // Redirect or show error
    redirect('/error');
  }
}
```

### Client Component Error

```typescript
'use client';
export function DataComponent() {
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchData()
      .catch(err => setError(err.message));
  }, []);
  
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  
  return <DataDisplay />;
}
```

## Loading States

### SSR Loading

```typescript
// Next.js automatically shows loading.tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />;
}
```

### CSR Loading

```typescript
'use client';
export function Component() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchData().finally(() => setIsLoading(false));
  }, []);
  
  if (isLoading) return <LoadingSkeleton />;
  return <Content />;
}
```

## Caching Strategies

### No Cache (Always Fresh)

```typescript
export const revalidate = 0;

async function getData() {
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}
```

### Cache with Revalidation

```typescript
export const revalidate = 3600; // 1 hour

async function getData() {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  return res.json();
}
```

### Force Refresh

```typescript
async function getData() {
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}
```

## Best Practices

### 1. Use SSR for Initial Load

```typescript
// ✅ Good: SSR for initial data
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}
```

### 2. Use CSR for Mutations

```typescript
// ✅ Good: CSR for user actions
'use client';
const handleSubmit = async () => {
  await updateData();
};
```

### 3. Combine SSR + CSR

```typescript
// ✅ Good: SSR initial + CSR updates
export default async function Page() {
  const initial = await fetchData(); // SSR
  return <Component initial={initial} />; // CSR for updates
}
```

### 4. Handle Loading States

```typescript
// ✅ Good: Show loading state
if (isLoading) return <Skeleton />;
```

### 5. Handle Errors Gracefully

```typescript
// ✅ Good: Error handling
try {
  const data = await fetchData();
} catch (error) {
  return <ErrorDisplay error={error} />;
}
```

## Performance Tips

1. **Parallel Fetching** - Use `Promise.all()` for independent requests
2. **Streaming** - Use Suspense boundaries for progressive loading
3. **Caching** - Use ISR for public content
4. **Optimistic Updates** - Update UI before API confirms
5. **Debouncing** - Debounce search/filter inputs

## Example: Complete Page Pattern

```typescript
// Server Component (SSR)
export default async function DashboardPage() {
  const user = await getCurrentUser(); // SSR
  
  return (
    <div>
      <UserProfile user={user} />
      <OrganizationsSection />
      <RecommendationsSection />
    </div>
  );
}

// Organizations: SSR + CSR
async function OrganizationsSection() {
  const orgs = await getOrganizations(); // SSR
  return <OrganizationsClient initial={orgs} />; // CSR for mutations
}

// Recommendations: CSR (AI-powered, user-specific)
function RecommendationsSection() {
  return <RecommendationsWidget />; // Pure CSR
}
```

