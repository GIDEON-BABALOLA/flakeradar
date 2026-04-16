// export type TabId = "repos" | "commits";
  export type TabId = "repos" | "commits" | "flaky-concurrent" | "flaky-network";
export interface RepoItem {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
}

export interface CommitItem {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  repository: {
    full_name: string;
  };
}

export type SearchItem = RepoItem | CommitItem;
