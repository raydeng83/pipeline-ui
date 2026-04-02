/**
 * Determines if a widget is role-based or application-based
 * @param {string} widgetId - The widget's _id
 * @returns {object} - { type: "role" | "application" | "unknown", roleId, applicationId }
 */
function determineWidgetType(widgetId) {
    if (!widgetId) {
        return { type: "unknown", roleId: null, applicationId: null };
    }

    var widget = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);
    if (!widget) {
        return { type: "unknown", roleId: null, applicationId: null };
    }

    var roleId = widget.roleId && widget.roleId._refResourceId;
    var applicationId = widget.applicationId && widget.applicationId._refResourceId;

    if (roleId) {
        return { type: "role", roleId: roleId, applicationId: null };
    } else if (applicationId) {
        return { type: "application", roleId: null, applicationId: applicationId };
    } else {
        return { type: "unknown", roleId: null, applicationId: null };
    }
}
exports.determineWidgetType = determineWidgetType

/**
 * Determines the business application information from the role (View App Details)
 * @param {string} roleId - The alpha_role _id
 * @returns {object} - appResults json
 */
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
function getBusinessAppInfoFromRole(roleId) {
    try {
        var roleObj = openidm.read("managed/alpha_role/" + roleId);

        if (!roleObj || !roleObj.businessAppId) {
            logger.error("No business application found for role " + roleId);
            return [];
        }

        var appId = roleObj.businessAppId._refResourceId;
        
        var busAppResponse = openidm.read("managed/alpha_kyid_businessapplication/" + appId);

        var busAppName = busAppResponse.name || "Unknown App";
        if (!busAppResponse) {
            logger.error("Business app not found for id: " + appId);
            return [];
        }

        return [{
            businessAppId: appId,
            businessAppName: busAppName,
            businessAppLogo: busAppResponse.logoURL,
            businessAppDescription: busAppResponse.adminDescription,
            businessAppURL: busAppResponse.applicationURL                
        }];

    } catch (error) {
        logger.error("Error in getBusinessAppInfoFromRole: " + error.message);
        return [];
    }
}

exports.getBusinessAppInfoFromRole = getBusinessAppInfoFromRole;

/**
 * Return ellipsis menu actions based on widget type (role or app)
 * @param {object} myAppsSettings
 * @returns {Array} of action objects
 */
function getEllipsisActions(myAppsSettings, type, roleId,appLibrarySettings) {
    // Handle override type logic
    if (type === "enroll" || type === "Start an App") {
        return [{ action: "viewAppDetails", label: "View App Details" },
            { action: "showLargeIcon", label: "Show Large Display" }];
    }

    if (type === "launch") {
        var baseActions = [
            { action: "viewAppDetails", label: "View App Details" },
            { action: "showLargeIcon", label: "Show Large Display" }
        ];
        if (roleId) {
            baseActions.push({ action: "removeRole", label: "Remove Access" });
        } else {
            baseActions.push({ action: "manageAccess", label: "Manage Access" });
        }
        return baseActions;
    }

    // Default behavior using myAppsSettings
    var actions = [
        { action: "viewAppDetails", label: "View App Details" },
        { action: "showLargeIcon", label: "Show Large Display" }
    ];

    if (myAppsSettings && myAppsSettings.allowManageAccess === true) {
        if (roleId) {
            actions.push({ action: "removeRole", label: "Remove Access" });
        } else {
            actions.push({ action: "manageAccess", label: "Manage Access" });
        }
    }

    return actions;
}
exports.getEllipsisActions = getEllipsisActions;

/**
 * Fetch roles that are assigned to user
 * @param {string} userId - the _id of user
 * @returns {object} - userRoleIds json
 */
function getUserRole(userId) {
    var response = openidm.read("managed/alpha_user/" + userId);
    var result = response.effectiveRoles;
    const userRoleIds = [];
    for (var i = 0; i < result.length; i++) {
        userRoleIds.push(result[i]._refResourceId);
    }
    return userRoleIds;
}
exports.getUserRole = getUserRole;

/**
 * Get tags for a widget
 * @param {string} widgetId
 * @returns {Array} Array of tag objects
 */
