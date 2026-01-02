"""Configuration for the LLM Council."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
COUNCIL_MODELS = [
    # "openai/gpt-5.1",
    # "google/gemini-3-pro-preview",
    # "anthropic/claude-sonnet-4.5",
    # "x-ai/grok-4",
    # Strong general reasoning (DeepSeek-style)
    "deepseek/deepseek-r1-0528:free",

    # Large open-weight reasoning model
    "meta-llama/llama-3.3-70b-instruct:free",

    # High-quality synthesis + instruction following
    "mistralai/mistral-small-3.1-24b-instruct:free",

    # Alternative reasoning style (AllenAI Think models)
    "allenai/olmo-3.1-32b-think:free",
]

# # Chairman model - synthesizes final response
# CHAIRMAN_MODEL = "google/gemini-3-pro-preview"
# Chairman model – best FREE synthesis model
CHAIRMAN_MODEL = "meta-llama/llama-3.1-405b-instruct:free"


# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
# Use absolute path to ensure consistency
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = str(PROJECT_ROOT / "data" / "conversations")
