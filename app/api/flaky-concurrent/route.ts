// // app/api/flaky-concurrent/route.ts
// //
// // Streams Server-Sent Events (SSE) to the client.
// // Each event is one of:
// //   { type: "commit", data: CommitItem }
// //   { type: "progress", repo: string, page: number }
// //   { type: "done", total: number }
// //   { type: "error", message: string }
// //
// // Query params:
// //   repoPage  – which page of top-JS-repos to pull (default 1, 1-indexed, 30 repos/page)
// //   maxRepos  – how many repos to scan from that page (default 10, max 30)

// import { NextRequest } from "next/server";
// import axios from "axios";

// const GH = "https://api.github.com";

// const ghHeaders = {
//   Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
//   Accept: "application/vnd.github+json",
// };

// // GitHub search lets us do: repo:owner/name flaky concurrent in:message
// // We'll search commits per-repo so we get accurate results.

// export const dynamic = "force-dynamic"; // never cache this route

// export async function GET(req: NextRequest) {
//   const sp = req.nextUrl.searchParams;
//   const repoPage = Math.max(1, parseInt(sp.get("repoPage") ?? "1", 10));
//   const maxRepos = Math.min(30, Math.max(1, parseInt(sp.get("maxRepos") ?? "10", 10)));

//   // Set up SSE stream
//   const encoder = new TextEncoder();
//   const stream = new ReadableStream({
//     async start(controller) {
//       const send = (obj: object) => {
//         controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
//       };

//       try {
//         // 1. Fetch top JavaScript repos sorted by stars
//         const reposRes = await axios.get(`${GH}/search/repositories`, {
//           headers: ghHeaders,
//           params: {
//             q: "language:javascript stars:>5000",
//             sort: "stars",
//             order: "desc",
//             per_page: 30,
//             page: repoPage,
//           },
//         });

//         const repos: { full_name: string }[] = reposRes.data.items.slice(0, maxRepos);

//         let totalFound = 0;

//         // 2. For each repo, search commits with flaky + concurrent/concurrency keywords
//         for (const repo of repos) {
//           send({ type: "progress", repo: repo.full_name, page: 1 });

//           // GitHub commit search: q=flaky+concurrent+repo:owner/name
//           let page = 1;
//           let hasMore = true;

//           while (hasMore) {
//             try {
//               const commitRes = await axios.get(`${GH}/search/commits`, {
//                 headers: {
//                   ...ghHeaders,
//                   Accept: "application/vnd.github.cloak-preview+json",
//                 },
//                 params: {
//                   q: `flaky concurren repo:${repo.full_name}`,
//                   per_page: 10,
//                   page,
//                 },
//               });

//               const items = commitRes.data.items ?? [];

//               for (const item of items) {
//                 // Normalise into the CommitItem shape your UI already expects
//                 const commitItem = {
//                   sha: item.sha,
//                   html_url: item.html_url,
//                   commit: {
//                     message: item.commit?.message ?? "",
//                     author: {
//                       date: item.commit?.author?.date ?? "",
//                       name: item.commit?.author?.name ?? "",
//                     },
//                   },
//                   repository: {
//                     full_name: repo.full_name,
//                   },
//                 };
//                 send({ type: "commit", data: commitItem });
//                 totalFound++;
//               }

//               // GitHub commit search caps at 1000 results; stop at page 3 per repo to be polite
//               hasMore = items.length === 10 && page < 3;
//               page++;

//               // Brief pause to respect secondary rate limits
//               if (hasMore) await sleep(300);
//             } catch (err: unknown) {
//               const status = (err as { response?: { status?: number } }).response?.status;
//               if (status === 422 || status === 403) {
//                 // Unprocessable (no commits indexed) or rate-limited — skip repo
//                 hasMore = false;
//               } else {
//                 hasMore = false;
//               }
//             }
//           }

//           // Pause between repos to stay under GitHub's secondary rate limit
//           await sleep(500);
//         }

