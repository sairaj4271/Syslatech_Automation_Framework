import { BasePage } from "./basePage";
import { Page, Locator, expect } from "@playwright/test";
import { formatToday, formatDateAfterDays, NumberUtils,cleanAndConvertToDDMMYYYY } from "../utils/commonUtils";
import { configManager } from "../config/env.index";
import { number, string } from "zod";
import { Runtime } from "@utils/runtimeStore";




export class EasyMyTripPageForFlight extends BasePage {

    flightTab: Locator;
     RoundTrip  : Locator; 
    departureAirport    : Locator;
    fromAirportInput: Locator;
    DestinationAirport: Locator;
    toAirportInput: Locator;
    TravelDate : Locator;
    //todayDate: Locator;
    retrunTravelDate: any;
    //retrunDate: Locator;
    adultcount: Locator;
    adultplus: Locator;
    childplus: Locator;
    DoneButton: Locator;
    searchButton: Locator;
    loader: Locator;
    chennaiOption: Locator;
    bangaloreOption: Locator;
    guest: Locator;
    businessClassOption: Locator;  
    datetoday: any;

    constructor(page: Page) {
        super(page);    

        this.flightTab =this.getLocator('(//*[text()="FLIGHT+HOTEL"] | //*[text()="Flight + Hotel"])[1]');
        this.departureAirport = this.getLocator('(//*[text()="Departure Airport"])[1]');
        this.fromAirportInput = this.getLocator('(//div[@id="fromautoFill_in"]//input[@type="text"])[1]');
        this.DestinationAirport = this.getLocator('(//*[text()="Destination Airport"])[1]');
        this.toAirportInput = this.getLocator('(//div[@id="toautoFill_in"]//input[@type="text"])[1]');
        this.TravelDate = this.getLocator('//*[@id="Oneway"]');
      // this.todayDate = this.getLocator('`(//span[text()="${this.datetoday}"])[1]`')
        this.retrunTravelDate = this.getLocator('//*[@id="roundTripDate"]')
      //  this.retrunDate = this.getLocator('(//span[contains(text(),$("SelectedReturnDate"))])[2]')
        this.RoundTrip = this.getLocator('//*[text()=" Round Trip "]');
        this.adultcount = this.getLocator('//*[@name="quantity"]');
        this.adultplus = this.getLocator('//*[@class="add plus_box1"]');
        this.childplus = this.getLocator('(//*[@field="quantity1"])[2]');
        this.DoneButton = this.getLocator('//*[text()="Done"]');
        this.searchButton = this.getLocator('//button[@type="submit"]');
        this.loader = this.getLocator('//*[@id="Loader"]');
        this.chennaiOption = this.getLocator('//*[text()="Chennai(MAA)"]');
        this.bangaloreOption = this.getLocator('//*[text()="Bengaluru(BLR)"]');
        this.guest = this.getLocator('//*[text()="Guests & Class "]');
        this.businessClassOption = this.getLocator('//*[text()=" Business "]');

    }

    async easyMyTripFlightBookingPage() {

        await this.page.goto(configManager.geteasyURL());
        await this.click(this.flightTab);
        await this.click(this.RoundTrip);
        await this.click(this.departureAirport);
        await this.type(this.fromAirportInput, "chennai");
        await this.click(this.chennaiOption);
        await this.click(this.DestinationAirport);
        await this.type(this.toAirportInput, "bangalore");  
        await this.click(this.bangaloreOption);
        
}
   async selectFlightDates() {

        await this.click(this.TravelDate);
        Runtime.set("SelectedFlightDate", formatToday("dd"));
           
        await this.page.locator(`(//span[contains(text(),"${$("SelectedFlightDate")}")])[1]`).click();
              
       
        await this.click(this.retrunTravelDate);
        Runtime.set("SelectedReturnDate", formatDateAfterDays(5,"dd"));
        await this.page.locator(`(//span[contains(text(),"${$("SelectedReturnDate")}")])[2]`).click();
        
   }

    async selectPassengers() {
        await this.click(this.guest);
         await this.storeInputValue(this.adultcount, "AdultCounts");

         if($("AdultCounts")=="1") {
            await this.click(this.adultplus);
            console.log("Adult count increased to 2");
            }
        await this.storeInputValue(this.adultcount, "AdultCounts");
         if ($("AdultCounts")=="2") {
            await this.click(this.childplus);
            console.log("Child count increased to 1");
            
         }

        await this.click(this.businessClassOption);
        await this.click(this.DoneButton);
        await this.click(this.searchButton);
        await this.waitForElementToDisappear(this.loader);

       


    }


















}