"use client";

import { useActionState } from "react";
import { unlockAction, type FormState } from "@/app/actions";

const initial: FormState = {};

export default function UnlockForm({ defaultWho }: { defaultWho: string }) {
  const [state, action, pending] = useActionState(unlockAction, initial);

  return (
    <form action={action} className="card mt-6 space-y-4 p-6">
      <div>
        <label className="label" htmlFor="who">
          Your name
        </label>
        <input
          id="who"
          name="who"
          defaultValue={defaultWho}
          required
          autoComplete="name"
          placeholder="e.g. Mayuri"
          className="field"
        />
        <p className="mt-1.5 text-xs text-bone-dim">
          So we know who filled in what. You can still add or edit details for a
          friend who isn&apos;t online.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="password">
          Group password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Shared on the WhatsApp group"
          className="field"
        />
      </div>

      {state.error && (
        <p className="rounded-lg border border-tiger/50 bg-tiger/10 px-3 py-2 text-sm text-tiger-light">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Opening the gate…" : "Let me in 🐾"}
      </button>
    </form>
  );
}
