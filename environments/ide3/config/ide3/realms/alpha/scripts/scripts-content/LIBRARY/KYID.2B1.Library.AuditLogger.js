logger.error("Executing KYID.2B1.Library.AuditLogger Script");

function auditLogger(eventCode,sessionDetails,eventName, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, apllicationId, sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility) {
  try {
    logger.debug("KYID.2B1.Library.AuditLogger -- Inside Audit Logger");
    //logger.error("request headers in KYID.2B1.Library.AuditLogger1 :: " + JSON.stringify(requestHeaders))
    const createdDate = new Date().toISOString();
    const currentTimeinEpoch = Date.now();
    var sessionIdValue;
    var browser = "";
    var os = "";
    var mfaPurpose = "";
    var mfaAction = "";
    var mfaStatus = "";
    var mfaType = "";
    var userDetailsObj = null;
    var mfaNumberofResendCodes = null;
    var mfaFailureReason = ""

    //Fetch the requesterEmail ID
    var requesteremailID ="";
    if(requesterUserId && requesterUserId !== ""){
      var userQueryFilter = '(_id eq "' + requesterUserId + '")';
      var requesterUserObj = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter}, ["userName", "givenName", "sn", "mail", "accountStatus", "frIndexedString1", "frIndexedString2", "custom_kyidAccountType", "custom_approvalUnit1Code", "custom_approvalUnit2Code", "custom_approvalUnit3Code", "custom_approvalUnit4Code", "custom_approvalUnit5Code"]); 
      if(requesterUserObj && requesterUserObj.result && requesterUserObj.result.length > 0 && requesterUserObj.result[0].mail){
          requesteremailID = requesterUserObj.result[0].mail;
          var requesterUser = requesterUserObj.result[0];
         
         requesteruserDetailsObj = {
            Email: requesterUser.mail || "",
            UPN: requesterUser.frIndexedString1 || "",
            FN: requesterUser.givenName || "",
            LN: requesterUser.sn || "",
            KOGID: requesterUser.userName || "",
            Logon: requesterUser.frIndexedString2 || "",
            AccountType: requesterUser.custom_kyidAccountType || "",
            UserStatus: requesterUser.accountStatus || "",
            ApprovalUnit5: requesterUser.custom_approvalUnit5Code || "",
            ApprovalUnit4: requesterUser.custom_approvalUnit4Code || "",
            ApprovalUnit3: requesterUser.custom_approvalUnit3Code || "",
            ApprovalUnit2: requesterUser.custom_approvalUnit2Code || "",
            ApprovalUnit1: requesterUser.custom_approvalUnit1Code || ""
        };
          
      }
    }
    // Normalize headers input (stringified JSON or object)
    var headersObject = {};
    try {
      headersObject = typeof requestHeaders === "string" ? JSON.parse(requestHeaders) : (requestHeaders || {});
    } catch (e) {
      logger.error("AuditLogger :: Failed to parse requestHeaders, using empty object. Error: " + e);
      headersObject = {};
    }

    var secChUaPlatformArray = headersObject['sec-ch-ua-platform'];
    var userAgentArray = headersObject['user-agent'];

    os = secChUaPlatformArray && secChUaPlatformArray.length > 0 ? secChUaPlatformArray[0] : "";
    os = os ? os.replace(/^"|"$/g, '').replace(/\\"/g, '') : "";
    browser = userAgentArray && userAgentArray.length > 0 ? userAgentArray[0] : "";

    if (!eventDetails || typeof eventDetails !== "object") {
      eventDetails = {};
    }
    eventDetails["Browser"] = browser;
    eventDetails["OS"] = os;

    //MFA Reporting
      mfaPurpose = eventDetails["purpose"] || ""
      mfaAction = eventDetails["action"] || ""
      mfaStatus = eventDetails["mfastatus"] || ""
      mfaType = eventDetails["mfatype"] || ""
      mfaNumberofResendCodes = eventDetails["NumberofResendCodes"] || 0
      mfaFailureReason = eventDetails["MFAFailureReason"] || ""
      
      var mfaDetails = {
          MFAPurpose : mfaPurpose || "",
          MFAAction : mfaAction || "",
          MFAStatus : mfaStatus || "",
          MFAType: mfaType || "",
          MFANumberofResendCodes : mfaNumberofResendCodes || 0,
          MFAFailureReason: mfaFailureReason || ""
      }
    //requested user Details 
      if(requestedUserId && requestedUserId !== ""){
      var requestedUserQueryFilter = '(_id eq "' + requestedUserId + '")';
      var requestedUserObj = openidm.query('managed/alpha_user', { _queryFilter: requestedUserQueryFilter}, ["userName", "givenName", "sn", "mail", "accountStatus", "frIndexedString1", "frIndexedString2", "custom_kyidAccountType", "custom_approvalUnit1Code", "custom_approvalUnit2Code", "custom_approvalUnit3Code", "custom_approvalUnit4Code", "custom_approvalUnit5Code"]);

      if(requestedUserObj && requestedUserObj.result && requestedUserObj.result.length > 0){
        var requestedUser = requestedUserObj.result[0];
         
         userDetailsObj = {
            Email: requestedUser.mail || "",
            UPN: requestedUser.frIndexedString1 || "",
            FN: requestedUser.givenName || "",
            LN: requestedUser.sn || "",
            KOGID: requestedUser.userName || "",
            Logon: requestedUser.frIndexedString2 || "",
            AccountType: requestedUser.custom_kyidAccountType || "",
            UserStatus: requestedUser.accountStatus || "",
            ApprovalUnit5: requestedUser.custom_approvalUnit5Code || "",
            ApprovalUnit4: requestedUser.custom_approvalUnit4Code || "",
            ApprovalUnit3: requestedUser.custom_approvalUnit3Code || "",
            ApprovalUnit2: requestedUser.custom_approvalUnit2Code || "",
            ApprovalUnit1: requestedUser.custom_approvalUnit1Code || ""
        };
      }
    }

    //Defect Fix# 211192 (Unknown Location) - 03/12
    logger.error("***sessionDetails in KYID.2B1.Library.AuditLogger script is => "+JSON.stringify(sessionDetails)) 
    logger.error("typeof sessionDetails - "+typeof sessionDetails.sessionRefId)
    if (!sessionDetails || typeof sessionDetails !== "object") {
      sessionDetails = {};
    }

    sessionDetails = deepParse(sessionDetails.sessionRefId)
    logger.error("Typeof sessionDetails - "+typeof sessionDetails +" and value is - "+JSON.stringify(sessionDetails))

    var city = sessionDetails ? sessionDetails.city : "";
    var state = sessionDetails ? sessionDetails.state : "";
    var country = sessionDetails ? sessionDetails.country : "";

    var placeParts = [];
    if (city && city !== undefined && city !== "undefined") {
      placeParts.push(city);
    }
    if (state && state !== undefined && state !== "undefined") {
      placeParts.push(state);
    }
    if (country && country !== undefined && country !== "undefined" && (country.toUpperCase() !== "US" || country.toUpperCase() !== "UNITED STATES" )) {
      placeParts.push(country);
    }

    logger.error("***placeParts in KYID.2B1.Library.AuditLogger => "+placeParts)
    var place = "";
     if(!city){
         logger.error("city empty in event details")
         place = "Unknown Location"
     } else{
         logger.error("placeParts")
      place = placeParts.join(", ");
     }

    var logPayload = {
      eventCode: eventCode || "",
      eventName: eventName || "",
      eventDetails: JSON.stringify(eventDetails) || "",
      requesterUserId: requesterUserId || "",
      requestedUserId: requestedUserId || "",
      transactionId: transactionId || "",
      sessionDetails: (sessionDetails && sessionDetails.sessionRefId) ? sessionDetails.sessionRefId : (typeof sessionDetails === "string" ? sessionDetails : ""),  //Defect Fix# 211192 (Unknown Location) - 03/12
      createdDate: createdDate,
      createdTimeinEpoch: currentTimeinEpoch,
      emailId: emailId || "",
      applicationName: apllicationId || "",
      sessionId: (sessionDetails && sessionDetails.sessionRefId) ? sessionDetails.sessionRefId : (typeof sessionDetails === "string" ? sessionDetails : ""),    //Defect Fix# 211192 (Unknown Location) - 03/12
      sspVisibility: sspVisibility || false,
      ridpReferenceId: ridpReferenceId || "",
      //place: requestHeaders.get("x-client-city")?requestHeaders.get("x-client-city")[0]:"",
      place: place,
      helpdeskVisibility: helpdeskVisibility || false,
      requesterUseremailID: requesteremailID,
      requestedUseremailID: emailId,
      mfaDetails: JSON.stringify(mfaDetails),                              //MFAReporting
      requestedUserDetails: JSON.stringify(userDetailsObj),                //MFAReporting
      requesterUserDetails: JSON.stringify(requesteruserDetailsObj)        //MFAReporting
    };
    logger.error("KYIDAuditLogger logPayload :::" + JSON.stringify(logPayload));

    var sendLogstoDBandMO = systemEnv.getProperty("esv.sendauditlogs.db.mo");
      if(sendLogstoDBandMO === "true"|| sendLogstoDBandMO === true){
          logger.error("the value of esv sendLogstoDBandMO is"+sendLogstoDBandMO)
        var idmPatchResponse;
        try {
          idmPatchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
          logger.error("KYIDAuditLogger :: patchResponse from IDM :" + JSON.stringify(idmPatchResponse));
        } catch (repoErr) {
          logger.error("KYIDAuditLogger :: IDM create failed :: " + repoErr);
        }
      }
    

    var patchResponse;
    try {
        var sihcertforlogapi;
        if (systemEnv.getProperty("esv.kyid.cert.logs.client") && systemEnv.getProperty("esv.kyid.cert.logs.client") != null) {
            sihcertforlogapi = systemEnv.getProperty("esv.kyid.cert.logs.client");
            logger.error("the sihcertforlogapi"+sihcertforlogapi)
        } else {
            logger.error("sihcertforlogapi is missing");
        }

        var apiDBURL = "";
        if (systemEnv.getProperty("esv.kyid.sih.auditlogsdb") && systemEnv.getProperty("esv.kyid.sih.auditlogsdb") != null) {
            apiDBURL = systemEnv.getProperty("esv.kyid.sih.auditlogsdb");
            logger.error("the apiDBURL"+apiDBURL)
        } else {
            logger.error("apiDBURL is missing");
        } 

        var apiDBHeader = "";
        if (systemEnv.getProperty("esv.kyid.cert.logs.header") && systemEnv.getProperty("esv.kyid.cert.logs.header") != null) {
            apiDBHeader = systemEnv.getProperty("esv.kyid.cert.logs.header");
            logger.error("the apiDBHeader"+apiDBHeader)
        } else {
            logger.error("apiDBHeader is missing");
        }
        
        var requestOptions = {
            "clientName": sihcertforlogapi,
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": apiDBHeader
                },
            "body": logPayload
       }
       //var apiURL = "https://perf.sih.ngateway.ky.gov/external/api/ide3/UserActivityLogs"; 
        logger.error("the requestOptions::"+JSON.stringify(requestOptions))
    
        var res = httpClient.send(apiDBURL, requestOptions).get();
          //  action.withHeader(`Response code: ${res.status}`);
          logger.error("KYIDAuditLogger apiResponse status :: " + res.status + " :: response :: "+  res.text());
        } catch (httpErr) {
          logger.error("KYIDAuditLogger :: HTTP request failed :: " + httpErr);
        }

        return { external: patchResponse, idm: idmPatchResponse };
  } catch (error) {
    logger.error("KYID.2B1.Library.AuditLogger Library Script error :: " + JSON.stringify(error));
    if (error && error.stack) {
      logger.error("KYID.2B1.Library.AuditLogger Library Script stack :: " + error.stack);
    }
    return { error: String(error) };
  }
}


function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


function deepParse(data) {
  // If it's not a string, we can't parse it further
  if (typeof data !== 'string') {
    return data;
  }

  try {
    const parsed = JSON.parse(data);
    // If the parsed result is still a string, keep parsing
    return deepParse(parsed);
  } catch (e) {
    // If JSON.parse fails, it's a regular string, so return it
    return data;
  }
}

exports.auditLogger=auditLogger;