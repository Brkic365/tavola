import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { verifyInviteToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { joinRestaurant } from "@/app/admin/actions";

export const metadata = { title: "Join a restaurant · Tavola" };
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export default async function JoinPage({ params }: Params) {
  const { token } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/join/${token}`)}`);
  }

  const inv = await verifyInviteToken(token);
  const restaurant = inv
    ? await prisma.restaurant.findUnique({
        where: { id: inv.restaurantId },
        select: { name: true },
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm text-center">
        {!restaurant ? (
          <>
            <div className="text-4xl">⏳</div>
            <h1 className="mt-3 font-serif text-xl font-bold text-stone-900">
              Invite invalid or expired
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Ask the owner for a fresh invite link.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Go to admin
            </Link>
          </>
        ) : (
          <>
            <div className="text-4xl">👋</div>
            <h1 className="mt-3 font-serif text-2xl font-bold text-stone-900">
              Join {restaurant.name}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              You&apos;ve been invited to help manage this restaurant&apos;s
              menu as <strong>{user.email}</strong>.
            </p>
            <form action={joinRestaurant} className="mt-5">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Join as manager
              </button>
            </form>
            <Link
              href="/admin"
              className="mt-3 inline-block text-sm text-stone-500 hover:text-stone-800"
            >
              Cancel
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
