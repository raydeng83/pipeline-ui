(function () {

    /*const validateEndptRequestBody = {
        "payload": context,
        "action": 0
    }
  
    try {
        let res = openidm.create("endpoint/validate-endpt-access", null, validateEndptRequestBody)
        logger.error("Validate endpoint authorization response => "+JSON.stringify(res))
        if(res.status === 200){
          logger.error("Continue executing endpoint...")
        } else {
          return res
        }
    } catch (error) {
        logger.error("Exception caught => " + getException(error))
        return {"status":500, "message":error}
    }*/
  
    const REQUEST_GET = "read"
    if (request.method === REQUEST_GET) {
        let result = getHelpdeskContacts();

        return result;
    } else {
        throw {
            code: 405,
            message: "Method not allowed. Use GET method."
        };
    }
}());

function getHelpdeskContacts(){
    logger.info("helpdeskContacts: getHelpdeskContacts START - retrieving business application contacts");

    try {
        let searchResult = openidm.query("managed/alpha_kyid_businessapplication/", {
            "_queryFilter": "true"
        });

        logger.info("helpdeskContacts: Found " + searchResult.result.length + " business application records");

        let formattedContacts = [];

        searchResult.result.forEach(app => {
            if (app.applicationHelpdeskContact && app.applicationHelpdeskContact._refResourceId) {
                try {
                    let contactId = app.applicationHelpdeskContact._refResourceId;
                    logger.debug("helpdeskContacts: Processing contact ID: " + contactId + " for application: " + app.name);

                    let contactResult = openidm.query("managed/alpha_kyid_helpdeskcontact/", {
                        "_queryFilter": "_id eq \"" + contactId + "\""
                    });

                    if (contactResult && contactResult.result && contactResult.result.length > 0) {
                        let contact = contactResult.result[0];
                         logger.error("the contact result::"+contact)
                        // Check if the entire contact is visible
                        if (contact.isVisible === false) {
                            logger.debug("helpdeskContacts: Skipping contact " + contactId + " - not visible");
                            return;
                        }

                        // Format operating hours
                        let hours = "";
                        if (contact.daysOfOperation && contact.hoursOfOperation) {
                            hours = contact.daysOfOperation + " " + contact.hoursOfOperation;
                        } else if (contact.hoursOfOperation) {
                            hours = contact.hoursOfOperation;
                        } else if (contact.daysOfOperation) {
                            hours = contact.daysOfOperation;
                        }

                        // Get phone number with visibility check
                        let phone = "";
                        if (contact.phoneContact && contact.phoneContact.length > 0) {
                            for (let phoneEntry of contact.phoneContact) {
                                if (phoneEntry.isVisible === "true" || phoneEntry.isVisible === true) {
                                    phone = phoneEntry.phoneNumber || "";
                                    break;
                                }
                            }
                        }

                       // Get email with visibility check
                        let email = "";
                        if (contact.emailContact && contact.emailContact.length > 0) {
                            for (let emailEntry of contact.emailContact) {
                                if (emailEntry.isVisible === "true" || emailEntry.isVisible === true) {
                                    email = emailEntry.emailAddress || "";
                                    break;
                                }
                            }
                        }

                        formattedContacts.push({
                            //title: contact.title || { en: contact.name, es: contact.name },
                           title: (contact.title && Object.keys(contact.title).length > 0) ? contact.title : { en: contact.name, es: contact.name },
                            hours: hours,
                            phone: phone,
                            email: email,
                            additionalInfo: contact.additionInfo || { en: contact.description, es: contact.description },
                            link: contact.link || "",
                            appUrl: contact.appURL || ""
                        });

                        logger.debug("helpdeskContacts: Successfully processed contact for application: " + app.name);
                    } else {
                        logger.warn("helpdeskContacts: Contact not found for application: " + app.name + ", contactId: " + contactId);
                    }
                } catch (e) {
                    logger.error("helpdeskContacts: Error processing contact for application " + app.name + ": " + e.message);
                }
            } else {
                logger.debug("helpdeskContacts: No helpdesk contact found for application: " + app.name);
            }
        });

        logger.info("helpdeskContacts: Successfully processed " + formattedContacts.length + " contacts");

        // Get the category name from the special helpdesk contact
        let categoryName = {
            en: "Business Applications Support",
            es: "Soporte de Aplicaciones Comerciales"
        };

        try {
            let categoryContactResult = openidm.query("managed/alpha_kyid_helpdeskcontact/", {
                "_queryFilter": "name eq \"KYID_Helpdesk_Contact_0\""
            });

            if (categoryContactResult && categoryContactResult.result && categoryContactResult.result.length > 0) {
                let categoryContact = categoryContactResult.result[0];
                if (categoryContact.title) {
                    categoryName = categoryContact.title;
                    logger.debug("helpdeskContacts: Using category name from KYID_Helpdesk_Contact_0");
                } else {
                    logger.warn("helpdeskContacts: KYID_Helpdesk_Contact_0 found but no title, using default");
                }
            } else {
                logger.warn("helpdeskContacts: KYID_Helpdesk_Contact_0 not found, using default category name");
            }
        } catch (e) {
            logger.error("helpdeskContacts: Error querying KYID_Helpdesk_Contact_0: " + e.message);
        }

        return {
            categories: [
                {
                    name: categoryName,
                    contacts: formattedContacts
                }
            ]
        };
    } catch (e) {
        logger.error("helpdeskContacts: Error retrieving helpdesk contacts: " + e.message);
        throw {
            code: 500,
            message: "Failed to retrieve helpdesk contacts: " + e.message
        };
    }
}
