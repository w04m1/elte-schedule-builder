import { mount } from "svelte";
import "./app.css";
import Root from "./Root.svelte";
import { initLanguage } from "./utils/i18n.js";
import { initTheme } from "./utils/theme.js";

initLanguage();
initTheme();

const app = mount(Root, {
  target: document.getElementById("app"),
});

export default app;
