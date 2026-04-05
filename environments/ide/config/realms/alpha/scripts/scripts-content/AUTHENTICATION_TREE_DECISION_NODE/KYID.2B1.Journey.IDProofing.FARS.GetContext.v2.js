try {
    var transcationRecord = null;
    logger.debug("Executing KYID.2B1.Journey.IDProofing.FARS.GetContext")
    logger.debug("KYID.2B1.Journey.IDProofing.FARS.GetContext context"+nodeState.get("context"))
    logger.debug("KYID.2B1.Journey.IDProofing.FARS.GetContext userprereqId"+nodeState.get("userPrereqId"))
    logger.debug("KYID.2B1.Journey.IDProofing.FARS.GetContext businessAppId"+nodeState.get("businessAppId"))
    var appId = nodeState.get("appId") || nodeState.get("businessAppId");
    getUserIdentity();
    getHelpDeskId(appId);
    getDocuments(appId);
    if(nodeState.get("context")==="appEnroll" && nodeState.get("userPrereqId")){
        logger.debug("KYID.2B1.Journey.IDProofing.FARS.GetContext context"+nodeState.get("context"))
        logger.debug("KYID.2B1.Journey.IDProofing.FARS.GetContext userprereqId"+nodeState.get("userPrereqId"))
    
        // if(nodeState.get("appEnrollRIDPMethod") === "CMS"){
            transcationRecord =  getRefrencedId(nodeState.get("userPrereqId"))
            if(transcationRecord !== null && transcationRecord){
                if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis" && nodeState.get("flow")==="helpdesk"){
                    logger.debug("inside helpdesk appEnroll")
                    if(nodeState.get("requestedUserAccountId") && nodeState.get("requestedUserAccountId")!=null){
                        var userId= nodeState.get("requestedUserAccountId")
                        if(userId && userId!=null){
                            nodeState.putShared("UserId",userId)  
                        }
                    }
                    nodeState.putShared("LexisNexisattempt2","true")
                    nodeState.putShared("LexisNexisFARS","true")
                   if(!(nodeState.get("patchPrereq") && nodeState.get("patchPrereq")== "false")){
                        if(nodeState.get("lexisHelpdeskFARS")=="true"){
                            nodeState.putShared("lexisHelpdeskFARS", null)
                            action.goTo("displayFARS_2")
                        }else{
                            action.goTo("LexisNexis")
                        }
                   }else{
                       action.goTo("displayFARS_1")
                   }
                    
                }else{
                    // getRefrencedId(userPrereqId)
                    logger.debug("got Transaction Record")
                    // getUserIdentity();

                    logger.debug("going to ")
                    nodeState.putShared("transcationRecord",transcationRecord)
                    if(transcationRecord.status === "1"){
                        logger.debug("KYID.2B1.Journey.IDProofing.FARS.GetContext prereqStatus "+nodeState.get("userPrereqStatus"))
                        if(nodeState.get("flow")==="helpdesk"){
                            //if(nodeState.get("userPrereqStatus")==="REVERIFY" || nodeState.get("prereqStatus")==="REVERIFY" || nodeState.get("prereqStatus")==="PENDING" ){
                                action.goTo("helpdeskFars")
                            //}   
                        }else{
                            if(nodeState.get("userPrereqStatus")==="REVERIFY" || nodeState.get("prereqStatus")==="REVERIFY"){
                                action.goTo("displayFARS_1")
                            }else{
                                if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                                     action.goTo("displayFARS_2")
                                }else{
                                    action.goTo("displayFARS_2_Experian")
                                }
                                
                            }
                        }
                    }else{
                        action.goTo("success")
                    }
                } 
            }else if(nodeState.get("userPrereqStatus")==="REVERIFY" || nodeState.get("prereqStatus")==="REVERIFY"){
                action.goTo("displayFARS_1")
            }else {
                 action.goTo("displayFARS_2_Experian")
            }
        // }
        // else if(nodeState.get("appEnrollRIDPMethod") === "LexisNexis"){
            
        // } 
    }
    else{
        action.goTo("error")
    }
} catch (error) {
    logger.error("Error Occurred KYID.2B1.Journey.IDProofing.FARS.GetContext")
}


