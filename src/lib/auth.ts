import { supabase } from "@/integrations/supabase/client";

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (
  email: string,
  password: string,
  name: string,
  companyName?: string
) => {
  const redirectUrl = `${window.location.origin}/`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        name: name,
        company_name: companyName,
      },
    },
  });

  return { data, error };
};

export const getCompanies = async () => {
  const { data, error } = await supabase.functions.invoke("get-companies");
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      user_id,
      company_id,
      name,
      email,
      tenant_role,
      is_super_admin,
      avatar_url,
      phone,
      department,
      created_at,
      updated_at
    `
    )
    .eq("user_id", userId)
    .single();

  return { data, error };
};
