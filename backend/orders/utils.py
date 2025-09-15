from datetime import timedelta, datetime
import stripe
import uuid
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse

from holiday.models import Holiday
from customer.utils import generate_otp, send_otp_email, send_otp_sms
from dashboard.models import AdminInvoiceConfiguration
import uuid
from io import BytesIO
from django.template.loader import render_to_string
from weasyprint import HTML
from xhtml2pdf import pisa

def contact_verification_otp(otp_verification, email=False, phone=False):
    email_otp = generate_otp()
    phone_otp = generate_otp()
    expire_at = (
        timezone.now() + timedelta(minutes=int(settings.OTP_TIMEOUT))
        if settings.OTP_TIMEOUT is not None
        else None
    )
    otp_verification.email_otp = email_otp
    otp_verification.contact = phone_otp

    if email:
        if not otp_verification.can_resend_otp(otp_type="email", cooldown_seconds=60):
            raise Exception(
                "Email OTP was sent too recently. Please wait before resending."
            )
        otp_verification.email_otp = email_otp
        otp_verification.last_email_sent_at = timezone.now()
        otp_verification.expires_at = expire_at
    if phone:
        if not otp_verification.can_resend_otp(otp_type="phone", cooldown_seconds=60):
            raise Exception(
                "SMS OTP was sent too recently. Please wait before resending."
            )
        otp_verification.phone_otp = phone_otp
        otp_verification.expires_at = expire_at
        otp_verification.last_sms_sent_at = timezone.now()

    otp_verification.save()

    if email:
        send_otp_email(otp_verification.email, email_otp)

    if phone:
        send_otp_sms(otp_verification.contact_number, phone_otp)

    return True


# Replace with your Stripe Secret Key


def create_invoice_from_payment(checkout_session_id):
    """
    Retrieves the PaymentIntent from a Stripe Checkout Session
    and creates an invoice for the payment.

    Args:
        checkout_session_id (str): The ID of the Stripe Checkout Session.

    Returns:
        dict: The created Stripe invoice details.
    """
    try:
        stripe.api_key = settings.STRIPE_API_KEY
        # Step 1: Retrieve the Checkout Session
        session = stripe.checkout.Session.retrieve(checkout_session_id)

        # Step 2: Check if payment_intent is present
        payment_intent_id = session.get("payment_intent")

        # Step 3: If payment_intent is missing, get it from the invoice
        if not payment_intent_id and session.invoice:
            invoice = stripe.Invoice.retrieve(session.invoice)
            payment_intent_id = invoice.get("payment_intent")

        # Step 4: If still missing, return an error
        if not payment_intent_id:
            return {"error": "No PaymentIntent found for this session."}

        # Step 5: Retrieve the PaymentIntent
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        customer_id = payment_intent.customer

        if not customer_id:
            return {"error": "No customer associated with this payment."}

        # Step 6: Create an invoice for the customer
        invoice = stripe.Invoice.create(
            customer=customer_id,
            auto_advance=True,
            collection_method="charge_automatically",
            description=f"Invoice for payment {payment_intent_id}",
            metadata={"payment_intent_id": payment_intent_id},
        )

        # Step 7: Finalize the invoice
        finalized_invoice = stripe.Invoice.finalize_invoice(invoice["id"])

        return finalized_invoice

    except stripe.error.StripeError as e:
        return {"error": str(e)}



def get_available_delivery_days(start_date=None, days=7):
    """
    Fetch delivery days within the next 'days' days, marking holidays.
    """
    if not start_date:
        start_date = timezone.now().date()

    available_days = []
    holidays = Holiday.objects.filter(
        date__range=[start_date, start_date + timedelta(days=days - 1)]
    )

    for i in range(days):
        current_date = start_date + timedelta(days=i)
        holiday = holidays.filter(date=current_date).first()

        available_days.append(
            {
                "date": current_date,
                "day": current_date.strftime("%A"),
                "is_holiday": bool(holiday),
                "holiday_reason": holiday.holiday if holiday else "",
            }
        )

    return available_days

def generate_invoice_number():
    """
    Generate a unique invoice number.

    Returns:
        str: Unique invoice number in format 'INV-XXXXXXXX'
            where X is a hexadecimal digit
    """
    return f"INV-{uuid.uuid4().hex[:8].upper()}"



def generate_invoice_pdf(invoice):
    """
    Generate a PDF file for the given invoice.

    Args:
        invoice: Invoice object containing order and items information

    Returns:
        BytesIO: PDF file buffer containing the generated invoice
    """
    try:
        invoice_config = AdminInvoiceConfiguration.objects.last()
    except Exception:
        invoice_config = None

    print(f"🧾 Generating Invoice PDF for Invoice ID: {invoice.id}")

    if not hasattr(invoice, "order"):
        print("🚨 Invoice has no order associated!")
        return None

    order = invoice.order
    logo_url = (
        f"https://breakfast-api.rexett.com{invoice_config.logo.url}"
        if invoice_config.logo
        else None
    ) if invoice_config else ''

    order_items = order.items.all()
    html_string = render_to_string(
        "invoice.html",
        {
            "invoice": invoice,
            "orders": order_items,
            "invoice_config": invoice_config,
            "logo_url": logo_url,
        },
    )

    pdf_file = BytesIO()
    HTML(string=html_string).write_pdf(pdf_file)
    return pdf_file


def generate_order_pdf(request):
    """
    Generate a PDF file for an order.

    Args:
        request: HTTP request object

    Returns:
        HttpResponse: PDF file response with appropriate headers
            Content-Type: application/pdf
            Content-Disposition: attachment

    Raises:
        HttpResponse: Status 500 if PDF generation fails
    """
    # Sample order data
    order_data = {
        "order_id": f"ORD-{datetime.now().strftime('%Y%m%d')}-001",
        "customer_name": "John Doe",
        "order_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "items": [
            {"name": "Item 1", "quantity": 1, "price": 10, "total": 10},
            {"name": "Item 2", "quantity": 2, "price": 15, "total": 30},
        ],
        "total_amount": 40,
    }

    html_content = render_to_string("order_template.html", order_data)
    buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=buffer)

    if pisa_status.err:
        return HttpResponse("Error generating PDF", status=500)

    buffer.seek(0)
    return HttpResponse(
        buffer,
        content_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={order_data['order_id']}.pdf",
        },
    )
