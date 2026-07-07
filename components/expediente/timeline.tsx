type TimelineItem = {
  title: string;
  description?: string;
  date: string;
  user?: string;
  current?: boolean;
  tone?: "default" | "success" | "danger";
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 pb-4 last:pb-0">
          {/* Línea + punto */}
          <div className="flex w-3 shrink-0 flex-col items-center">
            <span
              className="z-10 mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{
                background: item.current
                  ? "#F2B233"
                  : item.tone === "danger"
                    ? "#C0492F"
                    : item.tone === "success"
                      ? "#2E7D5B"
                      : "#fff",
                border: item.current || item.tone
                  ? "none"
                  : "2px solid #0B2D3D",
                boxShadow: "0 0 0 3px rgba(11,45,61,.06)",
              }}
            />
            {i < items.length - 1 && (
              <span
                className="mt-1 flex-1"
                style={{ width: "2px", background: "rgba(11,45,61,.08)" }}
              />
            )}
          </div>

          {/* Contenido */}
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold text-brand-primary">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-[10.5px] leading-[1.35] text-brand-secondary">
                {item.description}
              </p>
            ) : null}
            <p className="mt-1 text-[10px]" style={{ color: "#8b96a0" }}>
              {item.date}
              {item.user ? ` · ${item.user}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
