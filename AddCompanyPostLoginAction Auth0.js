/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */

exports.onExecutePostLogin = async (event, api) => {
  // Users from the Client Portal
  if (event.client.name === "ElectroNet Limits Calculator (Dev)" || event.client.name === "ElectroNet Limits Calculator (Deployment)") {
    const user = event.user;
    let permissions = user.app_metadata?.permissions;
    // If permissions don't exist in app_metadata, set default permissions
    if (!permissions) {
      permissions = "standard";  // Set default permission
      api.user.setAppMetadata('permissions', permissions);
    }
    api.idToken.setCustomClaim('https://electronetlimitscalculator.com/user/permissions', permissions);
  }
  
  else {
    const user = event.user;
    let company = user.app_metadata?.company;
    let permissions = user.app_metadata?.permissions;
    let role = user.app_metadata?.role;
    let name = user.app_metadata?.name;

    // If company doesn't exist in app_metadata, set it based on email domain
    if (!name) {
      name = user.email.split('@')[0];
      api.user.setAppMetadata('name', name);
    }

    if (!company) {
      const emailDomain = user.email.split('@')[1];
      
      // Map email domains to companies
      const domainCompanyMap = {
        'electronet.co.nz': 'ElectroNet',
        'westpower.co.nz': 'Westpower',
        'transpower.co.nz': 'Transpower',
        // Add more mappings as needed
      };

      company = domainCompanyMap[emailDomain] || 'Unknown';
      api.user.setAppMetadata('company', company);
    }

    // If permissions don't exist in app_metadata, set default permissions
    // if (!permissions) {
    //   permissions = "Standard";  // Set default permission
    //   api.user.setAppMetadata('permissions', permissions);
    // }

    // If role doesn't exist in app_metadata, set default permissions
    // if (!role) {
    //   role = "Viewer";  // Set default permission
    //   api.user.setAppMetadata('role', role);
    // }

    // Add the company and permissions to the ID token
    api.idToken.setCustomClaim('https://electronetclientportal.com/user/name', name);
    api.idToken.setCustomClaim('https://electronetclientportal.com/user/company', company);
    // api.idToken.setCustomClaim('https://electronetclientportal.com/user/permissions', permissions);
    // api.idToken.setCustomClaim('https://electronetclientportal.com/user/role', role);

  // User from the Limits Calculator
  } 
};
