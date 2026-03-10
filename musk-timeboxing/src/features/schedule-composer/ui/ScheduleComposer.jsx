import { Button, Card } from '../../../shared/ui'

function ScheduleComposer({ onJumpToDay = () => {} }) {
  return (
    <section data-testid="schedule-composer-view" className="space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Schedule Composer
        </h3>
        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          보드에서 정리한 카드를 시간표에 끼워 넣는 편성기 단계입니다.
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          1차 단계에서는 뷰 모드와 제품 계약만 먼저 고정하고, 다음 작업에서 카드 큐와 시간표 드롭을 연결합니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="primary" onClick={onJumpToDay}>
            일간 타임라인으로 돌아가기
          </Button>
        </div>
      </Card>

      <Card tone="subtle" className="p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          예정 범위:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>좌측 카드 큐 + 우측 30분 시간표</li>
          <li>카드 드롭 시 estimatedSlots 기반 timeBox 생성</li>
          <li>겹침 검사와 다중 카드 연속 배치</li>
        </ul>
      </Card>
    </section>
  )
}

export default ScheduleComposer
