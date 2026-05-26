import { render } from "@testing-library/react";
import Breadcrumbs from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders nothing", () => {
    const { container } = render(
      <Breadcrumbs items={[{ label: "Home", href: "/app/explore" }, { label: "Grocery" }]} />
    );
    expect(container.innerHTML).toBe("");
  });
});
