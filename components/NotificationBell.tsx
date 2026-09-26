'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, BookOpen, CheckCheck, Factory, Package, ShoppingCart, TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Notification = { id: string; type: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string }

const typeIcon: Record<string, typeof Bell> = {
  book_added: BookOpen, printing_added: Factory, warehouse_added: Package,
  low_stock: TriangleAlert, order_added: ShoppingCart, order_delivered: CheckCheck,
}
const typeColor: Record<string, string> = {
  book_added: 'text-[#d8573a] bg-[#faf1eb]', printing_added: 'text-[#8a5a1a] bg-[#fbeed6]',
  warehouse_added: 'text-[#4a7a2c] bg-[#e8f2df]', low_stock: 'text-[#c04a2f] bg-[#f7dbd3]',
  order_added: 'text-[#b8752f] bg-[#fdf6ef]', order_delivered: 'text-[#4a7a2c] bg-[#e8f2df]',
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'الآن'
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`
  return `منذ ${Math.floor(diff / 86400)} يوم`
}

// keep the last result so the bell renders instantly when switching pages
let cachedItems: Notification[] | null = null

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>(cachedItems ?? [])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(!cachedItems)
  const boxRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // "read" is per user now: stored in notification_reads, not on the shared notification row
  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user.id
    const { data } = await supabase.from('notifications').select('id, type, title, body, link, created_at').order('created_at', { ascending: false }).limit(15)
    const list = (data ?? []) as Omit<Notification, 'read'>[]
    let readIds = new Set<string>()
    if (userId && list.length) {
      const { data: reads } = await supabase.from('notification_reads').select('notification_id').eq('user_id', userId).in('notification_id', list.map(n => n.id))
      readIds = new Set((reads ?? []).map(r => String(r.notification_id)))
    }
    cachedItems = list.map(n => ({ ...n, read: readIds.has(String(n.id)) }))
    setItems(cachedItems)
    setLoading(false)
  }

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return
    const { error } = await supabase.from('notification_reads').upsert(ids.map(id => ({ notification_id: id })), { onConflict: 'notification_id,user_id', ignoreDuplicates: true })
    if (error) return
    cachedItems = (cachedItems ?? items).map(i => ids.includes(i.id) ? { ...i, read: true } : i)
    setItems(cachedItems)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => load()).subscribe()
    const handleClick = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => { supabase.removeChannel(channel); document.removeEventListener('mousedown', handleClick) }
  }, [])

  const markAllRead = () => markRead(items.filter(i => !i.read).map(i => i.id))

  const unreadCount = items.filter(i => !i.read).length

  return (
    <div ref={boxRef} className="relative">
      <button onClick={() => setOpen(v => !v)} aria-label="الإشعارات"
        className="relative flex size-10 items-center justify-center rounded-xl border border-[#e8dfd3] bg-white text-[#6b5d53] transition hover:border-[#d8573a] hover:text-[#d8573a]">
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#d8573a] text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-[#e8dfd3] bg-white shadow-[0_12px_40px_-8px_rgba(90,60,40,0.2)] sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-[#ede4d7] bg-[#fdf9f4] px-4 py-3">
            <div><p className="font-serif text-sm font-semibold">الإشعارات</p><p className="text-[10px] text-[#a3907e]">{unreadCount > 0 ? `${unreadCount} إشعار جديد` : 'كل الإشعارات مقروءة'}</p></div>
            {unreadCount > 0 && <button onClick={markAllRead} className="text-[11px] font-semibold text-[#d8573a] hover:underline">تعليم الكل مقروء</button>}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-xs text-[#a3907e]">جارٍ التحميل...</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center"><Bell size={22} className="text-[#c4b3a1]" /><p className="text-xs text-[#a3907e]">لا توجد إشعارات بعد</p></div>
            ) : (
              items.map(item => {
                const Icon = typeIcon[item.type] ?? Bell
                const colorClass = typeColor[item.type] ?? 'text-[#6b5d53] bg-[#f5ede2]'
                const inner = (
                  <div className={`flex gap-3 border-b border-[#f0e7db] p-4 transition last:border-0 hover:bg-[#fdf9f4] ${!item.read ? 'bg-[#fdf9f4]/60' : ''}`}>
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${colorClass}`}><Icon size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#2a211c]">{item.title}</p>
                      {item.body && <p className="mt-0.5 truncate text-xs text-[#6b5d53]">{item.body}</p>}
                      <p className="mt-1 text-[10px] text-[#a3907e]">{timeAgo(item.created_at)}</p>
                    </div>
                    {!item.read && <span className="mt-1.5 block size-2 shrink-0 rounded-full bg-[#d8573a]" />}
                  </div>
                )
                const onOpen = () => { if (!item.read) markRead([item.id]) }
                return item.link ? <Link key={item.id} href={item.link} onClick={() => { onOpen(); setOpen(false) }}>{inner}</Link> : <div key={item.id} onClick={onOpen}>{inner}</div>
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
