var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Combined DisplaymyAppsScreen",
    script: "Script",
    scriptName: "KYID.2B1.Journey.getAndDisplayWidgets.Combine",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VIEWAPPDETAILS: "viewappdetails",
    SHOWLARGEICON: "showlargeicon",
    REMOVEROLE: "removerole",
    MANAGEACCESS: "manageaccess",
    DATAMISSING: "internalerrordatamissing",
    INVALIDACTION: "invalidaction",
    INVALIDINPUT: "invalidjson",
    ERROR: "error",
    FALSE: "false"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

var dashboardLib = require("KYID.2B1.Library.Dashboard");

function clearSharedState() {
    nodeState.putShared("invalidJSONError", null);
    nodeState.putShared("invalidAction", null);
    nodeState.putShared("myappswidgets", null);
    nodeState.putShared("unexpectederror", null);
    nodeState.putShared("roleremovalstatus", null);
    nodeState.putShared("validationError", null);
    nodeState.putShared("internaluser", null);
    nodeState.putShared("rolenotremovable", null);
    nodeState.putShared("requestroleType", null);
}

//Query all the widgets available in dashboard 
function getAllWidgets() {
    logger.error("Fetching all dashboard widgets...");

    //Show the widgets - recordState is ACTIVE and associatedAppSystemName in myAppsSettings value is present
    var query = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
    "_queryFilter": "((recordState eq \"active\" or recordState eq \"ACTIVE\" or recordState eq \"0\") and myAppsSettings/associatedAppSystemName pr)"
});

    var allWidgets = [];

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

function getRolesDetails(roleIds) {
    var roles = [];
    if (roleIds && roleIds.length > 0) {
        for (var i = 0; i < roleIds.length; i++) {
            var roleObj = openidm.read("managed/alpha_role/" + roleIds[i]);
            if (roleObj) {
                roles.push(roleObj);
            }
        }
    }
    return roles;
}


