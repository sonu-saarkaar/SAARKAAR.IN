import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


def _b64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64_url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def _token_secret() -> str:
    return os.getenv("ADMIN_JWT_SECRET", os.getenv("JWT_SECRET", "saarkaar-dev-admin-secret"))


def create_admin_token(username: str, expires_minutes: int = 720) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "role": "admin",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }

    header_enc = _b64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_enc = _b64_url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_enc}.{payload_enc}".encode("utf-8")

    signature = hmac.new(_token_secret().encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_enc = _b64_url_encode(signature)
    return f"{header_enc}.{payload_enc}.{signature_enc}"


def decode_admin_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token")

        header_enc, payload_enc, signature_enc = parts
        signing_input = f"{header_enc}.{payload_enc}".encode("utf-8")
        expected_sig = hmac.new(_token_secret().encode("utf-8"), signing_input, hashlib.sha256).digest()
        provided_sig = _b64_url_decode(signature_enc)

        if not hmac.compare_digest(expected_sig, provided_sig):
            raise ValueError("Invalid signature")

        payload = json.loads(_b64_url_decode(payload_enc).decode("utf-8"))
        if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("Token expired")

        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(exc)}")


def verify_admin_credentials(username: str, password: str) -> bool:
    expected_username = os.getenv("ADMIN_USERNAME", "admin")
    expected_password = os.getenv("ADMIN_PASSWORD", "admin123")
    return username == expected_username and password == expected_password


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing admin authorization")

    payload = decode_admin_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")

    return payload
