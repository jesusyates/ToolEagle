import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToolCopyButton } from "../tools/ToolCopyButton";

describe("ToolCopyButton", () => {
  it("renders with label", () => {
    render(<ToolCopyButton label="Copy" onClick={() => {}} />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<ToolCopyButton label="Copy" onClick={onClick} />);
    fireEvent.click(screen.getByText("Copy"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows Copied after click", async () => {
    render(<ToolCopyButton label="Copy" onClick={async () => {}} />);
    fireEvent.click(screen.getByText("Copy"));
    await waitFor(() => {
      expect(screen.getByText(/Copied/i)).toBeInTheDocument();
    });
  });
});
