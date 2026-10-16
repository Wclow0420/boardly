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
    "neon-green": 2200,
    "ripple": 2400,
    "vaporwave": 3000,
    "ember": 2800,
    "frost": 2600,
    # art borders: illustrations drawn round the avatar
    "dice-orbit": 1500,
    "card-fan": 1500,
    "sakura": 1600,
    "meeple-parade": 1800,
    "campfire": 3000,
    "glacier": 2500,
    "thunderstorm": 2800,
    "ghost-lantern": 1800,
    "galaxy": 3500,
    "phoenix": 5000,
    "fire-dragon": 4000,
    "angel-wings": 2000,
    "seraph-wings": 5000,
    "fallen-angel": 5000,
    "winged-crest": 3800,
    "baroque-silver": 3800,
    "imperial-dragon": 12000,
    "celestial-throne": 15000,
    "archangel": 16000,
    "phoenix-reborn": 18000,
    "void-emperor": 25000,
    "clockwork": 12000,
    "krakens-deep": 14000,
    "grand-board": 20000,
    "lunar-new-year": 12000,
    "cherry-shrine": 10000,
    "king-crown": 5000,
    "queen-crown": 5000,
    # rim borders: the effect is the ring
    "black-hole": 6000,
    "molten-lava": 4500,
    "shadow-flame": 4500,
    "aurora": 4000,
    "tidal-wave": 4000,
    "plasma-core": 5000,
    "toxic": 3500,
    "divine-light": 5000,
    "prism": 4000,
    "blood-moon": 4500,
}

# Borders that can't be bought: each comes with a badge.
# border -> (badge, the level of it that brings the border)
EARNED_BORDERS = {
    "seal-halo": ("nightwatch.ghostbreaker", "gold"),
    "winter-hearth": ("shelter.lastWinter", "gold"),
    "spymaster": ("avalon.spymaster", "gold"),
    "table-legend": ("boardly.regular", "diamond"),
}

BORDER_IDS = frozenset(BORDER_PRICES) | frozenset(EARNED_BORDERS)


def owns_border(user, border_id) -> bool:
    if border_id in EARNED_BORDERS:
        # local import: outcomes reads the games, which read the models
        from app.outcomes import has_badge

        return has_badge(user.id, *EARNED_BORDERS[border_id])
    return BORDER_PRICES.get(border_id) == 0 or border_id in (user.owned_borders or [])
