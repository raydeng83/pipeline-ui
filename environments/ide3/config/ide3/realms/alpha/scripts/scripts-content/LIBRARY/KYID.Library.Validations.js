/**
* Name: KYID.2B1.Library.Validations
* Description: This library script is used to perform prerequisite form fields validation.
* Function: validate(<Parameters>)
*           Parameters: 
*                   userInfo           <JSON Object>  => Specifies the user info
*                   sysInfo            <JSON Object>  => Specifies the managed object info
*                   fieldType          <String>       => Specifies the type of form field
*                   validationArray    <JSON Array>   => Specifies array of validation constraints for a form field 
*                   optionsArray       <JSON Array>   => Specifies all the available options for a radio and checkbox type of form field  
* Import Library:  
*                Example: 
*                        var portalData = require("KYID.2B1.Library.Validations");
* Invoke Library Function:
*                         Examples: 
*                                 1) validationResp = portalData.validate(userInfo,sysInfo,type,validationArray,optionsArray);
* Date: 27th March 2025
* Author: Deloitte
*/


//Global Variables
var result = false;
var name = null;
var errorMessage = [];
var errors = [];
var errorMap = {};
var attrName= null;
var errorarray = [];
var formatederrors = [];
var errMsg = null;
var enMsg = null;
var esMsg = null;
var msg = null;


function validate(userInfo, sysInfo, fieldType, validationArray, optionsArray) {
    logger.error("userInfo is - "+JSON.stringify(userInfo));
    if(sysInfo!=null) {
        logger.error("sysInfo is - "+JSON.stringify(sysInfo));
    }
    logger.error("fieldType is - "+fieldType);
    logger.error("validationArray is - "+JSON.stringify(validationArray));
    if(optionsArray!=null) {
        logger.error("optionsArray is - "+JSON.stringify(optionsArray));
    }      

    try{ 
        fieldType = fieldType.toLowerCase(); 
        attrName = userInfo['name'];
        logger.error("attrNameis:"+attrName)
        name = userInfo['name'];
        logger.error("Name is "+ name);
        
        if(fieldType === "text" || fieldType === "textarea" || fieldType === "number"){
            fieldType = "text";
        } else if(fieldType === "select"|| fieldType === "radio"){
            fieldType = "select";
        }
        
        switch (fieldType) {
        case "text":
            result = validateTextFieldValues(userInfo,sysInfo,validationArray, attrName);
            if(result){
                logger.error("TextField Validation Success");
            } else {
                logger.error("TextField Validation Failed");
            }   
            break;

        case "select":
            result = validateSelectFieldValues(userInfo,validationArray,optionsArray,attrName);
            if(result){
                logger.error("Radio/Select Validation Success");
            } else {
                logger.error("Radio/Select Validation Failed");
            }
            break;

        case "checkbox":
            result = validateCheckboxFieldValues(userInfo,validationArray,optionsArray,attrName);
            if(result){
                logger.error("Checkbox Validation Success");
            } else {
                logger.error("Checkbox Validation Failed");
            }
            break;

        case "multicheckbox":
            result = validateMultiCheckboxFieldValues(userInfo,validationArray,optionsArray,attrName);
            if(result){
                logger.error("Checkbox Validation Success");
            } else {
                logger.error("Checkbox Validation Failed");
            }
            break;

        case "date":
            result = validateDateFieldValues(userInfo,validationArray,attrName);
            if(result){
                logger.error("DOB Validation Success");
            } else {
                logger.error("DOB Validation Failed");
            }
            break;                   
                
    
        default:
            throw new Error("Invalid fieldType" + fieldType);
     }

        if(result){
            return {"status":"success", "message":"Validation success for "+name};
        } else {
            logger.error("Status is" + JSON.stringify(errorMap));
            return {"status":"fail", "message":errorMap}; 
        }
        
    } catch (error) {
          var errorResponse = {
          status: "Validation Failed",
          message: JSON.stringify(errorMap)
    };
        
    logger.error("errorResponse is" + JSON.stringify(errorResponse));
    return errorResponse;
  }
    
}


