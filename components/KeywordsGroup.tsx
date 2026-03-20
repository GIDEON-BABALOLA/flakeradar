const KEYWORDS = [
  "flaky", "flakey", "flakiness", "intermit",
  "fragile", "brittle", "intermittent", "non-deterministic test",
] as const;

export type Keyword = (typeof KEYWORDS)[number];

interface KeywordsGroupProps {
  selected: Keyword;
  onSelect: (kw: Keyword) => void;
}

export default function KeywordsGroup({ selected, onSelect }: KeywordsGroupProps) {
  return (
    <div className="mb-6">
      <p className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-zinc-600 mb-3">
        Keyword Filter
      </p>
      <div className="flex flex-wrap gap-2">
        {KEYWORDS.map((kw) => (
          <KeywordPill key={kw} kw={kw} checked={selected === kw} onChange={onSelect} />
        ))}
      </div>
    </div>
  );
}

interface KeywordPillProps {
  kw: Keyword;
  checked: boolean;
  onChange: (kw: Keyword) => void;
}

function KeywordPill({ kw, checked, onChange }: KeywordPillProps) {
  return (
    <label
      className={`
        inline-flex items-center px-3.5 py-1.5 rounded-full
        font-mono text-[0.72rem] border cursor-pointer
        transition-all duration-150 select-none
        ${
          checked
            ? "border-amber-500/60 text-amber-400 bg-amber-500/10"
            : "border-line text-zinc-600 hover:border-amber-500/30 hover:text-zinc-400"
        }
      `}
    >
      <input
        type="radio"
        name="keyWords"
        value={kw}
        checked={checked}
        onChange={() => onChange(kw)}
        className="sr-only"
      />
      {kw}
    </label>
  );
}
