var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "CheckuserReleaseStatus",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckuserProfileSetupforKYID",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    KYIDPROFILESETUP: "kyidProfileSetup",
    KYIDPROFILENOTSETUP: "kyidProfileNotSetup",
    ERROR: "Error"
};

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    debug: function(message) {
        logger.debug(message);
    },
    error: function(message) {
        logger.error(message);
    }
};

try {
    var KOGID = nodeState.get("KOGID");
    //var KOGID = "c4add3a2-01c2-4f99-b529-b12abede2cff"; 

    if (KOGID) {
        var usrResponse = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        });

        if (usrResponse.result && usrResponse.result.length > 0) {
            var usrResp = usrResponse.result[0];
            var userid = usrResp._id
            nodeState.putShared("UserId",userid)
            nodeState.putShared("_id",userid)

            //Collect following  data for ridp personal info page
            nodeState.putShared("orig_givenName",usrResp.givenName)

            if(usrResp.custom_middleName != null){
                nodeState.putShared("orig_custom_middleName",usrResp.custom_middleName)
            }
            
            nodeState.putShared("orig_sn",usrResp.sn)

            if(usrResp.custom_title != null){
                nodeState.putShared("orig_custom_title",usrResp.custom_title)
            }
            
            if(usrResp.custom_suffix != null){
            nodeState.putShared("orig_custom_suffix",usrResp.custom_suffix)
            }

             if(usrResp.custom_gender != null){
            nodeState.putShared("orig_custom_gender",usrResp.custom_gender)
             }

            if(usrResp.postalAddress != null){
            nodeState.putShared("orig_postalAddress",usrResp.postalAddress)
            }

            if(usrResp.custom_postalAddress2 != null){
            nodeState.putShared("orig_custom_postalAddress2",usrResp.custom_postalAddress2)
            }

            if(usrResp.city != null){
            nodeState.putShared("orig_city",usrResp.city)
            }

             if(usrResp.stateProvince != null){
            nodeState.putShared("orig_stateProvince",usrResp.stateProvince)
             }

             if(usrResp.postalCode != null){
            nodeState.putShared("orig_postalCode",usrResp.postalCode)
             }

             if(usrResp.custom_zipExtension != null){
            nodeState.putShared("postalExtension",usrResp.custom_zipExtension)
             }

           if(usrResp.custom_county != null){
            nodeState.putShared("orig_custom_county",usrResp.custom_county)
           }

            if(usrResp.country != null){
            nodeState.putShared("orig_custom_country",usrResp.country)
            }

            if(usrResp.custom_dateofBirth != null){
                 nodeState.putShared("orig_custom_dateofBirth",usrResp.custom_dateofBirth);
            }
            
            nodeLogger.debug("User found: " + JSON.stringify(usrResp));

            if (usrResp.custom_kyidProfileSetup === true || usrResp.custom_kyidProfileSetup === "true") {
                action.goTo(nodeOutcome.KYIDPROFILESETUP);
            } else {
                nodeLogger.debug("User profile not setup for KYID " + KOGID);
                nodeState.putShared("firsttimeloginjourney","true")
                nodeState.putShared("firsttimemfaheader","firsttimemfaheader") // Setting for header on firsttime mfa screen
                action.goTo(nodeOutcome.KYIDPROFILENOTSETUP);
            }
   
        } else {
            nodeLogger.debug("User not found in Ping: " + KOGID);
            action.goTo(nodeOutcome.ERROR);

        }
    }
} catch (error) {
    nodeLogger.error("Exception occurred: " + error.message);
    action.goTo(nodeOutcome.ERROR);
}