Enterprise-Level Playwright Automation Framework


This project is a full enterprise-grade automation framework built using Playwright + TypeScript.
It follows industry standards used in real companies (POM, fixtures, reusable utilities, runtime storage, logging, validations, retries, etc.)

This README explains:
✔ What this framework does
✔ Folder & file explanations
✔ How it works internally
✔ How to run it
✔ What advanced utilities we created

📌 1. Project Overview

This framework automates:
✅ Workflow Testing (Bluecopa Portal Example)
✅ Reusable Enterprise Base Framework

It is built using:

Playwright (UI Automation)

TypeScript

Page Object Model (POM)

Reusable Utilities

Runtime Global Storage (very important)

Centralized Logging

Advanced File Utilities

Custom Wait & Retry Utilities

Allure Reporting

📌 2. Why This Framework Is "Enterprise-Level"?

This framework contains real-company level features:

🔥 1. BasePage (Reusable Actions)

Contains:

Safe click

Smart type

Retry actions

Element waits

Select dropdown

Error handling

Screenshot utilities

Page load handling

Central logging

This avoids writing the same Playwright code everywhere.

🔥 2. Runtime Store

This is one of your MOST important utilities.

It stores temporary values during test execution.

Example:

Runtime.set("City", "Goa");
console.log(Runtime.get("City"))


Used for:

Storing dates

Storing city names

Storing selected hotel name

Storing room/guest count

🔥 3. FileUtils

Allows:

✔ Write Excel
✔ Write CSV
✔ Read JSON
✔ Read Excel
✔ Auto-create output folders
✔ Fetch latest file from Downloads

Example:

FileUtils.writeExcel("output/hotels.xlsx", hotelList)

🔥 4. WaitUtils / RetryUtils

Handles flaky UI:

✔ Auto retry failed clicks
✔ Smart wait for element
✔ Handle dynamic Angular/React elements

🔥 5. ConfigManager

Two environments:

dev

qa

Loads from:

env.dev.ts
env.qa.ts


With .env support.

🔥 6. Fixtures (beforeEach, afterEach)

Login before test

Setup browser

Context management

Attach screenshots and videos

🔥 7. Allure Reporting

A fully integrated reporting system:

allure generate
allure open

📌 3. Project Folder Structure (Explained Clearly)
enterprise-playwright-tests/
│
├── src/
│   ├── pages/                # Page Object Model (POM)
│   │   ├── basePage.ts       # Most important file – framework actions
│   │   ├── easyMyTrip.ts     # MMT Hotel booking POM
│   │   ├── easyMyTripForFlight.ts  # Flights POM
│   │   ├── WorkflowPage.ts   # Bluecopa workflow automation
│   │   └── login.ts          # Login page
│   │
│   ├── tests/
│   │   ├── easyMyTrip.spec.ts        # Hotel booking test
│   │   ├── esaymytripfight.spec.ts   # Flight booking test
│   │   └── workflows.spec.ts         # Workflow test
│   │
│   ├── utils/                # Reusable utilities
│   │   ├── runtimeStore.ts   # Global runtime storage
│   │   ├── fileUtils.ts      # Excel, CSV, JSON readers
│   │   ├── elementUtils.ts   # Element helpers
│   │   ├── waitUtils.ts      # Wait helpers
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── retryUtils.ts     # Retry engine
│   │   ├── commonUtils.ts    # Date utils, number utils
│   │   ├── logger.ts         # Central logger
│   │   └── validationUtils.ts# Input validations
│   │
│   ├── fixtures/
│   │   ├── fixtures.ts       # Custom fixtures
│   │   ├── globalSetup.ts    # Before test run
│   │   └── globalTeardown.ts # After test run
│   │
│   ├── config/               # Environment Config
│   │   ├── env.dev.ts
│   │   ├── env.qa.ts
│   │   ├── env.schema.ts
│   │   └── env.index.ts
│
├── playwright.config.ts      # Playwright main config
├── package.json
├── tsconfig.json
├── reports/
└── allure-results/

📌 4. How to Run Tests
✔ Install all packages
npm install

✔ Install browsers
npx playwright install

✔ Run all tests
npx playwright test

✔ Run specific test
npx playwright test easyMyTrip.spec.ts

✔ Run with UI
npx playwright test --headed

✔ Run a specific test case
npx playwright test -g "EasyMyTrip Hotel Booking Test"

📌 5. Generate Allure Report
Step 1: Execute tests
npx playwright test

Step 2: Generate report
allure generate allure-results --clean

Step 3: Open report
allure open

📌 6. Key Features Implemented 
🚀 Enterprise BasePage (smart actions)
🚀 Runtime Store (global variable system)
🚀 Powerful FileUtils (Excel/CSV auto-create)
🚀 Date utilities (clean + convert)
🚀 Retry engine for flaky UI
🚀 MMT Hotel and Flight automation
🚀 Workflow automation for Bluecopa
🚀 GitHub project setup
🚀 Allure reporting integration
🚀 Full environment management (dev, qa)
📌 7. College-Friendly Summary

Your framework:

Is not simple Playwright

It is a full testing architecture, like real IT companies use

Shows professional coding standards

Includes advanced utility engineering

Is scalable, maintainable, reusable

This README will clearly show your college that:

🔹 You built a production-level automation system
🔹 You understand real QA architecture
🔹 You can work in enterprise projects
