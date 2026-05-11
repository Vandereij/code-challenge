import { ChefHat, Clock3, Flame, Tags, Users } from "lucide-react";
import type { RecipeContext } from "../lib/types";
import { eyebrowClass, cx, SummaryPill } from "./shared";

interface RecipeOverviewProps {
  recipeState: RecipeContext;
  totalMinutes: number | null;
}

export function RecipeOverview({ recipeState, totalMinutes }: RecipeOverviewProps) {
  const recipe = recipeState.recipe;
  if (!recipe) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryPill icon={<Users size={24} />} label="Servings" value={`${recipe.servings}`} />
        <SummaryPill icon={<Clock3 size={24} />} label="Time" value={totalMinutes ? `${totalMinutes} min` : "Ready"} />
        <SummaryPill icon={<Flame size={24} />} label="Difficulty" value={recipe.difficulty} />
        <SummaryPill icon={<ChefHat size={24} />} label="Cuisine" value={recipe.cuisine ?? "Home"} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)]">
        <RecipeMetaPanel recipeState={recipeState} totalMinutes={totalMinutes} />
        <DietaryTags tags={recipe.dietary_tags} />
      </div>

      {recipe.description ? (
        <p className="mb-0 max-w-[66ch] text-[1.1rem] leading-[1.45] text-[#465347]">
          {recipe.description}
        </p>
      ) : null}
    </>
  );
}

function RecipeMetaPanel({
  recipeState,
  totalMinutes,
}: {
  recipeState: RecipeContext;
  totalMinutes: number | null;
}) {
  const recipe = recipeState.recipe;
  if (!recipe) return null;

  const visibleServings = recipeState.scaled_servings ?? recipe.servings;
  const originalServings = recipe.original_servings;
  const timeRows = [
    { label: "Prep", value: recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : "Flexible" },
    { label: "Cook", value: recipe.cook_time_minutes ? `${recipe.cook_time_minutes} min` : "Flexible" },
    { label: "Total", value: totalMinutes ? `${totalMinutes} min` : "Ready" },
  ];

  return (
    <div className="grid gap-3 rounded-[20px] bg-[#fffaf0] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(170px,0.7fr)]">
      <div>
        <p className={eyebrowClass}>Timing</p>
        <div className="grid grid-cols-3 gap-2">
          {timeRows.map((row) => (
            <div key={row.label} className="rounded-2xl bg-[#f2eadc] p-3">
              <span className="block text-[0.78rem] font-bold text-[#6f6759]">{row.label}</span>
              <strong className="mt-1 block text-[1rem] text-[#243229]">{row.value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-[#e4ecdf] p-3 text-[#243229]">
        <p className={cx(eyebrowClass, "mb-1 text-[#53614f]")}>Servings</p>
        <strong className="block text-[2.1rem] leading-none">{visibleServings}</strong>
        <span className="mt-1 block text-sm font-extrabold text-[#5e6a60]">
          {originalServings && originalServings !== visibleServings
            ? `Original ${originalServings}`
            : "Current recipe"}
        </span>
      </div>
    </div>
  );
}

function DietaryTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return (
      <div className="flex min-h-[114px] items-center gap-3 rounded-[20px] bg-[#fffaf0] p-4 text-[#5e6a60]">
        <Tags size={24} />
        <span className="font-extrabold">No dietary tags found</span>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-[#fffaf0] p-4">
      <p className={eyebrowClass}>Dietary</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex min-h-10 items-center rounded-full bg-[#f4e0bf] px-3 text-sm font-extrabold capitalize text-[#7b5632]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
