import { render, screen } from "@testing-library/react";
import Breadcrumbs from "./Breadcrumbs";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Breadcrumbs", () => {
  it("renders all items with separators", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/explore" },
          { label: "Grocery" },
        ]}
      />
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Grocery")).toBeInTheDocument();
    expect(screen.getAllByText("/").length).toBe(1);
  });

  it("highlights last item as current page", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/explore" },
          { label: "Orders", href: "/app/orders" },
          { label: "Order #123" },
        ]}
      />
    );
    const lastItem = screen.getByText("Order #123");
    expect(lastItem.tagName).toBe("SPAN");
    expect(lastItem.className).toContain("font-bold");
  });

  it("renders single item without separator", () => {
    render(<Breadcrumbs items={[{ label: "Home" }]} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("/")).not.toBeInTheDocument();
  });
});
