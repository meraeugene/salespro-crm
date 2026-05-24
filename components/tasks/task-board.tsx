"use client";

import { useMemo, useState } from "react";
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
import { CalendarDays, CheckCircle2, CheckSquare, Loader2, MoreHorizontal, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { TaskForm } from "@/components/forms/resource-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/use-crm";
import { shortDate } from "@/lib/utils";
import { mutateJson } from "@/services/fetcher";
import { useUiStore } from "@/store/ui-store";
import type { Task, TaskStatus } from "@/types/crm";

const columns: Array<{ id: TaskStatus; label: string }> = [
  { id: "Todo", label: "Todo" },
  { id: "In Progress", label: "In Progress" },
  { id: "Done", label: "Done" },
];

function statusTone(status: TaskStatus) {
  if (status === "Done") return "bg-emerald-50 text-emerald-700";
  if (status === "In Progress") return "bg-blue-50 text-primary";
  return "bg-orange-50 text-orange-700";
}

function columnTone(status: TaskStatus) {
  if (status === "Done") return "border-emerald-100";
  if (status === "In Progress") return "border-blue-100";
  return "border-orange-100";
}

export function TaskBoard({ onAdd }: { onAdd: () => void }) {
  const { data, isLoading } = useTasks();
  const { mutate } = useSWRConfig();
  const globalSearch = useUiStore((state) => state.search);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const tasks = useMemo(() => {
    const items = optimisticTasks ?? data ?? [];
    const terms = globalSearch.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return items;
    return items.filter((task) => {
      const haystack = `${task.title} ${task.description ?? ""} ${task.status} ${task.assigned_user ?? ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [data, globalSearch, optimisticTasks]);

  const grouped = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.id),
      })),
    [tasks],
  );
  const activeTask = useMemo(() => tasks.find((task) => task.id === activeId) ?? null, [activeId, tasks]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setActiveWidth(event.active.rect.current.initial?.width ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id ? String(event.over.id) : null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : "";
    const overTask = tasks.find((task) => task.id === overId);
    const overColumn = columns.find((column) => column.id === overId) ?? (overTask ? columns.find((column) => column.id === overTask.status) : undefined);
    const newStatus = overColumn?.id;
    setActiveId(null);
    setActiveWidth(null);
    setOverId(null);
    if (!newStatus) return;

    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const activeIndex = tasks.findIndex((task) => task.id === taskId);
    const overIndex = overTask ? tasks.findIndex((task) => task.id === overTask.id) : -1;
    const nextTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
    const reordered = overIndex >= 0 ? arrayMove(nextTasks, activeIndex, overIndex) : nextTasks;
    setOptimisticTasks(reordered);

    if (current.status === newStatus && overIndex >= 0) return;

    setUpdating(taskId);

    try {
      await mutate("/api/tasks", mutateJson<Task>("/api/tasks", "PATCH", { id: taskId, status: newStatus }), {
        optimisticData: reordered,
        populateCache: false,
        revalidate: true,
        rollbackOnError: true,
      });
      toast.success("Task status updated.");
      setOptimisticTasks(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update task.");
      setOptimisticTasks(null);
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletePending(true);
    try {
      await mutateJson("/api/tasks", "DELETE", { id });
      await mutate("/api/tasks", (current: Task[] | undefined) => current?.filter((task) => task.id !== id), { revalidate: false });
      await mutate("/api/tasks");
      toast.success("Task deleted.");
      setDeletingTask(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete task.");
    } finally {
      setDeletePending(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <Skeleton className="h-10 w-20 rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((column) => (
              <div key={column.id} className="rounded-lg border border-border p-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-4 h-32" />
                <Skeleton className="mt-3 h-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={() => {
                setActiveId(null);
                setActiveWidth(null);
                setOverId(null);
              }}
            >
              <div className="grid min-h-[360px] grid-cols-1 gap-4 overflow-x-auto pb-2 lg:grid-cols-3">
                {grouped.map((column) => (
                  <TaskColumn
                    key={column.id}
                    id={column.id}
                    label={column.label}
                    tasks={column.tasks}
                    updating={updating}
                    activeId={activeId}
                    overId={overId}
                    onEdit={setEditingTask}
                    onDelete={setDeletingTask}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
                {activeTask ? <TaskDragOverlay task={activeTask} width={activeWidth} /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <EmptyState title="No tasks" description="Create your first task to start tracking follow-up work." />
          )}
        </CardContent>
      </Card>

      <Modal open={Boolean(editingTask)} title="Edit task" onClose={() => setEditingTask(null)}>
        {editingTask ? (
          <TaskForm
            mode="edit"
            id={editingTask.id}
            onDone={() => setEditingTask(null)}
            initialValues={{
              title: editingTask.title,
              description: editingTask.description ?? "",
              status: editingTask.status,
              due_date: editingTask.due_date ?? "",
              assigned_to: editingTask.assigned_to ?? null,
            }}
          />
        ) : null}
      </Modal>
      <Modal open={Boolean(deletingTask)} title="Delete task" onClose={() => setDeletingTask(null)}>
        <div className="space-y-5">
          <p className="text-sm text-muted">This action will remove the task immediately.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingTask(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deletePending}
              onClick={() => (deletingTask?.id ? handleDelete(deletingTask.id) : null)}
            >
              {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {deletePending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function TaskColumn({
  id,
  label,
  tasks,
  updating,
  activeId,
  overId,
  onEdit,
  onDelete,
}: {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  updating: string | null;
  activeId: string | null;
  overId: string | null;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isOverColumn = isOver || tasks.some((task) => task.id === overId);
  return (
    <div ref={setNodeRef} className={`min-h-[320px] min-w-[260px] rounded-lg border bg-white p-3 ${isOverColumn ? "border-primary" : columnTone(id)}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{label}</h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(id)}`}>{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id}>
              {activeId && overId === task.id && activeId !== task.id ? <DropPreview /> : null}
              <TaskCard task={task} updating={updating === task.id} onEdit={onEdit} onDelete={onDelete} />
            </div>
          ))}
          {activeId && (overId === id || (isOverColumn && !tasks.some((task) => task.id === overId))) ? <DropPreview /> : null}
        </div>
      </SortableContext>
    </div>
  );
}

function DropPreview() {
  return <div className="mb-3 h-32 rounded-lg border-2 border-dashed border-primary bg-white/65 ring-4 ring-primary/10" />;
}

function TaskDragOverlay({ task, width }: { task: Task; width: number | null }) {
  return (
    <Card
      className="scale-105 border border-primary bg-white p-4 shadow-[0_22px_50px_rgba(17,24,39,0.22)]"
      style={width ? { width } : undefined}
    >
      <TaskCardContent task={task} updating={false} />
    </Card>
  );
}

function TaskCard({
  task,
  updating,
  onEdit,
  onDelete,
}: {
  task: Task;
  updating: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`w-full cursor-grab p-4 active:cursor-grabbing ${isDragging ? "opacity-30" : "shadow-[0_8px_22px_rgba(17,24,39,0.04)]"}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <TaskCardContent task={task} updating={updating} />
        <div className="relative shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setActionsOpen((value) => !value);
            }}
            aria-label="Task actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {actionsOpen ? (
            <div className="absolute right-0 top-11 z-20 w-36 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-[0_16px_35px_rgba(17,24,39,0.14)]">
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setActionsOpen(false);
                  onEdit(task);
                }}
                className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-blue-50 hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setActionsOpen(false);
                  onDelete(task);
                }}
                className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function TaskCardContent({ task, updating }: { task: Task; updating: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
          {task.status === "Done" ? <CheckCircle2 className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(task.status)}`}>{task.status}</span>
          <h4 className="mt-3 line-clamp-2 font-semibold">{task.title}</h4>
          <p className="mt-2 line-clamp-2 text-sm text-muted">{task.description ?? "No description"}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted">
        <CalendarDays className="h-4 w-4" />
        Due {shortDate(task.due_date ?? task.created_at)}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm text-muted">
        <UsersRound className="h-4 w-4" />
        {task.assigned_user ?? "Unassigned"}
      </div>
      {updating ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving
        </p>
      ) : null}
    </div>
  );
}
