"""
Radar Vibz - Core Settings & Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Radar Vibz"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite:///./radar_vibz.db"

    # Meta Instagram Graph API
    META_ACCESS_TOKEN: Optional[str] = None
    META_PAGE_ID: Optional[str] = None
    META_API_VERSION: str = "v21.0"
    PROVIDER_MODE: str = "demo_simulation"

    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.8-flash"

    # Telegram Bot API
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None
    TELEGRAM_ENABLED: bool = True

    # Monitoring Scheduler
    MONITORING_INTERVAL_MINUTES: int = 30
    MAX_PROFILES_PER_CYCLE: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
