import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { createDemoRestaurant } from "../lib/demoMenu";

const prisma = new PrismaClient();

async function main() {
  // Idempotent: wipe and reseed so re-running gives a clean demo state.
  await prisma.arView.deleteMany();
  await prisma.dishFeedback.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  // Demo account (platform ADMIN, so it can manage everything).
  const owner = await prisma.user.create({
    data: {
      email: "demo@tavola.app",
      name: "Demo Owner",
      passwordHash: await hashPassword("tavola"),
      role: "ADMIN",
    },
  });

  const restaurant = await createDemoRestaurant(prisma, {
    ownerId: owner.id,
    slug: "tavola-demo",
    withAnalytics: true,
  });

  const count = await prisma.dish.count();
  console.log(
    `Seeded "${restaurant.name}" (/r/${restaurant.slug}) with ${count} dishes across 3 categories.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
