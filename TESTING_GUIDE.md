# Testing Guide for Collaborators

This guide explains how to add tests for new endpoints and add test cases to existing test files in the OCH platform.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Adding Tests for New Endpoints](#adding-tests-for-new-endpoints)
3. [Adding Test Cases to Existing Tests](#adding-test-cases-to-existing-tests)
4. [Test Structure](#test-structure)
5. [Available Fixtures](#available-fixtures)
6. [Test Markers](#test-markers)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

## Quick Start

### Prerequisites

```bash
# Install dependencies
cd backend/django_app
pip install -r requirements.txt
```

### Run Tests

**Important:** Always activate the virtual environment first:

```bash
# Activate virtual environment
cd backend/django_app
source venv/bin/activate

# Run all tests
pytest

# Run specific test file
pytest tests/test_auth_endpoints.py

# Run tests by marker
pytest -m auth

# Run with coverage
pytest --cov=. --cov-report=html
```

**Note:** Don't run pytest on `conftest.py` directly - it's a configuration file. Run pytest on test files or the tests directory.

## Adding Tests for New Endpoints

When you add a new endpoint, follow these steps:

### Step 1: Create Test File

Create a new test file in `backend/django_app/tests/`:

```bash
touch backend/django_app/tests/test_<module>_endpoints.py
```

**Naming Convention:**
- Use `test_<module>_endpoints.py` format
- Example: `test_subscriptions_endpoints.py`, `test_mentorship_endpoints.py`

### Step 2: Write Test Structure

```python
"""
Test suite for <Module Name> endpoints.

Endpoints tested:
- GET /api/v1/<module>/endpoint1
- POST /api/v1/<module>/endpoint2
- PUT /api/v1/<module>/endpoint3/{id}
- DELETE /api/v1/<module>/endpoint4/{id}
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
@pytest.mark.<module>  # Use appropriate marker
class TestEndpoint1:
    """Test GET /api/v1/<module>/endpoint1"""

    def test_get_endpoint_success(self, authenticated_client):
        """Test successful GET request."""
        response = authenticated_client.get('/api/v1/<module>/endpoint1')
        assert response.status_code == status.HTTP_200_OK
        # Add assertions for response data

    def test_get_endpoint_unauthenticated(self, api_client):
        """Test GET request without authentication."""
        response = api_client.get('/api/v1/<module>/endpoint1')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.<module>
class TestEndpoint2:
    """Test POST /api/v1/<module>/endpoint2"""

    def test_create_success(self, authenticated_client):
        """Test successful creation."""
        data = {
            'field1': 'value1',
            'field2': 'value2'
        }
        response = authenticated_client.post(
            '/api/v1/<module>/endpoint2',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED
        # Add assertions for created object

    def test_create_invalid_data(self, authenticated_client):
        """Test creation with invalid data."""
        data = {}  # Missing required fields
        response = authenticated_client.post(
            '/api/v1/<module>/endpoint2',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_unauthenticated(self, api_client):
        """Test creation without authentication."""
        data = {'field1': 'value1'}
        response = api_client.post(
            '/api/v1/<module>/endpoint2',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
```

### Step 3: Add Marker to pytest.ini

If using a new marker, add it to `backend/django_app/pytest.ini`:

```ini
markers =
    auth: Authentication endpoint tests
    student: Student dashboard endpoint tests
    # ... existing markers ...
    <module>: <Module Name> endpoint tests  # Add your new marker
```

### Step 4: Update Architecture Documentation

Add your new test file to the test structure section in `docs1/architecture.md`:

```markdown
- `test_<module>_endpoints.py` - <Module Name> endpoints
```

## Adding Test Cases to Existing Tests

When adding test cases to existing test files:

### Step 1: Identify the Test Class

Find the appropriate test class for your endpoint:

```python
@pytest.mark.django_db
@pytest.mark.auth
class TestLoginEndpoint:
    """Test POST /api/v1/auth/login"""
    # Existing tests...
```

### Step 2: Add New Test Method

Add your test method following the naming convention:

```python
def test_<scenario>_<expected_result>(self, fixture_name):
    """Test description."""
    # Test implementation
    response = fixture_name.<method>('/api/v1/endpoint', data, format='json')
    assert response.status_code == expected_status
    # Additional assertions
```

**Naming Convention:**
- `test_<scenario>_<expected_result>`
- Examples:
  - `test_login_with_mfa_success`
  - `test_create_with_duplicate_email_fails`
  - `test_get_with_invalid_id_returns_404`

### Step 3: Test Categories to Cover

Always test these scenarios:

1. **Success Cases**
   - Valid request returns expected status (200, 201, etc.)
   - Response contains expected data
   - Data is correctly formatted

2. **Authentication**
   - Unauthenticated request returns 401
   - Invalid token returns 401
   - Expired token returns 401

3. **Authorization**
   - User without permission returns 403
   - Role-based access control works correctly

4. **Validation**
   - Missing required fields returns 400
   - Invalid data types returns 400
   - Invalid values returns 400
   - Empty data returns 400

5. **Edge Cases**
   - Invalid IDs (non-existent, wrong format)
   - Boundary values
   - Special characters in input
   - Very long strings
   - Empty strings where not allowed

6. **Error Handling**
   - 404 for non-existent resources
   - 500 for server errors (if applicable)
   - Proper error messages

## Test Structure

### File Structure

```
backend/django_app/tests/
├── __init__.py
├── conftest.py                    # Shared fixtures
├── test_auth_endpoints.py
├── test_student_dashboard_endpoints.py
├── test_coaching_endpoints.py
├── test_missions_endpoints.py
├── test_profiler_endpoints.py
├── test_admin_endpoints.py
├── test_health_endpoints.py
└── test_<your_module>_endpoints.py  # Your new test file
```

### Test Class Structure

```python
@pytest.mark.django_db                    # Required for database access
@pytest.mark.<marker>                     # Category marker
class TestEndpointName:
    """Test <HTTP Method> /api/v1/path/to/endpoint"""

    def test_success_case(self, fixture):
        """Test successful request."""
        pass

    def test_unauthenticated(self, api_client):
        """Test without authentication."""
        pass

    def test_invalid_data(self, authenticated_client):
        """Test with invalid data."""
        pass
```

## Available Fixtures

All fixtures are defined in `tests/conftest.py`:

### API Clients

- `api_client` - Unauthenticated API client
- `authenticated_client` - Authenticated with test user
- `admin_client` - Authenticated as admin user
- `student_client` - Authenticated as student user
- `mentor_client` - Authenticated as mentor user

### Users

- `test_user` - Standard test user (`test@example.com`)
- `admin_user` - Admin test user (`admin@test.com`)
- `student_user` - Student test user (`student@test.com`)
- `mentor_user` - Mentor test user (`mentor@test.com`)

### Roles

- `student_role` - Student role fixture
- `mentor_role` - Mentor role fixture
- `admin_role` - Admin role fixture

### Other

- `test_organization` - Test organization fixture
- `student_with_role` - Student user with student role assigned

### Using Fixtures

```python
def test_example(self, authenticated_client, test_user):
    """Example using authenticated client."""
    response = authenticated_client.get('/api/v1/endpoint')
    assert response.status_code == status.HTTP_200_OK
```

## Test Markers

Markers help organize and filter tests:

- `@pytest.mark.auth` - Authentication endpoints
- `@pytest.mark.student` - Student dashboard endpoints
- `@pytest.mark.coaching` - Coaching OS endpoints
- `@pytest.mark.missions` - Missions MXP endpoints
- `@pytest.mark.profiler` - Profiler Engine endpoints
- `@pytest.mark.admin` - Admin endpoints
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.slow` - Slow running tests

**Usage:**

```python
@pytest.mark.django_db
@pytest.mark.auth
class TestLoginEndpoint:
    pass
```

**Run by marker:**

```bash
pytest -m auth          # Run only auth tests
pytest -m "not slow"    # Run all except slow tests
```

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```python
# ✅ Good - Each test creates its own data
def test_create_user(self, authenticated_client):
    data = {'email': 'new@test.com', 'password': 'pass123'}
    response = authenticated_client.post('/api/v1/users', data, format='json')
    assert response.status_code == status.HTTP_201_CREATED

# ❌ Bad - Relies on previous test
def test_get_user(self, authenticated_client):
    # Assumes user was created in previous test
    response = authenticated_client.get('/api/v1/users/1')
    assert response.status_code == status.HTTP_200_OK
```

### 2. Descriptive Names

Use clear, descriptive test names:

```python
# ✅ Good
def test_login_with_invalid_password_returns_401(self, api_client):
    pass

# ❌ Bad
def test_login(self, api_client):
    pass
```

### 3. One Assertion Per Concept

Test one concept per test method:

```python
# ✅ Good - Tests authentication only
def test_get_endpoint_unauthenticated(self, api_client):
    response = api_client.get('/api/v1/endpoint')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

# ✅ Good - Tests data validation separately
def test_create_with_missing_fields(self, authenticated_client):
    data = {}
    response = authenticated_client.post('/api/v1/endpoint', data, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST
```

### 4. Use Appropriate Fixtures

Choose the right fixture for your test:

```python
# ✅ Good - Use admin_client for admin endpoints
def test_delete_user_as_admin(self, admin_client):
    response = admin_client.delete('/api/v1/users/1')
    assert response.status_code == status.HTTP_204_NO_CONTENT

# ✅ Good - Use student_client for student endpoints
def test_get_dashboard_as_student(self, student_client):
    response = student_client.get('/api/v1/student/dashboard')
    assert response.status_code == status.HTTP_200_OK
```

### 5. Test Both Success and Failure

Always test both success and failure scenarios:

```python
class TestCreateEndpoint:
    def test_create_success(self, authenticated_client):
        # Test successful creation
        pass

    def test_create_invalid_data(self, authenticated_client):
        # Test with invalid data
        pass

    def test_create_unauthenticated(self, api_client):
        # Test without authentication
        pass
```

### 6. Assert Response Data

Don't just check status codes, verify response data:

```python
# ✅ Good
def test_get_user(self, authenticated_client, test_user):
    response = authenticated_client.get(f'/api/v1/users/{test_user.id}')
    assert response.status_code == status.HTTP_200_OK
    assert response.data['email'] == test_user.email
    assert response.data['first_name'] == test_user.first_name

# ❌ Bad - Only checks status code
def test_get_user(self, authenticated_client):
    response = authenticated_client.get('/api/v1/users/1')
    assert response.status_code == status.HTTP_200_OK
```

## Examples

### Example 1: Adding Test for New GET Endpoint

```python
@pytest.mark.django_db
@pytest.mark.subscriptions
class TestSubscriptionStatusEndpoint:
    """Test GET /api/v1/subscription/status"""

    def test_get_status_success(self, student_client):
        """Test getting subscription status."""
        response = student_client.get('/api/v1/subscription/status')
        assert response.status_code == status.HTTP_200_OK
        assert 'plan' in response.data
        assert 'status' in response.data

    def test_get_status_unauthenticated(self, api_client):
        """Test getting status without authentication."""
        response = api_client.get('/api/v1/subscription/status')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_status_with_filters(self, student_client):
        """Test getting status with query parameters."""
        response = student_client.get('/api/v1/subscription/status?include_history=true')
        assert response.status_code == status.HTTP_200_OK
```

### Example 2: Adding Test for New POST Endpoint

```python
@pytest.mark.django_db
@pytest.mark.subscriptions
class TestUpgradeSubscriptionEndpoint:
    """Test POST /api/v1/subscription/upgrade"""

    def test_upgrade_success(self, student_client):
        """Test successful subscription upgrade."""
        data = {
            'plan_id': 'premium',
            'payment_method': 'stripe'
        }
        response = student_client.post(
            '/api/v1/subscription/upgrade',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['plan'] == 'premium'

    def test_upgrade_invalid_plan(self, student_client):
        """Test upgrade with invalid plan ID."""
        data = {'plan_id': 'invalid-plan'}
        response = student_client.post(
            '/api/v1/subscription/upgrade',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upgrade_unauthenticated(self, api_client):
        """Test upgrade without authentication."""
        data = {'plan_id': 'premium'}
        response = api_client.post(
            '/api/v1/subscription/upgrade',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upgrade_missing_fields(self, student_client):
        """Test upgrade with missing required fields."""
        data = {}
        response = student_client.post(
            '/api/v1/subscription/upgrade',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
```

### Example 3: Adding Test Case to Existing Test Class

```python
# In test_auth_endpoints.py, add to TestLoginEndpoint class:

def test_login_with_device_fingerprint(self, api_client, test_user):
    """Test login with device fingerprint."""
    data = {
        'email': test_user.email,
        'password': 'testpass123',
        'device_fingerprint': 'unique-device-123',
        'device_name': 'Test Device'
    }
    response = api_client.post('/api/v1/auth/login', data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert 'access_token' in response.data
    assert 'device_id' in response.data  # If device tracking is implemented

def test_login_with_invalid_device_fingerprint(self, api_client, test_user):
    """Test login with invalid device fingerprint format."""
    data = {
        'email': test_user.email,
        'password': 'testpass123',
        'device_fingerprint': ''  # Empty fingerprint
    }
    response = api_client.post('/api/v1/auth/login', data, format='json')
    # May accept empty or require valid format
    assert response.status_code in [
        status.HTTP_200_OK,
        status.HTTP_400_BAD_REQUEST
    ]
```

### Example 4: Testing RBAC Permissions

```python
@pytest.mark.django_db
@pytest.mark.admin
class TestDeleteUserEndpoint:
    """Test DELETE /api/v1/users/{id}"""

    def test_delete_user_as_admin(self, admin_client, test_user):
        """Test admin can delete user."""
        response = admin_client.delete(f'/api/v1/users/{test_user.id}')
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_user_as_student(self, student_client, test_user):
        """Test student cannot delete user."""
        response = student_client.delete(f'/api/v1/users/{test_user.id}')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_own_account(self, authenticated_client, test_user):
        """Test user can delete own account (if allowed)."""
        response = authenticated_client.delete(f'/api/v1/users/{test_user.id}')
        # May be allowed or forbidden depending on implementation
        assert response.status_code in [
            status.HTTP_204_NO_CONTENT,
            status.HTTP_403_FORBIDDEN
        ]
```

## Common Patterns

### Testing Pagination

```python
def test_list_with_pagination(self, authenticated_client):
    """Test list endpoint with pagination."""
    response = authenticated_client.get('/api/v1/items?page=1&page_size=10')
    assert response.status_code == status.HTTP_200_OK
    assert 'results' in response.data or 'items' in response.data
    assert 'count' in response.data or 'total' in response.data
```

### Testing Filtering

```python
def test_list_with_filters(self, authenticated_client):
    """Test list endpoint with filters."""
    response = authenticated_client.get('/api/v1/items?status=active&category=tech')
    assert response.status_code == status.HTTP_200_OK
    # Verify filtered results
```

### Testing File Uploads

```python
def test_upload_file(self, authenticated_client):
    """Test file upload endpoint."""
    from django.core.files.uploadedfile import SimpleUploadedFile
    file = SimpleUploadedFile("test.txt", b"file content")
    data = {'file': file, 'description': 'Test file'}
    response = authenticated_client.post('/api/v1/upload', data, format='multipart')
    assert response.status_code == status.HTTP_201_CREATED
```

### Testing Nested Resources

```python
def test_get_nested_resource(self, authenticated_client, test_user):
    """Test getting nested resource."""
    response = authenticated_client.get(f'/api/v1/users/{test_user.id}/posts')
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)
```

## Troubleshooting

### Common Issues

1. **Database not resetting between tests**
   - Ensure `@pytest.mark.django_db` decorator is present
   - Check that `pytest-django` is installed

2. **Fixtures not found**
   - Ensure fixtures are defined in `conftest.py`
   - Check fixture names match exactly

3. **Authentication failing**
   - Verify user is active: `user.is_active = True`
   - Check token is valid and not expired
   - Ensure correct fixture is used

4. **Tests interfering with each other**
   - Ensure tests are independent
   - Use fixtures to create fresh data for each test
   - Don't rely on test execution order

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-django Documentation](https://pytest-django.readthedocs.io/)
- [Django REST Framework Testing](https://www.django-rest-framework.org/api-guide/testing/)
- Architecture Documentation: `docs1/architecture.md`
- Test README: `backend/django_app/tests/README.md`

## Questions?

If you have questions about testing:
1. Check existing test files for examples
2. Review `tests/conftest.py` for available fixtures
3. Consult the architecture documentation
4. Ask in team discussions

---

**Remember:** Good tests are:
- ✅ Independent and isolated
- ✅ Fast and reliable
- ✅ Clear and descriptive
- ✅ Cover success and failure cases
- ✅ Test authentication, authorization, and validation

