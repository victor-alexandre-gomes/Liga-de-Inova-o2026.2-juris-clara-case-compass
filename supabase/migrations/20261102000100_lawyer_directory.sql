create table public.lawyer_directory (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 100),
  description text not null default '' check (char_length(description) <= 1200),
  practice_areas text[] not null default '{}'
    check (
      cardinality(practice_areas) <= 8
      and array_position(practice_areas, '') is null
      and char_length(array_to_string(practice_areas, '')) <= 640
    ),
  city text not null default '' check (char_length(city) <= 120),
  contact_email text not null default '' check (char_length(contact_email) <= 254),
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

create index lawyer_directory_published_name_idx
  on public.lawyer_directory (display_name)
  where is_published = true;

alter table public.lawyer_directory enable row level security;

grant select, insert, update, delete on public.lawyer_directory to authenticated;

create policy "lawyers read own directory profile"
  on public.lawyer_directory for select to authenticated
  using (auth.uid() = user_id);

create policy "lawyers create own directory profile"
  on public.lawyer_directory for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.account_type = 'lawyer'
    )
  );

create policy "lawyers update own directory profile"
  on public.lawyer_directory for update to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.account_type = 'lawyer'
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.account_type = 'lawyer'
    )
  );

create policy "lawyers delete own directory profile"
  on public.lawyer_directory for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.account_type = 'lawyer'
    )
  );

create view public.lawyer_directory_public
with (security_barrier = true)
as
select
  directory.user_id,
  directory.display_name,
  directory.description,
  directory.practice_areas,
  directory.city,
  directory.contact_email,
  directory.updated_at
from public.lawyer_directory as directory
inner join public.profiles as profile on profile.id = directory.user_id
where directory.is_published = true
  and profile.account_type = 'lawyer';

grant select on public.lawyer_directory_public to anon, authenticated;

create or replace function public.unpublish_lawyer_directory_on_account_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.account_type = 'lawyer' and new.account_type <> 'lawyer' then
    update public.lawyer_directory
    set is_published = false, updated_at = now()
    where user_id = new.id and is_published = true;
  end if;
  return new;
end
$$;

create trigger unpublish_lawyer_directory_on_account_change
after update of account_type on public.profiles
for each row
when (old.account_type is distinct from new.account_type)
execute function public.unpublish_lawyer_directory_on_account_change();
