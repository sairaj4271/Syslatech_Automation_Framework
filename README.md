Playwright Automation Framework
Enterprise-Grade UI + API + Utilities Framework

Built using Playwright + TypeScript, with complete implementation of
EasyMyTrip (Hotels + Flights), Workflow Automation, Enterprise BasePage,
Runtime Storage, Reporting, Excel Export, Fixtures, Config Manager,
Retry + Error Handling, Logging, and much more.

📌 Table of Contents

✨ Overview

🔥 Key Features

📁 Project Structure

⚙️ Environment Configuration

🧰 Core Utilities

🧪 Running Tests

📊 Test Reporting

📤 Excel Export (Auto Test Data Writer)

📘 Available Test Suites

📌 Branching & Contribution Workflow

✨ Overview

This repository contains a highly structured & scalable enterprise Playwright framework used internally at Syslatech for automation of multiple platforms:

✔ EasyMyTrip Hotel Booking
✔ EasyMyTrip Flight Booking
✔ Workflow Automation
✔ Custom Runtime Store
✔ Excel Output Generation
✔ Full Error, Retry, Logging & Screenshots
✔ Multi-environment Test Execution

🔥 Key Features
✅ Enterprise BasePage (1300+ lines)

Smart Locator Normalization

Auto Label Logging

Dynamic Waits (visibility, hidden, URL, load states)

Retry Mechanism with backoff

ErrorHandler Bound to Every Action

Auto Runtime Store Setters (storeTextContent, storeInputValue)

Auto Element Name Extraction

✅ Advanced Utilities
Utility	Description
RuntimeStore	Global in-memory variable store (Runtime.set() / Runtime.get())
RetryUtils	Automatic retry for flaky steps
ErrorHandler	Centralized try/catch with context logging
WaitUtils	Custom wait conditions
ElementUtils	Click, type, fill with retry + auto logs
FileUtils	Read/Write Excel, CSV, JSON, Text + Auto Folder Creation
NumberUtils	Random age, ranges, below/above, etc.
ValidationUtils	Common field validations
✅ Configuration Manager (env.dev.ts / env.qa.ts)

Multi-environment config loader

Merges .env overrides

Zod schema validation

Browser flags + timeouts + logging configuration

Clean, consistent environment output

✅ Excel Export (Dynamic Named Files)

Automatically creates Excel files with:

TestCaseName

Timestamp

Output Folder Auto-Generated

hotelList / flightList written as rows

✅ Allure Reporting Enabled

Attachments

Screenshots

Videos

Steps

Console logs

Trace

📁 Project Structure
Syslatech_Playwright/
├── src/
│   ├── pages/
│   │   ├── basePage.ts               (Enterprise Core)
│   │   ├── easyMyTrip.ts             (Hotel Flow)
│   │   ├── easyMyTripForFlight.ts    (Flight Flow)
│   │   ├── WorkflowPage.ts           (Workflow Automation)
│   │   └── login.ts
│   ├── utils/
│   │   ├── commonUtils.ts
│   │   ├── runtimeStore.ts
│   │   ├── runtimeGlobal.d.ts
│   │   ├── elementUtils.ts
│   │   ├── waitUtils.ts
│   │   ├── retryUtils.ts
│   │   ├── errorHandler.ts
│   │   ├── fileUtils.ts
│   │   ├── logger.ts
│   │   ├── validationUtils.ts
│   │   ├── testDataManager.ts
│   │   ├── testData.ts
│   │   └── config.ts
│   ├── fixtures/
│   │   ├── globalSetup.ts
│   │   ├── globalTeardown.ts
│   │   ├── fixtures.ts
│   │   └── testFixtures.ts
│   ├── config/
│   │   ├── env.dev.ts
│   │   ├── env.qa.ts
│   │   ├── env.index.ts
│   │   ├── env.schema.ts
│   │   ├── types.ts
│   │   └── globalTimeout.ts
│   ├── tests/
│   │   ├── easyMyTrip.spec.ts
│   │   ├── esaymytripfight.spec.ts
│   │   └── workflows.spec.ts
├── test-data/
│   ├── api/
│   └── ui/
├── allure-results/
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md

⚙️ Environment Configuration
Create .env
ENVIRONMENT=qa
BASE_URL=https://example.com
EASY_URL=https://www.easemytrip.com
TIMEOUT_ACTION=60000
TIMEOUT_WAIT=60000
TIMEOUT_NAVIGATION=45000
HEADLESS=true

Config Auto Logs

Printed at runtime:

===== ENVIRONMENT LOADED =====
ENV: qa
BASE URL: https://showcase.bluecopa.com/welcome
TIMEOUTS: { action: 60000, wait: 60000, navigation: 45000 }
================================


You disabled the log — good job.

🧰 Core Utilities
Runtime Store Example
Runtime.set("SelectedFlightDate", "26");
Runtime.get("SelectedFlightDate");


Enterprise clean:

// Store
Runtime.set("CleanCheckOut", cleanAndConvertToDDMMYYYY(raw));

// Retrieve
const checkout = $("CleanCheckOut");

Excel Auto Writer
await FileUtils.writeTestCaseExcel(hotelList, testInfo);


Auto creates:

/reports/excel/TC_HotelBooking_2025-11-25_10-45.xlsx

🧪 Running Tests
Run All
npx playwright test

Headed
npx playwright test --headed

Only 1 Test
npx playwright test -g "Hotel Booking"

Open Report
npx playwright show-report

📊 Test Reporting
Allure

Generate:

allure generate allure-results --clean -o allure-report


Open:

allure open allure-report


Playwright automatically attaches:

Screenshot

Video

Trace

Error context

Logs

📤 Excel Export (Auto Test Data Writer)

Your framework now exports:

Hotel list (sorted high → low)

Flight list

Workflow outputs

Auto file name:

test_output/<TestCaseName>_<timestamp>.xlsx

📘 Available Test Suites
✔ EasyMyTrip – Hotel Booking

Enter city

Apply check-in / check-out

Auto guest selection

Child age randomization

Room summary verification

Sorting hotels

Export hotel list to Excel

✔ EasyMyTrip – Flight Booking

Select flight type

Dynamic date selection

Auto runtime-store date click

Guest logic (adult/child)

Flight list extraction

Dynamic XPath generation

✔ Workflow Automation

Start workflow

Wait for state transition

Read logs

Validate outputs

Enterprise wait loops