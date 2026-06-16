"use client";

import { useTransition } from "react";
import type { Task } from "@/lib/types";
import { toggleTaskCompletion } from "@/app/dashboard/actions";

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function TaskCompletionRow({ task, careRecipientId, disabled }: { task: Task; careRecipientId: string; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form className={`row task-row ${task.completed_at ? "is-complete" : ""} ${isPending ? "is-pending" : ""}`}>
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="careRecipientId" value={careRecipientId} />
      <label className="task-check">
        <input
          name="completed"
          type="checkbox"
          defaultChecked={!!task.completed_at}
          disabled={disabled || isPending}
          onChange={(event) => {
            const formData = new FormData(event.currentTarget.form || undefined);
            if (event.currentTarget.checked) formData.set("completed", "on");
            else formData.delete("completed");
            startTransition(() => {
              void toggleTaskCompletion(formData);
            });
          }}
        />
        <span>
          <strong>{task.title}</strong>
          <span>{task.owner_name || "Unassigned"} / {formatDate(task.due_at)} / {task.priority}</span>
          {task.completed_at && <span>Checked by {task.completed_by_name || "a care circle member"} / {formatDate(task.completed_at)}</span>}
          {isPending && <span>Saving...</span>}
        </span>
      </label>
    </form>
  );
}
