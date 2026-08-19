interface PricePoint {
  date: string;
  price_per_mg: number;
}

interface PriceSparklineProps {
  data: PricePoint[];
  width?: number;
  height?: number;
}

export function PriceSparkline({
  data,
  width = 120,
  height = 32,
}: PriceSparklineProps) {
  if (!data || data.length < 2) {
    return null;
  }

  const values = data.map((d) => d.price_per_mg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 2;
  const viewW = width - padding * 2;
  const viewH = height - padding * 2;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * viewW;
      const y = padding + viewH - ((d.price_per_mg - min) / range) * viewH;
      return `${x},${y}`;
    })
    .join(" ");

  const first = values[0];
  const last = values[values.length - 1];
  const strokeColor =
    last < first
      ? "var(--color-success, #34d399)"
      : last > first
        ? "var(--color-danger, #f87171)"
        : "var(--color-muted, #94a3b8)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Price history sparkline"
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
