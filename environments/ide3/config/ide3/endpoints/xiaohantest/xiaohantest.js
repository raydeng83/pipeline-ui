  (function () {
    if (request.method === 'create') {
      // POST
      return {};
    } else if (request.method === 'read') {
      // GET
      return {};
    } else if (request.method === 'update') {
      // PUT
      return {};
    } else if (request.method === 'patch') {
      return {};
    } else if (request.method === 'delete') {
      return {};
    }
    throw { code: 500, message: 'Unknown error' };
  }());

/*
{
    "UserAuthorizations": [
        {
            "ApplicationName": "Account Management",
            "RoleName": "EditAccountProfile",
            "ADGroupName": null,
            "OriginalDelegatorKOGID": null,
            "CurrentDelegatorKOGID": null,
            "OrgTypeName": null,
            "KOGOrgId": 0,
            "OrgSourceUniqueID": null,
            "OrgName": null,
            "BusinessKeyTypeName": null,
            "BusinessKeyId": null,
            "BusinessKeyValue": null,
            "LastRecertificationDate": "6/27/2022 2:16:18 PM",
            "CreatedBy": "Account Management",
            "CreatedDate": "6/27/2022 2:16:18 PM"
        },
        {
            "ApplicationName": "Account Management",
            "RoleName": "EditContactInformation",
            "ADGroupName": null,
            "OriginalDelegatorKOGID": null,
            "CurrentDelegatorKOGID": null,
            "OrgTypeName": null,
            "KOGOrgId": 0,
            "OrgSourceUniqueID": null,
            "OrgName": null,
            "BusinessKeyTypeName": null,
            "BusinessKeyId": null,
            "BusinessKeyValue": null,
            "LastRecertificationDate": "6/27/2022 2:16:18 PM",
            "CreatedBy": "Account Management",
            "CreatedDate": "6/27/2022 2:16:18 PM"
        },
        {
            "ApplicationName": "Account Management",
            "RoleName": "EditSecurityQuestion",
            "ADGroupName": "ADGN_AccountManagement_EditSecurityQuestionRole",
            "OriginalDelegatorKOGID": null,
            "CurrentDelegatorKOGID": null,
            "OrgTypeName": null,
            "KOGOrgId": 0,
            "OrgSourceUniqueID": null,
            "OrgName": null,
            "BusinessKeyTypeName": null,
            "BusinessKeyId": null,
            "BusinessKeyValue": null,
            "LastRecertificationDate": "6/27/2022 2:16:18 PM",
            "CreatedBy": "Account Management",
            "CreatedDate": "6/27/2022 2:16:18 PM"
        },
        {
            "ApplicationName": "SYS4_KHBE_Worker_Portal",
            "RoleName": "Case Worker",
            "ADGroupName": null,
            "OriginalDelegatorKOGID": null,
            "CurrentDelegatorKOGID": null,
            "OrgTypeName": null,
            "KOGOrgId": 0,
            "OrgSourceUniqueID": null,
            "OrgName": null,
            "BusinessKeyTypeName": null,
            "BusinessKeyId": null,
            "BusinessKeyValue": null,
            "LastRecertificationDate": "3/24/2026 2:43:31 PM",
            "CreatedBy": "Help Desk",
            "CreatedDate": "3/24/2026 2:43:31 PM"
        }
    ],
    "ResponseStatus": 0,
    "MessageResponses": null
}

*/