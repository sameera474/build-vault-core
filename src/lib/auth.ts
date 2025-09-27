import { supabase, isSupabaseConfigured } from './supabaseClient';

const getSupabaseNotConfiguredError = () => ({
  data: null,
  error: { message: 'Please connect to Supabase to use authentication features. Click the Supabase button in the top right.' }
});

export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured) {
    return getSupabaseNotConfiguredError();
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email: string, password: string, name: string) => {
  if (!isSupabaseConfigured) {
    return getSupabaseNotConfiguredError();
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (data.user && !error) {
    // Create profile with new company_id
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        company_id: crypto.randomUUID(),
        name,
        role: 'admin',
      });
    
    if (profileError) {
      throw new Error(profileError.message);
    }
  }
  
  return { data, error };
};

export const signOut = async () => {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Please connect to Supabase to use authentication features. Click the Supabase button in the top right.' } };
  }
  
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  if (!isSupabaseConfigured) {
    return getSupabaseNotConfiguredError();
  }
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured) {
    return { user: null, error: { message: 'Supabase not configured' } };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getUserProfile = async (userId: string) => {
  if (!isSupabaseConfigured) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
};