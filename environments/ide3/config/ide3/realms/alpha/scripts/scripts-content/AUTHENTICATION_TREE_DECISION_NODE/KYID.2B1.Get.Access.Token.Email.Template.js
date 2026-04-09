/*
 * Copyright Â© 2024 Ping Identity Corporation
 *
 * This code is to be used exclusively in connection with Ping Identity Corporation
 * software or services.
 * Ping Identity Corporation only offers such software or services to legal entities
 * who have entered into a binding license agreement with Ping Identity Corporation.
*/

var nodeConfig = {
  nodeName: "Get Access Token",
  tenantFqdnEsv: systemEnv.getProperty("esv.sa.accesstoken.tenantfqdnesv"),
  accountIdEsv: systemEnv.getProperty("esv.sa.accesstoken.accountid"),
  privateKeyEsv: "esv.frserviceaccount.key",
  accessTokenStateField: "idmAccessToken",
  maxAttempts: 3,
  scope: "fr:idm:*",
  serviceAccountClientId: "service-account",
  jwtValiditySeconds: 120,
};

var nodeLogger = {
  debug: function (message) {
    logger.message("***" + nodeConfig.nodeName + " " + message);
  },
  warning: function (message) {
    logger.warning("***" + nodeConfig.nodeName + " " + message);
  },
  error: function (message) {
    logger.error("***" + nodeConfig.nodeName + " " + message);
  },
};

var nodeOutcomes = {
  SUCCESS: "Success",
  ERROR: "Error",
};

var javaImports = JavaImporter(
  org.forgerock.openam.auth.node.api.Action,
  org.forgerock.json.jose.builders.JwtBuilderFactory,
  org.forgerock.json.jose.jwt.JwtClaimsSet,
  org.forgerock.json.jose.jws.JwsAlgorithm,
  org.forgerock.json.jose.jws.SignedJwt,
  org.forgerock.json.jose.jws.handlers.SecretRSASigningHandler,
  org.forgerock.json.jose.jwk.RsaJWK,
  javax.crypto.spec.SecretKeySpec,
  org.forgerock.secrets.SecretBuilder,
  org.forgerock.secrets.keys.SigningKey,
  java.time.temporal.ChronoUnit,
  java.time.Clock,
  java.util.UUID
);
// nodeState.putShared(nodeConfig.accessTokenStateField, null); // nullifying the Access Token

function getKeyFromJwk(issuer, jwk) {
  var privateKey = javaImports.RsaJWK.parse(jwk).toRSAPrivateKey();

  var secretBuilder = new javaImports.SecretBuilder();

  secretBuilder
    .secretKey(privateKey)
    .stableId(issuer)
    .expiresIn(
      5,
      javaImports.ChronoUnit.MINUTES,
      javaImports.Clock.systemUTC()
    );
  return new javaImports.SigningKey(secretBuilder);
}

function getAssertionJwt(accountId, privateKey, audience, validity) {
  var signingHandler = new javaImports.SecretRSASigningHandler(
    getKeyFromJwk(accountId, privateKey)
  );

  var iat = new Date().getTime();
  var exp = new Date(iat + validity * 1000);

  var jwtClaims = new javaImports.JwtClaimsSet();

  jwtClaims.setIssuer(accountId);
  jwtClaims.setSubject(accountId);
  jwtClaims.addAudience(audience);
  jwtClaims.setExpirationTime(exp);
  jwtClaims.setJwtId(javaImports.UUID.randomUUID());

  var jwt = new javaImports.JwtBuilderFactory()
    .jws(signingHandler)
    .headers()
    .alg(javaImports.JwsAlgorithm.RS256)
    .done()
    .claims(jwtClaims)
    .build();

  return jwt;
}

