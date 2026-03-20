import type { ReactNode } from "react";
import type { CommitItem } from "@/types/github";

interface CommitCardProps {
  item: CommitItem;
  index: number;
}

export default function CommitCard({ item, index }: CommitCardProps) {
  const msg  = item.commit?.message?.split("\n")[0] ?? item.html_url;
  const repo = item.repository?.full_name ?? "";
  const date = item.commit?.author?.date?.slice(0, 10) ?? "";

  return (
    <a
      href={item.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        flex items-center gap-3 px-4 py-3.5 no-underline
        bg-raised border border-line rounded-xl text-inherit
        hover:translate-x-1 hover:border-amber-500/50 hover:bg-amber-500/[0.03]
        transition-all duration-150 animate-fade-up
      "
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <IconBadge>◈</IconBadge>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[0.8rem] text-zinc-300 truncate m-0">
          {msg.length > 90 ? msg.slice(0, 90) + "…" : msg}
        </p>
        <p className="font-mono text-[0.7rem] text-zinc-600 mt-0.5 m-0">
          {repo}
          {repo && date ? " · " : ""}
          {date}
        </p>
      </div>
      <span className="text-zinc-700 text-base shrink-0">›</span>
    </a>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="w-9 h-9 rounded-[10px] bg-line flex items-center justify-center text-amber-500 font-mono font-bold text-[1.1rem] shrink-0">
      {children}
    </div>
  );
}
