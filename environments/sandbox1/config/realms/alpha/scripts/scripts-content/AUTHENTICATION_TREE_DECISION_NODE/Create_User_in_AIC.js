/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
  begin: "Begining Node Execution",
  node: "Node",
  nodeName: "Create User With KOG Profile",
  script: "Script",
  scriptName: "KYID.Journey.CreateUserInPingAIC",
  timestamp: dateTime,
  missingInputParams: "Following mandatory input params are missing",
  missingFirstName: "Missing FirstName for KOG User",
  missingLastName: "Missing LastName for KOG User",
  missingEmailAddress: "Missing EmailAddress for KOG User",
  missingUPN: "Missing UPN for KOG User",
  missingLogon: "Missing Logon for KOG User",
  missingUserStatus: "Missing UserStatus for KOG User",
  missingConnectorInfo: "Missing connector details",
  missingConnectorAttrs: "Missing connector attributes",
  missingUserId: "Missing userId",
  missingTelephoneNumber: "Missing telephoneNumber",
  missingDisplayName: "Missing displayName",
  missingPostalCode: "Missing postalCode",
  missingCountryCode: "Missing countryCode",
  missingGivenName: "Missing givenName",
  missingCn: "Missing cn",
  missingSn: "Missing sn",
  missingObjectGUID: "Missing objectGUID",
  missingPwdLastSet: "Missing pwdLastSet",
  missingUserType: "Missing userType",
  missingSAMAccountName: "Missing sAMAccountName",
  missingConnectorName: "Missing connector name",
  ldapConnSuccess: "Connected to AD successfully",
  userFound: "User Found in AD",
  userNotFound: "User Not Found in AD",
  idmCreateOperationFailed: "IDM Create Operation Failed",
  idmPatchOperationFailed: "IDM Patch Operation Failed",
  createUsrProfileIDM_Success:
    "User profile created successfully in Forgerock AIC",
  ConnectorName: "ConnectorName",
  missingDomain: "Missing user domain",
  missingEmail: "Missing email",
  end: "Node Execution Completed",
};

// Node outcomes
var nodeOutcome = {
  SUCCESS: "True",
  ERROR: "False",
};

// Declare Global Variables
var createdId = null;
var ConnectorName = null;
//var usrType = "Internal";
var email = null;
var missingInputs = [];
var sAMAccountName = null;
var usrFirstName = null;
var usrLastName = null;
var usrEmailAddress = null;
var PhoneNumbers = null;
var usrUserStatus = null;
var UserNameAttribute = null;
var jsonObj = {};
var result = {};
var createUserSuccess = false;
var userInputmail = {};

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
};

if (nodeState.get("userId") && nodeState.get("userId") != null) {
  var userId = nodeState.get("userId");
} else {
  missingInputs.push(nodeConfig.missingUserId);
}

if (
  nodeState.get("telephoneNumber") &&
  nodeState.get("telephoneNumber") != null
) {
  var telephoneNumber = nodeState.get("telephoneNumber");
} else {
  missingInputs.push(nodeConfig.missingTelephoneNumber);
}

if (nodeState.get("userMail") && nodeState.get("userMail") != null) {
  var userMail = nodeState.get("userMail");
} else {
  missingInputs.push(nodeConfig.missingEmailAddress);
}

if (nodeState.get("postalCode") && nodeState.get("postalCode") != null) {
  var postalCode = nodeState.get("postalCode");
} else {
  missingInputs.push(nodeConfig.missingPostalCode);
}

if (nodeState.get("countryCode") && nodeState.get("countryCode") != null) {
  var countryCode = nodeState.get("countryCode");
} else {
  missingInputs.push(nodeConfig.missingCountryCode);
}

if (nodeState.get("objectGUID") && nodeState.get("objectGUID") != null) {
  var objectGUID = nodeState.get("objectGUID");
} else {
  missingInputs.push(nodeConfig.missingObjectGUID);
}

if (nodeState.get("sn") && nodeState.get("sn") != null) {
  var sn = nodeState.get("sn");
} else {
  missingInputs.push(nodeConfig.missingSn);
}

