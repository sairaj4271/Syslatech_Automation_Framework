

import { test, expect, APIRequestContext } from "@playwright/test";
import { createAPIClient } from "../setup/api.setup";
import { APIClient } from "../clients/apiClient";
import { APIHelpers } from "../utils/apiHelpers";


let apiContext: APIRequestContext;   
let api: APIClient;                  

test.beforeAll(async () => {
  const { apiContext: ctx, client } = await createAPIClient();

  apiContext = ctx;   
  api = client;       
});

test.afterAll(async () => {
  await apiContext.dispose();
});
test.describe("API", async() =>{

test("TC01: Fetch Resource List - Positive Scenario", async () => {
  const res = await api.get("/objects", {
    page: 1,
    per_page: 5,
     
  });
  APIHelpers.prettyPrintProducts(res.data);
  expect(res.status).toBe(200);  
  expect(Array.isArray(res.data)).toBe(true);
});



test("TC02: Update product using PATCH (working case)", async () => {

  
  const createRes = await api.post("/objects", {
    name: "Temporary Test Product",
    data: { price: 1000 }
  });

  const newId = createRes.data.id;

  console.log("Created:");
  APIHelpers.prettyPrintProducts([createRes.data]);

 
  const patchPayload = {
    name: "Temp Product (PATCH Updated)",
    data: { price: 1999 }
  };

  const patchRes = await api.patch(`/objects/${newId}`, patchPayload);

  expect(patchRes.status).toBe(200);

  console.log("After PATCH:");
  APIHelpers.prettyPrintProducts([patchRes.data]);
});
});

test("delete the porduct", async()=> {
   
const createRes = await api.post("/objects", {
    name: "Product To Delete",
    data: { price: 500 }
  });

  const newId = createRes.data.id;

  console.log("Created Product:");
  APIHelpers.prettyPrintProducts([createRes.data]);

  // 2️⃣ Delete the product
  const deleteRes = await api.delete(`/objects/${newId}`);

  console.log("Delete Response:");
  console.log(deleteRes.data);

  // 3️⃣ Validate delete response
  expect(deleteRes.status).toBe(200);
                
  





});