//         send({ type: "done", total: totalFound });
//       } catch (err: unknown) {
//         const message =
//           (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
//           "Failed to fetch from GitHub";
//         send({ type: "error", message });
//       } finally {
//         controller.close();
//       }
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     },
//   });
// }

// function sleep(ms: number) {
//   return new Promise((r) => setTimeout(r, ms));
// }

// app/api/flaky-concurrent/route.ts
//
// Streams Server-Sent Events (SSE) to the client.
// Each event is one of:
//   { type: "commit", data: CommitItem }
//   { type: "progress", repo: string, language: string }
//   { type: "done", total: number }
//   { type: "error", message: string }
//
// Query params:
//   repoPage  – which page of top repos to pull (default 1, 1-indexed, 30 repos/page)
//   maxRepos  – how many repos to scan PER LANGUAGE (default 10, max 30)
//              e.g. maxRepos=10 → up to 10 JS + 10 TS repos = up to 20 total (deduplicated)

// import { NextRequest } from "next/server";
// import axios from "axios";

// const GH = "https://api.github.com";

// const ghHeaders = {
//   Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
//   Accept: "application/vnd.github+json",
// };

// export const dynamic = "force-dynamic";

// type RepoEntry = { full_name: string; language: string };

// export async function GET(req: NextRequest) {
//   const sp = req.nextUrl.searchParams;
//   const repoPage = Math.max(1, parseInt(sp.get("repoPage") ?? "1", 10));
//   const maxRepos = Math.min(30, Math.max(1, parseInt(sp.get("maxRepos") ?? "10", 10)));

//   const encoder = new TextEncoder();
//   const stream = new ReadableStream({
//     async start(controller) {
//       const send = (obj: object) => {
//         controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
//       };

//       try {
//         // 1. Fetch top JavaScript AND TypeScript repos in parallel
//         const [jsRes, tsRes] = await Promise.all([
//           axios.get(`${GH}/search/repositories`, {
//             headers: ghHeaders,
//             params: {
//               q: "language:javascript stars:>5000",
//               sort: "stars",
//               order: "desc",
//               per_page: 30,
//               page: repoPage,
//             },
//           }),
//           axios.get(`${GH}/search/repositories`, {
//             headers: ghHeaders,
//             params: {
//               q: "language:typescript stars:>5000",
//               sort: "stars",
//               order: "desc",
//               per_page: 30,
//               page: repoPage,
//             },
//           }),
//         ]);

//         const jsRepos: RepoEntry[] = jsRes.data.items
//           .slice(0, maxRepos)
//           .map((r: { full_name: string }) => ({ full_name: r.full_name, language: "JavaScript" }));

//         const tsRepos: RepoEntry[] = tsRes.data.items
//           .slice(0, maxRepos)
//           .map((r: { full_name: string }) => ({ full_name: r.full_name, language: "TypeScript" }));

//         // Deduplicate repos that appear in both lists
//         const seen = new Set<string>();
//         const repos = [...jsRepos, ...tsRepos].filter(({ full_name }) => {
//           if (seen.has(full_name)) return false;
//           seen.add(full_name);
//           return true;
//         });

//         send({
//           type: "progress",
//           repo: `Scanning ${repos.length} repos (${jsRepos.length} JS + ${tsRepos.length} TS, deduped)…`,
//           language: "",
//         });

//         let totalFound = 0;

//         // 2. For each repo, search commits containing "flaky" AND "concurren*"
//         for (const repo of repos) {
//           send({ type: "progress", repo: repo.full_name, language: repo.language });

//           let page = 1;
//           let hasMore = true;

//           while (hasMore) {
//             try {
//               const commitRes = await axios.get(`${GH}/search/commits`, {
//                 headers: {
//                   ...ghHeaders,
//                   Accept: "application/vnd.github.cloak-preview+json",
//                 },
//                 params: {
//                   q: `flaky concurren repo:${repo.full_name}`,
//                 //   q: `test repo:${repo.full_name}`,
//                   per_page: 10,
//                   page,
//                 },
//               });

