/**
 * @name [@endpointname]
 * @description [@description]
 * 
 * @param {request} request - The request object contains the following - 
 *      resourceName - The name of the resource, without the endpoint/ prefix.
 *      newResourceId - The identifier of the new object, available as the results of a create request.
 *      revision - The revision of the object.
 *      parameters - Any additional parameters provided in the request. The sample code returns request parameters from an HTTP GET with ?param=x, as "parameters":{"param":"x"}.
 *      content - Content based on the latest revision of the object, using getObject.
 *      context - The context of the request, including headers and security. For more information, refer to Request context chain.
 *      Paging parameters - The pagedResultsCookie, pagedResultsOffset, and pageSize parameters are specific to query methods. For more information refer to Page Query Results.
 *      Query parameters - The queryId and queryFilter parameters are specific to query methods. For more information refer to Construct Queries.
 *
 * @date  [@date]
 * @author ampatil@deloitte.com
 */

(function () {
    logger.error("xiaohan debug point invitation: start")
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-UNR",
        content:"An unexpected error occured while processing the request."
    }

    const EXCEPTION_UNSUPPORTED_OPERATION = {
        code:"KYID-USO",
        content:""
    }
  
    const SUCCESS_MESSAGE = {
      code:"KYID-SUS",
      content: "Success"
    }

    

    const RESPONSE_CODE_ERROR = "2"
    const RESPONSE_CODE_FAILURE = "1"
    const RESPONSE_CODE_SUCCESS = "0"

    const REQUEST_POST = "create"
    const REQUEST_GET = "read"
    const REQUEST_UPDATE = "update"
    const REQUEST_PATCH = "patch"
    const REQUEST_DELETE = "delete"
    
    const ACTION_INVITE = "1"
    const ACTION_PATCH = "2"
    const ACTION_DELETE = "3"
    const ACTION_SEARCH = "4"
    const ACTION_RESEND = "5"
    const ACTION_MOCK = "10" //MOCK

    const ENDPOINT_NAME = "endpoint/invitation"
    const MO_OBJECT_NAME = "managed/alpha_kyid_enrollment_contextId/"


    const transactionIdauditLogger = context.current.parent.parent.parent.parent.parent.parent.transactionId.value || ""
    const sessionRefIDauditLogger = context.current.parent.parent.parent.parent.parent.rawInfo.sessionRefId || ""
    const sessionDetailsauditLogger = context.current.parent.parent.parent.parent.parent.parent.parent.parent.parent.parent.parent.parent || ""
    
    /* Object properties */
    const OBJECT_PROPERTIES = {
        
        "appIdentifier": null,
        "userIdentifier": null,
        "roleIdentifier": null,
        
        "app": null,
        "user": null,
        "role": null,
        
        "originalDelegatorIdentifier": null,
        "currentDelegatorIdentifier": null,
        "currentDelegator": null,
        "originalDelegator": null,
        "isForwardDelegable": false,
        
        "assignmentDate": null,
        "assignmentDateEpoch": null,
        
        "recordState": "0",
        "recordSource": "1",
        "createDate": null,
        "createDateEpoch": null,
        "updateDate": null,
        "updateDateEpoch": null,
        "createdBy": null,
        "updatedBy": null,
    }

    /* Input */
    const input = {
        "_ENDPOINT_NAME":ENDPOINT_NAME,
        "_MO_OBJECT_NAME":MO_OBJECT_NAME,
        "_PROPERTIES":OBJECT_PROPERTIES,
        "transactionId":"349834038398340",
         "auditLogger": {
          transactionIdauditLogger: transactionIdauditLogger,
          sessionRefIDauditLogger: sessionRefIDauditLogger,
          sessionDetailsauditLogger: sessionDetailsauditLogger
        },
        
        "payload":{}
    }

    let response = null

    try {
      const requestContent = getRequestContent(context, request, ENDPOINT_NAME)
      let searchResponse = null;
     var authenticatedUserId = context.security && context.security.authorization && context.security.authorization.id;
      //var authenticatedUserId = "e84e33b0-e127-4df0-99fe-b9d01300bcbf";
        logger.error("the user id invitation_draftV3 : "+authenticatedUserId)
        logger.error("xiaohan debug point invitation context: " + context.current)
      let result
        switch (request.method) {
        
            case REQUEST_POST:
                /* Get request content */
                
                const action = requestContent.action
            
                /* Create action */
                if(action == ACTION_INVITE){
                    input.payload = requestContent.payload
                 // input.payload.userid = authenticatedUserId;
                  input.payload.requesterAccountId = authenticatedUserId;
                    /* Create access record. */

                  result = sendInvitationAPI(input)
                  logger.error("xiaohan debug point invitation 2: send invitation completed")
                  response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                        result: result
                    })
                }else if(action == ACTION_SEARCH){
                  logger.error("action is search")
                    input.payload = requestContent.payload
                  input.payload.userid = authenticatedUserId;
                    /* Search access records. */
                   let view = null
                    if(input.payload.view){
                      view =input.payload.view
                      logger.error("line 133")
                    }
                      if(view.toLowerCase() === "helpdeskactiveinvitation"){
                      searchResponse = searchInvitationQuery(input);
                      input.searchResponse = searchResponse;
                      result = searchHelpDeskActiveInvitation(input);
                      
                    }
                    else if(view.toLowerCase() === "delegationmanageinvitation"){
                      result = searchDelManageInvitation(input)
                    }
                    else if(view.toLowerCase() === "delegationActiveInvitation"){
                      searchResponse = searchInvitationQuery(input);
                      input.searchResponse = searchResponse;
                      result = searchDelManageInvitation(input)
                    }
                      else if(view.toLowerCase() === "helpdeskactiveinvitationbyuser"){
                      searchResponse = searchInvitationQuery(input);
                      input.searchResponse = searchResponse;
                      result = helpdeskactiveinvitationbyUser(input)
                    } else if(view.toLowerCase() === "helpdeskmanageinvitationbyapp"){
                      searchResponse = searchInvitationQuery(input);
                      input.searchResponse = searchResponse;
                      result = helpdeskmanageinvitationbyapp(input)
                    } else if(view.toLowerCase() === "delegationactiveinvitationbyuser"){
                      searchResponse = searchInvitationQuery(input);
                      input.searchResponse = searchResponse;
                      result = delegationactiveinvitationbyuser(input)
                    } else if(view.toLowerCase() === "delegationmanageinvitationbydelegator"){
                      searchResponse = searchInvitationQuery(input);
                      input.searchResponse = searchResponse;
                      result = delegationmanageinvitationbydelegator(input)
                    } else if(view.toLowerCase() === "searchrole"){
                       result = searchRole(input);
                    }
                  else{
                    result = searchInvitationQuery(input)
                  }
                     
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                        result: result
                    })
                }else if(action == ACTION_DELETE){
                    input.payload = requestContent.payload
                    /* Search access records. */
                    response = searchAccess(input)
                }else if(action == ACTION_RESEND){
                  input.payload = requestContent.payload
                  
                  result =resendInvitation(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                        result: result
                    })
                  
                }else if(action == ACTION_PATCH){
                  input.payload = requestContent.payload
                  input.payload.requesterAccountId = authenticatedUserId
                  result =cancelInvite(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                        result: result
                    })
                  
                }else if(action == ACTION_MOCK){
                    result = generateMockResponse()
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                        result: result
                    })
                }
                break;
            case REQUEST_GET:
                 /* Get Invitation By ID */
                input["payload"] = requestContent
                 result = getInvitation(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                        result: result
                    })
                
            
                break;
            case REQUEST_UPDATE:
                
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "update" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break;
            case REQUEST_PATCH:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "patch" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break;
            case REQUEST_DELETE:
                
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "delete" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break;
        
            default:
                break;
        }
      logger.error("xiaohan debug point invitation 3: main function completed")
        return response
      logger.error("xiaohan debug point invitation 4: main function completed")
    }catch(error){

        logException(error)

      if(error && error.code){
            /* generate error response */
            return generateResponse(error.code,input.transactionId, error.message)
        }else{
            return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNEXPECTED_ERROR)
        }
      
    }
    
}())

//Mock Response 

function generateMockResponse(){
  try {
    const mockJSON = {
      "invitations": [
		{
			"invitationId": "INV12345",
			"applicationName": {
				"en": "Test Application",
				"es": "Test Application"
			},
			"applicationLogo": "https://example.com/logo12345.png",
			"status": {
				"en": "Active",
				"es": "Activo"
			},
			"action": {
				"en": "Accept",
				"es": "Aceptar"
			},
			"invitedBy": "johndoe@mail.com",
			"invitationDate": "2025-08-01",
			"invitationExpiryDate": "2025-08-15",
			"roles": [
				{
					"roleName": {
						"en": "Administrator",
						"es": "Administrador"
					},
					"tag": {
						"en": "Active",
						"es": "Activo"
					}
				},
				{
					"roleName": {
						"en": "Viewer",
						"es": "Espectador"
					},
					"tag": {
						"en": "Accept",
						"es": "Aceptar"
					}
				}
			]
		},
		{
			"invitationId": "INV67890",
			"applicationName": {
				"en": "Test Application",
				"es": "Test Application"
			},
			"applicationLogo": "https://example.com/logo67890.png",
			"status": {
				"en": "Active",
				"es": "Activo"
			},
			"action": {
				"en": "Accept",
				"es": "Aceptar"
			},
			"invitedBy": "johndoe@mail.com",
			"invitationDate": "2025-07-20",
			"invitationExpiryDate": "2025-08-05",
			"roles": [
				{
					"roleName": {
						"en": "Editor",
						"es": "Editor"
					},
					"tag": {
						"en": "Active",
						"es": "Activo"
					}
				}
			]
		},
		{
			"invitationId": "INV54321",
			"applicationName": {
				"en": "Test Application",
				"es": "Test Application"
			},
			"applicationLogo": "https://example.com/logo54321.png",
			"status": {
				"en": "Active",
				"es": "Activo"
			},
			"action": {
				"en": "Accept",
				"es": "Aceptar"
			},
			"invitedBy": "johndoe@mail.com",
			"invitationDate": "2025-06-15",
			"invitationExpiryDate": "2025-07-01",
			"roles": [
				{
					"roleName": {
						"en": "Contributor",
						"es": "Colaborador"
					},
					"tag": {
						"en": "Inactive",
						"es": "Inactivo"
					}
				}
			]
		}
	]
    }
    return mockJSON
    
  } catch (error) {
            /* Throw unexpected exception. */
    unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
    unexpectedException.timestamp = new Date().toISOString()

    throw unexpectedException
    
  }
}


/**
 * @name searchRole
 * @description Method searches role. 
 * 
 * @param {JSON} input 
 * @returns {JSON} response
 */
