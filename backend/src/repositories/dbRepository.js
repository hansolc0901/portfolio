// Supabase 표에서 데이터를 읽고 쓰는 저장소입니다.
//
// backend/.env 에서 DATA_SOURCE=db 로 바꾸면 이 저장소를 씁니다.
// 돌려주는 모양은 jsonRepository 와 같아서 라우트·화면 코드는 고치지 않아도 됩니다.
//
// 공개 여부는 두 가지로 정합니다.
//   행: projects.status 가 'published' 인 작업물과 그 사진·영상만
//   칸: column_visibility 표에서 public 인 칸만 (표에 없는 칸은 비공개)
// 방문자용으로 읽을 때(onlyPublished: true)만 걸러 내고, 관리자는 모두 봅니다.
import { HttpError } from '../middleware/errors.js';
import { supabaseRequest } from '../supabase/client.js';

// '전체'는 실제 분야가 아니라서 DB 에 두지 않고 여기서 맨 앞에 붙입니다.
const ALL_FILTER = { value: 'all', label: '전체' };

// DB 칸 이름 → 화면이 쓰는 이름
// 여기에 없는 칸(id, sort_order 등)은 관리용이라 밖으로 내보내지 않습니다.
const FIELDS = {
  profile: {
    name: 'name',
    name_en: 'nameEn',
    gender: 'gender',
    birth_date: 'birthDate',
    university: 'university',
    department: 'department',
    student_id: 'studentId',
    phone: 'phone',
    copyright_year: 'copyrightYear',
  },
  categories: {
    value: 'value',
    label: 'label',
  },
  projects: {
    id: 'id',
    status: 'status',
    category: 'category',
    title: 'title',
    tag: 'tag',
    description: 'description',
    role: 'role',
    period: 'date',
    team_size: 'teamSize',
    notes: 'notes',
    overlay_label: 'overlayLabel',
    action_label: 'actionLabel',
    action_icon: 'actionIcon',
    viewer_title: 'viewerTitle',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  project_media: {
    type: 'type',
    src: 'src',
    thumb_src: 'thumbSrc',
    mime_type: 'mimeType',
    alt: 'alt',
  },
  credentials: {
    id: 'id',
    category: 'category',
    title: 'title',
    short_label: 'shortLabel',
    description: 'description',
    icon: 'icon',
  },
};

const PROJECT_SELECT = '*,project_media(*)&project_media.order=sort_order';

// 공개 칸 목록을 'projects.title' 같은 모양으로 모읍니다.
async function loadPublicColumns() {
  const rows = await supabaseRequest(
    'column_visibility?select=table_name,column_name&visibility=eq.public',
  );
  return new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));
}

// DB 한 행을 화면용 이름으로 바꿉니다.
// publicColumns 가 있으면 공개 칸만 남깁니다. (null 이면 관리자용으로 모두)
function toApi(table, row, publicColumns) {
  const result = {};
  for (const [column, key] of Object.entries(FIELDS[table])) {
    if (!(column in row)) continue;
    if (publicColumns && !publicColumns.has(`${table}.${column}`)) continue;
    result[key] = row[column];
  }
  return result;
}

function toMedia(row, publicColumns) {
  const media = toApi('project_media', row, publicColumns);

  // 사진은 확대용 원본을 fullSrc 로 부릅니다. (영상은 src 그대로)
  if (row.type === 'image' && 'src' in media) {
    media.fullSrc = media.src;
    delete media.src;
  }
  // 사진에는 영상 형식이, 영상에는 썸네일이 없으므로 빈 값은 뺍니다.
  for (const key of Object.keys(media)) {
    if (media[key] === null) delete media[key];
  }
  return media;
}

function toProject(row, publicColumns) {
  const project = toApi('projects', row, publicColumns);

  // 분야가 없는 작업물은 DB 에 null 로, 화면에는 빈 문자열로 둡니다. (JSON 과 같은 모양)
  if ('category' in project) project.category = project.category ?? '';

  const [first] = row.project_media ?? [];
  if (first) project.media = toMedia(first, publicColumns);
  return project;
}