//               const items = commitRes.data.items ?? [];

//               for (const item of items) {
//                 const commitItem = {
//                   sha: item.sha,
//                   html_url: item.html_url,
//                   commit: {
//                     message: item.commit?.message ?? "",
//                     author: {
//                       date: item.commit?.author?.date ?? "",
//                       name: item.commit?.author?.name ?? "",
//                     },
//                   },
//                   repository: {
//                     full_name: repo.full_name,
//                     language: repo.language,
//                   },
//                 };
//                 send({ type: "commit", data: commitItem });
//                 totalFound++;
//               }

//               // Cap at 3 pages per repo to stay within rate limits
//               hasMore = items.length === 10 && page < 3;
//               page++;

//               if (hasMore) await sleep(300);
//             } catch (err: unknown) {
//               // 422 = repo not indexed for commit search; 403 = rate limited → skip
//               hasMore = false;
//             }
//           }

//           // Pause between repos to respect GitHub's secondary rate limit
//           await sleep(500);
//         }

//         send({ type: "done", total: totalFound });
//       } catch (err: unknown) {
//         const message =
//           (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
//           "Failed to fetch from GitHub";
//         send({ type: "error", message });
//       } finally {
//         controller.close();
//       }
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     },
//   });
// }

// function sleep(ms: number) {
//   return new Promise((r) => setTimeout(r, ms));
// }
// app/api/flaky-concurrent/route.ts
//
// Query params:
//   starRange  – GitHub stars filter e.g. "50000..*", "10000..50000" (default "50000..*")
//   maxRepos   – repos to scan PER language (default 20, max 100)

// import { NextRequest } from "next/server";
// import axios from "axios";

// const GH = "https://api.github.com";

// const ghHeaders = {
//   Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
//   Accept: "application/vnd.github+json",
// };

// export const dynamic = "force-dynamic";

// type RepoEntry = { full_name: string; language: string };

// export async function GET(req: NextRequest) {
//   const sp        = req.nextUrl.searchParams;
//   const starRange = sp.get("starRange") ?? "50000..*";
//   const maxRepos  = Math.min(100, Math.max(1, parseInt(sp.get("maxRepos") ?? "20", 10)));

//   // How many GitHub pages we need (30 per page)
//   const pages = Math.ceil(maxRepos / 30);

//   const encoder = new TextEncoder();
//   const stream = new ReadableStream({
//     async start(controller) {
//       const send = (obj: object) =>
//         controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`));

//       try {
//         // 1. Fetch JS + TS repos for the chosen star range (parallel, multi-page if needed)
//         const fetchRepos = async (language: string): Promise<RepoEntry[]> => {
//           const results: RepoEntry[] = [];
//           for (let page = 1; page <= pages; page++) {
//             const res = await axios.get(`${GH}/search/repositories`, {
//               headers: ghHeaders,
//               params: {
//                 q: `language:${language} stars:${starRange}`,
//                 sort: "stars",
//                 order: "desc",
//                 per_page: 30,
//                 page,
//               },
//             });
//             const items: { full_name: string }[] = res.data.items ?? [];
//             results.push(...items.map((r) => ({ full_name: r.full_name, language })));
//             if (items.length < 30) break; // no more pages
//           }
//           return results.slice(0, maxRepos);
//         };

//         const [jsRepos, tsRepos] = await Promise.all([
//           fetchRepos("JavaScript"),
//           fetchRepos("TypeScript"),
//         ]);

//         // Deduplicate
//         const seen = new Set<string>();
//         const repos = [...jsRepos, ...tsRepos].filter(({ full_name }) => {
//           if (seen.has(full_name)) return false;
//           seen.add(full_name);
//           return true;
//         });

//         send({
//           type: "progress",
//           repo: `Scanning ${repos.length} repos (${jsRepos.length} JS + ${tsRepos.length} TS, deduped)…`,
//           language: "",
//         });

