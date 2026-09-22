// 주소(URL)와 처리 내용을 연결합니다.
//
// 이 파일은 데이터가 JSON 파일에서 오는지 DB 에서 오는지 모릅니다.
// repository 를 밖에서 받아 쓰기만 하므로, 저장소를 바꿔도 여기는 그대로입니다.
import { Router } from 'express';
import { NotFoundError } from '../middleware/errors.js';

// 응답 모양을 한 가지로 통일합니다.
// 다른 프로그램이 연결될 때 항상 data 키만 보면 되도록 하기 위해서입니다.
function send(res, data) {
  res.json({ data });
}

/**
 * @param {import('../repositories/portfolioRepository.js').PortfolioRepository} repository
 */
// 방문자용 주소이므로 초안(draft)은 빼고 공개된 것만 돌려줍니다.
const PUBLIC_ONLY = { onlyPublished: true };

export function createPortfolioRouter(repository) {
  const router = Router();

  // 전체를 한 번에 받습니다. 화면이 처음 열릴 때 쓰는 주소입니다.
  router.get('/portfolio', async (req, res) => {
    send(res, await repository.getPortfolio(PUBLIC_ONLY));
  });

  router.get('/profile', async (req, res) => {
    send(res, await repository.getProfile());
  });

  router.get('/projects', async (req, res) => {
    send(res, await repository.getProjects(PUBLIC_ONLY));
  });

  router.get('/projects/:id', async (req, res) => {
    const projects = await repository.getProjects(PUBLIC_ONLY);
    const project = projects.find((item) => item.id === req.params.id);

    if (!project) {
      throw new NotFoundError(`작업물을 찾을 수 없습니다: ${req.params.id}`);
    }

    send(res, project);
  });

  router.get('/credentials', async (req, res) => {
    send(res, await repository.getCredentials());
  });

  router.get('/credentials/:id', async (req, res) => {
    const credentials = await repository.getCredentials();
    const credential = credentials.find((item) => item.id === req.params.id);

    if (!credential) {
      throw new NotFoundError(`활동·자격을 찾을 수 없습니다: ${req.params.id}`);
    }

    send(res, credential);
  });

  return router;
}
