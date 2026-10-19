export type WorkspaceRole = 'agent' | 'manager' | 'owner'

export const workspaceRoles: { id: WorkspaceRole; label: string }[] = [
  { id: 'agent', label: 'Агент' },
  { id: 'manager', label: 'Руководитель' },
  { id: 'owner', label: 'Владелец' },
]

export function isWorkspaceRole(value: string | null): value is WorkspaceRole {
  return value === 'agent' || value === 'manager' || value === 'owner'
}

export function canViewAgencyPages(role: WorkspaceRole) {
  return role === 'manager' || role === 'owner'
}
