"""Notification service (email via SMTP, best-effort).

Notifications are fire-and-forget: a failure to send must never break the
booking/payment flow, so every send is wrapped and logged.
"""

import logging
from email.message import EmailMessage

import aiosmtplib

from app.config import settings

log = logging.getLogger("turf.notifications")


async def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.smtp_enabled or not to:
        log.info("SMTP disabled - skipping email to %s (%s)", to, subject)
        return False

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_pass or None,
            start_tls=True if settings.smtp_port == 587 else False,
            timeout=15,
        )
        log.info("Email sent to %s (%s)", to, subject)
        return True
    except Exception as exc:  # noqa: BLE001 - best-effort delivery
        log.warning("Failed to send email to %s: %s", to, exc)
        return False


async def notify_booking_confirmed(user_email: str, venue_name: str, when: str, amount: float) -> None:
    await send_email(
        user_email,
        f"Booking confirmed - {venue_name}",
        f"Your booking at {venue_name} for {when} is confirmed.\n"
        f"Amount paid: {amount:.2f}",
    )


async def notify_payment_failed(user_email: str, venue_name: str) -> None:
    await send_email(
        user_email,
        "Payment could not be completed",
        f"We could not confirm your payment for {venue_name}. "
        "The slot hold has been released. Please try again.",
    )


async def notify_payout_settled(owner_email: str, venue_name: str, amount: float) -> None:
    await send_email(
        owner_email,
        "Payout settled",
        f"A payout of {amount:.2f} for {venue_name} has been settled.",
    )


async def notify_booking_cancelled(user_email: str, venue_name: str, refunded: float) -> None:
    await send_email(
        user_email,
        "Booking cancelled",
        f"Your booking at {venue_name} was cancelled. "
        f"Refund issued: {refunded:.2f}",
    )
