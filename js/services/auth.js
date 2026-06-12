import { supabase } from './supabase.js';

// Retorna a sessão atual (ou null)
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Retorna o usuário logado (ou null)
export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Chama fn(session) sempre que o estado de auth mudar
export function onAuthChange(fn) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => fn(session));
  return () => data.subscription.unsubscribe();
}
