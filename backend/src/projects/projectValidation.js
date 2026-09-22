// 관리자가 보낸 내용을 검사하고 정리합니다.
//
// 화면에서도 같은 검사를 하지만, 화면의 검사는 언제든 건너뛸 수 있습니다.
// 그래서 서버에서 한 번 더 검사합니다. 이 검사가 최종 기준입니다.
import { PROJECT_FIELDS, REQUIRED_FIELDS, findStatus, isBlank } from './projectFields.js';

// 제목에서 주소로 쓸 수 있는 식별자를 만듭니다. (예: "도시숲 품앗이" → "project-1a2b3c")
function createId() {
  const random = Math.random().toString(36).slice(2, 8);
  return `project-${Date.now().toString(36)}-${random}`;
}

/**
 * 관리자가 보낸 값을 검사합니다.
 * @returns {{ errors: Object<string,string>, value: Object }}
 *          errors 가 비어 있으면 통과입니다.
 */
export function validateProject(input = {}) {
  const errors = {};
  const value = {};

  // 1. 상태(초안/공개)부터 확인합니다. 어떤 검사를 할지가 여기서 갈립니다.
  const status = findStatus(input.status);
  if (!status) {
    errors.status = '초안 또는 공개 중에서 골라 주세요.';
  }
  value.status = status ? status.value : 'draft';

  // 2. 각 칸의 값을 정리합니다.
  for (const field of PROJECT_FIELDS) {
    const raw = input[field.key];

    if (field.type === 'number') {
      if (isBlank(raw)) {
        value[field.key] = null;
      } else {
        const number = Number(raw);
        if (!Number.isInteger(number) || number < (field.min ?? 0)) {
          errors[field.key] = `${field.label}은(는) ${field.min ?? 0} 이상의 정수로 적어 주세요.`;
        }
        value[field.key] = Number.isInteger(number) ? number : null;
      }
      continue;
    }

    value[field.key] = isBlank(raw) ? '' : String(raw).trim();
  }

  // 3. 공개를 고른 경우에만 빈칸을 막습니다. 초안은 비어 있어도 됩니다.
  if (status?.requiresAllFields) {
    for (const field of REQUIRED_FIELDS) {
      if (isBlank(value[field.key])) {
        errors[field.key] = `공개하려면 ${field.label}을(를) 입력해야 합니다.`;
      }
    }
  }

  return { errors, value };
}

/**
 * 검사를 통과한 값으로 새 프로젝트를 만듭니다.
 * 관리자가 만든 프로젝트에는 사진·영상이 없으므로 media 를 넣지 않습니다.
 */
export function buildNewProject(value) {
  return {
    id: createId(),
    ...value,
    // 분야를 고르는 칸은 없으므로 비워 둡니다.
    // 비어 있으면 공개 화면의 '전체' 탭에서만 보입니다.
    category: '',
    tag: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// 수정은 저장소가 맡습니다.
// 기존 내용 위에 바뀐 칸만 덮어쓰므로, 사진·영상처럼
// 관리자 화면에 없는 항목은 그대로 남습니다.
