import { BasePage } from "./basePage";
import { Page, Locator, expect } from "@playwright/test";
import { formatToday, formatDateAfterDays, NumberUtils,cleanAndConvertToDDMMYYYY } from "../utils/commonUtils";
import { configManager } from "../config/env.index";
import { number, string } from "zod";
import { Runtime } from "@utils/runtimeStore";
  




export class multicity extends BasePage{


   flightTab: Locator; 


     constructor(page:Page){
       super(page)

        this.flightTab =this.getLocator('(//*[text()="FLIGHTS"])[1]');


       }

}

