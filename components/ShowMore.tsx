'use client'

import { useEffect, useState } from 'react'

// Renders long tables in chunks so the page stays fast; filters/totals still use the full list.
export function useVisibleRows<T>(rows: T[], step = 50, resetKey?: unknown) {
  const [limit, setLimit] = useState(step)
  useEffect(() => { setLimit(step) }, [resetKey, step])
  return {
    visible: rows.slice(0, limit),
    remaining: Math.max(rows.length - limit, 0),
    showMore: () => setLimit(current => current + step),
  }
}

export function ShowMoreButton({ remaining, onClick, step = 50 }: { remaining: number; onClick: () => void; step?: number }) {
  if (remaining <= 0) return null
  return (
    <div className="flex justify-center border-t border-[#ede4d7] p-4">
      <button type="button" onClick={onClick} className="rounded-xl border border-[#e8dfd3] bg-white px-5 py-2.5 text-xs font-semibold text-[#d8573a] transition hover:bg-[#faf1eb]">
        عرض {Math.min(step, remaining).toLocaleString('en-US')} كمان ({remaining.toLocaleString('en-US')} متبقي)
      </button>
    </div>
  )
}
