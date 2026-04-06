// Fetch all widgets
var allWidgets = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
    "_queryFilter": "true"
}).result;

var matchedWidgetId = null;

// Get values from nodeState
var roleName = nodeState.get("roleIds");
var appName = nodeState.get("appIDinWidget");

for (var j = 0; j < allWidgets.length; j++) {
    var widget = allWidgets[j];

   // var settings = widget.appLibrarySettings || {};

    var settings = {};
               if(nodeState.get("myAppsJourney")=="true"){
                settings = widget.appLibrarySettings || {};
               } else {
                settings = widget.appLibrarySettings || {};
               }
    
    var associatedRole = settings.associatedRoleSystemName || "";
    var associatedApp = settings.associatedAppSystemName || "";

    // Match by role
    if (roleName && roleName.indexOf(associatedRole) >= 0) {
        matchedWidgetId = widget._id;
        logger.debug("Matched by role, widget ID: " + matchedWidgetId);
        break;
    }

    // Match by app
    if (appName && appName.indexOf(associatedApp) >= 0) {
        matchedWidgetId = widget._id;
        logger.debug("Matched by app, widget ID: " + matchedWidgetId);
        break;
    }
}

nodeState.putShared("widgetSelected",matchedWidgetId)
outcome = "true"