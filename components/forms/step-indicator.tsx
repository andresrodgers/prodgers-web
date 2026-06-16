type StepIndicatorProps = {
  steps: string[];
  current: number;
};

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol
      className="grid gap-4 rounded-[14px] bg-white px-5 py-4"
      style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)`, boxShadow: "var(--shadow-sm)" }}
    >
      {steps.map((step, index) => {
        const active = index === current;
        const done = index < current;

        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-heading text-[11px] font-bold"
              style={
                active
                  ? { background: "#0B2D3D", color: "#fff" }
                  : done
                    ? { background: "#2E7D5B", color: "#fff" }
                    : { background: "#E8ECEE", color: "#8b96a0" }
              }
            >
              {done ? "✓" : index + 1}
            </span>
            <p
              className="font-heading text-[12px] font-semibold"
              style={{ color: active ? "#0B2D3D" : done ? "#2E7D5B" : "#8b96a0" }}
            >
              {step}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
