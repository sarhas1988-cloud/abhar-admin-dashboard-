'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CompanyInfo = { name: string; phone: string; email: string; address: string }

const fallback: CompanyInfo = { name: 'إبهار للتوزيع والنشر', phone: '', email: '', address: '' }

// cached for the whole session so it isn't re-fetched on every page
let cached: CompanyInfo | null = null
let inflight: Promise<CompanyInfo> | null = null

function loadCompany() {
  if (!inflight) {
    inflight = Promise.resolve(createClient().from('app_settings').select('value').eq('key', 'company').maybeSingle())
      .then(({ data }) => { cached = (data?.value as CompanyInfo) || fallback; return cached })
      .catch(() => { inflight = null; return fallback })
  }
  return inflight
}

// call after saving company settings so the new name shows immediately
export function setCompanyInfoCache(info: CompanyInfo) { cached = info; inflight = Promise.resolve(info) }

export function useCompanyInfo() {
  const [company, setCompany] = useState<CompanyInfo>(cached ?? fallback)
  const [loaded, setLoaded] = useState(Boolean(cached))

  useEffect(() => {
    let active = true
    loadCompany().then(info => { if (active) { setCompany(info); setLoaded(true) } })
    return () => { active = false }
  }, [])

  return { company, loaded }
}
