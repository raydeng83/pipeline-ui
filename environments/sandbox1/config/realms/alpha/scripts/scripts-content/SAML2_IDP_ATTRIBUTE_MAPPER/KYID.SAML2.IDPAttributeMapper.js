/*
 * Copyright 2021-2022 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
 * This script returns a list of SAML Attribute objects for the IDP framework to insert into the generated Assertion.
 *
 * Defined variables:
 * session - SSOToken (1)
 *           The single sign-on session.
 * hostedEntityId - String (primitive).
 *                  The hosted entity ID.
 * remoteEntityId - String (primitive).
 *                  The remote entity ID.
 * realm - String (primitive).
 *         The name of the realm the user is authenticating to.
 * logger - Always present, the debug logger instance:
 *          https://backstage.forgerock.com/docs/am/7/scripting-guide/scripting-api-global-logger.html#scripting-api-global-logger.
 *          Corresponding log files will be prefixed with: scripts.SAML2_IDP_ATTRIBUTE_MAPPER
 * idpAttributeMapperScriptHelper - IdpAttributeMapperScriptHelper (2)
 *                                - An IdpAttributeMapperScriptHelper instance containing methods used for IDP attribute mapping.
 *
 * Throws SAML2Exception:
 *      - on failing to map the IDP attributes.
 *
 * Return - a list of SAML Attribute (3) objects.
 *
 * Class reference:
 * (1) SSOToken - https://backstage.forgerock.com/docs/am/7/apidocs/com/iplanet/sso/SSOToken.html.
 * (2) IdpAttributeMapperScriptHelper - https://backstage.forgerock.com/docs/am/7.2/apidocs/com/sun/identity/saml2/plugins/scripted/IdpAttributeMapperScriptHelper.html.
 * (3) Attribute - https://backstage.forgerock.com/docs/am/7/apidocs/com/sun/identity/saml2/assertion/Attribute.html.
 */

/**
 * Default SAML2 IDP Attribute Mapper.
 */

