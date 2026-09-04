import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import AppFooter from "../../src/components/AppFooter.svelte";

describe("AppFooter", () => {
  it("credits both contributors with accessible external links", () => {
    render(AppFooter, {
      githubRepositoryUrl: "https://github.com/w04m1/elte-schedule-builder",
    });

    expect(
      screen.getByRole("contentinfo", { name: "Project information" }),
    ).toBeTruthy();

    const daniil = screen.getByRole("link", {
      name: /Daniil Sherstennikov.*opens in a new tab/,
    });
    const jaloliddin = screen.getByRole("link", {
      name: /Jaloliddin Ismailov.*opens in a new tab/,
    });

    expect(daniil.getAttribute("href")).toBe("https://blog.w04m1.dev/");
    expect(jaloliddin.getAttribute("href")).toBe("https://jalols.page/");
    expect(daniil.getAttribute("rel")).toBe("noopener noreferrer");
    expect(jaloliddin.getAttribute("rel")).toBe("noopener noreferrer");
    expect(
      jaloliddin.compareDocumentPosition(daniil) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Star on GitHub (opens in a new tab)" })
        .getAttribute("href"),
    ).toBe("https://github.com/w04m1/elte-schedule-builder");
    expect(screen.getByRole("link", { name: /w04m1@proton.me/ })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Telegram.*opens in a new tab/ }),
    ).toBeTruthy();
    expect(screen.getByText("Not affiliated with ELTE.")).toBeTruthy();
    expect(screen.queryByText("ELTE Schedule Builder")).toBeNull();
    expect(
      screen.queryByText("An independent planner made for ELTE students."),
    ).toBeNull();
  });
});
