import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase';

const AuthContext = createContext(null);

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const GENERIC_LOGIN_ERROR = 'Incorrect username/email or password.';

const normaliseProfile = (r) => ({
  username: r.username,
  fullName: r.full_name || '',
  phone: r.phone || '',
  street: r.street || '',
  city: r.city || '',
  state: r.state || '',
  pin: r.pin || '',
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(supabaseEnabled);

  const userId = session?.user?.id;

  // Track the Supabase session.
  useEffect(() => {
    if (!supabaseEnabled) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Load the profile and admin flag whenever the signed-in user changes.
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.rpc('is_admin'),
    ]).then(([prof, admin]) => {
      if (cancelled) return;
      setProfile(prof.data ? normaliseProfile(prof.data) : null);
      setIsAdmin(admin.data === true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const usernameAvailable = useCallback(async (username) => {
    const { data, error } = await supabase.rpc('username_available', { p_username: username });
    if (error) throw new Error('Could not check that username. Please try again.');
    return data === true;
  }, []);

  const signUp = useCallback(
    async ({ email, password, username, fullName, phone }) => {
      const uname = username.trim().toLowerCase();
      if (!USERNAME_RE.test(uname)) {
        throw new Error('Username must be 3-20 characters: letters, numbers or underscore.');
      }
      if (!(await usernameAvailable(uname))) throw new Error('That username is already taken.');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: uname, full_name: fullName.trim(), phone: phone.trim() } },
      });
      if (error) throw new Error(error.message);
      // No session means Supabase is waiting for the customer to confirm their email address.
      return { needsConfirmation: !data.session };
    },
    [usernameAvailable]
  );

  /** `identifier` is an email address or a username. */
  const signIn = useCallback(async (identifier, password) => {
    let email = identifier.trim();
    if (!email.includes('@')) {
      const { data } = await supabase.rpc('email_for_username', { p_username: email });
      if (!data) throw new Error(GENERIC_LOGIN_ERROR);
      email = data;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message.toLowerCase().includes('confirm') ? 'Please confirm your email first, then sign in.' : GENERIC_LOGIN_ERROR);
    }
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const saveProfile = useCallback(
    async (fields) => {
      const row = {
        id: userId,
        username: fields.username.trim().toLowerCase(),
        full_name: fields.fullName.trim(),
        phone: fields.phone.trim(),
        street: fields.street.trim(),
        city: fields.city.trim(),
        state: fields.state.trim(),
        pin: fields.pin.trim(),
      };
      if (!USERNAME_RE.test(row.username)) {
        throw new Error('Username must be 3-20 characters: letters, numbers or underscore.');
      }
      if (row.username !== profile?.username && !(await usernameAvailable(row.username))) {
        throw new Error('That username is already taken.');
      }
      const { error } = await supabase.from('profiles').upsert(row);
      if (error) throw new Error(error.message);
      setProfile(normaliseProfile({ ...row }));
    },
    [userId, profile, usernameAvailable]
  );

  const value = useMemo(
    () => ({
      enabled: supabaseEnabled,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      usernameAvailable,
      signUp,
      signIn,
      signOut,
      saveProfile,
    }),
    [loading, session, profile, isAdmin, usernameAvailable, signUp, signIn, signOut, saveProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
