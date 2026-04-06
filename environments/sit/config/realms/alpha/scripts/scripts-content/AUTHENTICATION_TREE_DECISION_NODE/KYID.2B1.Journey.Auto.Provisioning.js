// KYID.2B1.Journey.isUserAuthorized.Duplicate
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
  begin: "Beginning Node Execution",
  node: "Node",
  nodeName: "Role Check Node",
  script: "Script",
  scriptName: "KYID.2B1.Journey.isUserAuthorized",
  timestamp: dateTime,
  end: "Node Execution Completed",
};

var NodeOutcome = {
  HASROLES: "hasRoles",
  NOROLES: "noRoles",
  NOAUTOPROVISIONEDROLES: "noAutoProvisionedRoles",
  ERROR: "error",
};

// Logger
var nodeLogger = {
  debug: function (message) {
    logger.debug(message);
  },
  error: function (message) {
    logger.error(message);
  },
};

function generateGUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function kyidAccessEntry(appId, roleId, id) {
    var auditDetails = require("KYID.2B1.Library.AuditDetails")
var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
  logger.debug("Inside kyidAccessEntry appId :: => " + appId);
  logger.debug("Inside kyidAccessEntry roleId :: => " + roleId);
  logger.debug("Inside kyidAccessEntry id :: => " + id);
  var appId = appId;
  var roleId = roleId;
  var id = id;
  var response = null;
  try {

    var data = {
      app: { _ref: "managed/alpha_kyid_businessapplication/" + appId },
      user: { _ref: "managed/alpha_user/" + id },
      role: { _ref: "managed/alpha_role/" + roleId },
      originalDelegator: null,
      currentDelegator: null,
      isForwardDelegable: false,
      assignmentDate: new Date().toISOString(),
      assignmentDateEpoch: Date.now(),
      recordState: "0",
      recordSource: "",
        createDate: auditData.createdDate,
    createdBy: auditData.createdBy,
    createdByID: auditData.createdByID,
    createDateEpoch: auditData.createdDateEpoch,
    updateDate: auditData.updatedDate,
    updateDateEpoch: auditData.updatedDateEpoch,
    updatedBy: auditData.updatedBy,
    updatedByID: auditData.updatedByID,
      appIdentifier: appId,
      roleIdentifier: roleId,
      userIdentifier: id,
    };

    try {
      response = openidm.create("managed/alpha_kyid_access", null, data);
      logger.debug("Response in kyidAccessEntry is -- " + JSON.stringify(response));
      if (response) {
        logger.debug("Access MO Entry Creted");
        return "Success";
      } else {
        logger.debug("Access Entry Failed");
        return "Failed";
      }
    } catch (error) {
      logger.error("Access MO Entry Failed" + JSON.stringify(error));
      return "Failed";
    }
  } catch (error) {
    logger.error("Error in kyidAccessEntry" + error);
    return "Failed";
  }
}

