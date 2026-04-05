
var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");

var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "AppLibraryCombinedNode",
    script: "Script",
    scriptName: "KYID.2B1.Journey.AppLibraryScreen.Combine",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VIEWAPP: "viewappdetails",
    SHOWLARGEICON: "showlargeicon",
    REMOVEROLE: "removerole",
    MANAGEACCESS: "manageaccess",
    FALSE: "false",
    ERROR: "error",
    INTERNALDATAMISSING: "internalerrordatamissing",
    INVALIDACTION: "invalidaction",
    INVALIDINPUT: "invalidjson"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

// LIBRARY
var dashboardLib = require("KYID.2B1.Library.Dashboard");

var combined = [];
var widgetString = "";

//Functions
function clearSharedState() {
    nodeState.putShared("inputError", null);
    nodeState.putShared("invalidJSONError", null);
    nodeState.putShared("invalidAction", null);
    nodeState.putShared("unexpectederror", null);
    nodeState.putShared("roleremovalstatus", null);
    nodeState.putShared("internaluser", null);
    nodeState.putShared("requestroleType", null);
}

function buildWidgetObject(widget, roleName, appName, type, launchUrlmyApps) {
    try {
        var appLibSettings = widget.appLibrarySettings || {};
        var settings = widget.myAppsSettings || {};
        var enrollmentScope = appLibSettings.enrollmentScope;
        var widgetTags = dashboardLib.getWidgetTags(widget._id);
        var widgetDynamicSE = dashboardLib.getDynamicContentEndpointId(widget._id);
        var allActions = dashboardLib.getEllipsisActions(settings, type, roleName, appLibSettings, widget.type);
        var obj = {
            widgetId: widget._id,
            widgetName: widget.name,
            widgetType: widget.type,
            widgetDescription: widget.description,
            widgetLogoURL: widget.logoURL || null,
            widgetRoleID: appLibSettings.associatedRoleSystemName || null,
            widgetApplicationID: appLibSettings.associatedAppSystemName || null,
            widgetdynamicContentEndpointId: widgetDynamicSE || "null",
            widgetlaunchApplicationURL: launchUrlmyApps || (widget.myAppsSettings && widget.myAppsSettings.launchURL) || null,
            widgetisFeatured: widget.isFeatured || false,
            widgettag: widgetTags,
            widgetContext: appLibSettings.enrollmentScope,
            contentTitle: (widget.content && widget.content[0] && widget.content[0].title) || {},
            contentMyApps: (widget.content && widget.content[0] && widget.content[0].myAppsDescription) || {},
            contentAppLibrary: (widget.content && widget.content[0] && widget.content[0].appLibDescription) || {},
            ellipsisActions: allActions,
            typeofwidgetinappLibrary: type
        };
        
        // if ((enrollmentScope === "2" && appLibSettings.applicationURL!= null) || (type === "enroll" && appLibSettings.applicationURL!= null)) {
        //     obj.quickEnrollURL = appLibSettings.applicationURL;
        //     logger.debug("the enrollscope is 2 OR application widget is Quick Enroll")
        // }
        
        if ((enrollmentScope === "2" && appLibSettings.applicationURL!= null)) {
            obj.quickEnrollURL = appLibSettings.applicationURL;
            logger.debug("the enrollscope is 2. Enroll Link to redirect to applicationURL")
        } else  if((enrollmentScope === "3" && appLibSettings.enrollmentContext!= null && type === "enroll")){
            var portalURL = systemEnv.getProperty("esv.portal.url") || ""
            var contextID = appLibSettings.enrollmentContext
            obj.quickEnrollURL = portalURL + "/appenroll/" + contextID
            logger.debug("the enrollscope is 3. Enroll Link to redirect to applicationURL")
        }

       // nodeLogger.error("Built widget object");
        return obj;
    } catch (e) {
        nodeLogger.error("Error building widget object for widgetId: " + (widget && widget._id) + " — " + e);
        throw e;
    }
}

// function getAllWidgets() {