function getWidgetForUser(userId){

    const matchedWidgets = [];
    const userApps = []
    const userRoles = []
    const MO_ALPHA_USER = "managed/alpha_user/"
    const MO_KYID_DASHBOARDWIDGET = "managed/alpha_kyid_dashboardapplicationwidget"

    /* Get user profile record */
    const user = openidm.read(`${MO_ALPHA_USER}${userId}`,null,["*"])
    /* Get user's role (appname and role names) */     
    if(user.effectiveRoles && user.effectiveRoles.length>0){
        user.effectiveRoles.forEach(roleRef=>{
            const role = openidm.read(roleRef._ref,null,["name","businessAppId/name"])

            if(role.businessAppId  && role.businessAppId.name){
                userApps.push(role.businessAppId.name)
                userRoles.push(role.businessAppId.name+"-"+role.name)
                
            }
        })
    }
    
    /* Get all widgets */    
    //const allWidgets = openidm.query(MO_KYID_DASHBOARDWIDGET, {"_queryFilter":"/recordState eq \"active\" or /recordState eq \"0\" or /recordState eq \"ACTIVE\""},["*"]).result
    /* Get all active widgets and with myapps settings */
    // const allWidgets = openidm.query(
    // MO_KYID_DASHBOARDWIDGET,
    // {
    //     "_queryFilter": "((/recordState eq \"active\" or /recordState eq \"0\" or /recordState eq \"ACTIVE\") and myAppsSettings/associatedAppSystemName pr)"
    // },
    // ["*"]
    // ).result;

    //Adding the logic to

   var queryFilter = "((/recordState eq \"active\" or /recordState eq \"0\" or /recordState eq \"ACTIVE\") and myAppsSettings/associatedAppSystemName pr ";

        if (nodeState.get("typeofuser") === "Internal") {
            logger.error("user is internal in myApps query")
            // Internal user allowedUserType = 0 OR 2
           queryFilter += "and (allowedUserType eq \"0\" or allowedUserType eq \"2\" or allowedUserType eq \"\" or !(allowedUserType pr)))";
        } else {
            logger.error("user is external in myApps query")
            // External user allowedUserType = 1 OR 2 OR empty OR not present
             queryFilter += "and (allowedUserType eq \"1\" or allowedUserType eq \"2\" or allowedUserType eq \"\" or !(allowedUserType pr)))";
         }
        
        var allWidgets = openidm.query(
            MO_KYID_DASHBOARDWIDGET,
            { "_queryFilter": queryFilter },
            ["*"]
        ).result;
    
        allWidgets.forEach(widget => {
        var isAppMatch = false;
        var isRoleMatch = false;
        var myAppSettings = widget.myAppsSettings;
        var appLibSettings = widget.appLibrarySettings;
        if (myAppSettings) {
            /* Check if the associated app system name is present */
            if (myAppSettings.associatedAppSystemName) {
                    var associatedAppName = myAppSettings.associatedAppSystemName;
                    var associatedRoleList = myAppSettings.associatedRoleList || [];
                if(associatedAppName && associatedRoleList.length === 0){
                    logger.error("the associatedRoleList list is empty. Hence, it is application widget")
                    var associatedAppName = myAppSettings.associatedAppSystemName;
                    isAppMatch = associatedAppName && userApps.includes(associatedAppName);
                    associatedRoleName = null
                    
                }
                else if (associatedAppName && associatedRoleList.length > 0) {
                    logger.error("the widget has role list")

                    logger.error("the associatedRoleList:::"+associatedRoleList)
   
                        // Check if any of the user's roles for that app match any entry in the associatedRoleList
                        for (var r = 0; r < associatedRoleList.length; r++) {
                            var roleNameInList = associatedRoleList[r];
                            if (userRoles.includes(associatedAppName + "-" + roleNameInList)) {
                                isRoleMatch = true;
                                associatedRoleName = roleNameInList;
                                break;
                            }
                        }
                  //  }

                } else {
                    var associatedAppName = myAppSettings.associatedAppSystemName;
                    isAppMatch = associatedAppName && userApps.includes(associatedAppName);
                }
            }
        }
        /* Check if the user has role level or app level access that matches with the widget */
        if (isRoleMatch || isAppMatch) {
            var widgetTags = dashboardLib.getWidgetTags(widget._id);
            var widgetDynamicSE = dashboardLib.getDynamicContentEndpointId(widget._id);
            //var allActions = dashboardLib.getEllipsisActions(myAppSettings, null, associatedRoleName, appLibSettings, widget.type);
            var allActions = getEllipsisActions(myAppSettings, null, associatedRoleName, appLibSettings, widget.type);
            matchedWidgets.push({
                widgetId: widget._id,
                widgetName: widget.name,
                widgetType: widget.type,
                widgetDescription: widget.description,
                widgetLogoURL: widget.logoURL,
                widgetRoleID: associatedRoleName || null,
                widgetApplicationID: associatedAppName || null,
                widgetlaunchApplicationURL: myAppSettings.launchURL || "",
                widgettag: widgetTags,
                widgetContext: appLibSettings.enrollmentScope,
                widgetdynamicContentEndpointId: widgetDynamicSE || "null",
                widgetmaintainenceView: widget.maintenanceModeSettingsisEnabled,
                widgetmaintainenceMessage: widget.maintenanceModeSettingsmessage,
                contentTitle: (widget.content && widget.content[0] && widget.content[0].title) || {},
                contentMyApps: (widget.content && widget.content[0] && widget.content[0].myAppsDescription) || {},
                contentAppLibrary: (widget.content && widget.content[0] && widget.content[0].appLibDescription) || {},
                ellipsisActions: allActions
            })
        }
    })
    return matchedWidgets
}


function handleUserResponses() {
    try {
        var inputJsonString = callbacks.getTextInputCallbacks().get(0);
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        logger.error("User Input JSON String: " + inputJsonString);
        logger.error("Selected Outcome: " + selectedOutcome);

        if (selectedOutcome === 0) {
            var parsedInput = JSON.parse(inputJsonString);
            var inputId = parsedInput.roleId || parsedInput.applicationId;
            //var inputType = parsedInput.roleId ? "roleId" : "applicationId";
            var actionName = parsedInput.action;

            if (inputId) {
                logger.error("the inputId "+inputId);
                if(parsedInput.roleId){
                    nodeState.putShared("roleIds",parsedInput.roleId)
                   // nodeState.putShared("roleIds", [parsedInput.roleId]);
                    if(parsedInput.appId){
                     nodeState.putShared("appidinrolewidget",parsedInput.appId)
                    }
                } else {
                    logger.error("the inputId is for applicationID "+inputId);
                    nodeState.putShared("appIDinWidget",parsedInput.applicationId)
                }
               // nodeState.putShared(parsedInput.roleId ? "roleIds" : "appIDinWidget", inputId);
            }
           // nodeState.putShared("widgetSelected", parsedInput.widgetId);
            nodeState.putShared("nextAction", actionName);
        }
    } catch (err) {
        logger.error("Error in handleUserResponses: " + err.message);
        nodeState.putShared("validationError", "invalidjson");
    }
}

