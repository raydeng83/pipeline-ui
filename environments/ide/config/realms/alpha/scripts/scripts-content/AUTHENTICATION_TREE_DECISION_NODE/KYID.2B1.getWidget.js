var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
    
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Dashboard getWidgetformyAppScreen",
    script: "Script",
    scriptName: "KYID.2B1.getWidget",
    timestamp: dateTime,
    end: "Node Execution Completed"
};
    
var NodeOutcome = {
    TRUE: "true",
    FALSE: "false",
    ERROR: "error"
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
};

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
                                widgetTagsList.push({ id: tagID, name: tagObj.name, code: tagObj.code });
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
                            widgetlaunchApplicationURL: widgetResponse.launchApplicationURL,
                            widgettag: widgetTagsList,
                            widgetmaintainenceView: widgetResponse.maintainanceView[0].enableMode,
                            widgetmaintainenceMessage: widgetResponse.maintainanceView[0].message,
                            contentTitle: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].title) || {},
                            contentMyApps: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].myApps) || {},
                            contentAppLibrary: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].appLibrary) || {},
                            ellipsisActions: [
                                { action: "viewAppDetails", label: "View_App_Details" },
                                { action: "showLargeIcon", label: "Show_Large_Display" },
                                { action: "removeRole", label: "Remove_Access" }
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
                                    widgetlaunchApplicationURL: AppWidget.launchApplicationURL,
                                    widgettag: widgetTagsAppList,
                                    widgetmaintainenceView: AppWidget.maintainanceView[0].enableMode,
                                    widgetmaintainenceMessage: AppWidget.maintainanceView[0].message,
                                    contentTitle: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].title) || {},
                                    contentMyApps: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].myApps) || {},
                                    contentAppLibrary: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].appLibrary) || {},
                                    ellipsisActions: [
                                        { action: "viewAppDetails", label: "View_App_Details" },
                                        { action: "showLargeIcon", label: "Show_Large_Display" },
                                        { action: "manageAccess", label: "Manage_Access" }
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

// Main Execution
try {
    var userId = nodeState.get("_id");
    logger.debug("Fetching widgets for userId: " + userId);

    var widgetresponseArray = getWidgetforUserDetails();

    if (!widgetresponseArray || widgetresponseArray.length === 0) {
        //callbacksBuilder.textOutputCallback(0, "No_results_found.");
        nodeState.putShared("myappswidgets", "empty");
        nodeState.putShared("allAppsResponse", null);
        logger.debug("No widgets found for user.");
        action.goTo("false");
    } else {
        var allAppsResponse = JSON.stringify(widgetresponseArray);
        nodeState.putShared("allAppsResponse", allAppsResponse);
        logger.debug("Widgets returned for user: " + allAppsResponse);
        action.goTo("true");
    }
} catch (error) {
    logger.error("Unexpected error while fetching widgets: " + error);
    callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
    action.goTo("error");
}