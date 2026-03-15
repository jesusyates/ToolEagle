"use client";

import { useEffect, useState } from "react";
import { DelegatedButton } from "./DelegatedButton";

type Project = { id: string; name: string; created_at: string };

type ProjectSelectorModalProps = {
  open: boolean;
  onClose: () => void;
  content: string;
  onSelect: (projectId: string, projectName: string) => void | Promise<void>;
  onCreateAndSave: (projectName: string) => void | Promise<void>;
};

export function ProjectSelectorModal({
  open,
  onClose,
  content,
  onSelect,
  onCreateAndSave
}: ProjectSelectorModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    fetch("/api/projects", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((data) => {
        if (!cancelled) {
          setProjects(data.projects ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await onCreateAndSave(name);
      onClose();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-selector-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="project-selector-title" className="text-lg font-semibold text-slate-900">
          Save to project
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose an existing project or create a new one.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading projects...</p>
        ) : (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {projects.map((p) => (
              <DelegatedButton
                key={p.id}
                onClick={async () => {
                  await onSelect(p.id, p.name);
                  onClose();
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {p.name}
              </DelegatedButton>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">Create new project</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <DelegatedButton
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {creating ? "..." : "Create & Save"}
            </DelegatedButton>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
