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

import { NextRequest } from "next/server";
import axios from "axios";

const GH = "https://api.github.com";

const ghHeaders = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
};

export const dynamic = "force-dynamic";

type RepoEntry = { full_name: string; language: string };

export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const starRange = sp.get("starRange") ?? "50000..*";
  const maxRepos  = Math.min(100, Math.max(1, parseInt(sp.get("maxRepos") ?? "20", 10)));

  // How many GitHub pages we need (30 per page)
  const pages = Math.ceil(maxRepos / 30);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        // 1. Fetch JS + TS repos for the chosen star range (parallel, multi-page if needed)
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
            if (items.length < 30) break; // no more pages
          }
          return results.slice(0, maxRepos);
        };

        const [jsRepos, tsRepos] = await Promise.all([
          fetchRepos("JavaScript"),
          fetchRepos("TypeScript"),
        ]);

        // Deduplicate
        const seen = new Set<string>();
        const repos = [...jsRepos, ...tsRepos].filter(({ full_name }) => {
          if (seen.has(full_name)) return false;
          seen.add(full_name);
          return true;
        });

        send({
          type: "progress",
          repo: `Scanning ${repos.length} repos (${jsRepos.length} JS + ${tsRepos.length} TS, deduped)…`,
          language: "",
        });

        let totalFound = 0;

        // 2. Search commits per repo for "flaky" + "concurren*"
        for (const repo of repos) {
          send({ type: "progress", repo: repo.full_name, language: repo.language });

          let page = 1;
          let hasMore = true;

          while (hasMore) {
            try {
              const commitRes = await axios.get(`${GH}/search/commits`, {
                headers: {
                  ...ghHeaders,
                  Accept: "application/vnd.github.cloak-preview+json",
                },
                params: {
                  // q: `flaky concurren repo:${repo.full_name}`,
                  q: `flaky concurren repo:${repo.full_name} type:pr is:merged`,
                  per_page: 10,
                  page,
                },
              });

              const items = commitRes.data.items ?? [];

              for (const item of items) {
                send({
                  type: "commit",
                  data: {
                    sha: item.sha,
                    html_url: item.html_url,
                    commit: {
                      message: item.commit?.message ?? "",
                      author: {
                        date: item.commit?.author?.date ?? "",
                        name: item.commit?.author?.name ?? "",
                      },
                    },
                    repository: {
                      full_name: repo.full_name,
                      language: repo.language,
                    },
                  },
                });
                totalFound++;
              }

              hasMore = items.length === 10 && page < 3;
              page++;
              if (hasMore) await sleep(300);
            } catch {
              hasMore = false;
            }
          }

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}