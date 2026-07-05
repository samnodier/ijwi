from app.config import settings
from app.providers.base import AIProvider
from app.providers.rules import RulesProvider


def get_provider() -> AIProvider:
    """Return the configured provider, falling back to rules."""
    provider = settings.ai_provider.lower()

    if provider == "groq":
        # Imported lazily so the service still boots without the groq package/key.
        from app.providers.groq import GroqProvider

        return GroqProvider()

    return RulesProvider()
