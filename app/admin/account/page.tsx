import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { updateAccount } from "@/app/admin/actions";

export const metadata = { title: "Account · Tavola" };
export const dynamic = "force-dynamic";

type Search = { searchParams: Promise<{ saved?: string; error?: string }> };

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";
const labelCls = "block text-sm font-medium text-stone-700";

export default async function AccountPage({ searchParams }: Search) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const { saved, error } = await searchParams;

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-md flex-1 px-5 py-10"
    >
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Account
        </h1>
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">
          ← Admin
        </Link>
      </div>

      <p className="mb-4 text-sm text-stone-500">
        Signed in as <strong className="text-stone-800">{user.email}</strong>
        {" · "}role {user.role}
      </p>

      {saved && (
        <p className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          ✓ Saved.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error === "wrongpw"
            ? "Current password is incorrect."
            : "New password must be at least 6 characters."}
        </p>
      )}

      <form
        action={updateAccount}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <label className="block">
          <span className={labelCls}>Name</span>
          <input
            name="name"
            defaultValue={user.name ?? ""}
            className={inputCls}
            placeholder="Your name"
          />
        </label>

        <div className="border-t border-stone-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Change password
          </p>
          <label className="mt-2 block">
            <span className={labelCls}>Current password</span>
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className={inputCls}
            />
          </label>
          <label className="mt-2 block">
            <span className={labelCls}>New password (min 6 chars)</span>
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className={inputCls}
            />
          </label>
          <p className="mt-1 text-xs text-stone-400">
            Leave the password fields blank to only update your name.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Save changes
        </button>
      </form>
    </main>
  );
}
