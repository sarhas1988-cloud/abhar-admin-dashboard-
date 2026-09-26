-- Allow removing contract files from the site (same rules as upload)
drop policy if exists contracts_delete on storage.objects;
create policy contracts_delete on storage.objects
  for delete using (
    bucket_id = 'contract-pdfs' and (
      (name like 'receipts/%' and public.is_admin())
      or (name not like 'receipts/%' and public.has_edit('contracts'))
    )
  );
