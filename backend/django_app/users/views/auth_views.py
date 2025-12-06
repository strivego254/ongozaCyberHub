"""
Authentication views for signup, login, MFA, SSO, etc.
"""
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from users.models import User, UserRole
from users.audit_models import AuditLog
from users.serializers import (
    UserSerializer,
    SignupSerializer,
    LoginSerializer,
    MagicLinkRequestSerializer,
    MFAEnrollSerializer,
    MFAVerifySerializer,
    RefreshTokenSerializer,
    ConsentUpdateSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from users.utils.auth_utils import (
    create_mfa_code,
    verify_mfa_code,
    create_user_session,
    verify_refresh_token,
    rotate_refresh_token,
    revoke_session,
    check_device_trust,
    trust_device,
)
from users.utils.risk_utils import calculate_risk_score, requires_mfa
from users.utils.consent_utils import (
    get_user_consent_scopes,
    grant_consent,
    revoke_consent,
    get_consent_scopes_for_token,
)
from users.auth_models import MFAMethod


def _get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def _assign_default_mentee_role(user):
    """
    Assign default 'Mentee' role to new user during onboarding.
    """
    from users.models import Role, UserRole
    
    try:
        mentee_role = Role.objects.get(name='mentee')
    except Role.DoesNotExist:
        # Create mentee role if it doesn't exist
        mentee_role = Role.objects.create(
            name='mentee',
            display_name='Mentee',
            description='Primary user role for mentees in the OCH ecosystem',
            is_system_role=True
        )
    
    # Assign role with global scope
    UserRole.objects.get_or_create(
        user=user,
        role=mentee_role,
        scope='global',
        defaults={'is_active': True}
    )


def _log_audit_event(user, action, resource_type, result='success', metadata=None):
    """Log audit event."""
    AuditLog.objects.create(
        user=user,
        actor_type='user',
        actor_identifier=user.email if user else 'anonymous',
        action=action,
        resource_type=resource_type,
        result=result,
        metadata=metadata or {},
        timestamp=timezone.now(),
    )


class SignupView(APIView):
    """
    POST /api/v1/auth/signup
    Create account (email + password or passwordless).
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Check if user already exists
        if User.objects.filter(email=data['email']).exists():
            return Response(
                {'detail': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        if data.get('passwordless'):
            # Passwordless signup - create user without password
            user = User.objects.create_user(
                email=data['email'],
                username=data['email'],  # Use email as username
                first_name=data['first_name'],
                last_name=data['last_name'],
                country=data.get('country'),
                timezone=data.get('timezone', 'UTC'),
                language=data.get('language', 'en'),
                cohort_id=data.get('cohort_id'),
                track_key=data.get('track_key'),
                password=None,  # No password for passwordless
                # Mentee onboarding fields
                preferred_learning_style=data.get('preferred_learning_style'),
                career_goals=data.get('career_goals'),
                cyber_exposure_level=data.get('cyber_exposure_level'),
            )
            user.set_unusable_password()
            user.account_status = 'pending_verification'
            user.save()
            
            # Assign default "Mentee" role
            _assign_default_mentee_role(user)
            
            # Send magic link
            code, mfa_code = create_mfa_code(user, method='magic_link', expires_minutes=10)
            from users.utils.email_utils import send_magic_link_email
            from django.conf import settings
            magic_link_url = f"{settings.FRONTEND_URL}/auth/verify?code={code}&email={user.email}"
            send_magic_link_email(user, code, magic_link_url)
            
            _log_audit_event(user, 'create', 'user', 'success', {'method': 'passwordless'})
            
            return Response(
                {
                    'detail': 'Account created. Please check your email for verification link.',
                    'user_id': user.id,
                },
                status=status.HTTP_201_CREATED
            )
        else:
            # Email + password signup
            user = User.objects.create_user(
                email=data['email'],
                username=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                country=data.get('country'),
                timezone=data.get('timezone', 'UTC'),
                language=data.get('language', 'en'),
                cohort_id=data.get('cohort_id'),
                track_key=data.get('track_key'),
                # Mentee onboarding fields
                preferred_learning_style=data.get('preferred_learning_style'),
                career_goals=data.get('career_goals'),
                cyber_exposure_level=data.get('cyber_exposure_level'),
            )
            
            # Assign default "Mentee" role
            _assign_default_mentee_role(user)
            
            # If invited (has cohort_id/track_key), activate immediately
            if data.get('cohort_id') or data.get('track_key'):
                user.activate()
            else:
                # Send verification email with OTP
                code, mfa_code = create_mfa_code(user, method='email', expires_minutes=60)
                from users.utils.email_utils import send_verification_email
                from django.conf import settings
                verification_url = f"{settings.FRONTEND_URL}/auth/verify-email?code={code}&email={user.email}"
                send_verification_email(user, verification_url)
            
            _log_audit_event(user, 'create', 'user', 'success', {'method': 'email_password'})
            
            return Response(
                {
                    'detail': 'Account created. Please verify your email.',
                    'user_id': user.id,
                },
                status=status.HTTP_201_CREATED
            )


class LoginView(APIView):
    """
    POST /api/v1/auth/login
    Login with email+password or passwordless code.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        email = data['email']
        password = data.get('password')
        code = data.get('code')
        device_fingerprint = data.get('device_fingerprint', 'unknown')
        device_name = data.get('device_name', 'Unknown Device')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            _log_audit_event(None, 'login', 'user', 'failure', {'email': email})
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check account status
        if user.account_status != 'active':
            return Response(
                {'detail': f'Account is {user.account_status}. Please verify your email.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Authenticate
        if code:
            # Passwordless login
            if not verify_mfa_code(user, code, method='magic_link'):
                _log_audit_event(user, 'login', 'user', 'failure', {'method': 'passwordless'})
                return Response(
                    {'detail': 'Invalid or expired code'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        elif password:
            # Password login
            if not user.check_password(password):
                _log_audit_event(user, 'login', 'user', 'failure', {'method': 'password'})
                return Response(
                    {'detail': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        else:
            return Response(
                {'detail': 'Password or code required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate risk score
        ip_address = _get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        risk_score = calculate_risk_score(user, ip_address, device_fingerprint, user_agent)
        
        # Check if device is trusted
        device_trusted = check_device_trust(user, device_fingerprint)
        
        # In development, auto-trust device for test users
        from django.conf import settings
        if settings.DEBUG and user.email.endswith('@test.com') and not device_trusted:
            from users.utils.auth_utils import trust_device, _detect_device_type
            device_type = _detect_device_type(user_agent)
            trust_device(user, device_fingerprint, device_name, device_type, ip_address, user_agent, expires_days=365)
            device_trusted = True
        
        # Check MFA requirement
        user_roles = UserRole.objects.filter(user=user, is_active=True)
        user_role_names = [ur.role.name for ur in user_roles]
        primary_role = user_role_names[0] if user_role_names else None
        
        mfa_required = requires_mfa(risk_score, primary_role) or user.mfa_enabled
        
        # If MFA required and not verified, return MFA challenge
        if mfa_required and not device_trusted:
            # Create temporary session for MFA verification
            session = create_user_session(
                user=user,
                device_fingerprint=device_fingerprint,
                device_name=device_name,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            return Response(
                {
                    'detail': 'MFA required',
                    'mfa_required': True,
                    'session_id': str(session[2].id),
                },
                status=status.HTTP_200_OK
            )
        
        # Create session and issue tokens
        access_token, refresh_token, session = create_user_session(
            user=user,
            device_fingerprint=device_fingerprint,
            device_name=device_name,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Trust device if requested and MFA verified
        if device_trusted or not mfa_required:
            trust_device(user, device_fingerprint, device_name, session.device_type, ip_address, user_agent)
        
        # Get consent scopes for token
        consent_scopes = get_consent_scopes_for_token(user)
        
        # Update user last login
        user.last_login = timezone.now()
        user.last_login_ip = ip_address
        user.save()
        
        _log_audit_event(user, 'login', 'user', 'success', {
            'method': 'passwordless' if code else 'password',
            'risk_score': risk_score,
            'mfa_required': mfa_required,
        })
        
        response = Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data,
            'consent_scopes': consent_scopes,
        }, status=status.HTTP_200_OK)
        
        # Set refresh token as httpOnly cookie
        response.set_cookie(
            'refresh_token',
            refresh_token,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            secure=not settings.DEBUG,  # Secure in production
            samesite='Lax',
        )
        
        return response


class MagicLinkView(APIView):
    """
    POST /api/v1/auth/login/magic-link
    Request magic link for passwordless login.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = MagicLinkRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists
            return Response(
                {'detail': 'If an account exists, a magic link has been sent.'},
                status=status.HTTP_200_OK
            )
        
        # Generate magic link code
        code, mfa_code = create_mfa_code(user, method='magic_link', expires_minutes=10)
        
        # Send email with magic link
        from users.utils.email_utils import send_magic_link_email
        from django.conf import settings
        magic_link_url = f"{settings.FRONTEND_URL}/auth/verify?code={code}&email={email}"
        send_magic_link_email(user, code, magic_link_url)
        
        _log_audit_event(user, 'mfa_challenge', 'user', 'success', {'method': 'magic_link'})
        
        return Response(
            {'detail': 'Magic link sent to your email'},
            status=status.HTTP_200_OK
        )


class MFAEnrollView(APIView):
    """
    POST /api/v1/auth/mfa/enroll
    Enroll in MFA (TOTP setup).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = MFAEnrollSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        method = serializer.validated_data['method']
        user = request.user
        
        # TODO: Implement TOTP secret generation
        # For TOTP, generate secret and QR code
        if method == 'totp':
            import pyotp
            secret = pyotp.random_base32()
            
            mfa_method = MFAMethod.objects.create(
                user=user,
                method_type='totp',
                secret_encrypted=secret,  # TODO: Encrypt this
                enabled=False,  # Not enabled until verified
            )
            
            # Generate QR code URI
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=user.email,
                issuer_name='Ongoza CyberHub'
            )
            
            _log_audit_event(user, 'mfa_enroll', 'mfa', 'success', {'method': 'totp'})
            
            return Response({
                'mfa_method_id': str(mfa_method.id),
                'secret': secret,  # Only shown once
                'qr_code_uri': totp_uri,
            }, status=status.HTTP_201_CREATED)
        
        return Response(
            {'detail': f'MFA method {method} enrollment not yet implemented'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )


class MFAVerifyView(APIView):
    """
    POST /api/v1/auth/mfa/verify
    Verify MFA code.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        code = serializer.validated_data['code']
        method = serializer.validated_data['method']
        user = request.user
        
        # Verify code
        if method == 'totp':
            import pyotp
            from users.utils.auth_utils import generate_totp_backup_codes, verify_totp_backup_code
            
            # Check if this is enrollment verification (pending TOTP)
            mfa_method = MFAMethod.objects.filter(
                user=user,
                method_type='totp',
                enabled=False
            ).first()
            
            if mfa_method:
                # Enrollment verification
                totp = pyotp.TOTP(mfa_method.secret_encrypted)
                if totp.verify(code, valid_window=1):
                    # Generate backup codes
                    backup_codes, hashed_backup_codes = generate_totp_backup_codes(count=10)
                    mfa_method.totp_backup_codes = hashed_backup_codes
                    mfa_method.enabled = True
                    mfa_method.is_verified = True
                    mfa_method.verified_at = timezone.now()
                    mfa_method.is_primary = True
                    mfa_method.save()
                    
                    user.mfa_enabled = True
                    user.mfa_method = 'totp'
                    user.save()
                    
                    _log_audit_event(user, 'mfa_success', 'mfa', 'success', {'method': 'totp'})
                    
                    return Response({
                        'detail': 'MFA enabled successfully',
                        'backup_codes': backup_codes,  # Show only once
                    }, status=status.HTTP_200_OK)
                else:
                    _log_audit_event(user, 'mfa_failure', 'mfa', 'failure', {'method': 'totp'})
                    return Response(
                        {'detail': 'Invalid TOTP code'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Regular TOTP verification (already enrolled)
                mfa_method = MFAMethod.objects.filter(
                    user=user,
                    method_type='totp',
                    enabled=True
                ).first()
                
                if not mfa_method:
                    return Response(
                        {'detail': 'TOTP not enabled for this account'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Try TOTP code first
                totp = pyotp.TOTP(mfa_method.secret_encrypted)
                if totp.verify(code, valid_window=1):
                    mfa_method.last_used_at = timezone.now()
                    mfa_method.save()
                    _log_audit_event(user, 'mfa_success', 'mfa', 'success', {'method': 'totp'})
                    return Response({'detail': 'MFA verified'}, status=status.HTTP_200_OK)
                
                # Try backup code
                if verify_totp_backup_code(user, code):
                    _log_audit_event(user, 'mfa_success', 'mfa', 'success', {'method': 'backup_code'})
                    return Response({'detail': 'MFA verified with backup code'}, status=status.HTTP_200_OK)
                
                _log_audit_event(user, 'mfa_failure', 'mfa', 'failure', {'method': 'totp'})
                return Response(
                    {'detail': 'Invalid TOTP code or backup code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Verify other methods
        if verify_mfa_code(user, code, method):
            _log_audit_event(user, 'mfa_success', 'mfa', 'success', {'method': method})
            return Response({
                'detail': 'MFA verified successfully',
            }, status=status.HTTP_200_OK)
        else:
            _log_audit_event(user, 'mfa_failure', 'mfa', 'failure', {'method': method})
            return Response(
                {'detail': 'Invalid or expired code'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MFADisableView(APIView):
    """
    POST /api/v1/auth/mfa/disable
    Disable MFA for user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA is not enabled for this account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Disable all MFA methods
        from users.auth_models import MFAMethod
        MFAMethod.objects.filter(user=user, enabled=True).update(
            enabled=False,
            is_primary=False
        )
        
        user.mfa_enabled = False
        user.mfa_method = None
        user.save()
        
        _log_audit_event(user, 'mfa_disable', 'mfa', 'success')
        
        return Response({
            'detail': 'MFA disabled successfully'
        }, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    """
    POST /api/v1/auth/token/refresh
    Refresh access token with refresh token.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        refresh_token = serializer.validated_data.get('refresh_token') or request.COOKIES.get('refresh_token')
        device_fingerprint = serializer.validated_data.get('device_fingerprint', 'unknown')
        
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rotate refresh token
        new_access_token, new_refresh_token, session = rotate_refresh_token(
            refresh_token,
            device_fingerprint
        )
        
        if not session:
            return Response(
                {'detail': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        response = Response({
            'access_token': new_access_token,
            'refresh_token': new_refresh_token,
        }, status=status.HTTP_200_OK)
        
        # Update refresh token cookie
        response.set_cookie(
            'refresh_token',
            new_refresh_token,
            max_age=30 * 24 * 60 * 60,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
        )
        
        return response


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout
    Logout and revoke session.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        refresh_token = request.data.get('refresh_token') or request.COOKIES.get('refresh_token')
        
        if refresh_token:
            revoke_session(refresh_token=refresh_token)
        else:
            # Revoke all sessions for user
            revoke_session(user=request.user)
        
        _log_audit_event(request.user, 'logout', 'user', 'success')
        
        response = Response(
            {'detail': 'Logged out successfully'},
            status=status.HTTP_200_OK
        )
        
        # Clear refresh token cookie
        response.delete_cookie('refresh_token')
        
        return response


class MeView(APIView):
    """
    GET /api/v1/auth/me
    Get current user profile with roles and consents.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        
        # Get roles with scope details
        roles = []
        for user_role in user.user_roles.filter(is_active=True):
            roles.append({
                'role': user_role.role.name,
                'scope': user_role.scope,
                'scope_ref': str(user_role.scope_ref) if user_role.scope_ref else None,
            })
        
        # Get consent scopes
        consent_scopes = get_user_consent_scopes(user)
        
        # Get entitlements
        entitlements = list(
            user.entitlements.filter(granted=True, expires_at__isnull=True)
            .values_list('feature', flat=True)
        )
        
        # Format response to match spec
        # Example: { "user": {"id":"UUID","email":"martin@och.africa","name":"Martin"}, ... }
        user_data = serializer.data
        user_response = {
            'id': str(user_data.get('id', '')),
            'email': user_data.get('email', ''),
            'name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
        }
        
        # Format consent scopes as list of strings (e.g., ["share_with_mentor","public_portfolio:false"])
        formatted_consents = []
        for scope in consent_scopes:
            formatted_consents.append(scope)
        
        return Response({
            'user': user_response,
            'roles': roles,
            'consent_scopes': formatted_consents,
            'entitlements': entitlements,
        }, status=status.HTTP_200_OK)


class ConsentView(APIView):
    """
    POST /api/v1/auth/consents
    Update consent scopes.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ConsentUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        scope_type = serializer.validated_data['scope_type']
        granted = serializer.validated_data['granted']
        expires_at = serializer.validated_data.get('expires_at')
        
        if granted:
            consent = grant_consent(request.user, scope_type, expires_at)
            _log_audit_event(request.user, 'consent_granted', 'consent', 'success', {'scope': scope_type})
        else:
            consent = revoke_consent(request.user, scope_type)
            _log_audit_event(request.user, 'consent_revoked', 'consent', 'success', {'scope': scope_type})
        
        return Response({
            'detail': f'Consent {scope_type} {"granted" if granted else "revoked"}',
            'consent': {
                'scope_type': scope_type,
                'granted': granted,
            }
        }, status=status.HTTP_200_OK)

