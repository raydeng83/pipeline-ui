/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
  begin: "Begining Node Execution",
  node: "Node",
  nodeName: "Check IF 2A/2B",
  script: "Script",
  scriptName: "KYID.Journey.CheckIf2A/2B",
  inFunction: "Inside function fetchdescriptionFromUserStore",
  accountStatus: "Inisde accountStatus function",
  userLocked: "Account is locked",
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
};

// Node outcomes
var nodeOutcome = {
  EXISTING: "existing",
  UPDATED: "updated",
  LOCKEDOUT: "locked",
};

nodeLogger.debug.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.begin);

// function fetchdescriptionFromUserStoreEmail(_id) {
//     try {
//         // Query using 'mail'
//             var userQueryResult = openidm.query("managed/alpha_user", {
//             "_queryFilter": 'userName eq "' + _id + '"'
//         }, ["description"]);

//         logger.error("userQueryResultemail: " + JSON.stringify(userQueryResult));

//         if (userQueryResult.result && userQueryResult.result.length > 0) {
//             var userDescription = userQueryResult.result[0].description || null;
//             logger.error("description found" + userDescription);
//             return userDescription;
//         } else {
//             logger.error("description found" + null);
//             return null;
//         }
//     } catch (error) {
//         logger.error("Error in fetchdescriptionFromUserStore: " + error);
//         return null;
//     }
// }

function fetchdescriptionFromUserStore(_id) {
  try {
    // Query using 'mail'
    var userQueryResult = openidm.query(
      "managed/alpha_user",
      {
        _queryFilter: 'userName eq "' + _id + '"',
      },
      ["description"]
    );

    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.inFunction);

    if (userQueryResult.result && userQueryResult.result.length > 0) {
      var userDescription = userQueryResult.result[0].description || null;
      //logger.error("description found" + userDescription);
      return userDescription;
    } else {
      //logger.error("description found" + null);
      return null;
    }
  } catch (error) {
    //logger.error("Error in fetchdescriptionFromUserStore: " + error);
    return null;
  }
}

function fetchMailFromUserStore(_id) {
  try {
    // Query using 'mail'
    var userQueryResult = openidm.query(
      "managed/alpha_user",
      {
        _queryFilter: 'userName eq "' + _id + '"',
      },
      ["mail"]
    );

    //logger.error("userQueryResultemail: " + JSON.stringify(userQueryResult));

    if (userQueryResult.result && userQueryResult.result.length > 0) {
      var userMail = userQueryResult.result[0].mail || null;
      logger.debug("mail found" + userMail);
      return userMail;
    } else {
      logger.debug("mail found" + null);
      return null;
    }
  } catch (error) {
    logger.error("Error in fetchMailFromUserStore: " + error);
    return null;
  }
}

function accountStatus(_id) {
  try {
    // Query using 'mail'
    var userQueryResult = openidm.query(
      "managed/alpha_user",
      {
        _queryFilter: 'userName eq "' + _id + '"',
      },
      ["accountStatus"]
    );

    //logger.error("accountStatus: " + JSON.stringify(userQueryResult));
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.accountStatus);

    if (userQueryResult.result && userQueryResult.result.length > 0) {
      var accountStatus = userQueryResult.result[0].accountStatus || null;
      //logger.error("accountStatus found" + accountStatus);
      return accountStatus;
    } else {
      //logger.error("accountStatus found" + null);
      return null;
    }
  } catch (error) {
    logger.error("Error in accountStatus: " + error);
    return null;
  }
}

var _id = nodeState.get("username");
var searchAttribute = nodeState.get("searchAttribute");
var accountStatus = accountStatus(_id);
var transactionId = nodeState.get("transactionId");
if (searchAttribute === "mail") {
  username = nodeState.get("mail").trim();
} else {
  username = nodeState.get("username").trim();
}

if (accountStatus === "Inactive") {
  nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+ nodeConfig.userLocked+"::"+username);
  action.goTo(nodeOutcome.LOCKEDOUT);
} else {
  if (searchAttribute === "mail") {
    var userDes = fetchdescriptionFromUserStore(_id);
  } else {
    var userDes = fetchdescriptionFromUserStore(_id);
    var userMail = fetchMailFromUserStore(_id);
    nodeState.putShared("userMail", userMail);
  }

  if (userDes === "existing_user") {
    action.goTo(nodeOutcome.EXISTING);
  } else {
    action.goTo(nodeOutcome.UPDATED);
  }
}
