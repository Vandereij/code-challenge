import { Check } from "lucide-react";
import type { Ingredient, IngredientCategory } from "../lib/types";
import { countPillClass, cx } from "./shared";

const ingredientCategoryOrder: IngredientCategory[] = [
  "produce",
  "protein",
  "dairy",
  "pantry",
  "spice",
  "other",
];

const ingredientCategoryLabels: Record<IngredientCategory, string> = {
  produce: "Produce",
  protein: "Protein",
  dairy: "Dairy",
  pantry: "Pantry",
  spice: "Spices",
  other: "Other",
};

interface IngredientsPanelProps {
  ingredients: Ingredient[];
  checkedIngredients: string[];
  checkedIngredientSet: Set<string>;
  onToggleIngredient: (name: string) => void;
}

export function IngredientsPanel({
  ingredients,
  checkedIngredients,
  checkedIngredientSet,
  onToggleIngredient,
}: IngredientsPanelProps) {
  const groupedIngredients = ingredientCategoryOrder
    .map((category) => ({
      category,
      ingredients: ingredients.filter((ingredient) => ingredient.category === category),
    }))
    .filter((group) => group.ingredients.length > 0);

  return (
    <section className="min-h-0 rounded-[20px] bg-[#fffaf0] p-[18px]" aria-labelledby="ingredients-title">
      <div className="mb-4 flex items-center justify-between gap-[18px]">
        <h2 className="mb-0 text-[1.3rem] font-bold" id="ingredients-title">
          Ingredients
        </h2>
        <span className={countPillClass}>
          {checkedIngredients.length}/{ingredients.length}
        </span>
      </div>
      <div className="grid max-h-[470px] gap-2.5 overflow-auto pr-1">
        {groupedIngredients.map((group) => (
          <div key={group.category} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 px-1 pt-1">
              <h3 className="mb-0 text-[0.9rem] font-black uppercase tracking-normal text-[#6d5c43]">
                {ingredientCategoryLabels[group.category]}
              </h3>
              <span className="text-sm font-extrabold text-[#697265]">{group.ingredients.length}</span>
            </div>
            {group.ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.name}
                ingredient={ingredient}
                checked={checkedIngredientSet.has(ingredient.name)}
                onToggle={() => onToggleIngredient(ingredient.name)}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
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
        {ingredient.substitutes.length > 0 ? (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {ingredient.substitutes.slice(0, 3).map((substitute) => (
              <span
                key={substitute}
                className="inline-flex min-h-7 items-center rounded-full bg-[#fffaf0] px-2 text-xs font-extrabold text-[#7b5632]"
              >
                {substitute}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}
