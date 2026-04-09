try {
    //var guid = nodeState.get("userGuid");
    var guid=requestParameters.get("_id")
    logger.debug("_id: " + guid);

    if (guid) {
        var identity = idRepository.getIdentity(guid[0]);
        
        if (identity) {
            // Returns the first value, for example:  test@example.com
            var mail = identity.getAttributeValues("mail")[0];
            var userName = identity.getAttributeValues("uid")[0];
            var givenName = identity.getAttributeValues("givenName")[0];
            var sn = identity.getAttributeValues("sn")[0];
            var UPN = identity.getAttributeValues("fr-attr-istr1")[0];
            var Logon = identity.getAttributeValues("fr-attr-istr2")[0];
            var domain = Logon.split("@"); 
            var params =  new Object();
            /*params.object = {
              "mail":mail,
              "givenName":identity.getAttributeValues("givenName")[0],
              "lastName":identity.getAttributeValues("sn")[0]
          };*/
          // params.givenName=identity.getAttributeValues("givenName")[0];
          // params.sn="Danson"
            var phoneContact=null;
            var emailContact=null;
            var appName = "KYID Helpdesk"
                try{
                var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact",{_queryFilter: 'name eq "' + appName + '"'},["phoneContact", "emailContact"])
               phoneContact=userQueryResult2.result[0].phoneContact[0].phoneNumber
               emailContact=userQueryResult2.result[0].emailContact[0].emailAddress
                } catch(error){
                logger.error("Error in catch of helpdesk retrieval :: => "+ error)
               } 
            
            logger.debug("guid[0]: " + guid[0]);
            logger.debug("mail: " + mail);
            logger.debug("userName: " + userName);
            //logger.error("userName: " + guid[0]);
            nodeState.putShared("username", userName);
            nodeState.putShared("mail", mail);
            nodeState.putShared("objectAttributes", { "mail": mail, "phoneContact" : phoneContact, "givenName" : givenName, "sn" : sn});
            nodeState.putShared("_id", guid[0]);
            nodeState.putShared("KOGID",userName);
            nodeState.putShared("UPN", UPN);
            nodeState.putShared("domain",domain[1]);
            //nodeState.putShared("givenName","Marie");
           // nodeState.putShared("sn","Danson");
            logger.debug("user found");
            auditLog("PWD001", "Password Reset Initiated");
            action.goTo("true");
        
        } else {
            logger.error("no user found");
            auditLog("PWD002", "Password Reset Initiation Failure");
            action.goTo("false");
        }
    } else {
        logger.error("no guid");
        auditLog("PWD002", "Password Reset Initiation Failure");
        action.goTo("false");
    }
} catch (error) {
    logger.error("catching error");
    auditLog("PWD002", "Password Reset Initiation Failure");
    action.goTo("false");
}



function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userId = null;
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
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
                var userEmail = nodeState.get("mail") || "";
                      if (userEmail){
                 var userQueryResult = openidm.query("managed/alpha_user", {
              _queryFilter: 'mail eq "' + userEmail + '"'
                 }, ["_id"]);
                userId = userQueryResult.result[0]._id;
                }

                var helpdeskUserId = existingSession.get("UserId") || null;
                //userId = nodeState.get("_id") || null;
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, helpdeskUserId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log password reset initiation "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}