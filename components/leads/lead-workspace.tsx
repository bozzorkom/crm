'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { currentUser, leads as initialLeads, type Lead, type LeadSource, type Need } from '@/lib/data'

export type NewLeadInput = {
  name: string
  phone?: string
  source: LeadSource
  request: string
  need: Need
}

type LeadWorkspaceValue = {
  leads: Lead[]
  addLead: (input: NewLeadInput) => Lead
  updateLead: (next: Lead) => void
}

const LeadWorkspaceContext = createContext<LeadWorkspaceValue | null>(null)

export function LeadWorkspaceProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState(initialLeads)

  function addLead(input: NewLeadInput) {
    const [firstName, lastName] = currentUser.name.split(' ')
    const owner = `${firstName} ${lastName?.[0] ?? ''}.`
    const lead: Lead = {
      id: `l-${crypto.randomUUID()}`,
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
      source: input.source,
      minutesAgo: 0,
      slaMinutes: 15,
      status: 'new',
      owner,
      request: input.request,
      need: input.need,
      sessionOnly: true,
      timeline: [
        {
          id: crypto.randomUUID(),
          kind: 'message',
          text: input.request,
          at: 'Только что',
          author: input.name.trim(),
        },
        {
          id: crypto.randomUUID(),
          kind: 'system',
          text: `Создано вручную из ${input.source} и назначено: ${owner}`,
          at: 'Только что',
        },
      ],
    }

    setLeads((current) => [lead, ...current])
    return lead
  }

  function updateLead(next: Lead) {
    setLeads((current) => current.map((lead) => (lead.id === next.id ? next : lead)))
  }

  return (
    <LeadWorkspaceContext.Provider value={{ leads, addLead, updateLead }}>
      {children}
    </LeadWorkspaceContext.Provider>
  )
}

export function useLeadWorkspace() {
  const workspace = useContext(LeadWorkspaceContext)
  if (!workspace) throw new Error('useLeadWorkspace must be used inside LeadWorkspaceProvider')
  return workspace
}
