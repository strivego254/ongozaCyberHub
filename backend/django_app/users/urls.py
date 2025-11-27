"""
URL configuration for users app - Authentication endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from .views.auth_views import (
    SignupView,
    LoginView,
    MagicLinkView,
    MFAEnrollView,
    MFAVerifyView,
    MFADisableView,
    RefreshTokenView,
    LogoutView,
    MeView,
    ConsentView,
)
from .views.password_reset_views import (
    PasswordResetRequestView,
    PasswordResetConfirmView,
)
from .views.sso_views import (
    SSOLoginView,
    google_sso_login,
    microsoft_sso_login,
    apple_sso_login,
    okta_sso_login,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Authentication endpoints
    path('auth/signup', SignupView.as_view(), name='signup'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/login/magic-link', MagicLinkView.as_view(), name='magic-link'),
    path('auth/mfa/enroll', MFAEnrollView.as_view(), name='mfa-enroll'),
    path('auth/mfa/verify', MFAVerifyView.as_view(), name='mfa-verify'),
    path('auth/mfa/disable', MFADisableView.as_view(), name='mfa-disable'),
    path('auth/token/refresh', RefreshTokenView.as_view(), name='token-refresh'),
    path('auth/logout', LogoutView.as_view(), name='logout'),
    path('auth/me', MeView.as_view(), name='me'),
    path('auth/consents', ConsentView.as_view(), name='consents'),
    path('auth/password/reset/request', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password/reset/confirm', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # SSO endpoints (generic and specific)
    path('auth/sso/<str:provider>', SSOLoginView.as_view(), name='sso-generic'),
    path('auth/sso/google', google_sso_login, name='sso-google'),
    path('auth/sso/microsoft', microsoft_sso_login, name='sso-microsoft'),
    path('auth/sso/apple', apple_sso_login, name='sso-apple'),
    path('auth/sso/okta', okta_sso_login, name='sso-okta'),
    
    # User management endpoints
    path('', include(router.urls)),
]
