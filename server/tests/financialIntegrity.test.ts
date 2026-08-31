import { describe, expect, it } from 'vitest';
import {
  addLedgerTransactionSchema,
  createBirdSaleSchema,
  addChickSupplySchema,
  createOrderSchema
} from '../src/validators/schemas';

describe('Financial Data Integrity & Input Validation', () => {
  const validMongoId = '507f1f77bcf86cd799439011';

  it('accepts valid financial ledger transaction inputs', () => {
    const validPayload = {
      farmerId: validMongoId,
      transactionType: 'PRODUCT_PURCHASE' as const,
      amount: 1500.50,
      description: 'Broiler Starter Feed (50kg)'
    };
    const result = addLedgerTransactionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects negative amount in financial transactions', () => {
    const invalidPayload = {
      farmerId: validMongoId,
      transactionType: 'PAYMENT_RECEIVED' as const,
      amount: -500
    };
    const result = addLedgerTransactionSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('rejects NaN / non-numeric amounts', () => {
    const invalidPayload = {
      farmerId: validMongoId,
      transactionType: 'PAYMENT_RECEIVED' as const,
      amount: NaN
    };
    const result = addLedgerTransactionSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('rejects Infinity in financial calculations', () => {
    const invalidPayload = {
      farmerId: validMongoId,
      transactionType: 'PRODUCT_PURCHASE' as const,
      amount: Infinity
    };
    const result = addLedgerTransactionSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('rejects zero or negative quantities in chick supply', () => {
    const invalidSupply = {
      farmerId: validMongoId,
      quantity: 0,
      ratePerChick: 35
    };
    const result = addChickSupplySchema.safeParse(invalidSupply);
    expect(result.success).toBe(false);
  });

  it('rejects invalid bird sale weights and rates', () => {
    const invalidSale = {
      farmerId: validMongoId,
      actualBirds: -100,
      actualTotalKg: -250,
      ratePerKg: -105
    };
    const result = createBirdSaleSchema.safeParse(invalidSale);
    expect(result.success).toBe(false);
  });

  it('validates order item quantities are positive integers', () => {
    const invalidOrder = {
      items: [{ productId: validMongoId, quantity: 0 }]
    };
    const result = createOrderSchema.safeParse(invalidOrder);
    expect(result.success).toBe(false);
  });
});
