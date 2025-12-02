// ============================================================================
//  BASE PAGE - ENTERPRISE LEVEL
//  - Central abstraction for all page actions
//  - Auto-name logging for elements
//  - ErrorHandler wrapper + inner try/catch in all methods
//  - Uses ElementUtils, WaitUtils, Runtime store helpers
// ============================================================================

import { Page, Locator, expect } from "@playwright/test";
import { ElementUtils } from "../utils/elementUtils";
import { WaitUtils } from "../utils/waitUtils";
import { ErrorHandler } from "../utils/errorHandler";
import { RetryOptions } from "../utils/retryUtils";
import { configManager } from "../config/env.index";
import { Global_Timeout } from "../config/globalTimeout";
import { Runtime } from "../utils/runtimeStore";

/**
 * BasePage
 * ---------------------------------------------------------------------------
 * Enterprise-level reusable base class for all Page Objects.
 *
 * Responsibilities:
 *  - Normalize selectors (string or Locator) into Locator
 *  - Provide auto element-name resolution for logging
 *  - Wrap all core actions with ErrorHandler + inner try/catch
 *  - Provide consistent timeouts using Global_Timeout
 *  - Provide helper methods for storing values in Runtime store
 *
 * Usage:
 *  export class LoginPage extends BasePage {
 *    readonly username = this.getLocator("#username");
 *    readonly password = this.getLocator("#password");
 *    readonly loginBtn = this.getLocator("button[type='submit']");
 *
 *    async login(user: string, pass: string) {
 *      return this
 *        .fill(this.username, user)
 *        .fill(this.password, pass)
 *        .click(this.loginBtn)
 *        .waitForURL(/dashboard/);
 *    }
 *  }
 */
export class BasePage {
  protected page: Page;

  // ==========================================================================
  //  CONSTRUCTOR
  // ==========================================================================

  /**
   * Constructor
   *
   * Stores the Playwright Page instance for use in all actions.
   *
   * @param page - Playwright Page instance
   */
  constructor(page: Page) {
    this.page = page;
  }

  // ==========================================================================
  //  SELECTOR NORMALIZATION + AUTO-NAME
  // ==========================================================================

  /**
   * getLocator
   * -------------------------------------------------------------------------
   * Converts a string selector or existing Locator into a Locator.
   *
   * Behavior:
   *  - If selector is already a Locator → returns it as-is
   *  - If string starts with '//' or 'xpath=' → treats as XPath
   *  - Otherwise → treats as CSS
   *
   * @param selector - string selector or Locator
   * @returns Locator
   */
  protected getLocator(selector: string | Locator): Locator {
    try {
      if (typeof selector !== "string") return selector;

      if (selector.startsWith("//") || selector.startsWith("xpath=")) {
        return this.page.locator(`xpath=${selector.replace("xpath=", "")}`);
      }

      return this.page.locator(selector);
    } catch (error: any) {
      console.error("Error in getLocator");
      console.error(`Selector: ${selector}`);
      console.error(`Error: ${error.message}`);
      throw new Error(
        `getLocator failed for selector: ${selector} → ${error.message}`
      );
    }
  }

