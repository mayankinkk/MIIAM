import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

describe('cartStore multi-vendor', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should allow items from multiple vendors', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1', menu_item_id: 'm1', vendor_id: 'v1', vendor_name: 'Shop A',
      name: 'Apple', price: 50,
    }, 2, true);
    store.addItem({
      id: '2', menu_item_id: 'm2', vendor_id: 'v2', vendor_name: 'Shop B',
      name: 'Bread', price: 30,
    }, 1, true);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].vendor_id).toBe('v1');
    expect(items[1].vendor_id).toBe('v2');
  });

  it('should calculate subtotal by vendor', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1', menu_item_id: 'm1', vendor_id: 'v1', vendor_name: 'Shop A',
      name: 'Apple', price: 50,
    }, 3, true);
    store.addItem({
      id: '2', menu_item_id: 'm2', vendor_id: 'v2', vendor_name: 'Shop B',
      name: 'Bread', price: 30,
    }, 2, true);
    store.addItem({
      id: '3', menu_item_id: 'm3', vendor_id: 'v1', vendor_name: 'Shop A',
      name: 'Banana', price: 20,
    }, 4, true);
    expect(store.subtotalByVendor('v1')).toBe(230);
    expect(store.subtotalByVendor('v2')).toBe(60);
  });

  it('should compute totalPrice across all vendors', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1', menu_item_id: 'm1', vendor_id: 'v1', vendor_name: 'Shop A',
      name: 'Apple', price: 50,
    }, 2, true);
    store.addItem({
      id: '2', menu_item_id: 'm2', vendor_id: 'v2', vendor_name: 'Shop B',
      name: 'Bread', price: 30,
    }, 3, true);
    expect(store.totalPrice()).toBe(190);
  });

  it('should update quantity of item from specific vendor', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1', menu_item_id: 'm1', vendor_id: 'v1', vendor_name: 'Shop A',
      name: 'Apple', price: 50,
    }, 1, true);
    store.addItem({
      id: '2', menu_item_id: 'm2', vendor_id: 'v2', vendor_name: 'Shop B',
      name: 'Bread', price: 30,
    }, 1, true);
    store.updateQuantity('1', 5);
    const items = useCartStore.getState().items;
    expect(items.find(i => i.id === '1')?.quantity).toBe(5);
    expect(items.find(i => i.id === '2')?.quantity).toBe(1);
  });

  it('should remove item from specific vendor without affecting others', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1', menu_item_id: 'm1', vendor_id: 'v1', vendor_name: 'Shop A',
      name: 'Apple', price: 50,
    }, 1, true);
    store.addItem({
      id: '2', menu_item_id: 'm2', vendor_id: 'v2', vendor_name: 'Shop B',
      name: 'Bread', price: 30,
    }, 1, true);
    store.removeItem('1');
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('2');
  });

  it('should clamp quantity to 99', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1', menu_item_id: 'm1', vendor_id: 'v1', vendor_name: 'Shop A',
      name: 'Apple', price: 50,
    }, 1, true);
    store.updateQuantity('1', 150);
    expect(useCartStore.getState().items[0].quantity).toBe(99);
  });

  it('should clear all items from all vendors', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1', menu_item_id: 'm1', vendor_id: 'v1', vendor_name: 'Shop A',
      name: 'Apple', price: 50,
    }, 1, true);
    store.addItem({
      id: '2', menu_item_id: 'm2', vendor_id: 'v2', vendor_name: 'Shop B',
      name: 'Bread', price: 30,
    }, 1, true);
    store.clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().totalItems()).toBe(0);
    expect(useCartStore.getState().totalPrice()).toBe(0);
  });
});
