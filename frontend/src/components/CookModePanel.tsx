import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Lightbulb, Sparkles } from "lucide-react";
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
  const progressPercentage = getStepProgressPercentage({
    currentStepIndex,
    cookingStarted,
    stepsLength: steps.length,
  });
  const currentStep = steps[currentStepIndex];
  const stepList = steps.filter((_, index) => index !== currentStepIndex);

  return (
    <section className="cook-mode-panel flex min-h-0 flex-col overflow-hidden rounded-[20px] bg-[#fffaf0] p-4 md:p-[18px] xl:col-start-2 xl:row-start-1" aria-labelledby="steps-title">
      <div className="cook-mode-heading mb-4 flex items-center justify-between gap-[18px]">
        <h2 className="mb-0 text-[1.35rem] font-bold" id="steps-title">
          Cook Mode
        </h2>
        <span className={countPillClass}>Step {currentStepIndex + 1}/{steps.length}</span>
      </div>
      <CookProgress percentage={progressPercentage} started={cookingStarted} />
      <StepControls
        currentStepIndex={currentStepIndex}
        stepsLength={steps.length}
        onStepChange={onStepChange}
      />
      <div className="step-card-grid mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden pr-1">
        {currentStep ? <CurrentStepCard step={currentStep} /> : null}

        {stepList.length > 0 ? (
          <div className="grid shrink-0 gap-2">
            {stepList.map((step) => {
              const index = steps.indexOf(step);
              return (
                <StepButton
                  key={step.step_number}
                  step={step}
                  label={index < currentStepIndex ? "Done" : "Up next"}
                  onClick={() => onStepChange(index)}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getStepProgressPercentage({
  currentStepIndex,
  cookingStarted,
  stepsLength,
}: {
  currentStepIndex: number;
  cookingStarted: boolean;
  stepsLength: number;
}) {
  if (!cookingStarted || stepsLength <= 1) return 0;
  return (currentStepIndex / (stepsLength - 1)) * 100;
}

function CurrentStepCard({ step }: { step: RecipeStep }) {
  return (
    <div className="current-step-card grid shrink-0 grid-cols-[52px_1fr] gap-4 rounded-[18px] bg-[#213229] p-4 text-[#fffaf0] shadow-[0_16px_34px_rgba(33,50,41,0.2)] xl:grid-cols-[60px_1fr] xl:p-5">
      <span className="flex size-[52px] items-center justify-center rounded-[16px] bg-[#f6dfb4] text-[1.18rem] font-bold text-[#243229] xl:size-[60px]">
        {step.step_number}
      </span>
      <div className="min-w-0">
        <div className="mb-3 flex items-start gap-2.5">
          <p className="mb-0 min-w-0 flex-1 [overflow-wrap:anywhere] text-[1.22rem] font-bold leading-[1.24] xl:text-[1.38rem]">
            {step.instruction}
          </p>
          <StepTips tips={step.tips} />
        </div>
        <StepMeta step={step} active />
      </div>
    </div>
  );
}

function StepButton({
  step,
  label,
  onClick,
}: {
  step: RecipeStep;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="step-button grid min-h-[76px] w-full cursor-pointer grid-cols-[46px_1fr] gap-3 rounded-[16px] bg-[#f2eadc] p-3 text-left text-[#243229] transition-[background,transform] duration-150 active:scale-[0.99]"
      onClick={onClick}
    >
      <span className="flex size-[46px] items-center justify-center rounded-[14px] bg-[#fffaf0] text-[1rem] font-bold text-[#315342]">
        {step.step_number}
      </span>
      <span className="min-w-0">
        <span className="mb-1 block text-xs font-bold uppercase text-[#8a6139]">{label}</span>
        <span className="block [overflow-wrap:anywhere] text-[1rem] font-semibold leading-[1.28]">
          {step.instruction}
        </span>
        <StepMeta step={step} />
      </span>
    </button>
  );
}

function StepMeta({ step, active = false }: { step: RecipeStep; active?: boolean }) {
  return (
    <span className="mt-2 flex flex-wrap gap-2">
      {step.duration_minutes ? (
        <span
          className={cx(
            "inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold",
            active ? "bg-[#f6dfb4] text-[#243229]" : "bg-[#fffaf0] text-[#5f6c62]",
          )}
        >
          <Clock3 size={16} /> {step.timer_label ?? "Timer"} - {step.duration_minutes} min
        </span>
      ) : null}
      {step.requires_attention ? (
        <span
          className={cx(
            "inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold",
            active ? "bg-[#f6dfb4] text-[#243229]" : "bg-[#fffaf0] text-[#9a4f2f]",
          )}
        >
          <Sparkles size={16} /> Keep close
        </span>
      ) : null}
    </span>
  );
}

function StepControls({
  currentStepIndex,
  stepsLength,
  onStepChange,
}: {
  currentStepIndex: number;
  stepsLength: number;
  onStepChange: (stepIndex: number) => void;
}) {
  return (
    <div className="step-controls grid grid-cols-2 gap-2.5">
      <button
        className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#efe4d2] px-4 font-bold text-[#243229] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentStepIndex === 0}
        onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
      >
        <ChevronLeft size={22} />
        Previous
      </button>
      <button
        className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#2f6f58] px-4 font-bold text-[#fffdf8] shadow-[0_12px_22px_rgba(47,111,88,0.18)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentStepIndex >= stepsLength - 1}
        onClick={() => onStepChange(Math.min(stepsLength - 1, currentStepIndex + 1))}
      >
        Next
        <ChevronRight size={22} />
      </button>
    </div>
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
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-[#5e6a60]">
        <span>{started ? "Cooking in progress" : "Ready to start"}</span>
        <span>{started ? `${Math.round(percentage)}%` : "0%"}</span>
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
  const [open, setOpen] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [tips]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!tipRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [open]);

  if (tips.length === 0) return null;

  return (
    <div className="step-tips relative inline-flex" ref={tipRef}>
      <button
        aria-label={`Tips: ${tips.join(" ")}`}
        aria-expanded={open}
        className="inline-flex size-9 items-center justify-center rounded-full bg-[#eef3e9] text-[#315342] transition-colors hover:bg-[#e4ecdf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315342]"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        type="button"
      >
        <Lightbulb size={18} />
      </button>
      <div
        className={cx(
          "pointer-events-none absolute right-0 top-11 z-10 w-[min(240px,calc(100vw-48px))] rounded-[14px] bg-[#213229] p-3 text-[#fffaf0] shadow-[0_16px_34px_rgba(33,50,41,0.24)] transition",
          open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-sm font-bold">
          <Sparkles size={16} />
          <span>Tips</span>
        </div>
        <ul className="m-0 grid gap-1.5 pl-4 text-sm leading-[1.35]">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
