-- 포트폴리오 내용(인적사항·분야·작업물·사진영상·이력)을 담을 표를 만듭니다.
--
-- 실행 방법: Supabase 대시보드 → portfolio-reservations → SQL Editor 에 전체를 붙여 넣고 Run
-- 한 번만 실행하면 됩니다. 기존 예약 표(reservations)는 건드리지 않습니다.
--
-- 배포 사이트는 DB 를 직접 읽지 않고, build.py 가 만든 index.html 만 씁니다.
-- 그래서 방문자(anon)는 이 표들을 읽지도 쓰지도 못하게 막습니다.
-- 읽기·쓰기는 비밀 키를 쓰는 관리자 서버와 build 과정만 합니다.

-- 인적사항. 한 사람 것이므로 1행만 허용합니다.
create table public.profile (
  id smallint primary key default 1 check (id = 1),
  name text not null default '',
  name_en text not null default '',
  gender text not null default '',
  birth_date text not null default '',      -- 화면이 '2005.09.01' 형식을 그대로 씁니다
  university text not null default '',
  department text not null default '',
  student_id text not null default '',
  phone text not null default '',
  copyright_year int,
  updated_at timestamptz not null default now()
);

-- 분야 필터 탭. '전체(all)'는 실제 분야가 아니므로 넣지 않고 서버가 맨 앞에 붙입니다.
create table public.categories (
  value text primary key check (value ~ '^[a-z0-9-]+$' and value <> 'all'),
  label text not null check (char_length(btrim(label)) > 0),
  sort_order int not null default 0
);

-- 작업물. 초안은 빈칸을 허용하므로 글자 칸은 빈 문자열을 기본값으로 둡니다.
-- '공개면 필수 칸이 차 있어야 한다'는 검사는 서버(projectValidation.js)가 합니다.
-- 기존 판넬·영상은 역할·날짜·인원이 비어 있는 채로 공개 중이라 DB 에서는 걸지 않습니다.
create table public.projects (
  id text primary key check (char_length(id) between 1 and 100),
  status text not null default 'draft' check (status in ('draft', 'published')),
  category text references public.categories (value) on update cascade on delete set null,
  title text not null default '',
  role text not null default '',
  description text not null default '',
  period text not null default '',          -- JSON 의 date. '2026.06~2026.07' 처럼 기간이 들어갑니다
  team_size int check (team_size > 0),
  notes text not null default '',
  tag text not null default '',
  overlay_label text not null default '',
  action_label text not null default '',
  action_icon text not null default '',
  viewer_title text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 작업물에 달린 사진·영상. 실제 파일은 저장소 폴더에 두고 경로만 적습니다.
-- 사진·영상이 달린 작업물은 지울 수 없게 막습니다 (중복 합치기에서 지워지지 않도록).
create table public.project_media (
  id bigint generated always as identity primary key,
  project_id text not null references public.projects (id) on update cascade on delete restrict,
  type text not null check (type in ('image', 'video')),
  src text not null,                        -- 사진: 확대용 원본 / 영상: 영상 파일
  thumb_src text,                           -- 사진만 사용
  mime_type text,                           -- 영상만 사용
  alt text not null default '',
  sort_order int not null default 0,
  check (type <> 'image' or thumb_src is not null),
  check (type <> 'video' or mime_type is not null)
);

create index project_media_project_id_idx on public.project_media (project_id);

-- 학술 활동·공모전·자격 이력
create table public.credentials (
  id text primary key check (char_length(id) between 1 and 100),
  category text not null check (category in ('학술 활동', '공모전 참가', '자격사항')),
  title text not null check (char_length(btrim(title)) > 0),
  short_label text not null default '',
  description text not null default '',
  icon text not null default '',            -- Lucide 아이콘 이름
  sort_order int not null default 0
);

comment on table public.profile is '포트폴리오 인적사항 (1행)';
comment on table public.categories is '작업물 분야 필터 탭';
comment on table public.projects is '작업물. draft 는 관리자만, published 는 배포 파일에 포함';
comment on table public.project_media is '작업물의 사진·영상 경로';
comment on table public.credentials is '학술 활동·공모전·자격 이력';

-- 방문자(anon)와 로그인 사용자(authenticated)는 모두 막습니다.
-- RLS 를 켜고 정책을 하나도 만들지 않으면 비밀 키 외에는 아무도 읽고 쓸 수 없습니다.
alter table public.profile enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.credentials enable row level security;

revoke all on public.profile, public.categories, public.projects,
              public.project_media, public.credentials
  from anon, authenticated;
