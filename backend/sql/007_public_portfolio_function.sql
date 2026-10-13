-- 방문자 화면이 포트폴리오 내용을 DB 에서 바로 읽을 수 있게 하는 함수입니다.
--
-- 실행 방법: Supabase SQL Editor 에 전체를 붙여 넣고 Run (004~006 다음에 실행)
--
-- 방문자(anon)는 표를 직접 읽지 못하고 이 함수 하나만 부를 수 있습니다.
-- 함수는 공개 작업물(status = 'published')의 공개 칸(column_visibility = public)만 돌려줍니다.
-- 돌려주는 모양은 서버의 getPortfolio({ onlyPublished: true }) 와 같습니다.
-- get_booked_slots() 와 같은 방식입니다.

-- 한 행(rec)에서 공개 칸만 골라 화면용 이름(mapping 의 값)으로 바꿉니다.
-- mapping 예) {"name_en": "nameEn"}  /  공개 칸 목록에 없는 칸은 버립니다.
create or replace function public.pick_public_columns(tbl text, rec jsonb, mapping jsonb)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(m.value #>> '{}', rec -> m.key), '{}'::jsonb)
    from jsonb_each(mapping) m
   where rec ? m.key
     and exists (
       select 1 from public.column_visibility v
        where v.table_name = tbl
          and v.column_name = m.key
          and v.visibility = 'public'
     );
$$;

create or replace function public.get_public_portfolio()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'profile', (
      select public.pick_public_columns('profile', to_jsonb(p), '{
        "name": "name", "name_en": "nameEn", "gender": "gender", "birth_date": "birthDate",
        "university": "university", "department": "department", "student_id": "studentId",
        "phone": "phone", "copyright_year": "copyrightYear"
      }')
        from public.profile p
       where p.id = 1
    ),

    -- '전체'는 실제 분야가 아니라서 여기서 맨 앞에 붙입니다.
    'filters', jsonb_build_array(jsonb_build_object('value', 'all', 'label', '전체')) || coalesce((
      select jsonb_agg(
               public.pick_public_columns('categories', to_jsonb(c), '{"value": "value", "label": "label"}')
               order by c.sort_order)
        from public.categories c
    ), '[]'::jsonb),

    'projects', coalesce((
      select jsonb_agg(
               public.pick_public_columns(
                 'projects',
                 -- 분야가 없는 작업물은 화면에 빈 문자열로 넘깁니다.
                 to_jsonb(pr) || jsonb_build_object('category', coalesce(pr.category, '')),
                 '{
                   "id": "id", "status": "status", "category": "category", "title": "title",
                   "tag": "tag", "description": "description", "role": "role", "period": "date",
                   "team_size": "teamSize", "notes": "notes", "overlay_label": "overlayLabel",
                   "action_label": "actionLabel", "action_icon": "actionIcon",
                   "viewer_title": "viewerTitle", "created_at": "createdAt", "updated_at": "updatedAt"
                 }')
               || coalesce((
                 -- 첫 번째 사진·영상만 붙입니다. 사진의 원본은 fullSrc 로 부릅니다.
                 select jsonb_build_object('media', jsonb_strip_nulls(
                          case when m.type = 'image' and picked ? 'src'
                               then (picked - 'src') || jsonb_build_object('fullSrc', picked -> 'src')
                               else picked end))
                   from public.project_media m
                  cross join lateral (
                    select public.pick_public_columns('project_media', to_jsonb(m), '{
                      "type": "type", "src": "src", "thumb_src": "thumbSrc",
                      "mime_type": "mimeType", "alt": "alt"
                    }') as picked
                  ) x
                  where m.project_id = pr.id
                  order by m.sort_order
                  limit 1
               ), '{}'::jsonb)
               order by pr.sort_order)
        from public.projects pr
       where pr.status = 'published'
    ), '[]'::jsonb),

    'credentials', coalesce((
      select jsonb_agg(
               public.pick_public_columns('credentials', to_jsonb(cr), '{
                 "id": "id", "category": "category", "title": "title",
                 "short_label": "shortLabel", "description": "description", "icon": "icon"
               }')
               order by cr.sort_order)
        from public.credentials cr
    ), '[]'::jsonb)
  );
$$;

-- 방문자는 get_public_portfolio() 만 부를 수 있습니다. 칸 고르기 함수는 막습니다.
revoke execute on function public.pick_public_columns(text, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.get_public_portfolio() from public;
grant execute on function public.get_public_portfolio() to anon, authenticated, service_role;

notify pgrst, 'reload schema';
