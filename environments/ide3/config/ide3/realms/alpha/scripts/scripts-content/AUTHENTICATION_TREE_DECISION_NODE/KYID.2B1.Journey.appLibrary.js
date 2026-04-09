// logger.debug("starting script");

// function getWidgetforUserDetails() {
//     var matchedWidgets = [];
//     var fallbackSeenWidgetIds = [];

//     try {
//         logger.debug("Starting getWidgetforUserDetails for userId: " + userId);

//         var userRoleList = openidm.query("managed/alpha_user/" + userId + "/roles", {
//             "_queryFilter": "true"
//         }, ["_refResourceId"]);

//         logger.debug("Total roles found: " + userRoleList.resultCount);

//         if (userRoleList.resultCount > 0) {
//             for (var i = 0; i < userRoleList.resultCount; i++) {
//                 var roleId = userRoleList.result[i]._refResourceId;
//                 logger.debug("Processing roleId: " + roleId);

//                 var widgetResult = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
//                     "_queryFilter": "/roleId/_refResourceId eq \"" + roleId + "\""
//                 });

//                 if (widgetResult && widgetResult.result.length > 0) {
//                     logger.debug("Widget found for roleId: " + roleId);
//                     var widgetId = widgetResult.result[0]._id;
//                     var widgetResponse = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);

//                     var widgettagResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId + "/widgetTags", {
//                         "_queryFilter": "true"
//                     }, [""]);

//                     var widgetTagsList = [];

//                     if (widgettagResponse && widgettagResponse.result.length > 0) {
//                         for (var j = 0; j < widgettagResponse.result.length; j++) {
//                             var tagID = widgettagResponse.result[j]._refResourceId;
//                             var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
//                             if (tagObj) {
//                                 widgetTagsList.push({ id: tagID, name: tagObj.name, code: tagObj.code });
//                             }
//                         }
//                     }

//                     if (widgetResponse) {
//                         matchedWidgets.push({
//                             widgetId: widgetResponse._id,
//                             widgetName: widgetResponse.name,
//                             widgetType: widgetResponse.type,
//                             widgetContext: widgetResponse.enrollmentProfile.enrollmentContext,
//                             widgetLogoURL: widgetResponse.logoURL,
//                             widgetRoleID: roleId,
//                             widgetApplicationID: null,
//                             widgetdynamicContentEndpointId: widgetResponse.dynamicContentEndpointId,
//                             widgettag: widgetTagsList,
//                             contentTitle: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].title) || {},
//                             contentMyApps: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].myApps) || {},
//                             contentAppLibrary: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].appLibrary) || {},
//                             ellipsisActions: [
//                                 { action: "viewAppDetails", label: "View_App_Details" },
//                                 { action: "showLargeIcon", label: "Show_Large_Display" },
//                                 { action: "removeRole", label: "Remove_Access" }
//                             ]
//                         });
//                         logger.debug("Widget details added from roleId match: " + widgetResponse._id);
//                     }
//                 } else {
//                     logger.debug("No widget found for roleId: " + roleId + ". Attempting fallback via applicationId.");

//                     var roleObj = openidm.query("managed/alpha_role/" + roleId + "/applications", {
//                         "_queryFilter": "true"
//                     }, [""]);

//                     if (roleObj && roleObj.result && roleObj.result.length > 0) {
//                         var applicationId = roleObj.result[0]._refResourceId;
//                         logger.debug("Found applicationId (" + applicationId + ") from roleId: " + roleId);

//                         var AppWidgetResult = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
//                             "_queryFilter": "/applicationId/_refResourceId eq \"" + applicationId + "\""
//                         });

//                         if (AppWidgetResult && AppWidgetResult.result.length > 0) {
//                             var AppWidget = AppWidgetResult.result[0];

//                             if (fallbackSeenWidgetIds.indexOf(AppWidget._id) === -1) {
//                                 fallbackSeenWidgetIds.push(AppWidget._id);

