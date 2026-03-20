const REL_LABELS: Record<string, string> = {
  next:  "Next →",
  prev:  "← Prev",
  first: "« First",
  last:  "Last »",
};

interface PageLink {
  url: string;
  rel: string;
}

interface PaginationProps {
  linkHeader: string | null;
  onPage: (url: string) => void;
}

export default function Pagination({ linkHeader, onPage }: PaginationProps) {
  if (!linkHeader) return null;

  const pages = linkHeader.split(",").reduce<PageLink[]>((acc, part) => {
    const urlMatch = part.match(/<([^>]+)>/);
    const relMatch = part.match(/rel="([^"]+)"/);
    if (urlMatch && relMatch) {
      acc.push({ url: urlMatch[1], rel: relMatch[1] });
    }
    return acc;
  }, []);

  if (!pages.length) return null;

  return (
    <div className="flex justify-center gap-2 mt-5 flex-wrap">
      {pages.map((p) => (
        <button
          key={p.rel}
          onClick={() => onPage(p.url)}
          className="
            px-4 py-1.5 rounded-lg border border-line bg-transparent
            font-mono text-[0.68rem] tracking-wider uppercase text-zinc-600
            hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/5
            transition-all duration-150 cursor-pointer
          "
        >
          {REL_LABELS[p.rel] ?? p.rel}
        </button>
      ))}
    </div>
  );
}
