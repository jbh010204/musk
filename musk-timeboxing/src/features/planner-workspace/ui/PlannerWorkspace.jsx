import PlanningBoard from '../../planning-board'
import PlanningCanvas from '../../planning-canvas'
import ScheduleComposer from '../../schedule-composer'

function PlannerWorkspace({
  currentDate,
  data,
  categories,
  brainDumpItems,
  addBoardCard,
  updateBrainDumpItem,
  applyBrainDumpBoardLayout,
  updateBoardCanvas,
  onOpenCategoryManager,
  onScheduleBoardCard,
  onJumpToDay,
}) {
  return (
    <section data-testid="planner-workspace-view" className="space-y-4">
      <div className="rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/35 dark:text-slate-300">
        좌측 rail의 브레인 덤프와 빅3를 유지한 채, 메인 영역에서는 보드 정리, 캔버스 배치, 시간표 편성을 한 화면에서 이어서 진행합니다.
      </div>

      <div className="grid gap-6 2xl:grid-cols-[22rem_minmax(0,1fr)_24rem] xl:grid-cols-[20rem_minmax(0,1fr)]">
        <PlanningBoard
          items={brainDumpItems}
          categories={categories}
          onCreateCard={addBoardCard}
          onUpdateCard={updateBrainDumpItem}
          onApplyLayout={applyBrainDumpBoardLayout}
          onOpenCategoryManager={onOpenCategoryManager}
          embedded
        />

        <PlanningCanvas
          key={`${currentDate}-workspace`}
          currentDate={currentDate}
          boardCanvas={data.boardCanvas}
          brainDumpItems={brainDumpItems}
          categories={categories}
          timeBoxes={data.timeBoxes}
          onUpdateBoardCanvas={updateBoardCanvas}
          onUpdateCard={updateBrainDumpItem}
          onOpenBoard={() => {}}
          onOpenCategoryManager={onOpenCategoryManager}
          onOpenComposer={() => {}}
          embedded
        />

        <div className="2xl:col-auto xl:col-span-2">
          <ScheduleComposer
            items={brainDumpItems}
            categories={categories}
            timeBoxes={data.timeBoxes}
            onScheduleCard={onScheduleBoardCard}
            onJumpToDay={onJumpToDay}
            onJumpToBoard={() => {}}
            embedded
          />
        </div>
      </div>
    </section>
  )
}

export default PlannerWorkspace
