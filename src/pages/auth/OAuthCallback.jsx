import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * OAuthCallback — landing page for all Google OAuth redirects.
 *
 * Flow:
 * 1. Google redirects here with a session in the URL hash.
 * 2. Supabase picks up the session automatically.
 * 3. We fetch the profile from the DB to get the real role.
 * 4. For brand-new Google accounts (no profile row yet), we use the
 *    role stored in sessionStorage BEFORE the OAuth redirect started.
 * 5. We upsert the profile row with the correct role if needed.
 * 6. We navigate to the right dashboard.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for Supabase to exchange the OAuth code for a session.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('OAuth callback: no session', sessionError);
          navigate('/login', { replace: true });
          return;
        }

        const user = session.user;

        // Fetch the profile row from the DB.
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('OAuth callback: profile fetch error', profileError);
        }

        let role = profile?.role;

        if (!role) {
          // Brand-new Google account — no profile row exists yet.
          // Use the role the user selected before clicking "Continue with Google".
          const pendingRole = sessionStorage.getItem('pending_oauth_role') || 'customer';
          sessionStorage.removeItem('pending_oauth_role');

          // Upsert the profile with the correct role so the DB trigger
          // (if it hasn't already run) gets the right value.
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            role: pendingRole,
          }, { onConflict: 'id' });

          // Also create the role-specific sub-profile if missing.
          if (pendingRole === 'provider') {
            await supabase.from('provider_profiles').upsert({ id: user.id }, { onConflict: 'id' });
          } else {
            await supabase.from('customer_profiles').upsert({ id: user.id }, { onConflict: 'id' });
          }

          role = pendingRole;
        } else {
          // Existing account — clear any stale pending role.
          sessionStorage.removeItem('pending_oauth_role');
        }

        // Navigate to the correct dashboard.
        if (role === 'provider') navigate('/provider/dashboard', { replace: true });
        else if (role === 'admin') navigate('/admin/dashboard', { replace: true });
        else navigate('/customer/dashboard', { replace: true });

      } catch (err) {
        console.error('OAuth callback error:', err);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-medium">Signing you in…</p>
      </div>
    </div>
  );
}
