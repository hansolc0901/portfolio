-- 예약 관리 탭에 필요한 칸을 추가합니다.
--
-- 실행 방법: Supabase 대시보드 → portfolio-reservations → SQL Editor 에 전체를 붙여 넣고 Run
-- 한 번만 실행하면 됩니다. 기존 예약은 지우지 않고 예약 번호만 채웁니다.

-- 처리 상태: received(접수) / confirmed(확정) / change_requested(변경 요청) / cancelled(취소)
alter table public.reservations
  add column status text not null default 'received'
    check (status in ('received', 'confirmed', 'change_requested', 'cancelled')),
  add column status_updated_at timestamptz,
  add column reservation_no text;

-- 예약 번호 = 방문일(YYMMDD)-시간(HHMM)-이메일코드(4자리)
-- 같은 이메일이면 코드가 항상 같으므로, 번호만 봐도 같은 사람의 다른 일시 예약을 구분할 수 있다.
-- 방문자(anon)가 저장할 때도 동작하도록 다른 함수를 부르지 않고 이 안에서 바로 계산한다.
create or replace function public.set_reservation_no()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.reservation_no := to_char(new.visit_date, 'YYMMDD') || '-' || to_char(new.visit_time, 'HH24MI')
                        || '-' || upper(left(md5(lower(btrim(new.email))), 4));
  return new;
end;
$$;

create trigger reservations_set_no
  before insert or update of visit_date, visit_time, email on public.reservations
  for each row execute function public.set_reservation_no();

-- 이미 들어와 있는 예약에도 번호를 채운다. (email 을 같은 값으로 고쳐 트리거를 한 번 돌린다)
update public.reservations set email = email;

alter table public.reservations alter column reservation_no set not null;

-- 같은 사람(이메일)이 같은 일시에 두 번 신청하는 것을 막는다.
-- (다른 사람끼리 일시가 겹치는 문제는 추후 별도로 관리)
create unique index reservations_same_person_same_slot
  on public.reservations (lower(btrim(email)), visit_date, visit_time);

-- 방문자가 이 함수를 직접 부를 필요는 없다. (트리거로 실행될 때는 이 권한과 상관없이 동작한다)
revoke execute on function public.set_reservation_no() from public, anon, authenticated;
