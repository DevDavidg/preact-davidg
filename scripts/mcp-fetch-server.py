#!/usr/bin/env python3
"""Minimal stdio MCP server: fetch URL as text/markdown-ish plain text."""

from __future__ import annotations

import http.client
import ipaddress
import json
import re
import socket
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

PROTOCOL = "2024-11-05"
_BLOCKED_HOSTS = frozenset(
    {
        "localhost",
        "metadata",
        "metadata.google.internal",
        "metadata.goog",
    }
)
_BLOCKED_SUFFIXES = (".local", ".internal", ".localhost")


def _assert_public_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> None:
    if not ip.is_global:
        raise ValueError(f"Non-public IP not allowed: {ip}")


def _resolve_public_host(host: str, port: int) -> None:
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ValueError(f"DNS lookup failed: {exc}") from exc
    if not infos:
        raise ValueError("DNS lookup returned no addresses")
    for info in infos:
        _assert_public_ip(ipaddress.ip_address(info[4][0]))


class _PublicPeerHTTPSConnection(http.client.HTTPSConnection):
    """Reject connections that land on non-public peers (DNS rebinding)."""

    def connect(self) -> None:
        super().connect()
        peer = self.sock.getpeername()[0]
        ip = ipaddress.ip_address(peer)
        if not ip.is_global:
            self.close()
            raise OSError(f"Refusing non-public peer IP: {ip}")


class _PublicPeerHTTPSHandler(urllib.request.HTTPSHandler):
    def https_open(self, req):  # noqa: ANN001
        return self.do_open(_PublicPeerHTTPSConnection, req)


class _SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        validate_fetch_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def validate_fetch_url(url: str) -> str:
    """Allow only public https URLs; block localhost, private, and link-local."""
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise ValueError("Only https URLs are allowed")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("URL credentials not allowed")
    host = (parsed.hostname or "").lower()
    if not host or host in _BLOCKED_HOSTS or host.endswith(_BLOCKED_SUFFIXES):
        raise ValueError("Host not allowed")
    port = parsed.port or 443
    try:
        _assert_public_ip(ipaddress.ip_address(host))
        return url
    except ValueError as exc:
        if "not allowed" in str(exc):
            raise
    _resolve_public_host(host, port)
    return url


def send(msg: dict) -> None:
    sys.stdout.write(json.dumps(msg) + "\n")
    sys.stdout.flush()


def respond(req_id, result) -> None:
    send({"jsonrpc": "2.0", "id": req_id, "result": result})


def respond_error(req_id, code: int, message: str) -> None:
    send({"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}})


def strip_html(html: str) -> str:
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", html)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:20000]


def fetch_url(url: str) -> str:
    safe = validate_fetch_url(url)
    req = urllib.request.Request(
        safe,
        headers={"User-Agent": "preact-davidg-mcp-fetch/1.0"},
    )
    # Empty ProxyHandler disables HTTPS_PROXY/HTTP_PROXY so peer-IP checks apply.
    opener = urllib.request.build_opener(
        urllib.request.ProxyHandler({}),
        _SafeRedirectHandler(),
        _PublicPeerHTTPSHandler(),
    )
    with opener.open(req, timeout=20) as resp:
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
    html = raw.decode(charset, errors="replace")
    return strip_html(html)


def handle(msg: dict) -> None:
    method = msg.get("method")
    req_id = msg.get("id")

    if method == "initialize":
        respond(
            req_id,
            {
                "protocolVersion": PROTOCOL,
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "fetch", "version": "1.0.0"},
            },
        )
        return

    if method == "notifications/initialized":
        return

    if method == "tools/list":
        respond(
            req_id,
            {
                "tools": [
                    {
                        "name": "fetch_url",
                        "description": "Fetch a public HTTPS URL and return plain text content",
                        "inputSchema": {
                            "type": "object",
                            "properties": {"url": {"type": "string"}},
                            "required": ["url"],
                        },
                    }
                ]
            },
        )
        return

    if method == "tools/call":
        params = msg.get("params") or {}
        name = params.get("name")
        args = params.get("arguments") or {}
        if name != "fetch_url":
            respond_error(req_id, -32601, f"Unknown tool: {name}")
            return
        url = args.get("url")
        if not isinstance(url, str) or not url.strip():
            respond_error(req_id, -32602, "url required")
            return
        try:
            text = fetch_url(url.strip())
            respond(
                req_id,
                {"content": [{"type": "text", "text": text}]},
            )
        except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
            respond(
                req_id,
                {
                    "content": [{"type": "text", "text": f"Fetch failed: {exc}"}],
                    "isError": True,
                },
            )
        return

    if req_id is not None:
        respond_error(req_id, -32601, f"Method not found: {method}")


def main() -> int:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        handle(msg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
