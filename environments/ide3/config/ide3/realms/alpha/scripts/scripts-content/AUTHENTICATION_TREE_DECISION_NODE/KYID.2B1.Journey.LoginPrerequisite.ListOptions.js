var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var errMsg = {};
var libError = null;
var ops = null;
libError = require("KYID.2B1.Library.Loggers");
ops = require("KYID.2B1.Library.IDMobjCRUDops");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Login Prerequisite List Options",
    script: "Script",
    scriptName: "KYID.2B1.Journey.LoginPrerequisite.ListOptions",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SKIP: "skip",
    ORGAN_DONAR: "organDonar",
    APP_ENROLL: "enrolment",
    ReVerify_Prerequisite: "reverifyPrerequisite",
    REVIEW: "review",
    EnrollMFA: "enrollMFA",
    LOGIN: "login",
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
}

// Main Execution
try {
    var formattedDate = getCurrentDate(); // Today's Date in YYYY-MM-DD
    var usrKOGID = nodeState.get("KOGID");
    var prereqname = null;
    var sequence = null;
    getUserDetails(usrKOGID);
    var preqOptions = displayLoginPrerequisite();
    var preqOptionsWithFormatedJSON = formatJSON(preqOptions);

    nodeState.putShared("prereqContextID", "login");


    // for (i = 0; i < preqOptionsWithFormatedJSON.loginPrerequisite.mandatory.length; i++) {
    //     prereqname = preqOptionsWithFormatedJSON.loginPrerequisite.mandatory[i].prereqname;
    //     sequence = preqOptionsWithFormatedJSON.loginPrerequisite.mandatory[i].sequence;
    //     populateRequestEntry(prereqname, sequence);
    // }
    // for (j = 0; j < preqOptionsWithFormatedJSON.loginPrerequisite.optional.length; j++) {
    //     prereqname = preqOptionsWithFormatedJSON.loginPrerequisite.optional[j].prereqname;
    //     sequence = preqOptionsWithFormatedJSON.loginPrerequisite.optional[j].sequence;
    //     populateRequestEntry(prereqname, sequence);
    // }

    if (preqOptionsWithFormatedJSON.loginPrerequisite.optional.length == 0 && preqOptionsWithFormatedJSON.loginPrerequisite.mandatory.length == 0) {
        logger.debug("No Login Prerequiste Present")
        action.goTo(NodeOutcome.LOGIN)
    }
    else {
        if (callbacks.isEmpty()) {
            requestCallbacks();
        } else {
            handleUserResponses();
        }

    }



} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error Occurred in Main Exacution" + error.message + "::" + mail);
}


function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        if (nodeState.get("validationErrorCode") != null) {
            var errorMessage = nodeState.get("validationErrorCode")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        callbacksBuilder.textOutputCallback(0, "1_login_prerequisite");

        callbacksBuilder.textOutputCallback(0, JSON.stringify(preqOptionsWithFormatedJSON));

        if (preqOptionsWithFormatedJSON.loginPrerequisite.mandatory.length > 0) {
            callbacksBuilder.confirmationCallback(0, ["Start"], 0);
        }
        else if (preqOptionsWithFormatedJSON.loginPrerequisite.optional.length > 0)
            callbacksBuilder.confirmationCallback(0, ["Start", "Skip"], 0);


    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message + "::" + mail);
    }

}


