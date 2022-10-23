import { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface DribbbleProfile extends Record<string, any> {
  id: number
  name: string
  email: string
  avatar_url: string
}

export default function DribbbleProvider<P extends DribbbleProfile>(
  options: OAuthUserConfig<P> & {
    /**
     * Reference: https://developer.dribbble.com/v2/oauth/#scopes
     *
     * For the purposes of NextAuth.js `upload`-only scope makes no sense,
     * therefore it is excluded from suggested values. Treated by Dribbble as `public` when omitted.
     *
     * @default public
     */
    scope?: "public" | "public upload"
  }
): OAuthConfig<P> {
  return {
    id: "dribbble",
    name: "Dribbble",
    type: "oauth",

    authorization: {
      url: "https://dribbble.com/oauth/authorize",
      params: { scope: options.scope },
    },

    token: "https://dribbble.com/oauth/token",
    userinfo: "https://api.dribbble.com/v2/user",

    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name,
        email: profile.email,
        image: profile.avatar_url,
      }
    },

    options,
  }
}
