// import type { ReactNode } from "react";
// import type { RepoItem } from "@/types/github";

// interface RepoCardProps {
//   item: RepoItem;
//   index: number;
// }

// export default function RepoCard({ item, index }: RepoCardProps) {
//   return (
//     <a
//       href={item.html_url}
//       target="_blank"
//       rel="noopener noreferrer"
//       className="
//         flex items-center gap-3 px-4 py-3.5 no-underline
//         bg-raised border border-line rounded-xl text-inherit
//         hover:translate-x-1 hover:border-amber-500/50 hover:bg-amber-500/[0.03]
//         transition-all duration-150 animate-fade-up
//       "
//       style={{ animationDelay: `${index * 0.04}s` }}
//     >
//       <IconBadge>📦</IconBadge>
//       <div className="flex-1 min-w-0">
//         <p className="font-mono text-[0.82rem] text-amber-400 truncate m-0">
//           {item.full_name}
//         </p>
//         <p className="font-mono text-[0.7rem] text-zinc-500 mt-0.5 truncate m-0">
//           {item.description ? item.description.slice(0, 80) : "No description"}
//           &nbsp;·&nbsp;★ {item.stargazers_count?.toLocaleString() ?? "—"}
//         </p>
//       </div>
//       <span className="text-zinc-700 text-base shrink-0">›</span>
//     </a>
//   );
// }

// function IconBadge({ children }: { children: ReactNode }) {
//   return (
//     <div className="w-9 h-9 rounded-[10px] bg-line flex items-center justify-center text-base shrink-0">
//       {children}
//     </div>
//   );
// }
import { useState, useRef, type ReactNode } from "react";
import type { RepoItem } from "@/types/github";

interface RepoCardProps {
  item: RepoItem;
  index: number;
}

export default function RepoCard({ item, index }: RepoCardProps) {
  const [copied, setCopied] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    // If a double-click is already in progress, let it handle things
    if (clickTimer.current) return;

    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      // Single click → copy full_name
      navigator.clipboard.writeText(item.full_name).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }, 220); // window to catch a second click
  };

  const handleDoubleClick = () => {
    // Cancel the pending single-click action
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    window.open(item.html_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
className={`
  flex items-center gap-3 px-4 py-3.5
  bg-raised border rounded-xl cursor-pointer select-none
  hover:translate-x-1 hover:bg-amber-500/[0.03]
  transition-all duration-150 animate-fade-up
  ${copied ? "border-amber-500/70" : "border-line hover:border-amber-500/50"}
`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <IconBadge>{copied ? "✅" : "📦"}</IconBadge>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-[0.82rem] text-amber-400 truncate m-0">
          {item.full_name}
        </p>
        <p className="font-mono text-[0.7rem] text-zinc-500 mt-0.5 truncate m-0">
          {item.description ? item.description.slice(0, 80) : "No description"}
          &nbsp;·&nbsp;★ {item.stargazers_count?.toLocaleString() ?? "—"}
        </p>
      </div>

      <span className="font-mono text-[0.6rem] text-zinc-700 shrink-0 text-right leading-tight">
        {copied ? (
          <span className="text-amber-400">copied!</span>
        ) : (
          <>
            <span className="block">click → copy</span>
            <span className="block">dbl → open</span>
          </>
        )}
      </span>
    </div>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="w-9 h-9 rounded-[10px] bg-line flex items-center justify-center text-base shrink-0">
      {children}
    </div>
  );
}