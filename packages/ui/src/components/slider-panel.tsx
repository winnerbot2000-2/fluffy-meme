export type SliderField = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix?: string;
};

export function SliderPanel({
  title,
  fields,
  onChange,
}: {
  title: string;
  fields: SliderField[];
  onChange: (id: string, value: number) => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{title}</p>
      <div className="mt-4 space-y-4">
        {fields.map((field) => (
          <label key={field.id} className="block">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-200">{field.label}</span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-cyan-100">
                {field.value}
                {field.suffix ?? ""}
              </span>
            </div>
            <input
              suppressHydrationWarning
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={field.value}
              onChange={(event) => onChange(field.id, Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-300"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
