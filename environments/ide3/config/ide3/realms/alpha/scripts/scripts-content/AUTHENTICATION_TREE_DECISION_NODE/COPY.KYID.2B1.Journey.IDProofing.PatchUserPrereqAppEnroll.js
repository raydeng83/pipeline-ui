var currentTimeEpoch = Date.now();
var dateTime = new Date().toISOString();
try {
    getTransactionId();
    var proofingMethod = null;
     var patchResponse = null;
     logger.error("Executing KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll " )
if(nodeState.get("context")==="appEnroll"){
    logger.error("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  Inside App enroll " )
     // var patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"));
    if(nodeState.get("prereqStatus")=== "COMPLETED"){
        logger.error("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  Inside prereqStatus COMPLETED " )
         proofingMethod = "2";
         patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"));
        logger.error("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  patchResponse is"+patchResponse )
        if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
             logger.error("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  LexisNexis " )
            proofingMethod = "2"
        }
        else{
            logger.error("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  CMS " )
            proofingMethod = "3"
        }
        if(nodeState.get("patchUserId")){
           patchUserIdentity(proofingMethod) 
        }
        else{
            createUser(proofingMethod)
        }
        
        if(nodeState.get("transaction_Id")!== null && nodeState.get("transaction_Id")){
            patchTransaction("0",null,null)
        }
        else{
            createTransaction("0",null,null,null)
        }
        
        
    }
    else if(nodeState.get("prereqStatus")=== "REVERIFY"){
        logger.error("Inside Reverify ")
         proofingMethod = "2";
         patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"));
        if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                    proofingMethod = "2"
        }
        else{
            proofingMethod = "3"
        }
        var refId = nodeState.get("refId");
        if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
            refId= generateGUID()
        }
        if(nodeState.get("transaction_Id")!==null && nodeState.get("transaction_Id")!==null){
            if(nodeState.get("patchUserId")){
              patchTransaction("1",null,null)  
            }
            else{
                createUser(proofingMethod)
            }
            
        }
        else{
            createTransaction("1",refId,null,null)
        }
        
    }
    else if(nodeState.get("prereqStatus")=== "PENDING" ){
        
         patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"))
    }
    else if(nodeState.get("prereqStatus")=== "NOT_COMPLETED"){
         patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"))
    }
   
    
    
    if(patchResponse){
        if(nodeState.get("prereqStatus")=== "REVERIFY"){
            nodeState.putShared("FARS","1")
            action.goTo("FARS")
        }
        else if(nodeState.get("prereqStatus")=== "PENDING"){
            if(nodeState.get("LexisNexisFARS")==="true"){
                nodeState.putShared("displayFARS2","true")
            }
            action.goTo("displayFARS2")
        }
        else{
            action.goTo("appEnrollMessage")
        }
         
    }
    else{
        logger.error("error")
    }
   
}
else{
    action.goTo("Next")
}
    
} catch (error) {
    logger.error("Error Occurred KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll "+error)
}