function validateMultiCheckboxFieldValues(userInfo,validationArray,optionsArray,attrName){
    logger.error("**Inside validateMultiCheckboxFieldValues function**")
    var parsedUserInfo = JSON.parse(JSON.stringify(userInfo));
    var usrInpArray = parsedUserInfo["value"];
    var optionsArrayJSONObj = null;  
    var options = [];
    var resArray = [];
    var validationJSONObj = null;

    logger.error("usrInpArray is in "+ usrInpArray);

   if(validationArray.length > 0 && usrInpArray.length <=0 ){
        for(var i=0;i<validationArray.length;i++){
            validationJSONObj = JSON.parse(JSON.stringify(validationArray[i]));
                if(validationJSONObj["type"] === "required" && validationJSONObj["value"] === "false"){
                    logger.error("Inside not mandatory")
                    return true;
                    }
        }
    }
    
    if(isRequired(usrInpArray, attrName)){
      for(var i = 0; i < optionsArray.length; i++) {
           optionsArrayJSONObj = null;
           optionsArrayJSONObj = JSON.parse(JSON.stringify(optionsArray[i]));
           options.push(optionsArrayJSONObj["value"]);
      }
      resArray = options.filter(value => usrInpArray.includes(value));
      logger.error("Result Array - "+resArray)
      if(resArray.length === usrInpArray.length){
          return true;
      } else {
            msg = getValidationMessage(attrName,"required")
            addError(attrName, "en", msg.enMSg);
            addError(attrName, "es", msg.esMSg);
          return false;
      }     
    } else {
        return false;
    }
}

    
function validateCheckboxFieldValues(userInfo,validationArray,optionsArray,attrName){
    logger.error("**Inside validateCheckboxFieldValues function**")
    var parsedUserInfo = JSON.parse(JSON.stringify(userInfo));
    var value = parsedUserInfo["value"];
    var optionsArrayJSONObj = null;  
    var validationJSONObj = null;
    var options = [];

logger.error("value in Checkbox is in "+ value)
   if(validationArray.length > 0 && (value == null || value == undefined || !value)){
        for(var i=0;i<validationArray.length;i++){
            validationJSONObj = JSON.parse(JSON.stringify(validationArray[i]));
                if(validationJSONObj["type"] === "required" && validationJSONObj["value"] === "false"){
                    logger.error("Inside not mandatory")
                    return true;
                }
        }
    }

    if(isRequired(value,attrName)){
      for(var i = 0; i < optionsArray.length; i++) {
           optionsArrayJSONObj = null;
           optionsArrayJSONObj = JSON.parse(JSON.stringify(optionsArray[i]));
           options.push(optionsArrayJSONObj["value"]);
      }
      if(options.includes(value)){
          return true;
      }else{
        msg = getValidationMessage(attrName,"required")
        addError(attrName, "en", msg.enMSg);
        addError(attrName, "es", msg.esMSg);
        return false;
      }    
    } else {
      return false;
    }
}


function validateSelectFieldValues(userInfo,validationArray,optionsArray,attrName){
    logger.error("**Inside validateSelectFieldValues function**")
    var parsedUserInfo = JSON.parse(JSON.stringify(userInfo));
    var value = parsedUserInfo["value"];
    var optionsArrayJSONObj = null;  
    var validationJSONObj = null;
    var options = [];

    logger.error("value in Select is in "+ value)

   if(validationArray.length > 0 && (value == null || value == undefined || !value)){
        for(var i=0;i<validationArray.length;i++){
            validationJSONObj = JSON.parse(JSON.stringify(validationArray[i]));
                if(validationJSONObj["type"] === "required" && validationJSONObj["value"] === "false"){
                    logger.error("Inside not mandatory")
                    return true;
                    }
        }
    }

    if(isRequired(value,attrName)){
      for(var i = 0; i < optionsArray.length; i++) {
           optionsArrayJSONObj = null;
           optionsArrayJSONObj = JSON.parse(JSON.stringify(optionsArray[i]));
           options.push(optionsArrayJSONObj["value"]);
      }
      if(options.includes(value)){
          return true;
      } else{
        msg = getValidationMessage(attrName,"required")
        addError(attrName, "en", msg.enMSg);
        addError(attrName, "es", msg.esMSg);
        return false;
      }
          
    } else {
      return false;
    }
}


