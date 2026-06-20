create extension if not exists vector;

alter table public.promises add column if not exists embedding vector(1536);
alter table public.memory_items add column if not exists embedding vector(1536);

create index if not exists promises_embedding_idx
  on public.promises using hnsw (embedding vector_cosine_ops);
create index if not exists memory_items_embedding_idx
  on public.memory_items using hnsw (embedding vector_cosine_ops);

create or replace function public.match_promises(
  _user_id uuid,
  query_embedding vector(1536),
  match_count int default 12
) returns table (
  id uuid,
  summary text,
  owed_to text,
  channel text,
  due_at timestamptz,
  evidence_snippet text,
  status promise_status,
  similarity float
)
language sql
stable
security invoker
set search_path = public
as $$
  select p.id, p.summary, p.owed_to, p.channel, p.due_at, p.evidence_snippet, p.status,
         1 - (p.embedding <=> query_embedding) as similarity
  from public.promises p
  where p.user_id = _user_id
    and p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count
$$;

create or replace function public.match_memory_items(
  _user_id uuid,
  query_embedding vector(1536),
  match_count int default 10
) returns table (
  id uuid,
  title text,
  snippet text,
  kind text,
  occurred_at timestamptz,
  similarity float
)
language sql
stable
security invoker
set search_path = public
as $$
  select m.id, m.title, m.snippet, m.kind, m.occurred_at,
         1 - (m.embedding <=> query_embedding) as similarity
  from public.memory_items m
  where m.user_id = _user_id
    and m.embedding is not null
  order by m.embedding <=> query_embedding
  limit match_count
$$;

grant execute on function public.match_promises(uuid, vector, int) to authenticated;
grant execute on function public.match_memory_items(uuid, vector, int) to authenticated;