type SessionUser = {
  id: string;
  email?: string | null;
};

type GetAuthenticatedUserOptions = {
  createClient: () => Promise<{
    auth: {
      getUser(): Promise<{
        data: { user: SessionUser | null };
        error: { message: string } | null;
      }>;
    };
  }>;
};

export async function getAuthenticatedUser({
  createClient,
}: GetAuthenticatedUserOptions) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return {
      kind: "expired" as const,
      reason: "Sua sessao expirou. Entre novamente.",
    };
  }

  if (!user) {
    return {
      kind: "anonymous" as const,
    };
  }

  return {
    kind: "authenticated" as const,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  };
}
