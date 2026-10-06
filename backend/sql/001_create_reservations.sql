-- 방문 예약 표 (2026-10-06 Supabase 에 적용 완료. 기록용으로 남겨 둡니다)

create table public.reservations (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visit_date date not null check (extract(isodow from visit_date) < 6),
  visit_time time not null check (
    visit_time between '13:00' and '18:00'
    and extract(minute from visit_time) in (0, 30)
    and extract(second from visit_time) = 0
  ),
  name text not null check (char_length(btrim(name)) between 1 and 50),
  email text not null check (
    char_length(email) <= 254
    and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  purpose text not null check (char_length(btrim(purpose)) between 1 and 2000),
  consent boolean not null check (consent = true)
);

comment on table public.reservations is '포트폴리오 방문 예약. 방문자는 추가만 가능';

alter table public.reservations enable row level security;

-- 방문자는 오늘 이후 날짜로 추가만 할 수 있다 (읽기·수정·삭제 정책 없음 = 차단)
create policy "visitors can insert reservations"
  on public.reservations
  for insert
  to anon
  with check (visit_date >= (now() at time zone 'Asia/Seoul')::date);

revoke all on public.reservations from anon, authenticated;
grant insert (visit_date, visit_time, name, email, purpose, consent) on public.reservations to anon;
