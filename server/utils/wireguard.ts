import { createHash, randomBytes } from 'crypto'
import { prisma } from '../lib/prisma'

export function generateWireguardKeypair(connectionId: string) {
  const seed = createHash('sha256').update(`wg:${connectionId}:${randomBytes(8).toString('hex')}`).digest()
  const publicKey = seed.toString('base64url').slice(0, 44)
  const privateKeyRef = `wg-ref-${connectionId.slice(-8)}`
  return { publicKey, privateKeyRef }
}

export async function ensureWireguardPeer(orgId: string, connectionId: string) {
  const existing = await prisma.connectionWireguardPeer.findUnique({ where: { connectionId } })
  if (existing) return existing

  const { publicKey, privateKeyRef } = generateWireguardKeypair(connectionId)
  const peer = await prisma.connectionWireguardPeer.create({
    data: {
      connectionId,
      orgId,
      publicKey,
      privateKeyRef,
      peerConfig: {
        interface: 'wg0',
        listenPort: 51820,
        address: '10.8.0.2/32'
      }
    }
  })

  await prisma.dashboardConnection.update({
    where: { id: connectionId },
    data: { wireguardPublicKey: publicKey }
  })

  return peer
}
