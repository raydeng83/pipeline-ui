(function () {

  logger.error("===REQUEST in mutualExclusiveRoleCheckEndpoint=== " + JSON.stringify(request));

  const EXCEPTION_UNEXPECTED_ERROR = {
    code: "KYID-UNR",
    content: "An unexpected error occured while processing the request."
  };

  const EXCEPTION_UNSUPPORTED_OPERATION = {
    code: "KYID-USO",
    content: ""
  };

  const SUCCESS_MESSAGE = {
    code: "KYID-SUS",
    content: "Success"
  };

  const RESPONSE_CODE_ERROR = "2";
  const RESPONSE_CODE_FAILURE = "1";
  const RESPONSE_CODE_SUCCESS = "0";

  const REQUEST_POST = "create";
  const REQUEST_GET = "read";

  const ACTION_INVITE = "1";
  const ACTION_SEARCH = "4";

  const ENDPOINT_NAME = "endpoint/mutualExclusiveRoleCheckEndpoint";
  const MO_OBJECT_NAME = "managed/alpha_kyid_enrollment_access_policy/";

  //view just for dev
  const VIEW_SUBMIT_ROLE_REQUEST = "submitrolerequest";
  const VIEW_AVAILABLE_ACCESS_ROLE_REQUEST = "availableaccessrolerequest";

  const transactionIdauditLogger = context.transactionId && context.transactionId.transactionId && context.transactionId.transactionId.value
    ? context.transactionId.transactionId.value : "";
  const sessionRefIDauditLogger = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
    ? context.oauth2.rawInfo.sessionRefId : "";

  const sessionDetailsauditLogger = sessionRefIDauditLogger ? { sessionRefId: sessionRefIDauditLogger } : {};

  /**
   * getTxnId - Reads transaction id from HTTP headers (if present)
   */
  function getTxnId(context) {
    logger.error(" mutualExclusiveRoleCheckEndpoint getTxnId: extracting x-forgerock-transactionid");
    return (context.http && context.http.headers && context.http.headers["x-forgerock-transactionid"]) || "";
  }

  /**
   * generateResponse - Standardizes response structure
   */
  function generateResponse(responseCode, transactionId, message, payload) {
    logger.error("mutualExclusiveRoleCheckEndpoint generateResponse called: responseCode=" + responseCode + ", txn=" + (transactionId || ""));
    const FALLBACK = {
      code: "UNERROR",
      content: "An unexpected error occured while processing the request."
    };

    var res = {
      responseCode: "" + responseCode,
      transactionId: transactionId || "",
      message: message || FALLBACK
    };

    if (payload !== undefined) {
      res.payload = payload;
    }

    return res;
  }

  /**
   * logException - Centralized error logging
   */
  function logException(exception) {
    try {
      logger.error("mutualExclusiveRoleCheckEndpoint logException: " + JSON.stringify(exception));
    } catch (stringifyErr) {
      logger.error("mutualExclusiveRoleCheckEndpoint logException: failed to stringify exception: " + stringifyErr);
      logger.error("mutualExclusiveRoleCheckEndpoint logException (raw): " + exception);
    }
  }

  /**
   * logDebug - log level
   */
  function logDebug(transactionId, endpointName, functionName, message) {
    logger.info(JSON.stringify({
      transactionId: transactionId,
      endpointName: endpointName,
      functionName: functionName,
      message: message
    }));
  }

  /**
   * getRequestContent - Extracts and validates request content
   */
  function getRequestContent(context, request, endpoint) {
    logger.error("mutualExclusiveRoleCheckEndpoint getRequestContent: entering for endpoint=" + endpoint);

    if (request.content) {
      logger.error("mutualExclusiveRoleCheckEndpoint getRequestContent: request.content present");
      logDebug(context.transactionId, endpoint, "getRequestContent", "Input parameter: " + JSON.stringify(request.content));
    }
    if (request.additionalParameters) {
      logger.error("mutualExclusiveRoleCheckEndpoint getRequestContent: request.additionalParameters present");
      logDebug(context.transactionId, endpoint, "getRequestContent", "Input parameter: " + JSON.stringify(request.additionalParameters));
    }

    const EXCEPTION_INVALID_REQUEST = { code: "KYID-INE", content: "" };

    let invalidRequestException = {
      code: RESPONSE_CODE_FAILURE,
      level: "ERROR",
      message: { code: EXCEPTION_INVALID_REQUEST.code, content: "" },
      logger: "" + endpoint,
      timestamp: ""
    };

    function fail(msg) {
      logger.error("mutualExclusiveRoleCheckEndpoint getRequestContent: validation failed: " + msg);
      invalidRequestException.message.content = msg;
      invalidRequestException.timestamp = new Date().toISOString();
      throw invalidRequestException;
    }

    try {
      if (request.content) {
        if (!request.content.payload) {
          fail('Invalid request. Missing parameter(s): "request.content.payload"');
        }
        if (request.content.action === undefined || request.content.action === null || request.content.action === "") {
          fail('Invalid request. Missing parameter(s): "request.content.action"');
        }

        var actionVal = ("" + request.content.action).trim();
        
        logger.error("mutualExclusiveRoleCheckEndpoint getRequestContent: actionVal=" + actionVal);

        if (actionVal === ACTION_SEARCH || Number(actionVal) === Number(ACTION_SEARCH)) {
          if (request.content.view === undefined || request.content.view === null || ("" + request.content.view).trim() === "") {
            fail('Invalid request. Missing parameter(s): "request.content.view"');
          }

          //var view = ("" + request.content.view).toLowerCase(); // extract view from request input
          var view = request.content.view.toLowerCase();
          logger.error("getRequestContent: view=" + view);

          // // NEW: allow AvailableAccessRoleRequest view, keep roles[] validation as-is
          // if (view !== VIEW_SUBMIT_ROLE_REQUEST && view !== VIEW_AVAILABLE_ACCESS_ROLE_REQUEST) {
          //   fail('Invalid request. Unsupported view "' + request.content.view + '".');
          // }

          var pld = request.content.payload || {};
          if (!Array.isArray(pld.roles) || pld.roles.length === 0) {
            fail('Invalid request. Missing/invalid parameter(s) in payload for view "submitRoleRequest": "roles" must be a non-empty array.');
          }

          for (var i = 0; i < pld.roles.length; i++) {
            var r = pld.roles[i] || {};
            var appId = r.applicationId || null;
            var roleId = r.roleId || null;

            if (!appId || !roleId) {
              fail('Invalid request. Each roles[] item must contain "application_id" and "role_id". Invalid at index ' + i + ".");
            }
          }
        }

        logDebug(context.transactionId, endpoint, "getRequestContent", "Response: " + JSON.stringify(request.content));
        return request.content;

      } else if (request.additionalParameters) {
        logger.error("mutualExclusiveRoleCheckEndpoint getRequestContent: using request.additionalParameters: " + JSON.stringify(request.additionalParameters));
        return request.additionalParameters;

      } else {
        fail('Invalid request. Missing parameter(s): "request.content"');
      }
    } catch (error) {
      logger.error("mutualExclusiveRoleCheckEndpoint getRequestContent: caught error");
      logException(error);
      throw error;
    }
  }

  /**
   * isNonEmptyArray - Simple guard for arrays with at least one item
   */
  function isNonEmptyArray(a) {
    logger.error("mutualExclusiveRoleCheckEndpoint isNonEmptyArray called");
    return Array.isArray(a) && a.length > 0;
  }

  /**
   * normalizeRoles - Normalizes incoming roles[] into consistent strings
   * PA: orgId is commented , need more clarity
   */
  function normalizeRoles(roles) {
    logger.error("mutualExclusiveRoleCheckEndpoint normalizeRoles: input roles=" + JSON.stringify(roles));
    var out = [];
    (roles || []).forEach(function (r, idx) {
      if (!r) {
        logger.error("mutualExclusiveRoleCheckEndpoint normalizeRoles: skipping null role at index " + idx);
        return;
      }
      var appId = r.applicationId || null;
      var roleId = r.roleId || null;
      // var orgId = r.orgId || null; // orgId commented
      if (appId && roleId) out.push({ applicationId: "" + appId, roleId: "" + roleId });
    });
    logger.error("mutualExclusiveRoleCheckEndpoint normalizeRoles: normalized out=" + JSON.stringify(out));
    return out;
  }

  /**
   * findUserIdByEmail - Resolves a userId by email
   */
  function findUserIdByEmail(email) {
    logger.error("findUserIdByEmail: email=" + email);
    var q = openidm.query("managed/alpha_user", { _queryFilter: 'mail eq "' + email + '"' });
    if (q && q.result && q.result.length > 0) {
      logger.error("findUserIdByEmail: found _id=" + q.result[0]._id);
      return q.result[0]._id;
    } else {
      logger.error("findUserIdByEmail: no user found for email=" + email);
      return null;
    }
  }

  /**
   * getLexIdForUser - Fetches lexId for a given user via custom_identity reference
   * Logs each decision point to help debug missing identity linkage.
   */
  function getLexIdForUser(userId) {
    logger.error("mutualExclusiveRoleCheckEndpoint getLexIdForUser: userId=" + userId);

    var usr = openidm.read("managed/alpha_user/" + userId, null, ["custom_identity/*"]);
    if (usr && usr.custom_identity && usr.custom_identity._refResourceId) {
      var usrIdentityID = usr.custom_identity._refResourceId;
      logger.error("mutualExclusiveRoleCheckEndpoint getLexIdForUser: usrIdentityID=" + usrIdentityID);

      var q = openidm.query("managed/alpha_kyid_user_identity", {
        _queryFilter: '_id eq "' + usrIdentityID + '"'
      });

      if (q && q.result && q.result.length > 0) {
        logger.error("getLexIdForUser: lexId=" + (q.result[0].lexId || null));
        return q.result[0].lexId || null;
      } else {
        logger.error("mutualExclusiveRoleCheckEndpoint getLexIdForUser: no identity record for _id=" + usrIdentityID);
        return null;
      }

    } else {
      logger.error("mutualExclusiveRoleCheckEndpoint getLexIdForUser: missing custom_identity for userId=" + userId);
      return null;
    }
  }

  /**
   * getAllAccountsForLexId - Finds all accounts/userIds connected to a lexId
   */
  function getAllAccountsForLexId(lexId) {
    logger.error("mutualExclusiveRoleCheckEndpoint getAllAccountsForLexId: lexId=" + lexId);

    // Find all user with this lexId
    var userIdentities = openidm.query(
      "managed/alpha_kyid_user_identity",
      { _queryFilter: 'uuid eq "' + lexId + '"' },
      ["*", "account/*"]
    );

    var userIds = [];
    var identityResults = (userIdentities && userIdentities.result) ? userIdentities.result : [];

    logger.error("mutualExclusiveRoleCheckEndpoint getAllAccountsForLexId: identityResults.length=" + identityResults.length);

    for (var i = 0; i < identityResults.length; i++) {
      var ident = identityResults[i] || {};
      var accounts = ident.account || [];

      for (var j = 0; j < accounts.length; j++) {
        var a = accounts[j];
        if (!a) {
          continue;
        }

        if (a._refResourceId) {
          userIds.push(a._refResourceId);
        }
        else if (a.userId) {
          userIds.push(a.userId);
        }
        else if (a._ref) {
          var parts = ("" + a._ref).split("/");
          userIds.push(parts[parts.length - 1]);
        }
      }
    }

    var seen = {};
    var distinct = [];
    for (var k = 0; k < userIds.length; k++) {
      var id = userIds[k];
      if (!id || seen[id]) {
        continue;
      }
      seen[id] = true;
      distinct.push(id);
    }

    logger.error("getAllAccountsForLexId: distinctUserIds=" + JSON.stringify(distinct));
    return distinct;
  }

  /**
   * getActiveAccessForUser - Pulls active access for a userId
   * NOTE: orgId commented
   */
  function getActiveAccessForUser(userId) {
    logger.error("getActiveAccessForUser: userId=" + userId);

    var q = openidm.query("managed/alpha_kyid_access", {
      _queryFilter: 'userIdentifier eq "' + userId + '" AND recordState eq "0"'
    });

    var ent = [];
    (q.result || []).forEach(function (a) {
      ent.push({
        applicationId: a.appIdentifier || null,
        roleId: a.roleIdentifier || null,
        // orgId: a.orgId || null, // orgId commented
        sourceUserId: userId
      });
    });

    var normalized = ent
      .filter(function (e) { return e.applicationId && e.roleId; })
      .map(function (e) {
        return {
          applicationId: e.applicationId,
          roleId: e.roleId,
          sourceUserId: e.sourceUserId
        };
      });

    logger.error("getActiveAccessForUser: normalizedEntitlements=" + JSON.stringify(normalized));
    return normalized;
  }

  function loadPolicyFlagsForRole(roleId) {
    logger.error("loadPolicyFlagsForRole: roleId=" + roleId);

    var MELevel = { identityLevelME: false, orgLevelME: false };

    var roleObj = openidm.read("managed/alpha_role/" + roleId, null, ["accessPolicy/*"]);
    if (!roleObj || !roleObj.accessPolicy) {
      logger.error("loadPolicyFlagsForRole: missing accessPolicy for roleId=" + roleId);
      return MELevel;
    }

    var policyId = roleObj.accessPolicy._refResourceId || null;
    if (!policyId) {
      logger.error("loadPolicyFlagsForRole: missing policyId for roleId=" + roleId);
      return MELevel;
    }

    var policy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + policyId);
    if (!policy) {
      logger.error("loadPolicyFlagsForRole: policy read returned null for policyId=" + policyId);
      return MELevel;
    }

    // TEST ONLY: force identity-level mutual exclusion check ON
    MELevel.identityLevelME = true;
    logger.error("loadPolicyFlagsForRole: flags=" + JSON.stringify(MELevel));
    return MELevel;
  }

  /**
   * getEffectiveEvaluationMode - Decides whether to evaluate at Account vs Identity level
   */
  function getEffectiveEvaluationMode(requestedRoles, payload) {
    logger.error("getEffectiveEvaluationMode: payload=" + JSON.stringify(payload));

    // if (payload.userId && !payload.lexId) {
    //   // return { MElevelEvaluated: "Account", orgScoped: false };
    //   return { MElevelEvaluated: "Account" }; // org level commented
    // }

    var allIdentity = false;
    // var orgLevel = false; // org level 

    requestedRoles.forEach(function (r) {
      var f = loadPolicyFlagsForRole(r.roleId);
      if (f.identityLevelME) {
        allIdentity = true;
      }
      // if (f.orgLevelME) { orgLevel = true; } // org level commented
    });

    if (allIdentity) {
      // return { MElevelEvaluated: "Identity", orgScoped: orgLevel };
      return { MElevelEvaluated: "Identity" }; // org level commented
    } else {
      // return { MElevelEvaluated: "Account", orgScoped: orgLevel };
      return { MElevelEvaluated: "Account" }; // org level commented
    }
  }

  /**
   * buildMERulesIndexForRequestedRoles - Builds lookup of requestedrole and their mutual ex roles
   */
  function buildMERulesIndexForRequestedRoles(requestedRoles) {
    logger.error("buildMERulesIndexForRequestedRoles: requestedRoles=" + JSON.stringify(requestedRoles));

    var idx = {};

    requestedRoles.forEach(function (r) {
      var set = {};

      var roleObj = openidm.read("managed/alpha_role/" + r.roleId, null, ["accessPolicy/*"]);
      var accessPolicyId = roleObj && roleObj.accessPolicy ? roleObj.accessPolicy._refResourceId : null;

      if (!accessPolicyId) {
        logger.error("buildMERulesIndexForRequestedRoles: no accessPolicyId for roleId=" + r.roleId);
        idx["" + r.roleId] = set;
        return;
      }

      var policy = openidm.read(
        "managed/alpha_kyid_enrollment_access_policy/" + accessPolicyId,
        null,
        ["mutuallyExclusiveRole/*"]
      );

      // var arr = (policy && Array.isArray(policy.mutuallyExclusiveRole)) ? policy.mutuallyExclusiveRole
      //   : (policy && Array.isArray(policy.mutuallyExclusiveRoles)) ? policy.mutuallyExclusiveRoles
      //     : [];

      var arr = (policy && Array.isArray(policy.mutuallyExclusiveRole)) ? policy.mutuallyExclusiveRole : [];

      arr.forEach(function (x) {
        var rid = x && (x._refResourceId || (x._ref ? ("" + x._ref).split("/").pop() : null));
        // if (rid) set["" + rid] = true;
        if (rid) set[rid] = true; // rid is found store in set map entry
      });

      //idx["" + r.roleId] = set;
      idx[r.roleId] = set;

      logger.error("buildMERulesIndexForRequestedRoles: meIdx[" + r.roleId + "]=" + JSON.stringify(set));
    });

    logger.error("buildMERulesIndexForRequestedRoles: indexKeys=" + Object.keys(idx).join(","));
    return idx;
  }

  function evaluateConflicts(requestedRoles, existingEntitlements, meRulesIndex) {
    logger.error("evaluateConflicts: requestedRoles=" + JSON.stringify(requestedRoles));
    logger.error("evaluateConflicts: existingEntitlements=" + JSON.stringify(existingEntitlements));

    var conflicts = [];

    function uniqRoles(list) {
      var seen = {};
      var out = [];
      for (var i = 0; i < (list || []).length; i++) {
        var r = list[i] || {};
        var appId = r.applicationId || null;
        var roleId = r.roleId || null;
        if (!roleId) continue;

        var key = (appId || "") + "|" + roleId;
        if (seen[key]) continue;
        seen[key] = true;

        out.push({ applicationId: appId ? ("" + appId) : null, roleId: "" + roleId, sourceUserId: r.sourceUserId || null });
      }
      return out;
    }

    // function sameAppOrUnscoped(appId1, appId2) {
    //   // If you want cross-app ME, change to: return true;
    //   if (!appId1 || !appId2) return true;
    //   return ("" + appId1) === ("" + appId2);
    // }
   //checks whether roleB is configured as mutually exclusive with roleA in meRulesIndex.
    function hasRule(roleA, roleB) {
      var rules = meRulesIndex && meRulesIndex["" + roleA];

      // supports your current structure: { "<roleId>": true }
      if (rules && typeof rules === "object" && !Array.isArray(rules)) {
        return rules["" + roleB] === true;
      }

      // also supports array structure: ["<roleId>", .]
      if (Array.isArray(rules)) {
        return rules.indexOf("" + roleB) >= 0;
      }

      return false;
    }

    function addConflict(type, reqRole, otherRole, sourceUserId) {
      conflicts.push({
        type: type, // "REQUESTED_VS_REQUESTED" | "REQUESTED_VS_EXISTING" : only testing
        requested: { applicationId: reqRole.applicationId, roleId: reqRole.roleId },
        conflicting: { applicationId: otherRole.applicationId || null, roleId: otherRole.roleId },
        sourceUserId: sourceUserId || otherRole.sourceUserId || null,
        message: "Mutual exclusivity conflict found."
      });
    }

    var req = uniqRoles(requestedRoles);
    var exist = uniqRoles(existingEntitlements);

    // 1) Requested vs Requested
    for (var i = 0; i < req.length; i++) {
      for (var j = i + 1; j < req.length; j++) {
        var r1 = req[i], r2 = req[j];
       // if (!sameAppOrUnscoped(r1.applicationId, r2.applicationId)) continue;

        // check both directions in case rules are directional
        if (hasRule(r1.roleId, r2.roleId) || hasRule(r2.roleId, r1.roleId)) {
          addConflict("REQUESTED_VS_REQUESTED", r1, r2, null);
        }
      }
    }

    // 2) Requested vs Existing
    for (var a = 0; a < req.length; a++) {
      for (var b = 0; b < exist.length; b++) {
        var rr = req[a], ex = exist[b];
        if (!ex || !ex.roleId) continue;
        if (!sameAppOrUnscoped(rr.applicationId, ex.applicationId)) continue;

        if (hasRule(rr.roleId, ex.roleId) || hasRule(ex.roleId, rr.roleId)) {
          addConflict("REQUESTED_VS_EXISTING", rr, ex, ex.sourceUserId);
        }
      }
    }

    logger.error("evaluateConflicts: conflictsCount=" + conflicts.length);
    return conflicts;
  }

  // Main
  const txn = getTxnId(context);

  let response = null;

  try {
    var authenticatedUserId = context.security && context.security.authorization && context.security.authorization.id;
    logger.error("mutualExclusiveRoleCheckEndpoint authenticatedUserId: " + authenticatedUserId);

    switch (request.method) {

      case REQUEST_POST: {
        logger.error("mutualExclusiveRoleCheckEndpoint: method=create");
        const requestContent = getRequestContent(context, request, ENDPOINT_NAME);
        const action = ("" + requestContent.action);
        logger.error("mutualExclusiveRoleCheckEndpoint: action=" + action);

        if (action == ("" + ACTION_SEARCH)) {
          logger.error("mutualExclusiveRoleCheckEndpoint action=4 (search).");

          const view = requestContent.view ? ("" + requestContent.view) : null;
          if (!view) {
            logger.error("mutualExclusiveRoleCheckEndpoint: missing view");
            return generateResponse(RESPONSE_CODE_FAILURE, txn, { code: "KYID-VAL", content: 'Unsupported view. Expected "view".' });
          }

          const viewLower = ("" + view).toLowerCase(); 

          var payload = requestContent.payload || {};
          payload.requestedBy = authenticatedUserId;

          var requestedRoles = normalizeRoles(payload.roles);
          if (!isNonEmptyArray(requestedRoles)) {
            logger.error("mutualExclusiveRoleCheckEndpoint: invalid requestedRoles");
            return generateResponse(RESPONSE_CODE_FAILURE, txn, { code: "KYID-VAL", content: "Missing/invalid payload.roles[] (application_id + role_id required)." });
          }

          var userId = payload.userId || null;
          var lexId = payload.lexId || null;
          var email = payload.email || null;

          logger.error("mutualExclusiveRoleCheckEndpoint: userId=" + userId + ", lexId=" + lexId + ", email=" + email);

          if (!userId && !lexId && email) {
            userId = findUserIdByEmail(email);
            logger.error("mutualExclusiveRoleCheckEndpoint: resolved userId from email=" + userId);
          }

          var mode = getEffectiveEvaluationMode(requestedRoles, { userId: userId, lexId: lexId });
          logger.error("mutualExclusiveRoleCheckEndpoint: mode=" + JSON.stringify(mode));

          var entitlements = [];

          if (mode.MElevelEvaluated === "Identity") {
            if (!lexId && userId) lexId = getLexIdForUser(userId);

            if (!lexId) {
              logger.error("mutualExclusiveRoleCheckEndpoint: lexId missing, falling back to Account mode");
              mode.MElevelEvaluated = "Account";
            } else {
              logger.error("mutualExclusiveRoleCheckEndpoint: lexId present, IdentityMode");
              var relatedUserIds = getAllAccountsForLexId(lexId);
              logger.error("mutualExclusiveRoleCheckEndpoint: getAllAccountsForLexId present"+relatedUserIds);
              relatedUserIds.forEach(function (uid) {
                entitlements = entitlements.concat(getActiveAccessForUser(uid));
              });
            }
          }

          if (mode.MElevelEvaluated === "Account") {
            entitlements = userId ? getActiveAccessForUser(userId) : [];
          }

          
          var meIdx;
          if (viewLower === "availableaccessrolerequest") {
            var entRolesForIdx = (entitlements || [])
              .filter(function (e) { return e && e.applicationId && e.roleId; })
              .map(function (e) { return { applicationId: "" + e.applicationId, roleId: "" + e.roleId }; });

            meIdx = buildMERulesIndexForRequestedRoles(requestedRoles.concat(entRolesForIdx));
          } else {
            meIdx = buildMERulesIndexForRequestedRoles(requestedRoles);
          }

          // var conflicts = evaluateConflicts(requestedRoles, entitlements, meIdx, mode.orgScoped === true);
          var conflicts = evaluateConflicts(requestedRoles, entitlements, meIdx); // org level commented

          var isAllowed = conflicts.length === 0;

          var resultPayload = {
            isAllowed: isAllowed,
            MElevelEvaluated: mode.MElevelEvaluated,
            conflicts: conflicts,
            message: isAllowed ? "No mutual exclusivity conflicts found." : "Following roles are in conflict."
          };

          response = generateResponse(RESPONSE_CODE_SUCCESS, txn, SUCCESS_MESSAGE, resultPayload);
          logger.error("mutualExclusiveRoleCheckEndpoint: response=" + JSON.stringify(response));
          break;
        }

        logger.error("mutualExclusiveRoleCheckEndpoint: unsupported action=" + action);
        response = generateResponse(RESPONSE_CODE_FAILURE, txn, { code: "KYID-VAL", content: "Unsupported action." });
        break;
      }

      case REQUEST_GET: {
        logger.error("mutualExclusiveRoleCheckEndpoint: method=read not supported");
        response = generateResponse(RESPONSE_CODE_FAILURE, txn, { code: "KYID-USO", content: "GET is not supported yet." });
        break;
      }

      default: {
        logger.error("mutualExclusiveRoleCheckEndpoint: unsupported method=" + request.method);
        response = generateResponse(RESPONSE_CODE_FAILURE, txn, { code: "KYID-USO", content: "Unsupported operation." });
        break;
      }

    }

    return response;

  } catch (e) {
    logger.error("mutualExclusiveRoleCheckEndpoint: caught exception");
    logException(e);

    if (e && e.code && e.message) {
      return generateResponse("" + e.code, txn, e.message, e.payload);
    }

    return generateResponse(RESPONSE_CODE_ERROR, txn, EXCEPTION_UNEXPECTED_ERROR);
  }

}());
