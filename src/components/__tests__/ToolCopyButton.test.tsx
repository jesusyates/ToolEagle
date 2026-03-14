import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToolCopyButton } from "../tools/ToolCopyButton";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({ copy: "Copy", copied: "Copied", copyAll: "Copy all" }[key] ?? key)
}));

describe("ToolCopyButton", () => {
  it("renders with label", () => {
    render(<ToolCopyButton onClick={() => {}} />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<ToolCopyButton onClick={onClick} />);
    fireEvent.click(screen.getByText("Copy"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows Copied after click", async () => {
    render(<ToolCopyButton onClick={async () => {}} />);
    fireEvent.click(screen.getByText("Copy"));
    await waitFor(() => {
      expect(screen.getByText("Copied")).toBeInTheDocument();
    });
  });
});
