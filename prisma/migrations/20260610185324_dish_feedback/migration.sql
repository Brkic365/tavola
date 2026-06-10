-- CreateTable
CREATE TABLE "DishFeedback" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DishFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DishFeedback_dishId_idx" ON "DishFeedback"("dishId");

-- AddForeignKey
ALTER TABLE "DishFeedback" ADD CONSTRAINT "DishFeedback_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
