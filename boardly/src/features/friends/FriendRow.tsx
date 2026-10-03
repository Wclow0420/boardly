import type { Friend } from "@/data/types";
import { FriendListItem } from "./FriendListItem";
import { useFriendActions } from "./hooks";

export interface FriendRowProps {
  friend: Friend;
  /** Show the "more" button on friends (e.g. to remove them). */
  onMore?: (friend: Friend) => void;
}

/** FriendListItem wired to the friends API. */
export function FriendRow({ friend, onMore }: FriendRowProps) {
  const actions = useFriendActions(friend);

  return (
    <FriendListItem
      friend={friend}
      note={actions.note}
      busy={actions.busy}
      onInvite={actions.invite}
      onMore={onMore ? () => onMore(friend) : undefined}
      onAdd={actions.add}
      onAccept={actions.accept}
      onDecline={actions.removeRequest}
      onCancel={actions.removeRequest}
    />
  );
}
