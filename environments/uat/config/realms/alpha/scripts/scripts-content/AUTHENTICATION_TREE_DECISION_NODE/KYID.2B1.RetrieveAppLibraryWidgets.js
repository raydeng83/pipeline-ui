var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
    
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "RetrieveAppLibraryWidgets",
    script: "Script",
    scriptName: "KYID.2B1.RetrieveAppLibraryWidgets",
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
                            widgettag: widgetTagsList,
                            widgetmaintainenceView: widgetResponse.maintainanceView[0].enableMode,
                            widgetmaintainenceMessage: widgetResponse.maintainanceView[0].message,
                            widgetlaunchApplicationURL: widgetResponse.launchApplicationURL,
                            widgetisFeatured: widgetResponse.isFeatured,
                            contentTitle: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].title) || {},
                            contentMyApps: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].myApps) || {},
                            contentAppLibrary: (widgetResponse.content && widgetResponse.content[0] && widgetResponse.content[0].appLibrary) || {},
                            ellipsisActions: [
                                { action: "viewAppDetails", label: "View App Details" },
                                { action: "showLargeIcon", label: "Show Large Display" },
                                { action: "removeRole", label: "Remove Access" }
                            ],
                            typeofwidgetinappLibrary: "launch"
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
                                            widgetTagsAppList.push({ id: tagID, name: tagObj.name , code: tagObj.code });
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
                                    widgetmaintainenceView: AppWidget.maintainanceView[0].enableMode,
                                    widgetmaintainenceMessage: AppWidget.maintainanceView[0].message,
                                     widgetlaunchApplicationURL: AppWidget.launchApplicationURL,
                                     widgetisFeatured: AppWidget.isFeatured,
                                    contentTitle: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].title) || {},
                                    contentMyApps: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].myApps) || {},
                                    contentAppLibrary: (AppWidget.content && AppWidget.content[0] && AppWidget.content[0].appLibrary) || {},
                                    ellipsisActions: [
                                        { action: "viewAppDetails", label: "View App Details" },
                                        { action: "showLargeIcon", label: "Show Large Display" },
                                        { action: "manageAccess", label: "Manage Access" }
                                    ],
                                    typeofwidgetinappLibrary: "launch"
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

    var allWidgets = [].concat(allWidgetsResult && allWidgetsResult.result ? allWidgetsResult.result : []);

    // Extract matched widget IDs
    var matchedWidgetIds = widgetresponseArray.map(function(widget) {
        return widget.widgetId;
    });

    // Get unmatched widgets and add typeofwidgetinappLibrary
    // var unmatchedWidgets = allWidgets.filter(function(widget) {
    //     return matchedWidgetIds.indexOf(widget._id) === -1;
    // }).map(function(widget) {
    //     return {
    //         widgetId: widget._id,
    //         widgetName: widget.name,
    //         widgetType: widget.type,
    //         typeofwidgetinappLibrary: "enroll"
    //     };
    // });

   var unmatchedWidgets = [];

var unmatchedWidgetCandidates = allWidgets.filter(function(widget) {
    return matchedWidgetIds.indexOf(widget._id) === -1;
});

for (var i = 0; i < unmatchedWidgetCandidates.length; i++) {
    var widget = unmatchedWidgetCandidates[i];
    var fullWidget = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widget._id);
    
    if (fullWidget) {
        // Fetch widget tags
        var widgettagResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + fullWidget._id + "/widgetTags", {
            "_queryFilter": "true"
        }, [""]);

        var widgetTagsAppList = [];

        if (widgettagResponse && widgettagResponse.result.length > 0) {
            for (var j = 0; j < widgettagResponse.result.length; j++) {
                var tagID = widgettagResponse.result[j]._refResourceId;
                var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
                if (tagObj) {
                    widgetTagsAppList.push({ id: tagID, name: tagObj.name, code: tagObj.code });
                }
            }
        }

        //fetch the request url
        var roleID = null;
var appIDinWidget = null;

if (fullWidget.roleId && fullWidget.roleId._refResourceId) {
    roleID = fullWidget.roleId._refResourceId;
} else if (fullWidget.applicationId && fullWidget.applicationId._refResourceId) {
    appIDinWidget = fullWidget.applicationId._refResourceId;
}

var widrequestURL = null;
if (roleID) {
    widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID=" + roleID;
} else if (appIDinWidget) {
    widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_requestAccess&appIDinWidget=" + appIDinWidget;
} else {
    logger.debug("Neither roleID nor appIDinWidget present for widget: " + fullWidget._id);
}

        unmatchedWidgets.push({
            widgetId: fullWidget._id,
            widgetName: fullWidget.name,
            widgetType: fullWidget.type,
            widgetContext: fullWidget.enrollmentProfile.enrollmentContext || null,
            widgetLogoURL: fullWidget.logoURL || null,
            widgetRoleID: (fullWidget.roleId && fullWidget.roleId._refResourceId) || null,
           widgetApplicationID: (fullWidget.applicationId && fullWidget.applicationId._refResourceId) || null,
            widgetdynamicContentEndpointId: fullWidget.dynamicContentEndpointId || null,
            widgetmaintainenceView: fullWidget.maintainanceView[0].enableMode,
            widgetmaintainenceMessage: fullWidget.maintainanceView[0].message,
            widgetlaunchApplicationURL: fullWidget.launchApplicationURL,
            widgetisFeatured: fullWidget.isFeatured,
            widgettag: widgetTagsAppList,
            contentTitle: (fullWidget.content && fullWidget.content.title) || {},
            contentMyApps: (fullWidget.content && fullWidget.content.myApps) || {},
            contentAppLibrary: (fullWidget.content && fullWidget.content.appLibrary) || {},
            widrequestURL: widrequestURL,
            ellipsisActions: [
        { action: "viewAppDetails", label: "View App Details" }
    ],
            typeofwidgetinappLibrary: "enroll"
        });
    }
}

    
    // Combine matched and unmatched
    var combinedWidgets = widgetresponseArray.concat(unmatchedWidgets);
    var combinedResponse = JSON.stringify(combinedWidgets);

    // Save and log combined result
    nodeState.putShared("combinedWidgets", combinedResponse);
    logger.debug("Combined widgets for user: " + combinedResponse);

    if (combinedWidgets.length === 0) {
        callbacksBuilder.textOutputCallback(0, "No_results_found.");
        action.goTo("false");
    } else {
        //callbacksBuilder.textOutputCallback(0, "Combined_widgets:" + combinedResponse);
        action.goTo("true");
    }

} catch (error) {
    logger.error("Unexpected error while fetching widgets: " + error);
    callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
    action.goTo("error");
}