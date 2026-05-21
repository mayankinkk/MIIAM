import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// ──────────────────────────────────────────────
// Hoisted shared helpers (available in vi.mock factories)
// ──────────────────────────────────────────────
const h = vi.hoisted(() => {
  const createQuery = (data: any[] = []) => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      single: vi.fn(() =>
        Promise.resolve({ data: data[0] || null, error: null }),
      ),
      then(resolve: Function) {
        resolve({ data, error: null });
      },
    };
    return query;
  };

  const mockSupabase = {
    from: vi.fn(() => createQuery()),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      ),
    },
  };

  const buildStore = <T,>(defaultState: T) => {
    const store = Object.assign(vi.fn(() => defaultState), {
      getState: vi.fn(() => defaultState),
      setState: vi.fn(),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    });
    return store;
  };

  return { createQuery, mockSupabase, buildStore };
});

// ──────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => h.mockSupabase),
}));

vi.mock("@/lib/store/cartStore", () => {
  const store = h.buildStore({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    totalItems: vi.fn(() => 0),
    totalPrice: vi.fn(() => 0),
    subtotalByVendor: vi.fn(() => 0),
  });
  return { useCartStore: store };
});

vi.mock("@/lib/store/toastStore", () => {
  const store = h.buildStore({
    toasts: [],
    addToast: vi.fn(),
    removeToast: vi.fn(),
    clearToasts: vi.fn(),
  });
  return { useToastStore: store };
});

vi.mock("@/lib/store/locationStore", () => {
  const store = h.buildStore({
    city: "Mumbai",
    pincode: "400001",
    state: "Maharashtra",
    country: "India",
    lat: null,
    lng: null,
    displayAddress: "Mumbai",
    setLocation: vi.fn(),
    clearLocation: vi.fn(),
  });
  return { useLocationStore: store };
});

vi.mock("@/lib/store/serviceSettingsStore", () => {
  const settings = [
    {
      id: "grocery",
      name: "Grocery",
      isEnabled: true,
      message: "",
      icon: "shopping_cart",
    },
  ];
  const defaultState = {
    settings,
    updateSetting: vi.fn(),
    getSetting: vi.fn(
      (id: string) => settings.find((s) => s.id === id),
    ),
    isServiceEnabled: vi.fn(() => true),
  };
  const store = h.buildStore(defaultState);
  return { useServiceSettingsStore: store };
});

vi.mock("@/lib/store/notificationStore", () => {
  const defaultState = {
    permission: "default" as const,
    token: null,
    preferences: {
      orderUpdates: true,
      promotions: true,
      recommendations: false,
    },
    requestPermission: vi.fn(() => Promise.resolve(true)),
    setPermission: vi.fn(),
    setToken: vi.fn(),
    updatePreferences: vi.fn(),
  };
  const store = h.buildStore(defaultState);
  return { useNotificationStore: store };
});

vi.mock("@/components/Breadcrumbs", () => ({
  default: ({ items }: any) => (
    <nav data-testid="breadcrumbs">
      {items?.map((item: any, i: number) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
  ),
}));

vi.mock("@/components/BlurImage", () => ({
  default: ({ src, alt, className }: any) => (
    <div
      data-testid="blur-image"
      className={className}
      data-src={src}
      data-alt={alt}
    />
  ),
}));

vi.mock("@/components/ServiceUnavailable", () => ({
  default: ({ serviceName, message }: any) => (
    <div data-testid="service-unavailable">
      {serviceName} &mdash; {message}
    </div>
  ),
}));

vi.mock("@/components/ui/EmptyStates", () => ({
  EmptyCart: () => <div data-testid="empty-cart">Empty Cart</div>,
  EmptyState: () => <div data-testid="empty-state">Empty State</div>,
}));

// ──────────────────────────────────────────────
// Component imports (must come after all vi.mock)
// ──────────────────────────────────────────────
import GroceryPage from "@/app/app/grocery/page";
import CartPage from "@/app/app/cart/page";
import NotificationsPage from "@/app/app/notifications/page";

describe("Page smoke tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grocery page renders header and category filters", () => {
    render(<GroceryPage />);

    expect(
      screen.getByRole("heading", { name: /grocery/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Fruits")).toBeInTheDocument();
    expect(screen.getByText("Vegetables")).toBeInTheDocument();
  });

  it("grocery page renders breadcrumbs", () => {
    render(<GroceryPage />);

    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("cart page renders header and empty cart state", () => {
    render(<CartPage />);

    expect(screen.getByText("MIIAM")).toBeInTheDocument();
    expect(screen.getByText("Your Cart")).toBeInTheDocument();
    expect(screen.getByTestId("empty-cart")).toBeInTheDocument();
  });

  it("cart page renders breadcrumbs", () => {
    render(<CartPage />);

    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByText("Cart")).toBeInTheDocument();
  });

  it("notifications page renders header and push notification section", () => {
    render(<NotificationsPage />);

    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Push Notifications")).toBeInTheDocument();
  });

  it("notifications page renders enable button when permission is default", () => {
    render(<NotificationsPage />);

    expect(
      screen.getByText("Enable Notifications"),
    ).toBeInTheDocument();
  });
});
