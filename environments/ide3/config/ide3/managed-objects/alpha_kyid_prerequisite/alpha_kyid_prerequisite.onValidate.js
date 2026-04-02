function validateExpiryDateFrequencyType(expirydatefrequencytype,expiryaction) {
 	var allowedValuesFreqType = ["dayOfMonth", "numberofDays", "oneTimeDueDate"]; 
    var allowedExpActions = ["login.reVerify","removeRole","dontIssueClaims","none"];
  	
    if (!allowedValuesFreqType.includes(expirydatefrequencytype)) {
        throw { code: 400, message: 'Allowed values for expirydatefrequencytype are - dayOfMonth || numberofDays || oneTimeDueDate'};
        return false;
    }
  
    else if (!allowedExpActions.includes(expiryaction)) {
        throw { code: 400, message: 'Allowed values for expiryaction are - login.reVerify || removeRole || dontIssueClaims || none'};
        return false;
    }
  
}

if ((object.expirydatefrequencytype && object.expirydatefrequencytype != null) && (object.expiryaction && object.expiryaction != null)) {
    validateExpiryDateFrequencyType(object.expirydatefrequencytype,object.expiryaction)
}