function handleUserResponses() {
    nodeState.putShared("journeyName", "loginPrerequisite");
    nodeState.putShared("loginPrereqEnrollMFA", null);
    patchUserLastLogin(nodeState.get("userIDinSession"), formattedDate)
    var foundLoginPrerequisite = false;
    try {
        var allowedListOfTypesOfPrereq = null;
        if (nodeState.get("diffTypesOfLoginPrereqs") != null && nodeState.get("diffTypesOfLoginPrereqs")) {
            allowedListOfTypesOfPrereq = nodeState.get("diffTypesOfLoginPrereqs");
        } else {
            logger.debug("List of types of login prerequisites is missing")
            action.goTo(NodeOutcome.ERROR);
        }
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var todoItem = null;
        var prereqname = null;
        var sequence = null;
        for (var i = 0; i < preqOptionsWithFormatedJSON.loginPrerequisite.mandatory.length; i++) {
            if (preqOptionsWithFormatedJSON.loginPrerequisite.mandatory[i].status === "TODO") {
                todoItem = preqOptionsWithFormatedJSON.loginPrerequisite.mandatory[i].type;
                prereqname = preqOptionsWithFormatedJSON.loginPrerequisite.mandatory[i].prereqname;
                sequence = preqOptionsWithFormatedJSON.loginPrerequisite.mandatory[i].sequence;
                break;
            }
        }

        if (todoItem === null) {
            for (var i = 0; i < preqOptionsWithFormatedJSON.loginPrerequisite.optional.length; i++) {
                if (preqOptionsWithFormatedJSON.loginPrerequisite.optional[i].status === "TODO") {
                    todoItem = preqOptionsWithFormatedJSON.loginPrerequisite.optional[i].type;
                    prereqname = preqOptionsWithFormatedJSON.loginPrerequisite.optional[i].prereqname;
                    sequence = preqOptionsWithFormatedJSON.loginPrerequisite.optional[i].sequence;
                    break;
                }
            }
        }
        logger.debug("TODO Item is -- " + todoItem)
        
        // logger.debug("choiceOutcome is -- " + choiceOutcome)

        if (selectedOutcome === 0) // Save = 1 (Confirmation Callback Outcome)
        {
             entryPresentInRequest(prereqname, nodeState.get("userIDinSession"), "TODO");
            logger.debug("Selected Outcome is 0")
            for (var j = 0; j < allowedListOfTypesOfPrereq.length; j++) {
                logger.debug("allowedListOfTypesOfPrereq length is " + allowedListOfTypesOfPrereq.length);
                logger.debug("allowedListOfTypesOfPrereq is for j value" + allowedListOfTypesOfPrereq[j]);
                if (allowedListOfTypesOfPrereq[j].includes(todoItem)) {
                    logger.debug("allowedListOfTypesOfPrereq length is -- Inside If")
                    foundLoginPrerequisite = true;
                    nodeState.putShared("prereqtype", prereqname);
                    nodeState.putShared("prereqContextID", "login");
                    // populateRequestEntry(prereqname, sequence);
                    logger.debug("Found login prerequisite ~ '" + todoItem + "' to process")
                    break;
                }
            }
            if (foundLoginPrerequisite) {
                if (todoItem === "organdonar") {
                    logger.debug("Navigating to organdonar")
                    action.goTo(NodeOutcome.ORGAN_DONAR)
                }
                else if (todoItem === "MFA") {
                   
                    nodeState.putShared("loginPrereqEnrollMFA", "true");
                    action.goTo(NodeOutcome.EnrollMFA)
                }
                else if (todoItem === "reverifyPrerequisite") {
                    logger.debug("Navigating to reverifyPrerequisite")
                    action.goTo(NodeOutcome.ReVerify_Prerequisite)
                }
                else if (todoItem === "review") {
                   
                    logger.debug("Navigating to account_review")
                    nodeState.putShared("loginPrereqEnrollMFA", null);
                    action.goTo(NodeOutcome.REVIEW)
                } else {

                    action.goTo(NodeOutcome.APP_ENROLL)
                }
            }

        }
        else if (selectedOutcome === 1) {
            logger.debug("Skipping prerequisite ~ " + todoItem)
            action.goTo(NodeOutcome.SKIP);
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error + "::" + mail);
        action.goTo(NodeOutcome.ERROR);
    }
}



/*
    Description: This function is used to query IDM request managed object.
*/
function entryPresentInRequest(name, uid, status) {

    //Local Variables  
    var id = "login";
    var recordRequest = null;

    try {
        recordRequest = openidm.query("managed/alpha_kyid_request", {
            "_queryFilter": 'type eq "' + name + '"'
                + ' and contextid eq "' + id + '"'
                + ' and requester eq "' + uid + '"'
        }, ["contextid", "type", "requester", "status"]);

        logger.debug("Login Prerequisite :: Successfully queried record in alpha_kyid_request managed object :: " + JSON.stringify(recordRequest));

        if (recordRequest.resultCount > 0) {
            var prereqID = recordRequest.result[0]._id;
            nodeState.putShared("prereqID", prereqID);
            if (status) {
                if (recordRequest.result[0].status === status) {
                    return true;
                }
                else {
                    return false;
                }

            }
            else {

                return true;
            }


        } else {
            return false;
        }


    } catch (error) {
        logger.error('Failed to query alpha_kyid_request custom object attributes. Error -' + error);
    }

}