if (nodeState.get("givenName") && nodeState.get("givenName") != null) {
  var givenName = nodeState.get("givenName");
} else {
  missingInputs.push(nodeConfig.missingGivenName);
}

if (nodeState.get("cn") && nodeState.get("cn") != null) {
  var cn = nodeState.get("cn");
} else {
  missingInputs.push(nodeConfig.missingCn);
}

if (nodeState.get("pwdLastSet") && nodeState.get("pwdLastSet") != null) {
  var pwdLastSet = nodeState.get("pwdLastSet");
} else {
  missingInputs.push(nodeConfig.missingPwdLastSet);
}

if (nodeState.get("userType") && nodeState.get("userType") != null) {
  var userType = nodeState.get("userType");
} else {
  missingInputs.push(nodeConfig.missingUserType);
}

if (
  nodeState.get("sAMAccountName") &&
  nodeState.get("sAMAccountName") != null
) {
  var sAMAccountName = nodeState.get("sAMAccountName");
} else {
  missingInputs.push(nodeConfig.missingSAMAccountName);
}

if (nodeState.get("ConnectorName") && nodeState.get("ConnectorName") != null) {
  var connectorName = nodeState.get("ConnectorName");
} else {
  missingInputs.push(nodeConfig.missingConnectorName);
}

var newpassword = nodeState.get("password");

//jsonObj['userName'] = userId;
jsonObj["telephoneNumber"] = telephoneNumber;
jsonObj["mail"] = userMail;
jsonObj["postalCode"] = postalCode;
jsonObj["country"] = countryCode;
jsonObj["userName"] = objectGUID;
jsonObj["sn"] = sn;
jsonObj["givenName"] = cn;
jsonObj["cn"] = cn;
jsonObj["passwordLastChangedTime"] = pwdLastSet;
jsonObj["frUnindexedString1"] = userType;
jsonObj["frIndexedString3"] = sAMAccountName;
jsonObj["frUnindexedString2"] = connectorName;

nodeLogger.error(
  nodeConfig.timestamp +
    "::" +
    nodeConfig.node +
    "::" +
    nodeConfig.nodeName +
    "::" +
    nodeConfig.script +
    "::" +
    nodeConfig.scriptName +
    "::" +
    JSON.stringify(jsonObj)
);

try {
  //An exception is thrown if the object could not be created.
  var createUserResponse = openidm.create("managed/alpha_user", null, jsonObj);
  createdId = createUserResponse._id;
  nodeLogger.debug(
    nodeConfig.timestamp +
      "::" +
      nodeConfig.node +
      "::" +
      nodeConfig.nodeName +
      "::" +
      nodeConfig.script +
      "::" +
      nodeConfig.scriptName +
      "::" +
      nodeConfig.createUsrProfileIDM_Success
  );
  createUserSuccess = true;
  action.goTo(nodeOutcome.SUCCESS);
} catch (error) {
  nodeLogger.error(
    nodeConfig.timestamp +
      "::" +
      nodeConfig.node +
      "::" +
      nodeConfig.nodeName +
      "::" +
      nodeConfig.script +
      "::" +
      nodeConfig.scriptName +
      "::" +
      nodeConfig.idmCreateOperationFailed +
      "::" +
      error
  );
  action.goTo(nodeOutcome.ERROR);
}

var _id = fetchMailFromUserStore(userMail);
nodeState.putShared("_id", _id);

function fetchMailFromUserStore(mail) {
  try {
    // Query using 'mail'
    var userQueryResult = openidm.query(
      "managed/alpha_user",
      {
        _queryFilter: 'mail eq "' + userMail + '"',
      },
      ["_id"]
    );

    logger.error("userQueryResultid: " + JSON.stringify(userQueryResult));

    if (userQueryResult.result && userQueryResult.result.length > 0) {
      var _id = userQueryResult.result[0]._id || null;
      logger.error("_id found" + userMail);
      return _id;
    } else {
      logger.error("_id found" + null);
      return null;
    }
  } catch (error) {
    logger.error("Error in fetchMailFromUserStore: " + error);
    return null;
  }
}
