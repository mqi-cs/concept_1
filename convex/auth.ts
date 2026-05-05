import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const profile: Record<string, string> = { email: params.email as string };
        const name = params.name as string | undefined;
        if (name) profile.displayName = name;
        return profile as { email: string };
      },
    }),
  ],
});
