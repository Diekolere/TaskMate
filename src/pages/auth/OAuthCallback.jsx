import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import FullPageLoader from '../../components/FullPageLoader';

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
        const pendingRole = sessionStorage.getItem('pending_oauth_role');
        const isNewUser = user.created_at ? (new Date() - new Date(user.created_at)) < 120000 : false;

        if (pendingRole) {
          sessionStorage.removeItem('pending_oauth_role');

          if (isNewUser) {
            console.log('[OAuthCallback] New user detected, enforcing intent:', pendingRole);
            
            const { error: upsertError } = await supabase.from('profiles').upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
              role: pendingRole,
            }, { onConflict: 'id' });

            if (upsertError) throw upsertError;

            if (pendingRole === 'provider') {
              await supabase.from('provider_profiles').upsert({ id: user.id }, { onConflict: 'id' });
              await supabase.from('customer_profiles').delete().eq('id', user.id);
            } else {
              await supabase.from('customer_profiles').upsert({ id: user.id }, { onConflict: 'id' });
              await supabase.from('provider_profiles').delete().eq('id', user.id);
            }
            
            await supabase.auth.updateUser({ data: { role: pendingRole } });
            role = pendingRole;
          } else {
            console.log('[OAuthCallback] Existing user found with DB role:', role);
          }
        } else if (!role) {
          role = 'customer'; // safe default
        }

        // Final navigation logic - exact match for the DB role
        const targetPath = role === 'provider' ? '/provider/dashboard' 
                         : role === 'admin' ? '/admin/dashboard' 
                         : '/dashboard';
        
        // Use a hard browser redirect instead of React Router's navigate().
        // This guarantees that AuthContext completely re-mounts and fetches the 
        // freshly corrected database state, completely avoiding the race condition.
        window.location.replace(targetPath);

      } catch (err) {
        console.error('OAuth callback error:', err);
        window.location.replace('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return <FullPageLoader />;
}