function searchRole(input){
 var roleId = input.payload.roleId;

    if (!roleId) {
        return { error: "Missing role ID (roleId) parameter." };
    }

    // Query the alpha_role managed object
    var role = openidm.read("managed/alpha_role/" + roleId);

    if (!role) {
        return { error: "Role not found for ID: " + roleId };
    }

    var roleNames = {};
    var roleDescriptions = {};
    if (role.content && role.content.length > 0) {
        var contentObj = role.content[0];
        if (contentObj.name) {
            for (var lang in contentObj.name) {
                if (contentObj.name.hasOwnProperty(lang)) {
                    roleNames[lang] = contentObj.name[lang];
                }
            }
        }
        if (contentObj.description) {
            for (var lang2 in contentObj.description) {
                if (contentObj.description.hasOwnProperty(lang2)) {
                    roleDescriptions[lang2] = contentObj.description[lang2];
                }
            }
        }
    }
    // Fallbacks if no localization found
    if (Object.keys(roleNames).length === 0 && role.name) {
        roleNames = {
                      en: role.name,
                      es: role.name
        };
    }
    if (Object.keys(roleDescriptions).length === 0 && role.description) {
        roleDescriptions = {
                      en: role.description,
                      es: role.description
        };
    }

    // Get business application details
    var businessApp = null;
    if (role.businessAppId && role.businessAppId._refResourceId) {
        businessApp = openidm.read("managed/alpha_kyid_businessapplication/" + role.businessAppId._refResourceId);
    }
    
    var tagNames = [];
    var tagQuery = "";
    if (role.tags && role.tags.length > 0) {
        var tagIds = [];
        for (var i = 0; i < role.tags.length; i++) {
            var tagRef = role.tags[i];
            if (tagRef._refResourceId) {
                tagIds.push("'" + tagRef._refResourceId + "'");
            }
        }
        if (tagIds.length > 0) {
            
            if (tagIds.length === 1) {
                tagQuery = "_id eq " + tagIds[0];
            } else if (tagIds.length > 1) {
                var orParts = [];
                for (var i = 0; i < tagIds.length; i++) {
                    orParts.push("_id eq " + tagIds[i]);
                }
                tagQuery = orParts.join(" or ");
            } else {
                // No tags to query
                tagQuery = 'false'; // Will return no results
            }
            
            var tagResults = openidm.query("managed/alpha_kyid_tag", {
                "_queryFilter": tagQuery
            });
            if (tagResults && tagResults.result) {
         
                for (var j = 0; j < tagResults.result.length; j++) {
                    var tagObj = tagResults.result[j];
                    // If tagObj.name is localized (object), use as is; else, wrap as default
                    if (tagObj.name) { 
                        tagNames.push({
                                  displayName: {
                                      en: tagObj.name,
                                      es: tagObj.name
                                  }
                              });
                        //tagNames.push(tagObj.name);
                    }
                }
            }
        }
    }

    // Get access policy details
    var accessPolicy = null;
    if (role.accessPolicy && role.accessPolicy._refResourceId) {
        accessPolicy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + role.accessPolicy._refResourceId);
    }

    // Get prerequisites from access policy
    var prerequisites = [];
    var prereqIds = [];
    if (accessPolicy && accessPolicy.preRequisites && accessPolicy.preRequisites.length > 0) {
      
        for (var i = 0; i < accessPolicy.preRequisites.length; i++) {
            var prereqRef = accessPolicy.preRequisites[i];
            if (prereqRef._refResourceId) {
                 prereqIds.push("'" + prereqRef._refResourceId + "'");
            }
        }
        var prereqQuery = "";
        if (prereqIds.length === 1) {
            prereqQuery = "_id eq " + prereqIds[0];
        } else if (prereqIds.length > 1) {
            var orParts = [];
            for (var i = 0; i < prereqIds.length; i++) {
                orParts.push("_id eq " + prereqIds[i]);
            }
            prereqQuery = orParts.join(" or ");
        } else {
            prereqQuery = 'false'; // No prerequisites to query
        }
       
        var prereqResults = openidm.query("managed/alpha_kyid_enrollment_prerequisite", {
                "_queryFilter": prereqQuery
            });
      
        if (prereqResults && prereqResults.result) {
         
            for (var j = 0; j < prereqResults.result.length; j++) {
            var prereq = prereqResults.result[j];
            if (prereq) {
               var displayNameObj = {};
               var displayDescObj = {};
               if (prereq.displayName) {
                    for (var lang3 in prereq.displayName) {
                        if (prereq.displayName.hasOwnProperty(lang3) && prereq.displayName[lang3]) {
                             displayNameObj[lang3] = prereq.displayName[lang3];
                        }
                    }
                }
           
            if (prereq.displayDescription) {
                for (var lang4 in prereq.displayDescription) {
                    if (prereq.displayDescription.hasOwnProperty(lang4) && prereq.displayDescription[lang4]) {
                         displayDescObj[lang4] = prereq.displayDescription[lang4];
                    }
                }
            }
            
                prerequisites.push({
                    name: prereq.name,
                    description: prereq.description,
                    displayName: displayNameObj,
                    displayDescription: displayDescObj
                });
            }
          }
        }
    }

     var roleDetails = {
        roleDisplayName: roleNames,
        roleDisplayDescription: roleDescriptions,
        tagNames: tagNames,
        businessAppName: businessApp ? businessApp.name : null,
        associatedPreReqs: prerequisites,
        isDelegable: role.isDelegable,
        isForwardDelegable: role.isForwardDelegable
    };

    // Build response object
    var response = {
        "data": roleDetails
    }
   

    return response;


}

