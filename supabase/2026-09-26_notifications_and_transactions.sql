-- Abhar admin: per-user notification reads + atomic save for books and orders
-- Run once in Supabase -> SQL Editor. Safe to re-run.

begin;

-- ---------------------------------------------------------------
-- 1) Per-user "read" state for notifications
-- ---------------------------------------------------------------
-- notification_id uses the same type as notifications.id (uuid or bigint)
do $$
declare id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into id_type
  from pg_attribute a
  where a.attrelid = 'public.notifications'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.notification_reads (
      notification_id %s not null references public.notifications(id) on delete cascade,
      user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
      read_at timestamptz not null default now(),
      primary key (notification_id, user_id)
    )$f$, id_type);
end $$;

alter table public.notification_reads enable row level security;
grant select, insert on public.notification_reads to authenticated;

drop policy if exists notification_reads_select_own on public.notification_reads;
create policy notification_reads_select_own on public.notification_reads
  for select using (user_id = auth.uid());

drop policy if exists notification_reads_insert_own on public.notification_reads;
create policy notification_reads_insert_own on public.notification_reads
  for insert with check (user_id = auth.uid() and public.is_active_staff());

-- keep what was already marked read (the old shared flag) as read for everyone
insert into public.notification_reads (notification_id, user_id)
select n.id, s.id
from public.notifications n
cross join public.staff_profiles s
where n.read = true
on conflict do nothing;

-- nobody updates notification rows anymore
drop policy if exists notifications_update_own on public.notifications;

-- ---------------------------------------------------------------
-- 2) save_book: book + authors in one transaction
--    Runs with the caller's permissions (RLS still applies).
-- ---------------------------------------------------------------
create or replace function public.save_book(
  p_book_id text,
  p_book jsonb,
  p_authors jsonb,
  p_author_phone text default null
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  r books;
  v_id books.id%type;
  v_author authors.id%type;
  v_name text;
begin
  r := jsonb_populate_record(null::books, p_book);
  if coalesce(trim(r.title), '') = '' then
    raise exception 'اسم الكتاب مطلوب';
  end if;

  if p_book_id is null then
    insert into books (
      permit, isbn, title, category, printed_copies, free_copies, size, paper_type, print_color, brief,
      profit_percent, author_phone, price_egp, price_aed, price_sar, price_usd, contract_date, season,
      translator, cover_type, cover_notes, contract_pdf_url, cover_image_url, parent_book_id
    ) values (
      r.permit, r.isbn, trim(r.title), r.category, r.printed_copies, r.free_copies, r.size, r.paper_type, r.print_color, r.brief,
      r.profit_percent, r.author_phone, r.price_egp, r.price_aed, r.price_sar, r.price_usd, r.contract_date, r.season,
      r.translator, r.cover_type, r.cover_notes, r.contract_pdf_url, r.cover_image_url, r.parent_book_id
    )
    returning id into v_id;
  else
    update books set
      permit = r.permit, isbn = r.isbn, title = trim(r.title), category = r.category,
      printed_copies = r.printed_copies, free_copies = r.free_copies, size = r.size,
      paper_type = r.paper_type, print_color = r.print_color, brief = r.brief,
      profit_percent = r.profit_percent, author_phone = r.author_phone,
      price_egp = r.price_egp, price_aed = r.price_aed, price_sar = r.price_sar, price_usd = r.price_usd,
      contract_date = r.contract_date, season = r.season, translator = r.translator,
      cover_type = r.cover_type, cover_notes = r.cover_notes,
      contract_pdf_url = r.contract_pdf_url, cover_image_url = r.cover_image_url,
      parent_book_id = r.parent_book_id
    where id::text = p_book_id
    returning id into v_id;

    if v_id is null then
      raise exception 'الكتاب مش موجود أو مالكش صلاحية تعديله';
    end if;

    delete from book_authors where book_id = v_id;
  end if;

  for v_name in
    select distinct trim(t.val) from jsonb_array_elements_text(coalesce(p_authors, '[]'::jsonb)) as t(val)
    where trim(t.val) <> ''
  loop
    select id into v_author from authors where name = v_name limit 1;
    if v_author is null then
      insert into authors (name, phone) values (v_name, p_author_phone) returning id into v_author;
    end if;
    insert into book_authors (book_id, author_id) values (v_id, v_author);
  end loop;

  return v_id::text;
end;
$$;

revoke execute on function public.save_book(text, jsonb, jsonb, text) from public, anon;
grant execute on function public.save_book(text, jsonb, jsonb, text) to authenticated;

-- ---------------------------------------------------------------
-- 3) save_order: order + items in one transaction
-- ---------------------------------------------------------------
create or replace function public.save_order(
  p_order_id text,
  p_order jsonb,
  p_items jsonb
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  r orders;
  v_id orders.id%type;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'الأوردر لازم يكون فيه كتاب واحد على الأقل';
  end if;

  r := jsonb_populate_record(null::orders, p_order);
  if coalesce(trim(r.customer_name), '') = '' then
    raise exception 'اسم العميل مطلوب';
  end if;

  if p_order_id is null then
    insert into orders (
      customer_name, customer_phone, customer_address, price, source,
      order_date, received_date, delivered_date, delivered, book_id
    ) values (
      trim(r.customer_name), r.customer_phone, r.customer_address, r.price, r.source,
      r.order_date, r.received_date, r.delivered_date, coalesce(r.delivered, false), r.book_id
    )
    returning id into v_id;
  else
    update orders set
      customer_name = trim(r.customer_name), customer_phone = r.customer_phone,
      customer_address = r.customer_address, price = r.price, source = r.source,
      order_date = r.order_date, received_date = r.received_date,
      delivered_date = r.delivered_date, delivered = coalesce(r.delivered, false), book_id = r.book_id
    where id::text = p_order_id and deleted_at is null
    returning id into v_id;

    if v_id is null then
      raise exception 'الأوردر مش موجود أو مالكش صلاحية تعديله';
    end if;

    delete from order_items where order_id = v_id;
  end if;

  insert into order_items (order_id, book_id, quantity, unit_price)
  select v_id, x.book_id, greatest(coalesce(x.quantity, 1), 1), coalesce(x.unit_price, 0)
  from jsonb_populate_recordset(null::order_items, p_items) as x
  where x.book_id is not null;

  return v_id::text;
end;
$$;

revoke execute on function public.save_order(text, jsonb, jsonb) from public, anon;
grant execute on function public.save_order(text, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------
-- 4) Covers: allow deleting a freshly uploaded cover when a save fails
-- ---------------------------------------------------------------
drop policy if exists covers_delete on storage.objects;
create policy covers_delete on storage.objects
  for delete using (bucket_id = 'book-covers' and public.has_edit('contracts'));

commit;
