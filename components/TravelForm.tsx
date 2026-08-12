"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import AnimalAvatar from "@/components/AnimalAvatar";
import {
  deleteParticipantAction,
  saveParticipantAction,
  type FormState,
} from "@/app/actions";
import {
  ARRIVAL_DATES,
  CITIES,
  FOOD_PREFERENCES,
  GATEWAYS,
  MODES,
  prettyTime,
  RETURN_DATES,
  STATUSES,
  to12Hour,
  to24Hour,
} from "@/lib/event";
import type { Participant } from "@/lib/types";
import { EMPTY_PARTICIPANT } from "@/lib/types";

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

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/**
 * Hour / minute / AM–PM dropdowns rather than a native <input type="time">.
 * That input follows the browser's locale, so a good part of the group got a
 * 24-hour box and read 18:30 back as half past six in the morning. Three
 * explicit dropdowns say AM or PM out loud on every phone and laptop. The
 * value still posts as 24-hour "HH:MM", so sorting and the pickup slots are
 * untouched.
 */
function TimeField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string;
}) {
  const initial = to12Hour(value);
  const [hour, setHour] = useState(initial ? String(initial.hour) : "");
  const [minute, setMinute] = useState(
    initial ? String(initial.minute).padStart(2, "0") : "00",
  );
  const [meridiem, setMeridiem] = useState<string>(initial?.meridiem ?? "");

  // Someone's train gets in at 6:32. Keep an off-the-five minute they already
  // saved as an option instead of silently rounding it on their next edit.
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  // Half-filled is treated as not given — an hour with no AM/PM is exactly the
  // guess we're trying to stop making on someone's behalf.
  const posted =
    hour && meridiem ? to24Hour(Number(hour), Number(minute), meridiem) : "";

  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <input type="hidden" name={name} value={posted} />
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label={`${label} — hour`}
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="field"
        >
          <option value="">Hour</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} — minutes`}
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="field"
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} — AM or PM`}
          value={meridiem}
          onChange={(e) => setMeridiem(e.target.value)}
          className="field"
        >
          <option value="">AM/PM</option>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <p className="mt-1.5 text-xs text-bone-dim">
        {posted
          ? `Saving ${prettyTime(posted)}`
          : hour
            ? "Pick AM or PM to save this time"
            : "Leave it blank if you don't know yet"}
      </p>
    </fieldset>
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
        This removes their travel details, room and vehicle assignment for good.
        There is no undo — only a line in the change log.
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

          <Plain
            name="food"
            label="Food preference"
            options={FOOD_PREFERENCES}
            value={p.food}
          />

        </Section>

        {/* --------------------------------------------------- arrival -- */}
        <Section title="🛬 Getting there" accent="text-leaf">
          <SelectWithOther
            name="arriveDate"
            label="Arrival date"
            value={p.arriveDate}
            options={[...ARRIVAL_DATES]}
          />

          <TimeField
            name="arriveTime"
            label="Arrival time"
            value={p.arriveTime}
          />

          <Plain
            name="arriveGateway"
            label="Landing / arriving at"
            options={GATEWAYS}
            value={p.arriveGateway}
          />

          <Plain
            name="arriveMode"
            label="Mode of travel"
            options={MODES}
            value={p.arriveMode}
          />

          <div className="sm:col-span-2">
            <label className="label" htmlFor="arriveDetails">
              Train / flight details
            </label>
            <input
              id="arriveDetails"
              name="arriveDetails"
              defaultValue={p.arriveDetails}
              placeholder="e.g. 12289 Sewagram Exp, or 6E-234 Mumbai → Nagpur"
              className="field"
            />
          </div>
        </Section>

        {/* ---------------------------------------------------- return -- */}
        <Section title="🛫 Heading back" accent="text-tiger">
          <SelectWithOther
            name="returnDate"
            label="Return date"
            value={p.returnDate}
            options={[...RETURN_DATES]}
          />

          <TimeField
            name="returnTime"
            label="Return time"
            value={p.returnTime}
          />

          <Plain
            name="returnGateway"
            label="Leaving from"
            options={GATEWAYS}
            value={p.returnGateway}
          />

          <Plain
            name="returnMode"
            label="Mode of travel"
            options={MODES}
            value={p.returnMode}
          />

          <div className="sm:col-span-2">
            <label className="label" htmlFor="returnDetails">
              Train / flight details
            </label>
            <input
              id="returnDetails"
              name="returnDetails"
              defaultValue={p.returnDetails}
              placeholder="Leave blank if not booked yet"
              className="field"
            />
          </div>
        </Section>

        {/* ----------------------------------------------------- extras -- */}
        <Section title="🛖 Stay & anything else" accent="text-amber-glow">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="stayPreference">
              Where would you like to stay?
            </label>
            <input
              id="stayPreference"
              name="stayPreference"
              defaultValue={p.stayPreference}
              placeholder="Happy with whatever Mayuri books, or suggest a resort"
              className="field"
            />
            <p className="mt-1.5 text-xs text-bone-dim">
              Leave it blank and Mayuri will assign you a room.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">
              Notes for the organisers
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={p.notes}
              placeholder="Anything at all — reaching late, need a ground-floor room, bringing a cake…"
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
