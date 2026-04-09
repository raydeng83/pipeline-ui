/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

  var idpauthtype;
  var fr = JavaImporter(
      org.forgerock.openam.auth.node.api.Action,
      com.sun.identity.authentication.spi.AuthLoginException,
      com.sun.identity.sm.SessionAttributeSchema
  );
var resultIDPAuthType = []
  resultIDPAuthType.push("pwd")
  resultIDPAuthType.push("mfa")
  resultIDPAuthType.push("tel")

  
  var goTo = org.forgerock.openam.auth.node.api.Action.goTo;
  
  action = goTo('true').putSessionProperty('idpauthtype', resultIDPAuthType).build();
  
  
  
  
  