function validateTextFieldValues(userInfo, sysInfo, validationArray, attrName){
   logger.error("**Inside validateTextFieldValues function**")   
    var parsedUserInfo = JSON.parse(JSON.stringify(userInfo));
    var value = parsedUserInfo["value"];
    var parsedSysInfo = null;
    var validationJSONObj = null;
    var charLimit = null;
    var regex = null;
    var loggers = require("KYID.2B1.Library.Loggers");

    logger.error("parsedUserInfoisReadOnly"+parsedUserInfo["isReadOnly"]);
    logger.error("parsedUserInfo in text is in "+ parsedUserInfo["value"])
     //logger.error("parsedUserInfo in text for fieldFormat is in "+ parsedUserInfo["fieldFormat"])

    for(var i=0;i<validationArray.length;i++){
        validationJSONObj = JSON.parse(JSON.stringify(validationArray[i]));
            if((value == null || value == undefined || !value)){
               if(validationJSONObj["type"] === "required" && validationJSONObj["value"] === "false"){
                    logger.error("Inside not mandatory")
                    return true;
            }  
        }
        
        if(validationJSONObj["type"] === "maxLength"){
            charLimit = validationJSONObj["value"];
        }
        if(validationJSONObj["type"] === "regex"){
            //regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
            regex = new RegExp(validationJSONObj["value"]);
            //logger.error("regex value is - "+regex);
        }
    }
    
   if (sysInfo != null && parsedUserInfo["isReadOnly"]) {
    parsedSysInfo = JSON.parse(JSON.stringify(sysInfo));
       
    if (parsedUserInfo["isReadOnly"] === true) {      
      if (parsedUserInfo["sysAttribute"] === parsedSysInfo["sysAttribute"] && parsedUserInfo["value"] === parsedSysInfo["value"]) {
        return true;
          
      } else {
        msg = loggers.readErrorMessage("KYID105");
        logger.error("errorMessage is:"+ JSON.stringify(msg));
        addError(attrName, "en", msg.en);
        addError(attrName, "es", msg.es);
        return false;
      }
        
    } else if(parsedUserInfo["sysAttribute"] === parsedSysInfo["sysAttribute"]){
      return true;
    }
       
  } else {
        logger.error("Data in JSON: "+JSON.stringify(sysInfo));
        if(parsedUserInfo["fieldFormat"]!=null && parsedUserInfo["fieldFormat"]){
             logger.error("parsedSysInfo value is:"+parsedUserInfo["fieldFormat"]);
            if(parsedUserInfo["fieldFormat"] === "mobile"){
                 regex = new RegExp(validationJSONObj["value"]);            
            }
        }
        logger.error("REGEX is: " + regex);
        return isTextInputValueValid(parsedUserInfo["value"],charLimit,regex,attrName);
    }
}


function validateDateFieldValues(userInfo,validationArray,attrName){
    
    logger.error("**Inside validateDateFieldValues function**")
    var parsedUserInfo = JSON.parse(JSON.stringify(userInfo));
    var datevalue = parsedUserInfo["value"];
    var dateObj = new Date(datevalue);
    var today = new Date();
   // var dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    logger.error("datevalue in dATE is in "+ datevalue)
    
    for(var i=0;i<validationArray.length;i++){
        validationJSONObj = JSON.parse(JSON.stringify(validationArray[i]));

        if((datevalue == null || datevalue == undefined || !datevalue)){
           if(validationJSONObj["type"] === "required" && validationJSONObj["value"] === "false"){
                logger.error("Inside not mandatory")
                return true;
            }
        }
        
        if(validationJSONObj["type"] === "regex"){
            dateRegex = new RegExp(validationJSONObj["value"]);
        }
    }
    logger.error("Regex in date is: "+ dateRegex)
    logger.error("Regex validation in date is: "+ dateRegex.test(datevalue))
    if(isRequired(datevalue,attrName)){
        
       if(!dateRegex.test(datevalue)){
            logger.error("Regex validation in date2 is: "+ dateRegex.test(datevalue))
            msg = getValidationMessage(attrName,"regex")
            addError(attrName, "en", msg.enMSg);
            addError(attrName, "es", msg.esMSg);
            return false;
       }
     
        if(isNaN(dateObj.getTime())) {
            msg = getValidationMessage(attrName,"regex")
            addError(attrName, "en", msg.enMSg);
            addError(attrName, "es", msg.esMSg);
            return false;
        }
  
        if (dateObj > today) {
            msg = getValidationMessage(attrName,"regex")
            addError(attrName, "en", msg.enMSg);
            addError(attrName, "es", msg.esMSg);
            return false;
        }
        
        return true;        
     }  else{
        return false;
    }
}


