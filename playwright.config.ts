// playwright.config.ts
import { defineConfig } from "@playwright/test";
import { configManager } from "./src/config/env.index";
import "./src/utils/runtimeGlobal";

// Read runtime configs
const baseURL = configManager.getBaseURL();
const browserConf = configManager.getBrowserConfig();

// Detect Jenkins CI
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./src/tests",

  // Full test timeout (15 mins)
  timeout: 900_000,

  expect: {
    timeout: 25_000,
  },

  use: {
    baseURL,

    // CI → Always headless
    headless: isCI ? true : browserConf.headless,

    viewport: null,

    launchOptions: isCI
      ? {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        }
      : {
          args: ["--start-maximized", "--window-size=1920,1080"],
        },

    actionTimeout: configManager.getTimeout("action"),
    navigationTimeout: configManager.getTimeout("navigation"),

    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  retries: isCI ? 0 : 0,
  workers: isCI ? 3 : 4,

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],

  // ------------------------------
  // CORRECTED REPORTER SECTION
  // ------------------------------
  reporter: isCI
    ? [
        ["list"],
        ["junit", { outputFile: "reports/results.xml" }],
        ["html", { outputFolder: "playwright-report" }],
        ["allure-playwright", { outputFolder: "allure-results" }],
      ]
    : [
        ["list"],
        ["html", { open: "never" }],
        ["junit", { outputFile: "reports/results.xml" }],
        ["allure-playwright", { outputFolder: "allure-results" }],
      ],
});
