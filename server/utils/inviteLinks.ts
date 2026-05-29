/** Dev-mode store for invitation links shown in Settings UI. */
const inviteLinks = new Map<string, { email: string, role: string, url: string, createdAt: Date }>()

export function storeInviteLink(id: string, email: string, role: string, url: string) {
  inviteLinks.set(id, { email, role, url, createdAt: new Date() })
}

export function getInviteLinks() {
  return Array.from(inviteLinks.entries()).map(([id, data]) => ({ id, ...data }))
}

export function removeInviteLink(id: string) {
  inviteLinks.delete(id)
}
