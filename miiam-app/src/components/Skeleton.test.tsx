import { render, screen } from "@testing-library/react";
import { CardSkeleton, VendorCardSkeleton, OrderSkeleton } from "./Skeletons";

describe("Skeleton components", () => {
  it("CardSkeleton renders without crashing", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("VendorCardSkeleton renders without crashing", () => {
    const { container } = render(<VendorCardSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("OrderSkeleton renders without crashing", () => {
    const { container } = render(<OrderSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
