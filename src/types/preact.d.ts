import { JSXInternal } from "preact";

declare global {
  namespace JSX {
    interface IntrinsicElements extends JSXInternal.IntrinsicElements {}
  }
}
