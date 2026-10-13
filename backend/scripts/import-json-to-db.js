// data/portfolio.json 의 내용을 Supabase 표로 옮깁니다.
//
//   사용법:  cd backend && npm run import-json
//
// 다른 표가 가리키는 표(부모)부터 넣습니다.
//   profile → categories → projects → project_media → credentials
//
// DB 에 이미 있는 행은 건너뜁니다. 덮어쓰지 않으므로 여러 번 실행해도 안전합니다.
// portfolio.json 은 읽기만 하고 고치지 않습니다.
import { readFile } from 'node:fs/promises';

import { config } from '../src/config.js';
import { supabaseRequest } from '../src/supabase/client.js';

// 이미 있는 기본키는 건너뛰고, 비어 있는 칸은 DB 기본값으로 채웁니다.
const INSERT_NEW_ONLY = 'resolution=ignore-duplicates,missing=default,return=representation';

function toProfileRow(profile) {
  return {
    id: 1,
    name: profile.name ?? '',
    name_en: profile.nameEn ?? '',
    gender: profile.gender ?? '',
    birth_date: profile.birthDate ?? '',
    university: profile.university ?? '',
    department: profile.department ?? '',
    student_id: profile.studentId ?? '',
    phone: profile.phone ?? '',
    copyright_year: profile.copyrightYear ?? null,
  };
}

function toCategoryRows(filters) {
  // '전체(all)'는 실제 분야가 아니라서 넣지 않습니다.
  return filters
    .filter((filter) => filter.value !== 'all')
    .map((filter, index) => ({
      value: filter.value,
      label: filter.label,
      sort_order: index,
    }));
}

function toProjectRow(project, index) {
  const row = {
    id: project.id,
    status: project.status,
    // 분야가 빈 작업물은 null 로 넣어야 categories 표와 어긋나지 않습니다.
    category: project.category || null,
    title: project.title ?? '',
    role: project.role ?? '',
    description: project.description ?? '',
    period: project.date ?? '',
    team_size: project.teamSize ?? null,
    notes: project.notes ?? '',
    tag: project.tag ?? '',
    overlay_label: project.overlayLabel ?? '',
    action_label: project.actionLabel ?? '',
    action_icon: project.actionIcon ?? '',
    viewer_title: project.viewerTitle ?? '',
    sort_order: index,
  };

  // 만든 시각이 없는 작업물은 DB 기본값(지금 시각)을 씁니다.
  if (project.createdAt) row.created_at = project.createdAt;
  if (project.updatedAt) row.updated_at = project.updatedAt;
  return row;
}

function toMediaRow(project) {
  const { media } = project;

  if (media.type === 'image') {
    return {
      project_id: project.id,
      type: 'image',
      src: media.fullSrc,
      thumb_src: media.thumbSrc,
      alt: media.alt ?? '',
    };
  }
  return {
    project_id: project.id,
    type: 'video',
    src: media.src,
    mime_type: media.mimeType,
    alt: media.alt ?? '',
  };
}

function toCredentialRow(credential, index) {
  return {
    id: credential.id,
    category: credential.category,
    title: credential.title,
    short_label: credential.shortLabel ?? '',
    description: credential.description ?? '',
    icon: credential.icon ?? '',
    sort_order: index,
  };
}

// 한 번에 여러 행을 보내려면 모든 행의 칸이 같아야 합니다.
// 사진·영상처럼 칸이 다른 행이 섞여 있어 한 행씩 넣습니다. (행이 적어 느리지 않습니다)
async function insertNew(table, rows) {
  const added = [];
  for (const row of rows) {
    added.push(...(await supabaseRequest(table, { method: 'POST', body: row, prefer: INSERT_NEW_ONLY })));
  }
  return added;
}

function report(table, tried, added) {
  console.log(`  ${table.padEnd(14)} ${tried}건 중 ${added}건 추가, ${tried - added}건은 이미 있어 건너뜀`);
}

const data = JSON.parse(await readFile(config.dataFile, 'utf-8'));
console.log(`읽은 파일: ${config.dataFile}`);

const profileRows = [toProfileRow(data.profile)];
report('profile', 1, (await insertNew('profile', profileRows)).length);

const categoryRows = toCategoryRows(data.filters ?? []);
report('categories', categoryRows.length, (await insertNew('categories', categoryRows)).length);

const projects = data.projects ?? [];
const projectRows = projects.map(toProjectRow);
report('projects', projectRows.length, (await insertNew('projects', projectRows)).length);

// 사진·영상은 자동 번호라 '이미 있음'을 기본키로 알 수 없습니다.
// 그래서 사진·영상이 하나도 없는 작업물에만 넣습니다.
const withMedia = projects.filter((project) => project.media);
const existing = await supabaseRequest('project_media?select=project_id');
const hasMedia = new Set(existing.map((row) => row.project_id));
const mediaRows = withMedia
  .filter((project) => !hasMedia.has(project.id))
  .map(toMediaRow);
report('project_media', withMedia.length, (await insertNew('project_media', mediaRows)).length);

const credentialRows = (data.credentials ?? []).map(toCredentialRow);
report('credentials', credentialRows.length, (await insertNew('credentials', credentialRows)).length);

console.log('완료했습니다. Supabase Table Editor 에서 내용을 확인하세요.');
