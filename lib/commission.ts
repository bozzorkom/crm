import type { Commission } from './data'

export function splitCommission(c: Commission) {
  const partner = c.partner ? Math.round((c.total * c.partner.share) / 100) : 0
  const internal = c.total - partner
  const agent = Math.round((internal * c.agentShare) / 100)
  return { partner, agent, agency: internal - agent }
}
