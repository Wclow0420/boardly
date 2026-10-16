"""Each player's mascot: the Boardly meeple, dressed.

The drawings live in the app (boardly/src/features/mascot); the server
owns which items exist and what each costs, in mascot_catalog.json,
written from the app by boardly/scripts/export-mascot-catalog.mjs.

A look is {"skin": id, "colour": "#hex", "wear": {slot: id}}. Items are
keyed "slot:id" ("hat:crown", "skin:gingerbread"); free ones belong to
everyone, the rest are bought and kept in User.owned_mascot.
"""

import json
from pathlib import Path

_CATALOG = json.loads((Path(__file__).parent / "mascot_catalog.json").read_text())

MASCOT_PRICES: dict[str, int] = _CATALOG["items"]
MASCOT_COLOURS: frozenset[str] = frozenset(c.upper() for c in _CATALOG["colours"])
SLOTS = frozenset(key.split(":", 1)[0] for key in MASCOT_PRICES) - {"skin"}

DEFAULT_LOOK = {
    "skin": "glossy",
    "colour": "#F5922E",
    "wear": {"eyes": "dots", "mouth": "smile"},
}


def look_items(look: dict) -> list[str]:
    """The item keys a look wears, its skin first."""
    keys = [f"skin:{look['skin']}"]
    keys += [f"{slot}:{item}" for slot, item in look.get("wear", {}).items()]
    return keys


def clean_look(raw) -> dict | None:
    """The look, if it is a well-formed one of known items; else None."""
    if not isinstance(raw, dict):
        return None
    skin, colour, wear = raw.get("skin"), raw.get("colour"), raw.get("wear", {})
    if not isinstance(skin, str) or not isinstance(colour, str) or not isinstance(wear, dict):
        return None
    if colour.upper() not in MASCOT_COLOURS:
        return None
    look = {"skin": skin, "colour": colour.upper(), "wear": {}}
    for slot, item in wear.items():
        if slot not in SLOTS or not isinstance(item, str):
            return None
        look["wear"][slot] = item
    if any(key not in MASCOT_PRICES for key in look_items(look)):
        return None
    return look


def owns_item(user, key: str) -> bool:
    return MASCOT_PRICES.get(key) == 0 or key in (user.owned_mascot or [])
