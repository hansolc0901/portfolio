// JSON 파일에서 데이터를 읽고 쓰는 저장소입니다. (지금 사용 중)
// data/portfolio.json 을 직접 고쳐도 서버를 껐다 켜지 않고 바로 반영됩니다.
import { readFile, writeFile, rename, stat } from 'node:fs/promises';

/**
 * @param {{ dataFile: string }} options
 * @returns {import('./portfolioRepository.js').PortfolioRepository}
 */
export function createJsonRepository({ dataFile }) {
  // 파일을 매번 읽지 않도록 기억해 둡니다.
  // 파일의 수정 시각이 바뀌었을 때만 다시 읽습니다.
  let cache = null;
  let cachedModifiedAt = 0;

  // 저장 요청이 겹쳐도 한 번에 하나씩만 처리되도록 줄을 세웁니다.
  // 그래야 동시에 저장할 때 한쪽 내용이 사라지지 않습니다.
  let writeQueue = Promise.resolve();

  async function load() {
    const { mtimeMs } = await stat(dataFile);

    if (cache && mtimeMs === cachedModifiedAt) {
      return cache;
    }

    const text = await readFile(dataFile, 'utf-8');

    try {
      cache = JSON.parse(text);
    } catch (error) {
      throw new Error(`${dataFile} 의 형식이 올바르지 않습니다: ${error.message}`);
    }

    cachedModifiedAt = mtimeMs;
    return cache;
  }

  // 파일을 통째로 덮어쓰는 도중 서버가 멈추면 내용이 깨질 수 있습니다.
  // 임시 파일에 먼저 쓰고 이름을 바꾸면, 언제 멈춰도 파일이 깨지지 않습니다.
  async function save(data) {
    const temp = `${dataFile}.tmp`;
    await writeFile(temp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    await rename(temp, dataFile);

    cache = data;
    cachedModifiedAt = (await stat(dataFile)).mtimeMs;
  }

  // 읽고 → 고치고 → 저장하는 일을 줄을 세워 처리합니다.
  function change(modify) {
    const next = writeQueue.then(async () => {
      const data = await load();
      const result = await modify(data);
      if (result.changed) await save(data);
      return result.value;
    });

    // 한 번 실패해도 다음 저장은 계속되도록 합니다.
    writeQueue = next.catch(() => {});
    return next;
  }

  function visible(projects, onlyPublished) {
    if (!onlyPublished) return projects;
    return projects.filter((project) => project.status === 'published');
  }

  return {
    async getPortfolio({ onlyPublished = false } = {}) {
      const data = await load();
      return {
        ...data,
        projects: visible(data.projects ?? [], onlyPublished),
      };
    },

    async getProfile() {
      const { profile } = await load();
      return profile;
    },

    async getProjects({ onlyPublished = false } = {}) {
      const { projects } = await load();
      return visible(projects ?? [], onlyPublished);
    },

    async getProject(id) {
      const { projects } = await load();
      return (projects ?? []).find((project) => project.id === id) ?? null;
    },

    async getCredentials() {
      const { credentials } = await load();
      return credentials ?? [];
    },

    async createProject(project) {
      return change((data) => {
        data.projects = data.projects ?? [];
        data.projects.push(project);
        return { changed: true, value: project };
      });
    },

    async updateProject(id, patch) {
      return change((data) => {
        const list = data.projects ?? [];
        const index = list.findIndex((project) => project.id === id);

        // 없는 프로젝트면 아무것도 저장하지 않습니다.
        if (index === -1) return { changed: false, value: null };

        // 기존 내용 위에 바뀐 칸만 덮어씁니다.
        // 그래서 사진·영상처럼 관리자 화면에 없는 항목은 그대로 남습니다.
        const updated = {
          ...list[index],
          ...patch,
          updatedAt: new Date().toISOString(),
        };

        list[index] = updated;
        return { changed: true, value: updated };
      });
    },

    async deleteProject(id) {
      return change((data) => {
        const list = data.projects ?? [];
        const index = list.findIndex((project) => project.id === id);

        if (index === -1) return { changed: false, value: false };

        list.splice(index, 1);
        return { changed: true, value: true };
      });
    },
  };
}