function updatePrereqStatus(userPrereqId) {
  try {
    var jsonArray = []
    var prereqValues = []
    var userInfoJSON = nodeState.get("userInfoJSON")
    // if(userInfoJSON.givenName){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="givenName"
    //     prereqJSON["fieldValue"] =userInfoJSON.givenName
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.custom_middleName){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="middileName"
    //     prereqJSON["fieldValue"] =userInfoJSON.custom_middleName
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.sn){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="sn"
    //     prereqJSON["fieldValue"] =userInfoJSON.sn
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.custom_suffix){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="givenName"
    //     prereqJSON["fieldValue"] =userInfoJSON.custom_suffix
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.custom_gender){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="gender"
    //     prereqJSON["fieldValue"] =userInfoJSON.custom_gender
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.custom_dateofBirth){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="dob"
    //     prereqJSON["fieldValue"] =userInfoJSON.custom_dateofBirth
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.ssn){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="ssn"
    //     prereqJSON["fieldValue"] =userInfoJSON.ssn
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.postalAddress){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="address1"
    //     prereqJSON["fieldValue"] =userInfoJSON.postalAddress
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.custom_postalAddress2){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="address2"
    //     prereqJSON["fieldValue"] =userInfoJSON.custom_postalAddress2
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.city){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="city"
    //     prereqJSON["fieldValue"] =userInfoJSON.city
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.stateProvince){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="stateProvince"
    //     prereqJSON["fieldValue"] =userInfoJSON.stateProvince
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.postalCode){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="postalCode"
    //     prereqJSON["fieldValue"] =userInfoJSON.postalCode
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.postalExtension){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="postalExtension"
    //     prereqJSON["fieldValue"] =userInfoJSON.postalExtension
    //     prereqValues.push(prereqJSON)
    // }
    // if(userInfoJSON.custom_county){
    //     var prereqJSON = {}
    //     prereqJSON["fieldName"]="custom_county"
    //     prereqJSON["fieldValue"] =userInfoJSON.custom_county
    //     prereqValues.push(prereqJSON)
    // }

    
    // if(userInfoJSON.telephoneNumber){
    //     prereqJSON["fieldName"]="telephoneNumber",
    //     prereqJSON["fieldValue"] =userInfoJSON.telephoneNumber
    //     prereqValues.push(prereqJSON)
        
    // }
      logger.error("prereqValues are --> "+ JSON.stringify(prereqValues))

    // var fieldNames = [ "givenName", "middleName", "sn", "custom_gender", "custom_suffix", "custom_dateofBirth", "postalAddress", "custom_postalAddress2", "stateProvince", "postalCode" , "custom_county", "telephoneNumber"]; 
    
    // fieldNames.forEach(field => {
    //     var value = nodeState.get("field");
    //     if (value) {
    //         prereqJSON[field] = value;
    //     }
    // });
      
    // prereqValues.push(prereqJSON)
   
    var jsonObj = {
      "operation":"replace",
      "field":"status",
      "value":nodeState.get("prereqStatus")
    }
    jsonArray.push(jsonObj)

     jsonObj = {
      "operation":"replace",
      "field":"updateDateEpoch",
      "value":currentTimeEpoch
    }
     jsonArray.push(jsonObj)
     jsonObj = {
      "operation":"replace",
      "field":"updateDate",
      "value": dateTime
    }

    jsonArray.push(jsonObj)
      if(nodeState.get("prereqStatus")==="COMPLETED"  ){
     jsonObj = {
      "operation":"replace",
      "field":"completionDateEpoch",
      "value": currentTimeEpoch
    }
     jsonArray.push(jsonObj)
          
      }

      if(nodeState.get("prereqStatus") ==="COMPLETED"){
     jsonObj = {
      "operation":"replace",
      "field":"completionDate",
      "value": dateTime
    }
     jsonArray.push(jsonObj)
          
      }


     jsonObj = {
      "operation":"replace",
      "field":"updatedBy",
      "value": nodeState.get("UserId")
    }
     jsonArray.push(jsonObj)
      
      if(prereqValues.length>0){
         jsonObj = {
          "operation":"replace",
          "field":"prerequisiteValues",
          "value": prereqValues
        }
        jsonArray.push(jsonObj)    
      }

    logger.error("endpoint/UserPrerequisiteAPI jsonArray --> "+ jsonArray)

        var response = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" +userPrereqId, null, jsonArray);
        logger.error("updatePrereqStatus -- response --> "+ response)
      if(response){
          return response
      }
      else{
          return null
      }


    
  } catch (error) {
    logger.error("Error Occurred while updatePrereqStatus User Prerequsites"+error)
      action.goTo("error")

  }
  
}   


