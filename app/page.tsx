"use client";

import { useState, useCallback } from "react";
import axios, { AxiosError } from "axios";

import type { TabId, RepoItem, CommitItem } from "@/types/github";
import type { Keyword, SecondKeyword } from "@/components/KeywordsGroup";

import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import ReposPanel from "@/components/ReposPanel";
import CommitsPanel from "@/components/CommitsPanel";
import ResultsSection from "@/components/ResultsSection";

const DEFAULT_REPOS_URL =
  "https://api.github.com/search/repositories?q=javascript+sort:stars&per_page=15";

interface GitHubErrorResponse {
  message?: string;
}

export default function GitHubSearchPage() {
  const [tab,     setTab]     = useState<TabId>("repos");
  const [loading, setLoading] = useState<boolean>(false);
  const [error,   setError]   = useState<string | null>(null);
  const [items,   setItems]   = useState<(RepoItem | CommitItem)[] | null>(null);
  const [count,   setCount]   = useState<number | null>(null);
  const [linkHdr, setLinkHdr] = useState<string | null>(null);
  const [type,    setType]    = useState<TabId>("repos");

  const [repo,    setRepo]    = useState<string>("");
 const [keyword,       setKeyword]       = useState<Keyword>("flaky");
const [secondKeyword, setSecondKeyword] = useState<SecondKeyword | null>(null); // ← add

  const resetResults = () => {
    setItems(null);
    setCount(null);
    setError(null);
    setLinkHdr(null);
  };

  const handleTabSwitch = (t: TabId) => {
    setTab(t);
    resetResults();
  };

  const getErrorMessage = (err: unknown): string => {
    const axiosErr = err as AxiosError<GitHubErrorResponse>;
    if (axiosErr.response?.status === 403) {
      return "Rate limit exceeded — please wait a moment and try again.";
    }
    return (
      axiosErr.response?.data?.message ??
      axiosErr.message ??
      "An error occurred."
    );
  };

  const fetchRepos = useCallback(
    async (url: string = DEFAULT_REPOS_URL) => {
      if (loading) return;
      setLoading(true);
      setError(null);
      setType("repos");
      setItems(null);

      try {
        const res = await axios.get(url);
        setItems(res.data.items ?? []);
        setCount(res.data.total_count);
        setLinkHdr(res.headers["link"] ?? null);
      } catch (err) {
        console.log(err)
        setError(getErrorMessage(err));
        setItems(null);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // const fetchCommits = useCallback(async () => {
  //   if (loading) return;
  //   if (!repo.trim()) {
  //     setError("Please enter a repository in the format <em>owner/name</em>.");
  //     setItems(null);
  //     return;
  //   }

  //   setLoading(true);
  //   setError(null);
  //   setType("commits");
  //   setItems(null);
  //   setLinkHdr(null);

  //   try {
  //     const res = await axios.get("https://api.github.com/search/commits", {
  //       params: { q: `${keyword} repo:${repo.trim()}` },
  //       headers: { Accept: "application/vnd.github.cloak-preview" },
  //     });
  //     setItems(res.data.items ?? []);
  //     setCount(res.data.total_count);
  //     setLinkHdr(res.headers["link"] ?? null);
  //   } catch (err) {
  //     setError(getErrorMessage(err));
  //     setItems(null);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [loading, repo, keyword]);
const fetchCommits = useCallback(async (url?: string) => {
    if (loading) return;

    if (!url && !repo.trim()) {
      setError("Please enter a repository in the format <em>owner/name</em>.");
      setItems(null);
      return;
    }

    setLoading(true);
    setError(null);
    setType("commits");
    setItems(null);
    setLinkHdr(null);

    try {
      const requestUrl = url ?? "https://api.github.com/search/commits";
      // const params = url ? undefined : { q: `${keyword} repo:${repo.trim()}` };
      // After
const query  = secondKeyword
  ? `${keyword} ${secondKeyword} repo:${repo.trim()}`
  : `${keyword} repo:${repo.trim()}`;
const params = url ? undefined : { q: query };

      console.log("Fetching commits from:", requestUrl, params);

      const res = await axios.get(requestUrl, {
        params,
        headers: { Accept: "application/vnd.github+json" }, // ← updated header
      });

      setItems(res.data.items ?? []);
      setCount(res.data.total_count);
      setLinkHdr(res.headers["link"] ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
      setItems(null);
    } finally {
      setLoading(false);
    }
  }, [loading, repo, keyword, secondKeyword]);
  return (
    <div className="min-h-screen bg-base flex flex-col items-center px-5 py-12 pb-24">
      <div className="w-full max-w-[840px]">
        <Header />

        <div className="w-full rounded-2xl overflow-hidden bg-surface border border-line">
          <TabBar activeTab={tab} onSwitch={handleTabSwitch} />

          <div className="p-7">
            {tab === "repos" && (
              <ReposPanel
                onFetch={fetchRepos}
                loading={loading && type === "repos"}
              />
            )}
            {tab === "commits" && (
              // <CommitsPanel
              //   repo={repo}
              //   onRepoChange={setRepo}
              //   keyword={keyword}
              //   onKeyword={setKeyword}
              //   onFetch={fetchCommits}
              //   loading={loading && type === "commits"}
              // />
//               <CommitsPanel
//   repo={repo}
//   onRepoChange={setRepo}
//   keyword={keyword}
//   onKeyword={setKeyword}
//   onFetch={() => fetchCommits()}  
//   loading={loading && type === "commits"}
// />
<CommitsPanel
  repo={repo}
  onRepoChange={setRepo}
  keyword={keyword}
  // onKeyword={(kw) => { setKeyword(kw); setSecondKeyword(null); }}
  // onSecondKeyword={setSecondKeyword}
  onKeyword={(kw) => { setKeyword(kw); setSecondKeyword(null); resetResults(); }}
  onSecondKeyword={(kw) => { setSecondKeyword(kw); resetResults(); }}
  secondKeyword={secondKeyword}
  onFetch={() => fetchCommits()}
  loading={loading && type === "commits"}
/>
            )}

            <ResultsSection
              loading={loading}
              error={error}
              type={type}
              items={items}
              count={count}
              linkHeader={linkHdr}
            // onPage={type === "commits" ? () => fetchCommits() : fetchRepos}
            onPage={type === "commits" ? fetchCommits : fetchRepos}
            />
          </div>
        </div>

        <p className="font-mono text-[0.63rem] text-zinc-800 text-center mt-6 tracking-wider">
          Powered by GitHub REST API &nbsp;·&nbsp; Unauthenticated: 10 req/min
        </p>
      </div>
    </div>
  );
}
