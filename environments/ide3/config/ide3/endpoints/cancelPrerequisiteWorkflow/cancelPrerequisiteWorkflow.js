  (function () {
  
    var requestId = request.content.requestId;
    var queryParams = {
          "_action": "cancel"
       }
     var response = openidm.action("iga/governance/requests/"+requestId, "POST",{},queryParams);
     if (response){
         return {response};
      }
      else{return {code: -1};}
  }

  ());