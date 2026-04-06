logger.error("Executing KYID.2B1.Library.AuditLogger Script");

function auditLogger(eventCode,sessionDetails,eventName, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, apllicationId, sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility) {
  try {
    logger.debug("KYID.2B1.Library.AuditLogger -- Inside Audit Logger");
    //logger.error("request headers in KYID.2B1.Library.AuditLogger1 :: " + JSON.stringify(requestHeaders))
    //logger.error("request headers in KYID.2B1.Library.AuditLogger2 :: " + requestHeaders.get("x-client-city"))
    const createdDate = new Date().toISOString();
    const currentTimeinEpoch = Date.now();
    var sessionIdValue;
    var browser = "";
    var os = "";

    // var userActivityEndpoint = "https://sih.uat.kyid.ky.gov/external/api/ide3/UserAuditLogs";
    // var userActivityCredential = "255b0e1d46ec488c95dab3bef2c55b94";
    //Fetch the requesterEmail ID
    var requesteremailID ="";
    if(requesterUserId && requesterUserId !== ""){
      var userQueryFilter = '(_id eq "' + requesterUserId + '")';
      var requesterUserObj = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter}, ["mail"]); 
      if(requesterUserObj && requesterUserObj.result && requesterUserObj.result.length > 0 && requesterUserObj.result[0].mail){
        requesteremailID = requesterUserObj.result[0].mail;
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
    //eventDetails["place"] = requestHeaders.get("x-client-city")?requestHeaders.get("x-client-city")[0]:""

    //Defect Fix# 211192 (Unknown Location) - 03/12 ---START
    logger.error("***sessionDetails in KYID.2B1.Library.AuditLogger script is => "+JSON.stringify(sessionDetails)) 
    logger.error("typeof sessionDetails - "+typeof sessionDetails.sessionRefId)
    if (!sessionDetails || typeof sessionDetails !== "object") {
      sessionDetails = {};
    }

    sessionDetails = deepParse(sessionDetails.sessionRefId)
    logger.error("Typeof sessionDetails - "+typeof sessionDetails +" and value is - "+JSON.stringify(sessionDetails))
   // sessionDetails = JSON.parse(sessionDetails.sessionRefId)
    var city = sessionDetails ? sessionDetails.city : "";
    var state = sessionDetails ? sessionDetails.state : "";
    var country = sessionDetails ? sessionDetails.country : "";
      
    /*var city = eventDetails["City"] || "";
    var state = eventDetails["State"] || "";
    var country = eventDetails["Country"] || "";*/
    //Defect Fix# 211192 (Unknown Location) - 03/12 ---END  
      
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
      // var xClientCity = requestHeaders.get("x-client-city")?requestHeaders.get("x-client-city")[0]:""
      // var xClientRegion = requestHeaders.get("x-client-region")?requestHeaders.get("x-client-region")[0]:""

      // if(xClientRegion && xClientRegion.toUpperCase() === "US"){
      //     logger.error("region is US")
      //   place = xClientCity || "";
      // } else {
      //     logger.error("place will be city and country")
      //   place = [xClientCity, xClientRegion].filter(Boolean).join(", ");
      // }
     } else{
         logger.error("placeParts")
          place = placeParts.join(", ");
     }

    //Defect Fix# 211192 (Unknown Location) - 03/12 ---START
    /*if (sessionRefId && typeof sessionRefId === "string" && sessionRefId.trim() !== "") {
      sessionIdValue = sessionRefId;
    } else {
      sessionIdValue = generateGuid();
    }*/
    //Defect Fix# 211192 (Unknown Location) - 03/12 ---END

    var logPayload = {
      eventCode: eventCode || "",
      eventName: eventName || "",
      eventDetails: JSON.stringify(eventDetails) || "",
      requesterUserId: requesterUserId || "",
      requestedUserId: requestedUserId || "",
      transactionId: transactionId || "",
      //sessionDetails: sessionDetails ? JSON.stringify(sessionDetails) : "",
      sessionDetails: sessionDetails ? sessionDetails.sessionRefId : "",  //Defect Fix# 211192 (Unknown Location) - 03/12
      createdDate: createdDate,
      createdTimeinEpoch: currentTimeinEpoch,
      emailId: emailId || "",
      applicationName: apllicationId || "",
      //sessionId: sessionIdValue || "",
       sessionId: sessionDetails ? sessionDetails.sessionRefId : "",    //Defect Fix# 211192 (Unknown Location) - 03/12  
      sspVisibility: sspVisibility || false,
      ridpReferenceId: ridpReferenceId || "",
      //place: requestHeaders.get("x-client-city")?requestHeaders.get("x-client-city")[0]:"",
      place: place,
      helpdeskVisibility: helpdeskVisibility || false,
      requesterUseremailID: requesteremailID,
      requestedUseremailID: emailId
    };
    logger.error("KYIDAuditLogger logPayload :::" + JSON.stringify(logPayload));



    var idmPatchResponse;
    try {
      idmPatchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
      logger.error("KYIDAuditLogger :: patchResponse from IDM :" + JSON.stringify(idmPatchResponse));
    } catch (repoErr) {
      logger.error("KYIDAuditLogger :: IDM create failed :: " + repoErr);
    }

   var patchResponse;

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

//Defect Fix# 211192 (Unknown Location) - 03/12 ---START
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
//Defect Fix# 211192 (Unknown Location) - 03/12 ---END

exports.auditLogger=auditLogger;