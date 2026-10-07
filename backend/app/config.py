"""Environment-driven configuration."""

from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env into os.environ as well: Prisma reads DATABASE_URL straight from the
# process environment, not through pydantic.
load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Database
    database_url: str = "mongodb://127.0.0.1:27017/turf?directConnection=true"

    # Auth
    jwt_secret: str = "dev-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # Gateway secret encryption
    encryption_key: str = ""

    # SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from: str = "noreply@turf.local"
    smtp_enabled: bool = False

    # Seed admin
    admin_email: str = "admin@crm.local"
    admin_password: str = "Admin@123"

    # App
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    hold_ttl_minutes: int = 10
    payout_mode: str = "AUTO"  # AUTO (instant) | BATCH

    @property
    def webhook_url(self) -> str:
        return f"{self.backend_url.rstrip('/')}/api/webhooks/payment"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
