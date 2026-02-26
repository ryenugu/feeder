import AddRecipeForm from "@/components/AddRecipeForm";
import Link from "next/link";

export default function AddPage() {
  return (
    <div className="px-4">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-primary">Add Recipe</h1>
      </div>

      <AddRecipeForm />
    </div>
  );
}
