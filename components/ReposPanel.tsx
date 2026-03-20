import SearchButton from "./SearchButton";

interface ReposPanelProps {
  onFetch: () => void;
  loading: boolean;
}

export default function ReposPanel({ onFetch, loading }: ReposPanelProps) {
  return (
    <div>
      <p className="font-mono text-[0.78rem] text-zinc-500 mb-5 leading-relaxed">
        Search top JavaScript repositories on GitHub, sorted by stars.
      </p>
      <SearchButton onClick={() => onFetch()} loading={loading}>
        Search Repositories
      </SearchButton>
      <div className="flex items-center gap-2 mt-3">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        <span className="font-mono text-[0.68rem] text-zinc-700">
          JavaScript · sorted by stars
        </span>
      </div>
    </div>
  );
}
