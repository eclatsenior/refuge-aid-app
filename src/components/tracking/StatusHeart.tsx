/**
 * A heart icon with 3 concentric colored rings representing
 * stable (mint/green), anxious (coral/yellow), alert (emergency/red).
 * Inspired by Samsung Health activity rings.
 *
 * Each ring's fill percentage is driven by a 0-1 value prop.
 */

interface StatusHeartProps {
  /** Fill percentages 0–1 for each ring */
  stable?: number;
  anxious?: number;
  alert?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

// Heart-shaped path as a clip-path definition
// We draw concentric ring arcs clipped to a heart silhouette.

export function StatusHeart({
  stable = 0,
  anxious = 0,
  alert = 0,
  size = 120,
  strokeWidth = 10,
  className = "",
}: StatusHeartProps) {
  const cx = 60;
  const cy = 60;

  // Three rings – outer = stable (green/mint), middle = anxious (yellow), inner = alert (red)
  const rings = [
    { radius: 38, width: strokeWidth, fill: stable, color: "hsl(var(--mint))", bg: "hsl(var(--mint) / 0.15)" },
    { radius: 26, width: strokeWidth, fill: anxious, color: "hsl(var(--coral))", bg: "hsl(var(--coral) / 0.15)" },
    { radius: 14, width: strokeWidth, fill: alert, color: "hsl(var(--emergency))", bg: "hsl(var(--emergency) / 0.15)" },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Heart clip path */}
        <clipPath id="heart-clip">
          <path d="M60 108 C25 80, 2 55, 10 35 C16 18, 35 12, 48 20 C54 24, 58 30, 60 34 C62 30, 66 24, 72 20 C85 12, 104 18, 110 35 C118 55, 95 80, 60 108Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#heart-clip)">
        {rings.map(({ radius, width, fill, color, bg }, i) => {
          const circumference = 2 * Math.PI * radius;
          const filled = circumference * Math.min(Math.max(fill, 0), 1);

          return (
            <g key={i}>
              {/* Background ring */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={bg}
                strokeWidth={width}
              />
              {/* Filled ring */}
              {filled > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={width}
                  strokeDasharray={`${filled} ${circumference - filled}`}
                  strokeDashoffset={circumference * 0.25}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** Small heart icon for individual history items showing a single status */
export function StatusHeartSmall({
  status,
  size = 40,
  className = "",
}: {
  status: "ok" | "anxious" | "alert";
  size?: number;
  className?: string;
}) {
  const colorMap: Record<string, string> = {
    ok: "hsl(var(--mint))",
    anxious: "hsl(var(--coral))",
    alert: "hsl(var(--emergency))",
  };

  const color = colorMap[status] || colorMap.ok;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`heart-grad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d="M20 36 C8.3 26.7, 0.7 18.3, 3.3 11.7 C5.3 6, 11.7 4, 16 6.7 C18 8, 19.3 10, 20 11.3 C20.7 10, 22 8, 24 6.7 C28.3 4, 34.7 6, 36.7 11.7 C39.3 18.3, 31.7 26.7, 20 36Z"
        fill={`url(#heart-grad-${status})`}
      />
    </svg>
  );
}
