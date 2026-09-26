-- Abhar admin: make contract & receipt files private
-- Run AFTER deploying the new code. Safe to re-run.

begin;

-- 1) contract-pdfs becomes private (book-covers stays public: used by the QR book page)
update storage.buckets set public = false where id = 'contract-pdfs';

-- 2) contract-pdfs policies
--    contracts (root of bucket)  -> contracts module permissions
--    receipts/...                -> admin only
drop policy if exists contracts_read   on storage.objects;
drop policy if exists contracts_upload on storage.objects;

create policy contracts_read on storage.objects
  for select using (
    bucket_id = 'contract-pdfs' and (
      (name like 'receipts/%' and public.is_admin())
      or (name not like 'receipts/%' and public.has_view('contracts'))
    )
  );

create policy contracts_upload on storage.objects
  for insert with check (
    bucket_id = 'contract-pdfs' and (
      (name like 'receipts/%' and public.is_admin())
      or (name not like 'receipts/%' and public.has_edit('contracts'))
    )
  );

-- 3) Covers: only staff who can edit contracts may upload (was any logged-in user)
drop policy if exists covers_upload on storage.objects;
create policy covers_upload on storage.objects
  for insert with check (bucket_id = 'book-covers' and public.has_edit('contracts'));

-- 4) Convert old stored public URLs to plain object paths (new code handles both, this just tidies the data)
update public.books
set contract_pdf_url = regexp_replace(contract_pdf_url, '^.*/contract-pdfs/', '')
where contract_pdf_url like '%/contract-pdfs/%';

update public.expenses
set receipt_url = regexp_replace(receipt_url, '^.*/contract-pdfs/', '')
where receipt_url like '%/contract-pdfs/%';

commit;