function getRefrencedId(userPrereqId) {
    try {
        //KYID Remote Identity Proofing Request
        
        // var response =  openidm.query("managed/alpha_kyid_remote_identity_proofing_request/", { "_queryFilter": 'userPrerequisiteId/_refResourceId eq "' + userPrereqId + '"' }, ["*"]);
        var response =  openidm.query("managed/alpha_kyid_remote_identity_proofing_request/", { "_queryFilter": 'userPrerequisite eq "' + userPrereqId + '"' }, ["*"]);
        logger.debug("alpha_kyid_remote_identity_proofing_request  getRefrencedId --> "+response )
        if(response.resultCount>0){
            nodeState.putShared("transaction_Id",response.result[0]._id)
            nodeState.putShared("refId",response.result[0].referenceId)
            var userInfoJSON = null
            if(response.result[0].userRequest){
                userInfoJSON = JSON.parse(response.result[0].userRequest)
                //nodeState.putShared("userInfoJSON",userInfoJSON)
                
                if (userInfoJSON.givenName) {
                    userInfoJSON["givenName"]=userInfoJSON.givenName
                    nodeState.putShared("orig_givenName", userInfoJSON.givenName);
                    nodeState.putShared("givenName", userInfoJSON.givenName);
                }else{
                     userInfoJSON["givenName"]= ""
                    nodeState.putShared("orig_givenName", "");
                    nodeState.putShared("givenName", "");
                }
                
                if (userInfoJSON.middleName) {
                    userInfoJSON["middleName"]=userInfoJSON.middleName
                    nodeState.putShared("orig_custom_middleName", userInfoJSON.middleName);
                        nodeState.putShared("middleName", userInfoJSON.middleName);
                }else{
                     userInfoJSON["middleName"]= ""
                    nodeState.putShared("orig_custom_middleName", "");
                    nodeState.putShared("middleName", "");
                }
                
                if (userInfoJSON.sn) {
                    userInfoJSON["sn"]=userInfoJSON.sn
                    nodeState.putShared("orig_sn", userInfoJSON.sn);
                    nodeState.putShared("sn", userInfoJSON.sn);
                }else{
                     userInfoJSON["sn"]= ""
                    nodeState.putShared("sn", "");
                    nodeState.putShared("sn", "");
                }

                
                if (userInfoJSON.suffix) {
                    userInfoJSON["suffix"]=userInfoJSON.suffix
                    nodeState.putShared("orig_custom_suffix", userInfoJSON.suffix);
                    nodeState.putShared("custom_suffix", userInfoJSON.suffix);
                }else{
                     userInfoJSON["suffix"]= ""
                    nodeState.putShared("orig_custom_suffix", "");
                    nodeState.putShared("custom_suffix", "");
                }
                
                if (userInfoJSON.gender) {
                    userInfoJSON["gender"]=userInfoJSON.gender
                    nodeState.putShared("orig_custom_gender", userInfoJSON.gender);
                    nodeState.putShared("custom_gender", userInfoJSON.gender);
                }else{
                     userInfoJSON["gender"]= ""
                    nodeState.putShared("orig_custom_gender", "");
                    nodeState.putShared("custom_gender", "");
                }
                
                if (userInfoJSON.dob) {
                    userInfoJSON["dob"]=userInfoJSON.dob
                    nodeState.putShared("orig_custom_dateofBirth", userInfoJSON.dob);
                    nodeState.putShared("custom_dateofBirth", userInfoJSON.dob);
                }else{
                     userInfoJSON["dob"]= ""
                    nodeState.putShared("orig_custom_dateofBirth", "");
                    nodeState.putShared("custom_dateofBirth", "");
                }

                if (userInfoJSON.isHomeless) {
                    userInfoJSON["isHomeless"]=userInfoJSON.isHomeless.toString()
                    nodeState.putShared("isHomeless", (userInfoJSON.isHomeless.toString()));
                }else{
                     userInfoJSON["isHomeless"]= ""
                    nodeState.putShared("isHomeless", "");
                }
                
                if (userInfoJSON.postalAddress) {
                    userInfoJSON["postalAddress"]=userInfoJSON.postalAddress
                    nodeState.putShared("orig_postalAddress", userInfoJSON.postalAddress);
                    nodeState.putShared("postalAddress", userInfoJSON.postalAddress);
                }else{
                     userInfoJSON["postalAddress"]= ""
                    nodeState.putShared("orig_postalAddress", "");
                    nodeState.putShared("orig_postalAddress", "");
                }

                
                if (userInfoJSON.postalAddress2) {
                    userInfoJSON["postalAddress2"]=userInfoJSON.postalAddress2
                    nodeState.putShared("orig_custom_postalAddress2", userInfoJSON.postalAddress2);
                    nodeState.putShared("postalAddress2", userInfoJSON.postalAddress2);
                }else{
                     userInfoJSON["postalAddress2"]= ""
                    nodeState.putShared("orig_custom_postalAddress2", "");
                    nodeState.putShared("postalAddress2", "");
                }
                
                if (userInfoJSON.city) {
                    userInfoJSON["city"]=userInfoJSON.city
                    nodeState.putShared("orig_city", userInfoJSON.city);
                    nodeState.putShared("city", userInfoJSON.city);
                }else{
                     userInfoJSON["city"]= ""
                    nodeState.putShared("orig_city", "");
                    nodeState.putShared("city", "");
                }
                
                if (userInfoJSON.stateProvince) {
                    userInfoJSON["stateProvince"]=userInfoJSON.stateProvince
                    nodeState.putShared("orig_stateProvince", userInfoJSON.stateProvince);
                    nodeState.putShared("stateProvince", userInfoJSON.stateProvince);
                }else{
                     userInfoJSON["stateProvince"]= ""
                    nodeState.putShared("orig_stateProvince", "");
                    nodeState.putShared("stateProvince", "");
                }

                
                if (userInfoJSON.postalCode) {
                    userInfoJSON["postalCode"]=userInfoJSON.postalCode
                    nodeState.putShared("orig_postalCode", userInfoJSON.postalCode);
                    nodeState.putShared("postalCode", userInfoJSON.postalCode);
                }else{
                    userInfoJSON["postalCode"]= ""
                    nodeState.putShared("orig_postalCode", "");
                    nodeState.putShared("postalCode", "");
                }
                
                
                if (userInfoJSON.postalExtension) {
                    userInfoJSON["postalExtension"]=userInfoJSON.postalExtension
                    nodeState.putShared("postalExtension", userInfoJSON.postalExtension);
                }else{
                     userInfoJSON["postalExtension"]= ""
                    nodeState.putShared("postalExtension", "");
                }
                
                if (userInfoJSON.county) {
                    userInfoJSON["county"]=userInfoJSON.county
                    nodeState.putShared("orig_custom_county", userInfoJSON.county);
                    nodeState.putShared("custom_county", userInfoJSON.county);
                }else{
                     userInfoJSON["county"]= ""
                    nodeState.putShared("orig_custom_county", "");
                    nodeState.putShared("custom_county", "");
                }

                if(userInfoJSON.telephoneNumber){
                userInfoJSON["telephoneNumber"]=userInfoJSON.telephoneNumber
                userInfoJSON["mobileNumber"] = userInfoJSON.telephoneNumber
                nodeState.putShared("orig_telephoneNumber",userInfoJSON.telephoneNumber)
                nodeState.putShared("telephoneNumber",userInfoJSON.telephoneNumber)
                }


                if(userInfoJSON.country){
                    userInfoJSON["country"]=userInfoJSON.country
                    nodeState.putShared("orig_custom_country",userInfoJSON.country)
                    nodeState.putShared("country",userInfoJSON.country)
                }else{
                    userInfoJSON["country"]= ""
                    nodeState.putShared("country", "");
                    nodeState.putShared("orig_custom_country", "");
                }
                
            }
            nodeState.putShared("userInfoJSON",userInfoJSON)
            return response.result[0]
        }
        return null
        
    } catch (error) {
        logger.error("Error Occurred while executing getRefrencedId function"+ error)
    }
    
}

