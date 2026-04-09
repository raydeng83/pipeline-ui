if (typeof existingSession !== 'undefined')
{
  outcome = "hasSession";
  sharedState.put("SessionStatus", "Has SESSION");
}
else
{
  outcome = "noSession";
  sharedState.put("SessionStatus", "NO SESSION");
}
