type FormSectionProps = Readonly<{
  title: string;
  children: React.ReactNode;
}>;

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border-default bg-white/85 p-5">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