function roleProvisioning() {
  // Declare Global Variables
  var missingInputs = [];

  logger.debug("#### start script");
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
    ":: script started "
  );
  try {
    //RequestorKOGID
    var kogID;
    if (nodeState.get("KOGID") != null) {
      kogID = nodeState.get("KOGID");
    } else {
      missingInputs.push("kogID");
    }

    // Transaction ID
    var transactionID = generateGUID();
    //var transactionID;
    // if (requestHeaders.get("x-forgerock-transactionid") != null) {
    //     var tempTransactionID = requestHeaders.get("x-forgerock-transactionid")[0];
    //     transactionID = tempTransactionID.substring(0, 36);
    // } else {
    //     missingInputs.push("transactionID");
    // }

    // API URL for
    if (
      systemEnv.getProperty("esv.assignrolestouser.api") &&
      systemEnv.getProperty("esv.assignrolestouser.api") != null
    ) {
      var getadditionalflagsinfoAPIURL = systemEnv.getProperty(
        "esv.assignrolestouser.api"
      );
    } else {
      missingInputs.push("getadditionalflagsinfoAPIURL");
    }

    // SIH Cert for API
    var sihcertforapi;
    if (
      systemEnv.getProperty("esv.kyid.cert.client") &&
      systemEnv.getProperty("esv.kyid.cert.client") != null
    ) {
      sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
    } else {
      missingInputs.push("sihcertforapi");
    }

    // KOG API Token
    var kogTokenApi;
    if (
      systemEnv.getProperty("esv.kyid.2b.kogapi.token") &&
      systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null
    ) {
      kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
    } else {
      missingInputs.push("kogTokenApi");
    }

    // Roles to Provision
    if (
      systemEnv.getProperty("esv.assignrolestouser.api.scope") &&
      systemEnv.getProperty("esv.assignrolestouser.api.scope") != null
    ) {
      var rolesProvisioningScope = systemEnv.getProperty(
        "esv.assignrolestouser.api.scope"
      );
    } else {
      missingInputs.push("rolesProvisioningScope");
    }

    if (missingInputs.length > 0) {
      logger.debug(
        "DEBUG::" +
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
        nodeConfig.missingInputParams +
        "::" +
        missingInputs
      );

      action.goTo(nodeOutcome.ERROR);
    } else {
      var roleNames = [];
      var roles = nodeState.get("rolesToProvision");
      for (var k = 0; k < roles.length; k++) {
        // Query role details (including businessAppId and name)
        var roleResp = openidm.read("managed/alpha_role/" + roles[k]);
        if (roleResp && roleResp.name) {
          roleNames.push(roleResp.name);
        }
      }

      if (roleNames && roleNames.length > 0) {
        var userAuths = [];
        roleNames.forEach((roleName) => {
          userAuths.push({
            ApplicationName:
              nodeState.get("kogParentApplicationName") ||
              nodeState.get("appName"),
            RoleName: roleName,
          });
        });
      }
      var payload = {
        KOGID: kogID,
        RequestorKOGID: kogID,
        TransactionID: transactionID,
        //"KYIDContextID": "36DC8D35-242C-40F0-939D-224C799325EB",
        UserAuths: userAuths,
      };

      logger.debug("Payload prepared: " + JSON.stringify(payload));

      var apiTokenRequest = require("KYID.2B1.Library.AccessToken");
      logger.debug("ran the access token lib script for email");
      var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(
        kogTokenApi,
        rolesProvisioningScope
      );
      nodeLogger.debug(
        "kogAPITokenResponse" +
        JSON.stringify(kogAPITokenResponse) +
        "for email"
      );

      if (kogAPITokenResponse.status === 200) {
        logger.debug(
          "access token status is 200" + kogAPITokenResponse + "for email"
        );
        var bearerToken = kogAPITokenResponse.response;
        var requestOptions = {
          clientName: sihcertforapi,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          token: bearerToken,
          body: payload,
        };

        var res = httpClient
          .send(getadditionalflagsinfoAPIURL, requestOptions)
          .get();
        logger.debug(
          "response status of addRole from KOG AD " + JSON.stringify(res)
        );
        logger.debug("response status of addRole from KOG AD " + res.status);
        logger.debug(
          "response of addRole from KOG AD " +
          JSON.stringify(JSON.parse(res.text()))
        );
        action.withHeader(`Response code: ${res.status}`);

        if (res.status === 200) {
          var data = JSON.parse(res.text());
          if (data.ResponseStatus === 0) {
            logger.debug("data is :: => " + JSON.stringify(data));
            nodeState.putShared("userData", data);
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
              ":: Roles added successfully"
            );
            // Return success object for further processing
            return "success";
          } else if (data.MessageCode == -117 || data.MessageCode == "-117") {
            logger.debug("data is :: => " + JSON.stringify(data));
            nodeState.putShared("userData", data);
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
              ":: Role already exist"
            );
            // Return success object for further processing
            return "success";
          } else {
            // ResponseStatus not 0, error details present
            var msg =
              data.MessageResponses && data.MessageResponses.length > 0
                ? data.MessageResponses.map(
                  (m) => `[${m.MessageCode}] ${m.MessageDescription}`
                ).join(" | ")
                : "Unknown error";
            logger.debug(
              "API returned an error ResponseStatus=" +
              data.ResponseStatus +
              " Details: " +
              msg
            );
            nodeState.putShared("apireturnederror", msg);
            return "failed";
          }
        } else {
          logger.debug("Non-200 HTTP response: " + res.status);
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
            ":: HTTP response ::" +
            res.status
          );
          return "failed";
        }
        action.withHeader(`Response code: ${res.status}`);
      } else {
        logger.debug("kogAPITokenResponse is not 200 ");
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
          ":: kogAPITokenResponse is not 200 ::"
        );
        return "failed";
      }
    }
  } catch (error) {
    logger.error("Error in catch is  " + error);
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
      "::Exception::" +
      error
    );
    return "failed";
  }
}

