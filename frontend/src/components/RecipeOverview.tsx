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
    <div className="recipe-overview contents">
      {recipe.description ? (
        <p className="recipe-description mb-0 max-w-[70ch] text-[1.02rem] leading-[1.45] text-[#465347] md:text-[1.08rem]">
          {recipe.description}
        </p>
      ) : null}

      <div className="recipe-meta-grid grid grid-cols-1 gap-3 lg:grid-cols-[minmax(210px,0.38fr)_minmax(0,1fr)]">
        <DietaryTags tags={recipe.dietary_tags} />
        <RecipeMetaPanel recipeState={recipeState} totalMinutes={totalMinutes} />
      </div>

      <div className="summary-pill-grid grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryPill icon={<Users size={24} />} label="Servings" value={`${recipe.servings}`} />
        <SummaryPill icon={<Clock3 size={24} />} label="Time" value={totalMinutes ? `${totalMinutes} min` : "Ready"} />
        <SummaryPill icon={<Flame size={24} />} label="Difficulty" value={recipe.difficulty} />
        <SummaryPill icon={<ChefHat size={24} />} label="Cuisine" value={recipe.cuisine ?? "Home"} />
      </div>
    </div>
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
    <div className="recipe-meta-panel grid gap-2.5 rounded-[16px] bg-[#fffaf0] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(136px,0.4fr)]">
      <div className="flex min-h-[68px] flex-col justify-center rounded-[14px] border border-[#20302714] px-3 py-2.5">
        <p className={eyebrowClass}>Timing</p>
        <strong className="text-[0.98rem] font-semibold leading-[1.25] text-[#243229]">{timeSummary}</strong>
      </div>
      <div className="rounded-[14px] bg-[#e4ecdf] p-2.5 text-[#243229]">
        <p className={cx(eyebrowClass, "mb-1 text-[#53614f]")}>Servings</p>
        <strong className="block text-[1.55rem] leading-none">{visibleServings}</strong>
        <span className="mt-0.5 block text-xs font-semibold text-[#5e6a60]">
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
      <div className="flex min-h-[82px] items-center gap-3 rounded-[16px] bg-[#fffaf0] p-3 text-[#5e6a60]">
        <Tags size={24} />
        <span className="font-semibold">No dietary tags found</span>
      </div>
    );
  }

  return (
    <div className="dietary-panel rounded-[16px] bg-[#fffaf0] p-3">
      <p className={eyebrowClass}>Dietary</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex min-h-8 items-center rounded-full bg-[#f4e0bf] px-2.5 text-sm font-semibold capitalize text-[#7b5632]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
