import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "jest-axe";
import AdminConfigPage from "@/app/(admin)/config/page";

describe("admin config home a11y", () => {
  it("has no obvious accessibility violations", async () => {
    const { container } = render(<AdminConfigPage />);
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
