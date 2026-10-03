"""Shared API helpers — one error envelope everywhere:
{"error": {"code": "...", "message": "..."}}. Clients switch on `code`
and display `message`."""


def api_error(code: str, message: str, status: int):
    return {"error": {"code": code, "message": message}}, status
