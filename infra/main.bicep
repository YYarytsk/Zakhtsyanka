// Azure Container Apps + Container Registry infrastructure for Захцянка
// Deploy: az deployment group create --resource-group <rg> --template-file infra/main.bicep --parameters @infra/main.parameters.json

@description('Base name used for all resources (e.g. zakhtsyanka)')
param appName string = 'zakhtsyanka'

@description('Azure region')
param location string = resourceGroup().location

@description('Container image tag to deploy (SHA or "latest")')
param imageTag string = 'latest'

@description('Supabase project URL (public)')
param supabaseUrl string

@description('Supabase anon key (public)')
@secure()
param supabaseAnonKey string

@description('Supabase service role key (secret — never expose to client)')
@secure()
param supabaseServiceRoleKey string

@description('WayForPay merchant account name (public)')
param wfpMerchantAccount string

@description('WayForPay merchant secret key')
@secure()
param wfpMerchantSecretKey string

@description('WayForPay merchant domain (must match registration)')
param wfpMerchantDomain string

@description('Resend API key for email notifications')
@secure()
param resendApiKey string

@description('Store name in Ukrainian')
param storeNameUk string = 'Захцянка'

@description('Store name in English')
param storeNameEn string = 'Zakhtsyanka'

// ── Container Registry ────────────────────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: '${appName}acr'
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false   // use managed identity, not admin credentials
  }
}

// ── Log Analytics workspace (required by Container Apps) ─────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${appName}-logs'
  location: location
  properties: {
    retentionInDays: 30
    sku: { name: 'PerGB2018' }
  }
}

// ── Container Apps Environment ────────────────────────────────────────────
resource caEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${appName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ── Managed identity (used by Container Apps to pull from ACR) ────────────
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appName}-identity'
  location: location
}

resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, 'acrpull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Container App: web ────────────────────────────────────────────────────
resource webApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${appName}-web'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    environmentId: caEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: identity.id
        }
      ]
    }
    template: {
      scale: {
        minReplicas: 0   // scale-to-zero when idle — cost-efficient for one bakery
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: { metadata: { concurrentRequests: '20' } }
          }
        ]
      }
      containers: [
        {
          name: 'web'
          image: '${acr.properties.loginServer}/${appName}-web:${imageTag}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            // Public vars (safe to store in image args, but runtime injection is cleaner)
            { name: 'NEXT_PUBLIC_SUPABASE_URL',      value: supabaseUrl }
            { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: supabaseAnonKey }
            { name: 'NEXT_PUBLIC_STORE_NAME_UK',     value: storeNameUk }
            { name: 'NEXT_PUBLIC_STORE_NAME_EN',     value: storeNameEn }
            { name: 'NEXT_PUBLIC_DEFAULT_LOCALE',    value: 'uk' }
            { name: 'NEXT_PUBLIC_APP_URL',           value: 'https://${appName}-web.${caEnv.properties.defaultDomain}' }
            // WayForPay — merchant account is public, secret key stays in secrets
            { name: 'NEXT_PUBLIC_WFP_MERCHANT_ACCOUNT', value: wfpMerchantAccount }
            { name: 'NEXT_PUBLIC_WFP_MERCHANT_DOMAIN',  value: wfpMerchantDomain }
            // Secret vars — injected at runtime, never in image
            { name: 'SUPABASE_SERVICE_ROLE_KEY',    secretRef: 'supabase-service-role-key' }
            { name: 'WFP_MERCHANT_SECRET_KEY',      secretRef: 'wfp-merchant-secret-key' }
            { name: 'RESEND_API_KEY',               secretRef: 'resend-api-key' }
          ]
        }
      ]
    }
    configuration: {
      secrets: [
        { name: 'supabase-service-role-key', value: supabaseServiceRoleKey }
        { name: 'wfp-merchant-secret-key',   value: wfpMerchantSecretKey }
        { name: 'resend-api-key',            value: resendApiKey }
      ]
      ingress: {
        external: true
        targetPort: 3000
      }
    }
  }
}

output acrLoginServer string = acr.properties.loginServer
output webAppUrl string = 'https://${webApp.properties.configuration.ingress.fqdn}'
