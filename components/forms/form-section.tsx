import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section
      className="rounded-[14px] bg-white px-5 py-5"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="mb-4">
        <h2 className="font-heading text-[15px] font-semibold text-brand-primary">{title}</h2>
        {description ? (
          <p className="mt-1 text-[12.5px] text-brand-secondary">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
