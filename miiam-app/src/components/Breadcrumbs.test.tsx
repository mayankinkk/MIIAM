import { render, screen } from "@testing-library/react";
import Breadcrumbs from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders breadcrumb items", () => {
    render(
      <Breadcrumbs items={[{ label: "Home", href: "/app/explore" }, { label: "Grocery" }]} />
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Grocery")).toBeInTheDocument();
  });

  it("renders nothing when items is empty", () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
