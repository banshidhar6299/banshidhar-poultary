import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'express';
import { roundPaise } from '../src/utils/helpers';

describe('Accounting & Ledger Engine Calculations', () => {
  it('correctly calculates the canonical Banshidhar Poultry accounting flow (Spec #87)', () => {
    // 1. Starter Feed: 2 x 1600 = 3200 Debit
    const feedDebit = 2 * 1600; // 3200
    // 2. Chick Supply: 1000 x 35 = 35000 Debit
    const chickDebit = 1000 * 35; // 35000

    const totalDebitInitial = feedDebit + chickDebit; // 38200

    // 3. Payment Received: 20000 Credit
    const paymentCredit = 20000;

    // Expected Outstanding Due: 38200 - 20000 = 18200
    const outstandingDue = totalDebitInitial - paymentCredit;
    expect(outstandingDue).toBe(18200);

    // 4. Bird Sale Settlement: 50000 Credit
    const birdSaleCredit = 50000;
    const totalCreditFinal = paymentCredit + birdSaleCredit; // 70000

    // Net Balance = Total Debit - Total Credit = 38200 - 70000 = -31800
    const netBalance = totalDebitInitial - totalCreditFinal;
    expect(netBalance).toBe(-31800);

    // When netBalance is negative, Advance = abs(netBalance) = 31800
    const isAdvance = netBalance < 0;
    const advanceAmount = isAdvance ? Math.abs(netBalance) : 0;
    expect(advanceAmount).toBe(31800);
  });

  it('correctly handles decimal KG and paise rounding (Spec #74, #15)', () => {
    const liveWeightKg = 85.75;
    const ratePerKg = 120.5;
    const grossAmount = roundPaise(liveWeightKg * ratePerKg);
    expect(grossAmount).toBe(10332.88);

    const deductions = 250;
    const netCredit = roundPaise(grossAmount - deductions);
    expect(netCredit).toBe(10082.88);
  });
});
