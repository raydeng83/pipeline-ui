/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

logger.error("rajatlogs::Value fron OOB session node:: "+nodeState.get("rajatemailaddress"))

var mail = null;
if (typeof existingSession !== 'undefined')
{
  mail = existingSession.get("emailaddress");
 
  logger.error("rajatlogs::"+dateTime+"::Email is session is::"+mail);  
    
} 

outcome = "True";
