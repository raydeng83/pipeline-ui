 (function () {
   
    const REQUEST_POST = "create"
    const REQUEST_GET = "read"
    const REQUEST_UPDATE = "update"
    const REQUEST_PATCH = "patch"
    const REQUEST_DELETE = "delete"


    const ACTION_FILTER = "getFilter"
    const ACTION_PROPERTY = "propertyCheck"
    const ACTION_OBJECT = "objectCheck"


    const ENDPOINT_NAME = "endpoint/dataAuthorizationCheck"

    let result = null
    try {
            logger.debug(ENDPOINT_NAME + "Start")

            if (request.method === REQUEST_POST && request.content && request.content.action) {
            
                switch(request.content.action){

                case ACTION_FILTER:
                    if(request.content.userId && request.content.objectName){
                        result = getObjectRecordPermissionFIlter(request.content.userId, "managed/"+request.content.objectName)
                    }else{

                        throwException(400, "Request Data Missing")
                    }
                   
                    break;

                case ACTION_PROPERTY:
                    if(request.content.userName && request.content.objectName && request.content.properties){
                        
                        result = isAuthorizedForObjectProperties(request.content.userName, "managed/"+request.content.objectName, request.content.properties)
                    }else{

                        throwException(400, "Request Data Missing")
                    }
                    
                    break;

                case ACTION_OBJECT:
                    if(request.content.userName && request.content.objectName && request.content.permission){

                        result = isAuthorizedForObject(request.content.userName, "managed/"+request.content.objectName, request.content.permission);
                    }else{

                        throwException(400, "Request Data Missing")
                    }
                    
                    break;
                
                default:

                   throwException(400, "Undefined Action")

                break;
            }

            return result;

        } else {

            throwException(400, "Bad Request")
        }
    } catch (error) {

      throw {
            code: error.code,
            message: "Not Found",
            detail: {
                error: error.message 
            }
        }
    }

}());

function getObjectRecordPermissionFIlter(userId, objectName){

    let filters = []
    let userRole = openidm.query("managed/alpha_user/" + userId + "/authzRoles", {
            "_queryFilter": "true"
        }, ["name"]).result

    if(userRole){

        userRole.forEach(item => {

            let roleName = item.name
            let roleID = item._refResourceId
            let privileges = openidm.read("internal/role/" + roleID, null, ["privileges"]).privileges
            if(privileges.length > 0){

                for(let privilege of privileges){

                    if(privilege.path == objectName && privilege.filter){

                        filters.push({role: roleName, object: objectName, objectFilter: privilege.filter});
                    }
                }
            }

        });

        if(filters.length > 0){

            return {
                filter: filters
            }
        }else{

            throwException (404, "No Filter Found")
        }

    }else{

        throwException (404, "No Internal Role Found for This User")
    }

}



function isAuthorizedForObject(userName, objectName, permissionstoCheck){
    
    logger.debug("isAuthorizedForObject function start")

    let userQueriedResult = openidm.query("managed/alpha_user/", {
                "_queryFilter": "userName eq \"" + userName + "\"",
            }, ["_id"]).result;

    if(userQueriedResult.length > 0){

        let userPermissions = []
        let userRole = openidm.query("managed/alpha_user/" + userQueriedResult[0]._id + "/authzRoles", {
                "_queryFilter": "true"
            }, ["name"]).result
                
        logger.debug("isAuthorizedForObject function user internal role check" + userRole)

        if(userRole){

            userRole.forEach(item => {
                
                let roleID = item._refResourceId
                
                let privileges = openidm.read("internal/role/" + roleID, null, ["privileges"]).privileges
                if(privileges.length > 0){
                    
                    for(let privilege of privileges){

                    if(privilege.path == objectName && privilege.permissions){
                        
                        userPermissions = mergeArraysObject(privilege.permissions, permissionstoCheck, userPermissions)
                    }
                }
                }


            });

            logger.debug("isAuthorizedForObject function end")
            if(permissionstoCheck.every(x => userPermissions.includes(x))){
                    
                return {
                    isAuthorized: true,
                    permissionstoCheck: permissionstoCheck
                };
            }else {

                return {
                    isAuthorized: false,
                    permissionstoCheck: permissionstoCheck
                };
            }   
        
        }else{

            throwException (404, "No Internal Role Found for This User")
        }


    }else{

        throwException (404, "user not found")
    }


}

