/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

  var dateTime = new Date().toISOString();
  var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

  // Node Config
  var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check User in AD",
    script: "Script",
    scriptName: "KYID.Journey.CheckUsernInADr",
    queryLDAP: "In queryLDAP function ",
    errorPhone: "Invalid phone number format.",
    timestamp: dateTime,
  };
  
/**
   * Logging function
   * @type {Function}
   */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
}
  
  // Node outcomes
  var nodeOutcome = {
    AUTHENTICATE: "authenticate",
    NOUSER: "noUser",
  };



  // Main  Execution
  try {
    var ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();
    var UserNameAttribute = nodeState.get("searchAttribute");
    var UserNameAttributeValue;
    if (UserNameAttribute === "mail") {
    UserNameAttributeValue = nodeState.get("mail").trim();
  } else {
    UserNameAttributeValue = nodeState.get("username").trim();
  }
  
  var query = null;
  var result = queryLDAP(
    ConnectorName,
    UserNameAttribute,
    UserNameAttributeValue
  );
  var userType;

  if (result && result.length > 0) {
    userType = "new";
    nodeState.putShared("userType", userType);
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::"+"User Found in AD"+"::"+ UserNameAttributeValue);
    action.goTo(nodeOutcome.AUTHENTICATE);
  } else {
    action.goTo(nodeOutcome.NOUSER);
  }
      
  } catch (error) {
      nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::"+error+"::"+ UserNameAttributeValue);
      
  }




  
  // Functions
  function queryLDAP(ConnectorName, UserNameAttribute, UserNameAttributeValue) {
    var records = 0;
    var result = {};
    result["records"] = records;
    result["data"] = "No Record Found";
    var query = {
      _queryFilter: UserNameAttribute + ` eq "` + UserNameAttributeValue + `"`,
    };
    try {
      // Query to check if user exists in AD
      var ldapUserQuery = openidm.query(
        `system/` + ConnectorName + `/User`,
        query
      );
      records = ldapUserQuery.result.length;  
      result["records"] = records;
      result["data"] = ldapUserQuery.result[0];
      var ldapUser = result.data.sAMAccountName;
      nodeState.putShared("userId", result.data._id);
      nodeState.putShared("telephoneNumber", result.data.telephoneNumber);
      nodeState.putShared("userMail", result.data.mail);
      nodeState.putShared("displayName", result.data.displayName);
      nodeState.putShared("postalCode", result.data.postalCode);
      nodeState.putShared("countryCode", result.data.countryCode);
      nodeState.putShared("objectGUID", result.data.objectGUID);
      nodeState.putShared("UPN", result.data.userPrincipalName);
      nodeState.putShared("sn", result.data.sn);
      nodeState.putShared("cn", result.data.cn);
      nodeState.putShared("pwdLastSet", result.data.pwdLastSet);
      nodeState.putShared("frUnindexedString1", "External");
      nodeState.putShared("frUnindexedString2", ConnectorName);
      nodeState.putShared("sAMAccountName", result.data.sAMAccountName);
      var upn = nodeState.get("UPN").toLowerCase();
var domain = null;
if (upn && upn.includes("@")) {
    domain = upn.split("@")[1];
    logger.debug("Extracted domain from UPN: " + domain);
    nodeState.putShared("domain",domain);
} else {
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Invalid UPN format or missing UPN");
}
    } catch (error) {
      result["records"] = -1;
      result["data"] = error;
      nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + error);
    }
    return ldapUser;
  }
  