//Ellipsis function 
function getEllipsisActions(myAppsSettings, type, roleId, appLibrarySettings, widgetType) {
    var actions = [];
    var userType = nodeState.get("typeofuser");  // Get user type

    if (type === "enroll" || type === "Start an App") {
        actions.push({ action: "viewAppDetails", label: "View App Details" });

        if (widgetType === 1 || widgetType === "1") {
            actions.push({ action: "showLargeIcon", label: "Show Large Display" });
        }

        return actions;
    }

    if (type === "launch") {
        actions.push({ action: "viewAppDetails", label: "View App Details" });

        if (widgetType === 1 || widgetType === "1") {
            actions.push({ action: "showLargeIcon", label: "Show Large Display" });
        }

        // Skip Manage Access and Remove Role if internal user
        if (userType !== "Internal") {
            if (roleId) {
                actions.push({ action: "removeRole", label: "Remove Access" });
            } else {
                actions.push({ action: "manageAccess", label: "Manage Access" });
            }
        }

        return actions;
    }

    // Default behavior using myAppsSettings
    actions.push({ action: "viewAppDetails", label: "View App Details" });

    if (widgetType === 1 || widgetType === "1") {
        actions.push({ action: "showLargeIcon", label: "Show Large Display" });
    }

    if (myAppsSettings && myAppsSettings.allowManageAccess === true && userType !== "Internal") {
        if (roleId) {
            actions.push({ action: "removeRole", label: "Remove Access" });
        } else {
            actions.push({ action: "manageAccess", label: "Manage Access" });
        }
    }

    return actions;
}


// === MAIN EXECUTION ===
try {
    logger.error("KYID.2B1.Journey.getAndDisplayWidgets.Combine script initiated")
    var userId = nodeState.get("_id");
    var allWidgets = getWidgetForUser(userId);

    if (callbacks.isEmpty()) {
        if(nodeState.get("roleremovalstatus")){
            logger.error("roleremovalstatus::::"+nodeState.get("roleremovalstatus"))
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
        clearSharedState();

        
        if (!allWidgets || allWidgets.length === 0) {
            nodeState.putShared("myappswidgets", "empty");
            callbacksBuilder.textOutputCallback(0, "No_widgets_found_for_myApps");
            action.goTo(NodeOutcome.FALSE);
        } else {
            var allAppsResponse = JSON.stringify(allWidgets);
            callbacksBuilder.textOutputCallback(0, allAppsResponse);
            callbacksBuilder.textInputCallback("Enter JSON Input");
            callbacksBuilder.confirmationCallback(0, ["Next"], 0);
        }
    } else {
        handleUserResponses(allWidgets);

        var validationError = nodeState.get("validationError");
        if (validationError) {
            clearSharedState();
            switch (validationError) {
                case "invalidjson":
                    action.goTo(NodeOutcome.INVALIDINPUT);
                    break;
                case "invalidaction":
                    action.goTo(NodeOutcome.INVALIDACTION);
                    break;
                case "internalerrordatamissing":
                    action.goTo(NodeOutcome.DATAMISSING);
                    break;
                default:
                    action.goTo(NodeOutcome.ERROR);
            }
        }

        var nextAction = nodeState.get("nextAction");
        if (nextAction) {
            clearSharedState();
            switch (nextAction) {
                case "viewAppDetails":
                    logger.error("user selected view app details")
                    action.goTo(NodeOutcome.VIEWAPPDETAILS);
                    break;
                case "showLargeIcon":
                    action.goTo(NodeOutcome.SHOWLARGEICON);
                    break;
                case "removeRole":
                    logger.error("user clicked remove role")
                    action.goTo(NodeOutcome.REMOVEROLE);
                    break;
                case "manageAccess":
                    action.goTo(NodeOutcome.MANAGEACCESS);
                    break;
                default:
                    action.goTo(NodeOutcome.ERROR);
                    break;
            }
        }
    }
} catch (err) {
    logger.error("Fatal error: " + err.message);
    action.goTo(NodeOutcome.ERROR);
}