function patchUserIdentity(proofingMethod) {
try {
    logger.error("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  patchUserId " + nodeState.get("patchUserId"))
    var Id = nodeState.get("patchUserId")
    // logger.error("_patchUserIdentity id is --> "+Id+"Lexid::"+lexId)
    
    var jsonArray = []
    if(proofingMethod !== null && proofingMethod){
    var jsonObj = {
        "operation": "replace",
        "field": "proofingMethod",
        "value": proofingMethod
        }
        jsonArray.push(jsonObj)
  

    logger.error("KYID.2B1.Journey.IDProofing.MCISearchApiCall jsonArray Length is --> "+jsonArray.length )

    if(jsonArray.length>0){
         var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
         nodeState.putShared("patchUserIdentity_id",response._id)
        logger.error("Patch Response -->"+response)
         
    if(response){
        return true
    }
    }
    else{
        return false
    }
    }
    else{
        return false
    }




    
} catch (error) {
    logger.error("Error Occurred While patchUserIdentity "+ error)
    
}    
}


function createTransaction(status,refId,expiryDate,expiryDateEpoch) {
    try {
        
        logger.error("Starting user createTransaction creation for ID: " );
        logger.error("status is --> "+ status)
        logger.error("refId is --> "+ refId)
        logger.error("expiryDate is --> "+ expiryDate)
        logger.error("expiryDateEpoch is --> "+ expiryDateEpoch)
        logger.error("currentTimeEpoch is --> "+ currentTimeEpoch)
        logger.error("dateTime is --> "+ dateTime)
        logger.error("user Id  is --> "+ nodeState.get("UserId"))
        logger.error("user Id  is --> "+ nodeState.get("userPrereqId"))
        

        var requestBody={
            "createDate":dateTime,
            "createdBy":nodeState.get("UserId"),
            "requestedUserId":nodeState.get("UserId"),
            "requesterUserId":nodeState.get("UserId"),
            "updatedBy":nodeState.get("UserId"),
            "updateDate":dateTime,
            "createDateEpoch":currentTimeEpoch,
            "updateDateEpoch":currentTimeEpoch,
            "recordState":"0",
            "recordSource":"KYID-System"
            
                                    
        }
        if(nodeState.get("userPrereqId")){
            requestBody["userPrereqId"]={ "_ref": "managed/alpha_kyid_enrollment_user_prerequisites/" + nodeState.get("userPrereqId"), "_refProperties": {} }
        }
        if(status){
            requestBody["status"]=status
        }
        if(expiryDate){
            requestBody["expiryDate"]=expiryDate
        }
        if(expiryDateEpoch){
            requestBody["expiryDateEpoch"]=expiryDateEpoch
        }
        if(refId){
            requestBody["referenceId"]=refId
        }
        
        
        var response = openidm.create("managed/alpha_kyid_remote_identity_proofing_request", null, requestBody);
        logger.error("response is --> "+ response)


    } catch (error) {
        logger.error("Errror Occurred While createTransaction is --> "+ error)
        
    }
    
}

function patchTransaction(status,expiryDate,expiryDateEpoch) {
    try {
        
        logger.error("Starting user patchTransaction creation for ID: " );
        logger.error("status is --> "+ status)
        logger.error("expiryDate is --> "+ expiryDate)
        logger.error("expiryDateEpoch is --> "+ expiryDateEpoch)
        logger.error("currentTimeEpoch is --> "+ currentTimeEpoch)
        logger.error("dateTime is --> "+ dateTime)
        logger.error("user Id  is --> "+ nodeState.get("UserId"))
        logger.error("user Id  is --> "+ nodeState.get("userPrereqId"))
           
        var jsonArray = []

       if(status){
        var jsonObj = {
        "operation": "replace",
        "field": "status",
        "value": status
        }
        jsonArray.push(jsonObj)
           
       }

        if(dateTime){
        var jsonObj = {
        "operation": "replace",
        "field": "updateDate",
        "value": dateTime
        }
        jsonArray.push(jsonObj)
           
       }

        if(currentTimeEpoch){
        var jsonObj = {
        "operation": "replace",
        "field": "updateDateEpoch",
        "value": currentTimeEpoch
        }
        jsonArray.push(jsonObj)
           
       }

        if(nodeState.get("UserId")){
        var jsonObj = {
        "operation": "replace",
        "field": "updatedBy",
        "value": nodeState.get("UserId")
        }
        jsonArray.push(jsonObj)
           
       }
       if(expiryDate){
          var jsonObj = {
        "operation": "replace",
        "field": "expiryDate",
        "value": expiryDate
        }
        jsonArray.push(jsonObj)
          
       }
     if(expiryDateEpoch){
          var jsonObj = {
        "operation": "replace",
        "field": "expiryDateEpoch",
        "value": expiryDateEpoch
        }
        jsonArray.push(jsonObj)
          
       }

        
       if(jsonArray.length>0){
        var response = openidm.patch("managed/alpha_kyid_remote_identity_proofing_request/" + nodeState.get("transaction_Id"), null, jsonArray);
        logger.error("patch response alpha_kyid_remote_identity_proofing_request --> "+ response)
        if(response){
           return true  
        }
           else{
                return false
           }
       
           
       }
        else{
            return false
        }



    } catch (error) {
        logger.error("Errror Occurred While patchTransaction is --> "+ error)
        
    }
    
}

