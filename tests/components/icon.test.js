import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Icon from "../../src/components/Icon.svelte";

describe("Icon probe", () => {
  it("renders shapes in the SVG namespace", () => {
    const { container } = render(Icon, { name: "sun" });
    const svg = container.querySelector("svg");
    const circle = svg.querySelector("circle");
    expect(circle).toBeTruthy();
    expect(circle.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("exposes a label when given", () => {
    render(Icon, { name: "moon", label: "Dark theme" });
    expect(screen.getByRole("img", { name: "Dark theme" })).toBeTruthy();
  });
});
