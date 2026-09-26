-- Abhar admin: RLS hardening
-- Run once in Supabase -> SQL Editor. Safe to re-run.

begin;

-- ---------------------------------------------------------------
-- 1) Banned staff lose access immediately (not after token expiry)
-- ---------------------------------------------------------------
create or replace function public.is_active_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select not coalesce(banned, false) from staff_profiles where id = auth.uid()), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_admin and not coalesce(banned, false) from staff_profiles where id = auth.uid()), false);
$$;

create or replace function public.has_view(module_key text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_admin() or (
    public.is_active_staff() and coalesce(
      (select can_view from staff_permissions where staff_id = auth.uid() and module = module_key), false)
  );
$$;

create or replace function public.has_edit(module_key text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_admin() or (
    public.is_active_staff() and coalesce(
      (select can_edit from staff_permissions where staff_id = auth.uid() and module = module_key), false)
  );
$$;

-- "any logged-in user" -> "any active (not banned) staff"
drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings
  for select using (public.is_active_staff());

drop policy if exists exchange_rates_select on public.exchange_rates;
create policy exchange_rates_select on public.exchange_rates
  for select using (public.is_active_staff());

-- ---------------------------------------------------------------
-- 2) Expenses: admin only (was readable by every logged-in user)
-- ---------------------------------------------------------------
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select using (public.is_admin());

-- ---------------------------------------------------------------
-- 3) Notifications: staff only see notifications for sections they can view
-- ---------------------------------------------------------------
create or replace function public.can_see_notification(n_type text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select case n_type
    when 'book_added'      then public.has_view('contracts')
    when 'printing_added'  then public.has_view('printing')
    when 'warehouse_added' then public.has_view('warehouse')
    when 'low_stock'       then public.has_view('warehouse')
    when 'order_added'     then public.has_view('orders')
    when 'order_delivered' then public.has_view('orders')
    else public.is_admin()
  end;
$$;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (
    (user_id = auth.uid() and public.is_active_staff())
    or (user_id is null and public.can_see_notification(type))
  );

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (
    (user_id = auth.uid() and public.is_active_staff())
    or (user_id is null and public.can_see_notification(type))
  );

-- ---------------------------------------------------------------
-- 4) Orders: allow permanent delete from the trash (admin only)
-- ---------------------------------------------------------------
drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders
  for delete using (public.is_admin());

-- ---------------------------------------------------------------
-- 5) Pin search_path on SECURITY DEFINER trigger functions
-- ---------------------------------------------------------------
alter function public.log_expense_change()     set search_path = public;
alter function public.log_book_change()        set search_path = public;
alter function public.log_order_change()       set search_path = public;
alter function public.log_printing_change()    set search_path = public;
alter function public.log_warehouse_change()   set search_path = public;
alter function public.log_soft_delete()        set search_path = public;
alter function public.notify_book_added()      set search_path = public;
alter function public.notify_printing_added()  set search_path = public;
alter function public.notify_warehouse_added() set search_path = public;
alter function public.notify_order_event()     set search_path = public;

commit;
