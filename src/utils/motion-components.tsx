import { createElement, FunctionComponent } from "preact"; // Import FunctionComponent
import { motion, HTMLMotionProps as FramerHTMLMotionProps } from "framer-motion"; // Rename base import

// Global type declarations (ensure these are appropriate for your usage)
declare global {
  interface HTMLElementTagNameMap {
    svg: SVGElement;
    path: SVGPathElement;
    // Consider adding other SVG elements if you create motion components for them (e.g., g, circle)
  }
}

// Type alias for Framer Motion's HTML props for a given HTML tag
type HTMLMotionProps<TagName extends keyof HTMLElementTagNameMap> = FramerHTMLMotionProps<TagName>;

// Updated createMotionComponent function
function createMotionComponent<TagName extends keyof HTMLElementTagNameMap>(
  type: TagName
): FunctionComponent<HTMLMotionProps<TagName>> {
  const MotionTarget = motion[type]; // motion[type] should resolve, e.g. motion.div
                                     // which is already a Preact component by Framer Motion

  // Return a new functional component that correctly types its props
  return (props: HTMLMotionProps<TagName>) => {
    return createElement(MotionTarget, props);
  };
}

// Re-export your motion components
export const MotionDiv = createMotionComponent("div");
export const MotionNav = createMotionComponent("nav");
export const MotionHeader = createMotionComponent("header");
export const MotionMain = createMotionComponent("main");
export const MotionSection = createMotionComponent("section");
export const MotionFooter = createMotionComponent("footer");
export const MotionA = createMotionComponent("a");
export const MotionButton = createMotionComponent("button");
export const MotionUl = createMotionComponent("ul");
export const MotionLi = createMotionComponent("li");
export const MotionSpan = createMotionComponent("span");
export const MotionP = createMotionComponent("p");
export const MotionH1 = createMotionComponent("h1");
export const MotionH2 = createMotionComponent("h2");
export const MotionH3 = createMotionComponent("h3");
export const MotionH4 = createMotionComponent("h4");
export const MotionH5 = createMotionComponent("h5");
export const MotionH6 = createMotionComponent("h6");
export const MotionImg = createMotionComponent("img");
export const MotionSvg = createMotionComponent("svg" as any); // Cast to any for TagName, as it's for SVGElements
export const MotionPath = createMotionComponent("path" as any); // Cast to any for TagName, as it's for SVGElements
export const MotionArticle = createMotionComponent("article");
export const MotionForm = createMotionComponent("form");
export const MotionInput = createMotionComponent("input");
export const MotionTextarea = createMotionComponent("textarea");

// Optional: A generic prop type for consumers if needed
// This type export should also be updated to reflect the new HTMLMotionProps definition
export type MotionComponentProps<
  TagName extends keyof HTMLElementTagNameMap = "div"
> = HTMLMotionProps<TagName>;
