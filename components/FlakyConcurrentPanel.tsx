// // components/FlakyConcurrentPanel.tsx
// //
// // Drop this into your existing tab setup.
// // It streams SSE from /api/flaky-concurrent and renders commits live
// // using your existing CommitCard + Feedback components.

// "use client";

// import { useState, useRef, useCallback } from "react";
// import type { CommitItem } from "@/types/github";
// import CommitCard from "./CommitCard";
// import { ErrorBox, EmptyState } from "./Feedback";
// import SkeletonLoader from "./SkeletonLoader";

// // ─── Types for the SSE events ────────────────────────────────────────────────

// type SSEEvent =
//   | { type: "commit"; data: CommitItem }
//   | { type: "progress"; repo: string; page: number }
//   | { type: "done"; total: number }
//   | { type: "error"; message: string };

// // ─── Component ───────────────────────────────────────────────────────────────

// export default function FlakyConcurrentPanel() {
//   const [commits, setCommits] = useState<CommitItem[]>([]);
//   const [currentRepo, setCurrentRepo] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [done, setDone] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [repoPage, setRepoPage] = useState(1);
//   const [maxRepos, setMaxRepos] = useState(10);

//   // Keep a ref to the EventSource so we can close it on stop
//   const esRef = useRef<EventSource | null>(null);

//   const stop = useCallback(() => {
//     esRef.current?.close();
//     esRef.current = null;
//     setLoading(false);
//   }, []);

//   const start = useCallback(() => {
//     // Reset state
//     setCommits([]);
//     setCurrentRepo(null);
//     setDone(false);
//     setError(null);
//     setLoading(true);

//     const url = `/api/flaky-concurrent?repoPage=${repoPage}&maxRepos=${maxRepos}`;
//     const es = new EventSource(url);
//     esRef.current = es;

//     es.onmessage = (e) => {
//       try {
//         const event: SSEEvent = JSON.parse(e.data);

//         if (event.type === "commit") {
//           setCommits((prev) => [...prev, event.data]);
//         } else if (event.type === "progress") {
//           setCurrentRepo(event.repo);
//         } else if (event.type === "done") {
//           setDone(true);
//           setLoading(false);
//           setCurrentRepo(null);
//           es.close();
//         } else if (event.type === "error") {
//           setError(event.message);
//           setLoading(false);
//           setCurrentRepo(null);
//           es.close();
//         }
//       } catch {
//         // ignore parse errors
//       }
//     };

//     es.onerror = () => {
//       // Only treat as error if we haven't finished normally
//       setLoading((prev) => {
//         if (prev) setError("Stream disconnected unexpectedly.");
//         return false;
//       });
//       es.close();
//     };
//   }, [repoPage, maxRepos]);

//   const showResults = commits.length > 0 || done || !!error;

//   return (
//     <div>
//       {/* ── Description ── */}
//       <p className="font-mono text-[0.78rem] text-zinc-500 mb-5 leading-relaxed">
//         Scans top JavaScript repos for commits mentioning{" "}
//         <span className="text-amber-400">flaky</span> +{" "}
//         <span className="text-amber-400">concurrent/concurrency</span> — useful for
//         building training data for flakiness repair models.
//       </p>

//       {/* ── Config row ── */}
//       <div className="flex flex-wrap gap-4 mb-5">
//         <ConfigField
//           label="Repo page (×30 repos)"
//           value={repoPage}
//           min={1}
//           max={10}
//           onChange={setRepoPage}
//           disabled={loading}
//         />
//         <ConfigField
//           label="Repos to scan"
//           value={maxRepos}
//           min={1}
//           max={30}
//           onChange={setMaxRepos}
//           disabled={loading}
//         />
//       </div>

