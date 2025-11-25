import { BasePage } from "./basePage";
import { Page, Locator, expect } from "@playwright/test";
import { formatToday, formatDateAfterDays, NumberUtils,cleanAndConvertToDDMMYYYY } from "../utils/commonUtils";
import { configManager } from "../config/env.index";
import { number, string } from "zod";
import { Runtime } from "@utils/runtimeStore";

export class EasyMyTripPage extends BasePage {
  hotelBooking: Locator;
  enterCityName: Locator;
  enteringCityName: Locator;
  check_In: Locator;
  check_out: Locator;
  room_guests: Locator;
  adult_plus: Locator;
  adult_count: Locator;
  child_plus: Locator;
  child_count: Locator;
  ages: Locator;
  addRoom: Locator;
  Room_2: Locator;
  adult_2: Locator;
  adult_count_2: Locator;
  child_2: Locator;
  child_count_2: Locator;
  done: Locator;
  searchHotels: Locator;
  afterenteredCityName: Locator;
  enteredCityName: string = "";
  roomStored: Locator;
  RoomStoreds: string = "";
  AfterenteredRoomsGuests: Locator;
  Name: string = "";
 Popularity: Locator;
 Price: Locator;
 Hotels: Locator; 
    review: Locator;
    price: Locator; 
    hotelList: any ;
        Check_in: Locator;
    check_in_date: Locator;
    check_Out: Locator;
    check_out_date: Locator;
    //cleanCheckIn: string = "";
   // cleanCheckOut: string = "";

  constructor(page: Page) {
    super(page);
    this.hotelBooking = this.getLocator('(//span[text()="HOTELS"] | //span[text()="Hotels"])[1]');
    this.enterCityName = this.getLocator("//div[contains(@class,'selectHtlCity')]");
    this.enteringCityName = this.getLocator("//input[@id='txtCity']");
    this.check_In = this.getLocator("//span[@id='txtcid']");
    this.check_out = this.getLocator("//span[@id='txtcod']");
    this.room_guests = this.getLocator("//span[text()=' Room ']");
    this.adult_plus = this.getLocator('//a[@id="Adults_room_1_1_plus"]');
    this.adult_count = this.getLocator('//span[@id="Adults_room_1_1"]');
    this.child_plus = this.getLocator('//a[@id="Children_room_1_1_plus"]');
    this.child_count = this.getLocator('//span[contains(@id,"Children_room_1_1")]');
    this.ages = this.getLocator('//select[contains(@id,"Child_Age_1_1")]');
    this.addRoom = this.getLocator('//a[@id="addhotelRoom"]');
    this.Room_2 = this.getLocator("//span[text()='Room 2:']");
    this.adult_2 = this.getLocator('//a[@id="Adults_room_2_2_plus"]');
    this.adult_count_2 = this.getLocator('//span[@id="Adults_room_2_2"]');
    this.child_2 = this.getLocator('//a[@id="Children_room_2_2_plus"]');
    this.child_count_2 = this.getLocator('//span[contains(@id,"Children_room_2_2")]');
    this.done = this.getLocator('//a[@id="exithotelroom"]');
    this.searchHotels = this.getLocator('//input[@id="btnSearch"]');
    this.roomStored = this.getLocator('//div[@id="divPaxPanel"]');
    this.afterenteredCityName = this.getLocator('//label[contains(text(),"City name, Location or Specific hotel")]/..//input[@type="text"]');
    this.AfterenteredRoomsGuests = this.getLocator('//span[contains(@class,"guests_selected guests-selected")]');
    this.Popularity= this.getLocator('//*[text()="Popularity"]');
    this.Price= this.getLocator('//*[text()="High to Low"]/../..//input[@type="radio"]');
     this.Hotels =this.getLocator('//div[contains(@class,"d-flex gap-10 aradjstfull")]/../..//div[contains(@class,"htl-nm hand")]');
     this.review= this.getLocator('//div[contains(@class,"htl-rating d-flex align-items-center ng-star")]');
     this.price= this.getLocator('//div[@class="prcntx ng-star-inserted"]/..//div[contains(@class,"htlprc")]');
     this.Check_in = this.getLocator('(//p[contains(@class,"fnt")])[1]');
     this.check_in_date=this.getLocator('//div[text()="Check-In"]/../..//input[@type="text"]');
     this.check_Out=this.getLocator('(//p[contains(@class,"fnt")])[2]');
     this.check_out_date=this.getLocator('//div[text()="Check-Out"]/../..//input[@type="text"]');   
  }

  async navigateToEasyMyTrip() {
    await this.page.goto(configManager.geteasyURL());
  }

  async hotelBookingPage() {
    await this.waitForElementIsVisible(this.hotelBooking);
    await this.storeTextContent(this.hotelBooking, "HotelBookingTab");  
    console.log("Hotel Booking Tab Text Stored Successfully", $("HotelBookingTab"));
    await this.click(this.hotelBooking);
    await this.waitForElementIsVisible(this.enterCityName);
    await this.click(this.enterCityName);
    await this.type(this.enteringCityName, "Goa");
    await this.page.locator('//div[contains(text(),"North Goa")]').click();
    
   
    this.enteredCityName = await this.page.locator('//span[@class="hp_city"]').textContent() || "";
    console.log("Entered City Name: ", this.enteredCityName);
  }

