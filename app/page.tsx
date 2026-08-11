import Link from "next/link";
import AnimalAvatar from "@/components/AnimalAvatar";
import Countdown from "@/components/Countdown";
import TigerHero from "@/components/TigerHero";
import { isUnlocked } from "@/lib/auth";
import { listParticipants } from "@/lib/db";
import { EVENT, prettyDate, prettyTime } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const unlocked = await isUnlocked();
  const everyone = (await listParticipants()).filter(
    (p) => p.status !== "Cancelled",
  );

  const cities = [...new Set(everyone.map((p) => p.city).filter(Boolean))];

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ---------------------------------------------------------- hero -- */}
      <section className="grid items-center gap-8 pt-14 pb-10 sm:pt-20 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mb-3 font-display text-sm font-semibold tracking-[0.2em] text-leaf uppercase">
            School reunion · {EVENT.year}
          </p>
          <h1 className="font-display text-5xl leading-[1.05] font-extrabold text-bone sm:text-7xl">
            Tadoba
            <span className="block text-tiger">calls us back.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-bone-dim">
            {EVENT.tagline} Two days at {EVENT.venue} —{" "}
            <strong className="text-bone">{EVENT.mainDays}</strong>. Same people,
            same jokes, better wildlife.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Countdown target={EVENT.startsAt} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={unlocked ? "/travel/new" : "/unlock"}
              className="btn-primary"
            >
              Add your travel details →
            </Link>
            {unlocked && (
              <Link href="/travel" className="btn-ghost">
                See everyone&apos;s plans
              </Link>
            )}
          </div>
        </div>

        <TigerHero className="mx-auto w-64 drop-shadow-2xl sm:w-80 lg:w-full lg:max-w-md" />
      </section>

      <div className="stripes h-2 rounded-full opacity-70" />

      {/* --------------------------------------------------------- stats -- */}
      <section className="grid gap-4 py-10 sm:grid-cols-3">
        {[
          { big: String(everyone.length), small: "friends signed up" },
          {
            big: String(
              everyone.filter((p) => p.status === "Confirmed").length,
            ),
            small: "confirmed so far",
          },
          { big: String(cities.length || "—"), small: "cities travelling in" },
        ].map((s) => (
          <div key={s.small} className="card p-5">
            <div className="font-display text-4xl font-bold text-tiger">
              {s.big}
            </div>
            <div className="mt-1 text-sm text-bone-dim">{s.small}</div>
          </div>
        ))}
      </section>

      {/* ------------------------------------------------------ the plan -- */}
      <section className="grid gap-4 pb-10 md:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-leaf">
            🌿 Where we&apos;re going
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-bone-dim">
            {EVENT.venue} in Chandrapur district — India&apos;s tiger country.
            Early morning safaris, long lazy afternoons, and a bonfire that will
            almost certainly turn into an antakshari.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-leaf">
            🚗 How to reach
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-bone-dim">
            Two ways in. <strong className="text-bone">Nagpur</strong> — the
            airport and the big railway junction, roughly 3½ hours by road.{" "}
            <strong className="text-bone">Chandrapur</strong> — closer, about 1½
            hours, good if your train stops there. Tell us which one and we&apos;ll
            group the pickups.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-leaf">
            📋 What we need from you
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-bone-dim">
            Your arrival and return dates, times and mode of travel. That&apos;s
            it. {EVENT.organiser} takes it from there — rooms, vehicles, food
            counts, the lot.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------- who's coming --- */}
      <section className="pb-16">
        <h2 className="font-display text-3xl font-bold text-bone">
          Who&apos;s coming
        </h2>

        {!unlocked ? (
          <div className="card mt-4 p-6">
            <p className="text-bone-dim">
              {everyone.length > 0 ? (
                <>
                  <strong className="text-bone">{everyone.length} friends</strong>{" "}
                  are in so far
                  {cities.length > 0 && <> from {cities.join(", ")}</>}.{" "}
                </>
              ) : (
                <>Nobody has filled in their details yet — be the first. </>
              )}
              Enter the group password to see the full list and add yourself.
            </p>
            <Link href="/unlock" className="btn-primary mt-4">
              Enter the group password
            </Link>
          </div>
        ) : everyone.length === 0 ? (
          <div className="card mt-4 p-6 text-bone-dim">
            Nothing here yet.{" "}
            <Link href="/travel/new" className="text-tiger underline">
              Add the first entry
            </Link>
            .
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {everyone.map((p) => (
              <li key={p.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <AnimalAvatar name={p.name} size={46} />
                    <div>
                      <div className="font-display text-lg font-bold text-bone">
                        {p.name}
                      </div>
                      <div className="text-sm text-bone-dim">
                        {p.city || "City not given"}
                      </div>
                    </div>
                  </div>
                  {p.status === "Tentative" && (
                    <span className="chip !border-amber-glow/40 !text-amber-glow">
                      Maybe
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs text-bone-dim">
                  <div>
                    <span className="text-leaf">In:</span>{" "}
                    {prettyDate(p.arriveDate)} {prettyTime(p.arriveTime)}
                    {p.arriveGateway && ` · ${p.arriveGateway}`}
                  </div>
                  <div>
                    <span className="text-tiger">Out:</span>{" "}
                    {prettyDate(p.returnDate)} {prettyTime(p.returnTime)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
