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
export const MotionArticle = createMotionComponent("article");
export const MotionForm = createMotionComponent("form");
export const MotionInput = createMotionComponent("input");
export const MotionTextarea = createMotionComponent("textarea");

// SVG Motion Components
export const MotionSvg = createMotionComponent("svg");
export const MotionPath = createMotionComponent("path");
export const MotionCircle = createMotionComponent("circle");
export const MotionRect = createMotionComponent("rect");
export const MotionLine = createMotionComponent("line");
export const MotionPolygon = createMotionComponent("polygon");
export const MotionPolyline = createMotionComponent("polyline");
export const MotionEllipse = createMotionComponent("ellipse");
export const MotionG = createMotionComponent("g");

// Generic prop type for consumers
export type MotionComponentProps<T extends MotionElements = "div"> =
  MotionProps<T>;
