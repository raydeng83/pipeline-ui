function ldapSearch(params) {
logger.error("Searching User in AD")
// var ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();
var ConnectorName= "kydevdevkygov";
var UserNameAttribute = "mail";
// var UserNameAttributeValue= "InternalDEVTestUser@mailinator.com";
UserNameAttributeValue =nodeState.get("objectAttributes").get("mail")
try {
    var query = {_queryFilter: UserNameAttribute+` eq "`+UserNameAttributeValue+ `"`,}
    var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
    logger.error("ldapUserQuery is "+JSON.stringify(ldapUserQuery) )
    var records = ldapUserQuery.result.length;
    logger.error("ldapUserQuery is "+records )
    if(records>0){
        return(0)
    }
    else{
        return(-1)
    }

} catch (error) {
    
}
    
}

function entitlementRequest (userId,EntitlementId) {
    try {
logger.error("User ID is" + userId+ "Entitlement ID is "+ EntitlementId);  
var body = {
  "common": {
    "userId": userId,
    "entitlementId": EntitlementId,
     "context": {
      "type":"admin"
    }
  }
    
};

var Response = openidm.action("iga/governance/requests/entitlementGrant", "POST", body,{});
logger.error("Entitlement Request Response Is ::" + Response)
var requestId = Response.id
// Response=JSON.stringify(Response);
return (requestId)
    } catch (error) {
        logger.error("Error Occured ::" + error)
       return (-1)
    }


}

function getEntitlementId (entitlementName) {
try {

    var targetFilter =  { "targetFilter": {
    "operator": "AND",
    "operand": [
      {
        "operator": "EQUALS",
        "operand": {
          "targetName": "descriptor.idx./entitlement.displayName",
          "targetValue": entitlementName
        }
      }
    ]
  }
    }

var Response = openidm.action("iga/governance/resource/search", "POST", targetFilter,{});
logger.error("Entitlement ID is ::"+ Response.result[0].id);
Response=Response.result[0].id
// var Response =JSON.stringify(Response);

logger.error("Entitlement Request Response Is ::" + Response)
// var entitlementId = Response.result[0]._id
return (Response)
    } catch (error) {
        logger.error("Error Occured ::" + error)
       return (-1)
    }
}

//Main Execution.

var userId = nodeState.get("_id");
ldapSearch
// var entitlementId ="system_kydevdevkygov_Group_ebf95870-70ca-452d-a40c-fd6712d5df35";
logger.error("UserID Is :: " + userId);
var entitlementName = nodeState.get("entitlementName");
logger.error("Group DN is :: " + entitlementName);
var entitlementId = getEntitlementId(entitlementName)
if (entitlementId == -1){
    logger.error("Unexptected Error Occurred ")
}
else{
logger.error("entitlementInfo is Successful")
// var entitlementId= entitlementInfo.result[0]._id;
logger.error("Entitlement ID is::" +entitlementId);
}
//
var requestResponse = entitlementRequest(userId,entitlementId);
logger.error("Response of Function entitlementRequest is ::"+ requestResponse);
logger.error("Reqest Id is "+requestResponse.id)
if (requestResponse == -1){
    logger.error("Unexptected Error Occurred ")
    outcome = "false"
}
else{
    var requestId =requestResponse;
    logger.error("Entitlement Grant Request ID is :: " +requestId);
    outcome = "true"
}
