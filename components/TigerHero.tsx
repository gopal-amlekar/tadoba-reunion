/**
 * The big tiger peering out of the foliage next to the hero headline.
 * Drawn rather than photographed, so it matches the palette exactly and costs
 * nothing to load.
 */
export default function TigerHero({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 260"
      className={className}
      role="img"
      aria-label="A cartoon tiger peering through jungle leaves"
    >
      <defs>
        <radialGradient id="tiger-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={130} cy={124} r={122} fill="url(#tiger-glow)" />

      {/* Leaves behind the head, so it reads as peering out of cover. */}
      <g fill="#1b4a36">
        <ellipse cx={34} cy={92} rx={40} ry={15} transform="rotate(-32 34 92)" />
        <ellipse cx={44} cy={130} rx={46} ry={16} transform="rotate(-8 44 130)" />
        <ellipse cx={226} cy={96} rx={40} ry={15} transform="rotate(30 226 96)" />
        <ellipse cx={218} cy={136} rx={44} ry={15} transform="rotate(6 218 136)" />
      </g>
      <g fill="#256b4c">
        <ellipse cx={52} cy={112} rx={38} ry={13} transform="rotate(-20 52 112)" />
        <ellipse cx={210} cy={118} rx={36} ry={12} transform="rotate(18 210 118)" />
      </g>

      {/* Ears */}
      <circle cx={68} cy={62} r={30} fill="#f59e0b" />
      <circle cx={192} cy={62} r={30} fill="#f59e0b" />
      <circle cx={68} cy={62} r={15} fill="#7c2d12" />
      <circle cx={192} cy={62} r={15} fill="#7c2d12" />

      {/* Head */}
      <circle cx={130} cy={132} r={82} fill="#f59e0b" />

      {/* Cheek ruffs */}
      <ellipse cx={62} cy={150} rx={22} ry={30} fill="#fbbf24" transform="rotate(-14 62 150)" />
      <ellipse cx={198} cy={150} rx={22} ry={30} fill="#fbbf24" transform="rotate(14 198 150)" />

      {/* Forehead and cheek stripes */}
      <g stroke="#7c2d12" strokeLinecap="round" fill="none">
        <path d="M104 72 l10 26" strokeWidth={9} />
        <path d="M130 64 l0 30" strokeWidth={9} />
        <path d="M156 72 l-10 26" strokeWidth={9} />
        <path d="M52 122 l26 8" strokeWidth={8} />
        <path d="M48 146 l26 3" strokeWidth={8} />
        <path d="M54 168 l24 -4" strokeWidth={7} />
        <path d="M208 122 l-26 8" strokeWidth={8} />
        <path d="M212 146 l-26 3" strokeWidth={8} />
        <path d="M206 168 l-24 -4" strokeWidth={7} />
      </g>

      {/* Muzzle */}
      <ellipse cx={130} cy={166} rx={46} ry={33} fill="#fef3c7" />
      <path d="M114 152 h32 l-16 16 Z" fill="#7c2d12" />
      <path
        d="M130 168 v12 M130 180 q-13 11 -24 1 M130 180 q13 11 24 1"
        stroke="#7c2d12" strokeWidth={5} fill="none" strokeLinecap="round"
      />

      {/* Whiskers */}
      <g stroke="#fef3c7" strokeWidth={2.5} strokeLinecap="round" opacity={0.85}>
        <path d="M88 162 l-36 -8 M88 170 l-38 4 M172 162 l36 -8 M172 170 l38 4" />
      </g>

      {/* Eyes */}
      <circle cx={100} cy={124} r={15} fill="#fef3c7" />
      <circle cx={160} cy={124} r={15} fill="#fef3c7" />
      <circle cx={100} cy={124} r={9} fill="#0a1e18" />
      <circle cx={160} cy={124} r={9} fill="#0a1e18" />
      <circle cx={104} cy={120} r={3.5} fill="#fff" />
      <circle cx={164} cy={120} r={3.5} fill="#fff" />

      {/* A frond hanging in front, bottom-left, for depth. */}
      <g fill="#123528" opacity={0.95}>
        <ellipse cx={40} cy={216} rx={48} ry={16} transform="rotate(-14 40 216)" />
        <ellipse cx={78} cy={238} rx={44} ry={14} transform="rotate(8 78 238)" />
      </g>
    </svg>
  );
}
