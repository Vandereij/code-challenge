import { Suspense, lazy, useEffect, useState } from "react";
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
  const suggestions = recipe
    ? [
        { title: "Scale servings", message: `Scale ${recipe.title} to 2 servings.` },
        { title: "Next step", message: "Move me to the next cooking step." },
      ]
    : [{ title: "After upload", message: "What can you help me change in this recipe?" }];

  return (
    <aside className={cx(panelFrame, "chat-panel flex min-h-[460px] flex-col rounded-[22px] lg:min-h-0")}>
      <div className="chat-panel-header flex flex-col gap-3 px-5 pt-5 pb-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
        <div>
          <p className={eyebrowClass}>Live Agent</p>
          <h2 className="mb-0 text-[1.2rem] font-bold leading-[1.2]">Ask while you cook</h2>
        </div>
        <div className={countPillClass}>{threadId ? "Ready" : "Waiting"}</div>
      </div>
      {chatReady ? (
        <Suspense fallback={<ChatLoadingState />}>
          <CopilotChat
            className="chat-box min-h-0 flex-1"
            suggestions={suggestions}
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
