"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSWRConfig } from "swr";
import { BriefcaseBusiness, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DealForm } from "@/components/forms/resource-forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { PipelineSkeleton } from "@/components/skeletons/pipeline-skeleton";
import { mutateJson } from "@/services/fetcher";
import { useDeals } from "@/hooks/use-crm";
import { currency } from "@/lib/utils";
import type { Deal, DealStage } from "@/types/crm";

const columns: Array<{ id: "new" | "qualified" | "proposal" | "won" | "lost"; label: string; dropStage: DealStage; stages: DealStage[] }> = [
  { id: "new", label: "New", dropStage: "New Lead", stages: ["New Lead", "Contacted"] },
  { id: "qualified", label: "Qualified", dropStage: "Qualified", stages: ["Qualified"] },
  { id: "proposal", label: "Proposal", dropStage: "Proposal Sent", stages: ["Proposal Sent", "Negotiation"] },
  { id: "won", label: "Won", dropStage: "Won", stages: ["Won"] },
  { id: "lost", label: "Lost", dropStage: "Lost", stages: ["Lost"] },
];

function columnForStage(stage: DealStage) {
  return columns.find((column) => column.stages.includes(stage)) ?? columns[0];
}

function columnTone(id: string) {
  if (id === "won") return "border-emerald-100 bg-white";
  if (id === "lost") return "border-red-100 bg-white";
  if (id === "proposal") return "border-blue-100 bg-white";
  if (id === "qualified") return "border-indigo-100 bg-white";
  return "border-slate-200 bg-white";
}

function cardTone(id: string) {
  if (id === "won") return "bg-emerald-50/80 border-emerald-100";
  if (id === "lost") return "bg-red-50/80 border-red-100";
  if (id === "proposal") return "bg-blue-50/80 border-blue-100";
  if (id === "qualified") return "bg-indigo-50/70 border-indigo-100";
  return "bg-slate-50 border-slate-200";
}

