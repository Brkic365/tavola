import Link from "next/link";
import { signup } from "@/app/admin/actions";

export const metadata = { title: "Create account · Tavola" };

type Search = { searchParams: Promise<{ error?: string }> };

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export default async function SignupPage({ searchParams }: Search) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Set up Tavola for your restaurant.
        </p>

        <form action={signup} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Name</span>
            <input name="name" autoComplete="name" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputCls}
              placeholder="you@restaurant.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Password (min 6 chars)
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputCls}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error === "exists"
                ? "An account with that email already exists."
                : "Please enter a valid email and a password of at least 6 characters."}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Create account
          </button>
        </form>

        <p className="mt-4 text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/admin/login" className="font-medium text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
