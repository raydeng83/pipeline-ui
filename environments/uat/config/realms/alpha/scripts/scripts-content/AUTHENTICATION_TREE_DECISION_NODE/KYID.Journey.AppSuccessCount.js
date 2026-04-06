/**
* Function: KYID.Journey.AppSuccessCount
* Description: This script is used to count the authentication success number for each app.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: Oct 10th, 2024
* Author: Deloitte
*/

var applicationName = nodeState.get("appCountDataName");
var applicationObject;
var accessCount, successCount, failureCount;
var response;
var jsonArray = []; 


response= openidm.query("managed/alpha_kyid_application_access_data", { "_queryFilter": "/name eq \""+applicationName+"\""}, ["name", "type", "accessCount", "successCount", "failureCount"]);
nodeState.putShared('app', response.toString());

if (response.result.length==1) {
        //application object exists
            applicationObject = response.result[0];
        } else {
           logger.error("Application with name " + applicationName + "does not exist");
        }

successCount = applicationObject['successCount'];

successCount = successCount + 1;

jsonArray.push(applicationObject['successCount'])
openidm.patch("managed/alpha_kyid_application_access_data/" + applicationObject["_id"], null, [{
  "operation": "replace",
  "field": "successCount",
  "value": successCount
}]);

outcome = "true";