  /**
   * getElementName
   * -------------------------------------------------------------------------
   * Derives a human-readable element name for logging and debugging.
   *
   * Strategy:
   *  1. If explicitLabel is provided → return it.
   *  2. For Locator:
   *      - Try to map to this.<property> reference
   *      - Fallback to parsing locator.toString()
   *  3. For string selector:
   *      - Use extractLabelFromSelector
   *
   * @param selector - Locator or string selector
   * @param explicitLabel - optional manual name
   * @returns element name for logs
   */
  protected getElementName(
    selector: string | Locator,
    explicitLabel?: string
  ): string {
    if (explicitLabel) return explicitLabel;

    try {
      if (typeof selector !== "string") {
        // Try to map locator to a property on the Page Object
        try {
          for (const key of Object.getOwnPropertyNames(this)) {
            if ((this as any)[key] === selector) {
              return key;
            }
          }
        } catch {
          // ignore
        }

        // Fallback to locator.toString() analysis
        try {
          const locAsString = selector.toString();

          const roleMatch = locAsString.match(/getByRole\((.*?)\)/);
          if (roleMatch) {
            return roleMatch[1].replace(/["{}]/g, "").trim();
          }

          const textMatch = locAsString.match(/getByText\((.*?)\)/);
          if (textMatch) {
            return `text=${textMatch[1].replace(/["]/g, "")}`;
          }

          const testIdMatch = locAsString.match(/getByTestId\((.*?)\)/);
          if (testIdMatch) {
            return `testId=${testIdMatch[1].replace(/["]/g, "")}`;
          }

          const cssMatch = locAsString.match(/locator\("([^"]+)"\)/);
          if (cssMatch) {
            return this.extractLabelFromSelector(cssMatch[1]);
          }

          const xpathMatch = locAsString.match(/locator\('xpath=(.*?)'\)/);
          if (xpathMatch) {
            return this.extractLabelFromSelector(xpathMatch[1]);
          }
        } catch {
          // ignore
        }

        return "UnknownElement";
      }

      return this.extractLabelFromSelector(selector);
    } catch (error: any) {
      console.error(`Error in getElementName: ${error.message}`);
      return "UnknownElement";
    }
  }

  /**
   * extractLabelFromSelector
   * -------------------------------------------------------------------------
   * Converts a low-level selector string into a short label.
   *
   * Examples:
   *  - "#loginBtn"           → "loginBtn"
   *  - ".menu-item.active"   → "menu-item-active"
   *  - "//div[@id='main']"   → "div-id-main"
   *
   * @param selector - raw CSS or XPath selector
   * @returns readable label
   */
  private extractLabelFromSelector(selector: string): string {
    try {
      let clean = selector
        .replace(/^css=/, "")
        .replace(/^xpath=/, "")
        .trim();

      if (clean.startsWith("#")) return clean.slice(1);
      if (clean.startsWith(".")) return clean.replace(/\./g, "-");

      const textMatch = clean.match(/text\((.*?)\)|text=['"](.*?)['"]/);
      if (textMatch) {
        const t = textMatch[1] || textMatch[2];
        return t.trim().replace(/\s+/g, "_");
      }

      if (clean.startsWith("//") || clean.includes("@")) {
        return clean
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .substring(0, 30);
      }

      return clean.substring(0, 30);
    } catch (error: any) {
      console.error(`Error in extractLabelFromSelector: ${error.message}`);
      return "unknown-selector";
    }
  }

  // ==========================================================================
  //  NAVIGATION
  // ==========================================================================

  /**
   * navigateTo
   * -------------------------------------------------------------------------
   * Navigate to a full URL (absolute).
   *
   * Implementation:
   *  - Calls page.goto(url) with waitUntil "domcontentloaded"
   *  - Then waits for "networkidle" using WaitUtils
   *  - Wrapped in ErrorHandler.handle for retry + safe error
   *
   * Example:
   *  await this.navigateTo("https://example.com/login");
   *
   * @param url - absolute URL
   * @returns this
   */
  async navigateTo(url: string): Promise<this> {
    console.log(`Navigate To → ${url}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: Global_Timeout.navigation,
          });

          await WaitUtils.waitForLoadState(
            this.page,
            "networkidle",
            Global_Timeout.navigation
          );

          console.log(`Successfully navigated to → ${url}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to navigate to URL: ${url}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`navigateTo failed → ${url} → ${error.message}`);
        }
      },
      { context: `BasePage.navigateTo (${url})` }
    );
  }

  /**
   * goto
   * -------------------------------------------------------------------------
   * Navigate using baseURL from configManager + relative path.
   *
   * Example:
   *  await this.goto("/dashboard");
   *
   * @param path - relative path, default "/"
   * @returns this
   */
  async goto(path = "/"): Promise<this> {
    const fullUrl = `${configManager.getBaseURL()}${path}`;
    console.log(`Goto → ${fullUrl}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.navigateTo(fullUrl);
          return this;
        } catch (error: any) {
          console.error(`Failed in goto(${path})`);
          console.error(`Error: ${error.message}`);
          throw new Error(`goto failed → ${path} → ${error.message}`);
        }
      },
      { context: `BasePage.goto (${path})` }
    );
  }

  /**
   * reload
   * -------------------------------------------------------------------------
   * Reload the current page.
   *
   * Example:
   *  await this.reload();
   *
   * @returns this
   */
  async reload(): Promise<this> {
    console.log("Reload Page");

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.reload({ waitUntil: "domcontentloaded" });
          console.log("Page reloaded successfully");
          return this;
        } catch (error: any) {
          console.error("Failed to reload page");
          console.error(`Error: ${error.message}`);
          throw new Error(`reload failed → ${error.message}`);
        }
      },
      { context: "BasePage.reload" }
    );
  }

  /**
   * goBack
   * -------------------------------------------------------------------------
   * Browser back navigation.
   *
   * Example:
   *  await this.goBack();
   *
   * @returns this
   */
  async goBack(): Promise<this> {
    console.log("Go Back");

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.goBack({ waitUntil: "domcontentloaded" });
          console.log("Navigation back successful");
          return this;
        } catch (error: any) {
          console.error("Failed to go back");
          console.error(`Error: ${error.message}`);
          throw new Error(`goBack failed → ${error.message}`);
        }
      },
      { context: "BasePage.goBack" }
    );
  }

  /**
   * goForward
   * -------------------------------------------------------------------------
   * Browser forward navigation.
   *
   * Example:
   *  await this.goForward();
   *
   * @returns this
   */
  async goForward(): Promise<this> {
    console.log("Go Forward");

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.goForward({ waitUntil: "domcontentloaded" });
          console.log("Navigation forward successful");
          return this;
        } catch (error: any) {
          console.error("Failed to go forward");
          console.error(`Error: ${error.message}`);
          throw new Error(`goForward failed → ${error.message}`);
        }
      },
      { context: "BasePage.goForward" }
    );
  }

  // ==========================================================================
  //  ELEMENT ACTIONS
  // ==========================================================================

  /**
   * click
   * -------------------------------------------------------------------------
   * Clicks on an element using ElementUtils.click with retries and timeouts.
   *
   * Example:
   *  await this.click(this.loginBtn, { label: "Login Button" });
   *
   * @param selector - Locator or string selector
   * @param options - force, label, retryOptions
   * @returns this
   */
  async click(
    selector: string | Locator,
    options?: {
      force?: boolean;
      label?: string;
      retryOptions?: RetryOptions;
    }
  ): Promise<this> {
    const name = this.getElementName(selector, options?.label);
    console.log(`Click → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await ElementUtils.click(this.getLocator(selector), {
            timeout: Global_Timeout.action,
            ...options,
            label: name,
          });
          console.log(`Successfully clicked → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to click element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`click failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.click (${name})` }
    );
  }

  /**
   * doubleClick
   * -------------------------------------------------------------------------
   * Performs a double-click on the given element.
   *
   * Example:
   *  await this.doubleClick(this.rowItem);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async doubleClick(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Double Click → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).dblclick({
            timeout: Global_Timeout.action,
          });
          console.log(`Successfully double-clicked → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to double-click element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`doubleClick failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.doubleClick (${name})` }
    );
  }

  /**
   * rightClick
   * -------------------------------------------------------------------------
   * Performs a right-click on the given element.
   *
   * Example:
   *  await this.rightClick(this.contextMenuTarget);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async rightClick(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Right Click → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).click({
            button: "right",
            timeout: Global_Timeout.action,
          });
          console.log(`Successfully right-clicked → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to right-click element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`rightClick failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.rightClick (${name})` }
    );
  }

  /**
   * fill
   * -------------------------------------------------------------------------
   * Clears and fills an input field using ElementUtils.fill.
   *
   * Example:
   *  await this.fill(this.username, "admin");
   *
   * @param selector - Locator or string selector
   * @param text - text to fill
   * @param options - label, retryOptions
   * @returns this
   */
  async fill(
    selector: string | Locator,
    text: string,
    options?: {
      label?: string;
      retryOptions?: RetryOptions;
    }
  ): Promise<this> {
    const name = this.getElementName(selector, options?.label);
    console.log(`Fill → ${name} | Value: ${text}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await ElementUtils.fill(this.getLocator(selector), text, {
            timeout: Global_Timeout.action,
            ...options,
            label: name,
          });
          console.log(`Successfully filled → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to fill element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Value: ${text}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`fill failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.fill (${name})` }
    );
  }

