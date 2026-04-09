/*
 * Copyright 2024-2025 Ping Identity Corporation. All Rights Reserved
 *
 * This code is to be used exclusively in connection with Ping Identity
 * Corporation software or services. Ping Identity Corporation only offers
 * such software or services to legal entities who have entered into a
 * binding license agreement with Ping Identity Corporation.
 */
/*
  - Data made available by nodes that have already executed is available in the nodeState variable.
  - Use the action object to set the outcome of the node.
 */
logger.error("here it starts")
logger.error("esv.ad.api.private.key" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.api.private.key"));
logger.error("esv.ad.api.sert.sp" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.api.sert.sp"));
logger.error("esv.ad.external.creds" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.external.creds"));
logger.error("esv.ad.internal.creds" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.internal.creds"));
logger.error("esv.ad.internal.kyide.creds" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.internal.kyide.creds"));
logger.error("esv.ad.internal.kytest.creds" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.internal.kytest.creds"));
logger.error("esv.ad.internal.kytrain.creds" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.internal.kytrain.creds"));
logger.error("esv.ad.internal.kyuat.creds" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.internal.kyuat.creds"));
logger.error("esv.ad.internal.prod.creds" + ":::::::::::::::" + systemEnv.getProperty("esv.ad.internal.prod.creds"));
logger.error("esv.frserviceaccount.key" + ":::::::::::::::" + systemEnv.getProperty("esv.frserviceaccount.key"));
logger.error("esv.idassert.le" + ":::::::::::::::" + systemEnv.getProperty("esv.idassert.le"));
logger.error("esv.idassert" + ":::::::::::::::" + systemEnv.getProperty("esv.idassert"));
logger.error("esv.ig.kerberos.encrypt.key" + ":::::::::::::::" + systemEnv.getProperty("esv.ig.kerberos.encrypt.key"));
logger.error("esv.kyid.grecaptcha.key" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.grecaptcha.key"));
logger.error("esv.kyid.grecaptcha.secret" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.grecaptcha.secret"));
logger.error("esv.kyid.jwt.signingkey" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.jwt.signingkey"));
logger.error("esv.kyid.kogapi.isauthz.token.clientcredentials" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.kogapi.isauthz.token.clientcredentials"));
logger.error("esv.kyid.kogapi.isauthz.token.clientid" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.kogapi.isauthz.token.clientid"));
logger.error("esv.kyid.kogapi.token.clientcredentials" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.kogapi.token.clientcredentials"));
logger.error("esv.kyid.kogapi.token.clientid" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.kogapi.token.clientid"));
logger.error("esv.kyid.kogapi.token.dev.clientcredentials" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.kogapi.token.dev.clientcredentials"));
logger.error("esv.kyid.kogapi.token.dev.clientid" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.kogapi.token.dev.clientid"));
logger.error("esv.kyid.mtls.cert" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.mtls.cert"));
logger.error("esv.kyid.v2grecaptcha.key" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.v2grecaptcha.key"));
logger.error("esv.kyid.v2grecaptcha.secret" + ":::::::::::::::" + systemEnv.getProperty("esv.kyid.v2grecaptcha.secret"));
logger.error("esv.le.test" + ":::::::::::::::" + systemEnv.getProperty("esv.le.test"));
logger.error("esv.mailserver.hostname" + ":::::::::::::::" + systemEnv.getProperty("esv.mailserver.hostname"));
logger.error("esv.mailserver.username" + ":::::::::::::::" + systemEnv.getProperty("esv.mailserver.username"));
logger.error("esv.ping.protect.client.secret" + ":::::::::::::::" + systemEnv.getProperty("esv.ping.protect.client.secret"));
logger.error("esv.pushnotificationservice.accesskeyid" + ":::::::::::::::" + systemEnv.getProperty("esv.pushnotificationservice.accesskeyid"));
logger.error("esv.pushnotificationservice.accesskeysecret" + ":::::::::::::::" + systemEnv.getProperty("esv.pushnotificationservice.accesskeysecret"));
logger.error("esv.pushnotificationservice.apns" + ":::::::::::::::" + systemEnv.getProperty("esv.pushnotificationservice.apns"));
logger.error("esv.pushnotificationservice.gcm" + ":::::::::::::::" + systemEnv.getProperty("esv.pushnotificationservice.gcm"));
logger.error("esv.rcs.secret.external" + ":::::::::::::::" + systemEnv.getProperty("esv.rcs.secret.external"));
logger.error("esv.rcs.secret.internal" + ":::::::::::::::" + systemEnv.getProperty("esv.rcs.secret.internal"));
logger.error("esv.saml.signing.cert" + ":::::::::::::::" + systemEnv.getProperty("esv.saml.signing.cert"));
logger.error("esv.smtp.password" + ":::::::::::::::" + systemEnv.getProperty("esv.smtp.password"));
logger.error("esv.symantec.private.cert" + ":::::::::::::::" + systemEnv.getProperty("esv.symantec.private.cert"));
logger.error("esv.symantec.public.cert" + ":::::::::::::::" + systemEnv.getProperty("esv.symantec.public.cert"));
logger.error("esv.token.signing.cert" + ":::::::::::::::" + systemEnv.getProperty("esv.token.signing.cert"));
logger.error("esv.twilio.authorizationcode" + ":::::::::::::::" + systemEnv.getProperty("esv.twilio.authorizationcode"));
logger.error("esv.twilio.sid" + ":::::::::::::::" + systemEnv.getProperty("esv.twilio.sid"));
logger.error("here it end")

action.goTo("true");