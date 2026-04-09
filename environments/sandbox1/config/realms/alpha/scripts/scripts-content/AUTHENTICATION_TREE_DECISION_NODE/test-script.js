  // Main execution
  try {
      if (callbacks.isEmpty()) {
              callbacksBuilder.textInputCallback("Enter test Credential ID", "1234test");
              callbacksBuilder.textInputCallback("Security Code 1");
              callbacksBuilder.textInputCallback("Security Code 2");
              callbacksBuilder.confirmationCallback(0, ["Enroll", "Return to authenticator list"], 0);
          ction.goTo("true");
      } else {
          action.goTo("false");
      }
  } catch (error) {
      action.goTo("false");
  }