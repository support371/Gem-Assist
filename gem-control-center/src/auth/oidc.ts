import { BrowserAuthorizationClient } from "@itwin/browser-authorization";
import { env } from "../config/env";

export const authClient = new BrowserAuthorizationClient({
  clientId: env.itwinClientId,
  redirectUri: env.redirectUri,
  postSignoutRedirectUri: env.postSignoutRedirectUri,
  scope: env.scope,
  authority: env.authority,
  responseType: "code",
});

export async function signIn(): Promise<void> {
  await authClient.signIn();
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
}

export async function handleSigninCallback(): Promise<void> {
  await authClient.handleSigninCallback();
}
