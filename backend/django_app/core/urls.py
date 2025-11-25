"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
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
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # OIDC Discovery Endpoints
    path('.well-known/openid-configuration', openid_configuration, name='openid-configuration'),
    path('.well-known/jwks.json', jwks, name='jwks'),
    
    # OAuth2/OIDC Endpoints
    path('api/v1/oauth/authorize', oauth_authorize, name='oauth-authorize'),
    path('api/v1/oauth/token', oauth_token, name='oauth-token'),
    path('api/v1/oauth/userinfo', oauth_userinfo, name='oauth-userinfo'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Versioning
    path('api/v1/', include('api.urls')),
]


