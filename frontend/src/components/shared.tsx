import type { ReactNode } from "react";

export const panelFrame =
  "min-w-0 overflow-hidden border border-[#20302724] bg-[#fffcf5]/95 shadow-[0_24px_80px_rgba(68,55,40,0.12)]";

export const eyebrowClass =
  "mb-1.5 text-[0.84rem] font-extrabold uppercase tracking-normal text-[#6d5c43]";

export const countPillClass =
  "inline-flex min-h-10 items-center justify-center rounded-full bg-[#e4ecdf] px-3.5 font-extrabold text-[#315342]";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SummaryPill({
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
