-- Run once in Supabase → SQL Editor

-- 1) Printing: printer name, printing location, shipping date
alter table public.printing_jobs
  add column if not exists printer_name text,
  add column if not exists printing_location text,
  add column if not exists shipped_at date;

-- 2) Staff invites: links no longer expire
--    (the app no longer checks expires_at; this just cleans up the column)
alter table public.staff_invitations alter column expires_at drop default;
alter table public.staff_invitations alter column expires_at drop not null;
update public.staff_invitations set expires_at = null where used_at is null;
