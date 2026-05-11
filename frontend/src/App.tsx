import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CopilotKit, useCoAgent } from "@copilotkit/react-core";
import {
  Check,
  ChefHat,
  CircleAlert,
  Clock3,
  FileText,
  Flame,
  ListChecks,
  Mic,
  Minus,
  Plus,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { uploadRecipe } from "./lib/api";
import type { Ingredient, RecipeContext, UploadResponse } from "./lib/types";
import { EMPTY_RECIPE_CONTEXT } from "./lib/types";

const CopilotChat = lazy(() =>
  import("@copilotkit/react-ui").then((module) => ({ default: module.CopilotChat })),
);

const panelFrame =
  "min-w-0 overflow-hidden border border-[#20302724] bg-[#fffcf5]/95 shadow-[0_24px_80px_rgba(68,55,40,0.12)]";

const eyebrowClass = "mb-1.5 text-[0.84rem] font-extrabold uppercase tracking-normal text-[#6d5c43]";

const countPillClass =
  "inline-flex min-h-10 items-center justify-center rounded-full bg-[#e4ecdf] px-3.5 font-extrabold text-[#315342]";

const maxUploadBytes = 10 * 1024 * 1024;
const acceptedUploadTypes = new Set(["application/pdf", "text/plain"]);

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function validateRecipeFile(file: File): string | null {
  if (file.size > maxUploadBytes) {
    return "Please upload a recipe smaller than 10 MB.";
  }

  const lowerName = file.name.toLowerCase();
  const hasAcceptedExtension = lowerName.endsWith(".pdf") || lowerName.endsWith(".txt");
  const hasAcceptedType = acceptedUploadTypes.has(file.type);
  const hasGenericType = file.type === "" || file.type === "application/octet-stream";

  if (!hasAcceptedType && !(hasGenericType && hasAcceptedExtension)) {
    return "Please upload a PDF or plain text recipe.";
  }

  return null;
}

function useIdleReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const markReady = () => setReady(true);

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(markReady, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(markReady, 300);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return ready;
}

export default function App() {
  const [initialState, setInitialState] = useState<RecipeContext>(EMPTY_RECIPE_CONTEXT);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="recipe_agent" threadId={threadId}>
      <main className="min-h-screen bg-[linear-gradient(135deg,#f6f2ea,#edf1e8)] p-3.5 text-[#17211b] md:p-6">
        <RecipeWorkspace
          key={threadId ?? "empty"}
          initialState={initialState}
          threadId={threadId}
          uploading={uploading}
          uploadError={uploadError}
          onUploadStart={() => {
            setUploadError(null);
            setUploading(true);
          }}
          onUploadComplete={(response) => {
            setThreadId(response.threadId);
            setInitialState(response.state);
            setUploading(false);
          }}
          onUploadError={(message) => {
            setUploadError(message);
            setUploading(false);
          }}
        />
      </main>
    </CopilotKit>
  );
}

interface RecipeWorkspaceProps {
  initialState: RecipeContext;
  threadId?: string;
  uploading: boolean;
  uploadError: string | null;
  onUploadStart: () => void;
  onUploadComplete: (response: UploadResponse) => void;
  onUploadError: (message: string) => void;
}

