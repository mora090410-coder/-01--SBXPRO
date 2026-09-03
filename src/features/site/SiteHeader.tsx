import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CapsuleButton } from '../../design/primitives';
import { ghostLink } from '../homepage/sections/cta';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../services/supabase';

const wordmark =
  'inline-flex items-center h-11 font-display text-[22px] text-fg rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action';

/**
 * The signed-in user, or null when this tree is rendered outside an
 * AuthProvider (the homepage sections render standalone in unit tests and in
 * the static SEO prerender). `useAuth` throws in that case; the hook order is
 * unaffected because the underlying `useContext` always runs.
 */
function useOptionalUser() {
  try {
    return useAuth().user;
  } catch {
    return null;
  }
}

export interface SiteHeaderProps {
  className?: string;
  /** `/login` is already the sign-in page: the header link there is noise. */
  hideSignIn?: boolean;
}

export function SiteHeader({ className = '', hideSignIn = false }: SiteHeaderProps) {
  const user = useOptionalUser();
  const navigate = useNavigate();

  const logOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className={`flex items-center justify-between h-11 ${className}`.trim()}>
      <Link to="/" className={wordmark}>GridOne</Link>
      {user ? (
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className={ghostLink}>Your boards</Link>
          <CapsuleButton variant="quiet" onClick={logOut}>Log out</CapsuleButton>
        </div>
      ) : hideSignIn ? null : (
        <Link to="/login?mode=signin" className={ghostLink}>Sign in</Link>
      )}
    </header>
  );
}
