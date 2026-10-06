"""Profile borders a player can wear around their avatar.

The designs live in the app (boardly/src/features/cosmetics/borders.ts);
the server only needs to know which ids exist. Keep the two lists in step.
"""

DEFAULT_BORDER = "wood"

BORDER_IDS = frozenset(
    {
        "wood",
        "none",
        "octagon",
        "shield",
        "royal",
        "golden-aura",
        "neon-green",
        "ripple",
        "vaporwave",
        "ember",
        "frost",
    }
)
