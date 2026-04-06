 var messages = {
     code: {
         mismatchErrorCode:"ERR-INP-PWD-001",
         genericErrorCode: "ERR-INP-PWD-004",
         firstNameErrorCode: "ERR-INP-PWD-005",
         lastNameErrorCode: "ERR-INP-PWD-006",
         previoudPasswordErrorCode: "ERR-INP-PWD-007",
         firstNameConsecutiveErrorCode: "ERR-INP-PWD-008",
         lastNameConsecutiveErrorCode: "ERR-INP-PWD-009"
     },
     en: {
         matchErrorMsg: "Passwords do not match",
         emptyErrorMsg: "Password cannot be empty",
         lengthErrorMsg: "Password must be at least 8 characters",
         lowercaseErrorMsg: "Password must contain at least one lowercase letter",
         uppercaseErrorMsg: "Password must contain at least one uppercase letter",
         numberErrorMsg: "Password must contain at least one number",
         valid: "Password is valid",
         firstNameErrorMsg: "Password must not contain your first name.",
         lastNameErrorMsg: "Password must not contain your last name.",
         previoudPasswordErrorMessage: "Password must differ from your last 24 passwords.",
         firstNameConsecutiveMsg: "Password contains 3 or more consecutive characters from first name",
         lastNameConsecutiveMsg: "Password contains 3 or more consecutive characters from last name"
     },
     es: {
         matchErrorMsg: "Las contraseñas no coinciden o son nulas",
         emptyErrorMsg: "La contraseña no puede estar vacía",
         lengthErrorMsg: "La contraseña debe tener al menos 8 caracteres",
         lowercaseErrorMsg: "La contraseña debe contener al menos una letra minúscula",
         uppercaseErrorMsg: "La contraseña debe contener al menos una letra mayúscula",
         numberErrorMsg: "La contraseña debe contener al menos un número",
         valid: "La contraseña es válida",
         firstNameErrorMsg: "No incluye tu nombre",
         lastNameErrorMsg: "No incluye tu apellido"
     }
 };


 function validatePassword(nodeState, password, newpassword) {

     logger.error("validatePassword script started ");


     var lang = messages['en'];
     var code = messages['code']; // Default to English if locale is not supported
     logger.error("lang " + lang);
     var errors = {};
     var firstName = "";
     var lastName = "";


     // // Check if password and confirmPassword are the same and not null
     if (password !== newpassword) {
         errors["code"] = code.mismatchErrorCode;
         errors["message"] = lang.matchErrorMsg;
         errors["outcome"] = false;
         return errors;
     }

     // Check if password is empty
     if (!password || password.trim() === "") {
         errors["code"] = code.genericErrorCode;
         errors["message"] = lang.emptyErrorMsg;
         errors["outcome"] = false;
         return errors;
     }


     // Check if password is at least 8 characters
     if (password.length < 8 || password.length > 64) {
         errors["code"] = code.genericErrorCode;
         errors["message"] = lang.lengthErrorMsg;
         errors["outcome"] = false;
         return errors;
     }

     // Check for at least one lowercase letter
     if (!/[a-z]/.test(password)) {
         errors["code"] = code.genericErrorCode;
         errors["message"] = lang.lowercaseErrorMsg;
         errors["outcome"] = false;
         return errors;
     }

     //     // Check for at least one uppercase letter
     if (!/[A-Z]/.test(password)) {
         errors["code"] = code.genericErrorCode;
         errors["message"] = lang.uppercaseErrorMsg;
         errors["outcome"] = false;
         return errors;
     }

     // Check for at least one number
     if (!/[0-9]/.test(password)) {
         errors["code"] = code.genericErrorCode;
         errors["message"] = lang.numberErrorMsg;
         errors["outcome"] = false;
         return errors;
     }


     try {


         if (nodeState.get("givenName")) {
             firstName = nodeState.get("givenName");
         }

         if (nodeState.get("sn")) {
             lastName = nodeState.get("sn");
         } else {
             lastName = nodeState.get("lastName");
         }

         //If firstname and last name is not present in the nodestate getting it from IDM
         if (firstName === null || firstName === undefined || firstName.trim() === '' || lastName === null || lastName === undefined || lastName.trim() === '') {
             logger.error("first name or last nameis null or undefined or blank" + firstName + " " + lastName);
             if (nodeState.get("KOGID") && nodeState.get("KOGID") != null) {
                 var KOGID = nodeState.get("KOGID");
                 logger.error("Fetching user details for KOGID: " + KOGID);
                 var response = openidm.query("managed/alpha_user", {
                     "_queryFilter": "/userName eq \"" + KOGID + "\""
                 }, ["givenName", "sn"]);
                 if (response.result.length == 1) {
                     var idmUser = response.result[0];
                     if (idmUser.givenName != null) {
                         firstName = idmUser.givenName.toLowerCase();
                     }
                     if (idmUser.sn != null) {
                         lastName = idmUser.sn.toLowerCase();
                     }
                     if (idmUser.frIndexedString1 != null) {
                         var upn = idmUser.frIndexedString1
                         nodeState.putShared("UPN", upn);
                     }
                 }
             }
         } else {
             logger.error("first name or last name is not present in the idm");
         }


         if (firstName !== null && firstName !== undefined && firstName.trim() !== '') {
             logger.error("firstName is not null");
             if (password.toLowerCase().includes(firstName.toLowerCase())) {
                 logger.error("firstName match");
                 errors["code"] = code.firstNameErrorCode;
                 errors["message"] = lang.firstNameErrorMsg;
                 errors["outcome"] = false;
                 errors["firstNameError"] = true;
                 return errors;
             }
         }

         if (lastName !== null && lastName !== undefined && lastName.trim() !== '') {
             if (password.toLowerCase().includes(lastName.toLowerCase())) {
                 logger.error("lastName match");
                 errors["code"] = code.lastNameErrorCode;
                 errors["message"] = lang.lastNameErrorMsg;
                 errors["outcome"] = false;
                 errors["lastNameError"] = true;
                 return errors;
             }
                     
         }
         
          if (checkPasswordAgainstNames(password, firstName)===true) {
             errors["code"] = code.firstNameConsecutiveErrorCode;
             errors["message"] = lang.firstNameConsecutiveMsg;
             errors["outcome"] = false;
             return errors;
         } 
        
         if (checkPasswordAgainstNames(password, lastName)===true) {
             errors["code"] = code.lastNameConsecutiveErrorCode;
             errors["message"] = lang.lastNameConsecutiveMsg;
             errors["outcome"] = false;
             return errors;
         } else {
             errors["message"] = lang.valid;
             errors["outcome"] = true;
             return errors;
         }

     } catch (error) {
         logger.error("error " + error);
     }

 }

 function checkPasswordAgainstNames(password, name) {
   logger.error("in checkPasswordAgainstNames ");
     password = password.toLowerCase();
     name = name.toLowerCase();

     // Check for 3 or more consecutive characters from firstName
     for (var i = 0; i <= name.length - 3; i++) {
         var substring = name.substr(i, 3);
         if (password.includes(substring)) {
             return true;
         }
     }
     return false;
 }

 function getPreviousTwentyFourPassswordErrorMessage() {
     logger.error("in getPreviousTwentyFourPassswordErrorMessage ");

     var lang = messages['en'];
     var code = messages['code']; // Default to English if locale is not supported
     var errors = {};

     errors["code"] = code.previoudPasswordErrorCode;
     errors["message"] = lang.previoudPasswordErrorMessage;
     errors["outcome"] = false;
     return errors;

 }


 exports.validatePassword = validatePassword;
 exports.getPreviousTwentyFourPassswordErrorMessage = getPreviousTwentyFourPassswordErrorMessage;