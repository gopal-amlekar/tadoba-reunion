import { redirect } from "next/navigation";
import CostBoard from "@/components/CostBoard";
import PaymentTable from "@/components/PaymentTable";
import { getRole, getWho } from "@/lib/auth";
import { listCosts, listParticipants } from "@/lib/db";
import { EVENT, formatMoney } from "@/lib/event";
import { ledger, moneySummary } from "@/lib/money";

export const dynamic = "force-dynamic";

/**
 * The money, in the open. Everyone can see what the trip costs, what their own
 * share is and where they stand; only Mayuri can change the rates or say what
 * has come in.
 */
export default async function MoneyPage() {
  const role = await getRole();
  if (!role) redirect("/unlock");
  const canEdit = role === "admin";

  const people = await listParticipants();
  const costs = await listCosts();
  const who = await getWho();

  const summary = moneySummary(people, costs);
  const books = ledger(people, costs);

  const tiles = [
    {
      big: formatMoney(summary.expected),
      small: `the whole trip · ${summary.headcount} ${
        summary.headcount === 1 ? "person" : "people"
      }`,
      tone: "text-bone",
    },
    {
      big: formatMoney(summary.received),
      small: `received so far · ${summary.settled} settled up`,
      tone: "text-leaf",
    },
    {
      big: formatMoney(summary.outstanding),
      small: "still to come in",
      tone: summary.outstanding > 0 ? "text-tiger" : "text-bone-dim",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-bone">Money</h1>
      <p className="mt-1 text-bone-dim">
        What the trip costs, split by what each of us is actually booked on.{" "}
        {canEdit
          ? "Set the totals and mark off what's come in — everyone sees it as you save."
          : `Pay ${EVENT.organiser} and she'll tick you off here.`}
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.small} className="card p-4">
            <div className={`font-display text-3xl font-bold ${t.tone}`}>
              {t.big}
            </div>
            <div className="mt-0.5 text-xs text-bone-dim">{t.small}</div>
          </div>
        ))}
      </section>

      {summary.overpaid > 0 && (
        <p className="mt-3 rounded-xl border border-amber-glow/40 bg-amber-glow/10 px-4 py-2.5 text-sm text-amber-glow">
          {formatMoney(summary.overpaid)} has been paid over and above people&apos;s
          shares — that needs returning, or spending on the bonfire.
        </p>
      )}

      {summary.unallocated > 0 && (
        <p className="mt-3 rounded-xl border border-tiger/40 bg-tiger/10 px-4 py-2.5 text-sm text-tiger">
          {formatMoney(summary.unallocated)} is charged to nobody, so it
          isn&apos;t in anyone&apos;s share and isn&apos;t counted above. Tick
          who splits it in the table below.
        </p>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-leaf">
          💰 What it costs
        </h2>
        <p className="mt-1 mb-4 text-sm text-bone-dim">
          Every line is one whole bill, divided between the people it applies to.
          Because it&apos;s a division, a share moves when the group does — one
          late joiner re-divides everything they&apos;re part of.
        </p>
        <CostBoard costs={costs} people={people} canEdit={canEdit} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-tiger">
          🧾 Who owes what
        </h2>
        <p className="mt-1 mb-4 text-sm text-bone-dim">
          Biggest balance first. Tap a name to see what makes up their share.
        </p>
        <PaymentTable books={books} canEdit={canEdit} you={who} />
      </section>
    </div>
  );
}
