export const PATCH_NOTES = [
  {
    version: 'v0.12.6',
    date: '2026-03-07',
    title: '라이트 모드 계층 분리 + 재생 버튼 우상단 정렬',
    summary: '정보 계층을 더 또렷하게 만들고 재생 버튼을 상태 배지 근처로 재배치해 겹침을 해소했습니다.',
    focus: [
      '라이트 모드에서 중요 카드와 컨테이너 레벨이 섞여 보이는 문제를 톤 단계로 분리',
      '타임박스 재생 버튼이 텍스트와 충돌하지 않도록 액션 영역을 우상단에 고정',
    ],
    improvements: [
      '앱 레이아웃 컨테이너(좌/우 패널)를 `ui-panel-subtle`로 낮추고 내부 카드를 상대적으로 강조',
      '`ui-panel-subtle` 라이트 톤을 `bg-slate-100`으로 조정해 중요/비중요 계층 대비 강화',
      '재생 버튼/완료 버튼을 우상단(상태 배지 주변)으로 이동하고 본문 패딩을 재조정해 겹침 제거',
    ],
    validation: ['Playwright 시각 점검 + lint/build/e2e 전체 회귀 통과'],
  },
  {
    version: 'v0.12.5',
    date: '2026-03-07',
    title: '라이트 모드 톤 계층 리팩토링',
    summary: 'Playwright 시각 점검 결과를 기반으로 라이트 모드 색상 계층을 가이드 토큰에 맞게 정렬했습니다.',
    focus: [
      '라이트 모드에서 어두운 패널이 남는 문제를 제거하고 Surface-over-Background 구조를 강화',
      '가이드 토큰(#F8F9FA/#FFFFFF/#1F1F1F/#444746)을 실제 렌더 결과와 일치시키는 데 집중',
    ],
    improvements: [
      'ui-panel/ui-panel-subtle/modal/app/header/nav의 라이트 기본 톤을 레이어드 화이트 구조로 재정의',
      'theme-light 토큰 오버라이드에 `bg-slate-50`, `bg-white`, `text-slate-*` 계층 추가',
      'Playwright E2E에 라이트 모드 토큰 검증 테스트 추가',
    ],
    validation: ['Playwright 풀스크린 시각 점검 + lint/build/e2e(전체) 통과'],
  },
  {
    version: 'v0.12.4',
    date: '2026-03-07',
    title: '타임라인 재생 버튼 시각 안정화',
    summary: '타임박스 재생 버튼을 중앙 정렬하고 태그 충돌을 해소해 조작성을 높였습니다.',
    focus: [
      '재생 버튼을 핵심 액션 트리거로 인지할 수 있도록 카드 중앙에 명확히 노출',
      '30분 카드에서 카테고리 태그와 버튼이 겹치지 않도록 텍스트 레이아웃 우선순위 조정',
    ],
    improvements: [
      '재생 버튼을 카드 수직 중앙으로 이동하고 좌측 액센트 바 기준 16px 이상 여백 확보',
      '컴팩트 카드에서 내용 텍스트 우선 배치 + 태그를 후순위 배지로 이동',
      '재생/완료 버튼 hover 시 scale-110 마이크로 인터랙션 추가',
    ],
    validation: ['lint/build/e2e(전체) 회귀 통과 기준으로 반영'],
  },
  {
    version: 'v0.12.3',
    date: '2026-03-07',
    title: 'Gemini 라이트 모드 레퍼런스 규칙 추가',
    summary: 'Front-end UX Guardian/가이드에 레이어드 화이트와 톤 기반 계층 원칙을 공식 반영했습니다.',
    focus: [
      '세션마다 라이트 모드 색상 톤이 흔들리지 않도록 참조 토큰을 고정',
      '선 기반 분할 대신 tonal elevation 원칙을 문서 상위 규칙으로 명시',
    ],
    improvements: [
      '.agents/FRONTEND_UX_GUARDIAN에 Gemini Light Mode Principle 섹션 추가',
      'AI_FRONTEND_GUIDE에 Surface-over-Background 요약 규칙 추가',
      '배경/카드/텍스트 색상 기준(#F8F9FA/#FFFFFF/#1F1F1F/#444746) 문서화',
    ],
    validation: ['문서 규칙 반영 + lint/build + patch-notes e2e + 전체 e2e 회귀 통과'],
  },
  {
    version: 'v0.12.2',
    date: '2026-03-07',
    title: '스켈레톤 로딩 + 삭제 마이크로 인터랙션',
    summary: '타임라인 인사이트 카드 로딩 전환을 부드럽게 만들고 브레인덤프 삭제 애니메이션을 추가했습니다.',
    focus: [
      '데이터 전환 시 카드가 갑자기 나타나는 감각을 줄이기 위해 스켈레톤 기반 전환 UX를 적용',
      '작은 삭제 동작에도 시각적 피드백이 남도록 slide-out 마이크로 인터랙션을 도입',
    ],
    improvements: [
      '날짜 이동 시 타임라인 상단 인사이트 영역에 스켈레톤 UI 표시 후 페이드 인 전환',
      '브레인덤프 항목 삭제 시 우측으로 밀리며 사라지는 220ms 애니메이션 적용',
      'E2E에 스켈레톤 표시/삭제 애니메이션 회귀 테스트 추가',
    ],
    validation: ['lint/build/e2e(전체) 통과 기준으로 반영'],
  },
  {
    version: 'v0.12.1',
    date: '2026-03-07',
    title: 'Front-end UX Guardian 규칙 도입',
    summary: '세션 간 UI 일관성을 위해 에이전트 기반 Look & Feel 규칙을 문서 체계에 통합했습니다.',
    focus: [
      '디자인 원칙이 세션마다 흔들리지 않도록 에이전트 문서와 기존 가이드를 동기화',
      'DnD/접근성 무결성을 보존하면서 시각적 미니멀 룰을 강제하는 기준 정립',
    ],
    improvements: [
      '.agents/FRONTEND_UX_GUARDIAN 문서 신설 및 SESSION_PLAYBOOK에 UI 작업 전 참조 규칙 추가',
      'AI_FRONTEND_GUIDE에 Interaction/Component 고정 규칙(브랜드 컬러, DnD 핸들러 보호) 확장',
      'README AI 협업 문서 목록에 Front-end UX Guardian 경로 연결',
    ],
    validation: ['문서 경로 연결 검증 + lint/build/e2e(패치노트/전체 회귀) 통과'],
  },
  {
    version: 'v0.12.0',
    date: '2026-03-07',
    title: '패치노트 운영 규칙 문서화',
    summary: '중요 변경마다 패치노트가 누락되지 않도록 세션 공통 규칙을 고정했습니다.',
    focus: [
      '새 세션이 들어와도 동일한 품질 기준으로 기록이 이어지도록 운영 절차를 표준화',
      '문서와 에이전트 지침이 서로 모순되지 않도록 단일 워크플로 경로를 추가',
    ],
    improvements: [
      '.agents/SESSION_PLAYBOOK에 중요 변경 시 패치노트 반영을 필수 단계로 추가',
      'docs에 PATCH_NOTES_WORKFLOW 문서 신설 및 DELIVERY/CONVENTIONS에 트리거 규칙 연결',
      'README AI 협업 문서 목록에 패치노트 워크플로 링크 추가',
    ],
    validation: [
      '문서 경로 연결 및 패치노트 모달 최신 버전(v0.12.0) 표시 확인',
      'lint/build/e2e 회귀 기준으로 문서 변경 절차를 유지',
    ],
  },
  {
    version: 'v0.11.0',
    date: '2026-03-07',
    title: '패치노트 상세보기 구조 도입',
    summary: '버전별 기록을 요약+상세로 분리해 추적성을 높였습니다.',
    focus: [
      '기능 추가보다 변경 의도와 품질 근거가 남도록 기록 포맷을 표준화',
      '히스토리 누락을 막기 위해 이전 릴리스까지 역추적 반영',
    ],
    improvements: [
      '패치노트를 버전 카드 + 상세보기(아코디언) UI로 개편',
      '`신경 쓴 부분 / 개선 사항 / 검증` 3단 섹션으로 상세 정보 구조화',
    ],
    validation: ['lint/build/e2e 회귀 통과를 기준으로 패치노트 반영'],
  },
  {
    version: 'v0.10.0',
    date: '2026-03-07',
    title: '라이트 모드 가독성 보강 + FAB 패치노트 진입',
    summary: '라이트 테마 대비를 높이고 FAB(플로팅 액션 버튼)에 패치노트 진입을 추가했습니다.',
    focus: [
      'WCAG 대비 기준(일반 텍스트 4.5:1)을 만족하는 텍스트/배경 대비 강화',
      '투명 배경(`bg-gray-900/60` 등)까지 라이트 톤으로 일관 치환',
    ],
    improvements: [
      '라이트 모드 색상 계층(배경/패널/텍스트/보더) 재정의',
      'FAB 메뉴에 `패치노트` 액션 및 모달 연결',
      '30분 카드에서 태그/사유 → 제목 순서로 정렬 통일',
    ],
    validation: ['E2E: theme-toggle, patch-notes, timeline-scale, skip-reason 통과'],
  },
  {
    version: 'v0.9.0',
    date: '2026-03-07',
    title: '실행력 고도화 세트',
    summary: '계획-실행 간 간극을 줄이기 위한 실행 기능들을 추가했습니다.',
    focus: [
      '실행 데이터(actualMinutes) 입력 마찰을 줄이기 위한 자동화',
      '미완료 일정 처리 시간을 단축하는 다음 날 배치 자동화',
    ],
    improvements: [
      '타이머 모드(시작/일시정지/완료) 및 자동 실제시간 반영',
      '자동 재배치 어시스턴트(다음 날 빈 슬롯 기반 일괄 적용)',
      '스킵 원인 기반 액션 템플릿 + 주간 계획 보드 프리뷰',
    ],
    validation: ['E2E: timer-mode, reschedule-assistant, skip-template-action 통과'],
  },
  {
    version: 'v0.8.0',
    date: '2026-03-06',
    title: '테마/조회 복원 + 스토리지 스키마 정비',
    summary: '새로고침 이후 컨텍스트를 잃지 않도록 복원 로직을 추가했습니다.',
    focus: [
      '사용자가 마지막으로 보던 날짜/슬롯에서 즉시 작업 재개 가능하도록 설계',
      '기존 저장 데이터와 호환되는 점진적 스키마 마이그레이션',
    ],
    improvements: [
      '다크/라이트 모드 토글 및 테마 저장',
      '최근 날짜/최근 슬롯 포커스 복원',
      '스토리지 schemaVersion v2 정규화',
    ],
    validation: ['E2E: theme-toggle, recent-restore 통과'],
  },
  {
    version: 'v0.7.0',
    date: '2026-03-06',
    title: '드래그 UX/리포트 확장',
    summary: '드래그 가시성과 주간 리포트를 강화했습니다.',
    focus: [
      '드롭 성공 예측 가능성을 높이기 위해 프리뷰 라인/가이드 도입',
      '주간 리포트의 해석력을 높이기 위해 원인 변화 데이터 추가',
    ],
    improvements: [
      '타임라인 드롭 프리뷰 라인 + 가이드 메시지',
      '주간/일간 리포트 접기-펼치기',
      '스킵 원인 변화(지난주 대비) 시각화',
    ],
    validation: ['E2E: inbox-to-timeline-dnd, report-toggle, weekly-report, skip-trend 통과'],
  },
  {
    version: 'v0.6.0',
    date: '2026-03-05',
    title: '핵심 플래너 루프 안정화',
    summary: '브레인덤프→빅3→타임라인 기본 루프를 안정화했습니다.',
    focus: [
      '드롭 좌표 오차와 겹침 충돌 같은 사용 중단 포인트 제거',
      '완료/스킵 데이터가 회고 카드에 반영되도록 흐름 정합성 확보',
    ],
    improvements: [
      '드래그앤드롭 슬롯 매핑 안정화 및 겹침 방지',
      '완료 모달, 스킵 사유 저장, 카드 비교 지표 반영',
      '카테고리 관리/데이터 내보내기-가져오기 도입',
    ],
    validation: ['E2E 회귀 기준 항목 전체 통과(당시 기준)'],
  },
]