function getAccessToken(accountId, privateKey, tenantFqdn, maxAttempts) {
  var response = null;
  var accessToken = null;
  var tokenEndpoint = "https://"
    .concat(tenantFqdn)
    .concat("/am/oauth2/access_token");

  nodeLogger.debug("Getting Access Token from endpoint " + tokenEndpoint);

  var assertionJwt = getAssertionJwt(
    accountId,
    privateKey,
    tokenEndpoint,
    nodeConfig.jwtValiditySeconds
  );

  if (!assertionJwt) {
    nodeLogger.error("Error getting assertion JWT");
    return null;
  }

  nodeLogger.debug("Got assertion JWT " + assertionJwt);

  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    nodeLogger.debug("Attempt " + (attempt + 1) + " of " + maxAttempts);
    try {
      var request = new org.forgerock.http.protocol.Request();
      request.setUri(tokenEndpoint);
      request.setMethod("POST");
      request
        .getHeaders()
        .add("Content-Type", "application/x-www-form-urlencoded");

      var params = "grant_type="
        .concat(
          encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")
        )
        .concat("&client_id=")
        .concat(encodeURIComponent(nodeConfig.serviceAccountClientId))
        .concat("&assertion=")
        .concat(encodeURIComponent(assertionJwt))
        .concat("&scope=")
        .concat(encodeURIComponent(nodeConfig.scope));

      request.setEntity(params);
      response = httpClient.send(request).get();
      if (response) {
        break;
      }
    } catch (e) {
      nodeLogger.error(
        "Failure calling access token endpoint: " +
          tokenEndpoint +
          " exception:" +
          e
      );
    }
  }

  if (!response) {
    nodeLogger.error("Bad response");
    return null;
  }

  if (response.getStatus().getCode() !== 200) {
    nodeLogger.error(
      "Unable to acquire Access Token. HTTP Result: " + response.getStatus()
    );
    return null;
  }

  try {
    var responseJson = response.getEntity().getString();
    nodeLogger.debug("Response content " + responseJson);
    var oauth2response = JSON.parse(responseJson);
    accessToken = oauth2response.access_token;
    nodeLogger.debug("Access Token acquired: " + accessToken);
    return accessToken;
  } catch (e) {
    nodeLogger.error("Error getting access token from response: " + e);
  }

  return null;
}

(function () {
  try {
    nodeLogger.debug("Node starting");

    var accessToken = nodeState.get(nodeConfig.accessTokenStateField);

    if (accessToken) {
      nodeLogger.debug("Access token already present: continuing");
      action = javaImports.Action.goTo(nodeOutcomes.SUCCESS).build();
      return;
    }

    var tenantFqdn = nodeConfig.tenantFqdnEsv;
    if (!tenantFqdn) {
      nodeLogger.debug("Couldn't get FQDN from esv " + nodeConfig.tenantFqdnEsv);
      action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
      return;
    }

    var accountId = nodeConfig.accountIdEsv;
    if (!accountId) {
      nodeLogger.debug(
        "Couldn't get service account id from esv " + nodeConfig.accountIdEsv
      );
      action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
      return;
    }

    var privateKey = systemEnv.getProperty(nodeConfig.privateKeyEsv);
    if (!privateKey) {
      nodeLogger.debug(
        "Couldn't get private key from esv " + nodeConfig.privateKey
      );
      action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
      return;
    }

    accessToken = getAccessToken(
      accountId,
      privateKey,
      tenantFqdn,
      nodeConfig.maxAttempts
    );

    if (!accessToken) {
      nodeLogger.debug("Failed to get access token");
      action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
      return;
    }

    nodeLogger.debug("Success - adding token to transient state");
    
    nodeState.putShared(nodeConfig.accessTokenStateField, accessToken);
    nodeLogger.debug("*************** Get Access Token SCript ****************" + accessToken);
    
    action = javaImports.Action.goTo(nodeOutcomes.SUCCESS).build();
  } catch (e) {
    nodeLogger.error("Exception encountered " + e);
    action = javaImports.Action.goTo(nodeOutcomes.ERROR).build();
    return;
  }
})();