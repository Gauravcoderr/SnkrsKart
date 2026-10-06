export function Spinner({ className = 'w-6 h-6' }: { className?: string }) {
  return <div className={`${className} border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin`} aria-label="Loading" role="status" />;
}

export default function AdminLoader({ className = 'h-64', size = 'w-6 h-6' }: { className?: string; size?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Spinner className={size} />
    </div>
  );
}
