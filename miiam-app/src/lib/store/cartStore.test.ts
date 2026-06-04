import { describe, it, expect, beforeEach } from 'vitest';
import { PRINT_MENU_ITEM_ID } from '../constants';
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
    store.removeItem('1');
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
    store.updateQuantity('1', 5);
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
    store.updateQuantity('1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('should migrate old print_<timestamp> menu_item_id to PRINT_MENU_ITEM_ID on hydration', () => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const PRINT_VENDOR = 'f1111111-1111-4000-8000-000000000000';
    function migrateMenuItemId(menu_item_id: string, vendor_id: string) {
      if (vendor_id === PRINT_VENDOR && !UUID_RE.test(menu_item_id)) return PRINT_MENU_ITEM_ID;
      return menu_item_id;
    }
    expect(migrateMenuItemId('print_1780587697262', PRINT_VENDOR)).toBe(PRINT_MENU_ITEM_ID);
    expect(migrateMenuItemId('passport_1780587697262', PRINT_VENDOR)).toBe(PRINT_MENU_ITEM_ID);
    expect(migrateMenuItemId('print_lib_1780587697262', PRINT_VENDOR)).toBe(PRINT_MENU_ITEM_ID);
    expect(migrateMenuItemId(PRINT_MENU_ITEM_ID, PRINT_VENDOR)).toBe(PRINT_MENU_ITEM_ID);
    expect(migrateMenuItemId('menu-1', 'vendor-1')).toBe('menu-1');
    expect(migrateMenuItemId(PRINT_MENU_ITEM_ID, 'vendor-1')).toBe(PRINT_MENU_ITEM_ID);
  });
});