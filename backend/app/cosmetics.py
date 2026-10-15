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
    # art borders: illustrations drawn round the avatar
    "dice-orbit": 1500,
    "card-fan": 1500,
    "sakura": 1600,
    "meeple-parade": 1800,
    "campfire": 3000,
    "glacier": 2500,
    "thunderstorm": 2800,
    "ghost-lantern": 3000,
    "galaxy": 3500,
    "lion-dance": 4500,
    "phoenix": 5000,
    "fire-dragon": 4000,
    "angel-wings": 5500,
    "dragon-head": 6000,
}

# Borders that can't be bought: each comes with a badge.
EARNED_BORDERS = {
    "seal-halo": "nightwatch.ghostbreaker",
    "winter-hearth": "shelter.lastWinter",
    "spymaster": "avalon.spymaster",
    "table-legend": "boardly.legend",
}

BORDER_IDS = frozenset(BORDER_PRICES) | frozenset(EARNED_BORDERS)


def owns_border(user, border_id) -> bool:
    if border_id in EARNED_BORDERS:
        # local import: outcomes reads the games, which read the models
        from app.outcomes import has_badge

        return has_badge(user.id, EARNED_BORDERS[border_id])
    return BORDER_PRICES.get(border_id) == 0 or border_id in (user.owned_borders or [])
