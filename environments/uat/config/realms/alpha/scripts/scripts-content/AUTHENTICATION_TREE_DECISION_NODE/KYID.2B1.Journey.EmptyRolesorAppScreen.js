var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var lib = require("KYID.2B1.Library.GenericUtils");
var dashboard = require("KYID.2B1.Library.Dashboard");
var responseArray = [];

try {
    var appId;

    if (nodeState.get("appIDinWidget")) {
        appId = nodeState.get("appIDinWidget");
    } else if (requestParameters.get("appIDinWidget")) {
        appId = requestParameters.get("appIDinWidget")[0];
        nodeState.putShared("requestroleType", "APP_LIBRARY");
    } else if (requestParameters.get("logonAppId")) {
        appId = requestParameters.get("logonAppId")[0];
        nodeState.putShared("requestroleType", "APP_LIBRARY");
    }
    else {
        logger.debug("cannot retrieve the appId");
    }
   
    //Added below code for logon authorization scenario 4 for internal user
    var businessAppName = ""
    if(requestParameters.get("appId")){
      businessAppName = requestParameters.get("appId")[0]
    }

    var businessAppLogo = ""
    if(requestParameters.get("appLogo")){
      businessAppLogo = requestParameters.get("appLogo")[0]
    }
     
    var unmatchedRequestableRoles = [];

 var applicationData = dashboard.getApphelpdesk(appId);
 var finalRequestAccessResponse = dashboard.formatJSON(businessAppName, businessAppLogo, unmatchedRequestableRoles, applicationData);

    //Header
 var jsonobj = {"pageHeader": "1_internaluser_norequestableroles"};
 callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
    
callbacksBuilder.textOutputCallback(0, finalRequestAccessResponse); 

var lib = require("KYID.Library.FAQPages");
		 var process ="kyid_2B1_requestAccess_Dashboard";
         var pageHeader= "1_internaluser_norequestableroles";
         var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
         logger.debug("getFaqTopicId : "+getFaqTopicId);
 
if (getFaqTopicId != null) {
                callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
              }


} catch (e) {
    logger.error("Exception while building response: " + e);
}


outcome = "true"

