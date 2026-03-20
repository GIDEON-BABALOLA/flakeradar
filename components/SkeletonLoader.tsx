interface SkeletonLoaderProps {
  count?: number;
}

export default function SkeletonLoader({ count = 6 }: SkeletonLoaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} index={i} />
      ))}
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="h-[60px] rounded-xl animate-shimmer"
      style={{
        background: "linear-gradient(90deg, #1e1e24 25%, #2a2a34 50%, #1e1e24 75%)",
        backgroundSize: "200% 100%",
        animationDelay: `${index * 0.06}s`,
      }}
    />
  );
}
