'use client'

import { createClient } from '@/lib/supabase/client'

// Supabase Storage rejects keys with Arabic/special characters ("Invalid key"),
// so uploads now use a generated ASCII name and keep only the extension.
export function safeStoragePath(file: File, prefix = '') {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}${Date.now()}-${random}.${ext}`
}

// Rows may hold a full public URL (old uploads) or just the object path (new uploads).
export function toStoragePath(bucket: string, stored: string) {
  const marker = `/${bucket}/`
  const index = stored.indexOf(marker)
  const path = index >= 0 ? stored.slice(index + marker.length) : stored
  return decodeURIComponent(path.split('?')[0])
}

// Opens a file from a private bucket through a short-lived signed URL.
// The tab is opened synchronously first so mobile/Safari popup blockers don't block it.
export async function openPrivateFile(bucket: string, stored: string) {
  const tab = window.open('', '_blank')
  const { data, error } = await createClient().storage.from(bucket).createSignedUrl(toStoragePath(bucket, stored), 60)
  if (error || !data?.signedUrl) {
    tab?.close()
    return false
  }
  if (tab) tab.location.href = data.signedUrl
  else window.location.href = data.signedUrl
  return true
}
