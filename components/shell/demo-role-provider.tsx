'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { isWorkspaceRole, type WorkspaceRole } from '@/lib/roles'

type DemoRoleContextValue = {
  role: WorkspaceRole
  isRoleReady: boolean
  setRole: (role: WorkspaceRole) => void
}

const DemoRoleContext = createContext<DemoRoleContextValue | null>(null)
const storageKey = 'kalit-demo-role'

export function DemoRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<WorkspaceRole>('manager')
  const [isRoleReady, setIsRoleReady] = useState(false)

  useEffect(() => {
    try {
      const savedRole = window.localStorage.getItem(storageKey)
      if (isWorkspaceRole(savedRole)) setRoleState(savedRole)
    } catch {
      // The current demo session can still switch roles when storage is unavailable.
    } finally {
      setIsRoleReady(true)
    }
  }, [])

  const setRole = useCallback((nextRole: WorkspaceRole) => {
    setRoleState(nextRole)
    try {
      window.localStorage.setItem(storageKey, nextRole)
    } catch {
      // Keep the in-memory selection for this session if storage is unavailable.
    }
  }, [])

  return <DemoRoleContext.Provider value={{ role, isRoleReady, setRole }}>{children}</DemoRoleContext.Provider>
}

export function useDemoRole() {
  const value = useContext(DemoRoleContext)
  if (!value) throw new Error('useDemoRole must be used inside DemoRoleProvider')
  return value
}
