-- 같은 날짜·시간에는 예약을 하나만 받습니다.
--
-- 실행 방법: Supabase 대시보드 → portfolio-reservations → SQL Editor 에 전체를 붙여 넣고 Run
-- 002_reservation_status_and_number.sql 을 먼저 실행해야 합니다. (status 칸이 필요합니다)
--
-- 취소(cancelled)된 예약은 시간을 잡지 않습니다. 취소하면 그 시간이 다시 열립니다.
-- 접수·확정·변경 요청은 시간을 계속 잡고 있습니다.

-- 1) 이미 겹친 예약이 있으면 규칙을 만들 수 없으므로 먼저 알려 주고 멈춥니다.
do $$
declare
  overlap text;
begin
  select string_agg(visit_date || ' ' || to_char(visit_time, 'HH24:MI') || ' (' || n || '건)', ', ')
    into overlap
    from (
      select visit_date, visit_time, count(*) as n
        from public.reservations
       where status <> 'cancelled'
       group by visit_date, visit_time
      having count(*) > 1
    ) t;

  if overlap is not null then
    raise exception '이미 겹친 예약이 있습니다: %. 관리자 화면에서 하나만 남기고 나머지를 취소한 뒤 다시 실행해 주세요.', overlap;
  end if;
end $$;

-- 2) 겹침 방지 규칙. 방문자가 동시에 같은 시간을 신청해도 하나만 저장되고 나머지는 거절(409)됩니다.
create unique index reservations_one_per_slot
  on public.reservations (visit_date, visit_time)
  where status <> 'cancelled';

-- 3) 예약 페이지가 '(완료)' 표시에 쓰는 함수.
--    방문자는 예약 표를 읽을 수 없으므로, 오늘 이후의 막힌 날짜·시간만 돌려줍니다.
--    이름·이메일·방문 목적은 내보내지 않습니다.
create or replace function public.get_booked_slots()
returns table (visit_date date, visit_time time)
language sql
stable
security definer
set search_path = ''
as $$
  select r.visit_date, r.visit_time
    from public.reservations r
   where r.status <> 'cancelled'
     and r.visit_date >= (now() at time zone 'Asia/Seoul')::date
   order by 1, 2;
$$;

revoke execute on function public.get_booked_slots() from public;
grant execute on function public.get_booked_slots() to anon, authenticated;
