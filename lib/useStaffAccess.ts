'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ModuleKey = 'contracts' | 'printing' | 'platforms' | 'warehouse' | 'orders'
type Perm = { can_view: boolean; can_edit: boolean }
type Access = { userId: string; email: string; isAdmin: boolean; permissions: Record<ModuleKey, Perm> }

// Module-level cache: every page renders its own SharedLayout, so without this the
// session + profile + permissions were re-fetched (3 round trips) on every navigation.
let cached: Access | null = null
let inflight: Promise<Access | null> | null = null
let listening = false

async function fetchAccess(): Promise<Access | null> {
  const supabase = createClient()
  // getSession reads the local session (no network). The data itself is protected by RLS.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return null
  const [{ data: profile }, { data: perms }] = await Promise.all([
    supabase.from('staff_profiles').select('is_admin').eq('id', user.id).maybeSingle(),
    supabase.from('staff_permissions').select('module, can_view, can_edit').eq('staff_id', user.id),
  ])
  const permissions = {} as Record<ModuleKey, Perm>
  perms?.forEach(p => { permissions[p.module as ModuleKey] = { can_view: p.can_view, can_edit: p.can_edit } })
  return { userId: user.id, email: user.email ?? '', isAdmin: Boolean(profile?.is_admin), permissions }
}

function loadAccess() {
  if (!listening) {
    listening = true
    // drop the cache whenever the logged-in user changes
    createClient().auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && session?.user.id !== cached?.userId)) { cached = null; inflight = null }
    })
  }
  if (!inflight) inflight = fetchAccess().then(result => { cached = result; return result }).catch(() => { inflight = null; return null })
  return inflight
}

export function clearStaffAccessCache() { cached = null; inflight = null }

export function useStaffAccess() {
  const [access, setAccess] = useState<Access | null>(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    let active = true
    loadAccess().then(result => { if (active) { setAccess(result); setLoading(false) } })
    return () => { active = false }
  }, [])

  const isAdmin = Boolean(access?.isAdmin)
  const permissions = access?.permissions ?? ({} as Record<ModuleKey, Perm>)

  const canView = useCallback(
    (moduleKey: ModuleKey) => isAdmin || Boolean(permissions[moduleKey]?.can_view),
    [isAdmin, permissions]
  )
  const canEdit = useCallback(
    (moduleKey: ModuleKey) => isAdmin || Boolean(permissions[moduleKey]?.can_edit),
    [isAdmin, permissions]
  )

  const signOut = async () => {
    await createClient().auth.signOut()
    clearStaffAccessCache()
    // full reload so no cached data from this user survives
    window.location.replace('/login')
  }

  return { loading, email: access?.email ?? '', isAdmin, permissions, canView, canEdit, signOut }
}