// === Add User Roles ===
function addRole(roleID, uuid) {
  logger.debug("Inside addRole" + roleID + "   " + uuid);
  var addRoleResult = null;
  var response = null;
  var result = false;

  try {
    response = openidm.query(
      "managed/alpha_user/" + uuid + "/roles",
      { _queryFilter: "true" },
      ["_refResourceId"]
    );
    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    logger.debug("Response in addRole is -- " + response);
    if (response && response.resultCount > 0) {
      for (var i = 0; i < response.resultCount; i++) {
        if (roleID === response.result[i]._refResourceId) {
          result = true;
          break;
        } else {
        }
      }
    }

    if (result === false) {
      var patch = [{
        operation: "replace",
        field: "/custom_updatedDateEpoch",
        value: auditData.updatedDateEpoch
      },
      {
        operation: "replace",
        field: "/custom_updatedByID",
        value: auditData.updatedByID
      },
      {
        operation: "replace",
        field: "/custom_updatedDateISO",
        value: auditData.updatedDate
      },
      {
        operation: "replace",
        field: "/custom_updatedBy",
        value: auditData.updatedBy
      },
      {
        operation: "add",
        field: "roles/-",
        value: {
          _ref: "managed/alpha_role/" + roleID,
          _refProperties: {},
        },
      },
      ];
      var addRoleResult = openidm.patch(
        "managed/alpha_user/" + uuid,
        null,
        patch
      );
      logger.debug("addRole result is in " + JSON.stringify(addRoleResult));
      logger.debug("addedRole result is in " + addRoleResult.effectiveRoles);
      if (addRoleResult.effectiveRoles) {
        for (var i = 0; i < addRoleResult.effectiveRoles.length; i++) {
          var value = addRoleResult.effectiveRoles[i];
          logger.debug(" value is in " + value._refResourceId);
          if (value._refResourceId == roleID) {
            return "success";
          }
        }
        return "failed";
      }
    } else {
      return "Role Exists";
    }
  } catch (error) {
    logger.error("Failed to add role " + error);
  }
}

function checkPrerequisiteException(userId) {
  try {
    // Get all roles assigned to the user and roles available in the app
    var userRoles = nodeState.get("userRoleIds");
    var appRoles = nodeState.get("AppRoleIds");

    // Determine unmatched roles: roles in app not already assigned to user
    var unmatchedRoles = appRoles.filter(function (roleId) {
      return !userRoles.includes(roleId);
    });

    //batch querying
    function batchQuery(resource, ids, fields, batchSize) {
      var results = [];
      for (var i = 0; i < ids.length; i += batchSize) {
        var batchIds = ids.slice(i, i + batchSize);
        var filter = batchIds
          .map(function (id) {
            return '_id eq "' + id + '"';
          })
          .join(" or ");

        try {
          var response = openidm.query(resource, {
            _queryFilter: filter,
            _fields: fields,
          });

          if (response && response.result) {
            results = results.concat(response.result);
          }
        } catch (e) {
          logger.error(
            "Error during batch query on " + resource + ": " + e.message
          );
        }
      }
      return results;
    }

    // Step 1: Get role objects for unmatchedRoles and filtering out any roles without an accessPolicy
    var rolesWithPolicy = batchQuery(
      "managed/alpha_role",
      unmatchedRoles,
      ["_id", "accessPolicy"],
      20
    ).filter((role) => role.accessPolicy && role.accessPolicy._refResourceId);

    // Step 2: Build list of unique access policy IDs associated with the roles
    var policyIdsMap = {};
    var policyIds = [];
    for (var i = 0; i < rolesWithPolicy.length; i++) {
      var policyId = rolesWithPolicy[i].accessPolicy._refResourceId;
      if (!policyIdsMap[policyId]) {
        policyIdsMap[policyId] = true;
        policyIds.push(policyId);
      }
    }

    // Step 3: Get access policy objects
    var policyResults = batchQuery(
      "managed/alpha_kyid_enrollment_access_policy",
      policyIds,
      ["_id", "enrollmentRequestSetting"],
      20
    );

    // Step 4: Build a quick-access map of policyId => policy
    var policyMap = {};
    for (var i = 0; i < policyResults.length; i++) {
      policyMap[policyResults[i]._id] = policyResults[i];
    }

    // Step 5: Find eligible roles by checking policy settings
    var eligibleRoles = [];

    for (var j = 0; j < rolesWithPolicy.length; j++) {
      var role = rolesWithPolicy[j];
      var policyId = role.accessPolicy._refResourceId;
      var policy = policyMap[policyId];

      if (!policy || !policy.enrollmentRequestSetting) continue;
      var settings = policy.enrollmentRequestSetting;

      for (var k = 0; k < settings.length; k++) {
        // Defensive check for presence and valid comparison
        if (settings[k].allowedRequestTypes === "3") {
          eligibleRoles.push(role._id);
        }
      }
    }

    // Step 6: Provision roles if any are eligible
    logger.debug(
      "rolesToProvision in checkPrerequisiteException :: => " + eligibleRoles
    );
    if (eligibleRoles.length > 0) {
      nodeState.putShared("rolesToProvision", eligibleRoles);
      // Prepare KOG API request
      var kogAPITokenResponse = roleProvisioning();

      if (kogAPITokenResponse.toLowerCase() === "success") {
        var addRoleResponseResult = [];
        logger.debug("eligibleRoles length is :: => " + eligibleRoles.length)
        for (var k = 0; k < eligibleRoles.length; k++) {
          var addRoleResponse = addRole(eligibleRoles[k], userId);
          var accessEntryResponse = kyidAccessEntry(nodeState.get("AppID"), eligibleRoles[k], userId);
          logger.debug("addRoleResponse in checkPrerequisiteException :: => " + JSON.stringify(addRoleResponse));
          addRoleResponseResult.push(addRoleResponse);
        }
        if (addRoleResponseResult.includes("success")) {
          if (accessEntryResponse === "success") {
            nodeState.putShared("isAutoProvision", "true");
          } else {
            nodeState.putShared("isAutoProvision", "true");
            logger.debug("Access MO Entry creation failed");
          }
          return "success";
        } else {
          return "failed";
        }
      } else {
        logger.debug(
          "KOG API Token response failed with status: " +
          kogAPITokenResponse.status
        );
        return "failed";
      }
    } else {
      return "NoAutoProvisionedRoles";
    }
  } catch (error) {
    logger.error(
      "Error in filterSelfServiceRequestableRoles: " + error.message
    );
    return [];
  }
}

