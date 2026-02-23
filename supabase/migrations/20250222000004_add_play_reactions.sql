-- Play reactions: emoji reactions on feed plays
create table public.play_reactions (
  id uuid default gen_random_uuid() primary key,
  play_id uuid references public.plays(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default now(),
  unique(play_id, user_id, emoji)
);

alter table public.play_reactions enable row level security;

-- Any authenticated user can view reactions
create policy "Authenticated users can view reactions"
  on public.play_reactions for select
  to authenticated
  using (true);

-- Users can add their own reactions
create policy "Users can insert own reactions"
  on public.play_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can remove their own reactions
create policy "Users can delete own reactions"
  on public.play_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

create index play_reactions_play_id_idx on public.play_reactions(play_id);
create index play_reactions_user_id_idx on public.play_reactions(user_id);