function getWidgetTags(widgetId) {
    var tagObjects = [];

    var tagsResp = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId + "/widgetTags", {
        "_queryFilter": "true"
    });

    if (tagsResp.result && tagsResp.result.length > 0) {
        for (var i = 0; i < tagsResp.result.length; i++) {
            var tagId = tagsResp.result[i]._refResourceId;
            var tagData = openidm.read("managed/alpha_kyid_tag/" + tagId);

            if (tagData) {
                tagObjects.push({
                    id: tagId,
                    name: tagData.name,
                    code: tagData.code
                });
            }
        }
    }

    return tagObjects;
}
exports.getWidgetTags = getWidgetTags;
/**
 * Get dymanic serviceendpoint for a widget
 * @param {string} widgetId
 * @returns {Array} serviceendpoint objects
 */
function getDynamicContentEndpointId(widgetId) {
    try {
        logger.error("Fetching dynamic content for widgetId: " + widgetId);

        // Read the widget object directly
        var widObj = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);
        if (!widObj || !widObj.dynamicContentServiceEndpointId) {
            logger.error("No dynamicContentServiceEndpointId linked with widget: " + widgetId);
            return null;
        }

        // Get the endpoint ID from the widget
        var dynamicSERespID = widObj.dynamicContentServiceEndpointId._refResourceId;
        logger.error("Found dynamicSERespID: " + dynamicSERespID);

        // Read the actual endpoint details
        var dynamicSERespIDResp = openidm.read("managed/alpha_kyid_enrollment_service_endpoint/" + dynamicSERespID);
        logger.error("dynamicSERespIDResp: " + JSON.stringify(dynamicSERespIDResp));

        if (dynamicSERespIDResp && dynamicSERespIDResp.name) {
            var dynamicSERespIDRespName = dynamicSERespIDResp.name;
            logger.error("dynamicSERespIDRespName: " + dynamicSERespIDRespName);
            return dynamicSERespIDRespName;
        } else {
            logger.error("Endpoint found but 'name' attribute is missing or null for ID: " + dynamicSERespID);
        }

    } catch (e) {
        logger.error("Error fetching dynamicContentEndpointId for widgetId=" + widgetId + ": " + e);
    }

    return null;
}
exports.getDynamicContentEndpointId = getDynamicContentEndpointId;

/**
 * Get all widgets in the ping, filters the valid widgets which have required attributes like appSettings and libSettings
 * @param {string}
 * @returns {Array} all widget objects
 */
function getAllWidgets() {
    logger.error("Fetching all dashboard widgets...");

    var query = openidm.query("managed/alpha_role", {
        "_queryFilter": "true"
    });
    
    var allWidgets = [];
     logger.error("the query result"+query.result)
    if (query.result && query.result.length > 0) {
        logger.error("Total widgets found: " + query.result.length);

        for (var i = 0; i < query.result.length; i++) {
            var widgetId = query.result[i]._id;
            var widgetObj = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);

            if (widgetObj) {
                logger.error("Widget JSON: " + JSON.stringify(widgetObj));

                if (widgetObj.myAppsSettings && widgetObj.appLibrarySettings) {
                    allWidgets.push(widgetObj);
                } else {
                    logger.error("Skipping widget (missing settings): " + widgetId);
                }
            } else {
                logger.error("Failed to read widget: " + widgetId);
            }
        }
    } else {
        logger.error("No widgets found.");
    }

    return allWidgets;
}
exports.getAllWidgets = getAllWidgets;

/**
 * Fetch all application roles
 * @param {string} userId - the _id of alpha_application
 * @returns {object} - AppRoleIds json
 */
function getAppRole(appId) {
    try {
        var response = openidm.query(
            "managed/alpha_kyid_businessapplication/" + appId + "/roleAppId",
            { "_queryFilter": "true" },
            []
        );

        var AppRoleIds = [];
        if (response && response.result && response.result.length > 0) {
            for (var i = 0; i < response.result.length; i++) {
                AppRoleIds.push(response.result[i]._refResourceId);
            }
        }

        return AppRoleIds;
    } catch (error) {
        logger.error("Error in getAppRole for appId: " + appId + " - " + error.message);
        return [];
    }
}
exports.getAppRole = getAppRole;

