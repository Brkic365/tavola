import { login } from "@/app/admin/actions";

export const metadata = { title: "Admin sign in · Tavola" };

type Search = { searchParams: Promise<{ error?: string; next?: string }> };

export default async function LoginPage({ searchParams }: Search) {
  const { error, next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Tavola admin
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Sign in to manage menus.
        </p>

        <form action={login} className="mt-5 space-y-3">
          <input type="hidden" name="next" value={next ?? "/admin"} />
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Password</span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Incorrect password. Try again.
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-xs text-stone-400">
          Demo password is <code className="rounded bg-stone-100 px-1">tavola</code>{" "}
          (set <code className="rounded bg-stone-100 px-1">ADMIN_PASSWORD</code>).
          Replace with Clerk/NextAuth + roles for production.
        </p>
      </div>
    </main>
  );
}