  /**
   * type
   * -------------------------------------------------------------------------
   * Types text (character-by-character) using ElementUtils.type.
   *
   * Example:
   *  await this.type(this.searchBox, "Goa", 50);
   *
   * @param selector - Locator or string selector
   * @param text - text to type
   * @param delay - optional delay between keystrokes
   * @param options - label, retryOptions
   * @returns this
   */
  async type(
    selector: string | Locator,
    text: string,
    delay?: number,
    options?: {
      label?: string;
      retryOptions?: RetryOptions;
    }
  ): Promise<this> {
    const name = this.getElementName(selector, options?.label);
    console.log(
      `Type → ${name} | Value: ${text} | Delay: ${delay ?? 0}ms`
    );

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await ElementUtils.type(this.getLocator(selector), text, {
            timeout: Global_Timeout.action,
            delay,
            ...options,
            label: name,
          });
          console.log(`Successfully typed into → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to type into element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Value: ${text}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`type failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.type (${name})` }
    );
  }

  /**
   * clear
   * -------------------------------------------------------------------------
   * Clears the content of an input element using ElementUtils.clear.
   *
   * Example:
   *  await this.clear(this.searchBox);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async clear(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Clear → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await ElementUtils.clear(this.getLocator(selector));
          console.log(`Successfully cleared → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to clear element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`clear failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.clear (${name})` }
    );
  }

  /**
   * selectOption
   * -------------------------------------------------------------------------
   * Selects an option (or multiple) from a native <select> element.
   *
   * Example:
   *  await this.selectOption(this.countrySelect, "IN");
   *
   * @param selector - Locator or string selector
   * @param value - value or array of values
   * @returns this
   */
  async selectOption(
    selector: string | Locator,
    value: string | string[]
  ): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Select Option → ${name} | Value: ${JSON.stringify(value)}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).selectOption(value, {
            timeout: Global_Timeout.action,
          });
          console.log(`Successfully selected option → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to select option: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Value: ${JSON.stringify(value)}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `selectOption failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.selectOption (${name})` }
    );
  }

  /**
   * check
   * -------------------------------------------------------------------------
   * Checks a checkbox or radio button.
   *
   * Example:
   *  await this.check(this.termsCheckbox);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async check(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Check → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).check({
            timeout: Global_Timeout.action,
          });
          console.log(`Successfully checked → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to check element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`check failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.check (${name})` }
    );
  }

  /**
   * uncheck
   * -------------------------------------------------------------------------
   * Unchecks a checkbox.
   *
   * Example:
   *  await this.uncheck(this.subscribeCheckbox);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async uncheck(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Uncheck → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).uncheck({
            timeout: Global_Timeout.action,
          });
          console.log(`Successfully unchecked → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to uncheck element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`uncheck failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.uncheck (${name})` }
    );
  }

  /**
   * hover
   * -------------------------------------------------------------------------
   * Hovers the mouse over the given element.
   *
   * Example:
   *  await this.hover(this.menuItem);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async hover(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Hover → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).hover({
            timeout: Global_Timeout.action,
          });
          console.log(`Successfully hovered → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to hover over element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`hover failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.hover (${name})` }
    );
  }

  /**
   * focus
   * -------------------------------------------------------------------------
   * Sets focus on the given element.
   *
   * Example:
   *  await this.focus(this.searchBox);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async focus(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Focus → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).focus({
            timeout: Global_Timeout.action,
          });
          console.log(`Successfully focused → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to focus element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`focus failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.focus (${name})` }
    );
  }

  /**
   * press
   * -------------------------------------------------------------------------
   * Presses a keyboard key (e.g., "Enter") on the element.
   *
   * Example:
   *  await this.press(this.searchBox, "Enter");
   *
   * @param selector - Locator or string selector
   * @param key - key string, e.g. "Enter"
   * @returns this
   */
  async press(selector: string | Locator, key: string): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Press → ${name} | Key: ${key}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).press(key, {
            timeout: Global_Timeout.action,
          });
          console.log(`Successfully pressed key "${key}" on → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to press key on element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Key: ${key}`);
          console.error(`Error: ${error.message}`);
          throw new Error(`press failed → ${name} → ${error.message}`);
        }
      },
      { context: `BasePage.press (${name})` }
    );
  }

  // ==========================================================================
  //  WAIT METHODS
  // ==========================================================================

  /**
   * waitForElementIsVisible
   * -------------------------------------------------------------------------
   * Waits until the given element is visible using WaitUtils.
   *
   * Example:
   *  await this.waitForElementIsVisible(this.loader, 10000);
   *
   * @param selector - Locator or string selector
   * @param timeout - optional timeout, default Global_Timeout.wait
   * @returns this
   */
  async waitForElementIsVisible(
    selector: string | Locator,
    timeout?: number
  ): Promise<this> {
    const name = this.getElementName(selector);
    const waitTime = timeout || Global_Timeout.wait;
    console.log(`Wait For Visible → ${name} (Timeout: ${waitTime}ms)`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await WaitUtils.waitForElementIsVisible(
            this.getLocator(selector),
            waitTime
          );
          console.log(`Element visible → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Element did not become visible: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Timeout: ${waitTime}ms`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `waitForElementIsVisible failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.waitForElementIsVisible (${name})` }
    );
  }

  /**
   * waitForElementToDisappear
   * -------------------------------------------------------------------------
   * Waits until the given element disappears (hidden or detached).
   *
   * Example:
   *  await this.waitForElementToDisappear(this.loader);
   *
   * @param selector - Locator or string selector
   * @param timeout - optional timeout, default Global_Timeout.wait
   * @returns this
   */
  async waitForElementToDisappear(
    selector: string | Locator,
    timeout?: number
  ): Promise<this> {
    const name = this.getElementName(selector);
    const waitTime = timeout || Global_Timeout.wait;
    console.log(
      `Wait For Disappear → ${name} (Timeout: ${waitTime}ms)`
    );

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await WaitUtils.waitForElementToDisappear(
            this.getLocator(selector),
            waitTime
          );
          console.log(`Element disappeared → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Element did not disappear: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Timeout: ${waitTime}ms`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `waitForElementToDisappear failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.waitForElementToDisappear (${name})` }
    );
  }

  /**
   * waitForElementEnabled
   * -------------------------------------------------------------------------
   * Waits until the element is enabled using expect().toBeEnabled().
   *
   * Example:
   *  await this.waitForElementEnabled(this.submitBtn);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async waitForElementEnabled(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Wait For Enabled → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.getLocator(selector)).toBeEnabled({
            timeout: Global_Timeout.wait,
          });
          console.log(`Element enabled → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Element did not become enabled: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `waitForElementEnabled failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.waitForElementEnabled (${name})` }
    );
  }

  /**
   * waitForURL
   * -------------------------------------------------------------------------
   * Waits for the page URL to match the given string or RegExp.
   *
   * Example:
   *  await this.waitForURL(/dashboard/);
   *
   * @param url - expected URL or regex
   * @returns this
   */
  async waitForURL(url: string | RegExp): Promise<this> {
    console.log(`Wait For URL → ${url}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.waitForURL(url, {
            timeout: Global_Timeout.navigation,
          });
          console.log(`URL matched → ${url}`);
          return this;
        } catch (error: any) {
          console.error(`URL did not match: ${url}`);
          console.error(`Current URL: ${this.page.url()}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `waitForURL failed → expected: ${url} → ${error.message}`
          );
        }
      },
      { context: `BasePage.waitForURL (${url})` }
    );
  }

  /**
   * waitForLoadState
   * -------------------------------------------------------------------------
   * Waits for the page to reach a given load state.
   *
   * Example:
   *  await this.waitForLoadState("networkidle");
   *
   * @param state - "load" | "domcontentloaded" | "networkidle"
   * @returns this
   */
  async waitForLoadState(
    state: "load" | "domcontentloaded" | "networkidle" = "load"
  ): Promise<this> {
    console.log(`Wait For LoadState → ${state}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.waitForLoadState(state, {
            timeout: Global_Timeout.navigation,
          });
          console.log(`LoadState reached → ${state}`);
          return this;
        } catch (error: any) {
          console.error(`LoadState not reached: ${state}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `waitForLoadState failed → ${state} → ${error.message}`
          );
        }
      },
      { context: `BasePage.waitForLoadState (${state})` }
    );
  }

  /**
   * waitForTextOnPage
   * -------------------------------------------------------------------------
   * Waits until given text appears anywhere on the page.
   *
   * Example:
   *  await this.waitForTextOnPage("Booking confirmed", 10000);
   *
   * @param text - string or RegExp to match
   * @param timeout - optional timeout
   * @returns this
   */
  async waitForTextOnPage(
    text: string | RegExp,
    timeout?: number
  ): Promise<this> {
    const waitTime = timeout || Global_Timeout.wait;
    console.log(`Wait For Text → ${text} (Timeout: ${waitTime}ms)`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.page.getByText(text)).toBeVisible({
            timeout: waitTime,
          });
          console.log(`Text appeared → ${text}`);
          return this;
        } catch (error: any) {
          console.error(`Text did not appear: ${text}`);
          console.error(`Timeout: ${waitTime}ms`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `waitForTextOnPage failed → ${text} → ${error.message}`
          );
        }
      },
      { context: `BasePage.waitForTextOnPage (${text})` }
    );
  }

  /**
   * waitForTextDisappear
   * -------------------------------------------------------------------------
   * Waits until given text disappears from the page.
   *
   * Example:
   *  await this.waitForTextDisappear("Loading...");
   *
   * @param text - string or RegExp
   * @param timeout - optional timeout
   * @returns this
   */
  async waitForTextDisappear(
    text: string | RegExp,
    timeout?: number
  ): Promise<this> {
    const waitTime = timeout || Global_Timeout.wait;
    console.log(
      `Wait For Text Disappear → ${text} (Timeout: ${waitTime}ms)`
    );

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.page.getByText(text)).not.toBeVisible({
            timeout: waitTime,
          });
          console.log(`Text disappeared → ${text}`);
          return this;
        } catch (error: any) {
          console.error(`Text did not disappear: ${text}`);
          console.error(`Timeout: ${waitTime}ms`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `waitForTextDisappear failed → ${text} → ${error.message}`
          );
        }
      },
      { context: `BasePage.waitForTextDisappear (${text})` }
    );
  }

  // ==========================================================================
  //  ASSERTIONS
  // ==========================================================================

  /**
   * assertElementVisible
   * -------------------------------------------------------------------------
   * Asserts that element is visible.
   *
   * Example:
   *  await this.assertElementVisible(this.confirmationMessage);
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async assertElementVisible(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Assert Visible → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.getLocator(selector)).toBeVisible({
            timeout: Global_Timeout.wait,
          });
          console.log(`Assertion passed → ${name} is visible`);
          return this;
        } catch (error: any) {
          console.error(`Assertion failed: ${name} is not visible`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertElementVisible failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertElementVisible (${name})` }
    );
  }

  /**
   * assertElementHidden
   * -------------------------------------------------------------------------
   * Asserts that element is hidden.
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async assertElementHidden(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Assert Hidden → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.getLocator(selector)).toBeHidden({
            timeout: Global_Timeout.wait,
          });
          console.log(`Assertion passed → ${name} is hidden`);
          return this;
        } catch (error: any) {
          console.error(`Assertion failed: ${name} is not hidden`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertElementHidden failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertElementHidden (${name})` }
    );
  }

  /**
   * assertElementEnabled
   * -------------------------------------------------------------------------
   * Asserts that element is enabled.
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async assertElementEnabled(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Assert Enabled → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.getLocator(selector)).toBeEnabled({
            timeout: Global_Timeout.wait,
          });
          console.log(`Assertion passed → ${name} is enabled`);
          return this;
        } catch (error: any) {
          console.error(`Assertion failed: ${name} is not enabled`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertElementEnabled failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertElementEnabled (${name})` }
    );
  }

  /**
   * assertElementDisabled
   * -------------------------------------------------------------------------
   * Asserts that element is disabled.
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async assertElementDisabled(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Assert Disabled → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.getLocator(selector)).toBeDisabled({
            timeout: Global_Timeout.wait,
          });
          console.log(`Assertion passed → ${name} is disabled`);
          return this;
        } catch (error: any) {
          console.error(`Assertion failed: ${name} is not disabled`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertElementDisabled failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertElementDisabled (${name})` }
    );
  }

  /**
   * assertText
   * -------------------------------------------------------------------------
   * Asserts that element has given text.
   *
   * @param selector - Locator or string selector
   * @param text - expected text or RegExp
   * @returns this
   */
  async assertText(
    selector: string | Locator,
    text: string | RegExp
  ): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Assert Text → ${name} == ${text}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.getLocator(selector)).toHaveText(text, {
            timeout: Global_Timeout.wait,
          });
          console.log(`Assertion passed → ${name} has correct text`);
          return this;
        } catch (error: any) {
          console.error(`Assertion failed: Text mismatch for ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Expected: ${text}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertText failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertText (${name})` }
    );
  }

  /**
   * assertValue
   * -------------------------------------------------------------------------
   * Asserts that input has given value.
   *
   * @param selector - Locator or string selector
   * @param value - expected value or RegExp
   * @returns this
   */
  async assertValue(
    selector: string | Locator,
    value: string | RegExp
  ): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Assert Value → ${name} == ${value}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.getLocator(selector)).toHaveValue(value, {
            timeout: Global_Timeout.wait,
          });
          console.log(`Assertion passed → ${name} has correct value`);
          return this;
        } catch (error: any) {
          console.error(`Assertion failed: Value mismatch for ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Expected: ${value}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertValue failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertValue (${name})` }
    );
  }

  /**
   * assertURL
   * -------------------------------------------------------------------------
   * Asserts that the current page URL matches expected value.
   *
   * @param url - expected URL or RegExp
   * @returns this
   */
  async assertURL(url: string | RegExp): Promise<this> {
    console.log(`Assert URL → ${url}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.page).toHaveURL(url, {
            timeout: Global_Timeout.wait,
          });
          console.log("Assertion passed → URL is correct");
          return this;
        } catch (error: any) {
          console.error("Assertion failed: URL mismatch");
          console.error(`Expected: ${url}`);
          console.error(`Actual: ${this.page.url()}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertURL failed → expected: ${url} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertURL (${url})` }
    );
  }

  /**
   * assertTitle
   * -------------------------------------------------------------------------
   * Asserts that current page title matches expected value.
   *
   * @param title - expected title or RegExp
   * @returns this
   */
  async assertTitle(title: string | RegExp): Promise<this> {
    console.log(`Assert Title → ${title}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.page).toHaveTitle(title, {
            timeout: Global_Timeout.wait,
          });
          console.log("Assertion passed → Title is correct");
          return this;
        } catch (error: any) {
          const actualTitle = await this.page.title();
          console.error("Assertion failed: Title mismatch");
          console.error(`Expected: ${title}`);
          console.error(`Actual: ${actualTitle}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertTitle failed → expected: ${title} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertTitle (${title})` }
    );
  }

  /**
   * assertElementCount
   * -------------------------------------------------------------------------
   * Asserts that number of matched elements equals expected count.
   *
   * @param selector - Locator or string selector
   * @param count - expected count
   * @returns this
   */
  async assertElementCount(
    selector: string | Locator,
    count: number
  ): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Assert Count → ${name} = ${count}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await expect(this.getLocator(selector)).toHaveCount(count, {
            timeout: Global_Timeout.wait,
          });
          console.log(`Assertion passed → ${name} count is ${count}`);
          return this;
        } catch (error: any) {
          const actualCount = await this.getLocator(selector).count();
          console.error(
            `Assertion failed: Count mismatch for ${name}`
          );
          console.error(`Selector: ${selector}`);
          console.error(`Expected: ${count}`);
          console.error(`Actual: ${actualCount}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `assertElementCount failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.assertElementCount (${name})` }
    );
  }

  // ==========================================================================
  //  QUERY METHODS (NON-ASSERTING)
  // ==========================================================================

  /**
   * isVisible
   * -------------------------------------------------------------------------
   * Immediate visibility check without waiting.
   *
   * @param selector - Locator or string selector
   * @returns boolean
   */
  async isVisible(selector: string | Locator): Promise<boolean> {
    const name = this.getElementName(selector);
    console.log(`isVisible → ${name}`);

    return ErrorHandler.handle<boolean>(
      async () => {
        try {
          return await this.getLocator(selector).isVisible();
        } catch (error: any) {
          console.error(`isVisible failed for: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `isVisible failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.isVisible (${name})` }
    );
  }

  /**
   * isEnabled
   * -------------------------------------------------------------------------
   * Checks whether element is enabled.
   *
   * @param selector - Locator or string selector
   * @returns boolean
   */
  async isEnabled(selector: string | Locator): Promise<boolean> {
    const name = this.getElementName(selector);
    console.log(`isEnabled → ${name}`);

    return ErrorHandler.handle<boolean>(
      async () => {
        try {
          return await this.getLocator(selector).isEnabled();
        } catch (error: any) {
          console.error(`isEnabled failed for: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `isEnabled failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.isEnabled (${name})` }
    );
  }

  /**
   * isChecked
   * -------------------------------------------------------------------------
   * Checks whether a checkbox or radio is checked.
   *
   * @param selector - Locator or string selector
   * @returns boolean
   */
  async isChecked(selector: string | Locator): Promise<boolean> {
    const name = this.getElementName(selector);
    console.log(`isChecked → ${name}`);

    return ErrorHandler.handle<boolean>(
      async () => {
        try {
          return await this.getLocator(selector).isChecked();
        } catch (error: any) {
          console.error(`isChecked failed for: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `isChecked failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.isChecked (${name})` }
    );
  }

  /**
   * getText
   * -------------------------------------------------------------------------
   * Returns trimmed textContent of element.
   *
   * @param selector - Locator or string selector
   * @returns string
   */
  async getText(selector: string | Locator): Promise<string> {
    const name = this.getElementName(selector);
    console.log(`getText → ${name}`);

    return ErrorHandler.handle<string>(
      async () => {
        try {
          return (await this.getLocator(selector).textContent())?.trim() || "";
        } catch (error: any) {
          console.error(`getText failed for: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `getText failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.getText (${name})` }
    );
  }

  /**
   * getInputValue
   * -------------------------------------------------------------------------
   * Returns value of input or textarea.
   *
   * @param selector - Locator or string selector
   * @returns string
   */
  async getInputValue(selector: string | Locator): Promise<string> {
    const name = this.getElementName(selector);
    console.log(`getInputValue → ${name}`);

    return ErrorHandler.handle<string>(
      async () => {
        try {
          return await this.getLocator(selector).inputValue();
        } catch (error: any) {
          console.error(`getInputValue failed for: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `getInputValue failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.getInputValue (${name})` }
    );
  }

  /**
   * getAttribute
   * -------------------------------------------------------------------------
   * Returns attribute value of element if present.
   *
   * @param selector - Locator or string selector
   * @param attribute - attribute name
   * @returns string | null
   */
  async getAttribute(
    selector: string | Locator,
    attribute: string
  ): Promise<string | null> {
    const name = this.getElementName(selector);
    console.log(`getAttribute → ${name}[${attribute}]`);

    return ErrorHandler.handle<string | null>(
      async () => {
        try {
          return await this.getLocator(selector).getAttribute(attribute);
        } catch (error: any) {
          console.error(`getAttribute failed for: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Attribute: ${attribute}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `getAttribute failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.getAttribute (${name})` }
    );
  }

  /**
   * getElementCount
   * -------------------------------------------------------------------------
   * Returns number of elements matching the selector.
   *
   * @param selector - Locator or string selector
   * @returns number
   */
  async getElementCount(selector: string | Locator): Promise<number> {
    const name = this.getElementName(selector);
    console.log(`getElementCount → ${name}`);

    return ErrorHandler.handle<number>(
      async () => {
        try {
          return await this.getLocator(selector).count();
        } catch (error: any) {
          console.error(`getElementCount failed for: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `getElementCount failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.getElementCount (${name})` }
    );
  }

  // ==========================================================================
  //  DIALOG HANDLING
  // ==========================================================================

  /**
   * acceptDialog
   * -------------------------------------------------------------------------
   * Registers a one-time handler to accept the next JavaScript dialog.
   *
   * Example:
   *  await this.acceptDialog();
   *  await this.click(this.deleteButton); // when dialog appears → auto accept
   *
   * @param promptText - optional text to send to prompt
   * @returns this
   */
  async acceptDialog(promptText?: string): Promise<this> {
    console.log("Preparing to accept next dialog");

    try {
      this.page.once("dialog", (dialog) => {
        console.log("Dialog appeared → Accept");
        dialog.accept(promptText);
      });
      return this;
    } catch (error: any) {
      console.error("Failed to register acceptDialog handler");
      console.error(`Error: ${error.message}`);
      throw new Error(`acceptDialog failed → ${error.message}`);
    }
  }

  /**
   * dismissDialog
   * -------------------------------------------------------------------------
   * Registers a one-time handler to dismiss the next JavaScript dialog.
   *
   * Example:
   *  await this.dismissDialog();
   *  await this.click(this.cancelButton);
   *
   * @returns this
   */
  async dismissDialog(): Promise<this> {
    console.log("Preparing to dismiss next dialog");

    try {
      this.page.once("dialog", (dialog) => {
        console.log("Dialog appeared → Dismiss");
        dialog.dismiss();
      });
      return this;
    } catch (error: any) {
      console.error("Failed to register dismissDialog handler");
      console.error(`Error: ${error.message}`);
      throw new Error(`dismissDialog failed → ${error.message}`);
    }
  }

  // ==========================================================================
  //  IFRAME HANDLING
  // ==========================================================================

  /**
   * switchToFrame
   * -------------------------------------------------------------------------
   * Switches context to an iframe and returns its Page-like Frame.
   *
   * Example:
   *  const frame = await this.switchToFrame(this.paymentIframe);
   *  await frame.click("button.pay-now");
   *
   * @param selector - iframe locator or selector
   * @returns Page (actually Frame typed as Page for convenience)
   */
  async switchToFrame(selector: string | Locator): Promise<Page> {
    const name = this.getElementName(selector);
    console.log(`Switch To Frame → ${name}`);

    return ErrorHandler.handle<Page>(
      async () => {
        try {
          const frameElement = this.getLocator(selector);
          const frame = await frameElement.contentFrame();
          if (!frame) {
            throw new Error(`Frame not found: ${name}`);
          }
          console.log(`Switched to frame → ${name}`);
          return frame as unknown as Page;
        } catch (error: any) {
          console.error(`Failed to switch to frame: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `switchToFrame failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.switchToFrame (${name})` }
    );
  }

  // ==========================================================================
  //  SCROLL METHODS
  // ==========================================================================

  /**
   * scrollToElement
   * -------------------------------------------------------------------------
   * Scrolls the element into view using scrollIntoViewIfNeeded.
   *
   * @param selector - Locator or string selector
   * @returns this
   */
  async scrollToElement(selector: string | Locator): Promise<this> {
    const name = this.getElementName(selector);
    console.log(`Scroll To Element → ${name}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.getLocator(selector).scrollIntoViewIfNeeded({
            timeout: 5000,
          });
          console.log(`Scrolled to element → ${name}`);
          return this;
        } catch (error: any) {
          console.error(`Failed to scroll to element: ${name}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `scrollToElement failed → ${name} → ${error.message}`
          );
        }
      },
      { context: `BasePage.scrollToElement (${name})` }
    );
  }

  /**
   * scrollToTop
   * -------------------------------------------------------------------------
   * Scrolls to the top of the page.
   *
   * @returns this
   */
  async scrollToTop(): Promise<this> {
    console.log("Scroll To Top");

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.evaluate(() => {
            window.scrollTo(0, 0);
          });
          console.log("Scrolled to page top");
          return this;
        } catch (error: any) {
          console.error("Failed to scroll to top");
          console.error(`Error: ${error.message}`);
          throw new Error(`scrollToTop failed → ${error.message}`);
        }
      },
      { context: "BasePage.scrollToTop" }
    );
  }

  /**
   * scrollToBottom
   * -------------------------------------------------------------------------
   * Scrolls to the bottom of the page.
   *
   * @returns this
   */
  async scrollToBottom(): Promise<this> {
    console.log("Scroll To Bottom");

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          console.log("Scrolled to page bottom");
          return this;
        } catch (error: any) {
          console.error("Failed to scroll to bottom");
          console.error(`Error: ${error.message}`);
          throw new Error(`scrollToBottom failed → ${error.message}`);
        }
      },
      { context: "BasePage.scrollToBottom" }
    );
  }

  /**
   * scrollBy
   * -------------------------------------------------------------------------
   * Scrolls the page by given x and y offsets.
   *
   * @param x - horizontal offset
   * @param y - vertical offset
   * @returns this
   */
  async scrollBy(x: number, y: number): Promise<this> {
    console.log(`Scroll By → x=${x}, y=${y}`);

    return ErrorHandler.handle<this>(
      async () => {
        try {
          await this.page.evaluate(
            ({ scrollX, scrollY }) => {
              window.scrollBy(scrollX, scrollY);
            },
            { scrollX: x, scrollY: y }
          );
          console.log(`Scrolled by x=${x}, y=${y}`);
          return this;
        } catch (error: any) {
          console.error("Failed to scrollBy");
          console.error(`Error: ${error.message}`);
          throw new Error(`scrollBy failed → ${error.message}`);
        }
      },
      { context: "BasePage.scrollBy" }
    );
  }

  // ==========================================================================
  //  SCREENSHOT METHODS
  // ==========================================================================

  /**
   * takeScreenshot
   * -------------------------------------------------------------------------
   * Takes a full page screenshot and stores under test-results/screenshots.
   *
   * @param name - base name for screenshot file
   */
  async takeScreenshot(name = "screenshot"): Promise<void> {
    const fileName = `${name}_${Date.now()}.png`;
    console.log(`Full Screenshot → ${fileName}`);

    return ErrorHandler.handle<void>(
      async () => {
        try {
          await this.page.screenshot({
            path: `test-results/screenshots/${fileName}`,
            fullPage: true,
          });
        } catch (error: any) {
          console.error(
            `Failed to capture full screenshot: ${fileName}`
          );
          console.error(`Error: ${error.message}`);
          throw new Error(
            `takeScreenshot failed → ${fileName} → ${error.message}`
          );
        }
      },
      { context: `BasePage.takeScreenshot (${fileName})` }
    );
  }

  /**
   * takeElementScreenshot
   * -------------------------------------------------------------------------
   * Takes screenshot of a specific element.
   *
   * @param selector - element selector
   * @param name - base file name
   */
  async takeElementScreenshot(
    selector: string | Locator,
    name = "element"
  ): Promise<void> {
    const elemName = this.getElementName(selector);
    const fileName = `${name}_${Date.now()}.png`;
    console.log(
      `Element Screenshot → ${elemName} → ${fileName}`
    );

    return ErrorHandler.handle<void>(
      async () => {
        try {
          await this.getLocator(selector).screenshot({
            path: `test-results/screenshots/${fileName}`,
          });
        } catch (error: any) {
          console.error(
            `Failed to capture element screenshot: ${elemName}`
          );
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `takeElementScreenshot failed → ${elemName} → ${error.message}`
          );
        }
      },
      { context: `BasePage.takeElementScreenshot (${elemName})` }
    );
  }

  // ==========================================================================
  //  MISC UTILITIES
  // ==========================================================================

  /**
   * getCurrentURL
   * -------------------------------------------------------------------------
   * Returns current page URL.
   *
   * @returns string
   */
  getCurrentURL(): string {
    try {
      const url = this.page.url();
      console.log(`getCurrentURL → ${url}`);
      return url;
    } catch (error: any) {
      console.error("getCurrentURL failed");
      console.error(`Error: ${error.message}`);
      throw new Error(`getCurrentURL failed → ${error.message}`);
    }
  }

  /**
   * getTitle
   * -------------------------------------------------------------------------
   * Returns current page title.
   *
   * @returns string
   */
  async getTitle(): Promise<string> {
    try {
      const title = await this.page.title();
      console.log(`getTitle → ${title}`);
      return title;
    } catch (error: any) {
      console.error("getTitle failed");
      console.error(`Error: ${error.message}`);
      throw new Error(`getTitle failed → ${error.message}`);
    }
  }

  /**
   * getPage
   * -------------------------------------------------------------------------
   * Returns underlying Playwright Page instance.
   *
   * @returns Page
   */
  getPage(): Page {
    console.log("getPage → Playwright.Page returned");
    return this.page;
  }

  /**
   * pause
   * -------------------------------------------------------------------------
   * Hard wait using page.waitForTimeout. Use mainly for debugging.
   *
   * @param milliseconds - time to wait, default 1000
   * @returns this
   */
  async pause(milliseconds?: number): Promise<this> {
    const ms = milliseconds || 1000;
    console.log(`pause → ${ms}ms`);

    try {
      await this.page.waitForTimeout(ms);
      return this;
    } catch (error: any) {
      console.error("pause failed");
      console.error(`Error: ${error.message}`);
      throw new Error(`pause failed → ${error.message}`);
    }
  }

  // ==========================================================================
  //  RUNTIME STORE HELPERS (Testsigma-style)
  // ==========================================================================

  /**
   * storeTextContent
   * -------------------------------------------------------------------------
   * Reads textContent from an element and stores it into Runtime under a key.
   *
   * Flow:
   *  1. Convert selector to Locator
   *  2. Wait until visible
   *  3. Read textContent, trim it
   *  4. Runtime.set(key, value)
   *
   * Example:
   *  await this.storeTextContent(this.hotelName, "HOTEL_NAME");
   *  // Later:
   *  console.log(Runtime.get("HOTEL_NAME"));
   *
   * @param selector - Locator or string
   * @param key - runtime store key
   */
  async storeTextContent(
    selector: Locator | string,
    key: string
  ): Promise<void> {
    return ErrorHandler.handle<void>(
      async () => {
        try {
          const loc = this.getLocator(selector);

          await loc.waitFor({
            state: "visible",
            timeout: Global_Timeout.wait,
          });

          const rawText = await loc.textContent();
          const value = rawText?.trim() || "";

          Runtime.set(key, value);
          console.log(`Text stored → ${key}: "${value}"`);
        } catch (error: any) {
          console.error(`Failed to store text for key: ${key}`);
          console.error(`Selector: ${selector}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `storeTextContent failed → ${key} → ${error.message}`
          );
        }
      },
      { context: `BasePage.storeTextContent (${key})` }
    );
  }

  /**
   * storeInputValue
   * -------------------------------------------------------------------------
   * Reads inputValue from a field and stores it into Runtime.
   *
   * If inputValue fails (non-input element), it stores empty string.
   *
   * Example:
   *  await this.storeInputValue(this.cityInput, "CITY");
   *  console.log(Runtime.get("CITY"));
   *
   * @param selector - input/textarea selector or Locator
   * @param key - runtime key
   */
  async storeInputValue(
    selector: Locator | string,
    key: string
  ): Promise<void> {
    return ErrorHandler.handle<void>(
      async () => {
        let value = "";
        try {
          const loc = this.getLocator(selector);
          value = (await loc.inputValue())?.trim();
        } catch {
          value = "";
        }

        try {
          Runtime.set(key, value);
          console.log(`Input value stored → ${key}: "${value}"`);
        } catch (error: any) {
          console.error(`Failed to store input value for key: ${key}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `storeInputValue failed → ${key} → ${error.message}`
          );
        }
      },
      { context: `BasePage.storeInputValue (${key})` }
    );
  }

  /**
   * storeAttributeValue
   * -------------------------------------------------------------------------
   * Reads a given attribute from element and stores it into Runtime.
   *
   * Example:
   *  await this.storeAttributeValue(this.hotelCard, "data-id", "HOTEL_ID");
   *  console.log(Runtime.get("HOTEL_ID"));
   *
   * @param selector - element selector
   * @param attribute - attribute name
   * @param key - runtime key
   */
  async storeAttributeValue(
    selector: Locator | string,
    attribute: string,
    key: string
  ): Promise<void> {
    return ErrorHandler.handle<void>(
      async () => {
        try {
          const loc = this.getLocator(selector);
          const value = (await loc.getAttribute(attribute))?.trim() || "";
          Runtime.set(key, value);
          console.log(
            `Attribute stored → ${key} [${attribute}]: "${value}"`
          );
        } catch (error: any) {
          console.error(
            `Failed to store attribute for key: ${key}`
          );
          console.error(`Selector: ${selector}`);
          console.error(`Attribute: ${attribute}`);
          console.error(`Error: ${error.message}`);
          throw new Error(
            `storeAttributeValue failed → ${key} → ${error.message}`
          );
        }
      },
      { context: `BasePage.storeAttributeValue (${key})` }
    );
  }
}