//     var query = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
//     "_queryFilter": "((recordState eq \"active\" or recordState eq \"ACTIVE\" or recordState eq \"0\") and appLibrarySettings/associatedAppSystemName pr)"
// });
    
//     var widgets = [];
//     if (query.result && query.result.length > 0) {
//         for (var i = 0; i < query.result.length; i++) {
//             var widgetObj = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + query.result[i]._id);
//             //if (widgetObj && widgetObj.myAppsSettings && widgetObj.appLibrarySettings) {
//             if (widgetObj && widgetObj.appLibrarySettings) {
//                 logger.debug("Widget ID: " + widgetObj._id + ", appLibrarySettings: " + JSON.stringify(widgetObj.appLibrarySettings));
//                 widgets.push(widgetObj);
//             }
//         }
//     }
//     return widgets;
// }

function getAllWidgets() {

    var query = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
    "_queryFilter": "((recordState eq \"active\" or recordState eq \"ACTIVE\" or recordState eq \"0\") and appLibrarySettings/associatedAppSystemName pr)"
});
    
    var widgets = [];
    if (query.result && query.result.length > 0) {
        for (var i = 0; i < query.result.length; i++) {
            var widgetObj = query.result[i];
            if (widgetObj && widgetObj.appLibrarySettings) {
                widgets.push(widgetObj);
            }
        }
    }
    return widgets;
}

