/**
 * Everyone gets a jungle animal for a face. Which one is derived from their
 * name, so it's stable across reloads and nobody has to upload a photo — and
 * it's a lot funnier than initials in a circle.
 */

const ANIMALS = [
  "tiger",
  "monkey",
  "deer",
  "owl",
  "elephant",
  "bear",
  "fox",
  "peacock",
] as const;

type Animal = (typeof ANIMALS)[number];

const PALETTE: Record<Animal, { fur: string; dark: string; light: string; bg: string }> = {
  tiger:    { fur: "#f59e0b", dark: "#7c2d12", light: "#fef3c7", bg: "#3b2508" },
  monkey:   { fur: "#a16207", dark: "#451a03", light: "#fde68a", bg: "#3a2a0a" },
  deer:     { fur: "#d97706", dark: "#78350f", light: "#fed7aa", bg: "#3a2408" },
  owl:      { fur: "#92400e", dark: "#451a03", light: "#fef3c7", bg: "#33200a" },
  elephant: { fur: "#94a3b8", dark: "#334155", light: "#e2e8f0", bg: "#1e293b" },
  bear:     { fur: "#78350f", dark: "#2c1608", light: "#e7d5b8", bg: "#2b1a0b" },
  fox:      { fur: "#ea580c", dark: "#7c2d12", light: "#fff7ed", bg: "#3b1d09" },
  peacock:  { fur: "#0d9488", dark: "#134e4a", light: "#ccfbf1", bg: "#0d2b28" },
};

/** Stable, case-insensitive hash so "Amit" and "amit" get the same animal. */
function pick(name: string): Animal {
  let h = 0;
  for (const ch of name.trim().toLowerCase()) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return ANIMALS[h % ANIMALS.length];
}

function Eyes({ dark, y = 52 }: { dark: string; y?: number }) {
  return (
    <>
      <circle cx={39} cy={y} r={5} fill={dark} />
      <circle cx={61} cy={y} r={5} fill={dark} />
      <circle cx={40.8} cy={y - 1.8} r={1.7} fill="#fff" />
      <circle cx={62.8} cy={y - 1.8} r={1.7} fill="#fff" />
    </>
  );
}

