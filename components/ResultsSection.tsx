import type { ReactNode } from "react";
import type { TabId, RepoItem, CommitItem } from "@/types/github";
import RepoCard from "./RepoCard";
import CommitCard from "./CommitCard";
import SkeletonLoader from "./SkeletonLoader";
import Pagination from "./Pagination";
import { ErrorBox, EmptyState } from "./Feedback";

interface ResultsSectionProps {
  loading: boolean;
  error: string | null;
  type: TabId;
  items: (RepoItem | CommitItem)[] | null;
  count: number | null;
  linkHeader: string | null;
  onPage: (url: string) => void;
}

export default function ResultsSection({
  loading, error, type, items, count, linkHeader, onPage,
}: ResultsSectionProps) {
  const isVisible = loading || !!error || items !== null;
  if (!isVisible) return null;

  return (
    <div className="mt-7 pt-6 border-t border-line">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Results</SectionLabel>
        {!loading && !error && count != null && (
          <p className="font-mono text-[0.7rem] text-zinc-500">
            <span className="text-amber-400">{count.toLocaleString()}</span> results
          </p>
        )}
      </div>

      {loading && <SkeletonLoader />}

      {!loading && error && <ErrorBox message={error} />}

      {!loading && !error && items?.length === 0 && <EmptyState />}

      {!loading && !error && items && items.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {items.map((item, i) =>
              type === "repos" ? (
                <RepoCard key={(item as RepoItem).id} item={item as RepoItem} index={i} />
              ) : (
                <CommitCard key={(item as CommitItem).sha} item={item as CommitItem} index={i} />
              )
            )}
          </div>
          <Pagination linkHeader={linkHeader} onPage={onPage} />
        </>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-zinc-600 m-0">
      {children}
    </p>
  );
}
