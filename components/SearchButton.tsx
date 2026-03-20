import type { ReactNode } from "react";

interface SearchButtonProps {
  loading: boolean;
  onClick: () => void;
  children: ReactNode;
}

export default function SearchButton({ loading, onClick, children }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
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
      {loading ? "Fetching…" : children}
    </button>
  );
}

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-900 border-t-[#0e0e10] animate-spin shrink-0" />
  );
}
