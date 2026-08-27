"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-[var(--radius-default)] border border-border-default bg-bg-card p-8"
      >
        <h1 className="text-[28px] font-bold leading-tight">KERNA</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in to the ops dashboard</p>

        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-[var(--radius-default)] border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-[var(--radius-default)] border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>

        {state.error && (
          <p className="mt-4 text-sm text-error" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-10 w-full rounded-[var(--radius-default)] bg-accent-primary text-sm font-medium text-bg-main transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
