/**
* Script: KYID.2B1.Journey.ReadContextIDInfo
* Description: This script is used to read userID information from existing session.        
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_LoginMFA_Register_PhoneNumber",
    node: "Node",
    nodeName: "Read UserID Info",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ReadUserIDInfo",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     SUCCESS: "Success",
     ERROR: "Error"
 };


function fetchKOGIDFromUserStore(id) {
  try {
    var userInfoJSON = {}
    var ridpReferenceID = generateGUID();
    // Query using 'mail'
   // var userQueryResult = openidm.query( "managed/alpha_user", {   _queryFilter: '_id eq "' + id + '"', }, ["*","custom_userIdentity/*"]);
       var userQueryResult = openidm.query("managed/alpha_user",{   _queryFilter: '_id eq "' + id + '"', }, ["_id","mail","givenName","userName","sn","frIndexedString1","custom_mfaPerformed","custom_userIdentity/*"]);
    if (userQueryResult.result && userQueryResult.result.length > 0) {
        logger.debug("userQueryResult is "+ JSON.stringify(userQueryResult))
        var userName = userQueryResult.result[0].userName || null;
        var mail = userQueryResult.result[0].mail || null;
        nodeState.putShared("mail",mail)
        nodeState.putShared("givenName",userQueryResult.result[0].givenName)
        nodeState.putShared("firstName",userQueryResult.result[0].givenName)
        nodeState.putShared("lastName",userQueryResult.result[0].sn)
        nodeState.putShared("EmailAddress",userQueryResult.result[0].mail)
        nodeState.putShared("UPN",userQueryResult.result[0].frIndexedString1)
        nodeState.putShared("custom_mfaPerformed", userQueryResult.result[0].custom_mfaPerformed)
        nodeState.putShared("audit_LOGON", userQueryResult.result[0].frIndexedString2);
        nodeState.putShared("audit_ID", id);
        logger.debug("userName found - " + userName);

        if(userQueryResult.result[0].custom_userIdentity){
              var userIdentity = userQueryResult.result[0].custom_userIdentity;
              var givename = userIdentity.givenName || "";
              var sn = userIdentity.sn || "";
              var middleName = userIdentity.middleName || "";
              var gender = userIdentity.gender || "";
              var dob = userIdentity.dob || "";
              var addressLine1 = userIdentity.addressLine1 || "";
              var addressLine2 = userIdentity.addressLine2 || "";
              var city = userIdentity.city || "";
              var stateProvince = userIdentity.stateCode || "";
              var countyCode = userIdentity.countyCode || "";
              var countryCode = userIdentity.countryCode || "";
              var postalCode = userIdentity.zip || "";       
              var zipExtension = userIdentity.zipExtension || "";
              var suffix = userIdentity.suffix || "";
              var title = userIdentity.title || "";

              userInfoJSON["givenName"] = givename;
              userInfoJSON["sn"] = sn;
              userInfoJSON["middleName"] = middleName;
              userInfoJSON["gender"] = gender;
              userInfoJSON["dob"] = dob;
              userInfoJSON["postalAddress"] = addressLine1;
              userInfoJSON["postalAddress2"] = addressLine2;
              userInfoJSON["city"] = city;
              userInfoJSON["postalCode"] = postalCode;
              userInfoJSON["stateProvince"] = stateProvince;
              userInfoJSON["county"] = countyCode;
              userInfoJSON["country"] = countryCode;
              userInfoJSON["zipExtension"] = zipExtension;
              userInfoJSON["suffix"] = suffix;
              userInfoJSON["title"] = title;
              userInfoJSON["userID"] = userName || "";
              userInfoJSON["referenceNumber"] = ridpReferenceID;
              userInfoJSON["mail"] = mail || ""
            
        }
        nodeState.putShared("ridpReferenceID", ridpReferenceID)
        nodeState.putShared("userInfoJSON", userInfoJSON);
        
        if(userQueryResult.result[0].custom_userIdentity && userQueryResult.result[0].custom_userIdentity.languagePreference){
                nodeState.putShared("languagePreference", userQueryResult.result[0].custom_userIdentity.languagePreference)
        }else{
                nodeState.putShared("languagePreference", "1")
        }
        return userName; 
    } else {
      logger.debug("userName not found");
      return null;
    }
  } catch (error) {
    logger.error("Error in fetchdescriptionFromUserStore: " + error);
    return null;
  }
}


function main(){

    //Function Name
    nodeConfig.functionName = "main()";

    //Local Variables
    var txid = null;
    var errMsg = null;
    var KOGID = null;
    var sessionKOGID = null
    var nodeLogger = null;
    var messageUserID = null;
    //var messageContextID = null;
    var response = {};
    
    try {      
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));  
        nodeLogger = require("KYID.2B1.Library.Loggers");
        nodeLogger.log("debug", nodeConfig, "begin", txid);
     
        if(typeof existingSession != 'undefined'){
             if(requestParameters.get("_id")){
                nodeState.putShared("_id",requestParameters.get("_id")[0])
                sessionKOGID = fetchKOGIDFromUserStore(existingSession.get("UserId"))
                KOGID = fetchKOGIDFromUserStore(requestParameters.get("_id")[0]);
                nodeState.putShared("KOGID",KOGID);
                nodeState.putShared("usrKOGID",KOGID); 
                nodeState.putShared("sessionID",existingSession.get("UserId")); 
                nodeState.putShared("userID",requestParameters.get("_id")[0]);
                nodeState.putShared("objectAttributes", { "userName": sessionKOGID });
                logger.debug("In First Block");
                 //var usrKOGID = nodeState.get("usrKOGID");
                 //nodeState.putShared("KOGID",usrKOGID);
                
                //nodeState.putShared("_id",requestParameters.get("_id")[0])
                //nodeState.putShared("userID",usrKOGID);

                // var isHelpDesk = nodeState.get("isHelpDesk");
                // logger.debug("isHelpdeskPPP"+isHelpDesk)

                logger.debug("usrKOGID:" + KOGID);
                logger.debug("Param Value" + requestParameters.get("_id")[0]);
                action.goTo(nodeOutcome.SUCCESS);
}
             else if(existingSession.get("UserId")!=null && existingSession.get("UserId")){
                nodeState.putShared("_id",existingSession.get("UserId"))
                KOGID = fetchKOGIDFromUserStore(existingSession.get("UserId"));
                logger.debug("Check KOGID" + KOGID);
                nodeState.putShared("userID",existingSession.get("UserId"));
                nodeState.putShared("KOGID",KOGID);
                nodeState.putShared("objectAttributes", { "userName": KOGID });
                messageUserID = "userID in session is - "+existingSession.get("UserId");
                nodeLogger.log("debug", nodeConfig, "mid", txid, messageUserID);
                 logger.debug("In Second Block");
                action.goTo(nodeOutcome.SUCCESS);
                 
             } else {
                errMsg = nodeLogger.readErrorMessage("KYID102"); 
                nodeState.putShared("readErrMsgFromCode",errMsg); 
                nodeLogger.log("debug", nodeConfig, "mid", txid, JSON.stringify(errMsg));
                nodeLogger.log("debug", nodeConfig, "end", txid); 
                action.goTo(nodeOutcome.ERROR); 
             }
                             
        } 
    
    } catch(error){
        errMsg = nodeLogger.readErrorMessage("KYID100"); 
        nodeState.putShared("readErrMsgFromCode",errMsg); 
        nodeLogger.log("error", nodeConfig, "mid", txid, error); 
        nodeLogger.log("error", nodeConfig, "end", txid); 
        action.goTo(nodeOutcome.ERROR);
    }
}

//Invoke Main Function
main();


function generateGUID() {     
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';     
    var result = '';   
    var length = 8;  
    for (var i = 0; i < length; i++) {         
        result += chars.charAt(Math.floor(Math.random() * chars.length)); 
    } return result; 
}
