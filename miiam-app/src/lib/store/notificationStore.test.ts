import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from './notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useNotificationStore.setState({
      permission: 'default',
      token: null,
      preferences: {
        orderUpdates: true,
        promotions: true,
        recommendations: false,
      },
    });
  });

  it('should have default values', () => {
    const state = useNotificationStore.getState();
    expect(state.permission).toBe('default');
    expect(state.token).toBeNull();
    expect(state.preferences.orderUpdates).toBe(true);
    expect(state.preferences.promotions).toBe(true);
    expect(state.preferences.recommendations).toBe(false);
  });

  it('should set token', () => {
    const { setToken } = useNotificationStore.getState();
    setToken('test-token-123');
    expect(useNotificationStore.getState().token).toBe('test-token-123');
  });

  it('should update preferences partially', () => {
    const { updatePreferences } = useNotificationStore.getState();
    updatePreferences({ orderUpdates: false });
    expect(useNotificationStore.getState().preferences.orderUpdates).toBe(false);
    expect(useNotificationStore.getState().preferences.promotions).toBe(true);
  });

  it('should update all preferences', () => {
    const { updatePreferences } = useNotificationStore.getState();
    updatePreferences({
      orderUpdates: false,
      promotions: false,
      recommendations: true,
    });
    const prefs = useNotificationStore.getState().preferences;
    expect(prefs.orderUpdates).toBe(false);
    expect(prefs.promotions).toBe(false);
    expect(prefs.recommendations).toBe(true);
  });
});