/**
 * @name searchInvitationQuery
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function searchInvitationQuery(input){
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-IRE",
        content: ""
    }
    
    const invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp":""
    }
    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp":""
    }

    try{
        logDebug(input.transactionId,input.endPoint,"searchAccount",`Input parameter: ${JSON.stringify(input.payload)}`)
      logger.error("the searchInvitationQuery: "+ JSON.stringify(input.payload))
        /* Check if  */
        if(input.payload){
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter

          if(queryFilter){
             logger.error("the searchInvitationQuery: "+ JSON.stringify(queryFilter))
    logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
    const searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`, 
        {
            "_queryFilter": queryFilter
        },
        returnProperties
    )
    if(searchResponse){
        logDebug(input.transactionId,input.endPoint,"searchAccount",`Raw search response: ${JSON.stringify(searchResponse)}`)
        return searchResponse
    } else {
        return []
    }
}else{
                
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
                invalidRequestException.timestamp = new Date().toISOString()
               
                throw invalidRequestException
            }
            
        }else{
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
            invalidRequestException.timestamp = new Date().toISOString()
            
            throw invalidRequestException
        }
    }catch(error){
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
    }
    
}

function helpdeskactiveinvitationbyUser(input) {
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    try {
        if (input.payload && input._MO_OBJECT_NAME && input.searchResponse) {
          logger.error("going inside helpdeskactiveinvitationbyUser")
            const searchResponse = input.searchResponse;
            const invitations = [];

            if (searchResponse && searchResponse.result) {
              logger.error("going inside searchResponse helpdeskactiveinvitationbyUser")
                searchResponse.result.forEach(function (entry) {
                    entry.applicationRoles.forEach(function (role) {
                        var appId = role.applicationId;

                       if(entry.status === "ACTIVE" || entry.status === "0"){
                                    var statusEn = null;
                                    var statusEs = null;
                                    if (entry.status === "ACTIVE" || entry.status === "0") {
                                        statusEn = "Active";
                                        statusEs = "Activo";
                                    } 
                        //             else {
                        //                 statusEn = "Pending";
                        //                 statusEs = "Pendiente";
                        //             }
                        // }
                      
                        var invitation = {
                            invitationId: entry._id,
                            applicationLogo: null,
                            applicationName: null,
                            status: {
                                        en: statusEn,
                                        es: statusEs
                                    },
                            invitedBy: null,
                            invitationDate: entry.createDate ? entry.createDate.split("T")[0] : null,
                            invitationExpiryDate: entry.expiryDate ? entry.expiryDate.split("T")[0] : null,
                            roles: []
                        };


                        // Fetch invitedBy info
                        if (entry.requesterUserAccountId) {
                            var inviter = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                            if (inviter) {
                                var fullName = [];
                                if (inviter.givenName) {
                                  fullName.push(inviter.givenName);
                                }
                                if (inviter.sn) {
                                  fullName.push(inviter.sn);
                                }
                                invitation.invitedBy = fullName.join(" ");
                            }
                        }

                        // Fetch app info
                        var appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                        if (appInfo) {
                            if (appInfo.logoFileName) {
                              invitation.applicationLogo = appInfo.logoFileName;
                            }
                            if (appInfo.name) {
                                invitation.applicationName = appInfo.name;
                                
                            }
                        }

                        // Fetch role info
                        var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                        if (roleInfo) {
                            var roleEntry = {
                                roleId: role.roleId,
                                roleName: { en: null, es: null },
                                tagName: { en: null, es: null }
                            };

                            if (roleInfo.content && roleInfo.content.length > 0 && roleInfo.content[0].name) {
                                roleEntry.roleName.en = roleInfo.content[0].name.en || null;
                                roleEntry.roleName.es = roleInfo.content[0].name.es || null;
                            }

                            // Fetch tag info
                            if (roleInfo.tags && roleInfo.tags.length > 0) {
                                var tagRef = roleInfo.tags[0];
                                if (tagRef && tagRef._refResourceId) {
                                    var tagInfo = getMORecord(tagRef._refResourceId, ["*"], "alpha_kyid_tag");
                                    if (tagInfo && tagInfo.localizedContent && tagInfo.localizedContent.length > 0) {
                                        var localizedTag = tagInfo.localizedContent[0];
                                        if (localizedTag.displayTitle) {
                                            roleEntry.tagName.en = localizedTag.displayTitle.en || null;
                                            roleEntry.tagName.es = localizedTag.displayTitle.es || null;
                                        }
                                    }
                                }
                            }

                            invitation.roles.push(roleEntry);
                        }

                        invitations.push(invitation);
                       }
                    });
                });

                //return { data: { activeInvitations: invitations } };
              return { data: invitations };
            } else {
                //return { data: { activeInvitations: [] } };
               return { data: [] };
            }
        } else {
            invalidRequestException.message.content = "Missing required parameters.";
            invalidRequestException.timestamp = new Date().toISOString();
            throw invalidRequestException;
        }
    } catch (error) {
        unexpectedException.message.content = "Unexpected error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}


function helpdeskmanageinvitationbyapp(input) {
  logger.error("going inside helpdeskmanageinvitationbyapp")
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    try {
        if (input.payload && input._MO_OBJECT_NAME && input.searchResponse) {
           logger.error("going inside helpdeskmanageinvitationbyapp1")
            const searchResponse = input.searchResponse;
            const invitations = [];

            let appId = null;
            if (input.payload.queryFilter && typeof input.payload.queryFilter === "string") {
                const appIdMatch = input.payload.queryFilter.match(/applicationRoles\/\[applicationId eq "([^"]+)"\]/);
                if (appIdMatch && appIdMatch[1]) {
                    appId = appIdMatch[1];
                }
            }

            if (!appId) {
                invalidRequestException.message.content = 'Invalid request. Could not extract "appId" from queryFilter.';
                invalidRequestException.timestamp = new Date().toISOString();
                throw invalidRequestException;
            }

            if (searchResponse && searchResponse.result) {
              logger.error("the searchresponse in helpdeskmanageinvitationbyapp : "+JSON.stringify(searchResponse))
                searchResponse.result.forEach(entry => {

                   if (!entry.requestedUserAccountAttibutes || entry.requestedUserAccountAttibutes.length === 0) {
                      return;
                  }
                  
                    const fullName = [];
                    let firstName = "";
                    let lastName = "";
                    let email = "";

                    if (entry.requestedUserAccountId) {
                        const user = getMORecord(entry.requestedUserAccountId, ["*"], "alpha_user");
                        if (user) {
                            firstName = user.givenName || "";
                            lastName = user.sn || "";
                            email = user.mail || "";
                        }
                    }

                    let statusEn = "";
                    let statusEs = "";
                    if (entry.status === "ACTIVE" || entry.status === "0") {
                        statusEn = "Active";
                        statusEs = "Activo";
                    } else {
                       statusEn = "Expired";
                       statusEs = "Expirado";
                    }

                  const invitedByName = {
                      en: "",
                      es: ""
                  };
                  
                  if (entry.requesterUserAccountId) {
                      var inviter = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                      if (inviter) {
                          
                          if (inviter.givenName) {
                              fullName.push(inviter.givenName);
                          }
                          if (inviter.sn) {
                              fullName.push(inviter.sn);
                          }
                          const nameStr = fullName.join(" ");
                          invitedByName.en = nameStr;
                          invitedByName.es = nameStr;
                      }
                  }

                    const roles = [];
                    entry.applicationRoles.forEach(role => {
                        if (role.applicationId === appId) {
                            const roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                            const roleObj = {
                              role: { en: "", es: "" },
                              roleid: role.roleId ,
                              tag: [] // Role can have multiple tag
                          };

                            if (roleInfo &&roleInfo.content && Array.isArray(roleInfo.content) && roleInfo.content[0] && roleInfo.content[0].name){
                              roleObj.role.en = roleInfo.content[0].name.en || "";
                                roleObj.role.es = roleInfo.content[0].name.es || "";
                            }
                          
                          
                          
                            // Handle tags as relationship array
                            if (roleInfo && Array.isArray(roleInfo.tags)) {
                              
                                roleInfo.tags.forEach(tagRel => {
                                    if (tagRel && tagRel._refResourceId) {
                                      logger.error("the tag info:" + tagRel._refResourceId)
                                        const tagInfo = getMORecord(tagRel._refResourceId, ["*"], "alpha_kyid_tag");
                                       logger.error("the tag json info:" + JSON.stringify(tagInfo))
                                        if (
                                            tagInfo &&
                                            Array.isArray(tagInfo.localizedContent) &&
                                            tagInfo.localizedContent[0]
                                        ) {
                                          
                                            const displayTitle = tagInfo.localizedContent[0].displayTitle || {};
                                            const tagEntry = {
                                                en: displayTitle.en || "",
                                                es: displayTitle.es || ""
                                            };
                                            roleObj.tag.push(tagEntry);
                                        }
                                    }
                                });
                            }
                            
                            roles.push(roleObj);
                        }
                    });

                  var invitationDate = null;
                      if (entry.createDate && typeof entry.createDate === "string") {
                          invitationDate = entry.createDate.split("T")[0];
                      }
                      
                      var invitationExpiryDate = null;
                      if (entry.expiryDate && typeof entry.expiryDate === "string") {
                          invitationExpiryDate = entry.expiryDate.split("T")[0];
                      }

                    const invitationObj = {
                        id: entry.requestedUserAccountId,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        status: {
                            en: statusEn,
                            es: statusEs
                        },
                        invitationDetails: {
                              invitedBy: invitedByName,
                              invitationDate: invitationDate,
                              invitationExpiryDate: invitationExpiryDate,
                              invitationID: entry._id
                          },
                        roles: roles
                    };

                    invitations.push(invitationObj);
                });

                return { data: invitations };
            } else {
                return { data: [] };
            }
        } else {
            invalidRequestException.message.content = 'Missing required parameters.';
            invalidRequestException.timestamp = new Date().toISOString();
            throw invalidRequestException;
        }
    } catch (error) {
        unexpectedException.message.content = "An unexpected error occurred. Error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}


function delegationactiveinvitationbyuser(input) {
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    try {
        if (input.payload && input._MO_OBJECT_NAME && input.searchResponse) {
          logger.error("going inside helpdeskactiveinvitationbyUser")
            const searchResponse = input.searchResponse;
            const invitations = [];

            if (searchResponse && searchResponse.result) {
              logger.error("going inside searchResponse helpdeskactiveinvitationbyUser")
                searchResponse.result.forEach(function (entry) {
                    entry.applicationRoles.forEach(function (role) {
                        var appId = role.applicationId;

                       if(entry.status === "ACTIVE" || entry.status === "0"){
                                    var statusEn = null;
                                    var statusEs = null;
                                    if (entry.status === "ACTIVE" || entry.status === "0") {
                                        statusEn = "Active";
                                        statusEs = "Activo";
                                    } 
                        //             else {
                        //                 statusEn = "Pending";
                        //                 statusEs = "Pendiente";
                        //             }
                        // }
                      
                        var invitation = {
                            invitationId: entry._id,
                            applicationLogo: null,
                            applicationName: null,
                            status: {
                                        en: statusEn,
                                        es: statusEs
                                    },
                            invitedBy: null,
                            invitationDate: entry.createDate ? entry.createDate.split("T")[0] : null,
                            invitationExpiryDate: entry.expiryDate ? entry.expiryDate.split("T")[0] : null,
                            roles: []
                        };


                        // Fetch invitedBy info
                        if (entry.requesterUserAccountId) {
                            var inviter = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                            if (inviter) {
                                var fullName = [];
                                if (inviter.givenName) {
                                  fullName.push(inviter.givenName);
                                }
                                if (inviter.sn) {
                                  fullName.push(inviter.sn);
                                }
                                invitation.invitedBy = fullName.join(" ");
                            }
                        }

                        // Fetch app info
                        var appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                        if (appInfo) {
                            if (appInfo.logoFileName) {
                              invitation.applicationLogo = appInfo.logoFileName;
                            }
                            if (appInfo.name) {
                                invitation.applicationName = appInfo.name;
                                
                            }
                        }

                        // Fetch role info
                        var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                        if (roleInfo) {
                            var roleEntry = {
                                roleId: role.roleId,
                                roleName: { en: null, es: null },
                                tagName: { en: null, es: null }
                            };

                            if (roleInfo.content && roleInfo.content.length > 0 && roleInfo.content[0].name) {
                                roleEntry.roleName.en = roleInfo.content[0].name.en || null;
                                roleEntry.roleName.es = roleInfo.content[0].name.es || null;
                            }

                            // Fetch tag info
                            if (roleInfo.tags && roleInfo.tags.length > 0) {
                                var tagRef = roleInfo.tags[0];
                                if (tagRef && tagRef._refResourceId) {
                                    var tagInfo = getMORecord(tagRef._refResourceId, ["*"], "alpha_kyid_tag");
                                    if (tagInfo && tagInfo.localizedContent && tagInfo.localizedContent.length > 0) {
                                        var localizedTag = tagInfo.localizedContent[0];
                                        if (localizedTag.displayTitle) {
                                            roleEntry.tagName.en = localizedTag.displayTitle.en || null;
                                            roleEntry.tagName.es = localizedTag.displayTitle.es || null;
                                        }
                                    }
                                }
                            }

                            invitation.roles.push(roleEntry);
                        }

                        invitations.push(invitation);
                       }
                    });
                });

                //return { data: { activeInvitations: invitations } };
              return { data: invitations };
            } else {
                //return { data: { activeInvitations: [] } };
               return { data: [] };
            }
        } else {
            invalidRequestException.message.content = "Missing required parameters.";
            invalidRequestException.timestamp = new Date().toISOString();
            throw invalidRequestException;
        }
    } catch (error) {
        unexpectedException.message.content = "Unexpected error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}
                
function delegationmanageinvitationbydelegator(input) {
  logger.error("going inside helpdeskmanageinvitationbyapp")
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    

    try {
        if (input.payload && input._MO_OBJECT_NAME && input.searchResponse) {
            const searchResponse = input.searchResponse;
            const invitationsMap = {};

            if (searchResponse && searchResponse.result) {
                searchResponse.result.forEach(function (entry) {
                    entry.applicationRoles.forEach(function (role) {
                        const appId = role.applicationId;

                        // --- Status mapping ---
                        var statusEn = null;
                        var statusEs = null;
                        if (entry.status === "ACTIVE" || entry.status === "0") {
                            statusEn = "Active";
                            statusEs = "Activo";
                        } else {
                            statusEn = "Pending";
                            statusEs = "Pendiente";
                        }

                        // --- Requested user info ---
                        var firstName = "";
                        var lastName = "";
                        var email = "";
                        if (entry.requestedUserAccountId) {
                            var user = getMORecord(entry.requestedUserAccountId, ["*"], "alpha_user");
                            if (user) {
                              logger.error("user found in alpha_user:"+JSON.stringify(user))
                                if (user.givenName) { firstName = user.givenName; }
                                if (user.sn) { lastName = user.sn; }
                                if (user.mail) { email = user.mail; }
                            }
                        } else if (entry.requestedUserAccountAttibutes && Array.isArray(entry.requestedUserAccountAttibutes)) {
                          entry.requestedUserAccountAttibutes.forEach(function (attr) {
                              if ((attr.attributeName === "legalFirstName" || attr.attributeName === "givenName") && attr.attributeValue) {
                                  firstName = attr.attributeValue;
                              }
                              if ((attr.attributeName === "legalLastName" ||attr.attributeName === "sn") && attr.attributeValue) {
                                  lastName = attr.attributeValue;
                              }
                              if ((attr.attributeName === "primaryEmailAddress" || attr.attributeName === "mail") && attr.attributeValue) {
                                  email = attr.attributeValue;
                              }
                          });
                      }

                        // --- Build / fetch invitation object ---
                        if (!invitationsMap[entry._id]) {
                            invitationsMap[entry._id] = {
                                invitationId: entry._id,
                                id: entry.requestedUserAccountId,
                                firstName: firstName,
                                lastName: lastName,
                                email: email,
                                // applicationLogo: null,
                                // applicationName: null,
                                status: { en: statusEn, es: statusEs },
                                invitedBy: null,
                                invitationDate: null,
                                invitationExpiryDate: null,
                                approles: []
                            };

                            if (entry.createDate) {
                                invitationsMap[entry._id].invitationDate = entry.createDate.split("T")[0];
                            }
                            if (entry.expiryDate) {
                                invitationsMap[entry._id].invitationExpiryDate = entry.expiryDate.split("T")[0];
                            }

                            // Invited By
                            if (entry.requesterUserAccountId) {
                                var inviter = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                                if (inviter) {
                                    var fullName = [];
                                    if (inviter.givenName) { fullName.push(inviter.givenName); }
                                    if (inviter.sn) { fullName.push(inviter.sn); }
                                    invitationsMap[entry._id].invitedBy = fullName.join(" ");
                                }
                            }
                        }

                        // --- Application info ---
                        var appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                        var appObj = { applicationLogo: null, applicationName: null };
                        if (appInfo) {
                            if (appInfo.logoFileName) { appObj.applicationLogo = appInfo.logoFileName; }
                            if (appInfo.name) { appObj.applicationName = appInfo.name; }
                        }

                        // --- Role info ---
                        var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                        var roleEntry = {
                            roleId: role.roleId,
                            roleName: { en: null, es: null },
                            tagName: []
                        };

                        if (roleInfo && roleInfo.content && roleInfo.content.length > 0 && roleInfo.content[0].name) {
                            if (roleInfo.content[0].name.en) {
                                roleEntry.roleName.en = roleInfo.content[0].name.en;
                            }
                            if (roleInfo.content[0].name.es) {
                                roleEntry.roleName.es = roleInfo.content[0].name.es;
                            }
                        }

                        if (roleInfo && roleInfo.tags) {
                            roleInfo.tags.forEach(function (tagRef) {
                                if (tagRef && tagRef._refResourceId) {
                                    var tagInfo = getMORecord(tagRef._refResourceId, ["*"], "alpha_kyid_tag");
                                    if (tagInfo && tagInfo.localizedContent && tagInfo.localizedContent.length > 0) {
                                        var localizedTag = tagInfo.localizedContent[0];
                                        var tagObj = { en: null, es: null };
                                        if (localizedTag.displayTitle && localizedTag.displayTitle.en) {
                                            tagObj.en = localizedTag.displayTitle.en;
                                        }
                                        if (localizedTag.displayTitle && localizedTag.displayTitle.es) {
                                            tagObj.es = localizedTag.displayTitle.es;
                                        }
                                        roleEntry.tagName.push(tagObj);
                                    }
                                }
                            });
                        }

                        // --- Push app-role entry ---
                        invitationsMap[entry._id].approles.push({
                            app: appObj,
                            role: roleEntry
                        });
                    });
                });

                // Convert map → array
                var invitations = [];
                for (var key in invitationsMap) {
                    invitations.push(invitationsMap[key]);
                }
                return { data: invitations };
            } else {
                return { data: [] };
            }
        } else {
            invalidRequestException.message.content = "Missing required parameters.";
            invalidRequestException.timestamp = new Date().toISOString();
            throw invalidRequestException;
        }
    } catch (error) {
        unexpectedException.message.content = "An unexpected error occurred. Error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}


function searchHelpDeskActiveInvitation(input) {
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    try {
        logDebug(input.transactionId, input.endPoint, "searchAccount", "Input parameter: " + JSON.stringify(input.payload));

        if (input.payload) {
            const returnProperties = input.payload.returnProperties;

           var appId = null;
            if (input.payload.queryFilter && typeof input.payload.queryFilter === "string") {
                var appIdMatch = input.payload.queryFilter.match(/applicationRoles\/\[applicationId eq "([^"]+)"\]/);
                if (appIdMatch && appIdMatch.length > 1) {
                    appId = appIdMatch[1];
                }
            }

            if (!appId) {
                invalidRequestException.message.content = 'Invalid request. Could not extract "appId" from queryFilter.';
                invalidRequestException.timestamp = new Date().toISOString();
                throw invalidRequestException;
            }

            if (input._MO_OBJECT_NAME && input.searchResponse) {
                logDebug(input.transactionId, input.endPoint, "searchAccount", "Search filter: " + input.searchResponse);

                const searchResponse = input.searchResponse;

                if (searchResponse) {
                    logDebug(input.transactionId, input.endPoint, "searchAccount", "Response: " + JSON.stringify(searchResponse));

                    if (searchResponse.result) {
                        const invitations = [];

                        searchResponse.result.forEach(function(entry) {
                          
                          //Show only the active ones. Rest skip
                          if (!(entry.status === "ACTIVE" || entry.status === "0")) {
                                return; // skip this entry
                            }
                          
                            var grouped = {};
                            entry.applicationRoles.forEach(function(role) {
                                if (!grouped[appId]) {
                                    // Prepare invitationDate
                                    var invitationDate = null;
                                    if (entry.createDate && typeof entry.createDate === "string") {
                                        invitationDate = entry.createDate.split("T")[0];
                                    }

                                    // Prepare invitationExpiryDate
                                    var invitationExpiryDate = null;
                                    if (entry.expiryDate && typeof entry.expiryDate === "string") {
                                        invitationExpiryDate = entry.expiryDate.split("T")[0];
                                    }

                                    // Prepare status
                                    var statusEn = null;
                                    var statusEs = null;
                                    if (entry.status === "ACTIVE" || entry.status === "0") {
                                        statusEn = "Active";
                                        statusEs = "Activo";
                                    } 
                                    // else {
                                    //     statusEn = "Expired";
                                    //     statusEs = "Expirado";
                                    // }

                                    grouped[appId] = {
                                       status: {
                                            en: statusEn,
                                            es: statusEs
                                        },
                                      roles: [],
                                        invitedBy: {
                                            en: null,
                                            es: null
                                        },
                                        invitationDate: invitationDate,
                                        invitationExpiryDate: invitationExpiryDate,
                                        invitationID: entry._id,
                                        id: entry.requestedUserAccountId
                                    };
                                }

                                // Set invitedBy info (full name)
                                if (entry.requesterUserAccountId) {
                                    var invitedByInfo = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                                  logger.error("the invited by id"+invitedByInfo._id)
                                    if (invitedByInfo) {
                                        if (invitedByInfo._id) {
                                            grouped[appId].id = invitedByInfo._id; // id of the requester

                                            var en = invitedByInfo.givenName + " " + invitedByInfo.sn
                                            var es = invitedByInfo.givenName + " " + invitedByInfo.sn
                                        }
                                        grouped[appId].invitedBy.en = en;
                                        grouped[appId].invitedBy.es = es;

                                    }
                                }

                                // Set application info
                                var appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                                // Process role info
                                grouped[appId].roles = grouped[appId].roles || [];

                                  // Fetch role info
                                  var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                                  if (roleInfo) {
                                      var roleEntry = {
                                          roleId: role.roleId,
                                          roleName: { en: null, es: null },
                                          tagName: [] // now an array
                                      };
                                  
                                      // Set role name (localized)
                                      if (roleInfo.content && Array.isArray(roleInfo.content) && roleInfo.content[0] && roleInfo.content[0].name) {
                                          roleEntry.roleName.en = roleInfo.content[0].name.en || null;
                                          roleEntry.roleName.es = roleInfo.content[0].name.es || null;
                                      }
                                  
                                      // Loop through all tags
                                      if (Array.isArray(roleInfo.tags)) {
                                          roleInfo.tags.forEach(function(tagRef) {
                                              if (tagRef && tagRef._refResourceId) {
                                                  var tagInfo = getMORecord(tagRef._refResourceId, ["*"], "alpha_kyid_tag");
                                                  if (tagInfo && Array.isArray(tagInfo.localizedContent) && tagInfo.localizedContent[0]) {
                                                      var localizedTag = tagInfo.localizedContent[0];
                                                      var tagObj = {
                                                          en: (localizedTag.displayTitle && localizedTag.displayTitle.en) || null,
                                                          es: (localizedTag.displayTitle && localizedTag.displayTitle.es) || null
                                                      };
                                                      roleEntry.tagName.push(tagObj);
                                                  }
                                              }
                                          });
                                      }

                                  // Push role entry to roles array
                                  grouped[appId].roles.push(roleEntry);
                                                           }


                                
                            });

                            // Add all grouped invites to invitations list
                            var groupedValues = Object.values(grouped);
                            for (var i = 0; i < groupedValues.length; i++) {
                                invitations.push(groupedValues[i]);
                            }
                        });

                        //return { "invitations": invitations };
                      
                      return { data: invitations };
                    } else {
                        return [];
                    }
                } else {
                    return [];
                }
            } else {
                invalidRequestException.message.content = 'Invalid request. The request does not contain the required parameters. Missing parameter(s): "searchResponse"';
                invalidRequestException.timestamp = new Date().toISOString();
                throw invalidRequestException;
            }
        }
    } catch (error) {
        unexpectedException.message.content = "An unexpected error occured. Error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}

/**
 * @name searchInvitationV2
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function searchInvitationV2(input){
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-IRE",
        content: ""
    }
    
    const invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp":""
    }
    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp":""
    }

    try{
        logDebug(input.transactionId,input.endPoint,"searchAccount",`Input parameter: ${JSON.stringify(input.payload)}`)
      
        /* Check if  */
        if(input.payload){
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter
            const isUniqueResponseByApp = input.payload.isUniqueResponseByApp
            const isUniqueResponseByUser = input.payload.isUniqueResponseByUser
            const isUniqueResponseByRole = input.payload.isUniqueResponseByRole
            let isDelegationContext = false
            if(input.payload.isDelegationContext){
              isDelegationContext = input.payload.isDelegationContext
            }

            if(input._MO_OBJECT_NAME && queryFilter){
                logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
                const searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`, 
                    {
                        "_queryFilter": queryFilter
                    },
                    returnProperties
                )
                if(searchResponse){
                    logDebug(input.transactionId,input.endPoint,"searchAccount",`Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */
                   
                        let uniqueItems = []
                        const accessResult =[]
                        let businessApp = null
                        let localizedContent
                        let deleActiveInvitation
                  
                        /* Iterate through search response*/
                        if(searchResponse.result){
                          const invitations = [];
                          if(isDelegationContext===true){
                            searchResponse.result.forEach(entry=>{
                               deleActiveInvitation = {
                                invitationId:entry._id,
                                status:entry.status,
                                invitedBy: {userId:null,givenName:null,sn:null,mail:null},
                                invitationDate: entry.createDate.split("T")[0],
                                invitationExpiryDate: entry.expiryDate.split("T")[0],
                                roles: []
                              }
                              var invitedByInfo = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                               if(invitedByInfo){
                                  if(invitedByInfo._id){
                                    deleActiveInvitation.invitedBy.userId = invitedByInfo._id
                                  }
                                  if(invitedByInfo.givenName){
                                    deleActiveInvitation.invitedBy.givenName = invitedByInfo.givenName
                                  }
                                  if(invitedByInfo.sn){
                                     deleActiveInvitation.invitedBy.sn = invitedByInfo.sn
                                  }
                                  if(invitedByInfo.mail){
                                    deleActiveInvitation.invitedBy.mail = invitedByInfo.mail
                                  }
                                 
                               }
                              var roleJSON ={
                                  roleId:null,
                                  roleName:null,
                                  roleDescription:null,
                                  tags:[]
                                }
                              if(entry.applicationRoles){
                                entry.applicationRoles.forEach(role=>{
                                  var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                                  if(roleInfo){
                                    roleJSON.roleId = roleInfo._id
                                    if(roleInfo.content){
                                      if(roleInfo.content[0].name){
                                        roleJSON.roleName = roleInfo.content[0].name
                                      }
                                      if(roleInfo.content[0].description){
                                        roleJSON.roleDescription = roleInfo.content[0].description
                                      }
                                    }
                                  }
                                  
                                })
                              }
                              deleActiveInvitation.roles.push(roleJSON)
                             
                            })
                            if(deleActiveInvitation.roles.length==0){
                              deleActiveInvitation.roles.push(roleJSON)
                            }

                            return {"invitations":deleActiveInvitation}
            
                          }
                          else{
                            
                             searchResponse.result.forEach(entry=>{
                            const grouped = {};
                            entry.applicationRoles.forEach(role=>{
                              const appId = role.applicationId;
                              if (!grouped[appId]) {
                              grouped[appId] = {
                                invitationId: entry._id,
                                applicationId:appId,
                                applicationName:null,
                                applicationDescription:null,
                                applicationLogo:null,
                                status: entry.status,
                                invitedBy: {userId:null,givenName:null,sn:null,mail:null},
                                invitationDate: entry.createDate.split("T")[0],
                                invitationExpiryDate: entry.expiryDate.split("T")[0],
                                roles: []
                              };
                            }
                              if(entry.requesterUserAccountId){
                                var invitedByInfo = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                                if(invitedByInfo){
                                  if(invitedByInfo._id){
                                    grouped[appId].invitedBy.userId = invitedByInfo._id
                                  }
                                  if(invitedByInfo.givenName){
                                    grouped[appId].invitedBy.givenName = invitedByInfo.givenName
                                  }
                                  if(invitedByInfo.sn){
                                     grouped[appId].invitedBy.sn = invitedByInfo.sn
                                  }
                                  if(invitedByInfo.mail){
                                    grouped[appId].invitedBy.mail = invitedByInfo.mail
                                  }
                
                                }
                                
                              }
                              const appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                              if(appInfo){
                                if(appInfo.logoURL){
                                  grouped[appId].applicationLogo=appInfo.logoURL
                                }
                                if(appInfo.content){
                                  if(appInfo.content[0].title){
                                    grouped[appId].applicationName = appInfo.content[0].title
                                  }
                                  if(appInfo.content[0].content){
                                    grouped[appId].applicationDescription = appInfo.content[0].content
                                  }
                                }
                              }
                              var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                              var roleJSON ={
                                roleId:null,
                                roleName:null,
                                roleDescription:null,
                                tags:[]
                              }
                              roleJSON.roleId = role.roleId
                              if(roleInfo){
                              if(roleInfo.content){
                                 if(roleInfo.content[0].name){
                                   roleJSON.roleName = roleInfo.content[0].name
                                 }
                                if(roleInfo.content[0].description){
                                  roleJSON.roleDescription = roleInfo.content[0].description
                                }
                              }
          
                              grouped[appId].roles.push(roleJSON);
                                
                              }

                            })
                            Object.values(grouped).forEach(invite => invitations.push(invite));
                          })
                          
                          return {"invitations":invitations}
                        }
                        }else{
                            return []
                        }
                    
                }else{
                    return []
                }
            }else{
                
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
                invalidRequestException.timestamp = new Date().toISOString()
               
                throw invalidRequestException
            }
            
        }else{
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
            invalidRequestException.timestamp = new Date().toISOString()
            
            throw invalidRequestException
        }
    }catch(error){
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
    }
    
}


function getMORecord(id,roleReturnProperties,MOName){
  try {
    logger.error("Inside getMORecord Function ")
    logger.error("roleReturnProperties"+roleReturnProperties)
    if(roleReturnProperties === null){
      roleReturnProperties = ["*"]
    }

    let getResponse = null
    if(MOName && id){

        getResponse = openidm.read("managed/"+MOName +"/"+id,[roleReturnProperties]);
        logger.error("Inside getMORecord getResponse "+getResponse)
        if(getResponse){
          return getResponse
        }
        else{
          return null
        }
      
      
    }
    return null
    
  } catch (error) {
        /* Throw unexpected exception. */
        logger.error("getMORecord Error --> "+error)
        throw error
    
  }
}

function patchMORecord(id, payload) {
  try {
    let jsonArray = []

    // Always update status to 2
    let jsonObj = {
      "operation": "replace",
      "field": "recordState",
      "value": "1"
    }
    jsonArray.push(jsonObj)

    // If confirmation details are present, add audit field
    if (payload && payload.confirmation) {
      jsonArray.push({
        "operation": "replace",
        "field": "/audit",
        "value": {
          action: "cancel",
          reason: payload.confirmation.reason,
          comment: payload.confirmation.comment,
          requesterUserId: payload.requesterAccountId
        }
      })
    }
    logger.error("the jsonArray in cancel invitation is: "+ JSON.stringify(jsonArray))
    const response = openidm.patch("managed/alpha_kyid_enrollment_contextId/" + id,null,jsonArray)

    if (response) {
      return response
    } else {
      throw "Error Occurred While Patching MO Record"
    }
  } catch (error) {
    throw error
  }
}

/**
 * @name searchInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function cancelInvite(input){
  logger.error("getInvitation Input --> "+JSON.stringify(input))
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-IRE",
        content: ""
    }
    
    const invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/cancelInvite`,
        "timestamp":""
    }
    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/cancelInvite`,
        "timestamp":""
    }

    try{
      let returnProperties = ["*"]
        logDebug(input.transactionId,input.endPoint,"getInvitation",`Input parameter: ${JSON.stringify(input.payload)}`)
      
        /* Check if  */
        if(input.payload){

            const id = input.payload.invitationId
            let roleInfo = null 
            let userInfo = null
            let patchResponse = null
             
            if(input._MO_OBJECT_NAME){
              logger.error("Inside In Condition")
                // logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
               input._MO_OBJECT_NAME = input._MO_OBJECT_NAME+id
                logger.error("input._MO_OBJECT_NAME --> "+input._MO_OBJECT_NAME)
                const searchResponse = openidm.read(`${input._MO_OBJECT_NAME}`, returnProperties)
                logger.error("searchResponse in cancelinvite is -->"+searchResponse)
                if(searchResponse){
                    logDebug(input.transactionId,input.endPoint,"searchAccount",`Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */
             
          
                    //if(searchResponse.status !== "2" && searchResponse.status !== "1"){
                      patchResponse = patchMORecord(id, input.payload)
                      // patchResponse = true
                      if(patchResponse){
                        
                        //auditlogger lines
                        let roleAppObjects = searchResponse.applicationRoles
                        let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
                        let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
                        let eventDetails = {
                                    roleNames: roleNames,
                                    applicationNames: applicationNames,
                                    invitationId: id,
                                    confirmation: input.payload.confirmation
                            }
                        
                        auditLogger("", "Cancel Invitation Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                        return {"message":"Invitation Cancelled Successfully"}
                        // return patchResponse
                      }
                      else{

                        //auditlogger lines
                        let roleAppObjects = searchResponse.applicationRoles
                        let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
                        let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
                        let eventDetails = {
                                    roleNames: roleNames,
                                    applicationNames: applicationNames,
                                    invitationId: id,
                                    failure: "Error Occurred While Cancelling The Invitation"
                            }
                        
                        auditLogger("", "Cancel Invitation Failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                        invalidRequestException.message.content = `Error Occurred While Cancelling The Invitation`
                        invalidRequestException.timestamp = new Date().toISOString()
                       
                        throw invalidRequestException
                        
                      }
                    //}
                
                // else{
                // /* Throw invalid request exception. */
                // invalidRequestException.message.content = `Request is State is `+searchResponse.status
                // invalidRequestException.timestamp = new Date().toISOString()
               
                // throw invalidRequestException
                // }
                 
                
                    
                }else{
                    invalidRequestException.message.content = `Invalid request. Record Not Found`
                    invalidRequestException.timestamp = new Date().toISOString()
                   
                    throw invalidRequestException
                }
            }else{
                
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
                invalidRequestException.timestamp = new Date().toISOString()
               
                throw invalidRequestException
            }
            
        }else{
            /* Throw invalid request exception. */
            logger.error("`An unexpected error occured. Error")
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
            invalidRequestException.timestamp = new Date().toISOString()
            
            throw invalidRequestException
        }
    }catch(error){
        /* Throw unexpected exception. */
       logger.error("`An unexpected error occured. Error"+error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
    
}


// Send Email
function sendEmail(contextId,givenName,sn,mail,isUserExist) {
   try {
        logger.error("contextId is -->"+contextId)
        var params =  new Object();
        params.templateName = "kyid2B1AccessDelegationInviteTemplate";
        params.to = mail ;
        params._locale = "en";
        params.object = {
            "givenName": givenName,
            "sn" : sn,
            requestUri:null
            
        };

        //params.object.requestUri = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=RIDP_kyid_2B1_MasterLogin&contextId="+contextId
       //  params.object.requestUri = "/enrolment/"+contextId

     logger.error("the userExist in sendEmail::"+isUserExist)
     var portalURL = identityServer.getProperty("esv.portal.url")
      //send URL path based on user exist paramter
        if (isUserExist === true || isUserExist === "true" ) {
            params.object.requestUri = portalURL + "/appenroll/" + contextId;
        } else if (isUserExist === false || isUserExist === "false" ) {
            params.object.requestUri = portalURL + "/createaccount/" + contextId;
        }

        var portalURL = identityServer.getProperty("esv.portal.url")
       // params.object.requestUri = portalURL+ "/appenroll/" +contextId
     
        var response = openidm.action("external/email","sendTemplate",params);
        logger.error("Email Sent SuccessFully to: "+mail)
        if(response){
            return response
        }
       else{

           throw "invalidRequestException"
       }
       
    }
    catch (error){
      logger.error("Error Occurred while sending Email to ::"+mail +" error::"+ error );
            /* Throw invalid request exception. */
        throw error
      
    }
}


/**
 * @name resendInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function resendInvitation(input){
  logger.error("resendInvitation Input --> "+JSON.stringify(input))
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-IRE",
        content: ""
    }
    
    const invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/resendInvitation`,
        "timestamp":""
    }
    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/resendInvitation`,
        "timestamp":""
    }

    try{
        logDebug(input.transactionId,input.endPoint,"resendInvitation",`Input parameter: ${JSON.stringify(input.payload)}`)
      
        /* Check if  */
        if(input.payload){
            const id = input.payload.invitationId
            // const returnProperties = input.payload.returnProperties
            const returnProperties = ["*"]
            let givenName = null
            let sn = null
            let mail = null
            // const queryFilter = input.payload.queryFilter
            // const isUniqueResponseByApp = input.payload.isUniqueResponseByApp
            // const isUniqueResponseByUser = input.payload.isUniqueResponseByUser
            // const isUniqueResponseByRole = input.payload.isUniqueResponseByRole
            let roleInfo = null 
            let userInfo = null
             
            if(input._MO_OBJECT_NAME){
              logger.error("Inside In Condition")
                // logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
                input._MO_OBJECT_NAME = input._MO_OBJECT_NAME+id
                logger.error("input._MO_OBJECT_NAME --> "+input._MO_OBJECT_NAME)
                const searchResponse = openidm.read(`${input._MO_OBJECT_NAME}`, returnProperties)
                logger.error("searchResponse is -->"+searchResponse)
                if(searchResponse){
                    // logDebug(input.transactionId,input.endPoint,"resendInvitation",`Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */
                   // if(searchResponse.expiryDateEpoch > Date.now() && searchResponse.status === "0" && (searchResponse.recordState === "0" ||searchResponse.recordState == "ACTIVE" ) && searchResponse.requestedUserAccountAttibutes) {

                  if (
                    searchResponse.expiryDateEpoch &&
                    (searchResponse.expiryDateEpoch * 1000) > Date.now() &&
                    searchResponse.status === "0" &&
                    (
                      searchResponse.recordState === "0" ||
                      searchResponse.recordState === "ACTIVE"
                    ) &&
                    searchResponse.requestedUserAccountAttibutes &&
                    searchResponse.requestedUserAccountAttibutes.length > 0
                  ){
                  logger.error("Meeting Condtions")
                      if(searchResponse.requestedUserAccountAttibutes.length>0){
                        for(let i=0; i<searchResponse.requestedUserAccountAttibutes.length ; i++){
                          if(searchResponse.requestedUserAccountAttibutes[i].attributeName == "givenName" && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null ){
                            givenName =searchResponse.requestedUserAccountAttibutes[i].attributeValue 
                          }
                          if(searchResponse.requestedUserAccountAttibutes[i].attributeName == "sn" && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null ){
                            sn =searchResponse.requestedUserAccountAttibutes[i].attributeValue 
                          }
                          if(searchResponse.requestedUserAccountAttibutes[i].attributeName == "mail" && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null ){
                            mail =searchResponse.requestedUserAccountAttibutes[i].attributeValue 
                          }
                          
                        }
                        if(givenName !== null && sn !== null && mail !== null){
                          logger.error("Sending Invitation ")
                         // const sendEmailResponse = sendEmail(searchResponse._id,givenName,sn,mail)
                          const sendEmailResponse = sendEmail(searchResponse._id,givenName,sn,mail, true)
                          if(sendEmailResponse){                              

                            //auditlogger lines
                            let roleAppObjects = searchResponse.applicationRoles
                            let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
                            let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
                            let eventDetails = {
                                    roleNames: roleNames,
                                    applicationNames: applicationNames,
                                    invitationId: id
                                  }
                            
                            auditLogger("", "Resend Invitation Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, mail, eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                            return {"message":"Email Sent Successfully"}
                            
                                                      }else{

                             //auditlogger lines
                            let roleAppObjects = searchResponse.applicationRoles
                            let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
                            let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
                            let eventDetails = {
                                    roleNames: roleNames,
                                    applicationNames: applicationNames,
                                    invitationId: id,
                                    message: "Email Failed to send"
                                  }
                            auditLogger("", "Resend Invitation failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, mail, eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                            return {"message":"Email Failed to send"}
                          }
                        }
                        else{
                                          
                            /* Throw invalid request exception. */
                            unexpectedException.message.content = `Invalid request. mail or givenName or sn is null or blank"`
                            unexpectedException.timestamp = new Date().toISOString()
                           
                            throw unexpectedException
                        }
                      }
                      else{
                                        
                        /* Throw invalid request exception. */
                        invalidRequestException.message.content = `Invalid request. The request does not contain requestedUserAccountAttibutes"`
                        invalidRequestException.timestamp = new Date().toISOString()
                       
                        throw invalidRequestException

                      }

                    }
                  else{
                                    
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. Invitation is Expired"`
                invalidRequestException.timestamp = new Date().toISOString()
               
                throw invalidRequestException
                  }
          
                
                    
                }else{
                
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. Record not found"`
                invalidRequestException.timestamp = new Date().toISOString()
               
                throw invalidRequestException
                }
            }else{
                
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. Managed Object Not Found"`
                invalidRequestException.timestamp = new Date().toISOString()
               
                throw invalidRequestException
            }
            
        }else{
            /* Throw invalid request exception. */
            logger.error("`An unexpected error occured. Error")
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "payload"`
            invalidRequestException.timestamp = new Date().toISOString()
            
            throw invalidRequestException
        }
    }catch(error){
        /* Throw unexpected exception. */
       logger.error("`An unexpected error occured. Error"+error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
    }
    
}

function createContextId(payload) {
  try {
  const searchResponse = openidm.query(`${MOName}`, 
          {
            "_queryFilter": queryFilter
          },
                    returnProperties
          )
  if(searchResponse && searchResponse.resultCount>0){
    return searchResponse.result
  }
  else{
    return null
  }
    
  } catch (error) {
      throw JSON.stringify(error)
  }
  
}

function createRecord(MOName,enrollmentReqTemplate) {
  try {
    
  const response = openidm.create("managed/"+MOName, null, enrollmentReqTemplate)
    
  if(response){
    return response
  }
  else{
    throw ("Error Occurred while creating Enrollment request")
  }
    
  } catch (error) {
      throw JSON.stringify(error)
  }
  
}

/**
 * @name resendInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function sendInvitation(input) {
    logger.error("resendInvitation Input --> " + JSON.stringify(input))

    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/resendInvitation`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/resendInvitation`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "resendInvitation", `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if (input.payload) {
            const invitedUser = input.payload.user || null
            const roles = input.payload.roles || null
            const context = input.payload.context || null
            const extDomain = identityServer.getProperty("esv.kyid.ext.ad.domain");
            let isExternalUser = true
            let isUserExist = true 
            let KOGID = null
            let userDomain =null
            let requestedUserAccountId =null
            let requestedUserIdentifierAttributeName = null
            let requestedUserIdentifierAttributeValue =null
            
            if (invitedUser) {
                if (invitedUser.userId) {
                    let getUserbyIdPing = getMORecord(invitedUser.userId, ["*"], "alpha_user")
                    if (getUserbyIdPing) {
                        if (getUserbyIdPing.accountStatus == "active") {
                        requestedUserAccountId = getUserbyIdPing._id,
                        requestedUserIdentifierAttributeName = "KYID",
                        requestedUserIdentifierAttributeValue= getUserbyIdPing._id,
                            userDomain = getUserbyIdPing.frIndexedString2 || null
                            if (userDomain) {
                                userDomain = userDomain.split('@')[1]
                                if (userDomain.toLowerCase() === extDomain.toLowerCase) {
                                    isExternalUser = true
                                    isUserExist = true
                                }

                            }
                        }
                    }
                }
              else if(invitedUser.mail){
                let KOGUserResponse = invokeKOGAPI(mail)
                if(KOGUserResponse){
                   if(KOGUserResponse.UPN){
                     KOGID = KOGUserResponse.KOGID || null
                     if(KOGID){
                       requestedUserIdentifierAttributeName = "KOGID"
                       requestedUserIdentifierAttributeValue= KOGID
                     }
                     
                     userDomain = KOGUserResponse.UPN.toLowerCase() || null
                     if (userDomain) {
                       userDomain = userDomain.split('@')[1]
                       if (userDomain.toLowerCase() === extDomain.toLowerCase) {
                         isExternalUser = true
                         isUserExist = true
                         }

                         }
                   }
                   
                }
              }
              if(isExternalUser === true){
                let rolewithPrereq =[]
                let rolewithoutPrereq = []
                let roleJSONWithPrereq = {}
                
                let roleJSONWithoutPrereq = {}
                if(roles !==null){
                  if(roles.length>0){
                    let contextRequestBody = {
                      applicationRoles: [],
                      "createDate": new Date().toISOString(),
                      "createDateEpoch": Date.now(),
                      "createdBy": "KYID-System",
                      "expiryDate": null,
                      "expiryDateEpoch": null,
                      "recordSource": "1",
                        "recordState": "0",
                        "requestedUserAccountAttibutes": [
                        {
                            "attributeName": "givenName",
                            "attributeValue": input.payload.user.givenName || null,
                            "isReadOnly": false
                        },
                        {
                            "attributeName": "sn",
                            "attributeValue": input.payload.user.sn || null,
                            "isReadOnly": false
                        },
                        {
                            "attributeName": "mail",
                            "attributeValue": input.payload.user.mail || null,
                            "isReadOnly": true
                        }
                        ],
                        "requestedUserAccountId": requestedUserAccountId,
                        "requestedUserIdentifierAttributeName": requestedUserIdentifierAttributeName,
                        "requestedUserIdentifierAttributeValue": requestedUserIdentifierAttributeValue,
                        "requesterUserAccountId": input.payload.userId,
                        "requesterUserIdentifierAttributeName": "KYID",
                        "requesterUserIdentifierAttributeValue": input.payload.userId,
                        "status": "0",
                        "updateDate": new Date().toISOString(),
                        "updateDateEpoch": Date.now(),
                        "updatedBy": "KYID-System"
                          }
                     let defaultPrereqExpiryInDays = identityServer.getProperty("esv.enrollment.prereq.defaultexpiry")
                     let enrollExpiryDateEpoch = Date.now() + defaultPrereqExpiryInDays * 24 * 60 * 60 * 1000
                    let enrollExpiryDate = new Date(enrollExpiryDateEpoch).toISOString();
                     let enrollmentReqTemplate = {
                            createDate: new Date().toISOString(),
                            createDateEpoch: Date.now(),
                            expiryDate: enrollExpiryDate, // if expiry not present in enrollment context how to get the expiry date
                            expiryDateEpoch: enrollExpiryDateEpoch,
                            status: "IN_PROGRESS",
                            requestedUserId: requestedUserAccountId,
                            requesterId: input.payload.userId,
                            recordState: "ACTIVE",
                            enrollmentContextId: null,
                            updateDate: new Date().toISOString(),
                            updateDateEpoch: Date.now(),
                            createdBy: "KYID-System",
                            updatedBy: "KYID-System",
                            appSystemName: [],
                            roleIds: [],
                            roleContext: []
                     }

                        
                     let expiryDate = getExpiryDate("0",null)
                     if(expiryDate){
                       contextRequestBody.expiryDate = expiryDate.expiryDate
                       contextRequestBody.expiryDateEpoch = expiryDate.expiryEpochMillis
                     }
                    roles.forEach(value=>{
                      if(value.roleId){
                        let roleInfo = getMORecord(value.roleId, ["*"], "alpha_role")
                        if(roleInfo){
                        if(roleInfo.accessPolicy){
                          let businessInfo = getMORecord(roleInfo.businessAppId._refResourceId, ["*"], "alpha_kyid_businessapplication")
                          let rolePolicy = getMORecord(roleInfo.accessPolicy._refResourceId, ["*"], "alpha_kyid_enrollment_access_policy")
                          if(rolePolicy){
                            if(rolePolicy.preRequisites && rolePolicy.preRequisites.length>0){
                                   roleJSONWithPrereq["applicationId"]= null
                                   roleJSONWithPrereq["roleId"]=value.roleId || null
                                   roleJSONWithPrereq["roleName"]= null
                                   roleJSONWithPrereq["applicationName"] =  null
                                   roleJSONWithPrereq["isForwardDelegable"] = value.isForwardDelegable || false
                                   roleJSONWithPrereq["delegationEndDate"] = value.delegationEndDate || null
                                   roleJSONWithPrereq["delegationEndDateEpoch"] = null
                                   if(value.delegationEndDate){
                                     roleJSONWithPrereq["delegationEndDateEpoch"] = new Date(value.delegationEndDate).getTime()
                                   }
                                   if(roleInfo.businessAppId){
                                     roleJSONWithPrereq["applicationId"] = roleInfo.businessAppId._refResourceId
                                   }
                                   if(roleInfo.name){
                                      roleJSONWithPrereq["roleName"] = roleInfo.name
                                   }
                                   if(roleInfo.businessAppId){
                                      if(businessInfo){
                                       if(businessInfo.name){
                                         roleJSONWithPrereq["applicationName"]=businessInfo.name
                                       }
                                       
                                     }
                                     
                                   }
                                                    
                                 
                                  
                                  if(context === "delegation"){
                                       roleJSONWithPrereq["currentDelegatorIdentifierAttributeName"] = "KYID"
                                       roleJSONWithPrereq["currentDelegatorIdentifierAttributeValue"] = input.payload.userId
                                       let originalDeligatorQueryFilter =  "originalDelegator pr AND role/_refResourceId eq \""+value.roleId+"\"] AND (recordState eq \"0\" or recordState eq 'ACTIVE')"
                                       let originalDelegatorInfo = searchMO("alpha_kyid_access",originalDeligatorQueryFilter,["*"])
                                       logger.error("originalDelegatorInfo --> "+ JSON.stringify(originalDelegatorInfo))
                                        if(originalDelegatorInfo){
                                         if(originalDelegatorInfo.originalDelegator){
                                           roleJSONWithPrereq["originalDelegatorUserAccountId"] = originalDelegatorInfo.originalDelegator._refResourceId
                                           roleJSONWithPrereq["orginalDelegatorIdentifierAttributeValue"] = originalDelegatorInfo.originalDelegator._refResourceId
                                           roleJSONWithPrereq["orginalDelegatorIdentifierAttributeName"] = "KYID"
                                         }
                                         else{
                                          roleJSONWithPrereq["originalDelegatorUserAccountId"] = input.payload.userId
                                          roleJSONWithPrereq["orginalDelegatorIdentifierAttributeValue"] =input.payload.userId
                                          roleJSONWithPrereq["orginalDelegatorIdentifierAttributeName"] = "KYID"
                                             
                                         }
                                         
                                       }
                                    else{
                                        roleJSONWithPrereq["originalDelegatorUserAccountId"] = input.payload.userId
                                        roleJSONWithPrereq["orginalDelegatorIdentifierAttributeValue"] =input.payload.userId
                                        roleJSONWithPrereq["orginalDelegatorIdentifierAttributeName"] = "KYID"
                                         
                                      
                                    }
                                       }
                                  rolewithPrereq.push(roleJSONWithPrereq)
                              
          
                              
                            }
                            else{
                              logger.error("Without Prereq Condition1")
                              if(isUserExist === false){
                                   roleJSONWithPrereq["applicationId"]=roleInfo.businessAppId || null
                                   roleJSONWithPrereq["roleId"]=value.roleId || null
                                   roleJSONWithPrereq["roleName"]=roleInfo.name || null
                                   roleJSONWithPrereq["applicationName"] = roleInfo.businessAppId.name || null
                                   roleJSONWithPrereq["isForwardDelegable"] = value.isForwardDelegable || null
                                   roleJSONWithPrereq["delegationEndDate"] = value.delegationEndDate || null
                                   roleJSONWithPrereq["delegationEndDateEpoch"] = 123456
                                   if(context === "delegation"){
                                       roleJSONWithPrereq["currentDelegatorIdentifierAttributeName"] = "KYID"
                                       roleJSONWithPrereq["currentDelegatorIdentifierAttributeValue"] = input.payload.userId
                                       roleJSONWithPrereq["currentDelegatorIdentifierAttributeName"] = input.payload.userId
                                       let originalDeligatorQueryFilter =  "originalDelegator pr AND role eq \""+value.roleId+"\"] AND (recordState eq \"0\" or recordState eq 'ACTIVE')"
                                       let originalDelegatorInfo = searchMO("managed/alpha_kyid_access",originalDeligatorQueryFilter,["*"])
                                       if(originalDelegatorInfo){
                                         if(originalDelegatorInfo[0].originalDelegator){
                                           roleJSONWithPrereq["originalDelegatorUserAccountId"] = originalDelegatorInfo[0].originalDelegator._refResourceId
                                           roleJSONWithPrereq["orginalDelegatorIdentifierAttributeValue"] = originalDelegatorInfo[0].originalDelegator._refResourceId
                                           roleJSONWithPrereq["orginalDelegatorIdentifierAttributeName"] = "KYID"
                                         }
                                         
                                       }
                                       
                                       }
                                  rolewithPrereq.push(roleJSONWithPrereq)
                                
                              }
                              else{
                                logger.error("Without Prereq Condition")
                                let roleContextTemplate = {
                                    appName: null,
                                    businessKeys: [],
                                    currentDelegatorId: null,
                                    orgId: null,
                                    orgName: null,
                                    orgType: null,
                                    orginalDelegatorId: null,
                                    roleName: null
                                }
                                
                              
                                enrollmentReqTemplate.roleIds.push({ "_ref": "managed/alpha_role/" + roleInfo._id, "_refProperties": {} })
                                roleContextTemplate["appName"] = roleInfo.businessAppId.name || null
                                roleContextTemplate["roleName"] = roleInfo.name || null
                                roleContextTemplate["isForwardDelegable"] = value.isForwardDelegable || null
                                roleContextTemplate["delegationEndDate"] = value.delegationEndDate || null
                                roleContextTemplate["delegationEndDateEpoch"] = 123456
                                if(context === "delegation"){
                                       currentDelegatorId["currentDelegatorIdentifierAttributeValue"] = input.payload.userId
                                       let originalDeligatorQueryFilter = "originalDelegator pr AND role eq \""+value.roleId+"\"] AND (recordState eq \"0\" or recordState eq 'ACTIVE')"
                                       let originalDelegatorInfo = searchMO("alpha_kyid_access",originalDeligatorQueryFilter,["*"])
                                       if(originalDelegatorInfo){
                                         if(originalDelegatorInfo[0].originalDelegator){
                                           roleContextTemplate["orginalDelegatorId"] = originalDelegatorInfo[0].originalDelegator._refResourceId
                                         }
                                         
                                       }
                                  }
                                enrollmentReqTemplate.roleContext.push(roleContextTemplate)
                              }

                            }
                          }
                          else{
                            /* Throw invalid request exception. */
                           
                            logger.error("`An unexpected error occured. Error")
                            invalidRequestException.message.content = `Invalid request. Policy is not congigured for Role :: "`+value.roleId
                            invalidRequestException.timestamp = new Date().toISOString()
            
                            throw invalidRequestException
                            
                          }
                        }
                          else{
                            /* Throw invalid request exception. */
                            logger.error("`An unexpected error occured. Error")
                            invalidRequestException.message.content = `Invalid request. Policy is not congigured for Role :: "`+value.roleId
                            invalidRequestException.timestamp = new Date().toISOString()
            
                            throw invalidRequestException
                            
                          }
                          
                        }
                        else{
                            /* Throw invalid request exception. */
                            logger.error("`An unexpected error occured. Error")
                            invalidRequestException.message.content = `Invalid request. Role Not Found :: "`+value.roleId
                            invalidRequestException.timestamp = new Date().toISOString()
            
                            throw invalidRequestException
                          
                        }
                        
                      }
                      else{
                            /* Throw invalid request exception. */
                            logger.error("`An unexpected error occured. Error")
                            invalidRequestException.message.content = `Invalid request. Role Not Found :: "`+value.roleId
                            invalidRequestException.timestamp = new Date().toISOString()
            
                            throw invalidRequestException
                        
                      }
                    })
                    let createEnrollmentRequestResponse = null
                    let createContextIdResponse = null
                    if(rolewithPrereq && rolewithPrereq.length>0){
                      contextRequestBody.applicationRoles=rolewithPrereq
                       // return {"contextRequestBody":contextRequestBody}
                      createContextIdResponse = createRecord("alpha_kyid_enrollment_contextId",contextRequestBody) 
                      // return {"createContextIdResponse":createContextIdResponse}
                    }
                    if(enrollmentReqTemplate.roleContext && enrollmentReqTemplate.roleContext.length>0){
                      logger.error("enrollmentReqTemplate --> "+ JSON.stringify(enrollmentReqTemplate))
                      createEnrollmentRequestResponse = createRecord("alpha_kyid_enrollment_request",enrollmentReqTemplate) 
                      return createEnrollmentRequestResponse
                    }
                    if(rolewithPrereq.length === 0 && enrollmentReqTemplate.roleContext ===0 ){
                        invalidRequestException.message.content = `Unexpected Error Occurred While Sending Invite rolewithPrereq is Empty and rolewithoutPrereq is Empty "`
                        invalidRequestException.timestamp = new Date().toISOString()
                        throw invalidRequestException
                      
                    }

                    if(createEnrollmentRequestResponse){
                       
                       let enrollmentRequest =createEnrollmentRequestResponse._id
                       // let provisionROleRsponse = provisionRole()
                    }
                    if(createContextIdResponse){
                       let ContextId =createContextIdResponse._id
                       const sendEmailResponse = sendEmail(ContextId,input.payload.user.givenName,input.payload.user.sn,input.payload.user.mail)
                       if(sendEmailResponse){
                         //return {"message":"Email Sent Successfully"}
                         return {"message":ContextId}
                       }
                       
                    }
                  }
                }
                
                
              }
              else{
                /* Throw invalid request exception. */
                logger.error("`An unexpected error occured. Error")
                invalidRequestException.message.content = `Invalid request. The request contain Internal User, Only External Users are allowed"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException
                
              }



            } else {
                /* Throw invalid request exception. */
                logger.error("`An unexpected error occured. Error")
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "payload"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException
            }
        }
    } catch (error) {
        /* Throw unexpected exception. */
        logger.error("`An unexpected error occured. Error" + error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
    }

}

