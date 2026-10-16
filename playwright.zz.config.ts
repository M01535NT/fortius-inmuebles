import base from "./playwright.admin.config";
export default { ...base, webServer: undefined, use: { ...base.use, baseURL: "http://127.0.0.1:3105", launchOptions: { executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell" } } };