// === Get User Roles ===
function getUserRole(userId) {
  try {
    var response = openidm.query(
      "managed/alpha_user/",
      { _queryFilter: '/_id/ eq "' + userId + '"' },
      [""]
    );
    var result = response.result[0].effectiveRoles;
    const userRoleIds = [];

    // Loop through the effectiveRoles array and collect role IDs
    if (result.length > 0) {
      for (var i = 0; i < result.length; i++) {
        userRoleIds.push(result[i]._refResourceId);
      }
    }

    // Return the list of role IDs assigned to the user\
    nodeState.putShared("userRoleIds", userRoleIds);
    return userRoleIds;
  } catch (error) {
    nodeLogger.error("getUserRole() error: " + error);
    return "error";
  }
}

// === Get Application Roles for the application user is accessing===
function getAppRole(appName) {
  logger.debug("appName in getAppRole is :: => " + appName);
  try {
    //var response = openidm.query("managed/alpha_kyid_businessapplication/" , {  _queryFilter: '/name/ eq "' + appName + '"' }, []);
    var response = openidm.query(
      "managed/alpha_kyid_businessapplication/",
      { _queryFilter: '/name/ eq "' + appName + '"' },
      ["roleAppId/*"]
    );
    logger.debug("response in getAppRole is :: => " + JSON.stringify(response));
    const appRoleIds = [];
    var appRoleName = [];
    if (response && response.result.length > 0) {
      logger.debug("App _id is :: " + response.result[0]._id)
      nodeState.putShared("AppID", response.result[0]._id)
    }
    for (var i = 0; i < response.result.length; i++) {
      response.result[i].roleAppId.forEach((value) => {
        appRoleIds.push(value._refResourceId);
        appRoleName.push(value.name);
      });
      logger.debug(
        "appRoleName in getAppRole is :: => " + JSON.stringify(appRoleName)
      );
    }

    nodeState.putShared("AppRoleIds", appRoleIds);
    nodeState.putShared("appRoleName", appRoleName);
    logger.debug("appRoleIds in getAppRole is :: => " + appRoleIds);
    return appRoleIds;
  } catch (error) {
    nodeLogger.error("getAppRole() error: " + error);
    return "error";
  }
}

