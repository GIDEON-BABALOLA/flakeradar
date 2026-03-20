import SearchButton from "./SearchButton";
import RepoInput from "./RepoInput";
import KeywordsGroup, { type Keyword } from "./KeywordsGroup";

interface CommitsPanelProps {
  repo: string;
  onRepoChange: (value: string) => void;
  keyword: Keyword;
  onKeyword: (kw: Keyword) => void;
  onFetch: () => void;
  loading: boolean;
}

export default function CommitsPanel({
  repo, onRepoChange, keyword, onKeyword, onFetch, loading,
}: CommitsPanelProps) {
  return (
    <div>
      <RepoInput value={repo} onChange={onRepoChange} />
      <KeywordsGroup selected={keyword} onSelect={onKeyword} />
      <SearchButton onClick={onFetch} loading={loading}>
        Search Commits
      </SearchButton>
    </div>
  );
}
