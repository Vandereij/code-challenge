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
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryPill icon={<Users size={24} />} label="Servings" value={`${recipe.servings}`} />
        <SummaryPill icon={<Clock3 size={24} />} label="Time" value={totalMinutes ? `${totalMinutes} min` : "Ready"} />
        <SummaryPill icon={<Flame size={24} />} label="Difficulty" value={recipe.difficulty} />
        <SummaryPill icon={<ChefHat size={24} />} label="Cuisine" value={recipe.cuisine ?? "Home"} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.48fr)]">
        <RecipeMetaPanel recipeState={recipeState} totalMinutes={totalMinutes} />
        <DietaryTags tags={recipe.dietary_tags} />
      </div>

      {recipe.description ? (
        <p className="mb-0 max-w-[70ch] text-[1.02rem] leading-[1.45] text-[#465347] md:text-[1.08rem]">
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
  const timeSummary = [
    totalMinutes ? `${totalMinutes} min total` : "Ready when you are",
    recipe.prep_time_minutes ? `${recipe.prep_time_minutes} prep` : null,
    recipe.cook_time_minutes ? `${recipe.cook_time_minutes} cook` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-3 rounded-[20px] bg-[#fffaf0] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.45fr)]">
      <div className="flex min-h-[86px] flex-col justify-center rounded-[16px] border border-[#20302714] px-4 py-3">
        <p className={eyebrowClass}>Timing</p>
        <strong className="text-[1.05rem] font-semibold leading-[1.35] text-[#243229]">{timeSummary}</strong>
      </div>
      <div className="rounded-[16px] bg-[#e4ecdf] p-3 text-[#243229]">
        <p className={cx(eyebrowClass, "mb-1 text-[#53614f]")}>Servings</p>
        <strong className="block text-[2rem] leading-none">{visibleServings}</strong>
        <span className="mt-1 block text-sm font-semibold text-[#5e6a60]">
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
        <span className="font-semibold">No dietary tags found</span>
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
            className="inline-flex min-h-9 items-center rounded-full bg-[#f4e0bf] px-3 text-sm font-semibold capitalize text-[#7b5632]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
