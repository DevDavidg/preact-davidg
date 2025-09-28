import { createElement, FunctionComponent } from "preact";
import { motion, HTMLMotionProps, SVGMotionProps } from "framer-motion";

// HTML element types
type HTMLElements = keyof HTMLElementTagNameMap;
type SVGElements = keyof SVGElementTagNameMap;

// Union type for all motion elements
type MotionElements = HTMLElements | SVGElements;

// Type guard to check if element is SVG
const isSVGElement = (type: MotionElements): type is SVGElements => {
  return [
    "svg",
    "path",
    "circle",
    "rect",
    "line",
    "polygon",
    "polyline",
    "ellipse",
    "g",
    "defs",
    "use",
    "text",
    "tspan",
  ].includes(type as string);
};

// Generic motion props type
type MotionProps<T extends MotionElements> = T extends SVGElements
  ? SVGMotionProps<SVGElementTagNameMap[T]>
  : T extends HTMLElements
  ? HTMLMotionProps<T>
  : never;

// Updated createMotionComponent function with proper typing
function createMotionComponent<T extends MotionElements>(
  type: T
): FunctionComponent<MotionProps<T>> {
  return (props: MotionProps<T>) => {
    if (isSVGElement(type)) {
      const SVGMotionTarget = motion[type as keyof typeof motion];
      return createElement(SVGMotionTarget, props as any);
    } else {
      const HTMLMotionTarget = motion[type as keyof typeof motion];
      return createElement(HTMLMotionTarget, props as any);
    }
  };
}

// HTML Motion Components
export const MotionDiv = createMotionComponent("div");
export const MotionNav = createMotionComponent("nav");
export const MotionHeader = createMotionComponent("header");
export const MotionSection = createMotionComponent("section");
export const MotionA = createMotionComponent("a");
export const MotionButton = createMotionComponent("button");
export const MotionUl = createMotionComponent("ul");
export const MotionLi = createMotionComponent("li");
export const MotionSpan = createMotionComponent("span");
export const MotionP = createMotionComponent("p");
export const MotionH1 = createMotionComponent("h1");
export const MotionH2 = createMotionComponent("h2");
export const MotionH3 = createMotionComponent("h3");
export const MotionForm = createMotionComponent("form");
export const MotionInput = createMotionComponent("input");
export const MotionTextarea = createMotionComponent("textarea");

// SVG Motion Components
export const MotionSvg = createMotionComponent("svg");
export const MotionPath = createMotionComponent("path");
export const MotionG = createMotionComponent("g");

// MotionLink component that combines Link with motion properties
export const MotionLink: FunctionComponent<
  HTMLMotionProps<"a"> & { href: string }
> = (props) => {
  const { href, className, style, ...motionProps } = props;
  const MotionA = createMotionComponent("a");

  return createElement(MotionA, {
    ...motionProps,
    className,
    style,
    onClick: (e: Event) => {
      e.preventDefault();
      // Use history API to navigate
      window.history.pushState(null, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
  });
};

// Generic prop type for consumers
export type MotionComponentProps<T extends MotionElements = "div"> =
  MotionProps<T>;
