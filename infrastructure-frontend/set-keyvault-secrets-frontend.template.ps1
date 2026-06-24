# Shared Azure Key Vault Secret Setup Script
# This script sets up all secrets in the shared Key Vault for both backend and frontend
# 
# IMPORTANT: This file contains sensitive information and should NOT be committed to version control
# Add this file to .gitignore immediately after updating with your actual values


param(
    [string]$KeyVaultName = "kv-eden-prod",
    [string]$ResourceGroup = "rg-eden-shared-prod-nzn"
)

Write-Host "Setting up Azure Key Vault secrets for: $KeyVaultName in RG: $ResourceGroup"
Write-Host ""

# Verify Key Vault exists
Write-Host "Verifying Key Vault exists..."
$kvExists = az keyvault show --name $KeyVaultName --resource-group $ResourceGroup 2>$null
if (-not $kvExists) {
    Write-Error "Key Vault '$KeyVaultName' not found in resource group '$ResourceGroup'"
    Write-Host "Make sure to deploy the shared infrastructure first using the infrastructure-pipeline-shared.yml"
    exit 1
}

Write-Host "Key Vault found. Setting frontend secrets..."
Write-Host ""

Write-Host "Setting frontend secrets: Auth0..."
# az keyvault secret set --vault-name $KeyVaultName --name "AUTH0-DOMAIN" --value "YOUR_AUTH0_DOMAIN"
# az keyvault secret set --vault-name $KeyVaultName --name "AUTH0-CLIENT-ID" --value "YOUR_AUTH0_CLIENT_ID"
# az keyvault secret set --vault-name $KeyVaultName --name "AUTH0-ADDRESS" --value "YOUR_AUTH0_ADDRESS"
# az keyvault secret set --vault-name $KeyVaultName --name "AUTH0-CALLBACK" --value "YOUR_AUTH0_CALLBACK_URL"
# az keyvault secret set --vault-name $KeyVaultName --name "AUTH0-AUDIENCE" --value "YOUR_AUTH0_AUDIENCE"

Write-Host "Setting frontend secrets: Deployment Tokens..."
# az keyvault secret set --vault-name $KeyVaultName --name "FRONTEND-DEPLOYMENT-TOKEN" --value "YOUR_FRONTEND_DEPLOYMENT_TOKEN"
Write-Host ""
Write-Host "Done! All secrets have been set in the shared Key Vault."
Write-Host ""