//         let totalFound = 0;

//         // 2. Search commits per repo for "flaky" + "concurren*"
//         for (const repo of repos) {
//           send({ type: "progress", repo: repo.full_name, language: repo.language });

//           let page = 1;
//           let hasMore = true;

//           while (hasMore) {
//             try {
//               const commitRes = await axios.get(`${GH}/search/commits`, {
//                 headers: {
//                   ...ghHeaders,
//                   Accept: "application/vnd.github.cloak-preview+json",
//                 },
//                 params: {
//                   q: `flaky concurren repo:${repo.full_name}`,
//                   per_page: 10,
//                   page,
//                 },
//               });

//               const items = commitRes.data.items ?? [];

//               for (const item of items) {
//                 send({
//                   type: "commit",
//                   data: {
//                     sha: item.sha,
//                     html_url: item.html_url,
//                     commit: {
//                       message: item.commit?.message ?? "",
//                       author: {
//                         date: item.commit?.author?.date ?? "",
//                         name: item.commit?.author?.name ?? "",
//                       },
//                     },
//                     repository: {
//                       full_name: repo.full_name,
//                       language: repo.language,
//                     },
//                   },
//                 });
//                 totalFound++;
//               }

//               hasMore = items.length === 10 && page < 3;
//               page++;
//               if (hasMore) await sleep(300);
//             } catch {
//               hasMore = false;
//             }
//           }

//           await sleep(500);
//         }

//         send({ type: "done", total: totalFound });
//       } catch (err: unknown) {
//         const message =
//           (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
//           "Failed to fetch from GitHub";
//         send({ type: "error", message });
//       } finally {
//         controller.close();
//       }
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     },
//   });
// }

// function sleep(ms: number) {
//   return new Promise((r) => setTimeout(r, ms));
// }
// app/api/flaky-concurrent/route.ts
//
// For each repo, searches TWO sources:
//   1. Commit messages   — GitHub commit search (flaky + concurren in message)
//   2. PR bodies         — GitHub PR search (flaky + concurren in body), then
//                          resolves each PR's merge commit for the real SHA/diff
//
// Results from both sources are deduplicated by SHA before streaming.
//
// Query params:
//   starRange  – GitHub stars filter e.g. "50000..*", "10000..50000" (default "200000..*")
//   maxRepos   – repos to scan PER language (default 20, max 100)

// import { NextRequest } from "next/server";
// import axios from "axios";

// const GH = "https://api.github.com";

// const ghHeaders = {
//   Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
//   Accept: "application/vnd.github+json",
// };

// const commitSearchHeaders = {
//   ...ghHeaders,
//   Accept: "application/vnd.github.cloak-preview+json",
// };

// export const dynamic = "force-dynamic";

// type RepoEntry = { full_name: string; language: string };

// // The shape we stream to the client — matches your existing CommitItem type
// type CommitPayload = {
//   sha: string;
//   html_url: string;
//   source: "commit" | "pr";  // so you can see where it came from
//   commit: {
//     message: string;
//     author: { date: string; name: string };
//   };
//   repository: { full_name: string; language: string };
// };

// export async function GET(req: NextRequest) {
//   const sp        = req.nextUrl.searchParams;
//   const starRange = sp.get("starRange") ?? "200000..*";
//   const maxRepos  = Math.min(100, Math.max(1, parseInt(sp.get("maxRepos") ?? "20", 10)));
//   const pages     = Math.ceil(maxRepos / 30);

//   const stream = new ReadableStream({
//     async start(controller) {
//       const send = (obj: object) =>
//         controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`));

