import { Suspense, lazy, useEffect, useState } from "react";
import { ListChecks, Mic, Users } from "lucide-react";
import type { Recipe } from "../lib/types";
import { ChatLoadingState } from "./RecipeStates";
import { countPillClass, cx, eyebrowClass, panelFrame } from "./shared";

const CopilotChat = lazy(() =>
  import("@copilotkit/react-ui").then((module) => ({ default: module.CopilotChat })),
);

interface ChatPanelProps {
  recipe: Recipe | null;
  threadId?: string;
}

export function ChatPanel({ recipe, threadId }: ChatPanelProps) {
  const chatReady = useIdleReady();

  return (
    <aside className={cx(panelFrame, "flex min-h-[560px] flex-col rounded-[22px]")}>
      <div className="flex flex-col gap-3 px-[22px] pt-[22px] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={eyebrowClass}>Live Agent</p>
          <h2 className="mb-0 text-[1.3rem] font-bold">Ask while you cook</h2>
        </div>
        <div className={countPillClass}>{threadId ? "Ready" : "Waiting"}</div>
      </div>
      <div className="flex flex-wrap gap-2 px-[22px] pb-3">
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#f4e0bf] px-2.5 text-[0.86rem] font-extrabold text-[#7b5632]">
          <Users size={18} /> Scale servings
        </span>
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#f4e0bf] px-2.5 text-[0.86rem] font-extrabold text-[#7b5632]">
          <ListChecks size={18} /> Next step
        </span>
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#f4e0bf] px-2.5 text-[0.86rem] font-extrabold text-[#7b5632]">
          <Mic size={18} /> Voice soon
        </span>
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
  );
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
