import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-8 w-auto', className)}
      viewBox="0 0 180 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DueliaX Logo"
    >
      <text
        x="0"
        y="30"
        fontFamily="var(--font-space-grotesk), sans-serif"
        fontSize="32"
        fontWeight="bold"
        fill="hsl(var(--primary))"
      >
        Duelia
      </text>
      <text
        x="115"
        y="30"
        fontFamily="var(--font-space-grotesk), sans-serif"
        fontSize="32"
        fontWeight="bold"
        fill="hsl(var(--accent))"
      >
        X
      </text>
    </svg>
  );
}
