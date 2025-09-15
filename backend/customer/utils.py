import random
import string
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from twilio.rest import Client  # type: ignore

from customer.models import CustomerOTP


def generate_otp(length=6):
    return "".join(random.choices(string.digits, k=length))


def send_otp_email(email, otp):
    subject = "Your OTP Verification Code"
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [email]

    # Context for the email template
    context = {
        "otp": otp,
    }

    # Render the HTML template
    message_html = render_to_string("emails/otp_verification_email.html", context)

    # Fallback plain text message
    message_plain = f"Your OTP code is {otp}. Please use it to verify your account."

    try:
        send_mail(
            subject=subject,
            message=message_plain,
            from_email=email_from,
            recipient_list=recipient_list,
            html_message=message_html,
            fail_silently=False,
        )
    except Exception as e:
        raise Exception(f"Failed to send email: {str(e)}")


def send_otp_sms(contact_no, otp):
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    message = client.messages.create(
        body=f"Your OTP code is {otp}.",
        from_=settings.TWILIO_PHONE_NUMBER,
        to=f"+91{contact_no}",
    )
    return message.sid


def send_verification_otp(bakery, email=False, phone=False):
    # Generate separate OTPs
    email_otp = generate_otp()
    phone_otp = generate_otp()
    expire_at = (
        timezone.now() + timedelta(minutes=int(settings.OTP_TIMEOUT))
        if settings.OTP_TIMEOUT is not None
        else None
    )
    otp_record, created = CustomerOTP.objects.get_or_create(
        bakery=bakery,
        defaults={
            "email_otp": email_otp,
            "phone_otp": phone_otp,
            "created_at": timezone.now(),
            "expires_at": expire_at,
            "last_email_sent_at": timezone.now(),
        },
    )
    if not created:
        if email:
            if not otp_record.can_resend_otp(otp_type="email", cooldown_seconds=60):
                raise Exception(
                    "Email OTP was sent too recently. Please wait before resending."
                )
            otp_record.email_otp = email_otp
            otp_record.last_email_sent_at = timezone.now()
            otp_record.expires_at = expire_at
        if phone:
            if not otp_record.can_resend_otp(otp_type="phone", cooldown_seconds=60):
                raise Exception(
                    "SMS OTP was sent too recently. Please wait before resending."
                )
            otp_record.phone_otp = phone_otp
            otp_record.expires_at = expire_at
            otp_record.last_sms_sent_at = timezone.now()

    otp_record.save()

    if email:
        send_otp_email(bakery.user.email, email_otp)

    if phone:
        send_otp_sms(bakery.contact_no, phone_otp)

    return True





def generate_password(length=12, include_special_chars=True):
    """
    Generate a strong password with a mix of uppercase,
    lowercase, digits, and special characters.
    """

    if length < 8:
        raise ValueError("Password length should be at least 8 characters")

    # Define character pools
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special_chars = string.punctuation if include_special_chars else ""

    # Ensure at least one character from each required set
    password = [
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(digits),
    ]

    if include_special_chars:
        password.append(random.choice(special_chars))

    # Fill the remaining length with random choices
    all_characters = lowercase + uppercase + digits + special_chars
    password += random.choices(all_characters, k=length - len(password))

    # Shuffle to avoid predictable patterns
    random.shuffle(password)

    return "".join(password)


def send_reset_email(email, password):
    try:
        reset_password_url = f"{settings.BACKEND_URL}/reset-password/"
        subject = "Breakfast Shop Credentials"
        context = {
            "email": email,
            "password": password,
            "reset_password_url": reset_password_url,
        }
        message = render_to_string("emails/password_reset.html", context)

        send_mail(
            subject=subject,
            message="",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            html_message=message,
            fail_silently=False,
        )
        return True
    except Exception:
        return False
