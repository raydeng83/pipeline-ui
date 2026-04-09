var config = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.otp.template",
      idmEndpoint: "external/email",
      idmAction: "sendTemplate",
      templateID: "kyidsendinvitation",
      nodeName: "kyid.send.email.otp.template"
      
  };
  
  var NodeOutcome = {
    PASS: "success",
    FAIL: "failure"
  };
  
  function sendMail(username, hotp, mail, givenName,sn,rolename) {
     try {
          var params =  new Object();
          params.templateName = config.templateID;
          params.to =  mail;
          params.object = {
              "givenName": givenName,
              "sn" : sn,
              "otp": hotp,
              "rolename": rolename
          };
    
          openidm.action(config.idmEndpoint, config.idmAction, params);
           var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
          logger.debug(transactionid+"Email OTP Notification sent successfully to "+mail)
          return NodeOutcome.PASS;
      }
      catch (e){
          logger.error("Failed" + e);
          var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
          logger.error(transactionid+"Send Email OTP Notification Failed for"+mail)
          return NodeOutcome.FAIL;
      }
  }
      
  //var username = nodeState.get("username");
  //var objectAttributes = nodeState.get("objectAttributes")
  var username = nodeState.get("mail");
  //var givenName =objectAttributes.get("givenName"); 
  var givenName =nodeState.get("givenName");
  var sn =nodeState.get("sn");
  var mail = nodeState.get("mail");
  var applicationRequestID = nodeState.get("applicationRequestID");
  var rolename = nodeState.get("rolename");
  //var mail =objectAttributes.get("mail");  
  // nodeState.putShared("mail",mail);
  // nodeState.putShared("sn",sn);
  // nodeState.putShared("givenName",givenName);
  var hotp = "https://openam-commkentsb2-use1-sandbox.id.forgerock.io/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_Registration_Acceptance&requestId="+applicationRequestID
    
  nodeState.putShared("hotp",hotp);
  
  outcome = sendMail(username, hotp, mail, givenName,sn,rolename);
  