// === Role Matching & Enrollment Evaluation ===
function evaluateUserRolesAndEnrollment(appName, uuid) {
  var ops = require("KYID.2B1.Library.IDMobjCRUDops");
  try {
    // Fetch roles assigned to the user
    var userRoleIds = getUserRole(uuid);
    nodeLogger.debug("User Roles: " + JSON.stringify(userRoleIds));
    // Fetch roles associated with the application
    var appRoleIds = getAppRole(appName);
    nodeLogger.debug("Application Roles: " + JSON.stringify(appRoleIds));

    if (
      userRoleIds === "error" ||
      appRoleIds === "error" ||
      !userRoleIds ||
      !appRoleIds
    ) {
      nodeLogger.debug("Invalid role data.");
    } else {
      // Check if user has any roles that match application roles
      var hasMatchingRole = appRoleIds.some(function (role) {
        return userRoleIds.includes(role);
      });

      // If user has matching role, route to HASROLES
      if (hasMatchingRole) {
        nodeLogger.debug("User has matching role(s) → Routing to hasRoles");
        nodeState.putShared("loginauthz", "userhasroles");
         //Defect Fix# 217284 (Unknown Location) - 03/25 ---START
        var authCheck = checkPrerequisiteException(uuid); 
        logger.error("authCheck is in hasMatchingRole:: => " + authCheck); 
         //Defect Fix# 217284 (Unknown Location) - 03/25 ---END
        action.goTo(NodeOutcome.HASROLES);
      } else {
        var authCheck = checkPrerequisiteException(uuid);
        logger.debug("authCheck is in :: => " + authCheck);
        if (authCheck.toLowerCase() === "success") {
          nodeLogger.debug("User has matching role(s) → Routing to hasRoles");
          nodeState.putShared("loginauthz", "userhasroles");
          action.goTo(NodeOutcome.HASROLES);
        } else if (authCheck.toLowerCase() === "failed") {
          logger.debug("Auto Provisioning of roles failed");
          //nodeState.putShared("appIDinWidget", appId);
          nodeState.putShared("loginauthz", "norolesfound");
          //nodeState.putShared("NoRolesFound", "true");
          action.goTo(NodeOutcome.NOROLES);
        } else {
          logger.debug("NoAutoProvioning");
          nodeLogger.debug(
            "No roles available for auto provisioning. Routing to Request Access"
          );
          nodeState.putShared("loginauthz", "norolesfound");
          action.goTo(NodeOutcome.NOAUTOPROVISIONEDROLES);
        }
      }
    }

    // If no roles matched, check for active enrollment
    // var enrollmentFound = hasActiveEnrollment(userId, appRoleIds);
  } catch (error) {
    nodeLogger.error("Exception in evaluateUserRolesAndEnrollment(): " + error);
    // nodeState.putShared("appIDinWidget",appId)
    // nodeState.putShared("loginauthz","norolesfound")
    //action.goTo(NodeOutcome.NOROLES);
    action.goTo(NodeOutcome.ERROR);
  }
}

// === Main Execution ===
function main() {
  try {
    logger.debug("Started script KYID.2B1.Journey.Auto.Provisioning");
    var uuid = nodeState.get("_id");

    //var appName = "KYID Portal"
    if (nodeState.get("appname")) {

      appName = nodeState.get("appname");

      logger.debug("the appName is:" + appName);
    } else if (nodeState.get("appName")) {
      appName = nodeState.get("appName");
      logger.debug("the appName is:" + appName);
    } else if (nodeState.get("kogAppName")) {
      appName = nodeState.get("kogAppName");
      logger.debug("the kogAppName is:" + appName);
    }
    // nodeState.putShared("kogParentApplicationName","EXPL Kentucky Level Of Care System (KLOCS)")

    //Check if appName and kogApplicationParentName is same
    if (nodeState.get("kogParentApplicationName")) {
      var kogParentApplicationName = nodeState.get("kogParentApplicationName");

      if (appName === kogParentApplicationName) {
        logger.debug(
          "appName:" + appName + "is same as kog parent Application name"
        );
        evaluateUserRolesAndEnrollment(appName, uuid);
      } else {
        logger.debug(
          "appName: " +
          appName +
          "is not same as kog parent Application name: " +
          kogParentApplicationName
        );
        evaluateUserRolesAndEnrollment(kogParentApplicationName, uuid);
      }
    } else {
      logger.debug("kogParentApplicationName not found in nodeState");
      evaluateUserRolesAndEnrollment(appName, uuid);
    }

    //evaluateUserRolesAndEnrollment(appName, uuid);
    nodeLogger.debug(nodeConfig.end);
  } catch (e) {
    nodeLogger.error("Main execution error: " + e);
    action.goTo(NodeOutcome.ERROR);
  }
}

main();
