import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SupplierEngagementBadge from "../SupplierEngagementBadge";

describe("SupplierEngagementBadge", () => {
  it("renders correctly with submitted status", () => {
    render(<SupplierEngagementBadge status="submitted" />);
    expect(screen.getByText("Proposta Enviada")).toBeDefined();
  });

  it("renders correctly with opened status and relative time", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    render(<SupplierEngagementBadge status="opened" lastActivityAt={tenMinutesAgo} />);
    expect(screen.getByText("E-mail Visualizado")).toBeDefined();
    expect(screen.getByText(/10m/)).toBeDefined();
  });

  it("triggers onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<SupplierEngagementBadge status="accessed" onClick={handleClick} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
