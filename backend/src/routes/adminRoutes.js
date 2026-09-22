// 관리자용 주소입니다.
//
// 로그인(/login)만 누구나 부를 수 있고, 나머지는 모두 출입증이 있어야 합니다.
// 비밀번호는 여기서만 확인하고, 화면으로는 절대 내보내지 않습니다.
import { Router } from 'express';

import { config } from '../config.js';
import { verifyPassword } from '../auth/password.js';
import { createSession, destroySession } from '../auth/sessions.js';
import { lockedSeconds, recordFailure, recordSuccess } from '../auth/loginLimit.js';
import { requireAuth, readToken } from '../middleware/requireAuth.js';
import { PROJECT_FIELDS, PROJECT_STATUSES } from '../projects/projectFields.js';
import { validateProject, buildNewProject } from '../projects/projectValidation.js';
import { findDuplicate, findDuplicateIds, fillEmptyFields } from '../projects/duplicates.js';
import { runBuild } from '../services/buildRunner.js';

function fail(res, status, message, fields) {
  res.status(status).json({ error: { status, message, fields } });
}

// 같은 제목이 이미 있으면 저장을 멈추고 화면에 알려 줍니다.
// 화면에서 '따로 저장' 을 고르면 allowDuplicate 를 붙여 다시 보내옵니다.
async function blockedByDuplicate(repository, req, res, exceptId) {
  if (req.body?.allowDuplicate) return false;

  const projects = await repository.getProjects();
  const duplicate = findDuplicate(projects, req.body?.title, exceptId);
  if (!duplicate) return false;

  res.status(409).json({
    error: {
      status: 409,
      message: '같은 제목의 작업물이 이미 있습니다.',
      duplicate,
    },
  });
  return true;
}

export function createAdminRouter(repository) {
  const router = Router();

  // 관리자 응답은 브라우저나 중간 서버에 남지 않도록 합니다.
  // 로그인 응답에 출입증이 들어 있기 때문입니다.
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // ── 로그인 ────────────────────────────────────────────────
  router.post('/login', async (req, res) => {
    if (!config.adminPasswordHash) {
      return fail(
        res,
        503,
        '관리자 비밀번호가 아직 정해지지 않았습니다. 터미널에서 "npm run set-password -- 새비밀번호" 를 실행해 주세요.',
      );
    }

    const waitSeconds = lockedSeconds(req);
    if (waitSeconds > 0) {
      return fail(res, 429, `비밀번호를 여러 번 틀렸습니다. ${waitSeconds}초 뒤에 다시 시도해 주세요.`);
    }

    const ok = await verifyPassword(req.body?.password, config.adminPasswordHash);

    if (!ok) {
      const left = recordFailure(req);
      const tail = left > 0 ? ` (${left}번 더 틀리면 잠깁니다)` : '';
      return fail(res, 401, `비밀번호가 맞지 않습니다.${tail}`);
    }

    recordSuccess(req);

    // 출입증만 돌려줍니다. 비밀번호나 해시는 나가지 않습니다.
    res.json({ data: { token: createSession(config.sessionTtlMs) } });
  });

  // 로그아웃. 창을 닫을 때도 화면이 이 주소를 불러 출입증을 없앱니다.
  router.post('/logout', requireAuth, (req, res) => {
    destroySession(readToken(req));
    res.json({ data: { ok: true } });
  });

  // ── 여기서부터는 로그인한 사람만 ──────────────────────────
  router.use(requireAuth);

  // 관리자 화면이 입력 칸을 만들 때 쓰는 정의입니다.
  router.get('/fields', (req, res) => {
    res.json({ data: { fields: PROJECT_FIELDS, statuses: PROJECT_STATUSES } });
  });

  // 초안까지 모두 돌려줍니다.
  // 제목이 겹치는 것에는 isDuplicate 표시를 달아 화면이 바로 알 수 있게 합니다.
  router.get('/projects', async (req, res) => {
    const projects = await repository.getProjects({ onlyPublished: false });
    const duplicateIds = findDuplicateIds(projects);

    res.json({
      data: projects.map((project) => ({
        ...project,
        isDuplicate: duplicateIds.has(project.id),
      })),
    });
  });

  router.get('/projects/:id', async (req, res) => {
    const project = await repository.getProject(req.params.id);
    if (!project) return fail(res, 404, '작업물을 찾을 수 없습니다.');
    res.json({ data: project });
  });

  // 새로 만들기
  router.post('/projects', async (req, res) => {
    const { errors, value } = validateProject(req.body);

    if (Object.keys(errors).length > 0) {
      return fail(res, 400, '입력한 내용을 확인해 주세요.', errors);
    }

    if (await blockedByDuplicate(repository, req, res)) return;

    const created = await repository.createProject(buildNewProject(value));
    res.status(201).json({ data: created });
  });

  // 수정하기
  router.put('/projects/:id', async (req, res) => {
    const { errors, value } = validateProject(req.body);

    if (Object.keys(errors).length > 0) {
      return fail(res, 400, '입력한 내용을 확인해 주세요.', errors);
    }

    // 자기 자신은 중복으로 보지 않습니다.
    if (await blockedByDuplicate(repository, req, res, req.params.id)) return;

    const updated = await repository.updateProject(req.params.id, value);
    if (!updated) return fail(res, 404, '작업물을 찾을 수 없습니다.');

    res.json({ data: updated });
  });

  // 중복 합치기 — 남길 작업물(:id)의 빈 칸을 지금 입력한 내용으로 채웁니다.
  //   values : 지금 화면에 입력되어 있는 내용
  //   fromId : 같이 지울 중복 작업물 (새로 만들던 중이면 없음)
  //
  // 이미 적혀 있던 값은 덮어쓰지 않으므로 합쳐도 내용이 사라지지 않습니다.
  router.post('/projects/:id/merge', async (req, res) => {
    const target = await repository.getProject(req.params.id);
    if (!target) return fail(res, 404, '합칠 작업물을 찾을 수 없습니다.');

    // 빈 칸을 채우는 데만 쓰므로 필수 검사는 하지 않습니다.
    // validateProject 는 공백을 다듬고 숫자를 바꿔 주는 역할만 합니다.
    const { value } = validateProject({ ...req.body?.values, status: 'draft' });

    const fromId = req.body?.fromId;
    const source = fromId && fromId !== target.id ? await repository.getProject(fromId) : null;

    // 사진·영상이 달린 작업물은 지우지 않습니다. 실수로 없애면 되돌리기 어렵습니다.
    if (source?.media) {
      return fail(
        res,
        400,
        '사진·영상이 있는 작업물은 합치면서 지울 수 없습니다. 제목을 다르게 바꿔 주세요.',
      );
    }

    const { patch, filledLabels } = fillEmptyFields(target, value);
    const project = await repository.updateProject(target.id, patch);
    const removed = source ? await repository.deleteProject(source.id) : false;

    res.json({ data: { project, filledLabels, removed } });
  });

  // 배포용 index.html 다시 만들기
  router.post('/build', async (req, res) => {
    const result = await runBuild();
    if (!result.ok) return fail(res, 500, result.message);
    res.json({ data: result });
  });

  return router;
}
