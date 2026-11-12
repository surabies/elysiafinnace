type Props = { data: number[]; className?: string };

const W = 96;
const H = 36;
const PAD = 3;

/** Garis tren mini. Digambar bertahap lewat animasi `draw` (pathLength dinormalisasi ke 1). */
export function Sparkline({ data, className }: Props) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const d = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - PAD - ((value - min) / range) * (H - PAD * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden className={className}>
      <path
        d={d}
        pathLength={1}
        strokeDasharray={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw"
        style={{ animationDelay: "400ms" }}
      />
    </svg>
  );
}
