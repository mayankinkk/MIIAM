import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "./ui/EmptyStates";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState icon="search" title="No items" description="Nothing here yet" />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders action button and triggers callback", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon="restaurant"
        title="No restaurants"
        description="Try again"
        actionLabel="Browse All"
        onAction={onAction}
      />
    );
    const btn = screen.getByText("Browse All");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render button when no actionLabel", () => {
    render(<EmptyState icon="star" title="No reviews" description="Be the first" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