//                                 var widgettagforAppResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + AppWidget._id + "/widgetTags", {
//                                     "_queryFilter": "true"
//                                 }, [""]);

//                                 var widgetTagsAppList = [];

//                                 if (widgettagforAppResponse && widgettagforAppResponse.result.length > 0) {
//                                     for (var k = 0; k < widgettagforAppResponse.result.length; k++) {
//                                         var tagID = widgettagforAppResponse.result[k]._refResourceId;
//                                         var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
//                                         if (tagObj) {
//                                             widgetTagsAppList.push({ id: tagID, name: tagObj.name, code: tagObj.code });
//                                         }
//                                     }
//                                 }

//                                 matchedWidgets.push({
//                                     widgetId: AppWidget._id,
//                                     widgetName: AppWidget.name,
//                                     widgetType: AppWidget.type,
//                                     widgetContext: AppWidget.enrollmentProfile.enrollmentContext,
//                                     widgetLogoURL: AppWidget.logoURL,
//                                     widgetRoleID: null,
//                                     widgetApplicationID: applicationId,
//                                     widgetdynamicContentEndpointId: AppWidget.dynamicContentEndpointId,
//                                     widgettag: widgetTagsAppList,
//                                     contentTitle: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].title) || {},
//                                     contentMyApps: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].myApps) || {},
//                                     contentAppLibrary: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].appLibrary) || {},
//                                     ellipsisActions: [
//                                         { action: "viewAppDetails", label: "View_App_Details" },
//                                         { action: "showLargeIcon", label: "Show_Large_Display" },
//                                         { action: "manageAccess", label: "Manage_Access" }
//                                     ]
//                                 });

//                                 logger.debug("Widget details added from applicationId fallback: " + AppWidget._id);
//                             } else {
//                                 logger.debug("Duplicate fallback widget skipped: " + AppWidget._id);
//                             }
//                         } else {
//                             logger.debug("No widget found for applicationId: " + applicationId);
//                         }
//                     } else {
//                         logger.debug("No applicationId found in role: " + roleId);
//                     }
//                 }
//             }
//         } else {
//             logger.debug("No roles found for user.");
//         }
//     } catch (e) {
//         logger.error("Error in getWidgetforUserDetails: " + e.message);
//     }

//     return matchedWidgets;
// }

// // === Main Execution ===
// try {
//     var userId = nodeState.get("_id");
//     logger.debug("Fetching widgets for userId: " + userId);

//     var widgetresponseArray = getWidgetforUserDetails();

//     var allWidgetsResult = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
//         "_queryFilter": "true"
//     }, ["_id", "name", "type"]);

//     var allWidgets = [].concat(allWidgetsResult && allWidgetsResult.result ? allWidgetsResult.result : []);

//     var matchedWidgetIds = widgetresponseArray.map(function(widget) {
//         return widget.widgetId;
//     });

//     var unmatchedWidgets = allWidgets.filter(function(widget) {
//         return matchedWidgetIds.indexOf(widget._id) === -1;
//     });

//     if (!widgetresponseArray || widgetresponseArray.length === 0) {
//         callbacksBuilder.textOutputCallback(0, "No_results_found.");
//         logger.debug("No widgets found for user.");
//         action.goTo("false");
//     } else {
//         // Add type to launch widgets
//         var launchWidgets = widgetresponseArray.map(function(widget) {
//             widget.typeofwidget = "launch";
//             return widget;
//         });

//         // Add type to enroll widgets
//         var enrollWidgets = unmatchedWidgets.map(function(widget) {
//             return {
//                 widgetId: widget._id,
//                 widgetName: widget.name,
//                 widgetType: widget.type,
//                 typeofwidget: "enroll"
//             };
//         });

//         // Merge both
//         var combinedWidgets = launchWidgets.concat(enrollWidgets);
//         var combinedWidgetsStr = JSON.stringify(combinedWidgets);

//         nodeState.putShared("allAppsResponse", combinedWidgetsStr);
//         logger.debug("Final combined widget response: " + combinedWidgetsStr);

