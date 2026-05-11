import { useMemo } from "react";
import { useCoAgent } from "@copilotkit/react-core";
import { CircleAlert } from "lucide-react";
import type { RecipeContext, UploadResponse } from "../lib/types";
import { ChatPanel } from "./ChatPanel";
import { CookModePanel } from "./CookModePanel";
import { IngredientsPanel } from "./IngredientsPanel";
import { RecipeOverview } from "./RecipeOverview";
import { EmptyRecipeState, ParsingState } from "./RecipeStates";
import { UploadButton } from "./UploadButton";
import { cx, eyebrowClass, panelFrame } from "./shared";

interface RecipeWorkspaceProps {
  initialState: RecipeContext;
  threadId?: string;
  uploading: boolean;
  uploadError: string | null;
  onUploadStart: () => void;
  onUploadComplete: (response: UploadResponse) => void;
  onUploadError: (message: string) => void;
}

export function RecipeWorkspace({
  initialState,
  threadId,
  uploading,
  uploadError,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: RecipeWorkspaceProps) {
  const { state, setState } = useCoAgent<RecipeContext>({
    name: "recipe_agent",
    initialState,
  });

  const recipeState = state ?? initialState;
  const recipe = recipeState.recipe;

  const checkedIngredientSet = useMemo(
    () => new Set(recipeState.checked_ingredients),
    [recipeState.checked_ingredients],
  );

  const totalMinutes = useMemo(() => {
    if (!recipe) return null;
    const total = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
    return total || null;
  }, [recipe]);

  const patchRecipeState = (patch: Partial<RecipeContext>) => {
    setState((previousState) => ({
      ...(previousState ?? recipeState),
      ...patch,
    }));
  };

  const updateStep = (current_step: number) => {
    patchRecipeState({
      current_step,
      cooking_started: true,
    });
  };

  const toggleIngredient = (name: string) => {
    setState((previousState) => {
      const nextState = previousState ?? recipeState;
      const checked = nextState.checked_ingredients.includes(name)
        ? nextState.checked_ingredients.filter((item) => item !== name)
        : [...nextState.checked_ingredients, name];

      return {
        ...nextState,
        checked_ingredients: checked,
      };
    });
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-28px)] max-w-[1180px] grid-cols-1 gap-5 md:min-h-[calc(100vh-48px)] lg:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.9fr)]">
      <section className={cx(panelFrame, "flex flex-col gap-5 rounded-[22px] p-5 md:p-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={eyebrowClass}>Kitchen Companion</p>
            <h1 className="mb-0 text-[clamp(2rem,4vw,3.4rem)] leading-[1.02] tracking-normal">
              {recipe?.title ?? "Drop in a recipe"}
            </h1>
          </div>
          <UploadButton
            uploading={uploading}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            onUploadError={onUploadError}
          />
        </div>

        {uploadError ? (
          <div
            className="flex min-h-16 items-center gap-3 rounded-[20px] bg-[#ffe3df] px-4 py-3.5 font-extrabold text-[#6b211c]"
            role="alert"
          >
            <CircleAlert size={24} />
            <span>{uploadError}</span>
          </div>
        ) : null}

        {uploading ? <ParsingState /> : null}
        {!recipe && !uploading ? <EmptyRecipeState /> : null}

        {recipe ? (
          <>
            <RecipeOverview recipeState={recipeState} totalMinutes={totalMinutes} />

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-[18px] xl:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.15fr)]">
              <IngredientsPanel
                ingredients={recipe.ingredients}
                checkedIngredients={recipeState.checked_ingredients}
                checkedIngredientSet={checkedIngredientSet}
                onToggleIngredient={toggleIngredient}
              />
              <CookModePanel
                currentStepIndex={recipeState.current_step}
                cookingStarted={recipeState.cooking_started}
                steps={recipe.steps}
                onStepChange={updateStep}
              />
            </div>
          </>
        ) : null}
      </section>

      <ChatPanel recipe={recipe} threadId={threadId} />
    </div>
  );
}
