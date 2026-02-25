import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TagInput from "@/components/TagInput";
import ServingAdjuster from "@/components/ServingAdjuster";
import ErrorBoundary from "@/components/ErrorBoundary";

describe("TagInput", () => {
  it("renders with empty tags", () => {
    render(<TagInput tags={[]} onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Add a tag...")).toBeInTheDocument();
  });

  it("renders existing tags", () => {
    render(
      <TagInput tags={["pasta", "quick"]} onChange={() => {}} />
    );
    expect(screen.getByText("pasta")).toBeInTheDocument();
    expect(screen.getByText("quick")).toBeInTheDocument();
  });

  it("calls onChange when adding a tag via Enter", () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Add a tag...");
    fireEvent.change(input, { target: { value: "italian" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["italian"]);
  });

  it("does not add duplicate tags", () => {
    const onChange = vi.fn();
    render(<TagInput tags={["pasta"]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "pasta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ServingAdjuster", () => {
  it("renders current servings", () => {
    render(<ServingAdjuster servings={4} onChange={() => {}} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("calls onChange when increasing servings", () => {
    const onChange = vi.fn();
    render(<ServingAdjuster servings={4} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Increase servings"));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("calls onChange when decreasing servings", () => {
    const onChange = vi.fn();
    render(<ServingAdjuster servings={4} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Decrease servings"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not go below 1", () => {
    const onChange = vi.fn();
    render(<ServingAdjuster servings={1} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Decrease servings"));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <p>Hello</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders error fallback when child throws", () => {
    const ThrowingComponent = () => {
      throw new Error("Test error");
    };

    // Suppress console.error for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();

    spy.mockRestore();
  });
});
