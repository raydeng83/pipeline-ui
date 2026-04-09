var fr = JavaImporter(org.forgerock.openam.auth.node.api.Action);
action = fr.Action.goTo("true").putSessionProperty("mySessionProperty", "myPropertyValue")
action.build();