//         // Send single callback
//         callbacksBuilder.textOutputCallback(0, combinedWidgetsStr);
//         action.goTo("true");
//     }
// } catch (error) {
//     logger.error("Unexpected error while fetching widgets: " + error);
//     callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
//     action.goTo("error");
// }

logger.debug("starting script");

function getWidgetforUserDetails() {
    var matchedWidgets = [];
    var fallbackSeenWidgetIds = []; // Deduplication tracking for fallback widgets

    try {
        logger.debug("Starting getWidgetforUserDetails for userId: " + userId);

        var userRoleList = openidm.query("managed/alpha_user/" + userId + "/roles", {
            "_queryFilter": "true"
        }, ["_refResourceId"]);

        logger.debug("Total roles found: " + userRoleList.resultCount);

        if (userRoleList.resultCount > 0) {
            for (var i = 0; i < userRoleList.resultCount; i++) {
                var roleId = userRoleList.result[i]._refResourceId;
                logger.debug("Processing roleId: " + roleId);

                // Role-based widget retrieval
                var widgetResult = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
                    "_queryFilter": "/roleId/_refResourceId eq \"" + roleId + "\""
                });

                if (widgetResult && widgetResult.result.length > 0) {
                    logger.debug("Widget found for roleId: " + roleId);
                    var widgetId = widgetResult.result[0]._id;
                    var widgetResponse = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);

                    // Fetch tags
                    var widgettagResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId + "/widgetTags", {
                        "_queryFilter": "true"
                    }, [""]);

                    var widgetTagsList = [];

                    if (widgettagResponse && widgettagResponse.result.length > 0) {
                        for (var j = 0; j < widgettagResponse.result.length; j++) {
                            var tagID = widgettagResponse.result[j]._refResourceId;
                            var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
                            if (tagObj) {
                                widgetTagsList.push({ id: tagID, name: tagObj.name });
                            }
                        }
                    }

                    if (widgetResponse) {
                        matchedWidgets.push({
                            widgetId: widgetResponse._id,
                            widgetName: widgetResponse.name,
                            widgetType: widgetResponse.type,
                            widgetContext: widgetResponse.enrollmentProfile.enrollmentContext,
                            widgetLogoURL: widgetResponse.logoURL,
                            widgetRoleID: roleId,
                            widgetApplicationID: null,
                            widgetdynamicContentEndpointId: widgetResponse.dynamicContentEndpointId,
                            widgettag: widgetTagsList,
                            contentTitle: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].title) || {},
                            contentMyApps: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].myApps) || {},
                            contentAppLibrary: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].appLibrary) || {},
                            ellipsisActions: [
                                { action: "viewAppDetails", label: "View App Details" },
                                { action: "showLargeIcon", label: "Show Large Display" },
                                { action: "removeRole", label: "Remove Access" }
                            ]
                        });
                        logger.debug("Widget details added from roleId match: " + widgetResponse._id);
                    }
                } else {
                    logger.debug("No widget found for roleId: " + roleId + ". Attempting fallback via applicationId.");

                    // Fallback: query applicationId from role
                    var roleObj = openidm.query("managed/alpha_role/" + roleId + "/applications", {
                        "_queryFilter": "true"
                    }, [""]);

                    if (roleObj && roleObj.result && roleObj.result.length > 0) {
                        var applicationId = roleObj.result[0]._refResourceId;
                        logger.debug("Found applicationId (" + applicationId + ") from roleId: " + roleId);

                        // Query widget by applicationId
                        var AppWidgetResult = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
                            "_queryFilter": "/applicationId/_refResourceId eq \"" + applicationId + "\""
                        });

                        if (AppWidgetResult && AppWidgetResult.result.length > 0) {
                            var AppWidget = AppWidgetResult.result[0];

                            if (fallbackSeenWidgetIds.indexOf(AppWidget._id) === -1) {
                                fallbackSeenWidgetIds.push(AppWidget._id);

                                // Fetch tags for fallback widget
                                var widgettagforAppResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + AppWidget._id + "/widgetTags", {
                                    "_queryFilter": "true"
                                }, [""]);

                                var widgetTagsAppList = [];

                                if (widgettagforAppResponse && widgettagforAppResponse.result.length > 0) {
                                    for (var k = 0; k < widgettagforAppResponse.result.length; k++) {
                                        var tagID = widgettagforAppResponse.result[k]._refResourceId;
                                        var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
                                        if (tagObj) {
                                            widgetTagsAppList.push({ id: tagID, name: tagObj.name });
                                        }
                                    }
                                }

                                matchedWidgets.push({
                                    widgetId: AppWidget._id,
                                    widgetName: AppWidget.name,
                                    widgetType: AppWidget.type,
                                    widgetContext: AppWidget.enrollmentProfile.enrollmentContext,
                                    widgetLogoURL: AppWidget.logoURL,
                                    widgetRoleID: null,
                                    widgetApplicationID: applicationId,
                                    widgetdynamicContentEndpointId: AppWidget.dynamicContentEndpointId,
                                    widgettag: widgetTagsAppList,
                                    contentTitle: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].title) || {},
                                    contentMyApps: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].myApps) || {},
                                    contentAppLibrary: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].appLibrary) || {},
                                    ellipsisActions: [
                                        { action: "viewAppDetails", label: "View App Details" },
                                        { action: "showLargeIcon", label: "Show Large Display" },
                                        { action: "manageAccess", label: "Manage Access" }
                                    ]
                                });

                                logger.debug("Widget details added from applicationId fallback: " + AppWidget._id);
                            } else {
                                logger.debug("Duplicate fallback widget skipped: " + AppWidget._id);
                            }
                        } else {
                            logger.debug("No widget found for applicationId: " + applicationId);
                        }
                    } else {
                        logger.debug("No applicationId found in role: " + roleId);
                    }
                }
            }
        } else {
            logger.debug("No roles found for user.");
        }
    } catch (e) {
        logger.error("Error in getWidgetforUserDetails: " + e.message);
    }

    return matchedWidgets;
}

