import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicHomePage from "@/app/(public)/page";
import { Providers } from "@/app/providers";

describe("app shell smoke", () => {
  it("renders the public home page inside providers", () => {
    render(
      <Providers>
        <PublicHomePage />
      </Providers>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
