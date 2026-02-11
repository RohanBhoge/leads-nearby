-- Create a new storage bucket for profiles
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;

-- Set up access policies for the profiles bucket
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'profiles' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'profiles' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'profiles' );

-- Create a new storage bucket for lead proofs
insert into storage.buckets (id, name, public)
values ('lead-proofs', 'lead-proofs', true)
on conflict (id) do nothing;

-- Set up access policies for the lead-proofs bucket
create policy "Proof images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'lead-proofs' );

create policy "Authenticated users can upload proofs."
  on storage.objects for insert
  with check ( bucket_id = 'lead-proofs' and auth.role() = 'authenticated' );
