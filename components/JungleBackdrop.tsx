/**
 * Decorative jungle layer that sits behind everything: palm fronds in the top
 * corners, a bush silhouette along the bottom, and a wandering trail of paw
 * prints. Pure SVG so there are no image files to ship and nothing to load.
 */

/** A palm frond: a curved stem with leaflets fanning off both sides. */
function Frond({
  leaflets = 11,
  length = 200,
}: {
  leaflets?: number;
  length?: number;
}) {
  const step = length / leaflets;
  return (
    <g>
      <path
        d={`M0 0 Q ${length * 0.35} ${length * 0.25}, ${length} ${length * 0.9}`}
        stroke="currentColor"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      {Array.from({ length: leaflets }, (_, i) => {
        const t = (i + 1) / (leaflets + 1);
        // Point along the quadratic stem, so leaflets sit on the curve.
        const x = 2 * (1 - t) * t * (length * 0.35) + t * t * length;
        const y = 2 * (1 - t) * t * (length * 0.25) + t * t * (length * 0.9);
        const size = (1 - Math.abs(t - 0.45)) * length * 0.34;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse
              cx={-size / 2}
              cy={-size / 5}
              rx={size / 2}
              ry={size / 7}
              fill="currentColor"
              transform={`rotate(${-38 - i * 2})`}
            />
            <ellipse
              cx={size / 2}
              cy={size / 5}
              rx={size / 2.2}
              ry={size / 7.5}
              fill="currentColor"
              transform={`rotate(${34 + i * 2})`}
            />
          </g>
        );
      })}
    </g>
  );
}

/** One paw print — a big pad with four toes above it. */
function Paw({ size = 26, rotate = 0 }: { size?: number; rotate?: number }) {
  return (
    <g transform={`rotate(${rotate}) scale(${size / 100})`}>
      <ellipse cx={50} cy={62} rx={26} ry={22} fill="currentColor" />
      <ellipse cx={22} cy={30} rx={9} ry={12} fill="currentColor" />
      <ellipse cx={42} cy={18} rx={9} ry={12.5} fill="currentColor" />
      <ellipse cx={63} cy={20} rx={9} ry={12.5} fill="currentColor" />
      <ellipse cx={80} cy={36} rx={8.5} ry={11} fill="currentColor" />
    </g>
  );
}

export default function JungleBackdrop() {
  // Hand-placed so the trail wanders rather than marching in a straight line.
  const pawTrail = [
    { x: 6, y: 30, r: -18, s: 22 },
    { x: 13, y: 44, r: 4, s: 20 },
    { x: 9, y: 58, r: -12, s: 18 },
    { x: 17, y: 71, r: 10, s: 16 },
    { x: 88, y: 26, r: 22, s: 20 },
    { x: 93, y: 40, r: 6, s: 17 },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Fronds arching in from the top corners. */}
      <svg
        className="absolute -top-12 -left-16 w-[340px] text-jungle-500 opacity-25 sm:w-[440px]"
        viewBox="-40 -40 300 260"
      >
        <Frond leaflets={12} length={210} />
      </svg>
      <svg
        className="absolute -top-16 -right-20 w-[300px] scale-x-[-1] text-jungle-600 opacity-20 sm:w-[400px]"
        viewBox="-40 -40 300 260"
      >
        <Frond leaflets={10} length={190} />
      </svg>

      {/* A single frond drooping into the middle-right, for depth. */}
      <svg
        className="absolute top-[38%] -right-24 hidden w-[260px] rotate-[135deg] text-jungle-700 opacity-25 lg:block"
        viewBox="-40 -40 300 260"
      >
        <Frond leaflets={9} length={170} />
      </svg>

      {/* Paw trail. */}
      <svg className="absolute inset-0 h-full w-full text-leaf opacity-[0.07]">
        {pawTrail.map((p, i) => (
          <g key={i} transform={`translate(${p.x}% ${p.y}%)`}>
            <Paw size={p.s} rotate={p.r} />
          </g>
        ))}
      </svg>

      {/* Undergrowth along the bottom edge — three layers for parallax depth. */}
      <svg
        className="absolute right-0 bottom-0 left-0 h-40 w-full sm:h-56"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <path
          className="text-jungle-800 opacity-60"
          fill="currentColor"
          d="M0 200 V120 q60-46 120-6 t120-10 120 22 120-34 120 14 120-26 120 30 120-18 120 26 120-14 120 22 V200 Z"
        />
        <path
          className="text-jungle-850 opacity-80"
          fill="currentColor"
          d="M0 200 V150 q80-38 160 4 t160-14 160 26 160-30 160 18 160-22 160 26 160-10 V200 Z"
        />
        <path
          className="text-jungle-900"
          fill="currentColor"
          d="M0 200 V176 q100-26 200 6 t200-10 200 18 200-22 200 14 200-16 200 20 V200 Z"
        />
      </svg>
    </div>
  );
}