function isAuthorizedForObjectProperties(userName, objectName, propertiestoCheck){

    logger.debug("isAuthorizedForObjectProperties function start")

    let userQueriedResult = openidm.query("managed/alpha_user/", {
                "_queryFilter": "userName eq \"" + userName + "\"",
            }, ["_id"]).result;
    let result = false
    let passedAttributes = []
    let failedAttributes = []

    if(userQueriedResult.length > 0){

        let userRole = openidm.query("managed/alpha_user/" + userQueriedResult[0]._id + "/authzRoles", {
                "_queryFilter": "true"
            }, ["name"]).result
                
        logger.debug("isAuthorizedForObjectProperties function user internal role check" + userRole)

        if(userRole){

            userRole.forEach(item => {
                
                let roleID = item._refResourceId
                let privileges = openidm.read("internal/role/" + roleID, null, ["privileges"]).privileges
                logger.debug("isAuthorizedForObjectProperties function privileges check" + privileges)
                if(privileges.length > 0){
                    
                    for(let privilege of privileges){

                    
                    if(privilege.path == objectName && privilege.accessFlags){


                        let attributes = privilege.accessFlags
                        passedAttributes = mergeArraysProperties(attributesCheck(propertiestoCheck, attributes), passedAttributes)
                       
                    }
                }
                }

            })

            failedAttributes = compareArrars(passedAttributes, propertiestoCheck)
            result = (failedAttributes.length === 0)
            
            logger.debug("isAuthorizedForObjectProperties function end")

            return {
                
                isAuthorized: result,
                failedProperties: failedAttributes
            };          


        }else{

            throwException (404, "No Internal Role Found for This User")
        }


    }else{

        throwException (404, "user not found")
    }


}




function mergeArraysObject(array1, array2, mergeArrays){
    logger.debug("mergeArraysObject function start")

    for(let i = 0; i < array1.length; i++){
        
        if(array2.indexOf(array1[i]) !== -1 && mergeArrays.indexOf(array1[i]) === -1){

           mergeArrays.push(array1[i])
        }
    }

    logger.debug("mergeArraysObject function end")
    return mergeArrays;

}

function mergeArraysProperties(array1, array2){
    logger.debug("mergeArraysProperties function start")

    for(let i = 0; i < array1.length; i++){

        if(array2.indexOf(array1[i]) === -1){

           array2.push(array1[i])
        }
    }
    
    logger.debug("mergeArraysProperties function end")
    return array2;

}

function compareArrars(array1, array2){
    logger.debug("compareArrars function start")
    let missingElement = []
    let setArray1 = new Set(array1)

    for(var key in array2){

        if(!setArray1.has(key)){

            missingElement.push(key)
        }
    }

    logger.debug("compareArrars function end")
    return missingElement


}

function attributesCheck(propertiestoCheck, attributes){
    logger.debug("attributesCheck function start")
    
    const ATTRIBUTE_READ_PERMISSION = "read"
    const ATTRIBUTE_WRITE_PERMISSION = "write"
    let passedAttributes = []
    let lookUpList = {}

    for (let i = 0; i < attributes.length; i++){

        let attribute = attributes[i]

        lookUpList[attribute.attribute] = attribute.readOnly
    }
    
    for(var key in propertiestoCheck){

        switch (propertiestoCheck[key]){

            case ATTRIBUTE_READ_PERMISSION:
                if (lookUpList.hasOwnProperty(key)){

                    passedAttributes.push(key)
                }
            
            break;

            case ATTRIBUTE_WRITE_PERMISSION:
                if(lookUpList.hasOwnProperty(key) && !lookUpList[key]){

                    passedAttributes.push(key)
                }
            break;

            default:
                throwException (400, "Undefined Properties Permission" + propertiestoCheck[key])
                break;
        }
    }

    logger.debug("attributesCheck function end")
    return passedAttributes;

}
function throwException(code, message) {
    if(code && message){

        throw { code: code, message: message } 
    }else if (message) {

        throw { code: 400, message: exception }
    } else {

        throw { code: 400, message: "unexpected error"}
    }
}