function getUserIdentity() {
    try {
        var response =  openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": 'account/_refResourceId eq "' + nodeState.get("UserId") + '"' }, ["*"]);
        logger.debug("getUserIdentity Resposne is --> response"+response)
        if(response && response.resultCount>0){
            nodeState.putShared("userIdentityRecord",response.result[0])
            nodeState.putShared("patchUserId",response.result[0]._id)

             //    var userInfoJSON = {
            	// }
            
             //    if (response.result[0].givenName) {
             //        userInfoJSON["givenName"]=response.result[0].givenName
             //        nodeState.putShared("orig_givenName", response.result[0].givenName);
             //    }
             //    if (response.result[0].middileName) {
             //        userInfoJSON["givenName"]=response.result[0].givenName
             //        nodeState.putShared("orig_custom_middleName", response.result[0].middileName);
             //    }
             //    if (response.result[0].sn) {
             //        nodeState.putShared("orig_sn", response.result[0].sn);
             //    }
             //    if (response.result[0].suffix) {
             //        nodeState.putShared("orig_custom_suffix", response.result[0].suffix);
             //    }
             //    if (response.result[0].gender) {
             //        nodeState.putShared("orig_custom_gender", response.result[0].gender);
             //    }
             //    if (response.result[0].dob) {
             //        nodeState.putShared("orig_custom_dateofBirth", response.result[0].dob);
             //    }
             //    if (response.result[0].addressLine1) {
             //        nodeState.putShared("orig_postalAddress", response.result[0].addressLine1);
             //    }
             //    if (response.result[0].addressLine2) {
             //        nodeState.putShared("orig_custom_postalAddress2", response.result[0].addressLine2);
             //    }
             //    if (response.result[0].city) {
             //        nodeState.putShared("orig_city", response.result[0].city);
             //    }
             //    if (response.result[0].stateCode) {
             //        nodeState.putShared("orig_stateProvince", response.result[0].stateCode);
             //    }
             //    if (response.result[0].zip) {
             //        nodeState.putShared("orig_postalCode", response.result[0].zip);
             //    }
             //    if (response.result[0].postalExtension) {
             //        nodeState.putShared("postalExtension", response.result[0].postalExtension);
             //    }
             //    if (response.result[0].countyCode) {
             //        nodeState.putShared("orig_custom_county", response.result[0].countyCode);
             //    }
            var userInfoJSON = {}
                if (response.result[0].givenName) {
                    userInfoJSON["givenName"]=response.result[0].givenName
                    nodeState.putShared("orig_givenName", response.result[0].givenName);
                }
                if (response.result[0].middileName) {
                    userInfoJSON["middleName"]=response.result[0].middleName
                    nodeState.putShared("orig_custom_middleName", response.result[0].middileName);
                }
                if (response.result[0].sn) {
                    userInfoJSON["sn"]=response.result[0].sn
                    nodeState.putShared("orig_sn", response.result[0].sn);
                }
                if (response.result[0].suffix) {
                    userInfoJSON["suffix"]=response.result[0].suffix
                    nodeState.putShared("orig_custom_suffix", response.result[0].suffix);
                }
                if (response.result[0].gender) {
                    userInfoJSON["gender"]=response.result[0].gender
                    nodeState.putShared("orig_custom_gender", response.result[0].gender);
                }
                if (response.result[0].dob) {
                    userInfoJSON["dob"]=response.result[0].dob
                    nodeState.putShared("orig_custom_dateofBirth", response.result[0].dob);
                }
                if (response.result[0].addressLine1) {
                    userInfoJSON["postalAddress"]=response.result[0].addressLine1
                    nodeState.putShared("orig_postalAddress", response.result[0].addressLine1);
                }
                if (response.result[0].addressLine2) {
                    userInfoJSON["postalAddress2"]=response.result[0].addressLine2
                    nodeState.putShared("orig_custom_postalAddress2", response.result[0].addressLine2);
                }
                if (response.result[0].city) {
                    userInfoJSON["city"]=response.result[0].city
                    nodeState.putShared("orig_city", response.result[0].city);
                }
                if (response.result[0].stateCode) {
                    userInfoJSON["stateProvince"]=response.result[0].stateCode
                    nodeState.putShared("orig_stateProvince", response.result[0].stateCode);
                }
                if (response.result[0].zip) {
                    userInfoJSON["postalCode"]=response.result[0].zip
                    nodeState.putShared("orig_postalCode", response.result[0].zip);
                }
                if (response.result[0].postalExtension) {
                    userInfoJSON["postalExtension"]=response.result[0].postalExtension
                    nodeState.putShared("postalExtension", response.result[0].postalExtension);
                }
                if (response.result[0].countyCode) {
                    userInfoJSON["county"]=response.result[0].countyCode
                    nodeState.putShared("orig_custom_county", response.result[0].countyCode);
                } 
            nodeState.putShared("userInfoJSON",userInfoJSON)
            return response.result[0]
        }
        else{
            return null
        }        
    } catch (error) {
        logger.error("KYID.2B1.Journey.IDProofing.FARS.GetContext --> getUserIdentity "+error)
        
    }
    
}
// function getHelpDeskId() {
//     try {
//         // var response =  openidm.query("managed/alpha_role/", { "_queryFilter": 'application/_refResourceId eq "' + nodeState.get("UserId") + '"' }, ["*"]);
//         var response = openidm.read("managed/alpha_role/"+nodeState.get("userPrereqRoleId"), null, ["*", "businessAppId/*"]);
//         logger.debug("KYID.2B1.Journey.IDProofing.FARS.GetContext Role Info --> "+response)
//         if(response.businessAppId ){
//             nodeState.putShared("businessAppId",response.businessAppId._id)
//             getBusinessAppDetails()
//             if(response.businessAppId.applicationHelpdeskContact){
//                 return response.businessAppId.applicationHelpdeskContact
//             }
//             else{
//                 return null
//             }

