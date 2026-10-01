import { mount } from "svelte";
import "./app.css";
import Root from "./Root.svelte";
import { initLanguage } from "./utils/i18n.js";
import { initTheme } from "./utils/theme.js";

initLanguage();
initTheme();

const target = document.getElementById("app");
if (!target) {
  throw new Error("Failed to find app root element");
}

const app = mount(Root, { target });

export default app;
