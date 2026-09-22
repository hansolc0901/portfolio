// 데이터베이스에서 데이터를 읽는 저장소입니다. (아직 비어 있는 뼈대)
//
// 지금은 아무것도 하지 않습니다. DB 를 붙일 때 이 파일만 채우면 됩니다.
// 라우트·화면 코드는 한 줄도 고치지 않아도 됩니다.
//
// ─────────────────────────────────────────────────────────────
// DB 를 붙이는 순서
// ─────────────────────────────────────────────────────────────
// 1. 드라이버를 설치합니다.
//      PostgreSQL → cd backend && npm install pg
//      MySQL      → cd backend && npm install mysql2
//      SQLite     → cd backend && npm install better-sqlite3
//
// 2. 아래 "표 설계" 대로 표(table)를 만듭니다.
//
// 3. 이 파일의 주석 처리된 코드를 참고해 네 함수를 채웁니다.
//
// 4. backend/.env 에서 두 값을 바꿉니다.
//      DATA_SOURCE=db
//      DATABASE_URL=postgresql://아이디:비밀번호@localhost:5432/portfolio
//
// 5. 서버를 다시 켭니다. 화면은 그대로 동작합니다.
//
// ─────────────────────────────────────────────────────────────
// 표 설계 — data/portfolio.json 의 구조를 그대로 옮긴 것입니다
// ─────────────────────────────────────────────────────────────
//   profile      : name, name_en, gender, birth_date,
//                  university, department, student_id, phone, copyright_year
//   filters      : value(PK), label, sort_order
//   projects     : id(PK), status, category, title, tag, description,
//                  role, date, team_size, notes,
//                  overlay_label, action_label, action_icon,
//                  viewer_title, media(JSON), sort_order,
//                  created_at, updated_at
//   credentials  : id(PK), category, title, short_label,
//                  description, icon, sort_order
//
// 화면은 목록의 순서를 그대로 보여주므로 sort_order 로 정렬해 주세요.
// media 는 값의 모양이 image 와 video 가 서로 달라서 JSON 컬럼이 편합니다.
// status 는 'draft' 또는 'published' 두 값만 들어갑니다.
// ─────────────────────────────────────────────────────────────

// DB 를 붙이기 전에 실수로 켰을 때 무엇을 해야 하는지 알려 줍니다.
function notImplemented(functionName) {
  throw new Error(
    `dbRepository.${functionName}() 이 아직 구현되지 않았습니다.\n` +
      'backend/src/repositories/dbRepository.js 를 채우거나,\n' +
      'backend/.env 에서 DATA_SOURCE 를 json 으로 되돌리세요.',
  );
}

/**
 * @param {{ databaseUrl: string }} options
 * @returns {import('./portfolioRepository.js').PortfolioRepository}
 */
export function createDbRepository({ databaseUrl }) {
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL 이 비어 있습니다. backend/.env 에 접속 주소를 적어 주세요.',
    );
  }

  // ── 1단계: 연결 만들기 (PostgreSQL 예시) ──────────────────
  // import pg from 'pg';
  // const pool = new pg.Pool({ connectionString: databaseUrl });

  return {
    async getPortfolio() {
      // 네 가지를 한 번에 모아 JSON 파일과 똑같은 모양으로 돌려줍니다.
      //
      // const [profile, filters, projects, credentials] = await Promise.all([
      //   this.getProfile(),
      //   this.getFilters(),
      //   this.getProjects(),
      //   this.getCredentials(),
      // ]);
      // return { profile, filters, projects, credentials };

      return notImplemented('getPortfolio');
    },

    async getProfile() {
      // const { rows } = await pool.query('SELECT * FROM profile LIMIT 1');
      // const row = rows[0];
      // 컬럼 이름(name_en)과 화면이 쓰는 이름(nameEn)이 다르므로 여기서 바꿔 줍니다.
      // return {
      //   name: row.name,
      //   nameEn: row.name_en,
      //   gender: row.gender,
      //   birthDate: row.birth_date,
      //   university: row.university,
      //   department: row.department,
      //   studentId: row.student_id,
      //   phone: row.phone,
      // };

      return notImplemented('getProfile');
    },

    async getProjects({ onlyPublished = false } = {}) {
      // onlyPublished 가 true 면 초안을 빼고 돌려줍니다.
      // 방문자용 주소는 true, 관리자용 주소는 false 로 부릅니다.
      //
      // const where = onlyPublished ? "WHERE status = 'published'" : '';
      // const { rows } = await pool.query(
      //   `SELECT * FROM projects ${where} ORDER BY sort_order`,
      // );
      // return rows.map(toProject);

      return notImplemented('getProjects');
    },

    async getProject(id) {
      // 초안도 찾을 수 있어야 합니다. 관리자 화면이 이 함수를 씁니다.
      //
      // const { rows } = await pool.query(
      //   'SELECT * FROM projects WHERE id = $1', [id],
      // );
      // return rows[0] ? toProject(rows[0]) : null;

      return notImplemented('getProject');
    },

    async createProject(project) {
      // const { rows } = await pool.query(
      //   `INSERT INTO projects (id, status, title, role, description,
      //                          date, team_size, notes, category, tag,
      //                          created_at, updated_at)
      //    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW(), NOW())
      //    RETURNING *`,
      //   [project.id, project.status, project.title, project.role,
      //    project.description, project.date, project.teamSize,
      //    project.notes, project.category, project.tag],
      // );
      // return toProject(rows[0]);

      return notImplemented('createProject');
    },

    async updateProject(id, patch) {
      // 바뀐 칸만 덮어쓰고, 나머지 칸(사진·영상 등)은 그대로 두어야 합니다.
      //
      // const { rows } = await pool.query(
      //   `UPDATE projects SET
      //      status = COALESCE($2, status),
      //      title = COALESCE($3, title),
      //      role = COALESCE($4, role),
      //      description = COALESCE($5, description),
      //      date = COALESCE($6, date),
      //      team_size = $7,
      //      notes = COALESCE($8, notes),
      //      updated_at = NOW()
      //    WHERE id = $1
      //    RETURNING *`,
      //   [id, patch.status, patch.title, patch.role, patch.description,
      //    patch.date, patch.teamSize, patch.notes],
      // );
      // return rows[0] ? toProject(rows[0]) : null;

      return notImplemented('updateProject');
    },

    async deleteProject(id) {
      // 중복을 하나로 합칠 때 남는 쪽을 지우는 데 씁니다.
      //
      // const { rowCount } = await pool.query(
      //   'DELETE FROM projects WHERE id = $1', [id],
      // );
      // return rowCount > 0;

      return notImplemented('deleteProject');
    },

    async getCredentials() {
      // const { rows } = await pool.query(
      //   'SELECT * FROM credentials ORDER BY sort_order',
      // );
      // return rows.map((row) => ({
      //   id: row.id,
      //   category: row.category,
      //   title: row.title,
      //   shortLabel: row.short_label,
      //   description: row.description,
      //   icon: row.icon,
      // }));

      return notImplemented('getCredentials');
    },
  };
}
