"""
OIDC discovery and OAuth2 endpoints.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.urls import reverse


@api_view(['GET'])
@permission_classes([AllowAny])
def openid_configuration(request):
    """
    GET /.well-known/openid-configuration
    OIDC discovery endpoint.
    """
    base_url = request.build_absolute_uri('/').rstrip('/')
    
    return Response({
        'issuer': settings.SIMPLE_JWT.get('ISSUER', base_url),
        'authorization_endpoint': f"{base_url}/api/v1/oauth/authorize",
        'token_endpoint': f"{base_url}/api/v1/oauth/token",
        'userinfo_endpoint': f"{base_url}/api/v1/oauth/userinfo",
        'jwks_uri': f"{base_url}/api/v1/.well-known/jwks.json",
        'response_types_supported': ['code', 'id_token', 'token'],
        'subject_types_supported': ['public'],
        'id_token_signing_alg_values_supported': ['RS256', 'HS256'],
        'scopes_supported': ['openid', 'profile', 'email', 'offline_access'],
        'token_endpoint_auth_methods_supported': ['client_secret_basic', 'client_secret_post'],
        'claims_supported': [
            'sub',
            'iss',
            'aud',
            'exp',
            'iat',
            'auth_time',
            'nonce',
            'acr',
            'amr',
            'azp',
            'at_hash',
            'c_hash',
            'email',
            'email_verified',
            'name',
            'given_name',
            'family_name',
            'preferred_username',
        ],
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def jwks(request):
    """
    GET /.well-known/jwks.json
    JSON Web Key Set for token verification.
    """
    # TODO: Implement JWKS endpoint with public keys
    # For now, return empty set (using HS256 symmetric key)
    return Response({
        'keys': []
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def oauth_authorize(request):
    """
    POST /api/v1/oauth/authorize
    OAuth2 authorization endpoint (Authorization Code flow).
    """
    # TODO: Implement OAuth2 authorization code flow
    return Response({
        'detail': 'OAuth2 authorization endpoint not yet implemented'
    }, status=501)


@api_view(['POST'])
@permission_classes([AllowAny])
def oauth_token(request):
    """
    POST /api/v1/oauth/token
    OAuth2 token endpoint (Authorization Code, Client Credentials).
    """
    # TODO: Implement OAuth2 token endpoint
    return Response({
        'detail': 'OAuth2 token endpoint not yet implemented'
    }, status=501)


@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_userinfo(request):
    """
    GET /api/v1/oauth/userinfo
    OIDC userinfo endpoint.
    """
    # TODO: Implement OIDC userinfo endpoint
    return Response({
        'detail': 'OIDC userinfo endpoint not yet implemented'
    }, status=501)

