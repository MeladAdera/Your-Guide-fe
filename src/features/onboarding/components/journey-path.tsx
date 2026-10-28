import { cn } from "@/lib/utils";

// Seven points on a gently rising path; the flag after the last one stands for the first goal.
const POINTS: [number, number][] = [[30, 330], [95, 292], [150, 302], [204, 246], [262, 238], [306, 180], [352, 160]];
const D = POINTS.map(([x, y], i) => {
  if (i === 0) return `M ${x} ${y}`;
  const [px, py] = POINTS[i - 1];
  const mx = (px + x) / 2;
  return `C ${mx} ${py} ${mx} ${y} ${x} ${y}`;
}).join(" ");

/**
 * The wizard's progress as a drawn path: saved screens are filled points, the
 * current one is ringed, the rest are faint. Decorative; the step is also
 * written out in text. Mirrored in Arabic, like the journey picture.
 */
export function JourneyPath({ saved, current, className }: { saved: boolean[]; current: number; className?: string }) {
  return (
    <svg viewBox="0 70 400 290" aria-hidden className={cn("w-full text-primary rtl:-scale-x-100", className)}>
      <path d={D} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="14" strokeLinecap="round" />
      {POINTS.map(([x, y], i) =>
        i === current ? (
          <g key={i}>
            <circle cx={x} cy={y} r="20" fill="currentColor" fillOpacity="0.15" />
            <circle cx={x} cy={y} r="10" className="fill-illustration" stroke="currentColor" strokeWidth="4" />
          </g>
        ) : saved[i] ? (
          <circle key={i} cx={x} cy={y} r="9" fill="currentColor" />
        ) : (
          <circle key={i} cx={x} cy={y} r="6" fill="currentColor" fillOpacity="0.3" />
        ),
      )}
      <line x1="380" y1="150" x2="380" y2="86" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M 380 86 L 400 96 L 380 106 Z" fill="currentColor" />
    </svg>
  );
}
