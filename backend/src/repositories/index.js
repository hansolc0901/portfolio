// 어떤 저장소를 쓸지 고르는 곳입니다.
//
// ★ 데이터가 어디서 오는지 정하는 파일은 이 파일 하나뿐입니다.
//   라우트와 화면 코드는 저장소의 정체를 모릅니다.
//   그래서 JSON 에서 DB 로 바꿀 때 고칠 곳이 여기 한 곳입니다.
import { config } from '../config.js';
import { assertRepository } from './portfolioRepository.js';
import { createJsonRepository } from './jsonRepository.js';
import { createDbRepository } from './dbRepository.js';

const BUILDERS = {
  json: () => createJsonRepository({ dataFile: config.dataFile }),
  db: () => createDbRepository({ databaseUrl: config.databaseUrl }),
};

export function createRepository(source = config.dataSource) {
  const build = BUILDERS[source];

  if (!build) {
    const available = Object.keys(BUILDERS).join(', ');
    throw new Error(
      `DATA_SOURCE 값이 올바르지 않습니다: "${source}" (사용 가능: ${available})`,
    );
  }

  const repository = build();
  assertRepository(repository, source);
  return repository;
}