function getTransactionId() {
    try {
             
        var response =  openidm.query("managed/alpha_kyid_remote_identity_proofing_request/", { "_queryFilter": 'userPrereqId/_refResourceId eq "' + nodeState.get("userPrereqId") + '"' }, ["*"]);
        logger.error("getTransactionId is --> "+response)
       if(response){
            if(response.resultCount>0){
                nodeState.putShared("transaction_Id",response.result[0]._id)
                return response.result[0]
            }
            else{
                return null
        }
           
       }
        else{
            return null
        }



    } catch (error) {
        logger.error("Errror Occurred While getTransactionId is --> "+ error)
        
    }
    
}

function createUser(proofingMethod) {
    try {
        var userInfoJSON = nodeState.get("userInfoJSON")
         var lexId =null
        logger.error("Starting user identity creation for ID: " );
       if(nodeState.get("lexId")){
         lexId = nodeState.get("lexId")  
       }

        
        var userData={
            "proofingMethod":proofingMethod,
            "lastVerificationDate":dateTime,
            "uuid":lexId,
            "createDate":dateTime,
            "updateDate":dateTime,
            "createDateEpoch":currentTimeEpoch,
            "updateDateEpoch":currentTimeEpoch,
            "recordState":"0",
            "recordSource":"KYID-System",
            account:[]
                                    
        }
        if(nodeState.get("UserId")){
            userData.account.push({ "_ref": "managed/alpha_user/" + nodeState.get("UserId"), "_refProperties": {} })
        }
        if(userInfoJSON.suffix){
            userData["suffix"]=userInfoJSON.suffix
        }
        if(userInfoJSON.middleName){
            userData["middleName"]=userInfoJSON.middleName
        }
        if(userInfoJSON.stateProvince){
            userData["stateCode"]=userInfoJSON.stateProvince
        }
        if(userInfoJSON.sn){
            userData["sn"]=userInfoJSON.sn
        }
        if(userInfoJSON.gender){
            userData["gender"]=userInfoJSON.gender
        }
        if(userInfoJSON.dob){
            userData["dob"]=userInfoJSON.dob
        }
        if(userInfoJSON.postalAddress){
            userData["addressLine1"]=userInfoJSON.postalAddress
        }
        if(userInfoJSON.postalAddress2){
            userData["addressLine2"]=userInfoJSON.postalAddress2
        }
        if(userInfoJSON.givenName){
            userData["givenName"]=userInfoJSON.givenName
        }
        if(userInfoJSON.city){
            userData["city"]=userInfoJSON.city
        }
        if(userInfoJSON.postalCode){
            userData["zip"]=userInfoJSON.postalCode
        }
        if(userInfoJSON.postalExtension){
            userData["postalExtension"]=userInfoJSON.postalExtension
        }
        if(userInfoJSON.county){
            userData["countyCode"]=userInfoJSON.county
        }
            var response = openidm.create("managed/alpha_kyid_user_identity", null, userData);
            nodeState.putShared("patchUserId",response._id)
        logger.error("response is --> "+ response)


    } catch (error) {
        logger.error("Errror Occurred While creating userIdentity is --> "+ error)
        
    }
    
}

// Generate a random GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, 
            value = c == 'x' ? r : (r & 0x3 | 0x8);
        return value.toString(16);
    });
}

