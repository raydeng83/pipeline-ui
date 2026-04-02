var dateTime = new Date().toISOString();
logger.error("Script started at: " + dateTime);

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

var missingInputs = [];
var mail = null;

if (typeof existingSession !== "undefined") {
    mail = existingSession.get("emailaddress");
    nodeState.putShared("mail", mail);
} else if (nodeState.get("mail")) {
    mail = nodeState.get("mail");
} else {
    missingInputs.push(nodeConfig.missingEmail);
}

var kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
var kogUsrAuthorizationApiURL = systemEnv.getProperty("esv.kyid.usr.authorization");
var sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");

if (!kogTokenApi || !kogUsrAuthorizationApiURL || !sihcertforapi) {
    missingInputs.push(nodeConfig.missingInputParams);
}

var userKOGID = nodeState.get("KOGID");

if (missingInputs.length > 0) {
    action.goTo(nodeOutcome.MISSING_MANDATORY_CONFIG);
}

/* ================= MAIN EXECUTION ================= */

try {

    var apiTokenRequest = require("KYID.2B1.Library.AccessToken");
    var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);

    if (kogAPITokenResponse.status !== 200) {
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
        action.goTo(nodeOutcome.SUCCESS);
    }

    var data = JSON.parse(res.text());

    if (data.ResponseStatus !== 0 || !data.UserAuthorizations) {
        action.goTo(nodeOutcome.NOROLESTOUSER);
    }

    var userId = nodeState.get("usrcreatedId");
    nodeState.putShared("createdUserId", userId);

    /* ================= EXISTING USER ROLES ================= */

    var userRoleIds = getUserRole(userId);
    var userRoleIdMap = {};
    userRoleIds.forEach(function(r) { userRoleIdMap[r] = true; });

    /* ================= CACHES ================= */

    var appCache = {};
    var roleCache = {};
    var delegatorCache = {};
    var rolesToAdd = [];

    /* ===================================================== */
    /*OPTIMIZATION 1: PRE-FETCH ALL APPLICATIONS (ONCE) */
    /* ===================================================== */

    var allApps = openidm.query("managed/alpha_kyid_businessapplication", {
        "_queryFilter": "true"
    });

    if (allApps && allApps.result) {
        allApps.result.forEach(function(app) {
            appCache[app.name] = app._id;
        });
    }

    /* ================================================= */
    /*OPTIMIZATION 2: PRE-FETCH ALL ROLES (ONCE) */
    /* ================================================= */

    var allRoles = openidm.query("managed/alpha_role", {
        "_queryFilter": "true"
    });

    if (allRoles && allRoles.result) {
        allRoles.result.forEach(function(role) {
            var key = role.businessAppId._refResourceId + "::" + role.name;
            roleCache[key] = role._id;
        });
    }

    /* ================= EXISTING ACCESS CACHE ================= */

    var accessMap = {};
    var accessResult = openidm.query("managed/alpha_kyid_access", {
        "_queryFilter":
            'userIdentifier eq "' + userId + '" and (recordState eq "0" or recordState eq "ACTIVE")'
    });

    if (accessResult && accessResult.result) {
        accessResult.result.forEach(function(acc) {
            var key =
                acc.appIdentifier + "::" +
                acc.roleIdentifier + "::" +
                (acc.orgId || "") + "::" +
                (acc.kogOrgBusinessKeyId || "");
            accessMap[key] = acc;
        });
    }

    /* ================= PROCESS AUTHORIZATIONS ================= */

    data.UserAuthorizations.forEach(function(auth) {

        if (!auth.ApplicationName || !auth.RoleName || auth.ApplicationName === "EDRS") {
            return;
        }

        /* -------- APPLICATION LOOKUP (FROM CACHE) -------- */

        var appId = appCache[auth.ApplicationName];
        if (!appId) return;

        /* -------- ROLE LOOKUP (FROM CACHE) -------- */

        var roleKey = appId + "::" + auth.RoleName;
        var roleId = roleCache[roleKey];
        if (!roleId) return;

        /* -------- ACCESS MO LOOKUP -------- */

        var accessKey =
            appId + "::" +
            roleId + "::" +
            (auth.KOGOrgId ? auth.KOGOrgId.toString() : "") + "::" +
            (auth.BusinessKeyId || "");

        if (!accessMap[accessKey]) {
            var accessResp = createAccessMO(appId, roleId, userId, auth, delegatorCache);
            if (accessResp && accessResp._id) {
                accessMap[accessKey] = accessResp;
            }
        }

        /* -------- COLLECT ROLES -------- */

        if (!userRoleIdMap[roleId]) {
            rolesToAdd.push(roleId);
            userRoleIdMap[roleId] = true;
        }
    });

    /* ================= BULK ROLE PATCH ================= */

    if (rolesToAdd.length > 0) {
        patchAlphaRolesBulk(userId, rolesToAdd);
    }

    logger.error("Script completed successfully at: " + new Date().toISOString());
    action.goTo(nodeOutcome.SUCCESS);

} catch (e) {
    logger.error("Exception encountered: " + e);
    action.goTo(nodeOutcome.SUCCESS);
}


