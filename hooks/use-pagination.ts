import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(items.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);

  const itemsPagina = useMemo(
    () => items.slice((paginaActual - 1) * pageSize, paginaActual * pageSize),
    [items, paginaActual, pageSize]
  );

  function resetPagina() {
    setPagina(1);
  }

  return { pagina: paginaActual, totalPaginas, itemsPagina, setPagina, resetPagina };
}
