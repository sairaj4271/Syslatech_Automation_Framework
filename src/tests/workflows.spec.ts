import {test,  expect } from "@playwright/test";
import { WorkflowPage } from "../pages/WorkflowPage";

import { LoginPage } from "../pages/login";

test.describe("Workflow Automation", () => {
  
  test("Create Configure Publish Run Workflow Successfully", async ({ page }) => {
    
      const workflow = new WorkflowPage(page);
      const loginpage = new LoginPage(page); 
   
    await loginpage.navigateTo();
    await loginpage.clickLoginMenu();
    await loginpage.login();      


 
    await workflow.navigateToWorkflow();

   
    const workflowName = await workflow.createNewWorkflow();
    console.log("Generated Workflow Name: ", workflowName);
    
         

    // Assert workflowName string is generated
    
    await workflow.addManualTrigger();

    
    await workflow.addRunReconActivity();

    
    await workflow.startWorkflowAndVerifyCompletion();

    
    expect(await workflow.completed.isVisible()).toBeTruthy();
    
    await workflow.takeScreenshot("workflow_completed");
  });

});
