"use client";

import { useState } from "react";

const CATEGORIES = ["Video", "Writing", "Design", "Marketing", "Other"];

export function SubmitAiToolForm() {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !website.trim() || !description.trim() || !category) return;

    setLoading(true);
    try {
      const res = await fetch("/api/submit-ai-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, website, description, category })
      });
      if (res.ok) {
        setSubmitted(true);
        setName("");
        setWebsite("");
        setDescription("");
        setCategory("");
      } else {
        const data = await res.json();
        alert(data.error ?? "Submission failed");
      }
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="font-medium text-emerald-800">Thanks for submitting!</p>
        <p className="mt-2 text-sm text-emerald-700">
          We&apos;ll review your tool and add it to the directory if it fits. You can submit another tool below.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm font-medium text-emerald-700 hover:underline"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Tool name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          placeholder="e.g. Caption AI"
        />
      </div>
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-slate-700">
          Website URL *
        </label>
        <input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          placeholder="https://..."
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
          Category *
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
        >
          <option value="">Select...</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Description *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          placeholder="What does your tool do? Who is it for?"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-600 px-5 py-3.5 text-base font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
