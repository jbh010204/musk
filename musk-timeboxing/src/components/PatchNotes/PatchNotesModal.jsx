const PATCH_NOTES = [
  {
    version: 'v0.10.0',
    date: '2026-03-07',
    title: '라이트 모드 가독성 보강 + 30분 카드 정렬',
    items: [
      '라이트 모드의 배경/패널/텍스트 대비를 WCAG AA 기준(일반 텍스트 4.5:1) 중심으로 재조정',
      '30분 카드 레이아웃을 태그/사유 → 제목 순으로 통일',
      '플로팅 액션 버튼(FAB) 메뉴에 패치노트 접근 추가',
    ],
  },
  {
    version: 'v0.9.0',
    date: '2026-03-07',
    title: '실행력 고도화 세트',
    items: [
      '타이머 모드: 시작/일시정지/타이머 완료(자동 actualMinutes 반영)',
      '자동 재배치 어시스턴트: 다음 날 빈 슬롯 기반 일괄 배치',
      '스킵 원인 기반 액션 템플릿 + 주간 계획 보드 프리뷰 추가',
    ],
  },
  {
    version: 'v0.8.0',
    date: '2026-03-06',
    title: '테마 및 조회 복원',
    items: [
      '다크/라이트 모드 토글 및 로컬 저장',
      '새로고침 시 최근 날짜/최근 슬롯 포커스 복원',
      '스토리지 스키마 v2 마이그레이션 정리',
    ],
  },
]

function PatchNotesModal({ onClose }) {
  return (
    <div className="ui-modal-shell" onClick={onClose}>
      <div className="ui-modal-card max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">패치노트</h3>
          <button type="button" onClick={onClose} className="ui-btn-ghost">
            닫기
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-300">
          최근 개선 내역을 버전 단위로 정리했습니다.
        </p>

        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {PATCH_NOTES.map((note) => (
            <section key={note.version} className="ui-panel-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-100">{note.title}</h4>
                <span className="rounded border border-gray-700 bg-gray-800/70 px-2 py-0.5 text-xs text-gray-300">
                  {note.version}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{note.date}</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-200">
                {note.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatchNotesModal
