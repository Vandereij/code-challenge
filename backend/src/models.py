"""
Domain Models for Recipe Companion

Pydantic models for structured recipe data and UI components.
"""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field


# =============================================================================
# Domain Models - Structured outputs for generative UI
# =============================================================================


class Ingredient(BaseModel):
    """A single ingredient with structured data for UI rendering."""

    name: str = Field(..., min_length=1, description="Name of the ingredient")
    quantity: float | None = Field(default=None, description="Numeric quantity")
    unit: str | None = Field(
        default=None, description="Unit of measurement (cup, tbsp, lb, etc.)"
    )
    preparation: str | None = Field(
        default=None, description="Preparation notes like 'diced' or 'minced'"
    )
    category: Literal["produce", "protein", "dairy", "pantry", "spice", "other"] = (
        Field(
            default="other", description="Ingredient category for grocery organization"
        )
    )
    substitutes: list[str] = Field(
        default_factory=list, description="Possible ingredient substitutions"
    )


class RecipeStep(BaseModel):
    """A cooking step with timing and actionable UI hints."""

    step_number: int = Field(..., description="Sequential step number starting from 1")
    instruction: str = Field(..., description="The step instruction text")
    duration_minutes: int | None = Field(
        default=None, description="Estimated time for this step in minutes"
    )
    timer_label: str | None = Field(
        default=None, description="Label for timer button if applicable"
    )
    requires_attention: bool = Field(
        default=False,
        description="Whether step needs constant attention (e.g., 'stir constantly')",
    )
    tips: list[str] = Field(
        default_factory=list, description="Helpful tips for this step"
    )


class Recipe(BaseModel):
    """Complete extracted recipe with all structured data."""

    title: str = Field(..., min_length=1, description="Recipe title/name")
    description: str | None = Field(
        default=None, description="Brief recipe description"
    )
    servings: int = Field(
        ..., ge=1, description="Number of servings this recipe makes"
    )
    original_servings: int | None = Field(
        default=None,
        description="Original servings count before scaling (for reference)",
    )
    prep_time_minutes: int | None = Field(
        default=None, description="Preparation time in minutes"
    )
    cook_time_minutes: int | None = Field(
        default=None, description="Cooking time in minutes"
    )
    difficulty: Literal["easy", "medium", "hard"] = Field(
        default="medium", description="Recipe difficulty level"
    )
    cuisine: str | None = Field(
        default=None, description="Cuisine type (Italian, Mexican, etc.)"
    )
    dietary_tags: list[str] = Field(
        default_factory=list,
        description="Dietary tags like 'vegetarian', 'gluten-free', 'vegan'",
    )
    ingredients: list[Ingredient] = Field(
        ..., min_length=1, description="List of recipe ingredients"
    )
    steps: list[RecipeStep] = Field(
        ..., min_length=1, description="Ordered list of cooking steps"
    )

    def scale(self, target_servings: int) -> "Recipe":
        """
        Return a new Recipe scaled to target_servings.
        Preserves original_servings for reference.
        """
        if target_servings <= 0:
            raise ValueError(
                f"target_servings must be positive, got {target_servings}"
            )
        if self.servings == target_servings:
            return self.model_copy(deep=True)

        scale_factor = target_servings / self.servings
        original = self.original_servings or self.servings

        scaled_ingredients = [
            Ingredient(
                name=ing.name,
                quantity=round(ing.quantity * scale_factor, 2)
                if ing.quantity
                else None,
                unit=ing.unit,
                preparation=ing.preparation,
                category=ing.category,
                substitutes=ing.substitutes,
            )
            for ing in self.ingredients
        ]

        return Recipe(
            **self.model_dump(exclude={"ingredients", "servings", "original_servings"}),
            ingredients=scaled_ingredients,
            servings=target_servings,
            original_servings=original,
        )

    def substitute_ingredient(
        self,
        original_name: str,
        substitute_name: str,
        substitute_quantity: float | None = None,
        substitute_unit: str | None = None,
    ) -> "Recipe":
        """
        Return a new Recipe with one ingredient substituted.

        Matches ingredient by name (case-insensitive) and also rewrites any
        mention of that name in the step instructions, word-bounded and
        case-insensitive.
        """
        matched_name: str | None = None
        new_ingredients = []
        for ing in self.ingredients:
            if ing.name.lower() == original_name.lower():
                matched_name = ing.name
                inherited_substitutes = [
                    s for s in ing.substitutes if s.lower() != substitute_name.lower()
                ]
                new_ingredients.append(
                    Ingredient(
                        name=substitute_name,
                        quantity=substitute_quantity
                        if substitute_quantity is not None
                        else ing.quantity,
                        unit=substitute_unit
                        if substitute_unit is not None
                        else ing.unit,
                        preparation=ing.preparation,
                        category=ing.category,
                        substitutes=inherited_substitutes,
                    )
                )
            else:
                new_ingredients.append(ing)

        new_steps = self.steps
        if matched_name is not None:
            pattern = re.compile(rf"\b{re.escape(matched_name)}\b", re.IGNORECASE)
            new_steps = [
                step.model_copy(
                    update={
                        "instruction": pattern.sub(substitute_name, step.instruction)
                    }
                )
                for step in self.steps
            ]

        return Recipe(
            **self.model_dump(exclude={"ingredients", "steps"}),
            ingredients=new_ingredients,
            steps=new_steps,
        )


# =============================================================================
# Agent Context & State
# =============================================================================


class RecipeContext(BaseModel):
    """Shared state between frontend and agent via CopilotKit."""

    document_text: str | None = None
    recipe: Recipe | None = None
    current_step: int = 0
    scaled_servings: int | None = None
    checked_ingredients: list[str] = Field(default_factory=list)
    cooking_started: bool = False


class SubstitutionResult(BaseModel):
    """Result from LLM-based ingredient substitution."""

    matched_ingredient: str | None = Field(
        default=None,
        description="Name of the ingredient in the recipe that was matched",
    )
    substitute_name: str = Field(..., description="Name of the substitute ingredient")
    substitute_quantity: float | None = Field(
        default=None, description="Suggested quantity for the substitute"
    )
    substitute_unit: str | None = Field(
        default=None, description="Unit for the substitute quantity"
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score for the ingredient match (0-1)",
    )
    suggestion: str | None = Field(
        default=None, description="Suggestion message if no match found"
    )
    cooking_tip: str | None = Field(
        default=None, description="Cooking tip for using the substitute"
    )
