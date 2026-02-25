"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { Recipe, RecipeCategory } from "@/types/recipe";
import { RECIPE_CATEGORIES } from "@/types/recipe";
import TagInput from "@/components/TagInput";
import { createClient } from "@/lib/supabase/client";
import defaultImage from "@/images/default.jpg";

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imgPreviewError, setImgPreviewError] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/recipes/${params.id}`);
        if (res.ok) {
          const data: Recipe = await res.json();
          setRecipe(data);
          setTitle(data.title);
          setImageUrl(data.image_url || "");
          setTotalTime(data.total_time || "");
          setPrepTime(data.prep_time || "");
          setCookTime(data.cook_time || "");
          setServings(data.servings?.toString() || "");
          setIngredients(data.ingredients.join("\n"));
          setInstructions(data.instructions.join("\n\n"));
          setNotes(data.notes || "");
          setTags(data.tags || []);
          setCategories(data.categories || []);
        }
      } catch {
        setError("Failed to load recipe");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const ext = rawExt === "jfif" ? "jpg" : rawExt;
      const safeName = `${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/covers/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/recipe-images/${path.split("/").map(encodeURIComponent).join("/")}`;

      setImageUrl(publicUrl);
      setImgPreviewError(false);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const body = {
      title: title.trim(),
      image_url: imageUrl.trim() || null,
      total_time: totalTime.trim() || null,
      prep_time: prepTime.trim() || null,
      cook_time: cookTime.trim() || null,
      servings: servings ? parseInt(servings) : null,
      ingredients: ingredients
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      instructions: instructions
        .split(/\n\n+/)
        .map((s) => s.trim())
        .filter(Boolean),
      notes: notes.trim() || null,
      tags: tags.length > 0 ? tags : null,
      categories,
    };

    try {
      const res = await fetch(`/api/recipes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      router.push(`/recipe/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-lg font-semibold">Recipe not found</p>
        <button onClick={() => router.push("/")} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Edit Recipe</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-error-light p-4 text-sm text-error">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Recipe Photo</label>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card">
            {imageUrl && !imgPreviewError ? (
              <Image
                src={imageUrl}
                alt="Recipe preview"
                fill
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
                onError={() => setImgPreviewError(true)}
                unoptimized={imageUrl.toLowerCase().endsWith(".jfif")}
              />
            ) : (
              <Image
                src={defaultImage}
                alt="Default recipe"
                fill
                placeholder="blur"
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
              />
            )}

            {uploadingImage && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                <svg className="h-8 w-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-2 text-xs font-medium text-foreground shadow-md backdrop-blur-sm active:scale-95 transition-transform disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Change Photo
            </button>
          </div>
          {imageUrl && (
            <button
              type="button"
              onClick={() => { setImageUrl(""); setImgPreviewError(false); }}
              className="mt-2 text-xs text-muted hover:text-error transition-colors"
            >
              Remove photo (use default)
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">Total Time</label>
            <input
              type="text"
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              placeholder="30 min"
              className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">Prep Time</label>
            <input
              type="text"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="10 min"
              className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">Cook Time</label>
            <input
              type="text"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="20 min"
              className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Servings</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            min="1"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            Ingredients (one per line)
          </label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            Instructions (separate steps with blank lines)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Tags</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Categories</label>
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
                    : "border border-border bg-card text-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-border py-3.5 text-sm font-semibold transition-colors hover:bg-card"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
