interface ErrorBoxProps {
  message: string;
}

export function ErrorBox({ message }: ErrorBoxProps) {
  return (
    <div
      className="bg-red-500/[0.07] border border-red-500/25 rounded-xl px-4 py-3.5 font-mono text-sm text-red-300"
      dangerouslySetInnerHTML={{ __html: "⚠ " + message }}
    />
  );
}

export function EmptyState() {
  return (
    <div className="text-center py-16 text-zinc-600">
      <div className="text-4xl mb-3">🔭</div>
      <p className="font-mono text-sm">No results found for this query.</p>
    </div>
  );
}
