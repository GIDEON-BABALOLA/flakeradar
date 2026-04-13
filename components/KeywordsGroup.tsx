// const KEYWORDS = [
//   "flaky", "flakey", "flakiness", "intermit",
//   "fragile", "brittle", "intermittent", "non-deterministic test",
// ] as const;

// export type Keyword = (typeof KEYWORDS)[number];

// interface KeywordsGroupProps {
//   selected: Keyword;
//   onSelect: (kw: Keyword) => void;
// }

// export default function KeywordsGroup({ selected, onSelect }: KeywordsGroupProps) {
//   return (
//     <div className="mb-6">
//       <p className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-zinc-600 mb-3">
//         Keyword Filter
//       </p>
//       <div className="flex flex-wrap gap-2">
//         {KEYWORDS.map((kw) => (
//           <KeywordPill key={kw} kw={kw} checked={selected === kw} onChange={onSelect} />
//         ))}
//       </div>
//     </div>
//   );
// }

// interface KeywordPillProps {
//   kw: Keyword;
//   checked: boolean;
//   onChange: (kw: Keyword) => void;
// }

// function KeywordPill({ kw, checked, onChange }: KeywordPillProps) {
//   return (
//     <label
//       className={`
//         inline-flex items-center px-3.5 py-1.5 rounded-full
//         font-mono text-[0.72rem] border cursor-pointer
//         transition-all duration-150 select-none
//         ${
//           checked
//             ? "border-amber-500/60 text-amber-400 bg-amber-500/10"
//             : "border-line text-zinc-600 hover:border-amber-500/30 hover:text-zinc-400"
//         }
//       `}
//     >
//       <input
//         type="radio"
//         name="keyWords"
//         value={kw}
//         checked={checked}
//         onChange={() => onChange(kw)}
//         className="sr-only"
//       />
//       {kw}
//     </label>
//   );
// }
const PRIMARY_KEYWORDS = [
  "flaky", "flakey", "flakiness", "intermit",
  "fragile", "brittle", "intermittent", "non-deterministic test",
] as const;

const SECONDARY_KEYWORDS = [
  "async wait", "asynchronous", "concurrency", "network", "async",
] as const;

export type Keyword        = (typeof PRIMARY_KEYWORDS)[number];
export type SecondKeyword  = (typeof SECONDARY_KEYWORDS)[number];

interface KeywordsGroupProps {
  selected:       Keyword;
  onSelect:       (kw: Keyword) => void;
  secondSelected: SecondKeyword | null;
  onSecondSelect: (kw: SecondKeyword | null) => void;
}

export default function KeywordsGroup({
  selected, onSelect, secondSelected, onSecondSelect,
}: KeywordsGroupProps) {
  return (
    <div className="mb-6 flex flex-col gap-5">
      {/* ── Group 1 ── */}
      <div>
        <p className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-zinc-600 mb-3">
          Keyword Filter
        </p>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_KEYWORDS.map((kw) => (
            <KeywordPill
              key={kw}
              kw={kw}
              checked={selected === kw}
              disabled={false}
              color="amber"
              onChange={() => {
                onSelect(kw);
                // Clear secondary whenever primary changes
                onSecondSelect(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Group 2 ── */}
      <div>
        <p className={`font-mono text-[0.65rem] tracking-[0.12em] uppercase mb-3 transition-colors duration-150
          ${selected ? "text-zinc-600" : "text-zinc-800"}`}>
          Classify by&nbsp;
          <span className={selected ? "text-indigo-400" : "text-zinc-700"}>
            type
          </span>
          &nbsp;(optional)
        </p>
        <div className="flex flex-wrap gap-2">
          {SECONDARY_KEYWORDS.map((kw) => (
            <KeywordPill
              key={kw}
              kw={kw}
              checked={secondSelected === kw}
              disabled={!selected}
              color="indigo"
              onChange={() =>
                // Toggle off if already selected, otherwise select
                onSecondSelect(secondSelected === kw ? null : kw)
              }
            />
          ))}
        </div>
        {!selected && (
          <p className="font-mono text-[0.62rem] text-zinc-700 mt-2">
            Pick a keyword above to enable this filter.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Pill ────────────────────────────────────────────────────────────────────

interface KeywordPillProps {
  kw:       string;
  checked:  boolean;
  disabled: boolean;
  color:    "amber" | "indigo";
  onChange: () => void;
}

function KeywordPill({ kw, checked, disabled, color, onChange }: KeywordPillProps) {
  const activeClass =
    color === "amber"
      ? "border-amber-500/60 text-amber-400 bg-amber-500/10"
      : "border-indigo-500/60 text-indigo-400 bg-indigo-500/10";

  const hoverClass =
    color === "amber"
      ? "hover:border-amber-500/30 hover:text-zinc-400"
      : "hover:border-indigo-500/30 hover:text-zinc-400";

  return (
    <label
      className={`
        inline-flex items-center px-3.5 py-1.5 rounded-full
        font-mono text-[0.72rem] border select-none
        transition-all duration-150
        ${disabled
          ? "border-zinc-800 text-zinc-700 cursor-not-allowed opacity-40"
          : checked
            ? `${activeClass} cursor-pointer`
            : `border-line text-zinc-600 ${hoverClass} cursor-pointer`
        }
      `}
    >
      <input
        type="checkbox"
        name={color === "amber" ? "primaryKeyword" : "secondaryKeyword"}
        value={kw}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      {kw}
    </label>
  );
}
