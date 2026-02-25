"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ExtractedRecipe, RecipeCategory } from "@/types/recipe";
import { RECIPE_CATEGORIES } from "@/types/recipe";
import Image from "next/image";
import TagInput from "./TagInput";

type InputMode = "url" | "document";

const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.gif";
const MAX_FILE_SIZE_MB = 20;

export default function AddRecipeForm() {
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExtractedRecipe | null>(null);
  const [linkOnly, setLinkOnly] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function switchMode(newMode: InputMode) {
    setMode(newMode);
    setError(null);
    setPreview(null);
    setLinkOnly(false);
    setLinkTitle("");
    setFile(null);
    setUrl("");
    setCategories([]);
    setTags([]);
    setNotes("");
  }

  function handleFileSelect(selected: File | null) {
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(selected.type)) {
      setError("Unsupported file type. Please upload a PDF or image.");
      return;
    }

    setFile(selected);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFileSelect(dropped);
  }

  function handleSaveAsLink() {
    setError(null);
    setPreview(null);
    setLinkOnly(true);
    setLinkTitle("");
  }

  async function handleExtractUrl(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreview(null);
    setLinkOnly(false);

    try {
      const res = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtractDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/recipes/extract-from-document", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preview && !linkOnly) return;
    if (linkOnly && !linkTitle.trim()) return;
    setSaving(true);
    setError(null);

    const body = linkOnly
      ? {
          title: linkTitle.trim(),
          source_url: url,
          source_name: (() => {
            try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
          })(),
          image_url: null,
          total_time: null,
          prep_time: null,
          cook_time: null,
          servings: null,
          ingredients: [],
          instructions: [],
          categories,
          tags: tags.length > 0 ? tags : null,
          notes: notes.trim() || null,
        }
      : {
          ...preview,
          categories,
          tags: tags.length > 0 ? tags : null,
          notes: notes.trim() || null,
        };

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.refresh();
      router.push(`/recipe/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  function fileIcon() {
    if (!file) return null;
    if (file.type === "application/pdf") {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-xl bg-background p-1 border border-border">
        <button
          type="button"
          onClick={() => switchMode("url")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            mode === "url"
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          From URL
        </button>
        <button
          type="button"
          onClick={() => switchMode("document")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            mode === "document"
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          From Document
        </button>
      </div>

      {/* URL input */}
      {mode === "url" && (
        <form onSubmit={handleExtractUrl} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a recipe URL..."
              required
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all active:scale-95 active:bg-primary/80 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Extracting
                </span>
              ) : (
                "Extract"
              )}
            </button>
          </div>
          {!preview && !linkOnly && url && !loading && (
            <button
              type="button"
              onClick={handleSaveAsLink}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              Site blocking extraction? Save as link only
            </button>
          )}
        </form>
      )}

      {/* Document upload */}
      {mode === "document" && (
        <form onSubmit={handleExtractDocument} className="space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : file
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-primary">{fileIcon()}</span>
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-2 rounded-full p-1 text-muted hover:bg-background hover:text-foreground"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-medium">
                  Drop a file here or tap to browse
                </p>
                <p className="text-xs text-muted">
                  PDF, JPEG, PNG, WebP, GIF &middot; Max {MAX_FILE_SIZE_MB}MB
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-primary/80 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Extracting recipe...
              </span>
            ) : (
              "Extract from Document"
            )}
          </button>
        </form>
      )}

      {error && (
        <div className="space-y-3">
          <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
          {mode === "url" && !linkOnly && url && (
            <button
              type="button"
              onClick={handleSaveAsLink}
              className="w-full rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground transition-all active:scale-[0.98] hover:border-primary"
            >
              Save as link only instead
            </button>
          )}
        </div>
      )}

      {linkOnly && (
        <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <p className="text-xs text-muted truncate">{url}</p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">Title</h4>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Give this recipe a name..."
              autoFocus
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">Tags</h4>
            <TagInput tags={tags} onChange={setTags} placeholder="e.g. quick, pasta, vegetarian..." />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">
              Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {RECIPE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setCategories((prev) =>
                      prev.includes(cat)
                        ? prev.filter((c) => c !== cat)
                        : [...prev, cat]
                    )
                  }
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors active:scale-95 ${
                    categories.includes(cat)
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-muted active:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">Notes</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any personal notes, tips, or modifications..."
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setLinkOnly(false); setLinkTitle(""); }}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition-all active:scale-[0.98] hover:border-primary hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !linkTitle.trim()}
              className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-primary/80 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Link"}
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-start gap-4">
            {preview.image_url && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={preview.image_url}
                  alt={preview.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-snug">
                {preview.title}
              </h3>
              {preview.source_name && (
                <p className="mt-0.5 text-xs text-muted">
                  {preview.source_url === "uploaded-document"
                    ? `Uploaded: ${preview.source_name}`
                    : preview.source_name}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                {preview.total_time && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-primary">
                    {preview.total_time}
                  </span>
                )}
                {preview.servings && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-primary">
                    {preview.servings} servings
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">
              Ingredients ({preview.ingredients.length})
            </h4>
            <ul className="space-y-1 text-sm">
              {preview.ingredients.slice(0, 8).map((ing, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                  {ing}
                </li>
              ))}
              {preview.ingredients.length > 8 && (
                <li className="text-muted">
                  +{preview.ingredients.length - 8} more...
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">
              Instructions ({preview.instructions.length} steps)
            </h4>
            <ul className="space-y-1 text-sm">
              {preview.instructions.slice(0, 3).map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-primary/60">
                    {i + 1}.
                  </span>
                  <span className="line-clamp-2">{step}</span>
                </li>
              ))}
              {preview.instructions.length > 3 && (
                <li className="text-muted">
                  +{preview.instructions.length - 3} more steps...
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">Tags</h4>
            <TagInput tags={tags} onChange={setTags} placeholder="e.g. quick, pasta, vegetarian..." />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">
              Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {RECIPE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setCategories((prev) =>
                      prev.includes(cat)
                        ? prev.filter((c) => c !== cat)
                        : [...prev, cat]
                    )
                  }
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors active:scale-95 ${
                    categories.includes(cat)
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-muted active:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">Notes</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any personal notes, tips, or modifications..."
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-primary/80 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Recipe"}
          </button>
        </div>
      )}
    </div>
  );
}
