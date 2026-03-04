import logging
import structlog
import sys
from structlog.types import EventDict

def setup_logging(is_production: bool = True):
    \"\"\"
    Configures Structlog for the entire FastAPI application.
    \"\"\"
    # Shared processors form the pipeline that all log events run through
    shared_processors = [
        structlog.contextvars.merge_contextvars,          # Pulls contextvars (like request_id) into log
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,             # Formats exceptions safely
        structlog.processors.UnicodeDecoder(),
    ]

    # Different formatting based on environment
    if is_production:
        # In PROD, format everything strictly as JSON (for ELK / Grafana Loki)
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # In DEV, output colorful human-readable logs to console
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer()
        ]

    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure the standard Python logging module to bridge to Structlog
    # This catches logs from other libraries (like Uvicorn, FastAPI, Motor)
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )

def get_logger(name: str) -> structlog.BoundLogger:
    \"\"\"
    Returns a configured structlog logger instance.
    \"\"\"
    return structlog.get_logger(name)
