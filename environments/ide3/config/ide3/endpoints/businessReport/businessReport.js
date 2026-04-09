// // Build per-application user summary once
// function buildApplicationUserSummary() {
//                     var applicationUserSummary = null;
//                     if (applicationUserSummary == null) {    
//                         applicationUserSummary = (function () {
//                             var summary = [];
//                             try {
//                                 var appsResp = openidm.query("managed/alpha_kyid_businessapplication", { "_queryFilter": "true" }, ["_id", "name"]);
//                                 // var appsResp = openidm.query("managed/alpha_kyid_businessapplication", 
//                                 // { "_queryFilter": 'name eq "	KOG_OKTA_MFA"' }, 
//                                 // ["_id", "name"]);
//                                 var apps = (appsResp && appsResp.result) ? appsResp.result : [];
                                
//                                 logger.error("Found " + apps.length + " applications for user summary.");
//                                 for (var ai = 0; ai < apps.length; ai++) {
//                                     var app = apps[ai];
//                                     var appId = app._id;
//                                     var appName = app.name;

//                                     var accessResp = openidm.query(
//                                         "managed/alpha_kyid_access",
//                                         { "_queryFilter": 'appIdentifier eq "' + appId + '" and recordState eq "0"' },
//                                         ["_id", "userIdentifier"]
//                                     );

//                                     var totalUsers = accessResp ? (accessResp.resultCount || 0) : 0;
//                                   logger.error("Found " + accessResp.result.length + " accessResp.resultCount");
//                                     var internalUsers = 0;
//                                     var externalUsers = 0;

//                                     if (accessResp && accessResp.result && accessResp.result.length) {
//                                         for (var ri = 0; ri < accessResp.result.length; ri++) {
//                                           logger.error("inside account MO loop")
//                                             var acc = accessResp.result[ri];
//                                             var uid = acc.userIdentifier;
//                                             if (!uid) { continue; }

//                                             var user = null;
//                                             try {
//                                                 user = openidm.read("managed/alpha_user/" + uid, null, ["accountStatus", "custom_kyidAccountType"]);
//                                             } catch (e1) {
//                                                 user = null;
//                                             }

//                                             // if (!user || user === null) {
//                                             //     var uq = openidm.query(
//                                             //         "managed/alpha_user",
//                                             //         { "_queryFilter": '(_id eq "' + uid + '" or userIdentifier eq "' + uid + '") and status eq "active"' },
//                                             //         ["userType", "status"]
//                                             //     );
//                                             //     if (uq && uq.resultCount > 0) {
//                                             //         user = uq.result[0];
//                                             //     }
//                                             // }

//                                             if (user && user.accountStatus && user.accountStatus.toLowerCase() === "active") {
//                                               logger.error("inside account status")
//                                                 var ut = user.custom_kyidAccountType || ""
//                                                 if (ut === "C") {
//                                                     internalUsers++;
//                                                 } else if (ut === "P" || ut === "B") {
//                                                     externalUsers++;
//                                                 }
//                                             }
//                                         }
//                                     }

//                                     summary.push({
//                                         applicationId: appId,
//                                         applicationName: appName,
//                                         totalUsers: totalUsers,
//                                         internalUsers: internalUsers,
//                                         externalUsers: externalUsers
//                                     });
//                                   logger.error("the summary push"+JSON.stringify(summary))
//                                 }
//                             } catch (e) {
//                                 logger.error("Error building application user summary: " + e);
//                             }
//                             return summary;
//                         })();
//                     }
//                      return {
//                             applications: applicationUserSummary || []
//                         };
// }
// buildApplicationUserSummary();
//                     // return {
//                     //     applications: applicationUserSummary || [],
//                     //     count: (applicationUserSummary || []).length
//                     // };



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

                               while (true) {
                                    var appsResp = openidm.query(
                                        "managed/alpha_kyid_businessapplication",
                                        { "_queryFilter": appQueryFilter, "_pagedResultsOffset": appsOffset, "_pageSize": appsPageSize },
                                        ["_id", "name"]
                                    );
                                  // var appsResp = openidm.query(
                                  //       "managed/alpha_kyid_businessapplication",
                                  //       { "_queryFilter": "true", "_pagedResultsOffset": appsOffset, "_pageSize": appsPageSize },
                                  //       ["_id", "name"]
                                  //   );
                                    var appsPage = (appsResp && appsResp.result) ? appsResp.result : [];
                                    if (!appsPage.length) { break; }
                                    apps = apps.concat(appsPage);
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
                                    var accessPageSize = 200;

                                    while (true) {
                                        var accessResp = openidm.query(
                                            "managed/alpha_kyid_access",
                                            { "_queryFilter": 'appIdentifier eq "' + appId + '" and recordState eq "0"', "_pagedResultsOffset": accessOffset, "_pageSize": accessPageSize },
                                            ["_id", "userIdentifier"]
                                        );

                                        var accessResults = (accessResp && accessResp.result) ? accessResp.result : [];
                                        if (!accessResults.length) { break; }
                                        totalUsers += accessResults.length;
                                        logger.error("Found " + accessResults.length + " access results page");

                                        for (var ri = 0; ri < accessResults.length; ri++) {
                                          logger.error("inside account MO loop")
                                            var acc = accessResults[ri];
                                            var uid = acc.userIdentifier;
                                            if (!uid) { continue; }

                                            var user = null;
                                            try {
                                                user = openidm.read("managed/alpha_user/" + uid, null, ["accountStatus", "custom_kyidAccountType"]);
                                            } catch (e1) {
                                                user = null;
                                            }


                                            if (user && user.accountStatus && user.accountStatus.toLowerCase() === "active") {
                                              logger.error("inside account status")
                                                var ut = user.custom_kyidAccountType || ""
                                                if (ut === "C") {
                                                    internalUsers++;
                                                } else if (ut === "P" || ut === "B") {
                                                    externalUsers++;
                                                }
                                            }
                                        }

                                        accessOffset += accessResults.length;
                                        if (accessResults.length < accessPageSize) { break; }
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
buildApplicationUserSummary();
                   