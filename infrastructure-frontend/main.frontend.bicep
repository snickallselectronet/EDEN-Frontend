@description('The name of the static web app')
param staticWebAppName string

@description('The location for all resources')
param location string = resourceGroup().location

@description('The environment (dev, staging, prod)')
param environment string = 'prod'

@description('The SKU for the static web app')
param staticWebAppSku string = 'Free'

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: {
    environment: environment
    project: 'EDEN'
    component: 'frontend'
  }
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  properties: {
    repositoryUrl: null
    branch: null
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: ''
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

output staticWebAppDefaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name

// Output instructions for CORS configuration
output corsInstructions string = 'Add https://${staticWebApp.properties.defaultHostname} to your Django backend CORS_ALLOWED_ORIGINS setting'
output auth0CallbackUrl string = 'Add https://${staticWebApp.properties.defaultHostname}/callback to your Auth0 application callback URLs'
