"""Application-wide constants.

MongoDB (via Prisma) has no native enum support, so status/role values live
here as plain strings and are validated in the application layer.
"""


class Role:
    ADMIN = "ADMIN"
    VENUE_OWNER = "VENUE_OWNER"
    USER = "USER"

    ALL = (ADMIN, VENUE_OWNER, USER)


class UserStatus:
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class VenueStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    SUSPENDED = "SUSPENDED"


class SlotStatus:
    OPEN = "OPEN"
    HELD = "HELD"
    BOOKED = "BOOKED"
    BLOCKED = "BLOCKED"


class BookingStatus:
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    REFUNDED = "REFUNDED"


class TransactionStatus:
    CAPTURED = "CAPTURED"
    REFUNDED = "REFUNDED"


class PayoutStatus:
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"


class Beneficiary:
    VENUE = "VENUE"
    ADMIN = "ADMIN"
    ADMIN_ID = "ADMIN"


class SplitScope:
    GLOBAL = "GLOBAL"
    VENUE = "VENUE"


class GatewayProvider:
    RAZORPAY = "RAZORPAY"
    STRIPE = "STRIPE"
    CASHFREE = "CASHFREE"
    SANDBOX = "SANDBOX"

    ALL = (RAZORPAY, STRIPE, CASHFREE, SANDBOX)


SPORT_TYPES = (
    "Football",
    "Cricket",
    "Badminton",
    "Tennis",
    "Basketball",
    "Volleyball",
    "Futsal",
    "Hockey",
    "Pickleball",
    "Table Tennis",
)
