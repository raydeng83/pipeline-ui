(function () {
   
    var utils = getUtils();

  
    utils.setScopeClaimsMap({
        profile: [
            'name',
            'family_name',
            'given_name',
            'zoneinfo',
            'locale',
            'roles',
            'groups',
            'mail',
        ],
        email: ['email'],
        address: ['address'],
        phone: ['phone_number'],
        
    });

    utils.setClaimResolvers({
      
        family_name: utils.getUserProfileClaimResolver('sn'),
        given_name: utils.getUserProfileClaimResolver('givenname'),
        name: utils.getUserProfileClaimResolver('cn'),
        zoneinfo: utils.getUserProfileClaimResolver('preferredtimezone'),
        locale: utils.getUserProfileClaimResolver('preferredlocale'),
        email: utils.getUserProfileClaimResolver('mail'),
        
        
        
       // roles: utils.getUserProfileClaimResolver('fr-idm-effectiveRole'),
        groups:function(){
            var fr=JavaImporter(com.sun.identity.idm.IdType);
            var groups=[];
            identity.getMemberships(fr.IdType.GROUP).toArray().forEach(function(group){
        groups.push(group.getAttribute('cn'));
        });
            return groups;
        },
        roles:function()
            {
                 var roles=identity.getAttribute("fr-idm-effectiveRole").toArray();
                 var rolenames=roles.map(role=>JSON.parse(role).name);
                return rolenames;
            },
    

      //  groups:utils.getUserProfileClaimResolver('fr-idm-effectiveGroups'),
        mail: utils.getUserProfileClaimResolver('mail'),
        address: utils.getAddressClaimResolver(
            
            utils.getUserProfileClaimResolver('postaladdress')
        ),
        phone_number: utils.getUserProfileClaimResolver('telephonenumber')
    });
    
 
   // const roles = rolesJson.map(role => JSON.parse(role).name);

    
    function getUtils () {
       
        var frJava = JavaImporter(
            org.forgerock.oauth2.core.exceptions.InvalidRequestException,
            org.forgerock.oauth2.core.UserInfoClaims,
            org.forgerock.openidconnect.Claim,

            java.util.LinkedHashMap,
            java.util.ArrayList
        );

      
        var scopeClaimsMap;

        
        var claimResolvers;

     
        function setScopeClaimsMap(params) {
            scopeClaimsMap = params;
        }

        
        function setClaimResolvers(params) {
            claimResolvers = params;
        }

        function getUserProfileClaimResolver (attributeName) {
           
            function resolveClaim(claim) {
                var userProfileValue;

                if (identity) {
                    userProfileValue = getClaimValueFromSet(claim, identity.getAttribute(attributeName));

                    if (userProfileValue && !userProfileValue.isEmpty()) {
                        if (!claim.getValues() || claim.getValues().isEmpty() || claim.getValues().contains(userProfileValue)) {
                            return userProfileValue;
                        }
                    }
                }
            }

            return resolveClaim;
        }

      
        function getAddressClaimResolver (resolveClaim) {
         
            function resolveAddressClaim(claim) {
                var claimValue = resolveClaim(claim);
                var addressObject;

                if (isClaimValueValid(claimValue)) {
                    addressObject = new frJava.LinkedHashMap();

                    addressObject.put('formatted', claimValue);

                    return addressObject;
                }
            }

            return resolveAddressClaim;
        }

     
        function getEssentialClaimResolver (resolveClaim) {
      
            function resolveEssentialClaim(claim) {
                var claimValue = resolveClaim(claim);

                if (claim.isEssential() && !isClaimValueValid(claimValue)) {
                    throw new frJava.InvalidRequestException('Could not provide value for essential claim: ' + claim.getName());
                }

                return claimValue;
            }

            return resolveEssentialClaim;
        }

       
        function resolveAnyClaim (claim) {
            if (claim.getValues().size() === 1) {
                return claim.getValues().toArray()[0];
            }
        }

        // UTILITIES

     
        function getClaimValueFromSet (claim, set) {
            if (set && set.size()) {
                if (set.size() === 1) {
                    return set.toArray()[0];
                } else {
                    return set;
                }
            } else if (logger.warningEnabled()) {
                logger.warning('OIDC Claims script. Got an empty set for claim: ' + claim.getName());
            }
        }

        function isClaimValueValid (claimValue) {
            if (typeof claimValue === 'undefined' || claimValue === null) {
                return false;
            }

            return true;
        }

        // CLAIM PROCESSING

        /**
         * Constructs and returns an object populated with the computed claim values
         * and the requested scopes mapped to the claim names.
         * @returns {org.forgerock.oauth2.core.UserInfoClaims} The object to be returned to the authorization server.
         * @see {@link https://backstage.forgerock.com/docs/am/7/apidocs/org/forgerock/oauth2/core/UserInfoClaims.html}.
         * @see RESULTS section for the use of this function.
         */
        function getUserInfoClaims () {
            return new frJava.UserInfoClaims(getComputedClaims(), getCompositeScopes());
        }

        
        function getComputedClaims () {
            /**
             * Creates a complete list of claim objects from:
             * the claims derived from the scopes,
             * the claims provided by the authorization server,
             * and the claims requested by the client.
             * @returns {java.util.ArrayList}
             * Returns a complete list of org.forgerock.openidconnect.Claim objects available to the script.
             * @see {@link https://backstage.forgerock.com/docs/am/7/apidocs/org/forgerock/openidconnect/Claim.html} for the claim object details.
             */
            function getClaims() {
                /**
                 * Returns a list of claim objects for the requested scopes.
                 * Uses the scopeClaimsMap configuration option to derive the claim names;
                 * no other properties of a claim derived from a scope are populated.
                 * @returns {java.util.ArrayList}
                 * A list of org.forgerock.openidconnect.Claim objects derived from the requested scopes.
                 * @see {@link https://backstage.forgerock.com/docs/am/7/apidocs/org/forgerock/openidconnect/Claim.html} for the claim object details.
                 */
                function convertScopeToClaims() {
                    var claims = new frJava.ArrayList();

                    scopes.toArray().forEach(function (scope) {
                        if (String(scope) !== 'openid' && scopeClaimsMap[scope]) {
                            scopeClaimsMap[scope].forEach(function (claimName) {
                                claims.add(new frJava.Claim(claimName));
                            });
                        }
                    });

                    return claims;
                }

                var claims = new frJava.ArrayList();

                claims.addAll(convertScopeToClaims());
                claims.addAll(claimObjects);
                claims.addAll(requestedTypedClaims);

                return claims;
            }

           
            function computeClaim(claim) {
                var resolveClaim;
                var message;

                try {
                    resolveClaim = claimResolvers[claim.getName()] || resolveAnyClaim;

                    return resolveClaim(claim);
                } catch (e) {
                    message = 'OIDC Claims script exception. Unable to resolve OIDC Claim. ' + e;

                    if (String(e).indexOf('org.forgerock.oauth2.core.exceptions.InvalidRequestException') !== -1) {
                        throw e;
                    }

                    if (logger.warningEnabled()) {
                        logger.warning(message);
                    }
                }
            }

            var computedClaims = new frJava.LinkedHashMap();

            getClaims().toArray().forEach(function (claim) {
                var claimValue = computeClaim(claim);

                if (isClaimValueValid(claimValue)) {
                    computedClaims.put(claim.getName(), claimValue);
                } else {
                    
                    computedClaims.remove(claim.getName());
                }
            });

            return computedClaims;
        }

        
        function getCompositeScopes () {
            var compositeScopes = new frJava.LinkedHashMap();

            scopes.toArray().forEach(function (scope) {
                var scopeClaims = new frJava.ArrayList();

                if (scopeClaimsMap[scope]) {
                    scopeClaimsMap[scope].forEach(function (claimName) {
                        scopeClaims.add(claimName);
                    });
                }

                if (scopeClaims.size()) {
                    compositeScopes.put(scope, scopeClaims);
                }
            });

            return compositeScopes;
        }

        // PUBLIC METHODS

        return {
            setScopeClaimsMap: setScopeClaimsMap,
            setClaimResolvers: setClaimResolvers,
            getUserProfileClaimResolver: getUserProfileClaimResolver,
            getAddressClaimResolver: getAddressClaimResolver,
            getEssentialClaimResolver: getEssentialClaimResolver,
            getUserInfoClaims: getUserInfoClaims
        };
    }

 
    var userInfoClaims = utils.getUserInfoClaims();

   

    return userInfoClaims;
}());


