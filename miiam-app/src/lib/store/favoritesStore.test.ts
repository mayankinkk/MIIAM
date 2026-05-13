import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from './favoritesStore';

describe('favoritesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useFavoritesStore.setState({ favoriteIds: [] });
  });

  it('should start with empty favorites', () => {
    expect(useFavoritesStore.getState().favoriteIds).toHaveLength(0);
  });

  it('should add item to favorites', () => {
    const { toggle } = useFavoritesStore.getState();
    toggle('vendor-1');
    expect(useFavoritesStore.getState().favoriteIds).toContain('vendor-1');
  });

  it('should remove item from favorites when toggled again', () => {
    const { toggle } = useFavoritesStore.getState();
    toggle('vendor-1');
    toggle('vendor-1');
    expect(useFavoritesStore.getState().favoriteIds).not.toContain('vendor-1');
  });

  it('should check if item is favorite', () => {
    const { toggle, isFavorite } = useFavoritesStore.getState();
    toggle('vendor-1');
    expect(isFavorite('vendor-1')).toBe(true);
    expect(isFavorite('vendor-2')).toBe(false);
  });

  it('should handle multiple favorites', () => {
    const { toggle } = useFavoritesStore.getState();
    toggle('vendor-1');
    toggle('vendor-2');
    toggle('vendor-3');
    expect(useFavoritesStore.getState().favoriteIds).toHaveLength(3);
  });

  it('should toggle correctly between add and remove', () => {
    const { toggle, isFavorite } = useFavoritesStore.getState();
    
    toggle('vendor-1');
    expect(isFavorite('vendor-1')).toBe(true);
    
    toggle('vendor-1');
    expect(isFavorite('vendor-1')).toBe(false);
    
    toggle('vendor-1');
    expect(isFavorite('vendor-1')).toBe(true);
  });
});