function getExpiryDate(option, value) {
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now()  // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString()  // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate)  // Convert the ISO string into a Date object

        var expiryDate;

        switch (option) {
            case 0:  // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000)  // Add one day (24 hours) to the current time
                break;
            case 1:  // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000)  // Add one week (7 days)
                break;
            case 2:  // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1)  // Add one month to the current date
                break;
            case 3:  // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3)  // Add 3 months to the current date
                break;
            case 4:  // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6)  // Add 6 months to the current date
                break;
            case 5:  // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1)  // Add 1 year to the current date
                break;
            case 6:  // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day)  // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1)  // If the date is already passed this year, set it to the next year
                }
                break;
            case 7:  // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000)  // Add 'value' days in milliseconds
                break;
            case 8:  // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value);  // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return null
        }

        const expiryEpochMillis = new Date(expiryDate).getTime()  // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return { "expiryEpochMillis":expiryEpochMillis, "expiryDate":expiryDate };

    } catch (error) {
        logger.error("Error Occurred While getExpiryDate " + error)
        return JSON.stringify(error)
        
    }

}


/**
 * @name getRequestContent
 * @description Method returns request content.
 * 
 * @param {string} endpoint 
 * @param {string} request 
 * @returns {JSON} request content
 * @throws Exception
 */