//         }
//         else{
//             return null
//         }        
//     } catch (error) {
//         logger.error("KYID.2B1.Journey.IDProofing.FARS.GetContext --> getHelpDeskId "+error)
        
//     }
    
// }

function getHelpDeskId(appId) {
    try {
        // var response =  openidm.query("managed/alpha_role/", { "_queryFilter": 'application/_refResourceId eq "' + nodeState.get("UserId") + '"' }, ["*"]);
        var response = openidm.read("managed/alpha_role/"+nodeState.get("userPrereqRoleId"), null, ["*", "businessAppId/*"]);
        logger.debug("KYID.2B1.Journey.IDProofing.FARS.GetContext Role Info --> "+response)
        if(response.businessAppId ){
            nodeState.putShared("businessAppId",null)
            getBusinessAppDetails(appId)
            if(response.businessAppId.applicationHelpdeskContact){
                return response.businessAppId.applicationHelpdeskContact
            }
            else{
                return null
            }

        }
        else{
            return null
        }        
    } catch (error) {
        logger.error("KYID.2B1.Journey.IDProofing.FARS.GetContext --> getHelpDeskId "+error)
        
    }
    
}

function getBusinessAppDetails(appId) {
    try {
        var response1 = openidm.read("managed/alpha_kyid_businessapplication/"+appId, null, ["*"]);
        logger.debug("alpha_kyid_businessapplication response1 "+response1)
        var helpdeskContact = response1.applicationHelpdeskContact && response1.applicationHelpdeskContact._refResourceId ? response1.applicationHelpdeskContact._refResourceId : null 
        nodeState.putShared("helpdeskContact",helpdeskContact)
        // var response2 = openidm.read("managed/alpha_kyid_helpdeskcontact/"+response1.applicationHelpdeskContact._refResourceId, null, ["*"]);
        // logger.debug("alpha_kyid_helpdeskcontact response2 "+response2)
        // nodeState.putShared("helpdeskContact",response2)
        // if(response1){
            
        // }
        return response1
        
    } catch (error) {
        logger.error("KYID.2B1.Journey.IDProofing.FARS.GetContext --> getHelpDeskId "+error)
        
    }
    
}

function getDocuments(appId) {
    try {
          var response =  openidm.query("managed/alpha_kyid_identity_verification_documents/", { "_queryFilter": `requiredForApplicationIds/_refResourceId eq '${appId}' ` }, ["*"]);
        logger.debug("Document Response is "+response)
        logger.debug("Business App ID "+ appId)
        if(response && response.resultCount>0){
              logger.debug("getDocuments is --> "+ response)
            var documents = []
            var docJSON = {
                displayName : "",
                displayDescription:""
            }
            response.result.forEach(val=>{
                 docJSON = {
                displayName : "",
                displayDescription:""
                 }
                docJSON.displayName = val.displayName || ""
                docJSON.displayDescription = val.displayDescription || ""
                documents.push(docJSON)
            })
              // nodeState.putShared("documents",response.result[0])
            // nodeState.putShared("documents",response.result[0])
            nodeState.putShared("documents",documents)
              return response.result[0]
          }
        
    } catch (error) {
        logger.error("KYID.2B1.Journey.IDProofing.FARS.GetContext --> getDocuments"+error)
    }
  
    
}

