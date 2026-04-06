var response = openidm.query("managed/alpha_kyid_faq_mapping", { "_queryFilter": 'process eq "'+object.process +'" AND pageHeader eq "'+object.pageHeader +'"' }, [""]);
if(response.result.length > 1){
  throw { code: 400, message: 'process value and pageHeader value should be unique' };
}
