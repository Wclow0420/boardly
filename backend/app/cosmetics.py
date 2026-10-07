"""Profile borders a player can wear around their avatar.

The designs live in the app (boardly/src/features/cosmetics/borders.ts);
the server owns which ids exist and what each costs in coins. Keep the
two lists in step.
"""

DEFAULT_BORDER = "wood"

# id -> price in coins. Free borders belong to everyone.
BORDER_PRICES = {
    "wood": 0,
    "none": 0,
    "octagon": 200,
    "shield": 250,
    "royal": 600,
    "golden-aura": 700,
    "neon-green": 1000,
    "ripple": 1000,
    "vaporwave": 1200,
    "ember": 1200,
    "frost": 1200,
}

BORDER_IDS = frozenset(BORDER_PRICES)


def owns_border(user, border_id) -> bool:
    return BORDER_PRICES.get(border_id) == 0 or border_id in (user.owned_borders or [])
