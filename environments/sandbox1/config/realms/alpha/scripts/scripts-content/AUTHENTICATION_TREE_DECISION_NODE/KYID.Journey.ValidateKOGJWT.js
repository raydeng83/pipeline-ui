/**
 * Script: KYID.Journey.ValidateKOGJWT
 * Description: Validate JWT From Query Param           
 * Date: 9th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Validate JWT From Query Param",
    script: "Script",
    scriptName: "KYID.Journey.ValidateKOGJWT",
    timestamp: dateTime,
    signingKey: "esv.kyid.jwt.signingkey", 
    missingSigningKeyMsg: "Missing signing key config",
    issuer: "esv.kyid.jwt.issuer",
    missingIssuer: "Missing Issuer Url config",
    missingNonceInSesion: "Missing nonce value in session",
    missingEmailInSession: "Missing emailaddress value in session",
    aud: "esv.kyid.jwt.aud",
    missingAudience: "Missing Audience config", 
    inValidJWTClaims: "Invalid JWT claims", 
    errorGettingJWT: "Error getting kogjwt", 
    expiredJWT: "JWT is Expired",
    emailMismatch: "JWT & sessiom email value doesn't match",
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False",
};


//Global Variables
var kogjwt = null;
var signingKey = null;
var issuer = null;
var audience = null;
var missingInputs = [];

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
    }
};


/*
  Name: isMandatoryConfigParamsPresent()
  Description: Checks whether mandatory configuration parameters are present or not.
  Returns: If mandatory configuration parameters are present, returns True. 
           Otherwise, returns False.
 */
function isMandatoryConfigParamsPresent(){
    
    if(systemEnv.getProperty(nodeConfig.signingKey) && systemEnv.getProperty(nodeConfig.signingKey)!=null){
         signingKey = systemEnv.getProperty(nodeConfig.signingKey);
    } else {
        missingInputs.push(nodeConfig.missingSigningKeyMsg);
    }
    
    if(systemEnv.getProperty(nodeConfig.issuer) && systemEnv.getProperty(nodeConfig.issuer)!=null){
        issuer = systemEnv.getProperty(nodeConfig.issuer);
    } else {
        missingInputs.push(nodeConfig.missingIssuer);
    }

    if(systemEnv.getProperty(nodeConfig.aud) && systemEnv.getProperty(nodeConfig.aud)!=null){
        audience = systemEnv.getProperty(nodeConfig.aud);
    } else {
        missingInputs.push(nodeConfig.missingAudience);
    }
    
    if(missingInputs.length>0){
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
        return false;
        
    } else {
        return true;
    }
}


/*
  Name: validateJWT()
  Description: Read JWT token from query parameter and validates signature
  Returns: If valid JWT present, returns JWT claims. 
           Otherwise, returns False.
 */
function validateJWT(){
    
    var nbf = null; //Not valid before time in JWT
    var exp = null; //Expiration Time in JWT
    var currentTimestamp = new Date();
    var epochCurrentTimestamp = Math.ceil(Date.parse(currentTimestamp)/1000);
    
    try{
        if(requestParameters && requestParameters.get("kogjwt") && requestParameters.get("kogjwt") !=null) {
            kogjwt = String(requestParameters.get("kogjwt").get(0));
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+kogjwt);
        }
    } catch(error){
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+error);
        action.goTo(nodeOutcome.ERROR); 
    }

   if (kogjwt !== null && kogjwt.length > 0) {

      var jwtData = {
          jwtType: "SIGNED",
          jwt: kogjwt,
          issuer: issuer, 
          audience: audience, 
          signingKey: signingKey  
      };
        logger.error("jwtData: "+JSON.stringify(jwtData))
      try{ 
        // returns a map of JWT claims or null if required claims are missing
        // throws NoSuchSecretException if verification key is missing
         var jwtClaims = jwtValidator.validateJwtClaims(jwtData);
         if(jwtClaims && jwtClaims!=null){
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+JSON.stringify(jwtClaims));
             return jwtClaims;
             
         } else {
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.inValidJWTClaims);
             action.goTo(nodeOutcome.ERROR); 
         }  
      
      } catch(error) {
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+error); 
        action.goTo(nodeOutcome.ERROR); 
      }
      
    } else {
      nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.errorGettingJWT);
      action.goTo(nodeOutcome.ERROR);
    }
}


function main(){
    if(!isMandatoryConfigParamsPresent()){
        action.goTo(nodeOutcome.ERROR);
    }
     else {
         var sessionEmail = null;
         var jwtEmail = null;
         var nonce = null;
         var gotoURL = null;
         var GUIDJSONobject = {};
         try{
             var jwtClaims = validateJWT();
             if(jwtClaims && JSON.stringify(jwtClaims).length > 2) {
                  // retrieve and log some JWT claim values 
                  var parsedClaims = JSON.parse(JSON.stringify(jwtClaims));
                  jwtEmail = parsedClaims.subject;
                  nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+jwtEmail);
                 
                  if(typeof existingSession !== 'undefined'){
                      //logger.error("All the available props in session are: "+JSON.stringify(existingSession));
                         if(existingSession.get("emailaddress") && existingSession.get("emailaddress")!=null) {
                            sessionEmail = existingSession.get("emailaddress");
                             nodeLogger.error("Email value in session: "+sessionEmail)
                             
                                if(sessionEmail.localeCompare(jwtEmail)==0){
                                    nodeLogger.error("Email value in session matches with JWT emailaddress")
                                    nonce = jwtClaims.get("nonce");
                                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                     +"::"+nodeConfig.scriptName+"::"+nonce);
                                    
                                    if(existingSession.get("nonce") && existingSession.get("nonce")!=null) {
                                        GUIDJSONobject = JSON.parse(existingSession.get("nonce"));
                                        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                         +"::"+nodeConfig.scriptName+"::"+GUIDJSONobject[nonce]);
                                        gotoURL = GUIDJSONobject[nonce];
                                        //var redirect = callbacksBuilder.redirectCallback(gotoURL, null, "GET");
                                        var redirect = callbacksBuilder.redirectCallback(decodeURIComponent(gotoURL), null, "GET"); //**** Tableau Create Account Issue Fix 31/01 :: 183821, 183826, 183801 ****/
                                        action.goTo("redirect");
                                        //nodeState.putShared("jwtSuccessURL",gotoURL);
                                        //action.goTo(nodeOutcome.SUCCESS);
                                    
                                    } else {
                                         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingNonceInSesion);
                                         action.goTo(nodeOutcome.ERROR);
                                     } 
                                  
                                 } else {
                                     nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                         +"::"+nodeConfig.scriptName+"::"+nodeConfig.emailMismatch);
                                     action.goTo(nodeOutcome.ERROR);
                                 } 
                           
                           } else {
                                 nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingEmailInSession);
                                 action.goTo(nodeOutcome.ERROR);
                           } 
                      
                     } else {
                         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+typeof existingSession);
                         action.goTo(nodeOutcome.ERROR);
                     }        
                      
             } else {
                 nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+JSON.stringify(jwtClaims).length);
                 action.goTo(nodeOutcome.ERROR);
             }
             
         } catch(error) {
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+error);
              action.goTo(nodeOutcome.ERROR);
         }
     }  
}

//Main Function
main();


