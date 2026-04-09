var config = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.accountcreate.template",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyidaccountcreate"      
  };
  
  var NodeOutcome = {
    PASS: "success",
    FAIL: "failure"
  };
  
  function sendMail(mail, givenName,sn) {
     try {
          var params =  new Object();
          params.templateName = config.templateID;
          params.to =  mail;
          params.object = {
              "givenName": givenName,
              "sn" : sn
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
      

  var givenName =nodeState.get("givenName");
  var sn =nodeState.get("lastName");
  var mail = nodeState.get("verifiedPrimaryEmail");
  outcome = sendMail(mail, givenName,sn);
  