function getRequestContent(context,request,endpoint){
    if(request.content){
      logDebug(context.transactionId,endpoint,"getRequestContent",`Input parameter: ${request.content}`)
    }
    if(request.additionalParameters){
       logDebug(context.transactionId,endpoint,"getRequestContent",`Input parameter: ${request.additionalParameters}`)
    }
    
    
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-INE",
        content: ""
    }

    let invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${endpoint}`,
        "timestamp":""
    }

    try{
        if(request.content){
            if(!request.content.payload){
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.payload"`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
            }
            if(!request.content.action){
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.action"`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
            }
            if(request.content.action === 4 && request.content.view ){
                /* Throw invalid request exception. */
                let view = request.content.view.toLowerCase()
                if(view ==="dashboardactiveinvitation" && !( request.content.userId)){
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
                  
                }
                else if(view ==="helpdeskmanageinvitation" && !( request.content.userId)){
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
                  
                }
                else if(view ==="helpdeskactiveinvitation" && !( request.content.userId) && !( request.content.searchUserId)){
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
                  
                }
                else if(view ==="delegationmanageinvitation" && !( request.content.userId)){
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
                  
                }
                else if(view ==="delegationactiveinvitation" && !( request.content.userId)){
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
                  
                }


            }
          

            logDebug(context.transactionId,endpoint,"getRequestContent",`Response: ${request.content}`)
            return request.content

        }
        else if(request.additionalParameters){
          logger.error("request.additionalParameters are "+ JSON.stringify(request.additionalParameters))
            return request.additionalParameters
             
        }
        else{
        
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content"`
            invalidRequestException.timestamp = new Date().toISOString()
            
            throw invalidRequestException
        }
    }catch(error){
        throw error
    }
    
}