//       {/* ── Action buttons ── */}
//       <div className="flex gap-3 items-center">
//         <button
//           onClick={start}
//           disabled={loading}
//           className="
//             inline-flex items-center gap-2.5 px-5 py-2.5
//             bg-amber-500 hover:bg-amber-400
//             text-[#0e0e10] font-mono font-bold text-[0.72rem] tracking-[0.08em] uppercase
//             rounded-xl border-0 cursor-pointer
//             shadow-[0_0_18px_rgba(245,158,11,0.25)] hover:shadow-[0_0_26px_rgba(245,158,11,0.4)]
//             transition-all duration-200
//             disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
//           "
//         >
//           {loading && <Spinner />}
//           {loading ? "Scanning..." : "Start Scan"}
//         </button>

//         {loading && (
//           <button
//             onClick={stop}
//             className="
//               px-4 py-2.5 rounded-xl border border-red-500/40 bg-transparent
//               font-mono text-[0.68rem] tracking-wider uppercase text-red-400
//               hover:bg-red-500/10 transition-all duration-150 cursor-pointer
//             "
//           >
//             Stop
//           </button>
//         )}
//       </div>

//       {/* ── Live status ticker ── */}
//       {loading && currentRepo && (
//         <div className="mt-4 flex items-center gap-2">
//           <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block shrink-0" />
//           <span className="font-mono text-[0.68rem] text-zinc-500 truncate">
//             Scanning{" "}
//             <span className="text-amber-400">{currentRepo}</span>…
//           </span>
//         </div>
//       )}

//       {/* ── Results ── */}
//       {showResults && (
//         <div className="mt-7 pt-6 border-t border-line">
//           <div className="flex items-center justify-between mb-4">
//             <p className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-zinc-600 m-0">
//               Flaky · Concurrent Commits
//             </p>
//             {commits.length > 0 && (
//               <p className="font-mono text-[0.7rem] text-zinc-500">
//                 <span className="text-amber-400">{commits.length}</span> found
//                 {loading ? " so far…" : ""}
//               </p>
//             )}
//           </div>

//           {/* Loading skeleton only when no results yet */}
//           {loading && commits.length === 0 && <SkeletonLoader count={4} />}

//           {/* Error */}
//           {!loading && error && <ErrorBox message={error} />}

//           {/* Empty */}
//           {done && !error && commits.length === 0 && <EmptyState />}

//           {/* Commit list — renders incrementally as SSE events arrive */}
//           {commits.length > 0 && (
//             <>
//               <div className="flex flex-col gap-2">
//                 {commits.map((commit, i) => (
//                   <CommitCard key={`${commit.sha}-${i}`} item={commit} index={i} />
//                 ))}
//               </div>

//               {/* Export button */}
//               {(done || !loading) && commits.length > 0 && (
//                 <ExportButton commits={commits} />
//               )}
//             </>
//           )}

//           {/* Done badge */}
//           {done && !error && (
//             <div className="mt-5 flex items-center gap-2">
//               <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
//               <span className="font-mono text-[0.68rem] text-zinc-500">
//                 Scan complete —{" "}
//                 <span className="text-amber-400">{commits.length}</span> commits collected.
//               </span>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function ConfigField({
//   label,
//   value,
//   min,
//   max,
//   onChange,
//   disabled,
// }: {
//   label: string;
//   value: number;
//   min: number;
//   max: number;
//   onChange: (v: number) => void;
//   disabled: boolean;
// }) {
//   return (
//     <div className="flex flex-col gap-1">
//       <label className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-zinc-600">
//         {label}
//       </label>
//       <input
//         type="number"
//         value={value}
//         min={min}
//         max={max}
//         disabled={disabled}
//         onChange={(e) => onChange(Math.min(max, Math.max(min, parseInt(e.target.value, 10) || min)))}
//         className="
//           w-24 bg-raised border border-line rounded-lg
//           font-mono text-sm text-zinc-300
//           px-3 py-1.5 outline-none
//           focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10
//           transition-all duration-200
//           disabled:opacity-40
//         "
//       />
//     </div>
//   );
// }

// function Spinner() {
//   return (
//     <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-900 border-t-[#0e0e10] animate-spin shrink-0" />
//   );
// }