// 화면용 이름 → DB 칸 이름. 들어온 칸만 바꿉니다.
function toProjectRow(project) {
  const row = {};
  for (const [column, key] of Object.entries(FIELDS.projects)) {
    if (key in project) row[column] = project[key];
  }
  if ('category' in row) row.category = row.category || null;
  return row;
}

// 사진·영상이 달린 작업물을 지우려 하면 DB 가 막습니다 (23503).
function explainProjectError(payload) {
  if (payload?.code === '23503') {
    return new HttpError(
      400,
      '사진·영상이 있는 작업물은 지울 수 없습니다. 제목을 다르게 바꿔 주세요.',
    );
  }
  return null;
}

function projectRequest(path, options = {}) {
  return supabaseRequest(path, { ...options, explainError: explainProjectError });
}

async function readProfile(publicColumns) {
  const [row] = await supabaseRequest('profile?select=*&id=eq.1');
  return row ? toApi('profile', row, publicColumns) : null;
}

async function readFilters(publicColumns) {
  const rows = await supabaseRequest('categories?select=*&order=sort_order');
  return [ALL_FILTER, ...rows.map((row) => toApi('categories', row, publicColumns))];
}

async function readProjects(onlyPublished, publicColumns) {
  const where = onlyPublished ? '&status=eq.published' : '';
  const rows = await projectRequest(`projects?select=${PROJECT_SELECT}${where}&order=sort_order`);
  return rows.map((row) => toProject(row, publicColumns));
}

async function readCredentials(publicColumns) {
  const rows = await supabaseRequest('credentials?select=*&order=sort_order');
  return rows.map((row) => toApi('credentials', row, publicColumns));
}

// 방문자용이면 공개 칸 목록을, 관리자용이면 null(모두)을 돌려줍니다.
function publicColumnsFor(onlyPublished) {
  return onlyPublished ? loadPublicColumns() : null;
}

/**
 * @returns {import('./portfolioRepository.js').PortfolioRepository}
 */
export function createDbRepository() {
  return {
    async getPortfolio({ onlyPublished = false } = {}) {
      const publicColumns = await publicColumnsFor(onlyPublished);
      const [profile, filters, projects, credentials] = await Promise.all([
        readProfile(publicColumns),
        readFilters(publicColumns),
        readProjects(onlyPublished, publicColumns),
        readCredentials(publicColumns),
      ]);
      return { profile, filters, projects, credentials };
    },

    async getProfile({ onlyPublished = false } = {}) {
      return readProfile(await publicColumnsFor(onlyPublished));
    },

    async getProjects({ onlyPublished = false } = {}) {
      return readProjects(onlyPublished, await publicColumnsFor(onlyPublished));
    },

    // 초안도 찾을 수 있어야 합니다. 관리자 화면이 이 함수를 씁니다.
    async getProject(id) {
      const [row] = await projectRequest(
        `projects?select=${PROJECT_SELECT}&id=eq.${encodeURIComponent(id)}`,
      );
      return row ? toProject(row, null) : null;
    },

    async getCredentials({ onlyPublished = false } = {}) {
      return readCredentials(await publicColumnsFor(onlyPublished));
    },

    // 새 작업물은 목록 맨 뒤에 붙입니다.
    async createProject(project) {
      const [last] = await supabaseRequest('projects?select=sort_order&order=sort_order.desc&limit=1');
      const row = { ...toProjectRow(project), sort_order: (last?.sort_order ?? -1) + 1 };

      const [created] = await projectRequest('projects', { method: 'POST', body: row });
      return toProject(created, null);
    },

    // 바뀐 칸만 덮어씁니다. 사진·영상은 다른 표에 있어 그대로 남습니다.
    async updateProject(id, patch) {
      const row = { ...toProjectRow(patch), updated_at: new Date().toISOString() };
      delete row.id;
      delete row.created_at;

      const updated = await projectRequest(`projects?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: row,
      });
      if (updated.length === 0) return null;
      return this.getProject(id);
    },

    // 중복을 하나로 합칠 때 남는 쪽을 지우는 데 씁니다.
    async deleteProject(id) {
      const removed = await projectRequest(`projects?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return removed.length > 0;
    },
  };
}
