"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from users.views.oidc_views import (
    openid_configuration,
    jwks,
    oauth_authorize,
    oauth_token,
    oauth_userinfo,
    oauth_introspect,
)
from core.settings.metrics import metrics_view


def health_check(request):
    """Simple health check endpoint for Docker."""
    return HttpResponse("OK", status=200)


urlpatterns = [
    path('health/', health_check, name='health-check-root'),
    path('admin/', admin.site.urls),
    
    # OIDC Discovery Endpoints
    path('.well-known/openid-configuration', openid_configuration, name='openid-configuration'),
    path('.well-known/jwks.json', jwks, name='jwks'),
    path('api/v1/.well-known/jwks.json', jwks, name='jwks-api'),
    
    # OAuth2/OIDC Endpoints
    path('api/v1/oauth/authorize', oauth_authorize, name='oauth-authorize'),
    path('api/v1/oauth/token', oauth_token, name='oauth-token'),
    path('api/v1/oauth/userinfo', oauth_userinfo, name='oauth-userinfo'),
    path('api/v1/oauth/introspect', oauth_introspect, name='oauth-introspect'),
    
    # API Documentation (Swagger UI)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Alternative paths for easier access
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-alt'),
    path('api-docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='api-docs'),
    
    # Prometheus Metrics
    path('metrics', metrics_view, name='metrics'),
    
    # API Versioning
    path('api/v1/', include('api.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