function getAttributes() {
    var frJava = JavaImporter(
        com.sun.identity.saml2.common.SAML2Exception
    );

    const debugMethod = "ScriptedIDPAttributeMapper.getAttributes:: ";

    try {

        if (!idpAttributeMapperScriptHelper.isSessionValid(session)) {
            logger.error(debugMethod + "Invalid session.");
            return null;
        }

        var configMap = idpAttributeMapperScriptHelper.getRemoteSPConfigAttributeMap(realm, remoteEntityId);
        logger.message(debugMethod + "Remote SP attribute map = {}", configMap);
        if (configMap == null || configMap.isEmpty()) {
            configMap = idpAttributeMapperScriptHelper.getHostedIDPConfigAttributeMap(realm, hostedEntityId);
            if (configMap == null || configMap.isEmpty()) {
                logger.message(debugMethod + "Configuration map is not defined.");
                //var attributes = new java.util.ArrayList();
                //attributes = getCustomAttributes();
                return getCustomAttributes();
                // return null;
            }
            logger.message(debugMethod + "Hosted IDP attribute map = {}", configMap);
        }

        var attributes = new java.util.ArrayList();
        var stringValueMap = new java.util.HashSet();
        var binaryValueMap;
        var localAttribute;

        // Don't try to read the attributes from the datastore if the ignored profile is enabled in this realm.
        if (!idpAttributeMapperScriptHelper.isIgnoredProfile(session, realm)) {
            try {
                // Resolve attributes to be read from the datastore.
                var stringAttributes = new java.util.HashSet();
                var binaryAttributes = new java.util.HashSet();
                var keyIter = configMap.keySet().iterator();
                while (keyIter.hasNext()) {
                    var key = keyIter.next();
                    localAttribute = configMap.get(key);
                    if (!idpAttributeMapperScriptHelper.isStaticAttribute(localAttribute)) {
                        if (idpAttributeMapperScriptHelper.isBinaryAttribute(localAttribute)) {
                            // add it to the list of attributes to treat as being binary
                            binaryAttributes.add(idpAttributeMapperScriptHelper.removeBinaryAttributeFlag(localAttribute));
                        } else {
                            stringAttributes.add(localAttribute);
                        }
                    }
                }

                if (!stringAttributes.isEmpty()) {
                    stringValueMap = idpAttributeMapperScriptHelper.getAttributes(session, stringAttributes);
                }
                if (!binaryAttributes.isEmpty()) {
                    binaryValueMap = idpAttributeMapperScriptHelper.getBinaryAttributes(session, binaryAttributes);
                }
            } catch (error) {
                logger.error(debugMethod + "Error accessing the datastore. " + error);
                //continue to check in ssotoken.
            }
        }

        var keyIter = configMap.keySet().iterator();
        while (keyIter.hasNext()) {
            var key = keyIter.next()
            var nameFormat = null;
            var samlAttribute = key;
            localAttribute = configMap.get(key);
            // check if samlAttribute has format nameFormat|samlAttribute
            var samlAttributes = String(new java.lang.String(samlAttribute));
            var tokens = samlAttributes.split('|');

            if (tokens.length > 1) {
                nameFormat = tokens[0];
                samlAttribute = tokens[1];
            }

            var attributeValues = new java.util.HashSet();
            if (idpAttributeMapperScriptHelper.isStaticAttribute(localAttribute)) {
                // Remove the static flag before using it as the static value
                localAttribute = idpAttributeMapperScriptHelper.removeStaticAttributeFlag(localAttribute);
                attributeValues = new java.util.HashSet([localAttribute]);
                logger.message(debugMethod + "Adding static value {} for attribute named {}", localAttribute, samlAttribute);
            } else {
                if (idpAttributeMapperScriptHelper.isBinaryAttribute(localAttribute)) {
                    // Remove the flag as not used for lookup
                    localAttribute = idpAttributeMapperScriptHelper.removeBinaryAttributeFlag(localAttribute);
                    attributeValues = idpAttributeMapperScriptHelper.getBinaryAttributeValues(samlAttribute, localAttribute,
                        binaryValueMap);
                } else {
                    if (stringValueMap != null && !stringValueMap.isEmpty()) {
                        attributeValues = stringValueMap.get(localAttribute);
                    } else {
                        logger.message(debugMethod + "{} string value map was empty or null.", localAttribute);
                    }
                }

                // If all else fails, try to get the value from the users ssoToken
                if (attributeValues == null || attributeValues.isEmpty()) {
                    logger.message(debugMethod + "User profile does not have value for {}, checking SSOToken.", localAttribute);
                    attributeValues = new java.util.HashSet(idpAttributeMapperScriptHelper.getPropertySet(session, localAttribute));
                }
            }

            if (attributeValues == null || attributeValues.isEmpty()) {
                logger.message(debugMethod + "{} not found in user profile or SSOToken.", localAttribute);
            } else {
                attributes.add(idpAttributeMapperScriptHelper.createSAMLAttribute(samlAttribute, nameFormat, attributeValues));
            }
        }

        attributes.addAll(getCustomAttributes());
        return attributes;

    } catch (error) {
        logger.error(debugMethod + "Error mapping IDP attributes. " + error);
        throw new frJava.SAML2Exception(error);
    }
}


