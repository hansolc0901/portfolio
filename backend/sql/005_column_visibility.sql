-- 표·칸마다 공개(public)/비공개(private)를 적어 두는 표를 만듭니다.
--
-- 실행 방법: 004 를 먼저 실행한 뒤, Supabase SQL Editor 에 전체를 붙여 넣고 Run
-- 공개 여부를 바꿀 때는 Table Editor 에서 visibility 값만 고치면 됩니다.
--
-- 배포 파일(index.html)에는 public 칸만 들어갑니다.
-- 이 표에 없는 칸은 비공개로 처리합니다. 칸을 새로 만들면 여기에도 한 줄 추가하세요.
-- 행 단위 공개는 따로 정합니다 (projects.status = 'published' 인 작업물과 그 사진·영상만).

create table public.column_visibility (
  table_name text not null,
  column_name text not null,
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  reason text not null default '',
  primary key (table_name, column_name)
);

comment on table public.column_visibility is '표·칸별 공개 여부. 없는 칸은 비공개';

alter table public.column_visibility enable row level security;
revoke all on public.column_visibility from anon, authenticated;

insert into public.column_visibility (table_name, column_name, visibility, reason) values
  -- 인적사항: 페이지·PDF 와 같게 모두 공개 (사용자 결정)
  ('profile', 'id',             'private', '관리용'),
  ('profile', 'name',           'public',  '화면 표시'),
  ('profile', 'name_en',        'public',  '화면 표시'),
  ('profile', 'gender',         'public',  '화면 표시 (개인정보. 숨기려면 private)'),
  ('profile', 'birth_date',     'public',  '화면 표시 (개인정보. 숨기려면 private)'),
  ('profile', 'university',     'public',  '화면 표시'),
  ('profile', 'department',     'public',  '화면 표시'),
  ('profile', 'student_id',     'public',  '화면 표시 (개인정보. 숨기려면 private)'),
  ('profile', 'phone',          'public',  '화면 표시 (개인정보. 숨기려면 private)'),
  ('profile', 'copyright_year', 'public',  '바닥글 표시'),
  ('profile', 'updated_at',     'private', '관리용'),

  ('categories', 'value',      'public',  '필터 탭'),
  ('categories', 'label',      'public',  '필터 탭'),
  ('categories', 'sort_order', 'private', '정렬용'),

  ('projects', 'id',            'public',  '뷰어 연결'),
  ('projects', 'status',        'private', '공개 행만 내보내므로 불필요'),
  ('projects', 'category',      'public',  '필터'),
  ('projects', 'title',         'public',  '카드 표시'),
  ('projects', 'role',          'public',  '카드 표시'),
  ('projects', 'description',   'public',  '카드 표시'),
  ('projects', 'period',        'public',  '카드 표시'),
  ('projects', 'team_size',     'public',  '카드 표시'),
  ('projects', 'notes',         'public',  '카드 표시 (값이 있을 때만)'),
  ('projects', 'tag',           'public',  '카드 라벨'),
  ('projects', 'overlay_label', 'public',  '버튼 문구'),
  ('projects', 'action_label',  'public',  '버튼 문구'),
  ('projects', 'action_icon',   'public',  '버튼 아이콘'),
  ('projects', 'viewer_title',  'public',  '뷰어 제목'),
  ('projects', 'sort_order',    'private', '정렬용'),
  ('projects', 'created_at',    'private', '관리용'),
  ('projects', 'updated_at',    'private', '관리용'),

  ('project_media', 'id',         'private', '관리용'),
  ('project_media', 'project_id', 'private', '표 연결용'),
  ('project_media', 'type',       'public',  '사진/영상 구분'),
  ('project_media', 'src',        'public',  '뷰어·영상 재생'),
  ('project_media', 'thumb_src',  'public',  '카드 썸네일'),
  ('project_media', 'mime_type',  'private', '공개 화면에서 쓰지 않음'),
  ('project_media', 'alt',        'public',  '대체 글'),
  ('project_media', 'sort_order', 'private', '정렬용'),

  ('credentials', 'id',          'public',  '항목 구분'),
  ('credentials', 'category',    'public',  '이력 표시'),
  ('credentials', 'title',       'public',  '이력 표시'),
  ('credentials', 'short_label', 'public',  '상단 띠 표시'),
  ('credentials', 'description', 'public',  '이력 표시'),
  ('credentials', 'icon',        'public',  '이력 아이콘'),
  ('credentials', 'sort_order',  'private', '정렬용'),

  -- 예약: 기록용. 실제 공개는 get_booked_slots() 가 날짜·시간만 내보내는 방식으로 이미 지켜집니다
  ('reservations', 'visit_date',        'public',  'get_booked_slots() 로만 (취소 제외)'),
  ('reservations', 'visit_time',        'public',  'get_booked_slots() 로만 (취소 제외)'),
  ('reservations', 'id',                'private', '관리자 탭'),
  ('reservations', 'reservation_no',    'private', '관리자 탭'),
  ('reservations', 'created_at',        'private', '관리자 탭'),
  ('reservations', 'name',              'private', '개인정보'),
  ('reservations', 'email',             'private', '개인정보'),
  ('reservations', 'purpose',           'private', '관리자 탭'),
  ('reservations', 'consent',           'private', '관리자 탭'),
  ('reservations', 'status',            'private', '관리자 탭'),
  ('reservations', 'status_updated_at', 'private', '관리자 탭');