//       try {
//         // ── 1. Fetch JS + TS repos ──────────────────────────────────────────
//         const fetchRepos = async (language: string): Promise<RepoEntry[]> => {
//           const results: RepoEntry[] = [];
//           for (let page = 1; page <= pages; page++) {
//             const res = await axios.get(`${GH}/search/repositories`, {
//               headers: ghHeaders,
//               params: {
//                 q: `language:${language} stars:${starRange}`,
//                 sort: "stars",
//                 order: "desc",
//                 per_page: 30,
//                 page,
//               },
//             });
//             const items: { full_name: string }[] = res.data.items ?? [];
//             results.push(...items.map((r) => ({ full_name: r.full_name, language })));
//             if (items.length < 30) break;
//           }
//           return results.slice(0, maxRepos);
//         };

//         const [jsRepos, tsRepos] = await Promise.all([
//           fetchRepos("JavaScript"),
//           fetchRepos("TypeScript"),
//         ]);

//         // Deduplicate repos
//         const seen = new Set<string>();
//         const repos = [...jsRepos, ...tsRepos].filter(({ full_name }) => {
//           if (seen.has(full_name)) return false;
//           seen.add(full_name);
//           return true;
//         });

//         send({
//           type: "progress",
//           repo: `Scanning ${repos.length} repos (${jsRepos.length} JS + ${tsRepos.length} TS)…`,
//           language: "",
//         });

//         let totalFound = 0;

//         // ── 2. Per-repo: search commits + PRs ──────────────────────────────
//         for (const repo of repos) {
//           send({ type: "progress", repo: repo.full_name, language: repo.language });

//           // Deduplicate SHAs within this repo across both sources
//           const repoSeenShas = new Set<string>();

//           const emitCommit = (payload: CommitPayload) => {
//             if (repoSeenShas.has(payload.sha)) return;
//             repoSeenShas.add(payload.sha);
//             send({ type: "commit", data: payload });
//             totalFound++;
//           };

//           // ── 2a. Commit message search ─────────────────────────────────────
//           await searchCommitMessages(repo, emitCommit);
//           await sleep(300);

//           // ── 2b. PR body search ────────────────────────────────────────────
//           await searchPRBodies(repo, emitCommit);

//           await sleep(500);
//         }

//         send({ type: "done", total: totalFound });
//       } catch (err: unknown) {
//         const message =
//           (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
//           "Failed to fetch from GitHub";
//         send({ type: "error", message });
//       } finally {
//         controller.close();
//       }
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     },
//   });
// }

// // ── Commit message search ─────────────────────────────────────────────────────
// // Searches commits whose message contains "flaky" AND "concurren*"

// async function searchCommitMessages(
//   repo: RepoEntry,
//   emit: (c: CommitPayload) => void,
// ) {
//   let page = 1;
//   let hasMore = true;

//   while (hasMore) {
//     try {
//       const res = await axios.get(`${GH}/search/commits`, {
//         headers: commitSearchHeaders,
//         params: {
//           q: `flaky concurren repo:${repo.full_name}`,
//           per_page: 10,
//           page,
//         },
//       });

//       const items = res.data.items ?? [];

//       for (const item of items) {
//         emit({
//           sha: item.sha,
//           html_url: item.html_url,
//           source: "commit",
//           commit: {
//             message: item.commit?.message ?? "",
//             author: {
//               date: item.commit?.author?.date ?? "",
//               name: item.commit?.author?.name ?? "",
//             },
//           },
//           repository: { full_name: repo.full_name, language: repo.language },
//         });
//       }

//       hasMore = items.length === 10 && page < 3;
//       page++;
//       if (hasMore) await sleep(300);
//     } catch {
//       hasMore = false;
//     }
//   }
// }

// // ── PR body search ────────────────────────────────────────────────────────────
// // Finds merged PRs whose description contains "flaky" AND "concurren*",
// // then resolves the actual merge commit for each PR.

// async function searchPRBodies(
//   repo: RepoEntry,
//   emit: (c: CommitPayload) => void,
// ) {
//   let page = 1;
//   let hasMore = true;

//   while (hasMore) {
//     try {
//       const res = await axios.get(`${GH}/search/issues`, {
//         headers: ghHeaders,
//         params: {
//           // Search PR bodies (and titles as a bonus) for the keywords
//           // q: `flaky concurren repo:${repo.full_name} type:pr is:merged`,
//           q: `flaky concurren repo:${repo.full_name} type:pr is:merged`,
//           per_page: 10,
//           page,
//         },
//       });

