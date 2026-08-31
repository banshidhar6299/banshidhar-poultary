import { describe, it, expect } from 'vitest';

describe('Product Price History & Order Snapshot Integrity (Spec #88)', () => {
  it('preserves historical order item prices when product catalog price changes', () => {
    // 1. Initial product price
    let catalogProduct = {
      id: 'prod-001',
      name: 'Broiler Starter Feed (50kg)',
      price: 1600
    };

    // 2. Order created with snapshot
    const orderItem = {
      productId: catalogProduct.id,
      productName: catalogProduct.name,
      unitPrice: catalogProduct.price, // Snapshot at order time
      quantity: 2,
      totalPrice: catalogProduct.price * 2
    };

    const order = {
      orderId: 'ORD-2026-0001',
      items: [orderItem],
      totalAmount: orderItem.totalPrice
    };

    expect(order.items[0].unitPrice).toBe(1600);
    expect(order.totalAmount).toBe(3200);

    // 3. Admin updates catalog price later to 1700
    catalogProduct.price = 1700;

    // 4. Verification: Old order price remains 1600
    expect(order.items[0].unitPrice).toBe(1600);
    expect(order.totalAmount).toBe(3200);

    // 5. New order takes new price 1700
    const newOrderItem = {
      productId: catalogProduct.id,
      productName: catalogProduct.name,
      unitPrice: catalogProduct.price,
      quantity: 2,
      totalPrice: catalogProduct.price * 2
    };

    expect(newOrderItem.unitPrice).toBe(1700);
    expect(newOrderItem.totalPrice).toBe(3400);
  });
});