function invokeKOGAPI(mail) {
  try {
     const requestBody = {
       "url":identityServer.getProperty("esv.kyid.kogapi.userprofile"),
       "scope":identityServer.getProperty("esv.kyid.kogapi.token.scope"),
       "method":"POST",
       "payload":{
         "EmailAddress": mail
       }
       
     }
    
     const response = openidm.create("endpoint/invokeCertAPI", null, requestBody)
    logger.error("the response from invokeAPI function::" + JSON.stringify(response));

    // check top-level status
    if (response && response.status === "200") {
      const kogResponse = response.response;  

      if (kogResponse.ResponseStatus === 0) {
        return kogResponse;
      } else if (kogResponse.ResponseStatus === 1) {
        logger.error("KOG API: user not found for email " + mail);
        return { UserDetails: null };
       // return null;
      } else {
        throw JSON.stringify(kogResponse);
      }
    }

  } catch (error) {
    throw JSON.stringify(error);
  }
}








/**
 * @name {generateResponse}
 * @description Method generates response.
 * 
 * @param {String} responseCode 
 * @param {JSON} message 
 * @param {JSON} payload 
 * @returns 
 */
function generateResponse(responseCode,transactionId, message,payload){
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"UNERROR",
        message:"An unexpected error occured while processing the request."
    }
        
    if(payload){
        return {
            responseCode:responseCode,
            transactionId:transactionId,
            message:message,
            payload:payload
        }
    }else if(message){
        return {
            responseCode:responseCode,
            transactionId:transactionId,
            message:message
        }
    }else{
        return {
            responseCode:responseCode,
            transactionId:transactionId,
            message:{
                code:EXCEPTION_UNEXPECTED_ERROR.code,
                message:EXCEPTION_UNEXPECTED_ERROR.content
            }
        }
    }
    
}

