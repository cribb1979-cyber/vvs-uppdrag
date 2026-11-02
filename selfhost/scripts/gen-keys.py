#!/usr/bin/env python3
"""Skriver en färdig .env för VVS-backenden.

    python3 scripts/gen-keys.py

Hemligheterna skrivs bara till .env (chmod 600) och skrivs inte ut.
Redigera ANTHROPIC_API_KEY efteråt om du vill ha AI-hjälpen.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(HERE, ".env")


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def make_jwt(secret: str, role: str) -> str:
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "iss": "vvs-selfhost",
        "ref": "vvs-selfhost",
        "role": role,
        "iat": now,
        "exp": now + 10 * 365 * 24 * 3600,
    }
    head = b64url(json.dumps(header, separators=(",", ":")).encode())
    body = b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{head}.{body}"
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{b64url(signature)}"


def main() -> None:
    db_password = secrets.token_hex(24)
    jwt_secret = secrets.token_urlsafe(48)
    internal_secret = secrets.token_hex(24)

    content = f"""# VVS Uppdrag – egen backend (genererad {time.strftime('%Y-%m-%d %H:%M')})
SITE_ADDRESS=:80
ACME_EMAIL=

PUBLIC_URL=https://christoffer-ideacentre-y900-34isz.tail3766b4.ts.net:8443/vvs
APP_URL=https://vvs-uppdrag.vercel.app

POSTGRES_PASSWORD={db_password}
JWT_SECRET={jwt_secret}

ANON_KEY={make_jwt(jwt_secret, "anon")}
SERVICE_ROLE_KEY={make_jwt(jwt_secret, "service_role")}

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
INTERNAL_SECRET={internal_secret}
"""
    with open(ENV, "w", encoding="utf-8") as f:
        f.write(content)
    os.chmod(ENV, 0o600)
    print(f"Skrev {ENV} (hemligheterna visas inte).")


if __name__ == "__main__":
    main()