/*
    Description: This function is used to prepopulate data into IDM request managed object.
*/
function populateRequestEntry(type, sequence) {

    //Local Variables  
    var roleID = "";
    var prereqID = null;
    var content = {};
    var recordRequest = null;
    var requestJSONObj = {};
    var userID = null;

    if (nodeState.get("userIDinSession") != null && nodeState.get("userIDinSession")) {
        userID = nodeState.get("userIDinSession");
    }

    try {
        if (type !== "reverifyPrerequisite") {
            if (!(entryPresentInRequest(type, userID, null))) {
                content["contextid"] = "login";
                content["type"] = type;
                content["requester"] = userID;
                content["status"] = "TODO";
                content["startdate"] = dateTime;
                content["enddate"] = "";
                content["createdate"] = "";
                content["updatedate"] = "";
                content["sequence"] = sequence;
                content["requestId"] = "";
                content["approleid"] = "";
                recordRequest = ops.crudOps("create", "alpha_kyid_request", content, null, null, null);
                logger.debug("Successfully created record in alpha_kyid_request managed object :: " + JSON.stringify(recordRequest));
                requestJSONObj = JSON.parse(JSON.stringify(recordRequest));
                prereqID = requestJSONObj["_id"];
                nodeState.putShared("prereqID", prereqID);
            }

        }


    } catch (error) {
        logger.error('Failed to create alpha_kyid_request custom object attributes. Error -' + error);
    }
}



function getUserDetails(usrKOGID) {
    try {
        var userID = null;
        var userData = null;
        var accountType = null;
        var isRegisteredforOrganDonar = false;
        var lastAttemptedLoginPrereq = null;
        var userResponse = openidm.query("managed/alpha_user", { "_queryFilter": '/userName eq "' + usrKOGID + '"' });
        logger.debug("userResponse -- " + userResponse);
        logger.debug("User Result 0 --> " + userResponse.result[0]);


        if (userResponse) {
            userData = userResponse.result[0];
            // logger.debug("user ID is --- "+ userData._id)
            // userID = userResponse.result[0]._id;
            userID = userData._id;
            logger.debug("User ID in Login-Prereq is -- " + userID);
            nodeState.putShared("userIDinSession", userID);
            // nodeState.putShared("_id", userID);
            accountType = userResponse.result[0].frUnindexedString1;
            nodeState.putShared("accountType", accountType);
            logger.debug("accountType is " + accountType);
            // isRegisteredforOrganDonar = userResponse.result[0].preferences.organdonor;
            if(userResponse.result[0].custom_organdonor){
               isRegisteredforOrganDonar = userResponse.result[0].custom_organdonor;  
            }
           
            nodeState.putShared("isRegisteredforOrganDonar", isRegisteredforOrganDonar);
            logger.debug("isRegisteredforOrganDonar is " + isRegisteredforOrganDonar);
            if (userResponse.result[0].custom_lastAttemptedLoginPrereq) {
                lastAttemptedLoginPrereq = userData.custom_lastAttemptedLoginPrereq
            }

            nodeState.putShared("_id", userData._id);
            nodeState.putShared("mail", userData.mail);
            nodeState.putShared("orig_givenName",userData.givenName);
            // if (userData.custom_middleName) {
            //     nodeState.putShared("orig_custom_middleName", userData.custom_middleName);
            // }

            // nodeState.putShared("orig_sn", userData.sn);
            // nodeState.putShared("userName", userData.userName);
            // if (userData.custom_gender) {
            //     nodeState.putShared("orig_custom_gender", userData.custom_gender);
            // }

            // if (userData.custom_dateofBirth) {
            //     nodeState.putShared("orig_custom_dateofBirth", userData.custom_dateofBirth);
            // }

            // if (userData.postalAddress) {
            //     nodeState.putShared("orig_postalAddress", userData.postalAddress);
            // }
            // if (userData.city) {
            //     nodeState.putShared("orig_city", userData.city);
            // }
            // if (userData.custom_postalAddress2) {
            //     nodeState.putShared("orig_custom_postalAddress2", userData.custom_postalAddress2);
            // }
            // if (userData.postalCode) {
            //     nodeState.putShared("orig_postalCode", userData.postalCode);
            // }
            // if (userData.stateProvince) {
            //     nodeState.putShared("orig_stateProvince", userData.stateProvince);
            // }
            // if (userData.preferences.language !== "undefined" || userData.preferences.language !== null) {
            //     nodeState.putShared("orig_languagePreference", userData.preferences.language);
            // }
            // // if (userData.preferences.organdonor !== "undefined" || userData.preferences.organdonor !== null) {
            // //     nodeState.putShared("orig_organPreference", userData.preferences.organdonor)
            // // }
            // if (userData.country) {
            //     nodeState.putShared("orig_country", userData.country);
            // }

            // if (userData.custom_county) {
            //     nodeState.putShared("orig_custom_county", userData.custom_county);
            // }
            // //nodeState.putShared("orig_county",userData.custom_county);
            // if (userData.telephoneNumber) {
            //     nodeState.putShared("orig_telephoneNumber", userData.telephoneNumber);
            // }
            // if (userData.custom_suffix) {
            //     nodeState.putShared("orig_custom_suffix", userData.custom_suffix);
            // }
            // if (userData.custom_title) {
            //     nodeState.putShared("orig_custom_title", userData.custom_title);
            // }

            if(userData.custom_middleName){
                nodeState.putShared("orig_custom_middleName",userData.custom_middleName);
            }
            
            nodeState.putShared("orig_sn",userData.sn);
            nodeState.putShared("userName",userData.userName);
            if(userData.custom_gender){
                nodeState.putShared("orig_custom_gender",userData.custom_gender);
            }
            
            if(userData.custom_dateofBirth){
                nodeState.putShared("orig_custom_dateofBirth",userData.custom_dateofBirth);
            }

            if(userData.postalAddress){
                nodeState.putShared("orig_postalAddress",userData.postalAddress);
            }
            if(userData.city){
            nodeState.putShared("orig_city",userData.city);
            }
            if(userData.custom_postalAddress2){
                nodeState.putShared("orig_custom_postalAddress2",userData.custom_postalAddress2);
            }
            if(userData.postalCode){
                nodeState.putShared("orig_postalCode",userData.postalCode);
            }
            if(userData.stateProvince){
            nodeState.putShared("orig_stateProvince",userData.stateProvince);
            }

            if(userData.preferences.language !== "undefined" || userData.preferences.language !== null){
               nodeState.putShared("orig_languagePreference",userData.preferences.language); 
            }

            if(userData.custom_organdonor){
            nodeState.putShared("orig_custom_organdonor",userData.custom_organdonor);
            } 
            
            if(userData.country){
                nodeState.putShared("orig_country",userData.country);
            }
            
            if(userData.custom_county){
                nodeState.putShared("orig_custom_county",userData.custom_county);
            } 
            //nodeState.putShared("orig_county",userData.custom_county);
            if(userData.telephoneNumber){
                nodeState.putShared("orig_telephoneNumber",userData.telephoneNumber);
            }
            if(userData.custom_suffix){
                nodeState.putShared("orig_custom_suffix",userData.custom_suffix);
            }
            if(userData.custom_title){
                nodeState.putShared("orig_custom_title",userData.custom_title);
            }



            if (userData.custom_lastAttemptedLoginPrereq) {
                lastAttemptedLoginPrereq = userData.custom_lastAttemptedLoginPrereq;
                nodeState.putShared("lastAttemptedLoginPrereq", lastAttemptedLoginPrereq);
                logger.debug("lastAttemptedLoginPrereq is " + lastAttemptedLoginPrereq);
            }

            nodeState.putShared("orig_custom_title", userData.custom_title);
        }


    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error getUserDetails Function" + error.message + "::" );

    }

}