function getUserRole(userId) {
    var resp = openidm.read("managed/alpha_user/" + userId);
    var roles = [];
    if (resp && resp.effectiveRoles) {
        resp.effectiveRoles.forEach(function (r) {
            roles.push(r._refResourceId);
        });
    }
    return roles;
}

/* -------- BULK ROLE PATCH -------- */

function patchAlphaRolesBulk(userId, roleIds) {
    try {
        var patchOps = roleIds.map(function(roleId) {
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

        try {
            var auditDetails = require("KYID.2B1.Library.AuditDetails");
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState);

            patchOps.push(
                { operation: "replace", field: "/custom_updatedDateEpoch", value: auditData.updatedDateEpoch },
                { operation: "replace", field: "/custom_updatedByID", value: auditData.updatedByID },
                { operation: "replace", field: "/custom_updatedDateISO", value: auditData.updatedDate },
                { operation: "replace", field: "/custom_updatedBy", value: auditData.updatedBy }
            );
        } catch (e) {
            logger.error("Audit failed for user role patch: " + e);
        }

        openidm.patch("managed/alpha_user/" + userId, null, patchOps);
        logger.error("Bulk patched roles count: " + roleIds.length);

    } catch (e) {
        logger.error("Bulk role patch failed: " + e);
    }
}

/* -------- CREATE ACCESS MO -------- */

function createAccessMO(appId, roleId, userId, auth, delegatorCache) {

    var now = new Date().toISOString();
    var nowEpoch = Date.now();

    var data = {
        app: {
            "_ref": "managed/alpha_kyid_businessapplication/" + appId
        },
        user: {
            "_ref": "managed/alpha_user/" + userId
        },
        role: {
            "_ref": "managed/alpha_role/" + roleId
        },

        isForwardDelegable: false,
        assignmentDate: now,
        assignmentDateEpoch: nowEpoch,
        recordState: "0",
        recordSource: "1",

        createDate: now,
        createDateEpoch: nowEpoch,
        updateDate: now,
        updateDateEpoch: nowEpoch,

        createdBy: userId,
        updatedBy: userId,
        createdByID: userId,

        appIdentifier: appId,
        roleIdentifier: roleId,
        userIdentifier: userId
    };

    if (auth.KOGOrgId && auth.KOGOrgId !== 0) {
        data.orgId = auth.KOGOrgId.toString();
    }

    if (auth.OrgTypeName) {
        data.orgType = auth.OrgTypeName;
    }

    if (auth.OrgName) {
        data.OrgName = auth.OrgName;
    }

    if (auth.BusinessKeyTypeName) {
        data.businessKeyTypeName = auth.BusinessKeyTypeName;
    }

    if (auth.BusinessKeyId) {
        data.businessKeyName = auth.BusinessKeyId;
    }

    if (auth.BusinessKeyValue) {
        data.businessKeyValue = auth.BusinessKeyValue;
    }

    function resolveDelegator(kogId) {
        if (!delegatorCache[kogId]) {
            var q = openidm.query("managed/alpha_user", {
                "_queryFilter": 'userName eq "' + kogId + '"'
            });
            if (q.result && q.result.length > 0) {
                delegatorCache[kogId] = q.result[0]._id;
            }
        }
        return delegatorCache[kogId];
    }

    if (auth.CurrentDelegatorKOGID) {
        var currId = resolveDelegator(auth.CurrentDelegatorKOGID);
        if (currId) {
            data.currentDelegatorIdentifier = currId;
            data.currentDelegator = {
                "_ref": "managed/alpha_user/" + currId
            };
        }
    }

    if (auth.OriginalDelegatorKOGID) {
        var origId = resolveDelegator(auth.OriginalDelegatorKOGID);
        if (origId) {
            data.originalDelegatorIdentifier = origId;
            data.originalDelegator = {
                "_ref": "managed/alpha_user/" + origId
            };
        }
    }

    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails");
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState);

        data.createDate = auditData.createdDate;
        data.createDateEpoch = auditData.createdDateEpoch;
        data.createdBy = auditData.createdBy;
        data.createdByID = auditData.createdByID;
    } catch (e) {
        logger.error("Audit details not available: " + e);
    }

    try {
        var resp = openidm.create("managed/alpha_kyid_access", null, data);
        logger.debug("Access MO created successfully: " + resp._id);
        return resp;
    } catch (e) {
        logger.error("createAccessMO failed: " + e);
        return null;
    }
}