function getMatchedWidgets(userId, allWidgets) {
    nodeLogger.debug("Matching widgets for userId: " + userId);
    var matched = [], seen = [];

    var roleIds = dashboardLib.getUserRole(userId) || [];
    var userRoles = [];

    var userRoleNames = [];
    var userAppNames = [];

    for (var i = 0; i < roleIds.length; i++) {
        var role = openidm.read("managed/alpha_role/" + roleIds[i]);
        if (role) {
            userRoles.push(role);
            userRoleNames.push(role.name);
            if (role.businessAppId && role.businessAppId._refResourceId) {
                var app = openidm.read("managed/alpha_kyid_businessapplication/" + role.businessAppId._refResourceId);
                if (app && app.name) {
                    userAppNames.push(app.name);
                }
            }
        }
    }

 //   nodeLogger.debug("User roles: " + userRoleNames + ", apps: " + userAppNames);

    for (var j = 0; j < allWidgets.length; j++) {
        var widget = allWidgets[j];
      //  if (!widget || !widget.myAppsSettings || !widget.appLibrarySettings) {
             if (!widget || !widget.appLibrarySettings) {
          //  nodeLogger.error("Skipping invalid widget (missing settings): " + (widget && widget._id));
            continue;
        }

        var associatedRole = widget.appLibrarySettings.associatedRoleSystemName;
        var associatedApp = widget.appLibrarySettings.associatedAppSystemName;

        var isRoleMatch = userRoleNames.indexOf(associatedRole) >= 0;
        var isAppMatch = userAppNames.indexOf(associatedApp) >= 0;

        //Enhancement made for KICCS
        // Check if widget is role-specific with associatedRoleList
        var appLibrarySettings = widget.appLibrarySettings;
        if(appLibrarySettings && (appLibrarySettings.isRoleSpecific === true || appLibrarySettings.isRoleSpecific === "true")){
            if (appLibrarySettings.associatedRoleList && appLibrarySettings.associatedRoleList.length > 0) {
            logger.error("the widget::"+widget.name+"is role specific"+appLibrarySettings.isRoleSpecific)
            var associatedRoleList = appLibrarySettings.associatedRoleList || [];
            //var associatedAppName = appLibrarySettings.associatedAppSystemName;
            
            isAppMatch = false;
            for (var r = 0; r < associatedRoleList.length; r++) {
                var roleName = associatedRoleList[r];
                if (userRoleNames.indexOf(roleName) >= 0) {
                    isAppMatch = true;
                    break;
                }
            }
        } else {
     //         if (userAppNames.indexOf(associatedApp) >= 0) {
     //                isAppMatch = true;
					// }
                // Check if another role-specific widget exists for same app that user has access to
                var hasRoleSpecificAccess = false;
                logger.error("hasRoleSpecificAccess set to false")

                // Only consider user's roles for the SAME associated app; userRoleNames can include many roles from other apps.
                var userRoleNamesForThisApp = [];
                for (var ur = 0; ur < userRoles.length; ur++) {
                    var roleObj = userRoles[ur];
                    if (roleObj && roleObj.businessAppId && roleObj.businessAppId._refResourceId) {
                        var roleApp = openidm.read("managed/alpha_kyid_businessapplication/" + roleObj.businessAppId._refResourceId);
                        if (roleApp && roleApp.name === associatedApp) {
                            userRoleNamesForThisApp.push(roleObj.name);
                        }
                    }
                }

                for (var w = 0; w < allWidgets.length; w++) {
                    var otherWidget = allWidgets[w];
                    if (otherWidget._id !== widget._id && 
                        otherWidget.appLibrarySettings && 
                        (otherWidget.appLibrarySettings.isRoleSpecific === true || otherWidget.appLibrarySettings.isRoleSpecific === "true") &&
                        otherWidget.appLibrarySettings.associatedAppSystemName === associatedApp &&
                        otherWidget.appLibrarySettings.associatedRoleList) {
                        
                        var otherRoleList = otherWidget.appLibrarySettings.associatedRoleList;
                        var hasMatchingRole = false;
                        var hasNonMatchingRole = false;
                        
                        for (var r = 0; r < otherRoleList.length; r++) {
                            if (userRoleNamesForThisApp.indexOf(otherRoleList[r]) >= 0) {
                                hasMatchingRole = true;
                            }
                        }
                        
                        // Check if user has roles NOT in the role-specific list (for this app only)
                        for (var u = 0; u < userRoleNamesForThisApp.length; u++) {
                            if (otherRoleList.indexOf(userRoleNamesForThisApp[u]) < 0) {
                                hasNonMatchingRole = true;
                                logger.error("isRoleSpecific:otherRoleList"+otherRoleList)
                                logger.error("isRoleSpecific:userRoleNamesForThisApp"+userRoleNamesForThisApp)
                                logger.error("isRoleSpecific:user has roles NOT in the role-specific list (for this app)")
                                break;
                            }
                        }
                        
                        if (hasMatchingRole && !hasNonMatchingRole) {
                            logger.error("isRoleSpecific:user has hasMatchingRole and no hasNonMatchingRole")
                            hasRoleSpecificAccess = true;
                        }
                        
                        if (hasRoleSpecificAccess) break;
                    }
                }
                
                if (hasRoleSpecificAccess) {
                    isAppMatch = false;
                    isRoleMatch = false;
                    logger.error("hasRoleSpecificAccess is true")
                } else {
                    if(userAppNames.indexOf(associatedApp) >= 0){
                    isAppMatch = true;
                    logger.error("hasRoleSpecificAccess is false but userAppNames is part of associatedApp")
                    } else {
                       isAppMatch = false; 
                       logger.error("hasRoleSpecificAccess is false but userAppNames is not part of associatedApp")
                    }
                    
                }
        }
        }
        
        
         if ((isRoleMatch || isAppMatch) && seen.indexOf(widget._id) < 0) {

            //Extra query to fetch launchURL widget (same name, must have launchURL)
            var launchUrlmyApps = null;

             var launchQuerywithoutname = null;
             
              var launchQuery = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
             "_queryFilter":
            'name eq "' + widget.name + '"' +
            ' and myAppsSettings/associatedAppSystemName eq "' + associatedApp + '"' +
            ' and myAppsSettings/launchURL pr'
            });

            // if (launchQuery.result && launchQuery.result.length > 0) {
            //     launchUrlmyApps = launchQuery.result[0].myAppsSettings.launchURL;
            //   //  logger.debug("Launch URL found for widget: " + widget.name + " -> " + launchUrlmyApps);
            // }

             if (launchQuery.result && launchQuery.result.length > 0) {
                if(launchQuery.result[0].myAppsSettings.launchURL !== undefined && launchQuery.result[0].myAppsSettings.launchURL !== null){
            launchUrlmyApps = launchQuery.result[0].myAppsSettings.launchURL;
                    logger.error("the launchUrlmyApps from launchQuery "+launchUrlmyApps)
            } else {
                 launchQuerywithoutname = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
             "_queryFilter":
            'myAppsSettings/associatedAppSystemName eq "' + associatedApp + '"' +
            ' and myAppsSettings/launchURL pr'
            });

            if (launchQuerywithoutname.result && launchQuerywithoutname.result.length > 0) {
                launchUrlmyApps = launchQuerywithoutname.result[0].myAppsSettings.launchURL;
                logger.error("the launchUrlmyApps from launchQuerywithoutname "+launchUrlmyApps)
            }
            }
            } 
             else {
                launchQuerywithoutname = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
             "_queryFilter":
            'myAppsSettings/associatedAppSystemName eq "' + associatedApp + '"' +
            ' and myAppsSettings/launchURL pr'
            });

            if (launchQuerywithoutname.result && launchQuerywithoutname.result.length > 0) {
                launchUrlmyApps = launchQuerywithoutname.result[0].myAppsSettings.launchURL;
                logger.error("the launchUrlmyApps from launchQuerywithoutname when launchQuery gives no result: "+launchUrlmyApps)
            }
            }
             
            var widgetObj = buildWidgetObject(widget, associatedRole, associatedApp, "launch", launchUrlmyApps);

            matched.push(widgetObj);
            seen.push(widget._id);
        }
    }

    return matched;
}

