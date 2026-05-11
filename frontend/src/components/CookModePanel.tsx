import { ChevronLeft, ChevronRight, Clock3, Sparkles } from "lucide-react";
import type { RecipeStep } from "../lib/types";
import { countPillClass, cx } from "./shared";

interface CookModePanelProps {
  currentStepIndex: number;
  cookingStarted: boolean;
  steps: RecipeStep[];
  onStepChange: (stepIndex: number) => void;
}

export function CookModePanel({
  currentStepIndex,
  cookingStarted,
  steps,
  onStepChange,
}: CookModePanelProps) {
  const progressPercentage = steps.length ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const currentStep = steps[currentStepIndex];

  return (
    <section className="min-h-0 rounded-[20px] bg-[#fffaf0] p-[18px]" aria-labelledby="steps-title">
      <div className="mb-4 flex items-center justify-between gap-[18px]">
        <h2 className="mb-0 text-[1.3rem] font-bold" id="steps-title">
          Cook Mode
        </h2>
        <span className={countPillClass}>
          Step {currentStepIndex + 1}/{steps.length}
        </span>
      </div>
      <CookProgress percentage={progressPercentage} started={cookingStarted} />
      <div className="grid gap-3">
        <div className="grid max-h-[390px] gap-2.5 overflow-auto pr-1">
          {steps.map((step, index) => (
            <StepButton
              key={step.step_number}
              active={index === currentStepIndex}
              step={step}
              onClick={() => onStepChange(index)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#efe4d2] px-4 font-black text-[#243229] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentStepIndex === 0}
            onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
          >
            <ChevronLeft size={22} />
            Previous
          </button>
          <button
            className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#2f6f58] px-4 font-black text-[#fffdf8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentStepIndex >= steps.length - 1}
            onClick={() => onStepChange(Math.min(steps.length - 1, currentStepIndex + 1))}
          >
            Next
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
      <StepTips tips={currentStep?.tips ?? []} />
    </section>
  );
}

function StepButton({
  active,
  step,
  onClick,
}: {
  active: boolean;
  step: RecipeStep;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        "grid min-h-[92px] w-full cursor-pointer grid-cols-[48px_1fr] gap-3 rounded-[18px] p-3.5 text-left transition-[background,box-shadow,transform] duration-150 active:scale-[0.99]",
        active
          ? "bg-[#213229] text-[#fffaf0] shadow-[0_12px_28px_rgba(33,50,41,0.22)]"
          : "bg-[#f2eadc] text-[#243229]",
      )}
      aria-current={active ? "step" : undefined}
      onClick={onClick}
    >
      <span
        className={cx(
          "flex size-12 items-center justify-center rounded-[14px] text-[1.05rem] font-black",
          active ? "bg-[#f6dfb4] text-[#243229]" : "bg-[#fffaf0] text-[#315342]",
        )}
      >
        {step.step_number}
      </span>
      <span className="min-w-0">
        <span className="block [overflow-wrap:anywhere] text-[1.05rem] font-extrabold leading-[1.28]">
          {step.instruction}
        </span>
        <span className="mt-2 flex flex-wrap gap-2">
          {step.duration_minutes ? (
            <span
              className={cx(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold",
                active ? "bg-[#f6dfb4] text-[#243229]" : "bg-[#fffaf0] text-[#5f6c62]",
              )}
            >
              <Clock3 size={16} /> {step.timer_label ?? "Timer"} - {step.duration_minutes} min
            </span>
          ) : null}
          {step.requires_attention ? (
            <span
              className={cx(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold",
                active ? "bg-[#f6dfb4] text-[#243229]" : "bg-[#fffaf0] text-[#7b5632]",
              )}
            >
              <Sparkles size={16} /> Keep close
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function CookProgress({
  percentage,
  started,
}: {
  percentage: number;
  started: boolean;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between text-sm font-extrabold text-[#5e6a60]">
        <span>{started ? "Cooking in progress" : "Ready to start"}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#efe4d2]">
        <div
          className="h-full rounded-full bg-[#2f6f58] transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StepTips({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;

  return (
    <div className="mt-4 rounded-[18px] bg-[#eef3e9] p-4 text-[#243229]">
      <div className="mb-2 flex items-center gap-2 font-black">
        <Sparkles size={20} />
        <span>Tips</span>
      </div>
      <ul className="m-0 grid gap-2 pl-5 text-[0.98rem] leading-[1.35] text-[#465347]">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
