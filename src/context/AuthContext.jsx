import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase';
import { isAddressValid } from '../utils/pricing';

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

const normaliseAddress = (r) => ({
  id: r.id,
  label: r.label || '',
  name: r.full_name,
  phone: r.phone,
  street: r.street,
  city: r.city,
  state: r.state,
  pin: r.pin,
});

/** Oldest first. */
const sortAddresses = (rows) => [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));

// A password-reset link opens the site with "type=recovery" in the address. Supabase clears that from the address bar
// as soon as it reads it, so note it here, at load time. An expired or reused link arrives with an error code instead.
const hashParams = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.hash.slice(1));
const OPENED_FROM_RESET_LINK = hashParams.get('type') === 'recovery';
const RESET_LINK_FAILED = Boolean(hashParams.get('error_code') || hashParams.get('error_description'));

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(supabaseEnabled);
  const [recovering, setRecovering] = useState(OPENED_FROM_RESET_LINK);  // opened from a reset email: ask for a new password

  const userId = session?.user?.id;

  // Track the Supabase session.
  useEffect(() => {
    if (!supabaseEnabled) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setRecovering(false);
      setSession(next);
      if (!next) {
        setProfile(null);
        setAddresses([]);
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
      supabase.from('addresses').select('*').eq('user_id', userId),
    ]).then(([prof, admin, addr]) => {
      if (cancelled) return;
      setProfile(prof.data ? normaliseProfile(prof.data) : null);
      setAddresses(sortAddresses(addr.data || []).map(normaliseAddress));
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
      // No session means Supabase is waiting for the customer to confirm their email address
      // (Supabase sends its own email then). Otherwise they're signed in, so send the "account created" email.
      if (data.session) {
        fetch('/.netlify/functions/welcome-email', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        }).catch(() => {}); // best effort: a failed email must never block sign-up
      }
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

  /** Emails a reset link. Says nothing about whether the address has an account, so it can't be used to look people up. */
  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/account`,
    });
    if (error) {
      if (error.status === 429 || /rate limit/i.test(error.message)) {
        throw new Error('Too many reset emails have been requested. Please wait a few minutes and try again.');
      }
      throw new Error('We could not send the reset email. Please try again.');
    }
  }, []);

  /** Sets a new password for the signed-in (or reset-link) user. */
  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    setRecovering(false);
  }, []);

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

  const reloadAddresses = useCallback(async () => {
    const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId);
    if (error) throw new Error(error.message);
    setAddresses(sortAddresses(data || []).map(normaliseAddress));
  }, [userId]);

  /** Adds an extra address, or updates it when `id` is given. */
  const saveAddress = useCallback(
    async (fields, id) => {
      const row = {
        label: fields.label.trim(),
        full_name: fields.name.trim(),
        phone: fields.phone.trim(),
        street: fields.street.trim(),
        city: fields.city.trim(),
        state: fields.state.trim(),
        pin: fields.pin.trim(),
      };
      if (id) {
        const { error } = await supabase.from('addresses').update(row).eq('id', id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('addresses').insert({ ...row, user_id: userId });
        if (error) throw new Error(error.message);
      }
      await reloadAddresses();
    },
    [userId, reloadAddresses]
  );

  const deleteAddress = useCallback(
    async (id) => {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await reloadAddresses();
    },
    [reloadAddresses]
  );

  /** The primary shipping address lives on the profile; null until it is complete. */
  const primaryAddress = useMemo(() => {
    if (!profile) return null;
    const a = {
      id: 'primary',
      label: 'Primary',
      name: profile.fullName,
      phone: profile.phone,
      street: profile.street,
      city: profile.city,
      state: profile.state,
      pin: profile.pin,
    };
    return isAddressValid(a) ? a : null;
  }, [profile]);

  const value = useMemo(
    () => ({
      enabled: supabaseEnabled,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      primaryAddress,
      addresses,
      isAdmin,
      usernameAvailable,
      signUp,
      signIn,
      signOut,
      recovering,
      resetLinkFailed: RESET_LINK_FAILED,
      requestPasswordReset,
      updatePassword,
      saveProfile,
      saveAddress,
      deleteAddress,
    }),
    [loading, session, profile, primaryAddress, addresses, isAdmin, usernameAvailable, signUp, signIn, signOut, recovering, requestPasswordReset, updatePassword, saveProfile, saveAddress, deleteAddress]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
