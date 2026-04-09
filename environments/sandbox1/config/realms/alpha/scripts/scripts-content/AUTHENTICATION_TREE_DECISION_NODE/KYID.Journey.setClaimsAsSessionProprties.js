				logger.error("Script KYID.Journey.setClaimsAsSessionProprties started");
				var claims = nodeState.get("tokenResponse");
				logger.error("claims from shared state::"+claims);
				var response = JSON.parse(claims);


                var ab = action.goTo("True"); 
                ab.putSessionProperty("http://schemas.chfs.ky.gov/kog/v1/identity/claims/idpauthtype", nodeState.get("idpauthtype"));
                ab.putSessionProperty("http://schemas.chfs.ky.gov/kog/v1/identity/claims/idpauthtime", nodeState.get("idpauthtime"));
                
                var keys = Object.keys(response);
                for (var i = 0; i < keys.length; i++) {
                  var key = keys[i];
                  var value = response[key];
                  if (value === null || typeof value === "undefined") value = "";
                  else if (Array.isArray(value)) {
                          value=value[0];
                  }
                  else if (typeof value === "object") value = JSON.stringify(value);
                  else value = String(value);
                  ab.putSessionProperty(String(key), String(value));
                }
                
                ab;