/**
 * @name logDebug
 * This function logs information.
 *
 * @param {string} transactionId
 * @param {string} endpointName
 * @param {string} functionName
 * @param {JSON} exception
 */
function logDebug(transactionId,endpointName,functionName,message) {
    logger.info(JSON.stringify({
        "transactionId":transactionId,
        "endpointName":endpointName,
        "functionName":functionName,
        "message":message
    }))
}

/**
 * @name logException
 * This function logs exception.
 *
 * @param {JSON} exception
 */
function logException(exception) {
    logger.error(JSON.stringify(exception))
}

/**
* @name getException
* @description Get exception details
*
* @param {JSON} exception
* @returns {JSON} exception.
*/
function getException(e) {
  let _ = require('lib/lodash');
  if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
    return e.javaException.cause.localizedMessage || e.javaException.cause.message;
  } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
    return e.messageDetail.message;
  } else if (_.has(e, 'message')) {
    return e.message;
  } else {
    return e;
  }
}

function currentDate() {
    let currentDate = Date.now();
    return new Date(current).toISOString();

}

function searchObjectByIdAttributeValue(input, objectName, attributeName, attributeValue) {
    try {
        if (!attributeName || !attributeValue) {
            logger.error("searchObjectByIdAttributeValue :: Missing attributeName or attributeValue");
            return null;
        }

        let queryFilter = attributeName + ' eq "' + attributeValue + '"';
        let result = openidm.query(objectName, { "_queryFilter": queryFilter });

        if (result && result.result && result.result.length > 0) {
            return result.result[0];
        } else {
            logger.error("searchObjectByIdAttributeValue :: No object found in " + objectName +
                         " where " + attributeName + " = " + attributeValue);
            return null;
        }
    } catch (e) {
        logger.error("searchObjectByIdAttributeValue :: Exception - " + e);
        return null;
    }
}


