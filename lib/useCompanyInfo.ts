'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CompanyInfo = { name: string; phone: string; email: string; address: string }

const fallback: CompanyInfo = { name: 'إبهار للتوزيع والنشر', phone: '', email: '', address: '' }

export function useCompanyInfo() {
  const [company, setCompany] = useState<CompanyInfo>(fallback)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('app_settings').select('value').eq('key', 'company').maybeSingle().then(({ data }) => {
      if (data?.value) setCompany(data.value as CompanyInfo)
      setLoaded(true)
    })
  }, [])

  return { company, loaded }
}