/**
 * Return matched roles between user and application
 * @param {string} userId - the _ids of roles that app has and roles that user has to find the common roles
 * @returns {object} - appRoleId json
 */
function matchingRoles(userRoleId, appRoleId) {
    return appRoleId.filter(id => userRoleId.includes(id));
}
exports.matchingRoles = matchingRoles;

/**
 * Return all the roles information of the matching roles
 * @param {string} businessAppName - Name of the business app
 * @param {string} businessAppLogo - Logo URL of the business app
 * @param {Array} matchedRoles - Array of removable matched role IDs
 * @param {object} applicationData - Application metadata (e.g. from getBusinessAppInfo())
 * @returns {string} - Final formatted JSON string
 */
function formatJSON(businessAppName, businessAppLogo, matchedRoles, applicationData) {
    try {
        var roleList = [];

        for (var i = 0; i < matchedRoles.length; i++) {
            var currentRoleId = matchedRoles[i];
            var response = openidm.read("managed/alpha_role/" + currentRoleId);
            var content = response && response.content ? response.content : [];

            roleList.push({
                "roleId": currentRoleId,
                "content": content
            });
        }

        var finalOutput = {
            businessAppName: businessAppName || "",
            businessAppLogo: businessAppLogo || "",
            roles: roleList,
            application: applicationData.application || {}
        };

        return JSON.stringify(finalOutput);

    } catch (error) {
        logger.error("Error in formatJSON: " + error.message);
        return JSON.stringify({});
    }
}
exports.formatJSON = formatJSON;

/**
 * Validate JSON input
 * @param {string} json entered by user
 * @returns {object} - true or false
 */
function validateJsonFormat(json) {
    try {
        var parsed = JSON.parse(json);
        if (typeof parsed !== 'object' || parsed === null) return false;

        const keys = Object.keys(parsed);
        if (keys.length !== 1 || keys[0] !== 'roleId') return false;

        if (!Array.isArray(parsed.roleId)) return false;

        for (var i = 0; i < parsed.roleId.length; i++) {
            if (typeof parsed.roleId[i] !== 'string') return false;
        }

        return true;
    } catch (e) {
        return false;
    }
}
exports.validateJsonFormat = validateJsonFormat;

/**
 * Filters out roles that do not allow self-service dis-enrollment based on access policy
 * If no access policy is attached, the role is considered non-removable.
 * @param {Array} matchedRoleIds - Array of matched role IDs(role ID that user has for that application)
 * @returns {Array} - Array of role IDs that allow self-service dis-enrollment
 */

function filterSelfServiceRemovableRoles(matchedRoleIds) {
  var removableRoles = [];

  for (var i = 0; i < matchedRoleIds.length; i++) {
    var roleId = matchedRoleIds[i];
    logger.error("Checking roleId: " + roleId);

       var policyResp = openidm.read("managed/alpha_role/" + roleId)
      
    if (!policyResp || !policyResp.accessPolicy || !policyResp.accessPolicy._refResourceId) {
      logger.error("No access policy for roleId: " + roleId);
      continue;
    }
   var accessPolicyId = policyResp.accessPolicy._refResourceId
    logger.error("Found accessPolicyId: " + accessPolicyId);

    var policyObj = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + accessPolicyId);
    var setting = policyObj && policyObj.disEnrollmentRequestSetting;
    logger.error("disEnrollmentRequestSetting: " + JSON.stringify(setting));

    if (setting && setting.allowedRequestTypes === "selfservice") {
      logger.error("RoleId " + roleId + " IS self-service");
      removableRoles.push(roleId);
    } else {
      logger.error("RoleId " + roleId + " is NOT self-service");
    }
  }

  return removableRoles;
}

exports.filterSelfServiceRemovableRoles = filterSelfServiceRemovableRoles;

/**
 * Get roles which the user does NOT already have, AND are self-service requestable
 * @param {string} userId - The _id of the user
 * @param {string} appId - The _id of the application
 * @returns {Array} - List of eligible unmatched roleIds
 */
