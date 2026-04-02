/**
 * Script: KYID.2B1.Journey.JITforUserAuthorization
 * Description: Invoke KOG user authorization API and sync roles & access (Highly Optimized)
 * Author: Deloitte
 */

/* ================= TIMESTAMP ================= */

var dateTime = new Date().toISOString();
logger.debug("Script started at: " + dateTime);

/* ================= NODE CONFIG ================= */

var nodeConfig = {
    nodeName: "Get KOG User Authorization",
    scriptName: "KYID.Journey.ReadUserAuthz",
    missingInputParams: "Following mandatory input params are missing",
    missingEmail: "Missing email"
};

var nodeOutcome = {
    SUCCESS: "next",
    MISSING_MANDATORY_CONFIG: "missingMandatoryConfig",
    NOROLESTOUSER: "noUserAuthz",
    ERROR: "error"
};

/* ================= INPUT HANDLING ================= */

var missingInputs = [];
var mail = null;

if (typeof existingSession !== "undefined") {
    mail = existingSession.get("emailaddress");
    nodeState.putShared("mail", mail);
    logger.debug("the mail from existing session"+mail)
} else if (nodeState.get("mail")) {
    mail = nodeState.get("mail");
    logger.debug("the mail from nodestate"+mail)
} else {
    missingInputs.push(nodeConfig.missingEmail);
}

var kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
var kogUsrAuthorizationApiURL = systemEnv.getProperty("esv.kyid.usr.authorization");
var sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");

if (!kogTokenApi || !kogUsrAuthorizationApiURL || !sihcertforapi) {
    logger.debug("the esv for token or cert is missing")
    missingInputs.push(nodeConfig.missingInputParams);
}

var userKOGID = nodeState.get("KOGID");

if (missingInputs.length > 0) {
    logger.debug("MISSING_MANDATORY_CONFIG")
    action.goTo(nodeOutcome.MISSING_MANDATORY_CONFIG);
}

/* ================= MAIN EXECUTION ================= */

