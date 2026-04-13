// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DangerousConfirmDialog } from "@/components/DangerousConfirmDialog";

const diff = [{ scope: "journeys", added: 2, modified: 5, removed: 1 }];

describe("DangerousConfirmDialog", () => {
  it("disables Confirm until exact tenant name is typed", async () => {
    const onConfirm = vi.fn();
    render(
      <DangerousConfirmDialog
        open
        title="Push to prod"
        subtitle="Test subtitle"
        tenantName="prod"
        diffLoader={async () => diff}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );

    await waitFor(() => expect(screen.getByText(/journeys/)).toBeInTheDocument());
    const confirm = screen.getByRole("button", { name: /confirm/i });
    expect(confirm).toBeDisabled();

    const input = screen.getByPlaceholderText(/type/i);
    fireEvent.change(input, { target: { value: "pro" } });
    expect(confirm).toBeDisabled();

    fireEvent.change(input, { target: { value: "prod" } });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows banner when diff loader fails", async () => {
    render(
      <DangerousConfirmDialog
        open
        title="Push to prod"
        subtitle=""
        tenantName="prod"
        diffLoader={async () => { throw new Error("boom"); }}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    await waitFor(() => expect(screen.getByText(/Diff unavailable/i)).toBeInTheDocument());
  });
});
