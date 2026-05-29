import { getInviteLinks } from '../../utils/inviteLinks'
import { requireActiveOrg } from '../../utils/authSession'

export default defineEventHandler(async (event) => {
  await requireActiveOrg(event)
  return { invites: getInviteLinks() }
})
