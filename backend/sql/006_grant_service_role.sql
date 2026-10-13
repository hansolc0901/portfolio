-- 관리자 서버(비밀 키 = service_role)가 포트폴리오 표를 읽고 쓸 수 있게 권한을 줍니다.
--
-- 실행 방법: Supabase SQL Editor 에 전체를 붙여 넣고 Run
-- 004·005 는 방문자(anon) 권한만 막고 service_role 권한을 따로 주지 않았습니다.
-- 새 표에 권한이 자동으로 붙지 않는 프로젝트에서는 API 가 표를 찾지 못합니다 (PGRST205).
-- 방문자(anon)·로그인 사용자(authenticated)는 계속 막혀 있습니다.

grant select, insert, update, delete
  on public.profile, public.categories, public.projects,
     public.project_media, public.credentials, public.column_visibility
  to service_role;

-- project_media.id 는 자동 번호라서 번호표(sequence) 사용 권한도 필요합니다.
grant usage, select on sequence public.project_media_id_seq to service_role;

-- API 가 표 목록을 다시 읽도록 알립니다.
notify pgrst, 'reload schema';