export function PipelineBoard() {
  const { data, isLoading } = useDeals();
  const { mutate } = useSWRConfig();
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [optimisticDeals, setOptimisticDeals] = useState<Deal[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const localDeals = useMemo(() => optimisticDeals ?? data ?? [], [data, optimisticDeals]);

  const grouped = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      deals: localDeals.filter((deal) => column.stages.includes(deal.stage)),
    }));
  }, [localDeals]);

  const activeDeal = useMemo(() => localDeals.find((deal) => deal.id === activeId) ?? null, [activeId, localDeals]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id ? String(event.over.id) : null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const dealId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : "";
    const overDeal = localDeals.find((deal) => deal.id === overId);
    const overColumn = columns.find((column) => column.id === overId) ?? (overDeal ? columnForStage(overDeal.stage) : undefined);
    const newStage = overColumn?.dropStage;
    setActiveId(null);
    setOverId(null);
    if (!newStage || !localDeals.length) return;
    const current = localDeals.find((deal) => deal.id === dealId);
    if (!current) return;

    const activeIndex = localDeals.findIndex((deal) => deal.id === dealId);
    const overIndex = overDeal ? localDeals.findIndex((deal) => deal.id === overDeal.id) : -1;
    const nextDeals = localDeals.map((deal) => (deal.id === dealId ? { ...deal, stage: newStage } : deal));
    const reordered = overIndex >= 0 ? arrayMove(nextDeals, activeIndex, overIndex) : nextDeals;
    setOptimisticDeals(reordered);

    if (current.stage === newStage && overIndex >= 0) return;

    setUpdating(dealId);
    try {
      await mutate("/api/deals", mutateJson<Deal>("/api/deals", "PATCH", { id: dealId, stage: newStage }), {
      optimisticData: reordered,
      populateCache: false,
      revalidate: true,
      rollbackOnError: true,
    });
    } finally {
    setOptimisticDeals(null);
    setUpdating(null);
    }
  }

  async function handleDeleteDeal(id: string) {
    try {
      await mutateJson("/api/deals", "DELETE", { id });
      await mutate("/api/deals", (current: Deal[] | undefined) => current?.filter((deal) => deal.id !== id), { revalidate: false });
      await mutate("/api/deals");
      toast.success("Deal deleted.");
      setDeletingDeal(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete deal.");
    }
  }

  if (isLoading) return <PipelineSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Deal
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={() => { setActiveId(null); setOverId(null); }}>
        <div className="grid min-h-[500px] grid-cols-1 gap-3 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-5">
          {grouped.map((column) => (
            <PipelineColumn key={column.id} id={column.id} label={column.label} deals={column.deals} updating={updating} activeId={activeId} overId={overId} onEdit={setEditingDeal} onDelete={setDeletingDeal} />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeDeal ? <DealCardContent deal={activeDeal} updating={false} dragOverlay /> : null}
        </DragOverlay>
      </DndContext>
      <Modal open={createOpen} title="Create deal" onClose={() => setCreateOpen(false)}>
        <DealForm onDone={() => setCreateOpen(false)} />
      </Modal>
      <Modal open={Boolean(editingDeal)} title="Edit deal" onClose={() => setEditingDeal(null)}>
        {editingDeal ? (
          <DealForm
            mode="edit"
            id={editingDeal.id}
            onDone={() => setEditingDeal(null)}
            initialValues={{
              title: editingDeal.title,
              company: editingDeal.company,
              value: editingDeal.value,
              stage: editingDeal.stage,
              assigned_to: editingDeal.assigned_to ?? null,
              expected_close_date: editingDeal.expected_close_date,
            }}
          />
        ) : null}
      </Modal>
      <Modal open={Boolean(deletingDeal)} title="Delete deal" onClose={() => setDeletingDeal(null)}>
        <div className="space-y-5">
          <p className="text-sm text-muted">
            This action will remove the deal from the pipeline immediately.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingDeal(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => (deletingDeal?.id ? handleDeleteDeal(deletingDeal.id) : null)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PipelineColumn({ id, label, deals, updating, activeId, overId, onEdit, onDelete }: { id: string; label: string; deals: Deal[]; updating: string | null; activeId: string | null; overId: string | null; onEdit: (deal: Deal) => void; onDelete: (deal: Deal) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const value = deals.reduce((sum, deal) => sum + deal.value, 0);
  const isOverColumn = isOver || deals.some((deal) => deal.id === overId);

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[210px] rounded-lg border bg-white p-3 ${isOverColumn ? "border-primary" : columnTone(id)}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-xs text-muted">{currency(value)}</p>
        </div>
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-50 px-2 text-sm font-semibold text-primary">{deals.length}</span>
      </div>
      <SortableContext items={deals.map((deal) => deal.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {deals.map((deal) => (
            <div key={deal.id}>
              {activeId && overId === deal.id && activeId !== deal.id ? <DropPreview /> : null}
              <DealCard deal={deal} updating={updating === deal.id} tone={cardTone(id)} onEdit={onEdit} onDelete={onDelete} />
            </div>
          ))}
          {activeId && (overId === id || (isOverColumn && !deals.some((deal) => deal.id === overId))) ? <DropPreview /> : null}
        </div>
      </SortableContext>
    </div>
  );
}

function DropPreview() {
  return <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary bg-white/65 ring-4 ring-primary/10" />;
}

function DealCard({ deal, updating, tone, onEdit, onDelete }: { deal: Deal; updating: boolean; tone: string; onEdit: (deal: Deal) => void; onDelete: (deal: Deal) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const [actionsOpen, setActionsOpen] = useState(false);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab p-4 transition duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_14px_30px_rgba(37,99,235,0.14)] active:cursor-grabbing ${tone} ${isDragging ? "opacity-30" : "shadow-[0_8px_22px_rgba(17,24,39,0.04)]"}`}
      {...listeners}
      {...attributes}
    >
      <DealCardContent
        deal={deal}
        updating={updating}
        actions={
          <div className="relative shrink-0" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-9 w-9"
              onClick={() => setActionsOpen((value) => !value)}
              aria-label={`${deal.title} actions`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {actionsOpen ? (
              <div className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-[0_16px_35px_rgba(17,24,39,0.14)]">
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    onEdit(deal);
                  }}
                  className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-blue-50 hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    onDelete(deal);
                  }}
                  className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        }
      />
    </Card>
  );
}

function DealCardContent({ deal, updating, dragOverlay = false, actions }: { deal: Deal; updating: boolean; dragOverlay?: boolean; actions?: ReactNode }) {
  return (
    <div className={`flex items-start gap-3 ${dragOverlay ? "w-64 scale-105 rounded-lg border border-primary bg-white p-4 shadow-[0_22px_50px_rgba(17,24,39,0.22)]" : ""}`}>
      <span className="rounded-lg bg-primary/20 p-2 text-primary-dark">
        <BriefcaseBusiness className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-semibold">{deal.title}</h4>
        <p className="mt-1 truncate text-xs text-muted">{deal.company}</p>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold">{currency(deal.value)}</span>
          <span className="text-muted">{deal.probability}% close</span>
        </div>
        {updating ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving
          </p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