export default function AnimalAvatar({
  name,
  size = 44,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const animal = pick(name || "friend");
  const c = PALETTE[animal];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={`${name || "A friend"} as a cartoon ${animal}`}
    >
      <circle cx={50} cy={50} r={50} fill={c.bg} />

      {animal === "tiger" && (
        <>
          <circle cx={26} cy={26} r={11} fill={c.fur} />
          <circle cx={74} cy={26} r={11} fill={c.fur} />
          <circle cx={26} cy={26} r={5} fill={c.dark} />
          <circle cx={74} cy={26} r={5} fill={c.dark} />
          <circle cx={50} cy={54} r={31} fill={c.fur} />
          <path d="M38 30 l4 9 M50 27 l0 10 M62 30 l-4 9" stroke={c.dark} strokeWidth={3.4} strokeLinecap="round" />
          <path d="M17 50 l10 3 M17 60 l10 1 M83 50 l-10 3 M83 60 l-10 1" stroke={c.dark} strokeWidth={3.2} strokeLinecap="round" />
          <ellipse cx={50} cy={66} rx={17} ry={12} fill={c.light} />
          <path d="M44 62 h12 l-6 6 Z" fill={c.dark} />
          <path d="M50 68 v5 M50 73 q-5 4 -9 0 M50 73 q5 4 9 0" stroke={c.dark} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Eyes dark={c.dark} />
        </>
      )}

      {animal === "monkey" && (
        <>
          <circle cx={19} cy={52} r={13} fill={c.fur} />
          <circle cx={81} cy={52} r={13} fill={c.fur} />
          <circle cx={19} cy={52} r={7} fill={c.light} />
          <circle cx={81} cy={52} r={7} fill={c.light} />
          <circle cx={50} cy={52} r={30} fill={c.fur} />
          <ellipse cx={50} cy={60} rx={22} ry={21} fill={c.light} />
          <ellipse cx={44} cy={64} rx={2.6} ry={3.4} fill={c.dark} />
          <ellipse cx={56} cy={64} rx={2.6} ry={3.4} fill={c.dark} />
          <path d="M40 72 q10 8 20 0" stroke={c.dark} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Eyes dark={c.dark} y={50} />
        </>
      )}

      {animal === "deer" && (
        <>
          <path
            d="M34 24 l-4 -14 M30 10 l-7 -4 M30 10 l1 -8 M66 24 l4 -14 M70 10 l7 -4 M70 10 l-1 -8"
            stroke={c.dark} strokeWidth={3.4} fill="none" strokeLinecap="round"
          />
          <ellipse cx={20} cy={44} rx={9} ry={14} fill={c.fur} transform="rotate(-24 20 44)" />
          <ellipse cx={80} cy={44} rx={9} ry={14} fill={c.fur} transform="rotate(24 80 44)" />
          <circle cx={50} cy={54} r={29} fill={c.fur} />
          <ellipse cx={50} cy={67} rx={15} ry={11} fill={c.light} />
          <ellipse cx={50} cy={63} rx={5.5} ry={4} fill={c.dark} />
          <circle cx={34} cy={40} r={2.4} fill={c.light} opacity={0.7} />
          <circle cx={44} cy={34} r={2} fill={c.light} opacity={0.7} />
          <circle cx={64} cy={37} r={2.2} fill={c.light} opacity={0.7} />
          <Eyes dark={c.dark} />
        </>
      )}

      {animal === "owl" && (
        <>
          <path d="M28 26 l6 12 M72 26 l-6 12" stroke={c.fur} strokeWidth={9} strokeLinecap="round" />
          <circle cx={50} cy={54} r={31} fill={c.fur} />
          <circle cx={37} cy={50} r={14} fill={c.light} />
          <circle cx={63} cy={50} r={14} fill={c.light} />
          <circle cx={37} cy={50} r={7} fill={c.dark} />
          <circle cx={63} cy={50} r={7} fill={c.dark} />
          <circle cx={39} cy={47.5} r={2.4} fill="#fff" />
          <circle cx={65} cy={47.5} r={2.4} fill="#fff" />
          <path d="M50 60 l-6 6 l6 7 l6 -7 Z" fill="#f59e0b" />
          <path d="M32 74 q18 10 36 0" stroke={c.dark} strokeWidth={2.4} fill="none" opacity={0.5} />
        </>
      )}

      {animal === "elephant" && (
        <>
          <ellipse cx={17} cy={52} rx={16} ry={22} fill={c.fur} />
          <ellipse cx={83} cy={52} rx={16} ry={22} fill={c.fur} />
          <ellipse cx={18} cy={52} rx={10} ry={15} fill={c.dark} opacity={0.35} />
          <ellipse cx={82} cy={52} rx={10} ry={15} fill={c.dark} opacity={0.35} />
          <circle cx={50} cy={50} r={28} fill={c.fur} />
          <path
            d="M50 62 q0 16 7 22 q6 5 11 -1"
            stroke={c.fur} strokeWidth={11} fill="none" strokeLinecap="round"
          />
          <path d="M40 74 q-4 8 -1 12 M60 74 q4 8 1 12" stroke={c.light} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Eyes dark={c.dark} y={48} />
        </>
      )}

      {animal === "bear" && (
        <>
          <circle cx={24} cy={24} r={13} fill={c.fur} />
          <circle cx={76} cy={24} r={13} fill={c.fur} />
          <circle cx={24} cy={24} r={6.5} fill={c.light} opacity={0.5} />
          <circle cx={76} cy={24} r={6.5} fill={c.light} opacity={0.5} />
          <circle cx={50} cy={54} r={31} fill={c.fur} />
          <ellipse cx={50} cy={68} rx={18} ry={13} fill={c.light} />
          <ellipse cx={50} cy={62} rx={6} ry={4.5} fill={c.dark} />
          <path d="M50 67 v4 M50 71 q-5 4 -9 1 M50 71 q5 4 9 1" stroke={c.dark} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Eyes dark={c.dark} y={50} />
        </>
      )}

      {animal === "fox" && (
        <>
          <path d="M20 40 L24 12 L44 30 Z" fill={c.fur} />
          <path d="M80 40 L76 12 L56 30 Z" fill={c.fur} />
          <path d="M24 34 L26 19 L38 30 Z" fill={c.dark} />
          <path d="M76 34 L74 19 L62 30 Z" fill={c.dark} />
          <circle cx={50} cy={54} r={29} fill={c.fur} />
          <path d="M50 44 q-22 6 -18 22 q7 12 18 13 q11 -1 18 -13 q4 -16 -18 -22 Z" fill={c.light} />
          <ellipse cx={50} cy={72} rx={5} ry={3.8} fill={c.dark} />
          <Eyes dark={c.dark} y={50} />
        </>
      )}

      {animal === "peacock" && (
        <>
          <path d="M50 22 v-10 M38 26 l-5 -9 M62 26 l5 -9" stroke={c.fur} strokeWidth={2.6} strokeLinecap="round" />
          <circle cx={50} cy={10} r={4.5} fill="#3b82f6" />
          <circle cx={32} cy={15} r={4} fill="#22d3ee" />
          <circle cx={68} cy={15} r={4} fill="#22d3ee" />
          <circle cx={50} cy={54} r={30} fill={c.fur} />
          <ellipse cx={50} cy={62} rx={19} ry={17} fill={c.light} opacity={0.25} />
          <path d="M50 60 l-7 5 l7 5 l7 -5 Z" fill="#f59e0b" />
          <Eyes dark={c.dark} y={50} />
        </>
      )}
    </svg>
  );
}
