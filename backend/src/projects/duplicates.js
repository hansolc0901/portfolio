// 같은 작업물이 두 번 들어갔는지 확인합니다.
//
// 판단 기준은 하나뿐입니다: 제목이 같으면 중복.
//   - 앞뒤 공백, 사이 띄어쓰기, 영문 대소문자 차이는 무시합니다.
//   - 제목이 비어 있으면 비교하지 않습니다. (제목 없는 초안이 여러 개일 수 있음)
//
// 기준을 하나로 둔 이유는, 어떤 경우에 중복이라고 할지 사람이 바로 알 수 있어야
// 화면의 안내도 이해되기 때문입니다.
import { PROJECT_FIELDS, isBlank } from './projectFields.js';

export function normalizeTitle(title) {
  return String(title ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * 같은 제목을 가진 다른 작업물을 하나 찾습니다.
 *
 * @param {Array}  projects  전체 목록
 * @param {string} title     새로 저장하려는 제목
 * @param {string} [exceptId] 자기 자신은 빼고 찾습니다 (수정할 때 사용)
 * @returns {Object|null}
 */
export function findDuplicate(projects, title, exceptId) {
  if (isBlank(title)) return null;

  const key = normalizeTitle(title);
  return (
    projects.find(
      (project) => project.id !== exceptId && normalizeTitle(project.title) === key,
    ) ?? null
  );
}

/**
 * 이미 목록에 쌓여 있는 중복을 찾습니다. (화면에 표시를 달기 위한 용도)
 * @returns {Set<string>} 중복인 작업물들의 id
 */
export function findDuplicateIds(projects) {
  const seen = new Map();

  for (const project of projects) {
    if (isBlank(project.title)) continue;
    const key = normalizeTitle(project.title);
    seen.set(key, [...(seen.get(key) ?? []), project.id]);
  }

  const ids = new Set();
  for (const group of seen.values()) {
    if (group.length > 1) group.forEach((id) => ids.add(id));
  }
  return ids;
}

/**
 * 합치기 — 남길 작업물의 '빈 칸만' 새 내용으로 채웁니다.
 * 이미 적혀 있던 값은 덮어쓰지 않으므로, 합쳐도 내용이 사라지지 않습니다.
 *
 * @returns {{ patch: Object, filledLabels: string[] }}
 */
export function fillEmptyFields(target, values) {
  const patch = {};
  const filledLabels = [];

  for (const field of PROJECT_FIELDS) {
    if (isBlank(target[field.key]) && !isBlank(values[field.key])) {
      patch[field.key] = values[field.key];
      filledLabels.push(field.label);
    }
  }

  return { patch, filledLabels };
}
