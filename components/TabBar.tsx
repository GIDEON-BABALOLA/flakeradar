import type { TabId } from "@/types/github";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

// const TABS: Tab[] = [
//   { id: "repos",   label: "Repositories", icon: "⬡" },
//   { id: "commits", label: "Commits",      icon: "◈" },
// ];
  const TABS: Tab[] = [
    { id: "repos",             label: "Repositories",     icon: "⬡" },
    { id: "commits",           label: "Commits",          icon: "◈" },
    { id: "flaky-concurrent",  label: "Flaky Concurrent", icon: "⚡" },  // ← ADD
    { id: "flaky-network",  label: "Flaky Network", icon: "⚡" },  // ← ADD
  ];

interface TabBarProps {
  activeTab: TabId;
  onSwitch: (tab: TabId) => void;
}

export default function TabBar({ activeTab, onSwitch }: TabBarProps) {
  return (
    <div className="flex border-b border-line bg-base">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSwitch(tab.id)}
          className={`
            relative flex-1 py-3.5 font-mono text-[0.68rem] tracking-[0.1em] uppercase
            transition-colors duration-200 bg-transparent border-0 cursor-pointer
            ${activeTab === tab.id ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}
          `}
        >
          {tab.icon}&nbsp;&nbsp;{tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-amber-400 rounded-t" />
          )}
        </button>
      ))}
    </div>
  );
}
