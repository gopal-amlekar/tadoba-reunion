"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import AnimalAvatar from "@/components/AnimalAvatar";
import {
  deleteParticipantAction,
  saveParticipantAction,
  type FormState,
} from "@/app/actions";
import { ARRIVAL_DATES, CITIES, RETURN_DATES, STATUSES } from "@/lib/event";
import type { Participant } from "@/lib/types";
import { EMPTY_PARTICIPANT } from "@/lib/types";

/**
 * Name, when you arrive, when you leave, and somewhere to write the rest.
 *
 * This used to ask for time, gateway and mode as separate dropdowns in each
 * direction — ten fields, most of them demanding precision months before anyone
 * had booked a ticket, and "Not decided yet" was the honest answer to half of
 * them. One free-text note per direction holds the same information without
 * making a half-known plan feel like a form error.
 */

const initial: FormState = {};

type Option = { value: string; label: string };

/**
 * A dropdown that can always fall back to free text — travel plans never fit
 * neatly into a fixed list, and forcing them to is how you lose information.
 */
function SelectWithOther({
  name,
  label,
  options,
  value,
  hint,
}: {
  name: string;
  label: string;
  options: readonly Option[];
  value: string;
  hint?: string;
}) {
  const known = options.some((o) => o.value === value);
  const [picked, setPicked] = useState(value && !known ? "__other" : value);

  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={picked}
        onChange={(e) => setPicked(e.target.value)}
        className="field"
      >
        <option value="">— choose —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        <option value="__other">Something else…</option>
      </select>
      {picked === "__other" && (
        <input
          name={`${name}Other`}
          defaultValue={known ? "" : value}
          placeholder="Type it in"
          className="field mt-2"
        />
      )}
      {hint && <p className="mt-1.5 text-xs text-bone-dim">{hint}</p>}
    </div>
  );
}

function Plain({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: readonly string[];
  value: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={value} className="field">
        <option value="">— choose —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Deleting is destructive and there's no undo, so it takes two deliberate
 * steps: reveal the panel, then type the person's name. Everyone shares one
 * password, which makes an accidental tap on a phone genuinely likely.
 */
function DeleteEntry({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === name.trim().toLowerCase();

  if (!open) {
    return (
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-bone-dim underline transition hover:text-tiger"
        >
          Remove {name || "this person"} from the list
        </button>
        <p className="mt-1 text-xs text-bone-dim">
          Backing out but might still come? Set “How sure are you?” to Cancelled
          instead — that keeps the record.
        </p>
      </div>
    );
  }

  return (
    <form
      action={deleteParticipantAction}
      className="rounded-2xl border border-tiger/50 bg-tiger/5 p-5"
    >
      <input type="hidden" name="id" value={id} />
      <h3 className="font-display text-lg font-bold text-tiger-light">
        Delete {name}&apos;s entry?
      </h3>
      <p className="mt-1 text-sm text-bone-dim">
        This removes their travel details and anything recorded against their
        share of the costs. There is no undo — only a line in the change log.
      </p>

      <label className="label mt-4" htmlFor={`confirm-${id}`}>
        Type <span className="text-bone">{name}</span> to confirm
      </label>
      <input
        id={`confirm-${id}`}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        placeholder={name}
        className="field"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!matches}
          className="btn-primary !bg-tiger disabled:cursor-not-allowed"
        >
          Delete permanently
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="btn-ghost"
        >
          Keep them
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className={`font-display text-xl font-bold ${accent}`}>{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function TravelForm({
  participant,
  who,
}: {
  participant?: Participant;
  who: string;
}) {
  const p = participant ?? { ...EMPTY_PARTICIPANT, id: "" };
  const editing = Boolean(participant);
  const [state, action, pending] = useActionState(saveParticipantAction, initial);
  // Tracked in state purely so the avatar updates live as you type.
  const [name, setName] = useState(p.name);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={p.id ?? ""} />
        <input type="hidden" name="who" value={who} />

        {/* ------------------------------------------------ the person -- */}
        <Section title="🙋 Who is coming" accent="text-leaf">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Full name *
            </label>
            <div className="flex items-center gap-3">
              <AnimalAvatar name={name} size={52} />
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name (or your friend's)"
                className="field"
              />
            </div>
            <p className="mt-1.5 text-xs text-bone-dim">
              Everyone gets a jungle animal, picked from their name. No idea why
              you got the one you got.
            </p>
          </div>

          <SelectWithOther
            name="city"
            label="Travelling from"
            value={p.city}
            options={CITIES.map((c) => ({ value: c, label: c }))}
          />

          <div>
            <label className="label" htmlFor="phone">
              Phone / WhatsApp
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={p.phone}
              placeholder="For pickup coordination"
              className="field"
            />
          </div>
        </Section>

        {/* --------------------------------------------------- arrival -- */}
        <Section title="🛬 When you arrive" accent="text-leaf">
          <SelectWithOther
            name="arriveDate"
            label="Arrival date"
            value={p.arriveDate}
            options={[...ARRIVAL_DATES]}
          />

          <div className="sm:col-span-2">
            <label className="label" htmlFor="arriveDetails">
              Arrival notes
            </label>
            <textarea
              id="arriveDetails"
              name="arriveDetails"
              rows={2}
              defaultValue={p.arriveDetails}
              placeholder="Reaching Nagpur around 2:30pm on 6E-234 from Pune — will need a pickup"
              className="field"
            />
            <p className="mt-1.5 text-xs text-bone-dim">
              Time, where you land, how you&apos;re travelling, train or flight
              number — whatever you know. Rough is fine; leave it empty if
              nothing is booked yet.
            </p>
          </div>
        </Section>

        {/* ---------------------------------------------------- return -- */}
        <Section title="🛫 When you leave" accent="text-tiger">
          <SelectWithOther
            name="returnDate"
            label="Departure date"
            value={p.returnDate}
            options={[...RETURN_DATES]}
          />

          <div className="sm:col-span-2">
            <label className="label" htmlFor="returnDetails">
              Departure notes
            </label>
            <textarea
              id="returnDetails"
              name="returnDetails"
              rows={2}
              defaultValue={p.returnDetails}
              placeholder="Evening train out of Chandrapur, need to leave the resort by 4pm"
              className="field"
            />
          </div>
        </Section>

        {/* ----------------------------------------------------- extras -- */}
        <Section title="📝 Anything else" accent="text-amber-glow">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">
              Notes for the organisers
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={p.notes}
              placeholder="Anything at all — where you'd like to stay, need a ground-floor room, bringing a cake…"
              className="field"
            />
          </div>

          <Plain
            name="status"
            label="How sure are you?"
            options={STATUSES}
            value={p.status || "Confirmed"}
          />
        </Section>

        {state.error && (
          <p className="rounded-lg border border-tiger/50 bg-tiger/10 px-3 py-2 text-sm text-tiger-light">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Saving…" : editing ? "Save changes" : "Add to the list 🐾"}
          </button>
          <Link href="/travel" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>

      {/* Kept outside the main form — nested forms are invalid HTML. */}
      {editing && <DeleteEntry id={p.id} name={p.name} />}
    </div>
  );
}
