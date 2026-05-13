import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should add item to cart', () => {
    const { addItem, items } = useCartStore.getState();
    addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].name).toBe('Burger');
  });

  it('should increase quantity when adding existing item', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    });
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    }, 2);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('should remove item from cart', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    });
    store.removeItem('menu-1');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('should update quantity of item', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    });
    store.updateQuantity('menu-1', 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('should calculate total items correctly', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    }, 2);
    store.addItem({
      id: '2',
      menu_item_id: 'menu-2',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Pizza',
      price: 200,
    }, 3);
    expect(store.totalItems()).toBe(5);
  });

  it('should calculate total price correctly', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    }, 2);
    store.addItem({
      id: '2',
      menu_item_id: 'menu-2',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Pizza',
      price: 200,
    });
    expect(store.totalPrice()).toBe(400);
  });

  it('should calculate subtotal by vendor', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Restaurant 1',
      name: 'Burger',
      price: 100,
    }, 2);
    store.addItem({
      id: '2',
      menu_item_id: 'menu-2',
      vendor_id: 'vendor-2',
      vendor_name: 'Restaurant 2',
      name: 'Pizza',
      price: 200,
    });
    expect(store.subtotalByVendor('vendor-1')).toBe(200);
    expect(store.subtotalByVendor('vendor-2')).toBe(200);
  });

  it('should clear cart', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    });
    store.clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('should remove item when quantity is set to 0', () => {
    const store = useCartStore.getState();
    store.addItem({
      id: '1',
      menu_item_id: 'menu-1',
      vendor_id: 'vendor-1',
      vendor_name: 'Test Restaurant',
      name: 'Burger',
      price: 100,
    });
    store.updateQuantity('menu-1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});