function getCustomAttributes() {
    var frJava = JavaImporter(
        com.sun.identity.saml2.common.SAML2Exception
    );

    logger.error("Remote Entity ID Passed: " + remoteEntityId);
    var attributes = new java.util.ArrayList();

    const debugMethod = "ScriptedCustomIDPAttributeMapper.getAttributes:: ";
    //logger.error("Type of: "+typeof session.getProperty("appClaims") + " | "+JSON.stringify(session.getProperty("appClaims")).length);

    try {
        if (remoteEntityId.localeCompare(systemEnv.getProperty("esv.logout.app.url")) == 0) {
            //if(true) {

            var customSet;
            var upn = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn";
            var idpauthtime = "http://schemas.chfs.ky.gov/kog/v1/identity/claims/idpauthtime";
            var ssoAppIds = "http://schemas.chfs.ky.gov/kog/v1/identity/claims/sso_current_clients";
            /*logger.error("upn: "+session.getProperty("upn"));
            logger.error("AuthenticationInstant: "+session.getProperty("AuthenticationInstant"));
            logger.error("ssoclientsids: "+session.getProperty("ssoclientsids"));*/
            
            customSet = new java.util.TreeSet();
            customSet.add(session.getProperty("upn"));
            attributes.add(
                idpAttributeMapperScriptHelper.createSAMLAttribute(
                    upn, null, customSet));

            customSet = new java.util.TreeSet();
            customSet.add(session.getProperty("AuthenticationInstant"));
            attributes.add(
                idpAttributeMapperScriptHelper.createSAMLAttribute(
                    idpauthtime, null, customSet));

            customSet = new java.util.TreeSet();
            var ssoclientsids = session.getProperty("ssoclientsids");
            var ssoclientsidsArray = ssoclientsids.toString().split(",");
            if (ssoclientsidsArray.length > 1) {
                for (var i = 0; i < ssoclientsidsArray.length; i++) {
                    customSet.add(ssoclientsidsArray[i]);
                }
            } else {
                customSet.add(ssoclientsids);
            }
            attributes.add(
                idpAttributeMapperScriptHelper.createSAMLAttribute(
                    ssoAppIds, null, customSet));

            return attributes;

        } else {
            if (JSON.stringify(session.getProperty("appClaims")).length > 2) {
                logger.error("Before clearing session properties");
                logger.error("Values are -" + session.getProperty("appClaims"));
                logger.error("Type of session: "+typeof session);
                logger.error("reading session: "+session);
                logger.error("Parsing session new: "+session.getProperties());

                var claims = session.getProperty("appClaims");
                var response = JSON.parse(claims);

                for (var key in response) {
                    //logger.error("Claims are: "+typeof response[key]+" | "+key+"="+response[key]);
                    var customSet = new java.util.TreeSet();
                    if (!Array.isArray(response[key])) {
                        if(response[key] !== null && response[key] !== 'undefined') {
                            customSet.add(response[key].toString());
                            attributes.add(
                                idpAttributeMapperScriptHelper.createSAMLAttribute(
                                    key, null, customSet));
                        }

                    } else {
                        var rolesArray = response[key];
                        var customSet = new java.util.TreeSet();
                        // logger.error("Total no of roles=" + rolesArray.length);
                        for (var i = 0; i < rolesArray.length; i++) {
                            var role = rolesArray[i];
                            customSet.add(role.toString());
                        }
                        attributes.add(
                            idpAttributeMapperScriptHelper.createSAMLAttribute(
                                key, null, customSet))
                    }
                }
              
               //Adding idpauthtype and idpauthtime in app claims
               if(session.getProperty("idpauthtype") && session.getProperty("idpauthtype")!=null){
                  	var idpauthtype = session.getProperty('idpauthtype').split(",");
                    logger.error("idpauthtype: "+idpauthtype.toString());
                    var customSet = new java.util.TreeSet();
                    for (var i = 0; i < idpauthtype.length; i++) {
                      var type = idpauthtype[i];
                      customSet.add(type.toString());
                    }
                    attributes.add(idpAttributeMapperScriptHelper.createSAMLAttribute("http://schemas.chfs.ky.gov/kog/v1/identity/claims/idpauthtype", null, customSet))
                }
                
                if(session.getProperty("idpauthtime") && session.getProperty("idpauthtime")!=null){
                    var idpauthtime = session.getProperty('idpauthtime');
                    logger.error("idpauthtime: "+idpauthtime);
                    var customSet = new java.util.TreeSet();
                    customSet.add(idpauthtime.toString());
                    attributes.add(idpAttributeMapperScriptHelper.createSAMLAttribute("http://schemas.chfs.ky.gov/kog/v1/identity/claims/idpauthtime", null, customSet));
                }
               
                logger.error("After clearing session properties");
                session.setProperty("appClaims", "");
                logger.error("Values are -" + session.getProperty("appClaims"));
                return attributes;

            } else {
                return null;
            }

        }

    } catch (error) {
        logger.error(debugMethod + "Error mapping IDP attributes. " + error);
        throw new frJava.SAML2Exception(error);
    }
}

getAttributes();