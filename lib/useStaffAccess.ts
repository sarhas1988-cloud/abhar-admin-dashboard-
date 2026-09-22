'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export type ModuleKey = 'contracts' | 'printing' | 'platforms' | 'warehouse' | 'orders'
type Perm = { can_view: boolean; can_edit: boolean }

export function useStaffAccess() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [permissions, setPermissions] = useState<Record<ModuleKey, Perm>>({} as Record<ModuleKey, Perm>)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setEmail(user.email ?? '')
      const { data: profile } = await supabase.from('staff_profiles').select('is_admin').eq('id', user.id).single()
      setIsAdmin(Boolean(profile?.is_admin))
      const { data: perms } = await supabase.from('staff_permissions').select('module, can_view, can_edit').eq('staff_id', user.id)
      const map = {} as Record<ModuleKey, Perm>
      perms?.forEach(p => { map[p.module as ModuleKey] = { can_view: p.can_view, can_edit: p.can_edit } })
      setPermissions(map)
      setLoading(false)
    })
  }, [])

  const canView = (moduleKey: ModuleKey) => isAdmin || Boolean(permissions[moduleKey]?.can_view)
  const canEdit = (moduleKey: ModuleKey) => isAdmin || Boolean(permissions[moduleKey]?.can_edit)

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return { loading, email, isAdmin, permissions, canView, canEdit, signOut }
}
