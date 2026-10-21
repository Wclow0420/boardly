from datetime import datetime, timezone

from flask import Blueprint, g

from app.auth import require_auth
from app.extensions import db
from app.models import CoinReward, User

rewards_bp = Blueprint("rewards", __name__)


def _unclaimed(user_id):
    return CoinReward.query.filter_by(user_id=user_id, claimed_at=None)


# How many of the latest payments GET /rewards lists
RECENT = 10


@rewards_bp.get("")
@require_auth
def list_rewards():
    """What my latest games paid (`recent`, newest first). The coins went
    onto the balance when each game ended (app/rewards.py). `rewards`
    and `total` are what is still waiting to be claimed: always nothing
    now, kept for older apps."""
    me = g.current_user.id
    waiting = _unclaimed(me).order_by(CoinReward.created_at).all()
    recent = (
        CoinReward.query.filter_by(user_id=me)
        .order_by(CoinReward.created_at.desc())
        .limit(RECENT)
        .all()
    )
    return {
        "rewards": [reward.to_dict() for reward in waiting],
        "total": sum(reward.amount for reward in waiting),
        "recent": [reward.to_dict() for reward in recent],
    }


@rewards_bp.post("/claim")
@require_auth
def claim_rewards():
    """For older apps that still claim: move anything waiting onto the
    coin balance (nothing waits any more, so this pays 0)."""
    # Lock the account row so two taps cannot pay out twice
    me = db.session.get(
        User, g.current_user.id, with_for_update=True, populate_existing=True
    )
    rewards = _unclaimed(me.id).with_for_update().all()
    total = sum(reward.amount for reward in rewards)
    now = datetime.now(timezone.utc)
    for reward in rewards:
        reward.claimed_at = now
    me.coins += total
    db.session.commit()
    return {"claimed": total, "user": me.to_self_dict()}