function sendInvitationAPI(input) {
    logger.error("resendInvitation Input --> " + JSON.stringify(input))

    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/resendInvitation`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/resendInvitation`,
        "timestamp": ""
    }

    let roleAppObjects = {roleNames: [], applicationNames: []}

    try {
        logDebug(input.transactionId, input.endPoint, "resendInvitation", `Input parameter: ${JSON.stringify(input.payload)}`)

        if (input.payload) {
            const invitedUser = input.payload.requestedUser || null
            const access = input.payload.access || null
            const extDomain = identityServer.getProperty("esv.kyid.ext.ad.domain");

            let isExternalUser = true
            let isUserExist = true
            let KOGID = null
            let userDomain = null
            let requestedUserAccountId = null
            let requestedUserIdentifierAttributeName = null
            let requestedUserIdentifierAttributeValue = null

            if (invitedUser) {
                //if (invitedUser._id) {
              if(invitedUser && invitedUser._id && invitedUser._id !== null && invitedUser._id !== ""){
                    // requestedUser has ID
                    logger.error("the _id of user is present")
                    let getUserbyIdPing = searchObjectByIdAttributeValue(
                        input,
                        "managed/alpha_user",
                        "_id",
                        invitedUser._id
                    )
                    if (getUserbyIdPing && getUserbyIdPing.accountStatus == "active") {
                        requestedUserAccountId = getUserbyIdPing._id
                        requestedUserIdentifierAttributeName = "KYID"
                        requestedUserIdentifierAttributeValue = getUserbyIdPing._id
                        userDomain = getUserbyIdPing.frIndexedString2 || null
                        if (userDomain) {
                            userDomain = userDomain.split('@')[1]
                            if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
                                isExternalUser = true
                                isUserExist = true
                            }
                        }
                    }
                } else if (invitedUser && invitedUser.email) {
                    
                      let getUserbyIdPing = searchObjectByIdAttributeValue(
                        input,
                        "managed/alpha_user",
                        "mail",
                        invitedUser.email
                    )
                    if (getUserbyIdPing && getUserbyIdPing.accountStatus == "active") {
                      logger.error("invited user's id not present but found in ping by email")
                        requestedUserAccountId = getUserbyIdPing._id
                        requestedUserIdentifierAttributeName = "KYID"
                        requestedUserIdentifierAttributeValue = getUserbyIdPing._id
                        userDomain = getUserbyIdPing.frIndexedString2 || null
                        if (userDomain) {
                            userDomain = userDomain.split('@')[1]
                            if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
                                isExternalUser = true
                                isUserExist = true
                            }
                        }
                    } 
                     else {
                      // requestedUser has NO ID, lookup by mail
                    logger.error("searching the user from email"+invitedUser.email)
                    let KOGUserResponse = invokeKOGAPI(invitedUser.email)

                   //var apiResponse = JSON.parse(KOGUserResponse.text());
                //logger.error("the KOGUserResponse is:: "+KOGUserResponse.UserDetails.UPN)
                    if (KOGUserResponse && KOGUserResponse.UserDetails && KOGUserResponse.UserDetails.UPN) {
                        logger.error("user found in kog")
                        KOGID = KOGUserResponse.UserDetails.KOGID || null
                        if (KOGID) {
                            requestedUserIdentifierAttributeName = "KOGID"
                            requestedUserIdentifierAttributeValue = KOGID
                        }
                        userDomain = KOGUserResponse.UserDetails.UPN.toLowerCase() || null
                        if (userDomain) {
                            userDomain = userDomain.split('@')[1]
                            if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
                                isExternalUser = true
                                isUserExist = true
                            }
                        }
                    } else {
                            isUserExist = false
                        }
                    }
                      
                    // requestedUser has NO ID, lookup by mail
                //     logger.error("searching the user from email")
                //     let KOGUserResponse = invokeKOGAPI(invitedUser.email)

                //    //var apiResponse = JSON.parse(KOGUserResponse.text());
                // //logger.error("the KOGUserResponse is:: "+KOGUserResponse.UserDetails.UPN)
                //     if (KOGUserResponse && KOGUserResponse.UserDetails && KOGUserResponse.UserDetails.UPN) {
                //         logger.error("user found in kog")
                //         KOGID = KOGUserResponse.UserDetails.KOGID || null
                //         if (KOGID) {
                //             requestedUserIdentifierAttributeName = "KOGID"
                //             requestedUserIdentifierAttributeValue = KOGID
                //         }
                //         userDomain = KOGUserResponse.UserDetails.UPN.toLowerCase() || null
                //         if (userDomain) {
                //             userDomain = userDomain.split('@')[1]
                //             if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
                //                 isExternalUser = true
                //                 isUserExist = true
                //             }
                //         }
                //     } else {
                //             isUserExist = false
                //         }
                }

                if (isExternalUser === true) {
                    logger.error("user is external")

                    let rolewithPrereq = []
                    let rolewithoutPrereq = []

                  // Expiry dates for enrolment context
                  let defaultContextxpiryInDays = identityServer.getProperty("esv.enrollment.context.defaultexpiry")
                  let contextExpiryDateEpoch = Date.now() + defaultContextxpiryInDays * 24 * 60 * 60 * 1000
                  let contextExpiryDate = new Date(contextExpiryDateEpoch).toISOString();
                  
                    // Enrollment Context + Request templates
                    let contextRequestBody = {
                        applicationRoles: [],
                        "createDate": new Date().toISOString(),
                        "createDateEpoch": Date.now(),
                        "createdBy": "KYID-System",
                        "expiryDate": contextExpiryDate,
                        "expiryDateEpoch": contextExpiryDateEpoch,
                        "recordSource": "1",
                        "recordState": "0",
                        "requestedUserAccountAttibutes": [
                            {
                                "attributeName": "givenName",
                                "attributeValue": input.payload.requestedUser.firstName || null,
                                "isReadOnly": false
                            },
                            {
                                "attributeName": "sn",
                                "attributeValue": input.payload.requestedUser.lastName || null,
                                "isReadOnly": false
                            },
                            {
                                "attributeName": "mail",
                                "attributeValue": input.payload.requestedUser.email || null,
                                "isReadOnly": true
                            }
                        ],
                        "requestedUserAccountId": requestedUserAccountId || null,
                        "requestedUserIdentifierAttributeName": requestedUserIdentifierAttributeName,
                        "requestedUserIdentifierAttributeValue": requestedUserIdentifierAttributeValue,
                        "requesterUserAccountId": input.payload.requesterAccountId,
                        "requesterUserIdentifierAttributeName": "KYID",
                        "requesterUserIdentifierAttributeValue": input.payload.requesterAccountId,
                        "status": "0",
                        "updateDate": new Date().toISOString(),
                        "updateDateEpoch": Date.now(),
                        "updatedBy": "KYID-System"
                    }

                  //Logic for expirydate. Its mandatory attribute in enrolment request MO
                  let defaultPrereqExpiryInDays = identityServer.getProperty("esv.enrollment.prereq.defaultexpiry")
                  let enrollExpiryDateEpoch = Date.now() + defaultPrereqExpiryInDays * 24 * 60 * 60 * 1000
                  let enrollExpiryDate = new Date(enrollExpiryDateEpoch).toISOString();

                    let enrollmentReqTemplate = {
                        createDate: new Date().toISOString(),
                        createDateEpoch: Date.now(),
                        expiryDate: enrollExpiryDate,
                        expiryDateEpoch: enrollExpiryDateEpoch,
                        status: "IN_PROGRESS",
                        requestedUserId: requestedUserAccountId || null,
                        requesterId: input.payload.requesterAccountId,
                        recordState: "ACTIVE",
                        enrollmentContextId: null,
                        updateDate: new Date().toISOString(),
                        updateDateEpoch: Date.now(),
                        createdBy: "KYID-System",
                        updatedBy: "KYID-System",
                        appSystemName: [],
                        roleIds: [],
                        roleContext: []
                    }

                    // If invitedUser has _id
                    if ((invitedUser._id || isUserExist) && access && access.length > 0) {
                        access.forEach(value => {
                            let roleInfo = searchObjectByIdAttributeValue(input, "managed/alpha_role", value.roleIdAttribute, value.roleIdAttributeValue)

                            let businessInfo = null
                            if (value.businessAppIdAttribute && value.businessAppIdAttributeValue) {
                                businessInfo = searchObjectByIdAttributeValue(
                                    input,
                                    "managed/alpha_kyid_businessapplication",
                                    value.businessAppIdAttribute,
                                    value.businessAppIdAttributeValue
                                )
                            }
                            //get names for aduit logger
                            roleAppObjects.roleNames.push(roleInfo.name)
                            roleAppObjects.applicationNames.push(businessInfo.name)

                            if (roleInfo && roleInfo.accessPolicy) {
                                let rolePolicy = searchObjectByIdAttributeValue(input, "managed/alpha_kyid_enrollment_access_policy", "_id", roleInfo.accessPolicy._refResourceId)
                                if (rolePolicy && rolePolicy.preRequisites && rolePolicy.preRequisites.length > 0) {
                                  logger.error("Role needs prerequisites - Enrollment Context")


                                  let prereqObj = {
                                    roleId: roleInfo._id,
                                    applicationId: businessInfo._id,
                                    roleName: roleInfo.name,
                                    applicationName: businessInfo.name
                                };
                                
                                // push delegation attributes only if present
                                if (value.isForwardDelegable || value.delegationEndDate || value.currentDelegatorIdAttributeValue) {
                                    prereqObj.isForwardDelegable = value.isForwardDelegable;
                                    prereqObj.delegationEndDate = value.delegationEndDate;
                                    prereqObj.delegationEndDateEpoch = value.delegationEndDate || null;
                                    prereqObj.currentDelegatorIdentifierAttributeName = value.currentDelegatorIdAttribute;
                                    prereqObj.currentDelegatorIdentifierAttributeValue = value.currentDelegatorIdAttributeValue;
                                    prereqObj.originalDelegatorUserAccountId = input.payload.originalDelegatorIdAttributeValue
                                    prereqObj.orginalDelegatorIdentifierAttributeValue = input.payload.originalDelegatorIdAttributeValue
                                    prereqObj.orginalDelegatorIdentifierAttributeName = "KYID"
                                }


                                rolewithPrereq.push(prereqObj);
                                  
                                } else {
                                    logger.error("No prerequisites.Create Enrollment Request")
                                    enrollmentReqTemplate.roleIds.push({ "_ref": "managed/alpha_role/" + roleInfo._id, "_refProperties": {} })

                                  let roleContextObj = {
                                      appName: businessInfo.name,
                                      roleName: roleInfo.name,
                                      applicationId: businessInfo._id,
                                      roleId: roleInfo._id
                                  };

                                  if (value.isForwardDelegable || value.delegationEndDate || value.currentDelegatorIdAttributeValue) {
                                  roleContextObj.isForwardDelegable = value.isForwardDelegable;
                                  roleContextObj.delegationEndDate = value.delegationEndDate;
                                  roleContextObj.delegationEndDateEpoch = new Date(value.delegationEndDate).getTime() || "";
                                  roleContextObj.currentDelegatorId = value.currentDelegatorIdAttributeValue;
                                  roleContextObj.orginalDelegatorId = value.originalDelegatorIdAttributeValue;
                              }

                              enrollmentReqTemplate.roleContext.push(roleContextObj);

                                }
                            } else {
                                invalidRequestException.message.content = "Invalid request. Role Not Found :: " + value.roleIdAttributeValue;
                                invalidRequestException.timestamp = new Date().toISOString()
                                throw invalidRequestException
                            }
                        })
                    } 
                    
                          else if (!isUserExist && !invitedUser._id) {
                            logger.error("user does not exist in ping or kog and _id is not there in payload")
                        // User does not exist or has no _id. create Enrollment Context
                        if (access && access.length > 0) {
                            access.forEach(value => {
                                let roleInfo = searchObjectByIdAttributeValue(
                                    input,
                                    "managed/alpha_role",
                                    value.roleIdAttribute,
                                    value.roleIdAttributeValue
                                );
                                let businessInfo = null;
                                if (value.businessAppIdAttribute && value.businessAppIdAttributeValue) {
                                    businessInfo = searchObjectByIdAttributeValue(
                                        input,
                                        "managed/alpha_kyid_businessapplication",
                                        value.businessAppIdAttribute,
                                        value.businessAppIdAttributeValue
                                    );
                                }

                                //get names for aduit logger
                                roleAppObjects.roleNames.push(roleInfo.name)
                                roleAppObjects.applicationNames.push(businessInfo.name)  
                    
                                // Create prereq object
                                let prereqObj = {
                                    roleId: roleInfo._id,
                                    applicationId: businessInfo._id,
                                    roleName: roleInfo.name,
                                    applicationName: businessInfo.name
                                };

                              logger.error("the prereqObj when _id is not present:::"+JSON.stringify(prereqObj))
                              rolewithPrereq.push(prereqObj);
                                // Push only if delegation-related attributes are present
                                if (
                                    value.isForwardDelegable ||
                                    value.delegationEndDate ||
                                    value.currentDelegatorIdAttributeValue ||
                                    value.originalDelegatorIdAttributeValue
                                ) {
                                    prereqObj.isForwardDelegable = value.isForwardDelegable;
                                    prereqObj.delegationEndDate = value.delegationEndDate;
                                    prereqObj.delegationEndDateEpoch = value.delegationEndDate;
                                    prereqObj.currentDelegatorIdentifierAttributeName = value.currentDelegatorIdAttribute;
                                    prereqObj.currentDelegatorIdentifierAttributeValue = value.currentDelegatorIdAttributeValue;
                                    prereqObj.currentDelegatorUserAccountId = value.currentDelegatorIdAttributeValue;
                                    prereqObj.originalDelegatorUserAccountId = value.originalDelegatorIdAttributeValue;
                                    prereqObj.orginalDelegatorIdentifierAttributeValue = value.originalDelegatorIdAttributeValue;
                                    prereqObj.orginalDelegatorIdentifierAttributeName = value.originalDelegatorIdAttribute;
                    
                                    // rolewithPrereq.push(prereqObj);
                                }
                            });
                        }
                    }
                    
                    else {
                        //Error condition
                        rolewithPrereq.push({
                            roleId: null,
                            applicationId: null,
                            roleName: null
                        })
                    }

                    // Create Enrollment Context if roles present
                    if (rolewithPrereq.length > 0) {
                      logger.error("rolewithPrereq length is gt 0")
                        contextRequestBody.applicationRoles = rolewithPrereq
                        let createContextIdResponse = createRecord("alpha_kyid_enrollment_contextId", contextRequestBody)
                        if (createContextIdResponse) {
                          logger.error("createContextIdResponse successful")
                            const ContextId = createContextIdResponse._id
                            const sendEmailResponse = sendEmail(ContextId, input.payload.requestedUser.firstName, input.payload.requestedUser.lastName, input.payload.requestedUser.email, isUserExist)
                            if (sendEmailResponse) {
                                                          
                              //auditlogger lines
                              let eventDetails = {
                                    roleNames: roleAppObjects.roleNames,
                                    applicationNames: roleAppObjects.applicationNames,
                                    invitationId: ContextId
                                  }
                                  
                              auditLogger("", "Send Invitation Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)
                                
                              return { 
                                      "message": ContextId, 
                                      "status": "Invitation sent successfully" 
                                  }

                            }else{

                              //auditlogger lines
                              let eventDetails = {
                                    roleNames: roleAppObjects.roleNames,
                                    applicationNames: roleAppObjects.applicationNames,
                                    invitationId: ContextId,
                                    message: "Invitation sent Failure" 
                                  }
                              
                              auditLogger("", "Send Invitation Failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)
                              
                              return { 
                                      "message": ContextId, 
                                      "status": "Invitation sent Failure" 
                              }
                            }
                        }
                    }

                    // Create Enrollment Request if roles present
                    if (enrollmentReqTemplate.roleContext.length > 0) {
                      logger.error("the enrollmentReqTemplate length is greater than 0 "+ JSON.stringify(enrollmentReqTemplate))
                      
                        let createEnrollmentRequestResponse = createRecord("alpha_kyid_enrollment_request", enrollmentReqTemplate)
                      if (createEnrollmentRequestResponse) {
                        logger.error("the createEnrollmentRequestResponse is successful")
                        const RequestId = createEnrollmentRequestResponse._id

                        //const accessResponse = invokeRoleAccess(invitedUser._id, RequestId); //getUserbyIdPing._id
                            const accessResponse = invokeRoleAccess(requestedUserAccountId, RequestId);
                          if (accessResponse && accessResponse.status === "success") {
                              logger.error("Access provisioned successfully for user: " + requestedUserAccountId);
                                                            
                              //auditlogger lines
                              let eventDetails = {
                                    roleNames: roleAppObjects.roleNames,
                                    applicationNames: roleAppObjects.applicationNames,
                                    enrollmentRequestID: RequestId
                                  }
                                  
                            auditLogger("", "Add Role Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                          } else {
                              logger.error("Access provisioning failed or invalid response: " + JSON.stringify(accessResponse));
                                                           
                              //auditlogger lines                      
                              let eventDetails = {
                                    roleNames: roleAppObjects.roleNames,
                                    applicationNames: roleAppObjects.applicationNames,
                                    enrollmentRequestID: RequestId,
                                    message: JSON.stringify(accessResponse)
                                  }
                              logger.error("xiaohan debug point invitation 0: logger add role failure")
                              auditLogger("", "Add Role Failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)
                          }
                      }
                      logger.error("xiaohan debug point invitation 1: return results")
                        return { "message": RequestId }
                    }

                } else {
                    // Invalid request: internal user
                    logger.error("Invalid request - Internal User")
                    invalidRequestException.message.content = "Invalid request. The request contains an Internal User, only External Users are allowed"
                    invalidRequestException.timestamp = new Date().toISOString()
                    throw invalidRequestException
                }
            } else {
                // Invalid request: missing requestedUser
                logger.error("Invalid request - Missing payload.requestedUser")
                invalidRequestException.message.content = "Invalid request. The request does not contain the required parameters. Missing parameter(s): \"payload\""
                invalidRequestException.timestamp = new Date().toISOString()
                throw invalidRequestException
            }
        }
    } catch (error) {
        logger.error("An unexpected error occured. Error" + error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
}

function addRolesToUser(roles,id) {
    try {
        let patchArray = [];

        roles.forEach(function (role) {
            let patchOperation = {
                "operation": "add",
                "field": "/roles/-",
                "value": { "_ref": "managed/alpha_role/" + role._id }
            };
            patchArray.push(patchOperation);
        });

        let patchResponse = openidm.patch("managed/alpha_user/" + id, null, patchArray);
        return patchResponse;  // return actual patched user
    } catch (error) {
        logger.error("An unexpected error occured. Error" + error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
}


function invokeRoleAccess(invitedUserId, requestId) {
    try {
        const requestBody = {
            "payload": {
                "requestedUserAccountId": invitedUserId,
                "enrollmentRequestId": requestId
            },
            "action": "1"
        };

        logger.error("invokeRoleAccess request body: " + JSON.stringify(requestBody));

        const response = openidm.create("endpoint/access", null, requestBody);
        logger.error("invokeRoleAccess raw response: " + JSON.stringify(response));

       if (response && response.status) {
            if (response.status === "success") {
                logger.error("invokeRoleAccess SUCCESS: " + JSON.stringify(response));
            } else {
                logger.error("invokeRoleAccess FAILED: " + JSON.stringify(response));
            }
        } else {
            logger.error("invokeRoleAccess EMPTY or invalid response.");
        }

        // Always return response, even if it's empty or failed
        return response || {};
    } catch (error) {
        logger.error("invokeRoleAccess ERROR: " + JSON.stringify(error));
        // just return error object
        return { error: error };
    }
}



/**This is audit logger to capture user activity
 *
 * @param eventCode
 * @param sessionDetails
 * @param eventName
 * @param eventDetails
 * @param requesterUserId
 * @param requestedUserId
 * @param transactionId
 * @param emailId
 * @param apllicationId
 * @param sessionRefId
 */
function auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, apllicationId, sessionRefId) {
try{
    logger.error("KYID.2B1.Library.AuditLogger -- Inside Audit Logger")
    const createdDate = new Date().toISOString();
    const currentTimeinEpoch = Date.now();
   
    var logPayload = {
        eventCode:eventCode,
        eventName: eventName,
        eventDetails: JSON.stringify(eventDetails),
        requesterUserId: requesterUserId,
        requestedUserId: requestedUserId,
        transactionId: transactionId,
        sessionDetails:sessionDetails?JSON.stringify(sessionDetails):null,
        createdDate: createdDate,
        createdTimeinEpoch: currentTimeinEpoch,
        emailId: emailId || "",
        applicationName: apllicationId || "",
        sessionId: sessionRefId || ""
    };
logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
     const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
    logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
   } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
        logger.error("KYIDAuditLogger ::error" + error);
    }
   
}
 