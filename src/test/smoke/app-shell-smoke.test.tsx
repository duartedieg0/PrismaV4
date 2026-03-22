import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicHomePage from "@/app/(public)/page";
import { Providers } from "@/app/providers";
import { hero } from "@/features/public-experience/content";

describe("app shell smoke", () => {
  it("renders the public home page inside providers", () => {
    render(
      <Providers>
        <PublicHomePage params={Promise.resolve({})} />
      </Providers>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: hero.title,
      }),
    ).toBeInTheDocument();
  });
});
