import base from "./playwright.public.config";
export default { ...base, use: { ...base.use, launchOptions: { executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell" } } };