function isMaxLengthReached(value, charLimit,attrName){
    
  if(value.length > charLimit){
    msg = getValidationMessage(attrName,"maxLength")
    addError(attrName, "en", msg.enMSg);
	addError(attrName, "es", msg.esMSg);
    return true;
  }
    return false;   
}


// Ensures that the value is not empty
function isRequired(value, attrName){
  if(!value){
    //logger.error("The attrName is:"+ attrName);
    msg = getValidationMessage(attrName,"required")
    addError(attrName, "en", msg.enMSg);
	addError(attrName, "es", msg.esMSg);
    return false;
  }
    
  if(value.length <= 0){
    msg = getValidationMessage(attrName,"required")
    addError(attrName, "en", msg.enMSg);
	addError(attrName, "es", msg.esMSg);
    return false;
  }   
  return true;
}


function isTextInputValueValid(value,limit,regex, attrName){
    var validatePhoneLib = require("KYID.2B1.Library.GenericUtils");
    
   
    if(isRequired(value, attrName)){
        logger.error("The attrName in function is:"+ attrName);
        if(limit!=null ){
            if(!isMaxLengthReached(value, limit, attrName)){
                 logger.error("The maxlength in function is:"+ limit);
                if(regex!=null){
                     logger.error("The regex in function is:"+ regex);
                    if(regex.test(value)){
                        logger.error("regex matches");
                         return true;
                     } else {
                            logger.error("regex failed");
                            msg = getValidationMessage(attrName,"regex")
                            logger.error("regex failed message "+JSON.stringify(msg));
                            logger.error("ERROR MESSAGE IS IN "+ msg.enMSg)
                            addError(attrName, "en", msg.enMSg);
                        	addError(attrName, "es", msg.esMSg);
                            return false;
                     }
                 } else {
                    return true;
                }
                
             } else {
                return false;
            }
        } else {
            logger.error("this is inside phone number section")
            if(regex!=null){
                var isPhoneValid = validatePhoneLib.validatePhoneNumber(value);
                logger.error("isPhoneValid is "+ isPhoneValid)
                if(isPhoneValid){
                   // logger.error("regex matches");
                    return true;
                } else {
                           msg = getValidationMessage(attrName,"regex")
                           addError(attrName, "en", msg.enMSg);
                           addError(attrName, "es", msg.esMSg);
                           return false;
                }
            } else {
                 return true;
             }
        }
        
     } else {
         return false;
     }  
}


function addError(attrName, language, Msg) {

    if (!errorMap[attrName]) {
        errorMap[attrName] = {};
    }
    if (!errorMap[attrName][language]) {
        errorMap[attrName][language] = [];
    }
    errorMap[attrName][language].push(Msg);
    logger.error("value of error" + JSON.stringify(errorMap));
}


function getValidationMessage(attrName, failedType){

    var result = null; 
    var validation = null;    

    try{
        result = openidm.query("managed/alpha_kyid_prerequisiteattributes", { "_queryFilter" : '/name eq "'+attrName+'"'});
        logger.error("The query Result is:"+ JSON.stringify(result));
        
            if(result.result.length === 0){
            return{
                enMsg: "Attribute not found",
                esMsg: "Atributo no encountrado"
            }
        }
            
        validation = result.result[0].validation || [];
        logger.error("The validation Result is:"+ JSON.stringify(validation));
            
        for(var i=0; i < validation.length; i++){
            var rule = validation[i];
            if(rule.type === failedType){
                return{
                    enMSg: rule.message && rule.message.en ? rule.message.en : "",
                    esMSg: rule.message && rule.message.es ? rule.message.es : "",
                };
            }
        }
    
    } catch (error){
        logger.error("Exception occured in getValidationMessage(), Exception - "+error);
        
    }
}


exports.validate = validate;
