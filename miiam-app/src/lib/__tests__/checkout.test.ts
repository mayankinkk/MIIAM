import { describe, it, expect } from 'vitest';

describe('checkout calculations', () => {
  const calcDiscount = (subtotal: number, type: 'percent' | 'flat', value: number, maxDiscount?: number) => {
    if (type === 'percent') {
      const raw = subtotal * (value / 100);
      return maxDiscount ? Math.min(raw, maxDiscount) : raw;
    }
    return Math.min(value, subtotal);
  };

  const calcTax = (base: number, rate: number) => +(base * rate).toFixed(2);

  const calcGrand = (subtotal: number, discount: number, tax: number, deliveryFee: number, tip: number) =>
    Math.max(0, +(subtotal - discount + tax + deliveryFee + tip).toFixed(2));

  it('should calculate percentage discount', () => {
    expect(calcDiscount(500, 'percent', 20)).toBe(100);
    expect(calcDiscount(500, 'percent', 20, 50)).toBe(50);
    expect(calcDiscount(0, 'percent', 20)).toBe(0);
  });

  it('should calculate flat discount', () => {
    expect(calcDiscount(500, 'flat', 100)).toBe(100);
    expect(calcDiscount(500, 'flat', 600)).toBe(500);
    expect(calcDiscount(0, 'flat', 50)).toBe(0);
  });

  it('should calculate tax correctly', () => {
    expect(calcTax(100, 0.05)).toBe(5.00);
    expect(calcTax(99.99, 0.05)).toBe(5.00);
    expect(calcTax(0, 0.05)).toBe(0);
  });

  it('should calculate grand total correctly', () => {
    expect(calcGrand(500, 100, 20, 5.99, 25)).toBe(450.99);
    expect(calcGrand(0, 0, 0, 0, 0)).toBe(0);
    expect(calcGrand(100, 200, 0, 0, 0)).toBe(0);
  });

  it('should handle multiple vendor delivery fee', () => {
    const deliveryFee = 5.99;
    const vendorCount = 3;
    expect(+(deliveryFee * vendorCount).toFixed(2)).toBe(17.97);
  });
});

describe('order creation logic', () => {
  it('should split items by vendor', () => {
    const items = [
      { menu_item_id: 'm1', vendor_id: 'v1', price: 50, quantity: 2 },
      { menu_item_id: 'm2', vendor_id: 'v2', price: 30, quantity: 1 },
      { menu_item_id: 'm3', vendor_id: 'v1', price: 20, quantity: 4 },
    ];

    const vendorIds = [...new Set(items.map(i => i.vendor_id))];
    expect(vendorIds).toEqual(['v1', 'v2']);

    const vendorItems = vendorIds.map(vid => ({
      vendorId: vid,
      items: items.filter(i => i.vendor_id === vid),
      total: items.filter(i => i.vendor_id === vid).reduce((s, i) => s + i.price * i.quantity, 0),
    }));

    expect(vendorItems).toHaveLength(2);
    expect(vendorItems[0].vendorId).toBe('v1');
    expect(vendorItems[0].total).toBe(180);
    expect(vendorItems[1].vendorId).toBe('v2');
    expect(vendorItems[1].total).toBe(30);
  });

  it('should allocate discount proportionally across vendors', () => {
    const subtotal = 200;
    const discount = 50;
    const vendorTotals = [150, 50];

    const allocations = vendorTotals.map(vt => +(discount * (vt / subtotal)).toFixed(2));
    expect(allocations[0]).toBe(37.50);
    expect(allocations[1]).toBe(12.50);
    expect(+allocations.reduce((a, b) => a + b, 0).toFixed(2)).toBe(50);
  });
});
