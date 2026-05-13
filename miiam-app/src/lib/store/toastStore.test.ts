import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().clearToasts();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add a toast', () => {
    const { addToast, toasts } = useToastStore.getState();
    addToast('Test message', 'success');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].message).toBe('Test message');
    expect(useToastStore.getState().toasts[0].type).toBe('success');
  });

  it('should default to info type when not specified', () => {
    const store = useToastStore.getState();
    store.addToast('Test message');
    expect(useToastStore.getState().toasts[0].type).toBe('info');
  });

  it('should remove a toast by id', () => {
    const store = useToastStore.getState();
    store.addToast('Test message');
    const id = useToastStore.getState().toasts[0].id;
    store.removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should clear all toasts', () => {
    const store = useToastStore.getState();
    store.addToast('Message 1');
    store.addToast('Message 2');
    store.clearToasts();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should auto-remove toast after timeout', () => {
    const store = useToastStore.getState();
    store.addToast('Auto remove test');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    
    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should add multiple toasts with different types', () => {
    const store = useToastStore.getState();
    store.addToast('Success message', 'success');
    store.addToast('Error message', 'error');
    store.addToast('Warning message', 'warning');
    store.addToast('Info message', 'info');
    
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(4);
    expect(toasts.map(t => t.type)).toContain('success');
    expect(toasts.map(t => t.type)).toContain('error');
    expect(toasts.map(t => t.type)).toContain('warning');
    expect(toasts.map(t => t.type)).toContain('info');
  });
});