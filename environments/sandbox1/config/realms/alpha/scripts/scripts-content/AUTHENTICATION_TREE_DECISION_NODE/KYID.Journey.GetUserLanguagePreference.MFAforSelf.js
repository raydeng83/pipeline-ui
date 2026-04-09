/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

  var SelflangCookie ="en"
  var UserLanguagePreference = requestCookies.get("UserLanguagePreference");
    //   if(UserLanguagePreference === "en-US"){
    //       SelflangCookie ="en"
    //   }
    //   else{
    //       SelflangCookie ="es"
          
    //   }


    //switch the default languate to En instead es
    if(UserLanguagePreference === "es-MX"){
        SelflangCookie ="es"
    }
    else{
        SelflangCookie ="en"
        
    }
  nodeState.putShared("SelflangCookie", SelflangCookie)
  
  outcome = "true";
  