function getUnmatchedWidgets(allWidgets, matchedIds) {
    nodeLogger.debug("Filtering unmatched widgets...");
    var unmatched = [];

    for (var i = 0; i < allWidgets.length; i++) {
        var widget = allWidgets[i];

        if (!widget || !widget.appLibrarySettings) {
            nodeLogger.error("Skipping invalid widget in unmatched set: " + (widget && widget._id));
            continue;
        }

        if (matchedIds.indexOf(widget._id) >= 0) {
            continue;
        }

        var roleName = widget.appLibrarySettings.associatedRoleSystemName || null;
        var appName = widget.appLibrarySettings.associatedAppSystemName || null;

        var enrollType = "enroll";
        if (widget.appLibrarySettings.enrollmentScope === "2") {
            enrollType = "Start an App";
        }

        var obj = buildWidgetObject(widget, roleName, appName, enrollType);

        // if (widget.appLibrarySettings.enrollmentScope === "1") {
        //     obj.widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID=" + roleName;
        // } else {
        //     obj.widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_requestAccess&appIDinWidget=" + appName;
        // }

      //  nodeLogger.error("Unmatched widget added: " + widget._id);
        unmatched.push(obj);
    }

    return unmatched;
}

function handleUserInput() {
    var inputJson = callbacks.getTextInputCallbacks().get(0);
    logger.debug("Received input: " + inputJson);

    var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
    logger.debug("inside handleUserInput in appLib");

    if (selectedOutcome === 0) {
        try {
            var inputWidget = JSON.parse(inputJson);

            if ((!inputWidget.roleId && !inputWidget.applicationId && !inputWidget.widgetId) || !inputWidget.action) {
                nodeState.putShared("inputError", "invalidjson");
                return;
            }

            // Validation skipped since we can't compare against widget list without storing full widget state
            nodeState.putShared("actionToTake", inputWidget.action);

            //Fetch the roleId and appTD
           if (inputWidget && inputWidget.widgetId) {
                    logger.debug("the inputId for viewAppDetails: " + inputWidget.widgetId);
                    nodeState.putShared("widgetselected", inputWidget.widgetId);
                }
                else if (inputWidget.roleId) {
                nodeState.putShared("roleIds", inputWidget.roleId);
                logger.debug("Matched roleId: " + inputWidget.roleId);
                if(inputWidget.appId){
                     nodeState.putShared("appidinrolewidget",inputWidget.appId)
                    }
            } else if (inputWidget.applicationId) {
                nodeState.putShared("appIDinWidget", inputWidget.applicationId);
                logger.debug("Matched applicationId: " + inputWidget.applicationId);
            }

        } catch (e) {
            logger.debug("JSON parse error in handleUserInput: " + e);
            nodeState.putShared("inputError", "invalidjson");
        }
    }
}