function getLoginPrerequisiteNames() {
    var loginpreqtypes = [];
    var flagJSONData = {};
    var falgOutput = [];
    var diffTypesOfLoginPrereqs = [];


    try {


        var response = openidm.query("managed/alpha_kyid_prerequisite", { "_queryFilter": 'isLoginOrAppEnrollPrerequisite eq "' + "login" + '"' + 'or isLoginOrAppEnrollPrerequisite eq "' + "login,enroll" + '"' });
        if (response && response.resultCount > 0) {
            for (var i = 0; i < response.resultCount; i++) {
                loginpreqtypes.push(response.result[i].prereqtypename)
                if (!(diffTypesOfLoginPrereqs.includes(response.result[i].typeofprerequisite))) {   //Stores list of unique types of login prerequisites
                    diffTypesOfLoginPrereqs.push(response.result[i].typeofprerequisite)
                }
                flagJSONData = {
                    "prereqtypename": response.result[0].prereqtypename,
                    "enrollmentactions": response.result[0].enrollmentactions,
                }
                falgOutput.push(JSON.stringify(flagJSONData))
            }
            nodeState.putShared("flagJSONData", falgOutput);
        }
        diffTypesOfLoginPrereqs.push("reverifyPrerequisite")
        logger.debug("diffTypesOfLoginPrereqs are - " + diffTypesOfLoginPrereqs)
        nodeState.putShared("diffTypesOfLoginPrereqs", diffTypesOfLoginPrereqs)
        return loginpreqtypes;

    } catch (error) {
        logger.error("Error Occurred in getLoginPrerequisiteNames function " + error)

    }
}


function displayLoginPrerequisite() {
    var prereqTypeNames = [];
    var result = []

    try {
        prereqTypeNames = getLoginPrerequisiteNames();
        logger.debug("prereqTypeNames are --> " + prereqTypeNames);
        if (prereqTypeNames.length > 0) {
            for (var i = 0; i < prereqTypeNames.length; i++) {
                if (getLoginPrerequisite(prereqTypeNames[i]) != null) {
                    result.push(JSON.stringify(getLoginPrerequisite(prereqTypeNames[i])))
                }
            }

        }
        logger.debug("displayLoginPrerequisite Result is -- " + result);

        return result;

    } catch (error) {
        logger.error("Error Occurred in displayLoginPrerequisite function " + error)
    }
}


