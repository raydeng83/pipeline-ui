if (requestCookies.get("getIssuerTime")){
    var getIssuerTime = requestCookies.get("getIssuerTime");
    var currentdateTime = new Date().toISOString();
    var transactionTimeOut = systemEnv.getProperty("esv.transactiontimeout") - 30000
    logger.error("Printing transactionTimeout" +transactionTimeOut);
    logger.error(" KYID.Journey.CheckSessionTimeOut getIssuerTime is" +getIssuerTime);
    
    
    //var timediff = currentdateTime.getTime() - getIssuerTime.getTime()
    var timediff = new Date(currentdateTime) - new Date(getIssuerTime) 
    logger.error(" KYID.Journey.CheckSessionTimeOut timediff is" +timediff);
    
    // var authTimeoutRedirect = "false";
    if (timediff > transactionTimeOut ) {
        logger.error("timedifference is more than" + systemEnv.getProperty("esv.transactiontimeout")/60000 + " mins");
        nodeState.putShared("TransactionSessionOver","True");
        //var defaultURL = systemEnv.getProperty("esv.default.app.url")
        //var redirect = callbacksBuilder.redirectCallback(defaultURL, null, "GET");
        //action.goTo("redirect").putSessionProperty("authTimeoutRedirect","true");;
        //action.goTo("true").putSessionProperty("authTimeoutRedirect","true");
        action.goTo("TransactionSessionOver")
    
    } else {
       logger.error("timedifference is less than" + systemEnv.getProperty("esv.transactiontimeout")/60000 + " mins");
       nodeState.putShared("TransactionSessionOver","False");
       action.goTo("TransactionSessionOver")
    }
    }
    else {
        nodeState.putShared("TransactionSessionOver","False");
        action.goTo("TransactionSessionOver")  
    }