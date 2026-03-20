interface RepoInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RepoInput({ value, onChange }: RepoInputProps) {
  return (
    <div className="mb-6">
      <label className="block font-mono text-[0.65rem] tracking-[0.12em] uppercase text-zinc-600 mb-2">
        Repository (owner/name)
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"e.g. nodejs/node\nmeteor/meteor"}
        rows={2}
        className="
          w-full bg-raised border border-line rounded-xl
          font-mono text-sm text-zinc-300 placeholder-zinc-700
          px-3.5 py-3 resize-none outline-none
          focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10
          transition-all duration-200
        "
      />
    </div>
  );
}
