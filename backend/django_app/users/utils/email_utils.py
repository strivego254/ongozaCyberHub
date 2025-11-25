"""
Email utilities for sending magic links, OTP codes, and verification emails.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_magic_link_email(user, code, magic_link_url):
    """
    Send magic link email to user.
    
    Args:
        user: User instance
        code: Magic link code
        magic_link_url: Full URL with code (e.g., https://app.example.com/auth/verify?code=xxx)
    """
    subject = 'Sign in to Ongoza CyberHub'
    
    html_message = render_to_string('emails/magic_link.html', {
        'user': user,
        'magic_link_url': magic_link_url,
        'code': code,
    })
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_otp_email(user, code):
    """
    Send OTP code via email.
    
    Args:
        user: User instance
        code: OTP code (6-digit)
    """
    subject = 'Your Ongoza CyberHub verification code'
    
    html_message = render_to_string('emails/otp_code.html', {
        'user': user,
        'code': code,
    })
    
    plain_message = f'Your verification code is: {code}\n\nThis code will expire in 10 minutes.'
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_verification_email(user, verification_url):
    """
    Send email verification link.
    
    Args:
        user: User instance
        verification_url: Full verification URL with token
    """
    subject = 'Verify your Ongoza CyberHub email'
    
    html_message = render_to_string('emails/verify_email.html', {
        'user': user,
        'verification_url': verification_url,
    })
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_reset_email(user, reset_url):
    """
    Send password reset link.
    
    Args:
        user: User instance
        reset_url: Full password reset URL with token
    """
    subject = 'Reset your Ongoza CyberHub password'
    
    html_message = render_to_string('emails/password_reset.html', {
        'user': user,
        'reset_url': reset_url,
    })
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_mfa_enrollment_email(user, method):
    """
    Send MFA enrollment confirmation email.
    
    Args:
        user: User instance
        method: MFA method ('totp', 'sms', 'email')
    """
    subject = 'MFA enabled on your Ongoza CyberHub account'
    
    html_message = render_to_string('emails/mfa_enabled.html', {
        'user': user,
        'method': method,
    })
    
    plain_message = f'MFA has been enabled on your account using {method}.'
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