function getLoginPrerequisite(type) {
    try {
        var prereqType = null;
        var lastAttemptedLoginPrereqWithFreqDays = null;
        var name = null;
        var description = null;
        var sequence = null;
        var isRegisteredforOrganDonar = null;
        var logintrigger_startdate = null;
        var logintrigger_enddate = null;
        var logintrigger_accounttype = null;
        var logintrigger_roleId = null;
        var logintrigger_applicationId = null;
        var displaycriteria_login = null;
        var displaycriteria_numberofdaysbeforeduedate = null;
        var displaycriteria_skipoption = null;
        var displaycriteria_frequencyindays = null;
        var duecompletion_indays = null;
        var duecompletion_duedate = null;
        var duecompletion_graceperiodindays = null;
        var response = null;
        var prerequsiteResponse = [];
        var roleId = "e3d13783-f9c7-431c-be22-f4454491c801";
        nodeState.putShared("roleIDinSession", roleId);
        var applicationId = "771cb8bf-4c55-4948-b9c9-1621a818e479";
        var isRegisteredforOrganDonar = nodeState.get("isRegisteredforOrganDonar");
        var accountType = nodeState.get("accountType");
        logger.debug("accountType   -- " + accountType);
        var lastAttemptedLoginPrereq = nodeState.get("lastAttemptedLoginPrereq");
        var result = {};

        response = openidm.query("managed/alpha_kyid_prerequisite", { "_queryFilter": '/prereqtypename eq "' + type + '"' });
        logger.debug("alpha_kyid_prerequisite response is --" + response);

        if (response.result.length > 0) {
            // logger.debug("userResponse is"+ userResponse)
            if (response.result[0].logintrigger_startdate) {
                logintrigger_startdate = response.result[0].logintrigger_startdate;
            }
            if (response.result[0].logintrigger_enddate) {
                logintrigger_enddate = response.result[0].logintrigger_enddate;
            }
            if (response.result[0].logintrigger_accounttype) {
                logintrigger_accounttype = response.result[0].logintrigger_accounttype;
            }
            if (response.result[0].logintrigger_roleId) {
                logintrigger_roleId = response.result[0].logintrigger_roleId;
            }
            if (response.result[0].logintrigger_applicationId) {
                logintrigger_applicationId = response.result[0].logintrigger_applicationId;
            }
            if (response.result[0].displaycriteria_login) {
                displaycriteria_login = response.result[0].displaycriteria_login;
            }
            if (response.result[0].displaycriteria_numberofdaysbeforeduedate) {
                displaycriteria_numberofdaysbeforeduedate = response.result[0].displaycriteria_numberofdaysbeforeduedate;
            }
            if (response.result[0].displaycriteria_skipoption != null) {
                displaycriteria_skipoption = response.result[0].displaycriteria_skipoption;
            }
            if (response.result[0].displaycriteria_frequencyindays) {
                displaycriteria_frequencyindays = response.result[0].displaycriteria_frequencyindays;
            }
            if (response.result[0].duecompletion_indays) {
                duecompletion_indays = response.result[0].duecompletion_indays;
            }
            if (response.result[0].duecompletion_duedate) {
                duecompletion_duedate = response.result[0].duecompletion_duedate;
            }
            if (response.result[0].duecompletion_graceperiodindays) {
                duecompletion_graceperiodindays = response.result[0].duecompletion_graceperiodindays;
            }
            if (response.result[0].name) {
                name = response.result[0].name;
            }
            if (response.result[0].description) {
                description = response.result[0].description;
            }
            if (response.result[0].sequence) {
                sequence = response.result[0].sequence;
            }
            if (response.result[0].typeofprerequisite) {
                prereqType = response.result[0].typeofprerequisite;
            }


            // if(type == "organdonar"){}
            result = {
                "type": prereqType,
                "prereqname": type,
                "name": name,
                "description": description,
                "sequence": sequence,
                status: "",
                isMandatory: null
            }
            logger.debug("Result before computation is -- " + JSON.stringify(result));
            if (duecompletion_duedate) {
                duecompletion_duedate = duecompletion_duedate
            }
            else {
                duecompletion_duedate = getFormatedDaysWithAdditional(logintrigger_startdate, Number(duecompletion_indays, "add"));
            }


            var duecompletion_duedateWithGrace = getFormatedDaysWithAdditional(duecompletion_duedate, Number(duecompletion_graceperiodindays, "add"));  // Due Date Including Grace Period
            var numberofdaysbeforeduedateInDate = getFormatedDaysWithAdditional(duecompletion_duedate, Number(displaycriteria_numberofdaysbeforeduedate), "sub")

            logger.debug("duecompletion_duedateWithGrace --  " + duecompletion_duedateWithGrace);
            if (lastAttemptedLoginPrereq) {
                logger.debug("lastAttemptedLoginPrereq is present " + lastAttemptedLoginPrereq)
                lastAttemptedLoginPrereqWithFreqDays = getFormatedDaysWithAdditional(lastAttemptedLoginPrereq, Number(displaycriteria_frequencyindays), "add"); // Date With Freq
            }
            else {
                lastAttemptedLoginPrereqWithFreqDays = formattedDate;
            }

            logger.debug("lastAttemptedLoginPrereqWithFreqDays --  " + lastAttemptedLoginPrereqWithFreqDays);
            logger.debug("accountType in User Profile --  " + accountType);
            logger.debug("logintrigger_accounttype is  --  " + logintrigger_accounttype);
            logger.debug("Is Registered for Organ Donar -- " + isRegisteredforOrganDonar);
            logger.debug("userIDinSession value is   -- " + nodeState.get("userIDinSession"));
            logger.debug("user _id value is   -- " + nodeState.get("_id"));

            if (accountType === logintrigger_accounttype) {
                if (prereqType.includes("organdonar") && isRegisteredforOrganDonar === true) {
                    if (entryPresentInRequest(type, nodeState.get("userIDinSession"), "TODO")) {
                        logger.debug("prereqID value is   -- " + nodeState.get("prereqID"));
                        patchRequestEntry(nodeState.get("prereqID"), "COMPLETED", dateTime)
                    }

                    result = null;
                    return result;
                }
                else if (isLoginReverifyCompleted(nodeState.get("userIDinSession"),"all",type)){
                    logger.debug("Inside All Completed Senario")
                     if (entryPresentInRequest(type, nodeState.get("userIDinSession"), "COMPLETED")) {
                    return null;
                    }
                    else{
                        populateRequestEntry(type, sequence);
                        if(entryPresentInRequest(type, nodeState.get("userIDinSession"), "TODO") || entryPresentInRequest(type, nodeState.get("userIDinSession"), "IN_PROGRESS")){
                            patchRequestEntry(nodeState.get("prereqID"), "COMPLETED", dateTime)
                        }
                        return null;
                        
                    }
                }

                else {
                    var evaluatedResult = null;
                    if ((logintrigger_applicationId !== null || logintrigger_roleId !== null) && (logintrigger_applicationId === applicationId || logintrigger_roleId === roleId)) { // Need to confirm on && or || opertation
                        evaluatedResult = evaluateBasedonConditon(type, numberofdaysbeforeduedateInDate, displaycriteria_login, displaycriteria_skipoption, result, formattedDate, logintrigger_startdate, duecompletion_duedate, duecompletion_duedateWithGrace, logintrigger_enddate, lastAttemptedLoginPrereqWithFreqDays, lastAttemptedLoginPrereq, lastAttemptedLoginPrereqWithFreqDays);
                       if(evaluatedResult != null){
                        populateRequestEntry(type, sequence);   
                       }
                        return evaluatedResult;
                    }
                    else {
                        evaluatedResult = evaluateBasedonConditon(type, numberofdaysbeforeduedateInDate, displaycriteria_login, displaycriteria_skipoption, result, formattedDate, logintrigger_startdate, duecompletion_duedate, duecompletion_duedateWithGrace, logintrigger_enddate, lastAttemptedLoginPrereqWithFreqDays, lastAttemptedLoginPrereq, lastAttemptedLoginPrereqWithFreqDays);
                        // return evaluateBasedonConditon(type, numberofdaysbeforeduedateInDate, displaycriteria_login, displaycriteria_skipoption, result, formattedDate, logintrigger_startdate, duecompletion_duedate, duecompletion_duedateWithGrace, logintrigger_enddate, lastAttemptedLoginPrereqWithFreqDays, lastAttemptedLoginPrereq, lastAttemptedLoginPrereqWithFreqDays);
                        if(evaluatedResult != null){
                        populateRequestEntry(type, sequence);   
                       }
                        return evaluatedResult;
                    }
                }
            }

            else {
                logger.debug("Account Type not matched")
                result = null
                return result;
            }
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Err Function" + error.message + "::" + mail);

    }

}


function getCurrentDate() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    var day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getFormatedDaysWithAdditional(formatedDate, days, operation) {
    if (operation == null) {
        operation = "add"
    }
    var date = new Date(formatedDate);
    if (operation === "add") {
        date.setDate(date.getDate() + days - 1);
    }
    else {
        date.setDate(date.getDate() - days + 1);
    }
    // date.setDate(date.getDate() + days);
    var result = date.toISOString().split('T')[0];
    return result;
}


function formatJSON(data) {
    try {
        var mandatory = [];
        var optional = [];
        var reverifyPrereqJSON = {
            "type": "reverifyPrerequisite",
            "prereqname": "reverifyPrerequisite",
            "name": "reverifyPrerequisite",
            "description": "reverifyPrerequisite",
            "sequence": 0,
            "status": "TODO",
            "isMandatory": true
        };

        if (isLoginReverifyCompleted(nodeState.get("userIDinSession")) === false) {
            mandatory.push(reverifyPrereqJSON);
        }
        if (data.length !== 0) {
            // Separate into mandatory and optional
            for (var i = 0; i < data.length; i++) {
                var item = JSON.parse(data[i]);
                if (item.isMandatory) {
                    mandatory.push(item);
                } else {
                    optional.push(item);
                }
            }

            if (mandatory.length > 0) {
                // Find lowest sequence in mandatory
                var minSeq = mandatory[0].sequence;
                for (var i = 1; i < mandatory.length; i++) {
                    if (mandatory[i].sequence < minSeq) {
                        minSeq = mandatory[i].sequence;
                    }
                }
                // Set statuses
                for (var i = 0; i < mandatory.length; i++) {
                    mandatory[i].status = (mandatory[i].sequence === minSeq) ? "TODO" : "NOTSTARTED";
                }
                for (var i = 0; i < optional.length; i++) {
                    optional[i].status = "NOTSTARTED";
                }
            } else {
                // No mandatory, use optional
                var minSeqOpt = optional[0].sequence;
                for (var i = 1; i < optional.length; i++) {
                    if (optional[i].sequence < minSeqOpt) {
                        minSeqOpt = optional[i].sequence;
                    }
                }
                for (var i = 0; i < optional.length; i++) {
                    optional[i].status = (optional[i].sequence === minSeqOpt) ? "TODO" : "NOTSTARTED";
                }
            }

        }

        var transformed = {
            loginPrerequisite: {
                mandatory: mandatory,
                optional: optional
            },
            "application": {
                "logo": "kynect.png",
                "name": "Kynect",
                "role": "kyid_prereq_dynamicform_role",
                "phone": "000-000-0000",
                "mail": "help@kynect.com",
                "url": "https://www.kynect.com",
                "operatingHours": {
                    "en": "Monday through Friday, 9 AM - 5 PM EST",
                    "es": "De lunes a viernes, de 9 a. m. - 5 p. m. EST"
                }
            }
        };
        return transformed;


    } catch (error) {
        logger.error("Error Occurred while formatJSON -- " + error)
    }

}


function checkIfTrainingCompleted(params) {

}
function checkIfAggrementCompleted(params) {

}
function checkIfIDPCompleted(params) {

}
function patchUserLastLogin(userId, formattedDate) {
    try {
        var patchArray = [];
        patchArray.push({
            operation: "replace",
            field: "custom_lastAttemptedLoginPrereq",
            value: formattedDate
        });


        var result = openidm.patch("managed/alpha_user/" + userId, null, patchArray);
    } catch (error) {
        logger.error("Error Occured patchUserLastLogin function -- " + error)
    }
}



function evaluateBasedonConditon(type, numberofdaysbeforeduedateInDate, displaycriteria_login, displaycriteria_skipoption, result, formattedDate, logintrigger_startdate, duecompletion_duedate, duecompletion_duedateWithGrace, logintrigger_enddate, lastAttemptedLoginPrereqWithFreqDays, lastAttemptedLoginPrereq, lastAttemptedLoginPrereqWithFreqDays) {
    try {
        logger.debug("Todays Date is -- " + formattedDate);
        logger.debug("logintrigger_startdate Date is -- " + logintrigger_startdate);
        logger.debug("logintrigger_enddate Date is -- " + logintrigger_enddate);
        logger.debug("duecompletion_duedate Date is -- " + duecompletion_duedate);
        logger.debug("duecompletion_duedateWithGrace Date is -- " + duecompletion_duedateWithGrace);
        logger.debug("lastAttemptedLoginPrereqWithFreqDays Date is" + lastAttemptedLoginPrereqWithFreqDays);


        if ((((formattedDate >= logintrigger_startdate) && (formattedDate <= logintrigger_enddate)) && ((duecompletion_duedate < logintrigger_enddate) &&
            (duecompletion_duedateWithGrace <= logintrigger_enddate))) && ((formattedDate < duecompletion_duedateWithGrace)
                && (duecompletion_duedateWithGrace > duecompletion_duedate))) {
            logger.debug("Inside Trigger Date");

            logger.debug("Inside duecompletion_duedate < logintrigger_enddate");

            if (displaycriteria_skipoption === false) {
                logger.debug("Inside displaycriteria_skipoption False");

                logger.debug("Inside formattedDate === lastAttemptedLoginPrereqWithFreqDays")

                logger.debug("Inside displaycriteria_login == 0")
                result.isMandatory = true;
                return result;



            }
            else {
                logger.debug("Inside Skip == True")

                logger.debug("Inside datess Condition");

                if (formattedDate > duecompletion_duedate && formattedDate < duecompletion_duedateWithGrace) {
                    logger.debug("Inside Grace  Condition");
                    result.isMandatory = true;
                    return result;

                }
                else {
                    if (formattedDate >= numberofdaysbeforeduedateInDate) {
                        logger.debug("formattedDate >= numberofdaysbeforeduedateInDate --  ")
                        result.isMandatory = false;
                        return result;

                    }
                    else {
                        if (formattedDate >= lastAttemptedLoginPrereqWithFreqDays) {
                            logger.debug("Inside formattedDate > lastAttemptedLoginPrereqWithFreqDays Condition");
                            if ((displaycriteria_login === "1")) {

                                if (formattedDate > lastAttemptedLoginPrereq) {
                                    result.isMandatory = false;
                                    return result;
                                }
                                else {
                                    result = null;
                                    return result;

                                }
                            }
                            else {
                                result.isMandatory = false;
                                return result;

                            }

                        }
                        else {
                            result = null
                            return result;

                        }

                    }

                }




            }



        }
        else {
            logger.debug("In Side Else Contion ")
            if (entryPresentInRequest(type, nodeState.get("userIDinSession"), "TODO") || entryPresentInRequest(type, nodeState.get("userIDinSession"), "IN_PROGRESS")) {
                result.isMandatory = true;
                return result;
            }
            else {
                logger.debug("In Side Else Contion ---  ")
                result = null;
                return result;
            }

        }

    } catch (error) {
        logger.error("Error occurred while evaluateBasedonConditon " + error)
    }


}

function patchRequestEntry(id, status, dateTime) {
    try {
        var contentArray = [
            { "operation": "replace", "field": "status", "value": status },
            { "operation": "replace", "field": "updatedate", "value": dateTime },
            { "operation": "replace", "field": "enddate", "value": dateTime }
        ];
        ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, id);
    } catch (error) {
        logger.error("Error in patchRequestEntry: " + error);
    }
}

