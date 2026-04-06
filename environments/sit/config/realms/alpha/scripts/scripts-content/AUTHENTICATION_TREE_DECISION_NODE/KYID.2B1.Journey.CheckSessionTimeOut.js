if (requestCookies.get("getIssuerTime")){
    var getIssuerTime = requestCookies.get("getIssuerTime");
    var currentdateTime = new Date().toISOString();
    var transactionTimeOut = systemEnv.getProperty("esv.transactiontimeout") - 30000
    logger.debug("Printing transactionTimeout" +transactionTimeOut);
    logger.debug(" KYID.2B1.Journey.CheckSessionTimeOut getIssuerTime is" +getIssuerTime);
    
    
    //var timediff = currentdateTime.getTime() - getIssuerTime.getTime()
    var timediff = new Date(currentdateTime) - new Date(getIssuerTime) 
    logger.debug(" KYID.2B1.Journey.CheckSessionTimeOuttimediff is" +timediff);
    
    // var authTimeoutRedirect = "false";
    if (timediff > transactionTimeOut ) {
        logger.debug("timedifference is more than" + systemEnv.getProperty("esv.transactiontimeout")/60000 + " mins");
        nodeState.putShared("TransactionSessionOver","True");
        //var defaultURL = systemEnv.getProperty("esv.default.app.url")
        //var redirect = callbacksBuilder.redirectCallback(defaultURL, null, "GET");
        //action.goTo("redirect").putSessionProperty("authTimeoutRedirect","true");;
        //action.goTo("true").putSessionProperty("authTimeoutRedirect","true");
        action.goTo("TransactionSessionOver")
    
    } else {
       logger.debug("timedifference is less than" + systemEnv.getProperty("esv.transactiontimeout")/60000 + " mins");
       nodeState.putShared("TransactionSessionOver","False");
       action.goTo("TransactionSessionOver")
    }
    }
    else {
        nodeState.putShared("TransactionSessionOver","False");
        action.goTo("TransactionSessionOver")  
    }