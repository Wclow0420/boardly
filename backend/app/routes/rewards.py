from datetime import datetime, timezone

from flask import Blueprint, g

from app.auth import require_auth
from app.extensions import db
from app.models import CoinReward, User

rewards_bp = Blueprint("rewards", __name__)


def _unclaimed(user_id):
    return CoinReward.query.filter_by(user_id=user_id, claimed_at=None)


@rewards_bp.get("")
@require_auth
def list_rewards():
    """Coins earned from finished games that are waiting to be claimed."""
    rewards = _unclaimed(g.current_user.id).order_by(CoinReward.created_at).all()
    return {
        "rewards": [reward.to_dict() for reward in rewards],
        "total": sum(reward.amount for reward in rewards),
    }


@rewards_bp.post("/claim")
@require_auth
def claim_rewards():
    """Move every waiting reward onto the coin balance."""
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
