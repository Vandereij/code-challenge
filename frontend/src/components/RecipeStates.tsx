import { ChefHat, FileText } from "lucide-react";

export function EmptyRecipeState() {
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

export function ParsingState() {
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

export function ChatLoadingState() {
  return (
    <div className="grid min-h-0 flex-1 place-items-center px-[22px] pb-[22px] text-center font-extrabold text-[#5e6a60]">
      Loading chat
    </div>
  );
}