// === Main Execution ===
try {
    var userId = nodeState.get("_id");
    logger.debug("Fetching widgets for userId: " + userId);

    var widgetresponseArray = getWidgetforUserDetails();

    // Get all widgets in the system
    var allWidgetsResult = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
        "_queryFilter": "true"
    }, ["_id", "name", "type"]);

    //var allWidgets = allWidgetsResult.result;
var allWidgets = [].concat(allWidgetsResult && allWidgetsResult.result ? allWidgetsResult.result : []);
    // Extract matched widget IDs
    var matchedWidgetIds = widgetresponseArray.map(function(widget) {
        return widget.widgetId;
    });

    // Get widgets not matched (i.e., user doesn't have access to)
    var unmatchedWidgets = allWidgets.filter(function(widget) {
        return matchedWidgetIds.indexOf(widget._id) === -1;
    });

    // Store or log both results
    if (!widgetresponseArray || widgetresponseArray.length === 0) {
        callbacksBuilder.textOutputCallback(0, "No_results_found.");
        logger.debug("No widgets found for user.");
        action.goTo("false");
    } else {
        var allAppsResponse = JSON.stringify(widgetresponseArray);
        nodeState.putShared("allAppsResponse", allAppsResponse);
        logger.debug("Widgets returned for user: " + allAppsResponse);
    }

    // Save unmatched widgets for further use
    var unmatchedResponse = JSON.stringify(unmatchedWidgets);
    nodeState.putShared("unmatchedWidgets", unmatchedResponse);
    logger.debug("Widgets user does NOT have access to: " + unmatchedResponse);
   callbacksBuilder.textOutputCallback(0, "Enroll_apps:" + unmatchedResponse);
   callbacksBuilder.textOutputCallback(0, "Launch_apps:" + allAppsResponse);
    action.goTo("true");
} catch (error) {
    logger.error("Unexpected error while fetching widgets: " + error);
    callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
    action.goTo("error");
}