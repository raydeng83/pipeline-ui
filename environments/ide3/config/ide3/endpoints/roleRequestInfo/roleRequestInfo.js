  (function () {
    try {
      var requestId = request.content.requestId;
      var response = requestInfo(requestId);
      if (response){
      return {response};
      }
      else{
        return {code: -1};
      }

      
    } catch (error) {
      return {code: -1};
    }

  }());

function requestInfo(requestId) {
  try {
    var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  const response = requestObj; // Replace with your actual response variable

  const extractData = (response) => {
  const user = {
    givenName: response.user.givenName,
    sn: response.user.sn,
    mail: response.user.mail
  };

  const role = {
    name: response.role.name
  };


  const decision = {
    status: response.decision.status,
    outcome: response.decision.outcome,
    startDate: response.decision.startDate,
    completionDate: response.decision.completionDate,
    comments: response.decision.comments,
    decision:response.decision.decision
  };
  if (response.decision.phases){
  var levelOfApprovers = response.decision.phases.length;

  var phases = response.decision.phases.map(phase => {
    // Get approvers for this phase
    const activeApprovers = response.decision.actors.active.filter(
      actor => actor.phase === phase.name
    ).map(actor => ({
      givenName: actor.givenName,
      sn: actor.sn,
      mail: actor.mail
    }));
    const inactiveApprovers = response.decision.actors.inactive.filter(
      actor => actor.phase === phase.name
    ).map(actor => ({
      givenName: actor.givenName,
      sn: actor.sn,
      mail: actor.mail
    }));

    const expirationEvent = phase.events.expiration;
    const expirationDate = expirationEvent ? expirationEvent.date : null;

    return {
      activeApprovers,
      inactiveApprovers,
      status: phase.status,
      startDate: phase.startDate,
      completionDate: phase.completionDate || null,
      decision: phase.decision,
      completedBy:phase.completedBy,
      expirationDate
    };
  });
  }
  else{
     levelOfApprovers = 0;
      phases = [];
  }
  const completedBy = response.decision.actors.active
    .filter(actor => actor.decision && actor.decision !== null)
    .map(actor => ({
      givenName: actor.givenName,
      sn: actor.sn,
      mail: actor.mail
    }));

  return {
    user,
    role,
    levelOfApprovers,
    decision,
    phases
    
    
  };
};
const formattedResponse = extractData(response);
return (formattedResponse);

    
  } catch (error) {
    return null;
  }
 
}