try {

    var apiTokenRequest = require("KYID.2B1.Library.AccessToken");
    var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);

    if (kogAPITokenResponse.status !== 200) {
        logger.debug("kogAPITokenResponse is not 200")
        action.goTo(nodeOutcome.SUCCESS);
    }

    var bearerToken = kogAPITokenResponse.response;

    var requestOptions = {
        clientName: sihcertforapi,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        token: bearerToken,
        body: { KOGID: userKOGID }
    };

    var res = httpClient.send(kogUsrAuthorizationApiURL, requestOptions).get();

    if (res.status !== 200) {
        logger.debug("response is not 200")
        action.goTo(nodeOutcome.SUCCESS);
    }

    var data = JSON.parse(res.text());

    if (data.ResponseStatus !== 0 || !data.UserAuthorizations) {
        logger.debug("User has no roles in KOG")
        action.goTo(nodeOutcome.NOROLESTOUSER);
    }

    var userId = nodeState.get("usrcreatedId");
    nodeState.putShared("createdUserId", userId);

    /* ================= BATCH QUERIES - Load ALL data upfront ================= */

    var appNames = [];
    var roleAppPairs = [];
    var delegatorKOGIDs = [];
    var orgBusinessKeys = [];

    // Collect unique identifiers from authorizations
    data.UserAuthorizations.forEach(function(auth) {
        if (!auth.ApplicationName || !auth.RoleName || auth.ApplicationName === "EDRS") {
            return;
        }
        logger.debug("UserAuthorizations for loop started")
        appNames.push(auth.ApplicationName);
        roleAppPairs.push({ app: auth.ApplicationName, role: auth.RoleName });
        
        if (auth.CurrentDelegatorKOGID) {
            delegatorKOGIDs.push(auth.CurrentDelegatorKOGID);
        }
        if (auth.OriginalDelegatorKOGID) {
            delegatorKOGIDs.push(auth.OriginalDelegatorKOGID);
        }
        
        if (auth.KOGOrgId && auth.BusinessKeyId) {
            orgBusinessKeys.push({
                orgId: auth.KOGOrgId.toString(),
                businessKey: auth.BusinessKeyId
            });
        }
    });

    // Batch query: All applications
    var appNameFilter = appNames.map(function(n) { return 'name eq "' + n + '"'; }).join(" or ");
    logger.debug("the appNameFilter::"+appNameFilter)
    var appCache = {};
    if (appNameFilter) {
        var appResult = openidm.query("managed/alpha_kyid_businessapplication", {
            "_queryFilter": appNameFilter
        });
        appResult.result.forEach(function(app) {
            appCache[app.name] = app._id;
        });
    }

    // Batch query: All roles with app relationships
    var appIds = Object.keys(appCache).map(function(k) { return appCache[k]; });
    var roleCache = {};
    if (appIds.length > 0) {
        var roleFilter = appIds.map(function(id) {
            return 'businessAppId/_refResourceId eq "' + id + '"';
        }).join(" or ");
        
        var roleResult = openidm.query("managed/alpha_role", {
            "_queryFilter": roleFilter
        });
        
        roleResult.result.forEach(function(role) {
            var key = role.businessAppId._refResourceId + "::" + role.name;
            roleCache[key] = role._id;
        });
    }

    // Batch query: All delegators
    var delegatorCache = {};
    if (delegatorKOGIDs.length > 0) {
        var uniqueKOGIDs = delegatorKOGIDs.filter(function(v, i, a) { return a.indexOf(v) === i; });
        var kogFilter = uniqueKOGIDs.map(function(id) { return 'userName eq "' + id + '"'; }).join(" or ");
        
        var delegatorResult = openidm.query("managed/alpha_user", {
            "_queryFilter": kogFilter
        });
        
        delegatorResult.result.forEach(function(user) {
            delegatorCache[user.userName] = user._id;
        });
    }

     // Batch query: Existing user roles
    var resp = openidm.read("managed/alpha_user/" + userId);
    var userRoleIdMap = {};
    if (resp && resp.effectiveRoles) {
        resp.effectiveRoles.forEach(function(r) {
            userRoleIdMap[r._refResourceId] = true;
        });
    }

    // Batch query: Existing access records
    var accessMap = {};
    var accessResult = openidm.query("managed/alpha_kyid_access", {
        "_queryFilter": 'userIdentifier eq "' + userId + '" and (recordState eq "0" or recordState eq "ACTIVE")'
    });

    if (accessResult && accessResult.result) {
        accessResult.result.forEach(function(acc) {
            var key =
                acc.appIdentifier + "::" +
                acc.roleIdentifier + "::" +
                (acc.orgId || "") + "::" +
                (acc.businessKeyName || "");
            accessMap[key] = acc;
        });
    }

    /* ================= GET AUDIT DETAILS ONCE ================= */

    var auditData = null;
    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails");
        auditData = auditDetails.getAuditDetails("CREATE", nodeState);
    } catch (e) {
        logger.error("Audit details not available: " + e);
    }

    /* ================= PROCESS AUTHORIZATIONS ================= */

    var rolesToAdd = [];
    var accessToCreate = [];

    data.UserAuthorizations.forEach(function(auth) {

        if (!auth.ApplicationName || !auth.RoleName || auth.ApplicationName === "EDRS") {
            return;
        }

        var appId = appCache[auth.ApplicationName];
        if (!appId) return;

        var roleKey = appId + "::" + auth.RoleName;
        var roleId = roleCache[roleKey];
        if (!roleId) return;

        // Check if access record exists
        var accessKey =
            appId + "::" +
            roleId + "::" +
            (auth.KOGOrgId ? auth.KOGOrgId.toString() : "") + "::" +
            (auth.BusinessKeyId || "");

        if (!accessMap[accessKey]) {
            accessToCreate.push({
                appId: appId,
                roleId: roleId,
                auth: auth
            });
        }

        // Collect roles to add
        if (!userRoleIdMap[roleId]) {
            rolesToAdd.push(roleId);
            userRoleIdMap[roleId] = true;
        }
    });

    /* ================= BULK CREATE ACCESS RECORDS ================= */

    if (accessToCreate.length > 0) {
        var now = new Date().toISOString();
        var nowEpoch = Date.now();
     //createDate: auditData ? auditData.createdDate : now,
        //createDateEpoch: auditData ? auditData.createdDateEpoch : nowEpoch,
        //createdBy: auditData ? auditData.createdBy : userId,
        //updatedBy: userId,
         // assignmentDate: now,
         // assignmentDateEpoch: nowEpoch,
        accessToCreate.forEach(function(item) {
            var auth = item.auth;
            var data = {
                app: { "_ref": "managed/alpha_kyid_businessapplication/" + item.appId },
                user: { "_ref": "managed/alpha_user/" + userId },
                role: { "_ref": "managed/alpha_role/" + item.roleId },

                isForwardDelegable: false,
                assignmentDate: (auth && auth.CreatedDate) ? new Date(auth.CreatedDate).toISOString() : now,
                assignmentDateEpoch: (auth && auth.CreatedDate) ? new Date(auth.CreatedDate).getTime() : nowEpoch,
                recordState: "0",
                recordSource: "1",

                createDate: (auth && auth.CreatedDate) ? new Date(auth.CreatedDate).toISOString() : now,
                createDateEpoch: (auth && auth.CreatedDate) ? new Date(auth.CreatedDate).getTime() : nowEpoch,
                updateDate: (auth && auth.CreatedDate) ? new Date(auth.CreatedDate).toISOString() : now,
                updateDateEpoch: (auth && auth.CreatedDate) ? new Date(auth.CreatedDate).getTime() : nowEpoch,

                createdBy: (auth && auth.CreatedBy) ? auth.CreatedBy : userId,
                updatedBy: (auth && auth.CreatedBy) ? auth.CreatedBy : userId,
                createdByID: auditData ? auditData.createdByID : userId,

                appIdentifier: item.appId,
                roleIdentifier: item.roleId,
                userIdentifier: userId
            };

            // Add org attributes
            if (auth.KOGOrgId && auth.KOGOrgId !== 0) {
                data.orgId = auth.KOGOrgId.toString();
            }
            if (auth.OrgTypeName) {
                data.orgType = auth.OrgTypeName;
            }
            if (auth.OrgName) {
                data.OrgName = auth.OrgName;
            }

            // Add business key attributes
            if (auth.BusinessKeyTypeName) {
                data.businessKeyTypeName = auth.BusinessKeyTypeName;
            }
            if (auth.BusinessKeyId) {
                data.businessKeyName = auth.BusinessKeyId;
            }
            if (auth.BusinessKeyValue) {
                data.businessKeyValue = auth.BusinessKeyValue;
            }

            // Add delegator references
            if (auth.CurrentDelegatorKOGID && delegatorCache[auth.CurrentDelegatorKOGID]) {
                var currId = delegatorCache[auth.CurrentDelegatorKOGID];
                data.currentDelegatorIdentifier = currId;
                data.currentDelegator = { "_ref": "managed/alpha_user/" + currId };
            }

            if (auth.OriginalDelegatorKOGID && delegatorCache[auth.OriginalDelegatorKOGID]) {
                var origId = delegatorCache[auth.OriginalDelegatorKOGID];
                data.originalDelegatorIdentifier = origId;
                data.originalDelegator = { "_ref": "managed/alpha_user/" + origId };
            }

            try {
                openidm.create("managed/alpha_kyid_access", null, data);
            } catch (e) {
                logger.error("Failed to create access record: " + e);
            }
        });

        logger.error("Bulk created access records count: " + accessToCreate.length);
    }

    /* ================= BULK ROLE PATCH ================= */

    if (rolesToAdd.length > 0) {
        try {
            var patchOps = rolesToAdd.map(function(roleId) {
                return {
                    operation: "add",
                    field: "/roles/-",
                    value: {
                        "_ref": "managed/alpha_role/" + roleId,
                        "_refResourceId": roleId,
                        "_refResourceCollection": "managed/alpha_role"
                    }
                };
            });

            if (auditData) {
                var updateAudit = auditDetails.getAuditDetails("UPDATE", nodeState);
                patchOps.push(
                    { operation: "replace", field: "/custom_updatedDateEpoch", value: updateAudit.updatedDateEpoch },
                    { operation: "replace", field: "/custom_updatedByID", value: updateAudit.updatedByID },
                    { operation: "replace", field: "/custom_updatedDateISO", value: updateAudit.updatedDate },
                    { operation: "replace", field: "/custom_updatedBy", value: updateAudit.updatedBy }
                );
            }

            openidm.patch("managed/alpha_user/" + userId, null, patchOps);
            logger.error("Bulk patched roles count: " + rolesToAdd.length);

        } catch (e) {
            logger.error("Bulk role patch failed: " + e);
        }
    }

    logger.debug("Script completed successfully at: " + new Date().toISOString());
    action.goTo(nodeOutcome.SUCCESS);

} catch (e) {
    logger.error("Exception encountered: " + e);
    action.goTo(nodeOutcome.SUCCESS);
}
