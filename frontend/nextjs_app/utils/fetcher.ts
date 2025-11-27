/**
 * Unified fetch utility with error handling and token management
 */

export interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Get auth token from cookies (for SSR) or localStorage (for CSR)
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    // SSR: Token should be passed via headers from server
    return null;
  }
  // CSR: Try localStorage first (most reliable), then cookie
  const token = localStorage.getItem('access_token');
  if (token) {
    return token;
  }
  
  // Fallback to cookie (if set by server)
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('access_token='));
  if (tokenCookie) {
    const tokenValue = tokenCookie.split('=')[1];
    // Also store in localStorage for consistency
    if (tokenValue) {
      localStorage.setItem('access_token', tokenValue);
    }
    return tokenValue;
  }
  
  return null;
}

/**
 * Unified fetch wrapper with error handling
 */
export async function fetcher<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, skipAuth = false, ...fetchOptions } = options;

  // Build URL with query params
  const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
  }

  // Set headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(urlObj.toString(), {
      ...fetchOptions,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = isJson ? await response.json().catch(() => null) : null;
      throw new ApiError(
        response.status,
        response.statusText,
        errorData,
        errorData?.detail || errorData?.message || `HTTP ${response.status}`
      );
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as T;
    }

    return isJson ? await response.json() : await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other errors
    throw new ApiError(
      0,
      'Network Error',
      null,
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

/**
 * GET request helper
 */
export function get<T>(url: string, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export function post<T>(url: string, data?: any, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export function put<T>(url: string, data?: any, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export function patch<T>(url: string, data?: any, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function del<T>(url: string, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'DELETE' });
}

