# Playwright Automation Framework

An advanced **End-to-End Testing Framework** for MakeMyTrip using Playwright with TypeScript, following Page Object Model (POM) architecture and industry best practices.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Reports](#test-reports)

## ✨ Features

✅ **Page Object Model (POM)** - Maintainable and scalable test structure  
✅ **Advanced Fixtures** - Custom test fixtures for HomePage, SearchPage, BookingPage  
✅ **Cross-Browser Testing** - Chrome, Firefox, Safari support  
✅ **Parallel Execution** - Run tests in parallel (4 workers by default)  
✅ **Smart Retry Mechanism** - Automatic retry on CI with 2 attempts  
✅ **Comprehensive Logging** - Timestamped logs with different levels  
✅ **Screenshot & Video** - Automatic capture on failure  
✅ **Multiple Reporters** - HTML, JUnit XML, JSON reports  
✅ **API Utilities** - Helper functions for API testing  
✅ **Data-Driven Tests** - Parameterized test data  
✅ **Type Safety** - Full TypeScript support  

## 📦 Prerequisites

- **Node.js** v16.0.0 or higher
- **npm** v8.0.0 or higher
- Modern browser (Chrome, Firefox, Safari)

## 🔧 Installation

```bash
# Clone the repository
git clone <repository-url>
cd makeMyTrip-playwright-tests

# Install dependencies
npm install

# Install browsers
npx playwright install
```

## 📁 Project Structure

```
makeMyTrip-playwright-tests/
├── src/
│   ├── pages/
│   │   ├── basePage.ts              # Base class with common methods
│   │   ├── homePage.ts              # Home page object model
│   │   ├── searchPage.ts            # Search results page object
│   │   └── bookingPage.ts           # Booking page object
│   ├── utils/
│   │   ├── config.ts                # Configuration management
│   │   ├── helpers.ts               # Helper functions
│   │   ├── logger.ts                # Logging utility
│   │   ├── testData.ts              # Test data collection
│   │   ├── validationUtils.ts       # Validation helpers
│   │   └── apiUtils.ts              # API utilities
│   ├── fixtures/
│   │   ├── fixtures.ts              # Custom Playwright fixtures
│   │   ├── globalSetup.ts           # Global setup hook
│   │   └── globalTeardown.ts        # Global teardown hook
│   └── tests/
│       ├── home.spec.ts             # Home page tests
│       ├── search.spec.ts           # Search page tests
│       └── booking.spec.ts          # Booking flow tests
├── playwright.config.ts              # Playwright configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
BASE_URL=https://www.makemytrip.com
HEADLESS=true
SLOW_MO=0
TIMEOUT=30000
RETRIES=0
WORKERS=4
BROWSER=chromium
TEST_EMAIL=test@automation.com
TEST_PASSWORD=TestPassword@123
```

## 🧪 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Headed Mode
```bash
npm run test:headed
```

### Run Tests in Debug Mode
```bash
npm run test:debug
```

### Run on Specific Browser
```bash
npm run test:chrome     # Chromium
npm run test:firefox    # Firefox
npm run test:webkit     # Safari
```

### Run in Parallel (4 workers)
```bash
npm run test:parallel
```

### Run Specific Test
```bash
npx playwright test -g "Search one-way flight"
```

## 📊 Test Reports

### View HTML Report
```bash
npm run test:report
```

**Report Locations:**
- HTML: `playwright-report/`
- JUnit: `test-results/junit.xml`
- JSON: `test-results/results.json`
- Logs: `logs/test_YYYY-MM-DD.log`
│       ├── search.spec.ts     # Test cases for the search functionality
│       └── booking.spec.ts    # Test cases for the booking process
├── playwright.config.ts        # Playwright configuration file
├── package.json                # npm configuration file
├── tsconfig.json               # TypeScript configuration file
└── README.md                   # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd makeMyTrip-playwright-tests
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the tests:
   ```
   npx playwright test
   ```

## Usage

- The tests are organized into separate files based on functionality.
- Each page object contains methods that interact with the respective page elements.
- Utilize the logger utility for logging during test execution.

## Contribution Guidelines

- Fork the repository and create a new branch for your feature or bug fix.
- Ensure that your code adheres to the project's coding standards.
- Write tests for any new features or changes.
- Submit a pull request for review.
