"""How a bot plays Shelter, from its own view of the game."""


def shelter(view, seat, rng):
    """Survivors keep the storeroom fed and guard now and then; the
    Infected sabotages, steals and opens the door when it can."""
    if not view["canAct"]:
        return None
    phase = view["phase"]
    infected = view["myRole"] == "infected"
    standing = [s for s, st in enumerate(view["status"]) if st == "ok"]
    if phase == "vote":
        # Vote out whoever this bot saw striking; otherwise usually no one
        seen = [s for note in view["log"] if note["kind"] == "guarded"
                for s in note["saw"] if s in standing and s != seat]
        if seen and not infected:
            return {"type": "vote", "target": seen[-1]}
        others = [s for s in standing if s != seat]
        if others and rng.random() < 0.15:
            return {"type": "vote", "target": rng.choice(others)}
        return {"type": "vote", "target": -1}
    if phase == "search":
        return {"type": "search", "place": rng.choice(view["places"])}
    if phase == "play":
        hand = view["myHand"]
        if infected and rng.random() < 0.6:
            return {"type": "play", "card": "sabotage"}
        worth = {"f1": 1, "f2": 2, "f3": 3, "none": 0, "mold1": -1,
                 "mold2": -2, "zombie": -1, "medicine": 1}
        pick = (min if infected else max)(range(len(hand)), key=lambda i: worth[hand[i]])
        return {"type": "play", "card": pick}
    if phase == "night":
        roll = rng.random()
        if infected:
            post = "store" if roll < 0.45 else "door" if roll < 0.65 else "sleep"
            move = {"type": "night", "post": post}
            if post != "sleep" and view["myStealth"] and rng.random() < 0.3:
                move["stealth"] = True
            return move
        post = "store" if roll < 0.3 else "door" if roll < 0.45 else "sleep"
        return {"type": "night", "post": post}
    return None
