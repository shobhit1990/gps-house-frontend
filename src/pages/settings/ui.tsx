import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Switch } from "@/components/ui/switch";

export const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/[0.08] dark:bg-[#03091c]/70 dark:text-slate-300 dark:placeholder:text-slate-600 dark:focus:border-cyan-300/35";

export const primaryButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-violet-300/30 bg-violet-500/10 px-4 text-xs font-semibold text-violet-800 transition hover:bg-violet-500/15 dark:border-violet-300/20 dark:bg-violet-300/[0.10] dark:text-violet-100 dark:hover:bg-violet-300/[0.16]";

export const quietButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:border-cyan-300 dark:border-white/[0.08] dark:bg-[#03091c]/65 dark:text-slate-300 dark:hover:border-cyan-300/20 dark:hover:text-cyan-100";

export const panelCardClass =
  "rounded-xl border border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:border-white/[0.09] dark:bg-gradient-to-br dark:from-[#0b1835]/95 dark:via-[#08142e]/95 dark:to-[#10102d]/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.24)]";

export const activeChipClass =
  "border border-cyan-200 bg-gradient-to-r from-cyan-50 to-violet-50 text-cyan-700 shadow-[0_0_18px_rgba(34,211,238,0.04)] dark:border-cyan-300/25 dark:bg-gradient-to-r dark:from-cyan-300/10 dark:to-violet-400/10 dark:text-cyan-100 dark:shadow-[0_0_18px_rgba(34,211,238,0.06)]";

export function PanelIntro({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200/70">{kicker}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="text-rose-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} h-auto py-2 ${props.className ?? ""}`} />;
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/[0.08] dark:bg-[#03091c]/40">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-cyan-500 dark:data-[state=checked]:bg-cyan-400" />
    </div>
  );
}

export function PillTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-white/[0.08] dark:bg-[#03091c]/45">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              active
                ? activeChipClass
                : "border border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function UploadTile({
  label,
  fileName,
  onPick,
}: {
  label: string;
  fileName: string;
  onPick: (name: string) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 transition hover:border-cyan-300 dark:border-white/[0.1] dark:bg-[#03091c]/45 dark:hover:border-cyan-300/30">
      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
      <span className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{fileName || "PNG, JPG or PDF"}</span>
      <span className="mt-3 inline-flex h-8 w-fit items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200">
        Upload
      </span>
      <input
        type="file"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file.name);
          event.target.value = "";
        }}
      />
    </label>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="px-4 py-10 text-center text-xs text-slate-500 dark:text-slate-400">{label}</div>;
}
