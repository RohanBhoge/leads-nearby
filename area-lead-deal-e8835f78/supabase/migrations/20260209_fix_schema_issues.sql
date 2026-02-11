-- Add completed_at to leads table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'leads' and column_name = 'completed_at') then
    alter table public.leads add column completed_at timestamp with time zone;
  end if;
end $$;

-- Add profile_image to profiles table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'profile_image') then
    alter table public.profiles add column profile_image text;
  end if;
end $$;