//=== Main Execution ===
try {
    if (callbacks.isEmpty()) {

        //Role Remove Success or Failure Message
        if(nodeState.get("roleremovalstatus")){
            logger.debug("roleremovalstatus::::"+nodeState.get("roleremovalstatus"))
            //callbacksBuilder.textOutputCallback(0, nodeState.get("roleremovalstatus"));
            if(nodeState.get("roleremovalstatus") === "Role Removed Failed"){
            errMsg["code"] = "ERR-REM-ROL-001";
            errMsg["message"] = nodeState.get("roleremovalstatus");  
            callbacksBuilder.textOutputCallback(0,JSON.stringify(errMsg))
            } else {
            errMsg["code"] = "ERR-REM-ROL-000";
            errMsg["message"] = nodeState.get("roleremovalstatus");  
            callbacksBuilder.textOutputCallback(0,JSON.stringify(errMsg))
        }
        }
        
        var userId = nodeState.get("_id");
        var widgets = getAllWidgets();
        logger.debug("all widgets::"+widgets)
        var matched = getMatchedWidgets(userId, widgets);
        var unmatched = getUnmatchedWidgets(widgets, matched.map(w => w.widgetId));
        var combined = matched.concat(unmatched);

        var widgetString = JSON.stringify(combined);
       // nodeState.putShared("combinedWidgets", widgetString);

        if (combined.length === 0) {
            callbacksBuilder.textOutputCallback(0, "No_results_found.");
            action.goTo(NodeOutcome.FALSE);
        } else {
            //presentDataToUser(widgetString);
            callbacksBuilder.textOutputCallback(0, widgetString);
            callbacksBuilder.textInputCallback("Enter JSON Input");
            callbacksBuilder.confirmationCallback(0, ["Next"], 0);
        }

    } else {
        logger.debug("inside handleUserInput function")
        handleUserInput();
       
        var inputError = nodeState.get("inputError");
        if (inputError) {
            logger.debug("Redirecting due to validation error: " + inputError);
            clearSharedState();

            switch (inputError) {
                case "invalidjson":
                    nodeState.putShared("combinedWidgets",null)
                    action.goTo("invalidjson");
                    break;
                case "invalidaction":
                    nodeState.putShared("combinedWidgets",null)
                    action.goTo("invalidaction");
                    break;
                case "internalerrordatamissing":
                    nodeState.putShared("combinedWidgets",null)
                    action.goTo("internalerrordatamissing");
                    break;
                default:
                    nodeState.putShared("combinedWidgets",null)
                    action.goTo("error"); 
                    break;
            }
        } else {
            var actionToTake = nodeState.get("actionToTake");
        if (actionToTake) {
            logger.debug("Proceeding to action node: " + actionToTake);
            clearSharedState();
            switch (actionToTake) {
                case "viewAppDetails":
                    nodeState.putShared("combinedWidgets",null)
                    action.goTo("viewappdetails");
                    break;
                case "showLargeIcon":
                    action.goTo("showlargeicon");
                    break;
                case "removeRole":
                    logger.debug("User clicked Remove role")
                    action.goTo("removerole");
                    break;
                case "manageAccess":
                    nodeState.putShared("combinedWidgets",null)
                    logger.debug("user selected manage access")
                    action.goTo("manageaccess");
                    break;
                default:
                    nodeState.putShared("combinedWidgets",null)
                    logger.debug("Unknown action: " + actionToTake);
                    action.goTo("error");
                    break;
            }
        }
    }
} 
}catch (err) {
    nodeState.putShared("combinedWidgets",null)
    nodeLogger.error("Fatal error: " + err);
    action.goTo(NodeOutcome.ERROR);
}