// 저장소가 지켜야 할 약속(인터페이스)을 적어 둔 파일입니다.
// 실행되는 코드는 없고, 어떤 모양을 지켜야 하는지 설명만 담았습니다.
//
// 데이터를 JSON 파일에서 읽든 데이터베이스에서 읽든,
// 아래 네 함수만 같은 모양으로 있으면 나머지 코드는 고칠 필요가 없습니다.
//
// 네 함수는 모두 Promise 를 돌려줍니다(async).
// JSON 파일 읽기는 사실 기다릴 필요가 없지만, 데이터베이스는 기다려야 하므로
// 지금부터 async 로 맞춰 두면 나중에 바꿀 때 호출하는 쪽을 고치지 않아도 됩니다.

/**
 * @typedef {Object} Profile
 * @property {string} name        이름
 * @property {string} nameEn      영문 이름
 * @property {string} gender      성별
 * @property {string} birthDate   생년월일
 * @property {string} university  학교
 * @property {string} department  학과
 * @property {string} studentId   학번
 * @property {string} phone       연락처
 */

/**
 * @typedef {Object} Project
 * @property {string} id          고유 식별자 (DB 의 기본키가 됩니다)
 * @property {string} status      'draft'(초안) 또는 'published'(공개)
 * @property {string} category    분류. filters 의 value 와 맞춰야 합니다
 * @property {string} title       제목
 * @property {string} tag         카드 오른쪽 위 라벨
 * @property {string} description 설명
 * @property {string} role        내가 한 역할
 * @property {string} date        날짜
 * @property {number|null} teamSize 참여인원수
 * @property {string} notes       참고사항 (비어 있을 수 있음)
 * @property {Object} [media]     image 또는 video 정보 (없을 수 있음)
 */

/**
 * @typedef {Object} Credential
 * @property {string} id          고유 식별자
 * @property {string} category    구분 (학술 활동 / 공모전 참가 / 자격사항)
 * @property {string} title       항목 이름
 * @property {string} shortLabel  상단 띠에 짧게 표시할 이름
 * @property {string} description 설명
 * @property {string} icon        Lucide 아이콘 이름
 */

/**
 * @typedef {Object} Portfolio
 * @property {Profile} profile
 * @property {Array<{value: string, label: string}>} filters
 * @property {Project[]} projects
 * @property {Credential[]} credentials
 */

/**
 * 읽기 함수에 넘기는 조건입니다.
 * onlyPublished 가 true 면 초안(draft)을 빼고 돌려줍니다.
 * 방문자용 주소는 true, 관리자용 주소는 false 로 부릅니다.
 *
 * @typedef {{ onlyPublished?: boolean }} ReadOptions
 */

/**
 * 모든 저장소가 구현해야 하는 함수 목록입니다.
 *
 * @typedef {Object} PortfolioRepository
 * @property {(o?: ReadOptions) => Promise<Portfolio>}    getPortfolio    전체를 한 번에
 * @property {() => Promise<Profile>}                     getProfile      인적사항
 * @property {(o?: ReadOptions) => Promise<Project[]>}    getProjects     작업물 목록
 * @property {(id: string) => Promise<Project|null>}      getProject      작업물 하나
 * @property {() => Promise<Credential[]>}                getCredentials  활동·자격 목록
 * @property {(p: Project) => Promise<Project>}           createProject   새로 만들기
 * @property {(id: string, patch: Object) => Promise<Project|null>} updateProject 수정하기
 * @property {(id: string) => Promise<boolean>}           deleteProject   지우기 (중복 합치기에 사용)
 */

// 저장소가 약속을 지키는지 시작할 때 한 번 확인합니다.
// 함수 이름을 빠뜨리면 서버가 켜질 때 바로 알려 줍니다.
export const REQUIRED_METHODS = [
  'getPortfolio',
  'getProfile',
  'getProjects',
  'getProject',
  'getCredentials',
  'createProject',
  'updateProject',
  'deleteProject',
];

/**
 * @param {object} repository 확인할 저장소
 * @param {string} name 오류 메시지에 쓸 이름
 */
export function assertRepository(repository, name) {
  const missing = REQUIRED_METHODS.filter(
    (method) => typeof repository?.[method] !== 'function',
  );

  if (missing.length > 0) {
    throw new Error(
      `${name} 저장소에 다음 함수가 없습니다: ${missing.join(', ')}\n` +
        'backend/src/repositories/portfolioRepository.js 의 약속을 확인하세요.',
    );
  }
}
