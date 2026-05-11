import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff, Volume2 } from "lucide-react";
import type { InputProps } from "@copilotkit/react-ui";
import type { Recipe } from "../lib/types";
import { ChatLoadingState } from "./RecipeStates";
import { countPillClass, cx, eyebrowClass, panelFrame } from "./shared";

const CopilotChat = lazy(() =>
  import("@copilotkit/react-ui").then((module) => ({ default: module.CopilotChat })),
);

interface ChatPanelProps {
  recipe: Recipe | null;
  threadId?: string;
  currentStepIndex: number;
  onStepChange: (stepIndex: number) => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function ChatPanel({ recipe, threadId, currentStepIndex, onStepChange }: ChatPanelProps) {
  const chatReady = useIdleReady();
  const currentStepIndexRef = useRef(currentStepIndex);
  const recipeRef = useRef(recipe);
  const onStepChangeRef = useRef(onStepChange);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
    recipeRef.current = recipe;
    onStepChangeRef.current = onStepChange;
  }, [currentStepIndex, onStepChange, recipe]);

  const input = useMemo(
    () =>
      function HandsFreeInput(inputProps: InputProps) {
        return (
          <VoiceChatInput
            {...inputProps}
            currentStepIndexRef={currentStepIndexRef}
            onStepChangeRef={onStepChangeRef}
            recipeRef={recipeRef}
          />
        );
      },
    [],
  );
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
        <div className="flex flex-wrap items-center gap-2">
          <div className={countPillClass}>{threadId ? "Ready" : "Waiting"}</div>
        </div>
      </div>
      <ChatDetails recipe={recipe} currentStepIndex={currentStepIndex} threadId={threadId} />
      {chatReady ? (
        <Suspense fallback={<ChatLoadingState />}>
          <CopilotChat
            className="chat-box min-h-0 flex-1"
            Input={input}
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

function ChatDetails({
  currentStepIndex,
  recipe,
  threadId,
}: {
  currentStepIndex: number;
  recipe: Recipe | null;
  threadId?: string;
}) {
  const currentStep = recipe?.steps[currentStepIndex];

  return (
    <div className="mx-5 mb-3 grid gap-2 rounded-[16px] bg-[#eef3e9] p-3 text-[#243229]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase text-[#637061]">Hands-free chat</span>
        <span className="rounded-full bg-[#fffaf0] px-2.5 py-1 text-xs font-bold text-[#315342]">
          {threadId ? "Mic ready" : "Upload first"}
        </span>
      </div>
      <p className="m-0 text-sm font-semibold leading-[1.3]">
        {currentStep
          ? `Current: Step ${currentStep.step_number} of ${recipe?.steps.length}`
          : "Upload a recipe to enable cook-step commands."}
      </p>
      <div className="flex flex-wrap gap-1.5 text-xs font-bold text-[#637061]">
        {["next", "previous", "read step", "stop listening"].map((command) => (
          <span key={command} className="rounded-full bg-[#fffaf0] px-2.5 py-1">
            {command}
          </span>
        ))}
      </div>
    </div>
  );
}

function VoiceChatInput({
  chatReady = false,
  currentStepIndexRef,
  hideStopButton = false,
  inProgress,
  onSend,
  onStepChangeRef,
  onStop,
  recipeRef,
}: InputProps & {
  currentStepIndexRef: { current: number };
  recipeRef: { current: Recipe | null };
  onStepChangeRef: { current: (stepIndex: number) => void };
}) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const inProgressRef = useRef(inProgress);
  const isSendingRef = useRef(false);
  const listeningRef = useRef(false);
  const handledSpeechRef = useRef(false);
  const heardSpeechRef = useRef(false);
  const lastSpeechAtRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Voice");
  const [isSending, setIsSending] = useState(false);

  const speechRecognition = useMemo(
    () =>
      typeof window === "undefined"
        ? undefined
        : window.SpeechRecognition ?? window.webkitSpeechRecognition,
    [],
  );
  const supported = Boolean(speechRecognition);
  const disabled = !chatReady || !recipeRef.current || !supported || inProgress || isSending;
  const canSend = text.trim().length > 0 && !inProgress && !isSending;

  useEffect(() => {
    inProgressRef.current = inProgress;
    isSendingRef.current = isSending;
    listeningRef.current = listening;
  }, [inProgress, isSending, listening]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const submitMessage = async (content = text) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || inProgressRef.current || isSendingRef.current) return;

    isSendingRef.current = true;
    setIsSending(true);
    setStatus("Sending");
    try {
      await onSend(trimmedContent);
      setText("");
      setStatus("Sent");
      textareaRef.current?.focus();
    } catch {
      setStatus("Try again");
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
      scheduleRestart();
    }
  };

  const readCurrentStep = () => {
    const step = recipeRef.current?.steps[currentStepIndexRef.current];
    if (!step || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Step ${step.step_number}. ${step.instruction}`);
    window.speechSynthesis.speak(utterance);
    setStatus("Reading");
  };

  const handleTranscript = (transcript: string) => {
    const command = resolveVoiceCommand(
      transcript,
      currentStepIndexRef.current,
      recipeRef.current?.steps.length ?? 0,
    );

    handledSpeechRef.current = true;

    if (command.type === "stop") {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      listeningRef.current = false;
      setListening(false);
      setStatus("Voice");
      return;
    }

    if (command.type === "read") {
      readCurrentStep();
      cycleListening(1200);
      return;
    }

    if (command.type === "step") {
      onStepChangeRef.current(command.stepIndex);
      setStatus(`Step ${command.stepIndex + 1}`);
      cycleListening();
      return;
    }

    setText(command.content);
    cycleListening();
    void submitMessage(command.content);
  };

  const toggleListening = async () => {
    if (disabled) return;

    if (listening) {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      listeningRef.current = false;
      setListening(false);
      setStatus("Voice");
      return;
    }

    shouldListenRef.current = true;
    startVoiceCapture();
  };

  const startVoiceCapture = () => {
    if (
      !shouldListenRef.current ||
      inProgressRef.current ||
      isSendingRef.current ||
      listeningRef.current
    ) {
      return;
    }

    handledSpeechRef.current = false;
    heardSpeechRef.current = false;
    lastSpeechAtRef.current = 0;

    if (!speechRecognition) return;
    const recognition = new speechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onstart = () => {
      listeningRef.current = true;
      setListening(true);
      setStatus("Listening");
    };
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const phrase = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalTranscript += phrase;
        } else {
          interimTranscript += phrase;
        }
      }
      if (interimTranscript.trim()) {
        setText(interimTranscript.trim());
        heardSpeechRef.current = true;
      }
      if (finalTranscript.trim()) {
        heardSpeechRef.current = true;
        handleTranscript(finalTranscript.trim());
      }
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        setStatus("Listening");
        return;
      }

      shouldListenRef.current = false;
      listeningRef.current = false;
      setListening(false);
      setStatus(getSpeechErrorLabel(event.error));
    };
    recognition.onend = () => {
      listeningRef.current = false;
      setListening(false);
      if (shouldListenRef.current && !isSendingRef.current && !inProgressRef.current) {
        scheduleRestart(180);
      } else if (!shouldListenRef.current) {
        setStatus("Voice");
      }
    };

    recognitionRef.current = recognition;
    setStatus("Starting");
    startRecognition(recognition);
  };

  const buttonLabel = listening ? "Stop" : "Talk";

  return (
    <div className="copilotKitInputContainer">
      <div className="copilotKitInput">
        <textarea
          aria-label="Chat message"
          className="w-full resize-none bg-transparent outline-none"
          disabled={inProgress || isSending}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend) void submitMessage();
            }
          }}
          placeholder={chatReady ? "Ask, dictate, or say next step" : "Loading chat"}
          ref={textareaRef}
          rows={2}
          value={text}
        />
        <div className="copilotKitInputControls items-center gap-1.5">
          <button
            aria-label={supported ? "Toggle voice dictation" : "Voice dictation unavailable"}
            aria-pressed={listening}
            className="copilotKitInputControlButton"
            disabled={disabled}
            onClick={toggleListening}
            title={supported ? "Voice dictation" : "Voice dictation unavailable"}
            type="button"
          >
            {isSending ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : listening ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>
          <button
            aria-label="Read current step"
            className="copilotKitInputControlButton"
            disabled={!recipeRef.current}
            onClick={readCurrentStep}
            title="Read current step"
            type="button"
          >
            <Volume2 size={18} />
          </button>
          <span className="min-w-[62px] text-xs font-bold text-[#637061]">{status}</span>
          <div className="flex-1" />
          {inProgress && !hideStopButton ? (
            <button
              aria-label="Stop"
              className="copilotKitInputControlButton"
              onClick={onStop}
              type="button"
            >
              Stop
            </button>
          ) : (
            <button
              aria-label="Send"
              className="copilotKitInputControlButton"
              disabled={!canSend}
              onClick={() => void submitMessage()}
              type="button"
            >
              Send
            </button>
          )}
        </div>
      </div>
      <div
        aria-live="polite"
        className="px-2 pt-1 text-xs font-semibold text-[#637061]"
      >
        {listening
          ? `${buttonLabel}: speak normally. I will act after a short pause.`
          : " "}
      </div>
    </div>
  );

  function startRecognition(recognition: SpeechRecognition) {
    try {
      recognition.start();
    } catch {
      shouldListenRef.current = false;
      listeningRef.current = false;
      setListening(false);
      setStatus("Mic blocked");
    }
  }

  function scheduleRestart(delay = 450) {
    if (!shouldListenRef.current) return;
    window.setTimeout(() => {
      if (
        shouldListenRef.current &&
        !inProgressRef.current &&
        !isSendingRef.current &&
        !listeningRef.current
      ) {
        startVoiceCapture();
      }
    }, delay);
  }

  function cycleListening(delay = 450) {
    if (!shouldListenRef.current) return;
    try {
      recognitionRef.current?.stop();
    } catch {
      listeningRef.current = false;
      setListening(false);
    }
    scheduleRestart(delay);
  }
}

function getSpeechErrorLabel(error: string) {
  const labels: Record<string, string> = {
    "audio-capture": "No mic",
    "not-allowed": "Mic blocked",
    network: "Speech off",
    "service-not-allowed": "Mic blocked",
  };

  return labels[error] ?? "Try again";
}

function resolveVoiceCommand(transcript: string, currentStepIndex: number, stepsLength: number) {
  const normalized = transcript.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const dictated = normalized.match(/^(ask|tell|dictate|send)\s+(.*)$/)?.[2];

  if (dictated) {
    return { type: "dictation" as const, content: dictated };
  }

  if (/\b(stop listening|stop voice|hands off)\b/.test(normalized)) {
    return { type: "stop" as const };
  }

  if (/\b(read|repeat|say)\b.*\b(step|instruction)\b|\bwhat'?s next\b/.test(normalized)) {
    return { type: "read" as const };
  }

  if (/\b(next|continue|move on|forward)\b/.test(normalized)) {
    return {
      type: "step" as const,
      stepIndex: Math.min(Math.max(stepsLength - 1, 0), currentStepIndex + 1),
    };
  }

  if (/\b(previous|back|go back|last step)\b/.test(normalized)) {
    return { type: "step" as const, stepIndex: Math.max(0, currentStepIndex - 1) };
  }

  if (/\b(first|start over|beginning)\b/.test(normalized)) {
    return { type: "step" as const, stepIndex: 0 };
  }

  const stepMatch = normalized.match(/\b(?:go to|open|show)\s+(?:step\s+)?(\w+)\b|\bstep\s+(\w+)\b/);
  const stepValue = stepMatch?.[1] ?? stepMatch?.[2];
  const requestedStep = stepValue ? parseStepNumber(stepValue) : null;
  if (requestedStep !== null && stepsLength > 0) {
    return {
      type: "step" as const,
      stepIndex: Math.min(stepsLength - 1, Math.max(0, requestedStep - 1)),
    };
  }

  return { type: "dictation" as const, content: transcript };
}

function parseStepNumber(value: string) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric)) return numeric;

  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  return words[value] ?? null;
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
