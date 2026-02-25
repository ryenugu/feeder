import MealPlanWeek from "@/components/MealPlanWeek";

export default function MealPlanPage() {
  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Meal Plan</h1>
      </div>
      <MealPlanWeek />
    </div>
  );
}
