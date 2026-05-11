import { createMagicLink, upsertUserByEmail } from "./store";

const isSafeNextPath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : undefined;

export const createSignInLink = async (input: {
  email: string;
  baseUrl: string;
  expiresInMs?: number;
  nextPath?: string;
}) => {
  const user = await upsertUserByEmail(input.email);
  const { token, link } = await createMagicLink(
    user.id,
    user.email,
    isSafeNextPath(input.nextPath),
    input.expiresInMs,
  );
  const url = new URL("/api/auth/consume-magic-link", input.baseUrl);
  url.searchParams.set("token", token);
  return { user, link, url: url.toString() };
};
