var successMessage = nodeState.get("PingOneProtectEvaluationNode.RISK")
logger.error("successMessage : "+successMessage);

/*var country;
var state;
var city;
var ip;
var os;
var browser;*/

var riskLevel;
if (successMessage != null && successMessage) {
    logger.debug("PingProtect evaluation is not null")
   riskLevel = successMessage.result.level 
   
   var country = successMessage.details.country;
   var state = successMessage.details.state;
   var city = successMessage.details.city;
   var ip = successMessage.event.ip;
   var os = successMessage.details.device.os.name;
   var browser = successMessage.details.device.browser.name;
    logger.debug("successMessage.details.country : "+country);
    logger.debug("successMessage.details.state : "+state);
    logger.debug("successMessage.details.os : "+os);
    logger.error("successMessage.details.ip : "+ip);

    //Capture Location to show in Audit Activity
    if ((!state || !city || !country) && ip) {
        var defaultLocation = getLocationFromIp(ip);
        state = state || defaultLocation.state;
        city = city || defaultLocation.city;
    }

     if (state) {
      state = titleCaseLocation(state);
    }
    if(city){
      city = titleCaseLocation(city);
    }
    if(country){
      country = titleCaseLocation(country);
    }
    
    logger.debug("Resolved state : "+state);
    logger.debug("Resolved city : "+city);

    nodeState.putShared("usrLocState",state)
    nodeState.putShared("usrLocCity",city)
    nodeState.putShared("usrLocCountry",country)
    
  // auditLog("LOG006", "Location Based Audit Logging", country, state, city, os, browser, ip);

    //Defect Fix# 211192 (Unknown Location) - 03/12
    var sessionRidfDetails = null
    if(typeof existingSession != 'undefined'){
        logger.debug("session exist")
        sessionRidfDetails = JSON.parse(existingSession.get("sessionRefId"))
        nodeState.putShared("sessionRefId",JSON.stringify(sessionRidfDetails))
        logger.error("***Existing sessionDetail in KYID.2B1.Journey.GetRiskPingOneProtect => "+JSON.stringify(sessionRidfDetails))
        
    } else {
        logger.debug("session does not exist")
        sessionRidfDetails = JSON.parse(nodeState.get("sessionRefId")) 
        logger.error("***Before update sessionRidfDetails in KYID.2B1.Journey.GetRiskPingOneProtect => "+JSON.stringify(sessionRidfDetails))
        sessionRidfDetails.city = city || "";
        sessionRidfDetails.state  = state || "";
        sessionRidfDetails.country = country || "";
        nodeState.putShared("sessionRefId",sessionRidfDetails)
        logger.error("***New sessionDetail in KYID.2B1.Journey.GetRiskPingOneProtect => "+JSON.stringify(sessionRidfDetails))
    }
    
} else {
    logger.error("PingProtect evaluation is null. Setting it to default risk level")
    riskLevel = systemEnv.getProperty("esv.kyid.failover.mfarisklevel")
}

var riskLevelMFA = systemEnv.getProperty("esv.risklevelmfa.enabled")
logger.debug("the esv for risk level::"+riskLevelMFA)

var enforceRiskBasedAuthn ;
if(nodeState.get("enforceRiskBasedAuthn") && nodeState.get("enforceRiskBasedAuthn")!=null){
     logger.debug("enforce risk based mfa value::"+nodeState.get("enforceRiskBasedAuthn"))
   enforceRiskBasedAuthn = nodeState.get("enforceRiskBasedAuthn")  
}

if(riskLevelMFA == false || riskLevelMFA === false || riskLevelMFA === "false" || enforceRiskBasedAuthn == false){
logger.debug("RISK MFA is Disabled. Value LOW")
nodeState.putShared("riskLevel","LOW")
} else {
logger.debug("RISK MFA is Enabled. Value: "+riskLevel)
nodeState.putShared("riskLevel",riskLevel)
}

function titleCaseLocation(value) {
    if (!value || typeof value !== "string") {
        return value;
    }
    if (value.toLowerCase() === "chfs internal") {
        return "CHFS Internal";
    }
    return value
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

//useractivity logging 
function auditLog(code, message, ip){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
        //   var headerName = "X-Real-IP";
        //  var headerValues = requestHeaders.get(headerName); 
          var ipAdress = ip;
           var browser = requestHeaders.get("user-agent"); 
           var os = requestHeaders.get("sec-ch-ua-platform"); 
           var userId = null;
            var eventDetails = {};
              eventDetails["IP"] = ipAdress;
              eventDetails["Browser"] = browser;
              eventDetails["OS"] = os;
              eventDetails["City"] = city || "";
              eventDetails["State"] = state || "";
              eventDetails["Country"] = country || "";
              eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
              eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
          var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
                //var sessionDetails = {}
                var sessionDetail = null
                var sessionDetails = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails["sessionRefId"] = {"sessionRefId": ""}
                }
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

                if(nodeState.get("_id")){
                  userId = nodeState.get("_id")
                } else if (userEmail){
              var userQueryResult = openidm.query("managed/alpha_user", {
                     _queryFilter: 'mail eq "' + userEmail + '"'
                 }, ["_id"]);
              userId = userQueryResult.result[0]._id;
                }

              var requesterUserId = null;
               if (typeof existingSession != 'undefined') {
              requesterUserId = existingSession.get("UserId")
                }

                auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log MFA Authentication success "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}

function getLocationFromIp(inputIp){
    //var ipArray = systemEnv.getProperty("esv.recaptcha.whitelisted.ip");
    //var ipArray =["10.36.0.0 - 10.36.255.255"]
    var ipArray = systemEnv.getProperty("esv.pingoneprotect.location.whitelisted.ip");
    ipArray = JSON.parse(ipArray);
    
    logger.debug("IP address to check: "+inputIp);
    if (isIpInArray(inputIp, ipArray)) {
        logger.debug("IP address is in the whitelist. Setting default location to Commonwealth Network");
        return { state: "", city: "Commonwealth Network" };
    }
    return { state: "", city: "" };
}

function isIpInArray(inputIp, ipArray) {
    try {
        // Convert IP to a number for comparison
        var ipToNum = (ip) => {
            return ip.split('.').map(Number).reduce((acc, octet) => (acc << 8) + octet, 0);
        };

        var inputIpNum = ipToNum(inputIp);

        // Loop through the array of IPs and ranges
        for (var i = 0; i < ipArray.length; i++) {
            var entry = ipArray[i];
            if (entry.includes('-')) {

                var [rangeStart, rangeEnd] = entry.split('-');
                var startNum = ipToNum(rangeStart);
                var endNum = ipToNum(rangeEnd);
                if (inputIpNum >= startNum && inputIpNum <= endNum) {
                    logger.debug("IP address is in the whitelist range: "+entry);
                    return true;
                }
            } else {

                if (inputIp === entry) {
                    logger.debug("IP address matches the whitelist entry: "+entry);
                    return true;
                }
            }
        }
        logger.debug("IP address is not in the whitelist.");
        return false;

    } catch (error) {
        logger.error("Failed to check IP range "+ error);
    }
}
//callbacksBuilder.textOutputCallback(0, riskLevel);
//Defect Fix# 211192 (Unknown Location) - 03/12
action.goTo("true").putSessionProperty("sessionRefId", JSON.stringify(sessionRidfDetails));
//outcome = "true";