function isLoginReverifyCompleted(uid,checkfor,type) {

    //Local Variables  
    var recordRequest = null;

    try {
        if(checkfor!== null && type !== null && checkfor === "all"){
            recordRequest = openidm.query("managed/alpha_kyid_request", {
            "_queryFilter": '(status eq "' + "COMPLETED" + '"'
                + 'and type eq "' + type + '")'
                + 'and requester eq "' + uid + '"' 
        }, ["contextid", "type", "requester", "status"]);

        logger.debug("Login Prerequisite ::isLoginReverifyCompleted -  Successfully queried record in alpha_kyid_request managed object :: " + JSON.stringify(recordRequest));

        if (recordRequest.resultCount > 0) {
            return true
        }
        else {
            return false
        }
            
        }
        else{
            recordRequest = openidm.query("managed/alpha_kyid_request", {
            "_queryFilter": '(status eq "' + "EXPIRED" + '"'
                + 'or status eq "' + "EXPIRED_IN_PROGRESS" + '")'
                + 'and requester eq "' + uid + '"' + 'and expiryaction eq "' + "login.reVerify" + '"'
        }, ["contextid", "type", "requester", "status"]);

        logger.debug("Login Prerequisite ::isLoginReverifyCompleted -  Successfully queried record in alpha_kyid_request managed object :: " + JSON.stringify(recordRequest));

        if (recordRequest.resultCount > 0) {
            return false
        }
        else {
            return true
        }
            
        }
        // recordRequest = openidm.query("managed/alpha_kyid_request", {
        //     "_queryFilter": '(status eq "' + "EXPIRED" + '"'
        //         + 'or status eq "' + "EXPIRED_IN_PROGRESS" + '")'
        //         + 'and requester eq "' + uid + '"' + 'and expiryaction eq "' + "login.reVerify" + '"'
        // }, ["contextid", "type", "requester", "status"]);

        // logger.debug("Login Prerequisite ::isLoginReverifyCompleted -  Successfully queried record in alpha_kyid_request managed object :: " + JSON.stringify(recordRequest));

        // if (recordRequest.resultCount > 0) {
        //     return false
        // }
        // else {
        //     return true
        // }


    } catch (error) {
        logger.error('Failed to query alpha_kyid_request in isLoginReverifyCompleted - Error -' + error);
    }

}

