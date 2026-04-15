// ══════════════════════════════════════════════════════════════════
// INTEGRATION GUIDE — add FlakyConcurrentPanel to your existing app
// ══════════════════════════════════════════════════════════════════


// ── 1. File placement ──────────────────────────────────────────────
//
//   app/api/flaky-concurrent/route.ts   ← new API route (SSE stream)
//   components/FlakyConcurrentPanel.tsx ← new UI panel


// ── 2. Update your TabId type ──────────────────────────────────────
//
// In  types/github.ts  (or wherever TabId lives), add the new id:
//
//   export type TabId = "repos" | "commits" | "flaky-concurrent";


// ── 3. Update TabBar.tsx ───────────────────────────────────────────
//
// Add a third entry to the TABS array:
//
//   const TABS: Tab[] = [
//     { id: "repos",             label: "Repositories",     icon: "⬡" },
//     { id: "commits",           label: "Commits",          icon: "◈" },
//     { id: "flaky-concurrent",  label: "Flaky Concurrent", icon: "⚡" },  // ← ADD
//   ];


// ── 4. Render the panel in your page/layout ────────────────────────
//
// Wherever you already conditionally render ReposPanel / CommitsPanel,
// add the FlakyConcurrentPanel branch:
//
//   import FlakyConcurrentPanel from "@/components/FlakyConcurrentPanel";
//
//   {activeTab === "repos"            && <ReposPanel   ... />}
//   {activeTab === "commits"          && <CommitsPanel ... />}
//   {activeTab === "flaky-concurrent" && <FlakyConcurrentPanel />}   // ← ADD
//
// FlakyConcurrentPanel is self-contained — it manages its own state
// and talks directly to /api/flaky-concurrent, so you don't need to
// pass any props.


// ── 5. How it works ────────────────────────────────────────────────
//
// When the user clicks "Start Scan":
//   a) The panel opens an EventSource (SSE) to /api/flaky-concurrent
//   b) The route fetches the top-JS repos page you chose (30 per page)
//   c) For each repo it calls the GitHub Commit Search API:
//        q = "flaky concurren repo:<owner>/<name>"
//      ("concurren" matches both "concurrent" and "concurrency")
//   d) Every matching commit is streamed back as a { type:"commit" }
//      event and appended to the list in real time
//   e) A { type:"done" } event closes the stream
//
// Config knobs:
//   • "Repo page"   — which block of 30 top JS repos to scan (1=first)
//   • "Repos to scan" — how many repos from that page (1–30)
//
// The Export CSV button downloads all found commits as a CSV file
// with columns: sha, repo, message, date, url


// ── 6. GitHub rate limits ──────────────────────────────────────────
//
// The GitHub Search API allows 30 requests/minute for authenticated
// users.  The route adds 500 ms delays between repos and 300 ms
// between commit pages, keeping you safely under the limit for
// batches of ≤ 10 repos.  If you scan 30 repos, increase the delays
// or scan in smaller batches using the "Repos to scan" field.