// function ExportButton({ commits }: { commits: CommitItem[] }) {
//   const download = () => {
//     const rows = [
//       ["sha", "repo", "message", "date", "url"],
//       ...commits.map((c) => [
//         c.sha,
//         c.repository?.full_name ?? "",
//         (c.commit?.message ?? "").split("\n")[0].replace(/,/g, " "),
//         c.commit?.author?.date ?? "",
//         c.html_url,
//       ]),
//     ];
//     const csv = rows.map((r) => r.join(",")).join("\n");
//     const blob = new Blob([csv], { type: "text/csv" });
//     const a = document.createElement("a");
//     a.href = URL.createObjectURL(blob);
//     a.download = "flaky-concurrent-commits.csv";
//     a.click();
//   };

//   return (
//     <button
//       onClick={download}
//       className="
//         mt-5 px-4 py-2 rounded-xl border border-line bg-transparent
//         font-mono text-[0.65rem] tracking-wider uppercase text-zinc-500
//         hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/5
//         transition-all duration-150 cursor-pointer
//       "
//     >
//       ↓ Export CSV
//     </button>
//   );
// }
// components/FlakyConcurrentPanel.tsx
//
// Drop this into your existing tab setup.
// It streams SSE from /api/flaky-concurrent and renders commits live
// using your existing CommitCard + Feedback components.

"use client";

import { useState, useRef, useCallback } from "react";
import type { CommitItem } from "@/types/github";
import CommitCard from "./CommitCard";
import { ErrorBox, EmptyState } from "./Feedback";
import SkeletonLoader from "./SkeletonLoader";

// ─── Types for the SSE events ────────────────────────────────────────────────

