"use client";

import { useState, useTransition } from "react";
import { addListItem, deleteListItem, setSuggestionStatus, updateListItem } from "../actions";

export interface EditableItem {
  id: string;
  name: string;
  sort_order: number;
  /** fixed lists */
  is_active?: boolean;
  /** suggestable lists */
  status?: "pending" | "approved" | "rejected";
  is_other?: boolean;
}

function useRun() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>, after?: () => void) =>
    startTransition(async () => {
      try {
        await fn();
        after?.();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  return { pending, run };
}

function Row({ table, item }: { table: string; item: EditableItem }) {
  const [name, setName] = useState(item.name);
  const [order, setOrder] = useState(String(item.sort_order));
  const { pending, run } = useRun();
  const dirty = name !== item.name || order !== String(item.sort_order);
  const enabled = item.status ? item.status === "approved" : item.is_active !== false;

  return (
    <li className={`flex flex-wrap items-end gap-2 py-3 ${enabled ? "" : "opacity-60"}`}>
      <label className="min-w-40 flex-1">
        <span className="sr-only">Name</span>
        <input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="w-20">
        <span className="hint">Order</span>
        <input className="input" type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
      </label>
      {item.is_other && <span className="badge self-center">“Other” (reviewer labels it)</span>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={!dirty || pending}
          onClick={() => run(() => updateListItem(table, item.id, { name, sort_order: Number(order) }))}
        >
          Save
        </button>
        {item.status ? (
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={pending}
            onClick={() => run(() => setSuggestionStatus(table, item.id, enabled ? "rejected" : "approved"))}
          >
            {enabled ? "Hide" : item.status === "pending" ? "Approve" : "Show"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={pending}
            onClick={() => run(() => updateListItem(table, item.id, { is_active: !enabled }))}
          >
            {enabled ? "Deactivate" : "Activate"}
          </button>
        )}
        <button
          type="button"
          className="btn-danger btn-sm"
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete “${item.name}”?`)) run(() => deleteListItem(table, item.id));
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function ListEditor({ title, table, items, help }: { title: string; table: string; items: EditableItem[]; help: string }) {
  const [newName, setNewName] = useState("");
  const { pending, run } = useRun();
  return (
    <section className="card space-y-2">
      <h2 className="h2">{title}</h2>
      <p className="hint">{help}</p>
      <ul className="divide-y divide-border">
        {items.map((i) => (
          <Row key={`${i.id}-${i.name}-${i.sort_order}-${i.is_active}-${i.status}`} table={table} item={i} />
        ))}
      </ul>
      <form
        className="flex gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addListItem(table, newName), () => setNewName(""));
        }}
      >
        <label className="flex-1">
          <span className="sr-only">New {title} item</span>
          <input className="input" placeholder="Add new…" maxLength={60} value={newName} onChange={(e) => setNewName(e.target.value)} required />
        </label>
        <button className="btn-primary" disabled={pending}>
          Add
        </button>
      </form>
    </section>
  );
}
