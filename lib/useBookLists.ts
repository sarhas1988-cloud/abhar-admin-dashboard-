'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Book categories / paper types / cover types come from Settings (app_settings),
// the defaults are only used until the settings load or if a list was never saved.
export type BookLists = { categories: string[]; paperTypes: string[]; coverTypes: string[] }

const defaults: BookLists = {
  categories: ['رواية', 'شعر', 'تطوير ذات', 'أدب', 'أطفال', 'ديني', 'أخرى'],
  paperTypes: ['أبيض', 'بلك', 'art'],
  coverTypes: ['سوفت', 'هارد'],
}

let cached: BookLists | null = null
let inflight: Promise<BookLists> | null = null

const asList = (value: unknown, fallback: string[]) =>
  Array.isArray(value) && value.length ? value.map(String) : fallback

function loadLists() {
  if (!inflight) {
    inflight = Promise.resolve(
      createClient().from('app_settings').select('key, value').in('key', ['categories', 'paper_types', 'cover_types'])
    ).then(({ data }) => {
      const byKey = Object.fromEntries((data ?? []).map(row => [row.key, row.value]))
      cached = {
        categories: asList(byKey.categories, defaults.categories),
        paperTypes: asList(byKey.paper_types, defaults.paperTypes),
        coverTypes: asList(byKey.cover_types, defaults.coverTypes),
      }
      return cached
    }).catch(() => { inflight = null; return defaults })
  }
  return inflight
}

// call after saving a list in Settings so other pages pick up the change without a reload
export function clearBookListsCache() { cached = null; inflight = null }

export function useBookLists() {
  const [lists, setLists] = useState<BookLists>(cached ?? defaults)
  useEffect(() => {
    let active = true
    loadLists().then(result => { if (active) setLists(result) })
    return () => { active = false }
  }, [])
  return lists
}

// keep a value that was removed from Settings selectable for books that already use it
export function withCurrent(list: string[], current?: string | null) {
  return current && !list.includes(current) ? [...list, current] : list
}
