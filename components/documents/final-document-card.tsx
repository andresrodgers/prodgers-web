import { Download, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

type FinalDocumentCardProps = {
  phase: string;
  title: string;
  available?: boolean;
  onSubir?: (file: File) => void;
  onDescargar?: () => void;
  onReemplazar?: (file: File) => void;
};

export function FinalDocumentCard({
  phase,
  title,
  available = false,
  onSubir,
  onDescargar,
  onReemplazar,
}: FinalDocumentCardProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, handler?: (f: File) => void) {
    const file = e.target.files?.[0];
    if (file && handler) handler(file);
    e.target.value = "";
  }

  return (
    <div
      className="flex items-center gap-3 py-[14px] [&:not(:first-child)]:border-t"
      style={{ borderColor: "rgba(11,45,61,.05)" }}
    >
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px]"
        style={{
          background: available ? "#dcefe4" : "#EEF2F3",
          color: available ? "#1f6b48" : "#5B6770",
        }}
      >
        {available ? <Download className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-secondary">
          {phase}
        </p>
        <p className="text-[13px] font-semibold text-brand-primary">{title}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        {available ? (
          <>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={onDescargar}
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => replaceRef.current?.click()}
            >
              Reemplazar
            </Button>
            <input
              ref={replaceRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => handleFileChange(e, onReemplazar)}
            />
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => uploadRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Subir final
            </Button>
            <input
              ref={uploadRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => handleFileChange(e, onSubir)}
            />
          </>
        )}
      </div>
    </div>
  );
}
