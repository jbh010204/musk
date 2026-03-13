import type { ComponentProps } from 'react'
import CategoryManagerModal from '../../features/category'
import DataTransferModal from '../../features/data-transfer'
import PatchNotesModal from '../../features/patch-notes'
import TemplateManagerModal from '../../features/template'
import Timeline, { RescheduleAssistantModal } from '../../features/timeline'
import QuickAddModal from '../../features/timeline/ui/QuickAddModal'

type CategoryModalProps = ComponentProps<typeof CategoryManagerModal>
type DataTransferModalProps = ComponentProps<typeof DataTransferModal>
type TemplateManagerModalProps = ComponentProps<typeof TemplateManagerModal>
type QuickAddModalProps = ComponentProps<typeof QuickAddModal>
type RescheduleModalProps = ComponentProps<typeof RescheduleAssistantModal>
type TimelineProps = ComponentProps<typeof Timeline>

interface QuickAddContext {
  dateStr: string
  dateLabel: string
  initialTemplateId: string
}

interface PlannerModalLayerProps {
  isPatchNotesOpen: boolean
  onClosePatchNotes: () => void
  isDataModalOpen: boolean
  dataTransfer: Pick<DataTransferModalProps, 'currentDate' | 'onImported' | 'showToast'>
  onCloseDataModal: () => void
  isCategoryManagerOpen: boolean
  categoryManager: Pick<
    CategoryModalProps,
    'categories' | 'onAddCategory' | 'onUpdateCategory' | 'onDeleteCategory'
  >
  onCloseCategoryManager: () => void
  isTemplateManagerOpen: boolean
  templateManager: Pick<
    TemplateManagerModalProps,
    'templates' | 'categories' | 'onAddTemplate' | 'onUpdateTemplate' | 'onDeleteTemplate'
  >
  onCloseTemplateManager: () => void
  quickAddContext: QuickAddContext | null
  quickAdd: Pick<QuickAddModalProps, 'categories' | 'templates' | 'onSubmit'>
  onCloseQuickAdd: () => void
  isRescheduleModalOpen: boolean
  reschedule: Pick<RescheduleModalProps, 'plan' | 'onApply'>
  onCloseRescheduleModal: () => void
}

export function PlannerModalLayer({
  isPatchNotesOpen,
  onClosePatchNotes,
  isDataModalOpen,
  dataTransfer,
  onCloseDataModal,
  isCategoryManagerOpen,
  categoryManager,
  onCloseCategoryManager,
  isTemplateManagerOpen,
  templateManager,
  onCloseTemplateManager,
  quickAddContext,
  quickAdd,
  onCloseQuickAdd,
  isRescheduleModalOpen,
  reschedule,
  onCloseRescheduleModal,
}: PlannerModalLayerProps) {
  return (
    <>
      {isPatchNotesOpen ? <PatchNotesModal onClose={onClosePatchNotes} /> : null}
      {isDataModalOpen ? (
        <DataTransferModal
          currentDate={dataTransfer.currentDate}
          onClose={onCloseDataModal}
          onImported={dataTransfer.onImported}
          showToast={dataTransfer.showToast}
        />
      ) : null}
      {isCategoryManagerOpen ? (
        <CategoryManagerModal
          categories={categoryManager.categories}
          onClose={onCloseCategoryManager}
          onAddCategory={categoryManager.onAddCategory}
          onUpdateCategory={categoryManager.onUpdateCategory}
          onDeleteCategory={categoryManager.onDeleteCategory}
        />
      ) : null}
      {isTemplateManagerOpen ? (
        <TemplateManagerModal
          templates={templateManager.templates}
          categories={templateManager.categories}
          onClose={onCloseTemplateManager}
          onAddTemplate={templateManager.onAddTemplate}
          onUpdateTemplate={templateManager.onUpdateTemplate}
          onDeleteTemplate={templateManager.onDeleteTemplate}
        />
      ) : null}
      {quickAddContext ? (
        <QuickAddModal
          dateStr={quickAddContext.dateStr}
          dateLabel={quickAddContext.dateLabel}
          categories={quickAdd.categories}
          templates={quickAdd.templates}
          initialTemplateId={quickAddContext.initialTemplateId}
          onClose={onCloseQuickAdd}
          onSubmit={quickAdd.onSubmit}
        />
      ) : null}
      {isRescheduleModalOpen ? (
        <RescheduleAssistantModal
          plan={reschedule.plan}
          onClose={onCloseRescheduleModal}
          onApply={reschedule.onApply}
        />
      ) : null}
    </>
  )
}
