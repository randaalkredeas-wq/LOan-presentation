import { clsx } from "clsx";

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
      {steps.map((label, i) => {
        const step = i + 1;
        const state = step < current ? "done" : step === current ? "active" : "upcoming";
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={clsx(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "done" && "bg-navy-800 text-cream-50",
                  state === "active" && "bg-accent-500 text-white",
                  state === "upcoming" && "bg-cream-200 text-navy-400"
                )}
              >
                {state === "done" ? "✓" : step}
              </span>
              <span className={clsx("hidden text-xs font-medium sm:inline", state === "upcoming" ? "text-navy-400" : "text-navy-800")}>
                {label}
              </span>
            </div>
            {step < steps.length && <span className="h-px flex-1 bg-navy-100" />}
          </li>
        );
      })}
    </ol>
  );
}