//       const items = res.data.items ?? [];

//       for (const pr of items) {
//         // Fetch the PR details to get the merge_commit_sha
//         try {
//           const prRes = await axios.get(
//             `${GH}/repos/${repo.full_name}/pulls/${pr.number}`,
//             { headers: ghHeaders },
//           );

//           const mergeCommitSha: string | null = prRes.data.merge_commit_sha ?? null;
//           if (!mergeCommitSha) continue;

//           // Fetch the actual commit object so we have the message + date
//           const commitRes = await axios.get(
//             `${GH}/repos/${repo.full_name}/commits/${mergeCommitSha}`,
//             { headers: ghHeaders },
//           );

//           const c = commitRes.data;

//           emit({
//             sha: mergeCommitSha,
//             html_url: c.html_url ?? `https://github.com/${repo.full_name}/commit/${mergeCommitSha}`,
//             source: "pr",
//             commit: {
//               // Prefix with the PR title so it's clear in the UI what the PR was about
//               message: `[PR #${pr.number}] ${pr.title}\n\n${c.commit?.message ?? ""}`,
//               author: {
//                 date: c.commit?.author?.date ?? "",
//                 name: c.commit?.author?.name ?? "",
//               },
//             },
//             repository: { full_name: repo.full_name, language: repo.language },
//           });

//           await sleep(200); // small pause between commit fetches
//         } catch {
//           // If we can't resolve the merge commit, skip this PR
//           continue;
//         }
//       }

//       hasMore = items.length === 10 && page < 3;
//       page++;
//       if (hasMore) await sleep(300);
//     } catch {
//       hasMore = false;
//     }
//   }
// }

// function sleep(ms: number) {
//   return new Promise((r) => setTimeout(r, ms));
// }
// app/api/flaky-concurrent/route.ts

import { NextRequest } from "next/server";
import axios from "axios";

const GH = "https://api.github.com";

const ghHeaders = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
};

const commitSearchHeaders = {
  ...ghHeaders,
  Accept: "application/vnd.github.cloak-preview+json",
};

export const dynamic = "force-dynamic";

type RepoEntry = { full_name: string; language: string };

type CommitPayload = {
  sha: string;
  html_url: string;
  source: "commit" | "pr";
  commit: {
    message: string;
    author: { date: string; name: string };
  };
  repository: { full_name: string; language: string };
};

// ── Validation ────────────────────────────────────────────────────────────────
// Both "flaky" AND a concurrency word must appear in the text.
// We check the full commit message (or PR title + body) — case-insensitive.

const FLAKY_RE       = /\bflak(y|e|ey|iness|ily)?\b/i;
const CONCURRENT_RE  = /\bconcurren(t|cy|tly)?\b/i;

function isValidConcurrentCommit(text: string): boolean {
  return FLAKY_RE.test(text) && CONCURRENT_RE.test(text);
}

