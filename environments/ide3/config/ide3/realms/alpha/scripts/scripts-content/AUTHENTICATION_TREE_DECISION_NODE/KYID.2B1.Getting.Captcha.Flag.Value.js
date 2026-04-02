var V3Captcha = nodeState.get("V3Captcha")
logger.debug("Captchavalue:"+V3Captcha)
if(V3Captcha === "false")
{
    outcome = "false"
}
else{
outcome = "true";
}