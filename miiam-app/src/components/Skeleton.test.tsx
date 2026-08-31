import { render, screen } from "@testing-library/react";
import { CardSkeleton, VendorCardSkeleton, OrderSkeleton } from "./Skeleton";

describe("Skeleton components", () => {
  it("CardSkeleton renders without crashing", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("VendorCardSkeleton renders without crashing", () => {
    const { container } = render(<VendorCardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("OrderSkeleton renders without crashing", () => {
    const { container } = render(<OrderSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });
});
