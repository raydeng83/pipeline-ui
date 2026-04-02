var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Update User Identity",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Manage.Profile.UpdateUserIdentity",
    timestamp: dateTime,
    end: "Node Execution Completed"
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


function main(){
    var selectedUserEmail = nodeState.get("mail");
    var verifiedLexId = nodeState.get("verifiedLexId");
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside main function");
        var patchResponse = patchUserIdentity(selectedUserEmail, verifiedLexId);
        if(patchResponse){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User Identity patched successfully, going to UpdateUserIdentity");
            // action.goTo("patchInKOG");
            outcome = "True"
        }else{
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User Identity patch failed, going to patchFailed");
            // action.goTo("patchFailed");
             outcome = "False"
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in main Function" + error.message);
    }
}

main();

function patchUserIdentity(selectedUser, verifiedLexId) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
    var auditDetails = require("KYID.2B1.Library.AuditDetails")

     if (typeof existingSession != 'undefined') {
        if(existingSession.get("UserId")){
            var existingID = existingSession.get("UserId")
        }
    
        //logger.error(" existingSession  is ::::::::: " + JSON.stringify(existingSession))
        if(existingSession.get("emailaddress")){
            var existingMail = existingSession.get("emailaddress")
        }
     }
     nodeState.putShared("audit_ID",existingID);
     nodeState.putShared("audit_LOGON",existingMail)
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    try {
        var pingSearchResponse = openidm.query("managed/alpha_user", {_queryFilter: 'mail eq "' + selectedUser + '"'}, ["*","custom_userIdentity/*"]);

        if(pingSearchResponse && pingSearchResponse.result && pingSearchResponse.result.length > 0){
            if(pingSearchResponse.result[0].custom_userIdentity && pingSearchResponse.result[0].custom_userIdentity._id){
                var Id = pingSearchResponse.result[0].custom_userIdentity._id
                nodeState.putShared("patchUserId",Id)
                var proofingMethod = "4";
                logger.debug("_patchUserIdentity id is --> "+Id)
                var jsonArray = []
                nodeState.putShared("orig_logOn", pingSearchResponse.result[0].frIndexedString1);
                nodeState.putShared("orig_upn", pingSearchResponse.result[0].frIndexedString2);
                nodeState.putShared("KOGID", pingSearchResponse.result[0].userName);
                 nodeState.putShared("organDonorStatus", pingSearchResponse.result[0].custom_organdonor);
                

                if(nodeState.get("userAttributes") && nodeState.get("userAttributes") !== null && typeof nodeState.get("userAttributes") !== 'undefined'){
                    nodeLogger.debug("userAttributes are :: " + JSON.stringify(nodeState.get("userAttributes")))
                    var userAttributes = JSON.parse(nodeState.get("userAttributes"));
                    nodeLogger.debug("userAttributes Array :: " + Array.isArray(userAttributes))
                    if(Array.isArray(userAttributes) && userAttributes.length > 0){
                        userAttributes.forEach(function(attribute){
                        nodeLogger.debug("attribute is :: " + JSON.stringify(attribute))

                        //FirstName
                        if(attribute.attributeName.toLowerCase()=="firstname"){
                              if(nodeState.get("givenName")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "givenName",
                                    "value": nodeState.get("givenName")
                                    }
                                    jsonArray.push(jsonObj)
                                }
                                
                                if(attribute.correctedValue){
                                    var jsonObj = { 
                                        "operation": "replace",
                                        "field": "corrected_givenName",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }

                                if(attribute.status){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "status_givenName",
                                        "value": attribute.status
                                        }
                                        jsonArray.push(jsonObj)
                                }
                        }

                        //LastName
                        if(attribute.attributeName.toLowerCase()=="lastname"){
                            if(nodeState.get("sn")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "sn",
                                    "value": nodeState.get("sn")
                                    }
                                    jsonArray.push(jsonObj)
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_sn",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }

                            if(attribute.status){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "status_sn",
                                    "value": attribute.status
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        //MiddleName
                        if(attribute.attributeName.toLowerCase()=="middlename"){
                            if(nodeState.get("custom_middleName") && nodeState.get("custom_middleName")!==null){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "middleName",
                                "value": nodeState.get("custom_middleName")
                                }
                                jsonArray.push(jsonObj) 
                            }else{
                            var jsonObj = {
                                "operation": "replace",
                                "field": "middleName",
                                "value": ""
                                }
                                jsonArray.push(jsonObj) 
                                
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_middleName",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }

                            if(attribute.status){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "status_middleName",
                                    "value": attribute.status
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        //Dob
                        if(attribute.attributeName.toLowerCase()=="dob"){
                            if(nodeState.get("custom_dateofBirth")){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "dob",
                                "value": nodeState.get("custom_dateofBirth")
                                }
                                jsonArray.push(jsonObj) 
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_dob",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }

                            if(attribute.status){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "status_dob",
                                    "value": attribute.status
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        //Addressline1
                        if(attribute.attributeName.toLowerCase()=="addressline1"){
                            //Address Line1
                            if(nodeState.get("postalAddress")){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "addressLine1",
                                "value": nodeState.get("postalAddress")
                                }
                                jsonArray.push(jsonObj)  
                            }else{
                                var jsonObj = {
                                "operation": "replace",
                                "field": "addressLine1",
                                "value": ""
                                }
                                jsonArray.push(jsonObj)  
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_addressLine1",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        //Addressline2
                        if(attribute.attributeName.toLowerCase()=="addressline2"){
                            if(nodeState.get("custom_postalAddress2")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "addressLine2",
                                    "value": nodeState.get("custom_postalAddress2")
                                }
                                jsonArray.push(jsonObj)
                            }else{
                                var jsonObj = {
                                "operation": "replace",
                                "field": "addressLine2",
                                "value": ""
                                }
                                jsonArray.push(jsonObj)  
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_addressLine2",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        //City
                        if(attribute.attributeName.toLowerCase()=="city"){
                            if(nodeState.get("city")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "city",
                                    "value": nodeState.get("city")
                                    }
                                    jsonArray.push(jsonObj) 
                                }else{
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "city",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj) 
                                }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_city",
                                    "value": attribute.correctedValue
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        //StateCode
                        if(attribute.attributeName.toLowerCase()=="stateCode"){
                            if(nodeState.get("stateProvince")){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "stateCode",
                                "value": nodeState.get("stateProvince")
                                }
                                jsonArray.push(jsonObj)  
                            }else{
                                var jsonObj = {
                                "operation": "replace",
                                "field": "stateCode",
                                "value": ""
                                }
                                jsonArray.push(jsonObj)  
                                
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_stateCode",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        //CountyCode
                        if(attribute.attributeName.toLowerCase()=="countyCode"){
                            if(nodeState.get("postalCode")){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "zip",
                                "value": nodeState.get("postalCode")
                                }
                                jsonArray.push(jsonObj)   
                            }else{
                                var jsonObj = {
                                "operation": "replace",
                                "field": "zip",
                                "value": ""
                                }
                                jsonArray.push(jsonObj)  
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_zip",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }

                        }

                        //CountryCode
                        if(attribute.attributeName.toLowerCase()=="countrycode"){
                            if(nodeState.get("orig_custom_country") || nodeState.get("country")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "countryCode",
                                    "value": nodeState.get("orig_custom_country") || nodeState.get("country")
                                    }
                                    jsonArray.push(jsonObj)   
                                }else{
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "countryCode",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj)   
                                    
                                }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_countryCode",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        //Zip
                        if(attribute.attributeName.toLowerCase()=="zip"){
                            if(nodeState.get("zip")){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "zip",
                                "value": nodeState.get("zip") || ""
                                }
                                jsonArray.push(jsonObj)  
                            }else{
                                var jsonObj = {
                                "operation": "replace",
                                "field": "zip",
                                "value": ""
                                }
                                jsonArray.push(jsonObj)  
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_zip",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }


                        //ZipExtension
                        if(attribute.attributeName.toLowerCase()=="zipextension"){
                             if(nodeState.get("zipExtension")){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "zipExtension",
                                "value": nodeState.get("zipExtension")
                                }
                                jsonArray.push(jsonObj)  
                            }else{
                                var jsonObj = {
                                "operation": "replace",
                                "field": "zipExtension",
                                "value": ""
                                }
                                jsonArray.push(jsonObj)  
                            }

                            if(attribute.correctedValue){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "corrected_zipExtension",
                                    "value": attribute.correctedValue || ""
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        });
                    }
                }

                //Given Name
                if (nodeState.get("givenName")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "givenName",
                        "value": nodeState.get("givenName")
                    }
                    jsonArray.push(jsonObj)
                }
    
                //Middle Name
                if (nodeState.get("custom_middleName") && nodeState.get("custom_middleName") !== null) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "middleName",
                        "value": nodeState.get("custom_middleName")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "middleName",
                        "value": ""
                    }
                    jsonArray.push(jsonObj)
                    
                }
    
                //SN
                if (nodeState.get("sn")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "sn",
                        "value": nodeState.get("sn")
                    }
                    jsonArray.push(jsonObj)
                }

                //Suffix
                if (nodeState.get("custom_suffix")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "suffix",
                        "value": nodeState.get("custom_suffix")
                    }
                    jsonArray.push(jsonObj)
                }
    
    
    
                //Gender
                if (nodeState.get("custom_gender")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "gender",
                        "value": nodeState.get("custom_gender")
                    }
                    jsonArray.push(jsonObj)
                }
    
                //DOB
                if (nodeState.get("custom_dateofBirth")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "dob",
                        "value": nodeState.get("custom_dateofBirth")
                    }
                    jsonArray.push(jsonObj)
                }

                //isHomeless
                if(nodeState.get("isHomeless")){
                var jsonObj = {
                    "operation": "replace",
                    "field": "isHomeless",
                    "value": JSON.parse(nodeState.get("isHomeless"))
                    }
                    jsonArray.push(jsonObj)  
                }else{
                    var jsonObj = {
                    "operation": "replace",
                    "field": "isHomeless",
                    "value": false
                    }
                    jsonArray.push(jsonObj)    
                }

                //Address Line1
                if (nodeState.get("postalAddress")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "addressLine1",
                        "value": nodeState.get("postalAddress")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "addressLine1",
                        "value": ""
                    }
                    jsonArray.push(jsonObj)
                    
                }

                //Address Line2
                if (nodeState.get("custom_postalAddress2")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "addressLine2",
                        "value": nodeState.get("custom_postalAddress2")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "addressLine2",
                        "value": ""
                    }
                    jsonArray.push(jsonObj)
                    
                }

                //City
                if (nodeState.get("city")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "city",
                        "value": nodeState.get("city")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "city",
                        "value": ""
                    }
                    jsonArray.push(jsonObj)
                    
                }

                //Postal Code
                if (nodeState.get("postalCode")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "zip",
                        "value": nodeState.get("postalCode") || ""
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "zip",
                        "value": ""
                    }
                    jsonArray.push(jsonObj)
                    
                }

                //Postal Extension
                if (nodeState.get("zipExtension")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "zipExtension",
                        "value": nodeState.get("zipExtension")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "zipExtension",
                        "value": ""
                    }
                    jsonArray.push(jsonObj)
                }


                //Country Code
                if (nodeState.get("stateProvince")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "stateCode",
                        "value": nodeState.get("stateProvince")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "stateCode",
                        "value": ""
                    }
                    jsonArray.push(jsonObj) 
                }

                //County Code
                if (nodeState.get("custom_county")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "countyCode",
                        "value": nodeState.get("custom_county")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "countyCode",
                        "value": ""
                    }
                    jsonArray.push(jsonObj) 
                }

                //Title Code
                if (nodeState.get("custom_title")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "title",
                        "value": nodeState.get("custom_title")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "title",
                        "value": ""
                    }
                    jsonArray.push(jsonObj)
                    
                }

                //LanguagePreference
                if (nodeState.get("languagePreference")) {
                    var jsonObj = {
                        "operation": "replace",
                        "field": "languagePreference",
                        "value": nodeState.get("languagePreference")
                    }
                    jsonArray.push(jsonObj)
                }
                
                //Proofing Method
                var jsonObj = {
                    "operation": "replace",
                    "field": "proofingMethod",
                    "value": proofingMethod
                    }
                    jsonArray.push(jsonObj) 
                }

                //verificationStatus
                if(nodeState.get("verificationStatus") ){
                  var jsonObj = {
                    "operation": "replace",
                    "field": "verificationStatus",
                    "value": nodeState.get("verificationStatus")
                    }
                    jsonArray.push(jsonObj)
                }

                //kbaStatus
                var jsonObj = {
                    "operation": "replace",
                    "field": "kbaStatus",
                    "value": nodeState.get("kbaVerificationStatus") || nodeState.get("kbaStatus")  || "noKBA"
                    }
                    jsonArray.push(jsonObj)


                //riskIndicator
                if(nodeState.get("riskIndicator") ){
                  var jsonObj = {
                    "operation": "replace",
                    "field": "riskIndicator",
                    "value": nodeState.get("riskIndicator")
                    }
                    jsonArray.push(jsonObj)
                }

                //lastVerificationMethod
                if( nodeState.get("flowName") && ((nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                 var jsonObj = {
                    "operation": "replace",
                    "field": "lastVerificationMethod",
                    "value": nodeState.get("flowName")
                    }
                    jsonArray.push(jsonObj)
                }

                //uuid
                if(verifiedLexId && nodeState.get("verificationStatus") && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                var jsonObj = {
                    "operation": "replace",
                    "field": "uuid",
                    "value": verifiedLexId
                    }
                    jsonArray.push(jsonObj)   
                }

                

                //verificationMismatch
                if(nodeState.get("verificationMismatch") && nodeState.get("verificationMismatch")!==null && nodeState.get("verificationMismatch") === true){
                var jsonObj = {
                    "operation": "replace",
                    "field": "verificationMismatch",
                    "value": nodeState.get("verificationMismatch")
                    }
                    jsonArray.push(jsonObj)   
                }else{
                    var jsonObj = {
                    "operation": "replace",
                    "field": "verificationMismatch",
                    "value": false
                    }
                    jsonArray.push(jsonObj)
                }
            
                //lastVerificationDate
                var jsonObj = {
                    "operation": "replace",
                    "field": "lastVerificationDate",
                    "value": dateTime
                    }
                    jsonArray.push(jsonObj) 
            
                 
                //assuranceLevel
                var jsonObj = {
                    "operation": "replace",
                    "field": "assuranceLevel",
                    "value": "1"
                    }
                    jsonArray.push(jsonObj)   

                //updateDate
                var jsonObj = {
                    "operation": "replace",
                    "field": "updateDate",
                    "value": dateTime
                    }
                    jsonArray.push(jsonObj)

                //updateDateEpoch
                var jsonObj = {
                    "operation": "replace",
                    "field": "updateDateEpoch",
                    "value": currentTimeEpoch
                    }
                    jsonArray.push(jsonObj)

            
                //mciKogIDs
                if(nodeState.get("mciKogIDs") && nodeState.get("mciKogIDs") != null){
                    var mciKogIDs = []
                    logger.debug("mciKogIDs is :: " + JSON.parse(nodeState.get("mciKogIDs")))
                    if (nodeState.get("mciKogIDs") && nodeState.get("mciKogIDs") != null){
                        mciKogIDs = JSON.parse(nodeState.get("mciKogIDs"))
                        var jsonObj = {
                            "operation": "replace",
                            "field": "mciKogIDs",
                            "value": mciKogIDs
                        }   
                        jsonArray.push(jsonObj)  
                    }
                }

                //reason for failure
                if(nodeState.get("reason") && nodeState.get("reason")!==null && nodeState.get("reason") === "service_error"){
                    var jsonObj = {
                        "operation": "replace",
                        "field": "reason",
                        "value": nodeState.get("reason")
                        }
                    jsonArray.push(jsonObj)   
                }else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "reason",
                        "value": ""
                        }
                    jsonArray.push(jsonObj)
                }  

                 //Audit Details
                 jsonArray.push({
                     "operation": "replace",
                     "field": "/updatedDateEpoch",
                     "value": auditData.updatedDateEpoch
                 });
            
                 jsonArray.push({
                     "operation": "replace",
                     "field": "/updatedByID",
                     "value": auditData.updatedByID
                 });
            
                 jsonArray.push({
                     "operation": "replace",
                     "field": "/updatedBy",
                     "value": auditData.updatedBy
                 });
            
                 jsonArray.push({
                     "operation": "replace",
                     "field": "/updateDate",
                     "value": auditData.updatedDate
                 });
        

                logger.debug("jsonArray in KYID.2B1.Journey.IDProofing.Manage.Profile.UpdateUserIdentity is :: "+ JSON.stringify(jsonArray))
                if(jsonArray.length>0){
                    var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
                    logger.debug("Patch Response -->"+response)
                    if(response){
                        return true
                    }
                }else{
                    return false
                }  

            }
        
    } catch (error) {
        logger.error("Error Occurred While patchUserIdentity "+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchUserIdentity Function" + error.message);
    }    
}