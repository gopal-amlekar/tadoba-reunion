/**
 * The site's mark, matching app/icon.svg exactly so the header and the browser
 * tab read as the same thing. Drawn rather than an emoji, which renders
 * differently on every platform.
 */
export default function TigerMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="17" cy="19" r="9.5" fill="#f59e0b" />
      <circle cx="47" cy="19" r="9.5" fill="#f59e0b" />
      <circle cx="17" cy="19" r="4.5" fill="#7c2d12" />
      <circle cx="47" cy="19" r="4.5" fill="#7c2d12" />
      <circle cx="32" cy="35" r="20" fill="#f59e0b" />
      <g stroke="#7c2d12" strokeWidth={3.4} strokeLinecap="round">
        <path d="M24 19 L26 27" />
        <path d="M32 17 L32 26" />
        <path d="M40 19 L38 27" />
      </g>
      <g stroke="#7c2d12" strokeWidth={3} strokeLinecap="round">
        <path d="M13 33 L20 35" />
        <path d="M51 33 L44 35" />
      </g>
      <ellipse cx="32" cy="43" rx={12} ry={8.5} fill="#fef3c7" />
      <path d="M28 39 h8 l-4 4.5 Z" fill="#7c2d12" />
      <path d="M32 43.5 v3" stroke="#7c2d12" strokeWidth={2} strokeLinecap="round" />
      <circle cx="24" cy="33" r="3.6" fill="#0a1e18" />
      <circle cx="40" cy="33" r="3.6" fill="#0a1e18" />
      <circle cx="25.2" cy="31.8" r="1.3" fill="#ffffff" />
      <circle cx="41.2" cy="31.8" r="1.3" fill="#ffffff" />
    </svg>
  );
}