function RecipeWorkspace({
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
  const chatReady = useIdleReady();

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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryPill icon={<Users size={24} />} label="Servings" value={`${recipe.servings}`} />
              <SummaryPill icon={<Clock3 size={24} />} label="Time" value={totalMinutes ? `${totalMinutes} min` : "Ready"} />
              <SummaryPill icon={<Flame size={24} />} label="Difficulty" value={recipe.difficulty} />
              <SummaryPill icon={<ChefHat size={24} />} label="Cuisine" value={recipe.cuisine ?? "Home"} />
            </div>

            {recipe.description ? (
              <p className="mb-0 max-w-[66ch] text-[1.1rem] leading-[1.45] text-[#465347]">
                {recipe.description}
              </p>
            ) : null}

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-[18px] xl:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.15fr)]">
              <section className="min-h-0 rounded-[20px] bg-[#fffaf0] p-[18px]" aria-labelledby="ingredients-title">
                <div className="mb-4 flex items-center justify-between gap-[18px]">
                  <h2 className="mb-0 text-[1.3rem] font-bold" id="ingredients-title">
                    Ingredients
                  </h2>
                  <span className={countPillClass}>{recipeState.checked_ingredients.length}/{recipe.ingredients.length}</span>
                </div>
                <div className="grid max-h-[470px] gap-2.5 overflow-auto pr-1">
                  {recipe.ingredients.map((ingredient) => (
                    <IngredientRow
                      key={ingredient.name}
                      ingredient={ingredient}
                      checked={checkedIngredientSet.has(ingredient.name)}
                      onToggle={() => toggleIngredient(ingredient.name)}
                    />
                  ))}
                </div>
              </section>

              <section className="min-h-0 rounded-[20px] bg-[#fffaf0] p-[18px]" aria-labelledby="steps-title">
                <div className="mb-4 flex items-center justify-between gap-[18px]">
                  <h2 className="mb-0 text-[1.3rem] font-bold" id="steps-title">
                    Cook Mode
                  </h2>
                  <span className={countPillClass}>Step {recipeState.current_step + 1}/{recipe.steps.length}</span>
                </div>
                <div className="grid min-h-[300px] gap-[18px] rounded-[20px] bg-[#213229] p-[22px] text-[#fffaf0]">
                  <div className="flex items-center justify-between gap-3.5">
                    <button
                      className="inline-flex size-[68px] cursor-pointer items-center justify-center rounded-[20px] bg-[#fffaf0] text-[#213229] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Previous step"
                      disabled={recipeState.current_step === 0}
                      onClick={() => updateStep(Math.max(0, recipeState.current_step - 1))}
                    >
                      <Minus size={28} />
                    </button>
                    <strong className="text-[3.4rem] leading-none">{recipeState.current_step + 1}</strong>
                    <button
                      className="inline-flex size-[68px] cursor-pointer items-center justify-center rounded-[20px] bg-[#fffaf0] text-[#213229] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Next step"
                      disabled={recipeState.current_step >= recipe.steps.length - 1}
                      onClick={() =>
                        updateStep(Math.min(recipe.steps.length - 1, recipeState.current_step + 1))
                      }
                    >
                      <Plus size={28} />
                    </button>
                  </div>
                  <p className="mb-0 text-[clamp(1.45rem,3vw,2.25rem)] leading-[1.22]">
                    {recipe.steps[recipeState.current_step]?.instruction}
                  </p>
                  <div className="self-end flex flex-wrap gap-2.5">
                    {recipe.steps[recipeState.current_step]?.duration_minutes ? (
                      <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f6dfb4] px-3 font-extrabold text-[#243229]">
                        <Clock3 size={20} /> {recipe.steps[recipeState.current_step].duration_minutes} min
                      </span>
                    ) : null}
                    {recipe.steps[recipeState.current_step]?.requires_attention ? (
                      <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f6dfb4] px-3 font-extrabold text-[#243229]">
                        <Sparkles size={20} /> Keep close
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {recipe.steps.map((step, index) => (
                    <button
                      key={step.step_number}
                      className={cx(
                        "size-[52px] cursor-pointer rounded-[15px] font-black active:scale-[0.98]",
                        index === recipeState.current_step
                          ? "bg-[#b65f36] text-[#fffaf0]"
                          : "bg-[#efe4d2] text-[#213229]",
                      )}
                      onClick={() => updateStep(index)}
                    >
                      {step.step_number}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </section>

      <aside className={cx(panelFrame, "flex min-h-[560px] flex-col rounded-[22px]")}>
        <div className="flex flex-col gap-3 px-[22px] pt-[22px] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={eyebrowClass}>Live Agent</p>
            <h2 className="mb-0 text-[1.3rem] font-bold">Ask while you cook</h2>
          </div>
          <div className={countPillClass}>{threadId ? "Ready" : "Waiting"}</div>
        </div>
        <div className="flex flex-wrap gap-2 px-[22px] pb-3">
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#f4e0bf] px-2.5 text-[0.86rem] font-extrabold text-[#7b5632]"><Users size={18} /> Scale servings</span>
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#f4e0bf] px-2.5 text-[0.86rem] font-extrabold text-[#7b5632]"><ListChecks size={18} /> Next step</span>
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#f4e0bf] px-2.5 text-[0.86rem] font-extrabold text-[#7b5632]"><Mic size={18} /> Voice soon</span>
        </div>
        {chatReady ? (
          <Suspense fallback={<ChatLoadingState />}>
            <CopilotChat
              className="chat-box min-h-0 flex-1"
              labels={{
                initial: recipe
                  ? "I can scale servings, swap ingredients, or guide the next step."
                  : "Upload a recipe first, then I can help you cook it.",
                title: "Cooking Copilot",
              }}
            />
          </Suspense>
        ) : (
          <ChatLoadingState />
        )}
      </aside>
    </div>
  );
}

interface UploadButtonProps {
  uploading: boolean;
  onUploadStart: () => void;
  onUploadComplete: (response: UploadResponse) => void;
  onUploadError: (message: string) => void;
}

function UploadButton({
  uploading,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: UploadButtonProps) {
  const activeUploadRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef(0);

  useEffect(() => {
    return () => {
      activeUploadRef.current?.abort();
    };
  }, []);

  const handleFile = async (file?: File) => {
    if (!file) return;

    const validationError = validateRecipeFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    activeUploadRef.current?.abort();
    const uploadId = uploadIdRef.current + 1;
    uploadIdRef.current = uploadId;
    const controller = new AbortController();
    activeUploadRef.current = controller;

    onUploadStart();

    try {
      const response = await uploadRecipe(file, { signal: controller.signal });
      if (uploadIdRef.current === uploadId) {
        onUploadComplete(response);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (uploadIdRef.current === uploadId) {
        onUploadError(error instanceof Error ? error.message : "The recipe could not be uploaded.");
      }
    } finally {
      if (uploadIdRef.current === uploadId) {
        activeUploadRef.current = null;
      }
    }
  };

  return (
    <label
      className={cx(
        "relative inline-flex min-h-16 w-full min-w-[156px] cursor-pointer items-center justify-center gap-2.5 rounded-[18px] px-5 py-3.5 text-[#fffdf8] shadow-[0_14px_28px_rgba(47,111,88,0.24)] transition-[background,box-shadow,transform] duration-200 active:scale-[0.98] sm:w-auto",
        uploading ? "bg-[#8a6139]" : "bg-[#2f6f58]",
      )}
    >
      <Upload size={28} />
      <span>{uploading ? "Parsing" : "Upload"}</span>
      <input
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        type="file"
        accept=".pdf,.txt,text/plain,application/pdf"
        disabled={uploading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function SummaryPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[76px] items-center gap-3 rounded-2xl bg-[#eef3e9] p-3.5 text-[#24352c]">
      {icon}
      <div>
        <span className="block text-[0.84rem] font-bold text-[#637061]">{label}</span>
        <strong className="mt-0.5 block text-[1.15rem] capitalize">{value}</strong>
      </div>
    </div>
  );
}

function IngredientRow({
  ingredient,
  checked,
  onToggle,
}: {
  ingredient: Ingredient;
  checked: boolean;
  onToggle: () => void;
}) {
  const quantity = [ingredient.quantity, ingredient.unit].filter(Boolean).join(" ");
  return (
    <button
      className={cx(
        "grid min-h-[72px] w-full cursor-pointer grid-cols-[48px_1fr] gap-3 rounded-2xl p-2.5 text-left text-[#243229] transition-[background,transform] duration-150 active:scale-[0.98]",
        checked ? "bg-[#dce9d7]" : "bg-[#f2eadc]",
      )}
      onClick={onToggle}
    >
      <span className="flex size-12 items-center justify-center rounded-[14px] border-2 border-[#8aa081] text-[0.88rem] font-black text-[#315342]">
        {checked ? <Check size={24} strokeWidth={3} /> : null}
      </span>
      <span className="flex min-w-0 flex-col justify-center">
        <strong className="[overflow-wrap:anywhere] text-base">{ingredient.name}</strong>
        <small className="mt-1 [overflow-wrap:anywhere] text-sm text-[#6f6759]">
          {[quantity, ingredient.preparation].filter(Boolean).join(", ") || ingredient.category}
        </small>
      </span>
    </button>
  );
}

function EmptyRecipeState() {
  return (
    <div className="grid min-h-[430px] place-items-center content-center rounded-[20px] bg-[#fffaf0] p-8 text-center text-[#34453a]">
      <FileText size={56} />
      <h2 className="mb-0 text-[1.3rem] font-bold">Upload a PDF or text recipe</h2>
      <p className="mb-0 max-w-[420px] text-[1.08rem] leading-[1.45] text-[#5e6a60]">
        The recipe will appear here with ingredients, timings, servings, and a big-step cook mode for tablet use.
      </p>
    </div>
  );
}

function ParsingState() {
  return (
    <div
      className="grid min-h-[430px] grid-cols-1 place-items-center content-center gap-[22px] rounded-[20px] bg-[#fffaf0] p-8 text-center text-[#34453a] sm:grid-cols-[auto_minmax(0,360px)] sm:text-left"
      aria-live="polite"
    >
      <div className="grid size-[100px] animate-pulse place-items-center rounded-[28px] bg-[#b65f36] text-[#fffaf0]">
        <ChefHat size={44} />
      </div>
      <div>
        <h2 className="mb-0 text-[1.3rem] font-bold">Reading the recipe</h2>
        <p className="mb-0 max-w-[420px] text-[1.08rem] leading-[1.45] text-[#5e6a60]">
          Extracting ingredients, timings, servings, and cooking steps.
        </p>
      </div>
    </div>
  );
}

function ChatLoadingState() {
  return (
    <div className="grid min-h-0 flex-1 place-items-center px-[22px] pb-[22px] text-center font-extrabold text-[#5e6a60]">
      Loading chat
    </div>
  );
}