export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const starRange = sp.get("starRange") ?? "200000..*";
  const maxRepos  = Math.min(100, Math.max(1, parseInt(sp.get("maxRepos") ?? "20", 10)));
  const pages     = Math.ceil(maxRepos / 30);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const fetchRepos = async (language: string): Promise<RepoEntry[]> => {
          const results: RepoEntry[] = [];
          for (let page = 1; page <= pages; page++) {
            const res = await axios.get(`${GH}/search/repositories`, {
              headers: ghHeaders,
              params: {
                q: `language:${language} stars:${starRange}`,
                sort: "stars",
                order: "desc",
                per_page: 30,
                page,
              },
            });
            const items: { full_name: string }[] = res.data.items ?? [];
            results.push(...items.map((r) => ({ full_name: r.full_name, language })));
            if (items.length < 30) break;
          }
          return results.slice(0, maxRepos);
        };

        const [jsRepos, tsRepos] = await Promise.all([
          fetchRepos("JavaScript"),
          fetchRepos("TypeScript"),
        ]);

        const seen = new Set<string>();
        const repos = [...jsRepos, ...tsRepos].filter(({ full_name }) => {
          if (seen.has(full_name)) return false;
          seen.add(full_name);
          return true;
        });

        send({
          type: "progress",
          repo: `Scanning ${repos.length} repos (${jsRepos.length} JS + ${tsRepos.length} TS)…`,
          language: "",
        });

        let totalFound = 0;

        for (const repo of repos) {
          send({ type: "progress", repo: repo.full_name, language: repo.language });

          const repoSeenShas = new Set<string>();

          const emitCommit = (payload: CommitPayload) => {
            if (repoSeenShas.has(payload.sha)) return;
            repoSeenShas.add(payload.sha);
            send({ type: "commit", data: payload });
            totalFound++;
          };

          await searchCommitMessages(repo, emitCommit);
          await sleep(300);
          await searchPRBodies(repo, emitCommit);
          await sleep(500);
        }

        send({ type: "done", total: totalFound });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          "Failed to fetch from GitHub";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function searchCommitMessages(repo: RepoEntry, emit: (c: CommitPayload) => void) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await axios.get(`${GH}/search/commits`, {
        headers: commitSearchHeaders,
        params: {
          q: `flak concurren repo:${repo.full_name}`,
          per_page: 10,
          page,
        },
      });

      const items = res.data.items ?? [];

      for (const item of items) {
        const message: string = item.commit?.message ?? "";

        // Hard filter — both words must actually be present
        if (!isValidConcurrentCommit(message)) continue;

        emit({
          sha: item.sha,
          html_url: item.html_url,
          source: "commit",
          commit: {
            message,
            author: {
              date: item.commit?.author?.date ?? "",
              name: item.commit?.author?.name ?? "",
            },
          },
          repository: { full_name: repo.full_name, language: repo.language },
        });
      }

      hasMore = items.length === 10 && page < 3;
      page++;
      if (hasMore) await sleep(300);
    } catch {
      hasMore = false;
    }
  }
}

async function searchPRBodies(repo: RepoEntry, emit: (c: CommitPayload) => void) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await axios.get(`${GH}/search/issues`, {
        headers: ghHeaders,
        params: {
          q: `flak concurren repo:${repo.full_name} type:pr is:merged`,
          per_page: 10,
          page,
        },
      });

      const items = res.data.items ?? [];

      for (const pr of items) {
        // Hard filter — check PR title + body both contain the required words
        const prText = `${pr.title ?? ""} ${pr.body ?? ""}`;
        if (!isValidConcurrentCommit(prText)) continue;

        try {
          const prRes = await axios.get(
            `${GH}/repos/${repo.full_name}/pulls/${pr.number}`,
            { headers: ghHeaders },
          );

          const mergeCommitSha: string | null = prRes.data.merge_commit_sha ?? null;
          if (!mergeCommitSha) continue;

          const commitRes = await axios.get(
            `${GH}/repos/${repo.full_name}/commits/${mergeCommitSha}`,
            { headers: ghHeaders },
          );

          const c = commitRes.data;

          emit({
            sha: mergeCommitSha,
            html_url: c.html_url ?? `https://github.com/${repo.full_name}/commit/${mergeCommitSha}`,
            source: "pr",
            commit: {
              message: `[PR #${pr.number}] ${pr.title}\n\n${c.commit?.message ?? ""}`,
              author: {
                date: c.commit?.author?.date ?? "",
                name: c.commit?.author?.name ?? "",
              },
            },
            repository: { full_name: repo.full_name, language: repo.language },
          });

          await sleep(200);
        } catch {
          continue;
        }
      }

      hasMore = items.length === 10 && page < 3;
      page++;
      if (hasMore) await sleep(300);
    } catch {
      hasMore = false;
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}