type SSEEvent =
  | { type: "commit"; data: CommitItem }
  | { type: "progress"; repo: string; language: string }
  | { type: "done"; total: number }
  | { type: "error"; message: string };

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlakyConcurrentPanel() {
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoPage, setRepoPage] = useState(1);
  const [maxRepos, setMaxRepos] = useState(10);

  // Keep a ref to the EventSource so we can close it on stop
  const esRef = useRef<EventSource | null>(null);

  const stop = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setLoading(false);
  }, []);

  const start = useCallback(() => {
    // Reset state
    setCommits([]);
    setCurrentRepo(null);
    setDone(false);
    setError(null);
    setLoading(true);

    const url = `/api/flaky-concurrent?repoPage=${repoPage}&maxRepos=${maxRepos}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);

        if (event.type === "commit") {
          setCommits((prev) => [...prev, event.data]);
        } else if (event.type === "progress") {
          setCurrentRepo(event.repo);
          setCurrentLang((event as { type: "progress"; repo: string; language: string }).language);
        } else if (event.type === "done") {
          setDone(true);
          setLoading(false);
          setCurrentRepo(null);
          es.close();
        } else if (event.type === "error") {
          setError(event.message);
          setLoading(false);
          setCurrentRepo(null);
          es.close();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // Only treat as error if we haven't finished normally
      setLoading((prev) => {
        if (prev) setError("Stream disconnected unexpectedly.");
        return false;
      });
      es.close();
    };
  }, [repoPage, maxRepos]);

  const showResults = commits.length > 0 || done || !!error;

  return (
    <div>
      {/* ── Description ── */}
      <p className="font-mono text-[0.78rem] text-zinc-500 mb-5 leading-relaxed">
        Scans top JavaScript &amp; TypeScript repos for commits mentioning{" "}
        <span className="text-amber-400">flaky</span> +{" "}
        <span className="text-amber-400">concurrent/concurrency</span> — useful for
        building training data for flakiness repair models.
      </p>

      {/* ── Config row ── */}
      <div className="flex flex-wrap gap-4 mb-5">
        <ConfigField
          label="Repo page (×30 repos)"
          value={repoPage}
          min={1}
          max={10}
          onChange={setRepoPage}
          disabled={loading}
        />
        <ConfigField
          label="Repos to scan"
          value={maxRepos}
          min={1}
          max={30}
          onChange={setMaxRepos}
          disabled={loading}
        />
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-3 items-center">
        <button
          onClick={start}
          disabled={loading}
          className="
            inline-flex items-center gap-2.5 px-5 py-2.5
            bg-amber-500 hover:bg-amber-400
            text-[#0e0e10] font-mono font-bold text-[0.72rem] tracking-[0.08em] uppercase
            rounded-xl border-0 cursor-pointer
            shadow-[0_0_18px_rgba(245,158,11,0.25)] hover:shadow-[0_0_26px_rgba(245,158,11,0.4)]
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          "
        >
          {loading && <Spinner />}
          {loading ? "Scanning..." : "Start Scan"}
        </button>

        {loading && (
          <button
            onClick={stop}
            className="
              px-4 py-2.5 rounded-xl border border-red-500/40 bg-transparent
              font-mono text-[0.68rem] tracking-wider uppercase text-red-400
              hover:bg-red-500/10 transition-all duration-150 cursor-pointer
            "
          >
            Stop
          </button>
        )}
      </div>

      {/* ── Live status ticker ── */}
      {loading && currentRepo && (
        <div className="mt-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block shrink-0" />
          <span className="font-mono text-[0.68rem] text-zinc-500 truncate">
            Scanning{" "}
            <span className="text-amber-400">{currentRepo}</span>
            {currentLang && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[0.58rem] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {currentLang}
              </span>
            )}
            …
          </span>
        </div>
      )}

      {/* ── Results ── */}
      {showResults && (
        <div className="mt-7 pt-6 border-t border-line">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-zinc-600 m-0">
              Flaky · Concurrent Commits
            </p>
            {commits.length > 0 && (
              <p className="font-mono text-[0.7rem] text-zinc-500">
                <span className="text-amber-400">{commits.length}</span> found
                {loading ? " so far…" : ""}
              </p>
            )}
          </div>

          {/* Loading skeleton only when no results yet */}
          {loading && commits.length === 0 && <SkeletonLoader count={4} />}

          {/* Error */}
          {!loading && error && <ErrorBox message={error} />}

          {/* Empty */}
          {done && !error && commits.length === 0 && <EmptyState />}

          {/* Commit list — renders incrementally as SSE events arrive */}
          {commits.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                {commits.map((commit, i) => (
                  <CommitCard key={`${commit.sha}-${i}`} item={commit} index={i} />
                ))}
              </div>

              {/* Export button */}
              {(done || !loading) && commits.length > 0 && (
                <ExportButton commits={commits} />
              )}
            </>
          )}

          {/* Done badge */}
          {done && !error && (
            <div className="mt-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              <span className="font-mono text-[0.68rem] text-zinc-500">
                Scan complete —{" "}
                <span className="text-amber-400">{commits.length}</span> commits collected.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfigField({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-zinc-600">
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(Math.min(max, Math.max(min, parseInt(e.target.value, 10) || min)))}
        className="
          w-24 bg-raised border border-line rounded-lg
          font-mono text-sm text-zinc-300
          px-3 py-1.5 outline-none
          focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10
          transition-all duration-200
          disabled:opacity-40
        "
      />
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-900 border-t-[#0e0e10] animate-spin shrink-0" />
  );
}

function ExportButton({ commits }: { commits: CommitItem[] }) {
  const download = () => {
    const rows = [
      ["sha", "repo", "message", "date", "url"],
      ...commits.map((c) => [
        c.sha,
        c.repository?.full_name ?? "",
        (c.commit?.message ?? "").split("\n")[0].replace(/,/g, " "),
        c.commit?.author?.date ?? "",
        c.html_url,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flaky-concurrent-commits.csv";
    a.click();
  };

  return (
    <button
      onClick={download}
      className="
        mt-5 px-4 py-2 rounded-xl border border-line bg-transparent
        font-mono text-[0.65rem] tracking-wider uppercase text-zinc-500
        hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/5
        transition-all duration-150 cursor-pointer
      "
    >
      ↓ Export CSV
    </button>
  );
}