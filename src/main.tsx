import { render } from "preact";
import { App } from "./app";
import "./index.css";

// The perfTools object is now initialized within PerformanceTools.tsx
// No need to define it here.

render(<App />, document.getElementById("app") as HTMLElement);
