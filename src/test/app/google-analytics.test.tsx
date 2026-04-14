import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/script — it does not render in the test environment
vi.mock("next/script", () => ({
  default: ({
    id,
    src,
    children,
  }: {
    id?: string;
    src?: string;
    children?: React.ReactNode;
  }) => <script id={id} src={src}>{children}</script>,
}));

// Mock next/navigation — usePathname is not available in tests
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("GoogleAnalytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules(); // clears module cache so dynamic imports re-evaluate env vars
  });

  it("renders nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is empty", async () => {
    // stubEnv sets the var to an empty string ""; the component guards with !measurementId
    // which treats "" as falsy — same effect as undefined for this guard
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    const { GoogleAnalytics } = await import("@/app/google-analytics");
    const { container } = render(<GoogleAnalytics />);
    expect(container).toBeEmptyDOMElement();
  });
});