function filterSelfServiceRequestableRoles(userId, appId) {
    try {
        var userRoles = getUserRole(userId);          // all roles assigned to user
        var appRoles = getAppRole(appId);             // all roles available in app

        // Find roles the user does NOT have (unmatched)
        var unmatchedRoles = appRoles.filter(function(roleId) {
            return !userRoles.includes(roleId);
        });

        var eligibleRoles = [];

        for (var i = 0; i < unmatchedRoles.length; i++) {
            var roleId = unmatchedRoles[i];

            // Read the role object
            var role = openidm.read("managed/alpha_role/" + roleId);

            // Skip if no access policy
            if (!role || !role.accessPolicy || !role.accessPolicy._refResourceId) {
                continue;
            }

            // Read access policy
            var accessPolicy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + role.accessPolicy._refResourceId);
            if (!accessPolicy || !accessPolicy.enrollmentRequestSetting) {
                continue;
            }

            // Check for selfservice eligibility
            if (accessPolicy.enrollmentRequestSetting.allowedRequestTypes === "selfservice") {
                eligibleRoles.push(roleId);
            }
        }

        return eligibleRoles;

    } catch (error) {
        logger.error("Error in filterSelfServiceRequestableRoles: " + error.message);
        return [];
    }
}

exports.filterSelfServiceRequestableRoles = filterSelfServiceRequestableRoles;

//search the role _id by name
function getRoleByName(roleName) {
    try {
        var resp = openidm.query("managed/alpha_role", { _queryFilter: 'name eq "' + roleName + '"' });
        if (resp.result && resp.result.length === 1) {
            return openidm.read("managed/alpha_role/" + resp.result[0]._id);
        } else {
            nodeLogger.error("No unique role found for name: " + roleName);
        }
    } catch (e) {
        nodeLogger.error("Error getRoleByName: " + e);
    }
    return null;
}
exports.getRoleByName = getRoleByName

//search the business application _id by name
function getBusinessAppByName(appName) {
    try {
        var resp = openidm.query("managed/alpha_kyid_businessapplication", { _queryFilter: 'name eq "' + appName + '"' });
        if (resp.result && resp.result.length === 1) {
            return openidm.read("managed/alpha_kyid_businessapplication/" + resp.result[0]._id);
        } else {
            nodeLogger.error("No unique business app found for name: " + appName);
        }
    } catch (e) {
        nodeLogger.error("Error getBusinessAppByName: " + e);
    }
    return null;
}
exports.getBusinessAppByName = getBusinessAppByName

//get the helpdesk info for the application
function getApphelpdesk(appId) {
    try {
        var response = openidm.read("managed/alpha_kyid_businessapplication/" + appId);

        if (!response || !response.applicationHelpdeskContact) {
            logger.error("No helpdesk found for " + appId);
            return { application: {} };
        }

        // Fetch helpdesk contact object
        var applicationHelpdeskContactID = response.applicationHelpdeskContact._refResourceId;
        var helpdesk = openidm.read("managed/alpha_kyid_helpdeskcontact/" + applicationHelpdeskContactID);

        if (!helpdesk) {
            logger.error("Helpdesk contact not found for app: " + appId);
            return { application: {} };
        }

        // Extract email (only visible one)
         var email = null;
        if (helpdesk.emailContact && helpdesk.emailContact.length > 0) {
            for (var i = 0; i < helpdesk.emailContact.length; i++) {
                if (helpdesk.emailContact[i].isVisible === "true") {
                    email = helpdesk.emailContact[i].emailAddress;
                    break;
                }
            }
        }

        // Extract phone
        var phone = null;
        if (helpdesk.phoneContact && helpdesk.phoneContact.length > 0) {
            for (var j = 0; j < helpdesk.phoneContact.length; j++) {
                if (helpdesk.phoneContact[j].isVisible === "true") {
                    phone = helpdesk.phoneContact[j].phoneNumber;
                    break;
                }
            }
        }

        //final object
        var result = {
            application: {
                logo: response.logoURL || null,
                name: response.name || null,
                role: null,
                phone: phone,
                mail: email,
                url: response.applicationURL || null,
                operatingHours: helpdesk.daysOfOperation + ", " + helpdesk.hoursOfOperation
                }
            }
            return result;

    } catch (error) {
        logger.error("Error in getApphelpdesk for helpdesk: " + appId + " - " + error.message);
        return { application: {} };
    }
}
exports.getApphelpdesk = getApphelpdesk;