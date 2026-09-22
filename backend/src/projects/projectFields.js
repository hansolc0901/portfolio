// 관리자 화면의 입력 칸을 정의합니다.
//
// ★ 칸의 이름·예시 문구·필수 여부를 정하는 곳은 이 파일 하나뿐입니다.
//   관리자 화면은 이 정의를 받아 폼을 만들고, 서버는 이 정의로 검사합니다.
//   그래서 화면과 서버의 규칙이 서로 어긋날 수 없습니다.
//
//   칸을 하나 늘리고 싶으면 아래 목록에 한 줄만 추가하면 됩니다.

export const PROJECT_FIELDS = [
  {
    key: 'title',
    label: '제목',
    type: 'text',
    // 빈칸일 때 옅은 색으로 보여 줄 예시입니다. 입력하면 사라집니다.
    placeholder: '예) 도시숲 품앗이 설계공모전 출품작',
    required: true,
  },
  {
    key: 'role',
    label: '내가 한 역할',
    type: 'text',
    placeholder: '예) 설계 총괄 및 판넬 레이아웃 담당',
    required: true,
  },
  {
    key: 'description',
    label: '설명',
    type: 'textarea',
    placeholder:
      '예) 노후 주거지의 자투리땅을 주민이 함께 가꾸는 도시숲으로 바꾸는 설계안입니다. 대상지 분석부터 식재 계획까지 맡았습니다.',
    required: true,
    rows: 5,
  },
  {
    key: 'date',
    label: '날짜',
    type: 'text',
    placeholder: '예) 2025.05  또는  2025.03 ~ 2025.06',
    required: true,
  },
  {
    key: 'teamSize',
    label: '참여인원수',
    type: 'number',
    placeholder: '예) 4',
    required: true,
    min: 1,
  },
  {
    key: 'notes',
    label: '참고사항',
    type: 'textarea',
    placeholder: '예) 교내 전시 예정 (선택 입력, 비워 두어도 됩니다)',
    // 참고사항만 비워 둘 수 있습니다.
    required: false,
    rows: 3,
  },
];

// 공개 상태와 초안 상태의 뜻을 한 곳에 적어 둡니다.
export const PROJECT_STATUSES = [
  {
    value: 'draft',
    label: '초안',
    // 초안은 빈칸이 있어도 저장됩니다.
    requiresAllFields: false,
    hint: '저장만 해 둡니다. 방문자에게는 보이지 않고 관리자 화면에서만 보입니다.',
  },
  {
    value: 'published',
    label: '공개',
    // 공개는 참고사항을 뺀 모든 칸이 채워져야 합니다.
    requiresAllFields: true,
    hint: '방문자에게 보입니다. 참고사항을 뺀 모든 칸을 채워야 저장됩니다.',
  },
];

export function findStatus(value) {
  return PROJECT_STATUSES.find((status) => status.value === value);
}

// 값이 비어 있는지 판단하는 기준을 한 곳에 둡니다.
// 공백만 적은 것도 비어 있는 것으로 봅니다.
export function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

// 공개 상태일 때 반드시 채워야 하는 칸들입니다.
export const REQUIRED_FIELDS = PROJECT_FIELDS.filter((field) => field.required);
