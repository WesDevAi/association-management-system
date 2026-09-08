-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "expenseCategoryId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "payeeVendor" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "receiptDocumentId" TEXT,
    "recordedById" TEXT,
    "financialTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_associationId_name_key" ON "ExpenseCategory"("associationId", "name");

-- CreateIndex
CREATE INDEX "ExpenseCategory_associationId_idx" ON "ExpenseCategory"("associationId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_reference_key" ON "Expense"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_receiptDocumentId_key" ON "Expense"("receiptDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_financialTransactionId_key" ON "Expense"("financialTransactionId");

-- CreateIndex
CREATE INDEX "Expense_associationId_idx" ON "Expense"("associationId");

-- CreateIndex
CREATE INDEX "Expense_expenseCategoryId_idx" ON "Expense"("expenseCategoryId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_reference_idx" ON "Expense"("reference");

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_receiptDocumentId_fkey" FOREIGN KEY ("receiptDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_financialTransactionId_fkey" FOREIGN KEY ("financialTransactionId") REFERENCES "FinancialTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
