
var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var convertTime = require("KYID.2B1.Library.ConvertDateTimeFormat");
var auditLib = require("KYID.2B1.Library.AuditLogger");

//nodeState.putShared("unableToVerify","true")

var nodeConfigFailure = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.ridp.failure",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyid2B1RidpFailure",
    begin: "Beginning Node Execution",
    node: "Node",
    script: "Script",
    scriptName: "KYID.2B1.Send.Mail.RIDP.Failure",
    errorId_NotificationFailed: "errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var nodeConfigSuccess = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.profile.update",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyid2B1RidpSuccess",
    begin: "Beginning Node Execution",
    node: "Node",
    script: "Script",
    scriptName: "KYID.2B1.Send.Mail.RIDP.Success",
    errorId_NotificationFailed: "errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    PASS: "success",
    FAIL: "failure"

};

var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
};

function sendMailFailure(mail, givenName, sn, verifMethod, reason, phoneContact, emailContact) {
    try {
        var params = new Object();
        var lang = null; 
        var langCode = nodeState.get("languagePreference") || "1";
        // logger.error("langCode is :: "+ langCode);
        var languageMap =systemEnv.getProperty("esv.language.preference");
        // logger.error("languageMap is :: "+ languageMap)
        lang = getLangCode(langCode,languageMap);
        logger.debug("lang is :: "+lang)
        var easternTimeStamp = convertTime.isoToEastern();
        params.templateName = nodeConfigFailure.templateID;
        params.to = mail;
        params._locale = lang;
        params.object = {
            "givenName": givenName,
            "sn": sn,
            "mail": mail,
            "timeStamp": easternTimeStamp,
            "verificationType": verifMethod,
            "failureReason": reason,
            "phoneContact": phoneContact,
            "emailContact": emailContact
        };
        logger.debug("Values for mail: " + JSON.stringify(params.object));
        openidm.action(nodeConfigFailure.idmEndpoint, nodeConfigFailure.idmAction, params);
        nodeLogger.debug(transactionid + "::" + nodeConfigFailure.timestamp + "::" + nodeConfigFailure.node + "::" + nodeConfigFailure.nodeName + "::" + nodeConfigFailure.script + "::" + nodeConfigFailure.scriptName + "::" + nodeConfigFailure.begin + "Email OTP Notification sent successfully to ::" + mail);
        return NodeOutcome.PASS;
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfigFailure.timestamp + "::" + nodeConfigFailure.node + "::" + nodeConfigFailure.nodeName + "::" + nodeConfigFailure.script + "::" + nodeConfigFailure.scriptName + "::" + nodeConfigFailure.begin + " ::" + "error occurred while sending email notification" + "::" + error);
        return NodeOutcome.PASS;
    }
}

function sendMailSuccess(mail, givenName, sn, verifMethod, phoneContact, emailContact) {
    try {
        var params = new Object();
        var lang = null; 
        lang = nodeState.get("userLanguage") || "en"
        var easternTimeStamp = convertTime.isoToEastern();
        params.templateName = nodeConfigSuccess.templateID;
        params.to = mail;
        params._locale = lang;
        params.object = {
            "givenName": givenName,
            "sn": sn,
            "mail": mail,
            "timeStamp": easternTimeStamp,
            "verificationType": verifMethod,
            "phoneContact": phoneContact,
            "emailContact": emailContact
        };
        logger.info("Values for mail: " + JSON.stringify(params.object));
        openidm.action(nodeConfigSuccess.idmEndpoint, nodeConfigSuccess.idmAction, params);
        nodeLogger.info(transactionid + "::" + nodeConfigSuccess.timestamp + "::" + nodeConfigSuccess.node + "::" + nodeConfigSuccess.nodeName + "::" + nodeConfigSuccess.script + "::" + nodeConfigSuccess.scriptName + "::" + nodeConfigSuccess.begin + "Email OTP Notification sent successfully to ::" + mail);
        return NodeOutcome.PASS;
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfigSuccess.timestamp + "::" + nodeConfigSuccess.node + "::" + nodeConfigSuccess.nodeName + "::" + nodeConfigSuccess.script + "::" + nodeConfigSuccess.scriptName + "::" + nodeConfigSuccess.begin + " ::" + "error occurred while sending email notification" + "::" + error);
        return NodeOutcome.PASS;
    }
}

