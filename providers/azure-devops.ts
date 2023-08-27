import { OAuthConfig, OAuthUserConfig, TokenEndpointHandler, UserinfoEndpointHandler } from 'next-auth/providers';

export interface AzureDevOpsProfile extends Record<string, any> {
  id: string;
  displayName: string;
  emailAddress: string;
  coreAttributes: { Avatar: { value: { value: string } } };
}

export default function AzureDevOpsProvider<P extends AzureDevOpsProfile>(
  options: OAuthUserConfig<P> & {
    /**
     * https://docs.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/oauth?view=azure-devops#scopes
     * @default vso.profile
     */
    scope?: string;
  }
): OAuthConfig<P> {
  const scope = options.scope ?? 'vso.profile';

  return {
    id: 'azure-devops',
    name: 'Azure DevOps',
    type: 'oauth',

    authorization: {
      url: 'https://app.vssps.visualstudio.com/oauth2/authorize',
      params: { response_type: 'Assertion', scope }
    },

    token: {
      async request(context) {
        const response = await fetch('https://app.vssps.visualstudio.com/oauth2/token', {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          method: 'POST',
          body: new URLSearchParams({
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: context.provider.clientSecret as string,
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: context.params.code as string,
            redirect_uri: context.provider.callbackUrl
          })
        });
        return { tokens: await response.json() };
      }
    },

    userinfo: {
      async request(context) {
        const accessToken = context.tokens.access_token as string;
        const response = await fetch(
          'https://app.vssps.visualstudio.com/_apis/profile/profiles/me?details=true&coreAttributes=Avatar&api-version=6.0',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
        return response.json();
      }
    },

    profile(profile) {
      return {
        id: profile.id,
        name: profile.displayName,
        email: profile.emailAddress,
        image: `data:image/jpeg;base64,${profile.coreAttributes.Avatar.value.value}`
      };
    },

    options
  };
}
