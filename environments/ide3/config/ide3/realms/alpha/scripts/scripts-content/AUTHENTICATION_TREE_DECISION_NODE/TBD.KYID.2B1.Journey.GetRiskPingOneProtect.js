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
    logger.error("PingProtect evaluation is not null")
   riskLevel = successMessage.result.level 
   
   var country = successMessage.details.country;
   var state = successMessage.details.state;
   var city = successMessage.details.city;
   var ip = successMessage.event.ip;
   var os = successMessage.details.device.os.name;
   var browser = successMessage.details.device.browser.name;
    logger.error("successMessage.details.country : "+country);
    logger.error("successMessage.details.state : "+state);
    logger.error("successMessage.details.os : "+os);
    logger.error("successMessage.details.ip : "+ip);

    if ((!state || !city || !country) && ip) {
        var defaultLocation = getLocationFromIp(ip);
        state = state || defaultLocation.state;
        city = city || defaultLocation.city;
    }
    logger.error("Resolved state : "+state);
    logger.error("Resolved city : "+city);

    nodeState.putShared("usrLocState",state)
    nodeState.putShared("usrLocCity",city)
    nodeState.putShared("usrLocCountry",country)
 // auditLog("LOG006", "Location Based Audit Logging",ip, city, state, country);
} else {
    logger.error("PingProtect evaluation is null. Setting it to default risk level")
    riskLevel = systemEnv.getProperty("esv.kyid.failover.mfarisklevel")
}

var riskLevelMFA = systemEnv.getProperty("esv.risklevelmfa.enabled")
logger.error("the esv for risk level::"+riskLevelMFA)

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
//nodeState.putShared("riskLevel",riskLevel)
    nodeState.putShared("riskLevel","LOW")
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
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
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
    //var ipArray =["10.36.45.39"]
    var ipArray =["10.36.0.0 - 10.36.255.255"]
    logger.error("IP address to check: "+inputIp);
    if (isIpInArray(inputIp, ipArray)) {
        logger.error("IP address is in the whitelist. Setting default location to KY, Frankfort");
        return { state: "", city: "CHFS Internal" };
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
                    logger.error("IP address is in the whitelist range: "+entry);
                    return true;
                }
            } else {

                if (inputIp === entry) {
                    logger.error("IP address matches the whitelist entry: "+entry);
                    return true;
                }
            }
        }
        logger.error("IP address is not in the whitelist.");
        return false;

    } catch (error) {
        logger.error("Failed to check IP range "+ error);
    }
}
//callbacksBuilder.textOutputCallback(0, riskLevel);
outcome = "true";