function getUserDetails(userId) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", { _queryFilter: 'userName eq "' + userId + '"' }, ["mail", "sn", "givenName"]);
        nodeState.putShared("mail", userQueryResult.result[0].mail);
        if (!nodeState.get("givenName")) {
            nodeState.putShared("givenName", userQueryResult.result[0].givenName);
        }
        if (!nodeState.get("sn")) {
            nodeState.putShared("sn", userQueryResult.result[0].sn);
        }


    } catch (error) {
        logger.error("Error in catch of main :: => " + error);
    }

    try {
        var appName = "KYID Helpdesk";
        var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact", { _queryFilter: 'name eq "' + appName + '"' }, ["phoneContact", "emailContact"]);
        nodeState.putShared("phoneContact", userQueryResult2.result[0].phoneContact[0].phoneNumber);
        nodeState.putShared("emailContact", userQueryResult2.result[0].emailContact[0].emailAddress);
        logger.debug("phone contact = " + userQueryResult2.result[0].phoneContact[0].phoneNumber);
        logger.debug("email contact = " + userQueryResult2.result[0].emailContact[0].emailAddress);

    } catch (error) {
        logger.error("Error in catch of helpdesk retrieval :: => " + error);
    }

}

// main execution
function main() {
    try {
        //var verifMethod = null;
        var givenName = nodeState.get("givenName") || "";
        var sn = nodeState.get("sn") || "";
        var mail = nodeState.get("mail") || nodeState.get("verifiedPrimaryEmail") || "" ;
        var usrKOGID = null;
        if (nodeState.get("KOGID") !== null && nodeState.get("KOGID")) {
            usrKOGID = nodeState.get("KOGID");
        }
        var verifMethod = null;
        verifMethod = nodeState.get("RIDPMethodUsed");
        logger.debug("Method called: " + nodeState.get("RIDPMethodUsed"));
        logger.debug("Method called: " + verifMethod);
        logger.debug("EmailAddressInSendEmail:" + mail);
        logger.debug("Node:State = " + nodeState);
        if(usrKOGID){
            getUserDetails(usrKOGID);
        }    

        var phoneContact = nodeState.get("phoneContact") || "";
        var emailContact = nodeState.get("emailContact") || "";
        //logger.debug("outside nodeState.getfirsttimeloginjourney = "+nodeState.get("firsttimeloginjourney"))
        if ((nodeState.get("skipfirsttimelogin") === "false" && nodeState.get("isMFARecovery") === "false")) {
            logger.debug("nodeState.get skipfirsttimelogin = " + nodeState.get("skipfirsttimelogin"))
            logger.debug("First time Login - Mail should not be sent")
            action.goTo("success")
        }else if(nodeState.get("journeyName").toLowerCase() === "createaccount"){
            action.goTo("success")
        }
        // else if(nodeState.get("journeyName") === "accountRecovery"){
        //     logger.debug("Skipping RIDP Email Notification for Account Recovery")
        //     action.goTo("success")
        // }

        else if (nodeState.get("unableToVerify") === "true" || nodeState.get("appEnrollUnableToVerify") === "true") {
            var reason = "Unknown";
            logger.debug("Failure logic invoked");
            logger.debug(givenName + " " + sn + " " + mail + " " + verifMethod + " " + reason + " " + nodeConfigFailure.timestamp);
            outcome = sendMailFailure(mail, givenName, sn, verifMethod, reason, phoneContact, emailContact);
        } else {
            logger.debug("Success logic invoked");
            logger.debug(givenName + " " + sn + " " + mail + " " + verifMethod + " " + nodeConfigSuccess.timestamp);
            outcome = sendMailSuccess(mail, givenName, sn, verifMethod, phoneContact, emailContact);
        }
    } catch (error) {
        logger.error("Error in catch of main :: => " + error);
        action.goTo("success")
    }
}

main()
