// import SearchButton from "./SearchButton";
// import RepoInput from "./RepoInput";
// import KeywordsGroup, { type Keyword } from "./KeywordsGroup";

// interface CommitsPanelProps {
//   repo: string;
//   onRepoChange: (value: string) => void;
//   keyword: Keyword;
//   onKeyword: (kw: Keyword) => void;
//   onFetch: () => void;
//   loading: boolean;
// }

// export default function CommitsPanel({
//   repo, onRepoChange, keyword, onKeyword, onFetch, loading,
// }: CommitsPanelProps) {
//   return (
//     <div>
//       <RepoInput value={repo} onChange={onRepoChange} />
//       <KeywordsGroup selected={keyword} onSelect={onKeyword} />
//       <SearchButton onClick={onFetch} loading={loading}>
//         Search Commits
//       </SearchButton>
//     </div>
//   );
// }

import SearchButton from "./SearchButton";
import RepoInput from "./RepoInput";
import KeywordsGroup, { type Keyword, type SecondKeyword } from "./KeywordsGroup";

interface CommitsPanelProps {
  repo:           string;
  onRepoChange:   (value: string) => void;
  keyword:        Keyword;
  onKeyword:      (kw: Keyword) => void;
  secondKeyword:  SecondKeyword | null;
  onSecondKeyword:(kw: SecondKeyword | null) => void;
  onFetch:        () => void;
  loading:        boolean;
}

export default function CommitsPanel({
  repo, onRepoChange,
  keyword, onKeyword,
  secondKeyword, onSecondKeyword,
  onFetch, loading,
}: CommitsPanelProps) {
  return (
    <div>
      <RepoInput value={repo} onChange={onRepoChange} />
      <KeywordsGroup
        selected={keyword}
        onSelect={onKeyword}
        secondSelected={secondKeyword}
        onSecondSelect={onSecondKeyword}
      />
      <SearchButton onClick={onFetch} loading={loading}>
        Search Commits
      </SearchButton>
    </div>
  );
}