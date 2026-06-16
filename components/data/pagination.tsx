type PagBtnProps = {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
};

function PagBtn({ onClick, disabled, active, label }: PagBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 min-w-7 items-center justify-center rounded-[7px] px-2 text-[12px] font-semibold transition-all disabled:opacity-30"
      style={
        active
          ? { background: "#0B2D3D", color: "#fff" }
          : { background: "#F4F7F8", color: "#5B6770" }
      }
    >
      {label}
    </button>
  );
}

type PaginationProps = {
  pagina: number;
  totalPaginas: number;
  total: number;
  pageSize: number;
  setPagina: (n: number | ((prev: number) => number)) => void;
  className?: string;
};

export function Pagination({ pagina, totalPaginas, total, pageSize, setPagina, className }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  const desde = (pagina - 1) * pageSize + 1;
  const hasta = Math.min(pagina * pageSize, total);

  return (
    <div
      className={`flex items-center justify-between border-t border-[rgba(11,45,61,.06)] px-5 py-3 ${className ?? ""}`}
    >
      <p className="text-[12px] text-brand-secondary">
        {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-1">
        <PagBtn onClick={() => setPagina(1)} disabled={pagina === 1} label="«" />
        <PagBtn onClick={() => setPagina((p) => p - 1)} disabled={pagina === 1} label="‹" />
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <PagBtn
            key={n}
            onClick={() => setPagina(n)}
            active={n === pagina}
            label={String(n)}
          />
        ))}
        <PagBtn onClick={() => setPagina((p) => p + 1)} disabled={pagina === totalPaginas} label="›" />
        <PagBtn onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} label="»" />
      </div>
    </div>
  );
}
