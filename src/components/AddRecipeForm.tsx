"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ExtractedRecipe, RecipeCategory } from "@/types/recipe";
import { RECIPE_CATEGORIES } from "@/types/recipe";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import TagInput from "./TagInput";

type InputMode = "url" | "document";
type MultiDocMode = "same" | "separate";

const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.gif";
const MAX_FILE_SIZE_MB = 20;
const MAX_FILES = 10;

const VALID_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function isValidUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

export default function AddRecipeForm() {
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [multiDocMode, setMultiDocMode] = useState<MultiDocMode>("same");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExtractedRecipe | null>(null);
  const [batchPreviews, setBatchPreviews] = useState<ExtractedRecipe[]>([]);
  const [linkOnly, setLinkOnly] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState("");
  const [previewImageError, setPreviewImageError] = useState(false);
  const [docOnly, setDocOnly] = useState(false);
  const [docOnlyTitle, setDocOnlyTitle] = useState("");
  const [lastUploadedPaths, setLastUploadedPaths] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function switchMode(newMode: InputMode) {
    setMode(newMode);
    setError(null);
    setPreview(null);
    setBatchPreviews([]);
    setLinkOnly(false);
    setLinkTitle("");
    setDocOnly(false);
    setDocOnlyTitle("");
    setLastUploadedPaths([]);
    setFiles([]);
    setUrl("");
    setCategories([]);
    setTags([]);
    setNotes("");
    setExtractionProgress("");
  }

  function handleFilesAdd(incoming: FileList | File[]) {
    const newFiles: File[] = [];
    for (const f of Array.from(incoming)) {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`"${f.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB per file.`);
        return;
      }
      if (!VALID_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not a supported file type. Use PDF or images.`);
        return;
      }
      newFiles.push(f);
    }
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        return prev;
      }
      return combined;
    });
    setError(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFilesAdd(e.dataTransfer.files);
  }

  function handleSaveAsLink() {
    setError(null);
    setPreview(null);
    setLinkOnly(true);
    setLinkTitle("");
  }

  function handleSaveAsDocOnly() {
    setError(null);
    setPreview(null);
    setDocOnly(true);
    setDocOnlyTitle("");
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
      setPreviewImageError(false);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function uploadToStorage(
    filesToUpload: File[]
  ): Promise<{ storage_paths: string[]; file_types: string[]; file_names: string[] }> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const batchId = crypto.randomUUID();
    const storage_paths: string[] = [];
    const file_types: string[] = [];
    const file_names: string[] = [];

    for (const file of filesToUpload) {
      const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const ext = rawExt === "jfif" ? "jpg" : rawExt;
      const safeName = `${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/${batchId}/${safeName}`;
      const { error } = await supabase.storage
        .from("recipe-images")
        .upload(path, file);
      if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      storage_paths.push(path);
      file_types.push(file.type);
      file_names.push(file.name);
    }

    return { storage_paths, file_types, file_names };
  }

  async function extractFiles(filesToExtract: File[]): Promise<ExtractedRecipe> {
    setExtractionProgress("Uploading files...");
    const uploadResult = await uploadToStorage(filesToExtract);
    setLastUploadedPaths(uploadResult.storage_paths);

    setExtractionProgress(
      filesToExtract.length > 1
        ? `Extracting recipe from ${filesToExtract.length} documents...`
        : "Extracting recipe..."
    );
    const res = await fetch("/api/recipes/extract-from-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploadResult),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to extract");
    return data;
  }

  async function handleExtractDocument(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setBatchPreviews([]);
    setExtractionProgress("");
    setPreviewImageError(false);

    try {
      if (files.length === 1 || multiDocMode === "same") {
        const recipe = await extractFiles(files);
        setPreview(recipe);
      } else {
        const results: ExtractedRecipe[] = [];
        for (let i = 0; i < files.length; i++) {
          setExtractionProgress(
            `Uploading & extracting recipe ${i + 1} of ${files.length}...`
          );
          const recipe = await extractFiles([files[i]]);
          results.push(recipe);
        }
        setBatchPreviews(results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setExtractionProgress("");
    }
  }

  async function handleSave() {
    if (!preview && !linkOnly && !docOnly) return;
    if (linkOnly && !linkTitle.trim()) return;
    if (docOnly && !docOnlyTitle.trim()) return;
    setSaving(true);
    setError(null);

    let body;
    if (linkOnly) {
      body = {
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
      };
    } else if (docOnly) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const sourceImages = lastUploadedPaths.map(
        (p) =>
          `${supabaseUrl}/storage/v1/object/public/recipe-images/${p.split("/").map(encodeURIComponent).join("/")}`
      );
      body = {
        title: docOnlyTitle.trim(),
        source_url: "uploaded-document",
        source_name: files.map((f) => f.name).join(", "),
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
        source_images: sourceImages,
      };
    } else {
      body = {
        ...preview,
        categories,
        tags: tags.length > 0 ? tags : null,
        notes: notes.trim() || null,
      };
    }

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/recipe/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  async function handleSaveBatch() {
    if (batchPreviews.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      for (const recipe of batchPreviews) {
        const body = {
          ...recipe,
          categories,
          tags: tags.length > 0 ? tags : null,
          notes: notes.trim() || null,
        };
        const res = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || `Failed to save "${recipe.title}"`);
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipes");
      setSaving(false);
    }
  }

  function fileIcon(f: File) {
    if (f.type === "application/pdf") {
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
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
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
          {!preview && !linkOnly && url && !loading && !error && (
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
                : files.length > 0
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesAdd(e.target.files);
                }
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="hidden"
            />

            {files.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">
                  {files.length} {files.length === 1 ? "file" : "files"} selected
                </p>
                <p className="text-xs text-muted">
                  Drop or tap to add more (max {MAX_FILES})
                </p>
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
                  Drop files here or tap to browse
                </p>
                <p className="text-xs text-muted">
                  PDF, JPEG, PNG, WebP, GIF &middot; Max {MAX_FILE_SIZE_MB}MB per file
                </p>
              </div>
            )}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${f.size}-${i}`}
                  className="flex items-center gap-3 rounded-lg bg-card border border-border px-3 py-2"
                >
                  <span className="text-primary shrink-0">{fileIcon(f)}</span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted">
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="shrink-0 rounded-full p-1 text-muted hover:bg-background hover:text-foreground"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Multi-doc toggle — only shown when 2+ files */}
          {files.length > 1 && (
            <div className="flex gap-1 rounded-xl bg-background p-1 border border-border">
              <button
                type="button"
                onClick={() => setMultiDocMode("same")}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                  multiDocMode === "same"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Pages of same recipe
              </button>
              <button
                type="button"
                onClick={() => setMultiDocMode("separate")}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                  multiDocMode === "separate"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Each is a separate recipe
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || files.length === 0}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-primary/80 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {extractionProgress || "Extracting..."}
              </span>
            ) : files.length > 1 && multiDocMode === "separate" ? (
              `Extract ${files.length} Recipes`
            ) : (
              "Extract from Document"
            )}
          </button>
        </form>
      )}

      {error && (
        <div className="space-y-3">
          <div className="rounded-xl bg-error-light p-4 text-sm text-error">
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
          {mode === "document" && !docOnly && lastUploadedPaths.length > 0 && (
            <button
              type="button"
              onClick={handleSaveAsDocOnly}
              className="w-full rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground transition-all active:scale-[0.98] hover:border-primary"
            >
              Save as document only instead
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

      {docOnly && (
        <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-xs text-muted truncate">
              {files.map((f) => f.name).join(", ")}
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">Title</h4>
            <input
              type="text"
              value={docOnlyTitle}
              onChange={(e) => setDocOnlyTitle(e.target.value)}
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
              onClick={() => { setDocOnly(false); setDocOnlyTitle(""); }}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition-all active:scale-[0.98] hover:border-primary hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !docOnlyTitle.trim()}
              className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-primary/80 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Document"}
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-start gap-4">
            {preview.image_url && isValidUrl(preview.image_url) && !previewImageError && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={preview.image_url}
                  alt={preview.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={preview.image_url.toLowerCase().endsWith(".jfif")}
                  onError={() => setPreviewImageError(true)}
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

      {/* Batch preview — shown when extracting separate recipes from multiple docs */}
      {batchPreviews.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
            <p className="text-sm font-semibold text-primary">
              {batchPreviews.length} {batchPreviews.length === 1 ? "recipe" : "recipes"} extracted
            </p>
            <p className="text-xs text-muted mt-0.5">
              Review below, then save all at once.
            </p>
          </div>

          {batchPreviews.map((bp, idx) => (
            <div key={idx} className="rounded-2xl bg-card p-4 shadow-sm space-y-2">
              <h3 className="text-base font-bold leading-snug">{bp.title}</h3>
              {bp.source_name && (
                <p className="text-xs text-muted">
                  Uploaded: {bp.source_name}
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                {bp.total_time && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-primary">
                    {bp.total_time}
                  </span>
                )}
                {bp.servings && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-primary">
                    {bp.servings} servings
                  </span>
                )}
                <span className="text-muted">
                  {bp.ingredients.length} ingredients &middot; {bp.instructions.length} steps
                </span>
              </div>
            </div>
          ))}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">Tags</h4>
            <TagInput tags={tags} onChange={setTags} placeholder="Applied to all recipes..." />
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
              placeholder="Applied to all recipes..."
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          <button
            onClick={handleSaveBatch}
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-primary/80 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : `Save All ${batchPreviews.length} Recipes`}
          </button>
        </div>
      )}
    </div>
  );
}
