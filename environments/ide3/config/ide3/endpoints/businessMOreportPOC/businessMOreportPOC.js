// Build per-application user summary once
//logger.error("the app name"+input.payload)
logger.error("===REQUEST in businessReport=== " + JSON.stringify(request));

var payload = null
try {
    payload = (request && request.content) ? request.content.payload : null
} catch (e) {
    payload = null
}

logger.error("appNameFilter1 businessReport"+payload)
function buildApplicationUserSummary() {
                    var applicationUserSummary = null;
                    if (applicationUserSummary == null) {    
                        applicationUserSummary = (function () {
                            var summary = [];
                            try {
                                var apps = [];
                                var appsOffset = 0;
                                var appsPageSize = 100;
                              //logger.error("appNameFilter1"+payload)
                              var appNameFilter = (payload && payload.appnameQueryFilter) ? payload.appnameQueryFilter : null;
                              
                                var appQueryFilter = appNameFilter ? ('name eq "' + appNameFilter + '"') : "true";
                                logger.error("appQueryFilter2 businessReport"+appNameFilter)

                                function queryUsersByIds(userIds) {
                                    if (!userIds.length) { return []; }
                                    var results = [];
                                    var batchSize = 50;
                                    for (var i = 0; i < userIds.length; i += batchSize) {
                                        var batch = userIds.slice(i, i + batchSize);
                                        var filterParts = [];
                                        for (var bi = 0; bi < batch.length; bi++) {
                                            filterParts.push('_id eq "' + batch[bi] + '"');
                                        }
                                        var filter = "(" + filterParts.join(" or ") + ")";
                                        var usersResp = openidm.query(
                                            "managed/alpha_user",
                                            { "_queryFilter": filter },
                                            ["_id", "accountStatus", "custom_kyidAccountType"]
                                        );
                                        var usersPage = (usersResp && usersResp.result) ? usersResp.result : [];
                                        results = results.concat(usersPage);
                                    }
                                    return results;
                                }

                               while (true) {
                                    var appsResp = openidm.query(
                                        "managed/alpha_kyid_businessapplication",
                                        { "_queryFilter": "true", "_pagedResultsOffset": appsOffset, "_pageSize": appsPageSize },
                                        ["_id", "name","roleAppId/*"]
                                    );
                                    var appsPage = (appsResp && appsResp.result) ? appsResp.result : [];
                                    if (!appsPage.length) { break; }
                                    for (var ap = 0; ap < appsPage.length; ap++) {
                                        var appItem = appsPage[ap];
                                        if (!appItem || !appItem.roleAppId || !appItem.roleAppId.length) { continue; }
                                        apps.push(appItem);
                                    }
                                    appsOffset += appsPage.length;
                                    if (appsPage.length < appsPageSize) { break; }
                                }
                                
                                logger.error("Found " + apps.length + " applications for user summary.");
                                for (var ai = 0; ai < apps.length; ai++) {
                                    var app = apps[ai];
                                    var appId = app._id;
                                    var appName = app.name;

                                    var totalUsers = 0;
                                    var internalUsers = 0;
                                    var externalUsers = 0;

                                    var accessOffset = 0;
                                    var accessBatchSize = 200;

                                    while (true) {
                                        var accessResp = openidm.query(
                                            "managed/alpha_kyid_access",
                                            { "_queryFilter": 'appIdentifier eq "' + appId + '" and recordState eq "0"', "_pagedResultsOffset": accessOffset, "_pageSize": accessBatchSize },
                                            ["_id", "userIdentifier"]
                                        );

                                        var accessResults = (accessResp && accessResp.result) ? accessResp.result : [];
                                        if (!accessResults.length) { break; }
                                        totalUsers += accessResults.length;

                                        var userIds = [];
                                        for (var ri = 0; ri < accessResults.length; ri++) {
                                            var acc = accessResults[ri];
                                            var uid = acc.userIdentifier;
                                            if (uid) { userIds.push(uid); }
                                        }

                                        var users = queryUsersByIds(userIds);
                                        for (var ui = 0; ui < users.length; ui++) {
                                            var user = users[ui];
                                            if (user && user.accountStatus && user.accountStatus.toLowerCase() === "active") {
                                                var ut = user.custom_kyidAccountType || "";
                                                if (ut === "C") {
                                                    internalUsers++;
                                                } else if (ut === "P" || ut === "B") {
                                                    externalUsers++;
                                                }
                                            }
                                        }

                                        accessOffset += accessResults.length;
                                        if (accessResults.length < accessBatchSize) { break; }
                                    }

                                    summary.push({
                                        applicationId: appId,
                                        applicationName: appName,
                                        //totalUsers: totalUsers,
                                        internalUsers: internalUsers,
                                        externalUsers: externalUsers
                                    });
                                  logger.error("the summary push"+JSON.stringify(summary))
                                }
                            } catch (e) {
                                logger.error("Error building application user summary: " + e);
                            }
                            return summary;
                        })();
                    }
                     return {
                            applications: applicationUserSummary || []
                        };
}
function buildApplicationSummary() {
                    var applicationSummary = null;
                    if (applicationSummary == null) {    
                        applicationSummary = (function () {
                            var summary = [];
                            try {
                                var apps = [];
                                var appsOffset = 0;
                                var appsPageSize = 100;
                               while (true) {
                                    var appsResp = openidm.query(
                                        "managed/alpha_kyid_businessapplication",
                                        { "_queryFilter": "true", "_pagedResultsOffset": appsOffset, "_pageSize": appsPageSize },
                                        ["_id", "name", "content", "applicationURL", "kogDBUrl", "appurl", "roleAppId/*"]
                                    );
                                    var appsPage = (appsResp && appsResp.result) ? appsResp.result : [];
                                    if (!appsPage.length) { break; }
                                    for (var ap = 0; ap < appsPage.length; ap++) {
                                        var appItem = appsPage[ap];
                                        //if (!appItem || !appItem.roleAppId || !appItem.roleAppId.length) { continue; }
                                        apps.push(appItem);
                                    }
                                    appsOffset += appsPage.length;
                                    if (appsPage.length < appsPageSize) { break; }
                                }
                                
                                logger.error("Found " + apps.length + " applications for user summary.");
                                for (var ai = 0; ai < apps.length; ai++) {
                                    var app = apps[ai];
                                    //var appId = app._id;
                                    var appName = app.name;
                                    

                                    summary.push({
                                        Name: appName,
                                        DisplayName: (app.content && app.content.length && app.content[0].title) ? app.content[0].title : null,
                                        AppURLName: app.applicationSystemName || null,
                                        ApplicationIdentifier: app.kogDBUrl || null,
                                        AppURL: app.applicationURL || null
                                    });
                                  logger.error("the summary push"+JSON.stringify(summary))
                                }
                            } catch (e) {
                                logger.error("Error building application user summary: " + e);
                            }
                            return summary;
                        })();
                    }
                     return {
                            applications: applicationSummary || []
                        };
}

var response = (function () {
    if (payload && payload.view === "listOfApplication") {
        return buildApplicationSummary();
    } else {
        logger.error("Skipping application summary; payload.view is not listOfApplication.");
        return null;
    }
})();
response;
                