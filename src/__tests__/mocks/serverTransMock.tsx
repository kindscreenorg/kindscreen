import React from 'react'

/**
 * Sync mock for ServerTrans used in ManageReviewersPage tests
 * to avoid async component / suspense in client-style render.
 */
export function ServerTrans({ i18nKey }: { i18nKey: string }) {
  const text =
    i18nKey === 'reviewPage.manageReviewersAdmin'
      ? 'You can promote/demote moderators.'
      : 'You can grant or revoke Trusted status.'
  return React.createElement('span', {}, text)
}
