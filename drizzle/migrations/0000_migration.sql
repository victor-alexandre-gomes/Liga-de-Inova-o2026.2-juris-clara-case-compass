
create type public.app_role as enum ('admin','lawyer','citizen');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  account_type text not null default 'citizen' check (account_type in ('citizen','lawyer')),
  oab_number text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text := coalesce(new.raw_user_meta_data->>'account_type','citizen');
begin
  if t not in ('citizen','lawyer') then t := 'citizen'; end if;
  insert into public.profiles (id, full_name, account_type)
  values (new.id, new.raw_user_meta_data->>'full_name', t);
  insert into public.user_roles (user_id, role) values (new.id, t::app_role);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Switching account type keeps role in sync (never grants admin)
create or replace function public.set_account_type(_type text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _type not in ('citizen','lawyer') then raise exception 'tipo inválido'; end if;
  update public.profiles set account_type = _type, updated_at = now() where id = auth.uid();
  delete from public.user_roles where user_id = auth.uid() and role in ('citizen','lawyer');
  insert into public.user_roles (user_id, role) values (auth.uid(), _type::app_role);
end $$;
grant execute on function public.set_account_type(text) to authenticated;

-- Wiki: norms
create table public.norms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  official_name text not null,
  short_name text not null,
  norm_type text not null,
  number text,
  year int,
  signed_on date,
  category text not null,
  source_type text not null default 'legislacao',
  official_url text,
  source_name text,
  vigency_status text not null default 'nao_verificada',
  text_status text not null default 'pendente_importacao',
  plain_summary text,
  content_version int not null default 0,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.norms to anon, authenticated;
grant insert, update, delete on public.norms to authenticated;
grant all on public.norms to service_role;
alter table public.norms enable row level security;
create policy "norms public read" on public.norms for select to anon, authenticated using (true);
create policy "norms admin write" on public.norms for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.norm_articles (
  id uuid primary key default gen_random_uuid(),
  norm_id uuid not null references public.norms(id) on delete cascade,
  article_number text not null,
  position int not null default 0,
  legal_text text not null,
  plain_explanation text,
  source_version int not null default 1,
  verified_at timestamptz,
  unique (norm_id, article_number)
);
grant select on public.norm_articles to anon, authenticated;
grant insert, update, delete on public.norm_articles to authenticated;
grant all on public.norm_articles to service_role;
alter table public.norm_articles enable row level security;
create policy "articles public read" on public.norm_articles for select to anon, authenticated using (true);
create policy "articles admin write" on public.norm_articles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.norm_updates (
  id uuid primary key default gen_random_uuid(),
  norm_id uuid not null references public.norms(id) on delete cascade,
  description text not null,
  source_consulted text,
  version int,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.norm_updates to anon, authenticated;
grant insert on public.norm_updates to authenticated;
grant all on public.norm_updates to service_role;
alter table public.norm_updates enable row level security;
create policy "updates public read" on public.norm_updates for select to anon, authenticated using (true);
create policy "updates admin insert" on public.norm_updates for insert to authenticated with check (public.has_role(auth.uid(),'admin'));

create table public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  term text not null,
  definition text not null,
  example text,
  related_refs text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.glossary_terms to anon, authenticated;
grant insert, update, delete on public.glossary_terms to authenticated;
grant all on public.glossary_terms to service_role;
alter table public.glossary_terms enable row level security;
create policy "terms public read" on public.glossary_terms for select to anon, authenticated using (true);
create policy "terms admin write" on public.glossary_terms for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- User data
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  ref_slug text not null,
  label text not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_slug)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "own favorites" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  query text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.search_history to authenticated;
grant all on public.search_history to service_role;
alter table public.search_history enable row level security;
create policy "own history" on public.search_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  category text not null,
  description text,
  status text not null default 'rascunho',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.cases to authenticated;
grant all on public.cases to service_role;
alter table public.cases enable row level security;
create policy "own cases" on public.cases for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity text,
  entity_id text,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "insert own audit" on public.audit_log for insert to authenticated with check (auth.uid() = user_id);
create policy "admin read audit" on public.audit_log for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Seed: metadata only. Legal text intentionally NOT seeded (pending official import).
insert into public.norms (slug, official_name, short_name, norm_type, number, year, signed_on, category, official_url, source_name, plain_summary) values
('constituicao-federal','Constituição da República Federativa do Brasil de 1988','Constituição Federal','Constituição',null,1988,'1988-10-05','Acesso à Justiça','https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm','Planalto','Lei máxima do país. Define direitos fundamentais, organização do Estado e garantias como o acesso ao Judiciário.'),
('codigo-defesa-consumidor','Lei nº 8.078, de 11 de setembro de 1990','Código de Defesa do Consumidor','Lei','8.078',1990,'1990-09-11','Direito do Consumidor','https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm','Planalto','Regras de proteção a quem compra produtos ou contrata serviços: informação, qualidade, defeitos, cobranças e publicidade.'),
('codigo-processo-civil','Lei nº 13.105, de 16 de março de 2015','Código de Processo Civil','Lei','13.105',2015,'2015-03-16','Processo Civil','https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm','Planalto','Define como funcionam os processos cíveis: petição inicial, prazos, provas, sentença, recursos e cumprimento de sentença.'),
('codigo-civil','Lei nº 10.406, de 10 de janeiro de 2002','Código Civil','Lei','10.406',2002,'2002-01-10','Contratos','https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm','Planalto','Regras gerais da vida civil: pessoas, contratos, obrigações, responsabilidade por danos, família e herança.'),
('lei-juizados-especiais','Lei nº 9.099, de 26 de setembro de 1995','Lei dos Juizados Especiais','Lei','9.099',1995,'1995-09-26','Juizados Especiais','https://www.planalto.gov.br/ccivil_03/leis/l9099.htm','Planalto','Cria os Juizados Especiais Cíveis e Criminais, voltados a causas de menor complexidade, com procedimento mais simples.');

insert into public.norm_updates (norm_id, description, source_consulted, version)
select id, 'Metadados cadastrados. Texto legal ainda não importado da fonte oficial.', official_url, 0 from public.norms;

insert into public.glossary_terms (slug, term, definition, example, related_refs) values
('peticao-inicial','Petição inicial','Documento que dá início a um processo. Nele a pessoa conta o que aconteceu, explica seu direito e diz o que pede ao juiz.','Maria escreve uma petição inicial pedindo a devolução do valor pago por um celular com defeito.','{"CPC — requisitos da petição inicial (verificar artigo na fonte oficial)"}'),
('contestacao','Contestação','Resposta da pessoa ou empresa processada. É onde ela apresenta sua versão dos fatos e seus argumentos de defesa.','A loja apresenta contestação dizendo que o defeito foi causado por mau uso.','{"CPC — contestação (verificar artigo na fonte oficial)"}'),
('competencia','Competência','Regra que define qual juiz ou tribunal pode julgar determinado caso, por exemplo pelo local, pelo valor ou pelo assunto.','Uma causa de pequeno valor pode ser de competência do Juizado Especial Cível.','{}'),
('conciliacao','Conciliação','Tentativa de acordo entre as partes, conduzida por um conciliador, antes ou durante o processo.','Na audiência de conciliação, a empresa propõe devolver metade do valor.','{"Lei 9.099/1995 — audiência de conciliação (verificar na fonte oficial)"}'),
('sentenca','Sentença','Decisão do juiz que encerra uma fase do processo, dizendo quem tem razão e o que deve ser feito.','A sentença condenou a empresa a pagar o valor do produto.','{}'),
('recurso','Recurso','Pedido para que uma decisão seja revista por outro órgão ou pelo mesmo juiz, dentro de prazos definidos em lei.','Insatisfeita, a parte apresenta recurso contra a sentença.','{}'),
('transito-em-julgado','Trânsito em julgado','Momento em que não cabe mais nenhum recurso contra a decisão, que se torna definitiva.','Depois do trânsito em julgado, inicia-se o cumprimento de sentença.','{}'),
('juizado-especial-civel','Juizado Especial Cível','Parte do Judiciário dedicada a causas cíveis de menor complexidade, com procedimento mais simples e rápido.','Uma cobrança indevida de pequeno valor pode ser levada ao Juizado.','{"Lei 9.099/1995"}');