  async selectCheckInCheckOutDate() {
    await this.click(this.check_In);
    const checkInDate = formatDateAfterDays(2, "dd");
    await this.page.locator(`(//a[text()="${checkInDate}"])[1]`).click();
    await this.click(this.check_out);
    const checkOutDate = formatDateAfterDays(3, "dd");
    await this.page.locator(`(//a[text()="${checkOutDate}"])[1]`).click();
    await this.storeTextContent(this.Check_in, "RawCheckIn");
    await this.storeTextContent(this.check_Out, "RawCheckOut");
  Runtime.set("CleanCheckIn", cleanAndConvertToDDMMYYYY($("RawCheckIn")));
Runtime.set("CleanCheckOut", cleanAndConvertToDDMMYYYY($("RawCheckOut")));

// Debug logs
console.log("Converted Check-In:", $("CleanCheckIn"));
console.log("Converted Check-Out:", $("CleanCheckOut"));;

  }


  async selectRoomsAndGuests() {
   
    await this.waitForElementIsVisible(this.room_guests);
    if (!(await this.room_guests.isVisible())) {
      await this.click(this.room_guests);
    }

   
    await this.waitForElementIsVisible(this.adult_count);
    await this.waitForElementIsVisible(this.child_count);

    
    const adult1 = parseInt((await this.adult_count.textContent()) || "0");
    console.log("Adult Count in Room 1: ", adult1);
    if (adult1 < 2) {
      const clicks = 2 - adult1;
      for (let i = 0; i < clicks; i++) {
        await this.click(this.adult_plus);
      }
    }

    
    const child1 = parseInt((await this.child_count.textContent()) || "0");
    console.log("Child Count in Room 1: ", child1);
    if (child1 < 1) {
      const clicks = 1 - child1;
      for (let i = 0; i < clicks; i++) {
        await this.click(this.child_plus);
      }
    }

    await this.waitForElementIsVisible(this.ages);
    const countofages = await NumberUtils.getInRange(2, 12);
    await this.selectOption(this.ages, `${countofages}`);

    
    await this.click(this.addRoom);
    await this.waitForElementIsVisible(this.Room_2);

    
    const adult2 = parseInt((await this.adult_count_2.textContent()) || "0");
    if (adult2 < 2) {
      const clicks = 2 - adult2;
      for (let i = 0; i < clicks; i++) {
        await this.click(this.adult_2);
      }
    }

  
    const child2 = parseInt((await this.child_count_2.textContent()) || "0");
    if (child2 < 1) {
      const clicks = 1 - child2;
      for (let i = 0; i < clicks; i++) {
        await this.child_2.click();
      }
    }

    
    await this.click(this.done);
    
    
    await this.page.waitForTimeout(500); 
    this.RoomStoreds = (await this.roomStored.textContent())?.trim() || "";
    
    
    this.RoomStoreds = this.RoomStoreds.replace(/Room\s+(\d+)\s+Guests/g, 'Room, $1 Guests');
    
    console.log("Room and Guests Selected: ", this.RoomStoreds);
    await this.waitForElementIsVisible(this.searchHotels);
    await this.click(this.searchHotels);
  }

  async completeHotelBooking() {
   
    await this.waitForElementIsVisible(this.afterenteredCityName);
    
    
    
    this.Name = (await this.afterenteredCityName.getAttribute('value'))?.trim() || 
                (await this.afterenteredCityName.textContent())?.trim() || 
                (await this.afterenteredCityName.inputValue())?.trim() || "";
    
    console.log("Expected City Name: ", this.enteredCityName);
    console.log("Actual City Name from page: ", this.Name);
    
 
   
    expect(this.Name.toLowerCase()).toContain(this.enteredCityName.toLowerCase());
    console.log(" City name verification passed");
    
   
    await this.waitForElementIsVisible(this.AfterenteredRoomsGuests);
    const actualRoomsGuests = (await this.AfterenteredRoomsGuests.textContent())?.trim() || "";
    
    console.log("Expected Rooms/Guests: ", this.RoomStoreds);
    console.log("Actual Rooms/Guests: ", actualRoomsGuests);
    
   
    await expect(this.AfterenteredRoomsGuests).toContainText(/2\s*Room/);
    await expect(this.AfterenteredRoomsGuests).toContainText(/6\s*Guests/);
    console.log(" Rooms and guests verification passed");
     
    await this.storeInputValue(this.check_in_date, "Check_In_Date");
    //console.log("Check-In Date Stored Successfully", $("Check_In_Date"));
    await this.storeInputValue(this.check_out_date, "Check_Out_Date");
    //console.log("Check-Out Date Stored Successfully", $("Check_Out_Date"));
   expect($("CleanCheckIn")).toBe($("Check_In_Date"));
    expect($("CleanCheckOut")).toBe($("Check_Out_Date"));
    console.log(" Check-In and Check-Out date verification passed");

  }
  async sortByPriceHighToLow() {

     await this.waitForElementIsVisible(this.Popularity);
     await this.click(this.Popularity);
     await this.waitForElementIsVisible(this.Price);
     await this.click(this.Price);
     await this.page.waitForTimeout(2000);  
     const count = await this.Hotels.count();
     console.log("Total Hotels Found: ", count);

let hotelList: {
    name: string;
    price: number;
    reviews: string;
}[] = []; 

for (let i = 0; i < count; i++) {   

    const hotelName = await this.Hotels.nth(i).textContent() || "";
    const hotelPriceText = await this.price.nth(i).textContent() || "0";
    const hotelPrice = parseInt(hotelPriceText.replace(/[^0-9]/g, '')) || 0;
    const hotelReviews = await this.review.nth(i).textContent() || "";

    hotelList.push({
        name: hotelName.trim(),
        price: hotelPrice,
        reviews: hotelReviews.trim(),
    });
}

hotelList.sort((a, b) => b.price - a.price);

console.log("Hotels sorted by Price (High to Low):", hotelList);



return hotelList;


















  }


}