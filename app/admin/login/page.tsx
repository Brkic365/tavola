import Link from "next/link";
import { login } from "@/app/admin/actions";

export const metadata = { title: "Admin sign in · Tavola" };

type Search = { searchParams: Promise<{ error?: string; next?: string }> };

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export default async function LoginPage({ searchParams }: Search) {
  const { error, next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Tavola admin
        </h1>
        <p className="mt-1 text-sm text-stone-500">Sign in to manage menus.</p>

        <form action={login} className="mt-5 space-y-3">
          <input type="hidden" name="next" value={next ?? "/admin"} />
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              className={inputCls}
              placeholder="you@restaurant.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputCls}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error === "rate"
                ? "Too many attempts. Please wait a few minutes and try again."
                : "Incorrect email or password."}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-sm text-stone-500">
          New here?{" "}
          <Link href="/admin/signup" className="font-medium text-teal-700 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-xs text-stone-400">
          Demo login: <code className="rounded bg-stone-100 px-1">demo@tavola.app</code>{" "}
          / <code className="rounded bg-stone-100 px-1">tavola</code>
        </p>
      </div>
    </main>
  );
}
