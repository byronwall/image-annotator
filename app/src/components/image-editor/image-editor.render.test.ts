import { describe, expect, it } from "vitest";
import { getTextRenderLayout } from "./image-editor.render";
import type { TextAnnotation } from "./image-editor.types";

const createTextAnnotation = (text: string): TextAnnotation => ({
  id: "text-1",
  type: "text",
  createdAt: 0,
  opacity: 1,
  x: 0,
  y: 0,
  text,
  color: "#0f172a",
  backgroundColor: "rgba(255, 255, 255, 0.94)",
  fontSize: 10,
  textStyle: "none",
});

describe("getTextRenderLayout", () => {
  it("grows automatic text bounds up to a 20ch content width", () => {
    const short = getTextRenderLayout(createTextAnnotation("wide"));
    const full = getTextRenderLayout(
      createTextAnnotation("01234567890123456789"),
    );
    const longer = getTextRenderLayout(
      createTextAnnotation("012345678901234567890123456789"),
    );

    expect(short.width).toBeLessThan(full.width);
    expect(longer.width).toBe(full.width);
    expect(short.isAutoWidthCapped).toBe(false);
    expect(full.isAutoWidthCapped).toBe(false);
    expect(longer.isAutoWidthCapped).toBe(true);
  });

  it("hard-wraps words that are wider than automatic text bounds", () => {
    const layout = getTextRenderLayout(
      createTextAnnotation("012345678901234567890123456789"),
    );

    expect(layout.lines).toEqual(["01234567890123456789", "0123456789"]);
  });
});
