// Skeleton pulse block
const WIDTHS = ['72%', '88%', '64%', '80%', '56%', '76%', '68%', '92%']

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#f0e7db] ${className}`} />
}

// Skeleton rows for a table
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[#f0e7db]">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-4 animate-pulse rounded-lg bg-[#f0e7db]" style={{ width: WIDTHS[(i * cols + j) % WIDTHS.length] }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// Skeleton for a stat card value
export function StatSkeleton() {
  return <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-[#f0e7db]" />
}

// Spinner SVG for inside buttons
export function Spinner({ size = 15, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path fill="currentColor" className="opacity-80" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
