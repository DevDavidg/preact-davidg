import { createElement } from "preact";

declare global {
  interface HTMLElementTagNameMap {
    svg: SVGElement;
    path: SVGPathElement;
  }
}
import { motion, HTMLMotionProps as BaseHTMLMotionProps } from "framer-motion";

type HTMLMotionProps<
  T extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap
> = T extends keyof HTMLElementTagNameMap
  ? BaseHTMLMotionProps<any>
  : T extends keyof SVGElementTagNameMap
  ? BaseHTMLMotionProps<any>
  : never;

function createMotionComponent<T extends keyof HTMLElementTagNameMap>(type: T) {
  const MotionComponent = motion[type as keyof typeof motion] as any;

  return (props: any) => createElement(MotionComponent, props);
}

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
export const MotionSvg = createMotionComponent("svg");
export const MotionPath = createMotionComponent("path");
export const MotionArticle = createMotionComponent("article");
export const MotionForm = createMotionComponent("form");
export const MotionInput = createMotionComponent("input");
export const MotionTextarea = createMotionComponent("textarea");

export type MotionComponentProps<
  T extends keyof HTMLElementTagNameMap = "div"
> = HTMLMotionProps<T>;
