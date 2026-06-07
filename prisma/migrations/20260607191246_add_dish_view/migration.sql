-- CreateTable
CREATE TABLE "DishView" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DishView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DishView_dishId_idx" ON "DishView"("dishId");

-- AddForeignKey
ALTER TABLE "DishView" ADD CONSTRAINT "DishView_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
