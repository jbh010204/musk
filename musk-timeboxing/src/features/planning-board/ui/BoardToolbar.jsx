import { Badge, Button, Card } from '../../../shared/ui'

function BoardToolbar({
  totalCards = 0,
  scheduledCards = 0,
  uncategorizedCount = 0,
  onCreateCard = () => {},
  onOpenCategoryManager = () => {},
  embedded = false,
}) {
  return (
    <Card className={embedded ? 'p-4' : 'p-5'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Planning Board
          </h3>
          <p className={`mt-2 font-semibold text-slate-900 dark:text-slate-100 ${embedded ? 'text-base' : 'text-lg'}`}>
            카드를 카테고리 스택으로 정리합니다.
          </p>
          {!embedded ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              자유 그림판처럼 보이지만 실제 데이터는 스택 순서와 카테고리로 구조화됩니다. 카드를 선택한 뒤 원형 노드를 누르거나 드래그로 옮길 수 있습니다.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              생성한 카드를 분류한 뒤 가운데 캔버스와 오른쪽 시간표로 넘깁니다.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className={embedded ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
            onClick={onOpenCategoryManager}
          >
            카테고리 관리
          </Button>
          <Button
            variant="primary"
            className={embedded ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
            data-testid="planning-board-open-create"
            onClick={onCreateCard}
          >
            일정 카드 만들기
          </Button>
        </div>
      </div>

      <div className={`${embedded ? 'mt-3' : 'mt-4'} flex flex-wrap items-center gap-2`}>
        <Badge tone="neutral">전체 카드 {totalCards}개</Badge>
        <Badge tone="neutral">미분류 {uncategorizedCount}개</Badge>
        <Badge tone="neutral">예정 연결 {scheduledCards}개</Badge>
      </div>
    </Card>
  )
}

export default BoardToolbar
