export type IngredientCategory =
  | "produce"
  | "protein"
  | "dairy"
  | "pantry"
  | "spice"
  | "other";

export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
  category: IngredientCategory;
  substitutes: string[];
}

export interface RecipeStep {
  step_number: number;
  instruction: string;
  duration_minutes: number | null;
  timer_label: string | null;
  requires_attention: boolean;
  tips: string[];
}

export interface Recipe {
  title: string;
  description: string | null;
  servings: number;
  original_servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty: "easy" | "medium" | "hard";
  cuisine: string | null;
  dietary_tags: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

export interface RecipeContext {
  document_text: string | null;
  recipe: Recipe | null;
  current_step: number;
  scaled_servings: number | null;
  checked_ingredients: string[];
  cooking_started: boolean;
}

export interface UploadResponse {
  threadId: string;
  runId: string;
  state: RecipeContext;
  tools: unknown[];
  context: unknown[];
  forwardedProps: Record<string, unknown>;
  messages: unknown[];
}

export const EMPTY_RECIPE_CONTEXT: RecipeContext = {
  document_text: null,
  recipe: null,
  current_step: 0,
  scaled_servings: null,
  checked_ingredients: [],
  cooking_started: false,
};
