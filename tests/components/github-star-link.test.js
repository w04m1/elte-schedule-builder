import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import GitHubStarLink from "../../src/components/GitHubStarLink.svelte";

describe("GitHubStarLink", () => {
  it("links to the configured repository in a new tab", () => {
    render(GitHubStarLink, {
      href: "https://github.com/example/schedule-builder",
    });

    const link = screen.getByRole("link", {
      name: "Star on GitHub (opens in a new tab)",
    });
    expect(link.getAttribute("href")).toBe(
      "https://github.com/example/schedule-builder",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});
