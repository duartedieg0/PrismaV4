export type BlockedUserState = {
  isBlocked: boolean;
  redirectTo: string;
  message: string;
};

export function createBlockedUserState(
  state: BlockedUserState,
): BlockedUserState {
  return state;
}
