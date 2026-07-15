/**
 * Supabase Auth + multiplication profile helpers (Google OAuth).
 */
(function (global) {
    var client = null;
    var currentUser = null;
    var currentProfile = null;
    var initPromise = null;

    function isConfigured() {
        return typeof global.SprintSupabase !== 'undefined' && SprintSupabase.isConfigured();
    }

    function getClient() {
        if (!isConfigured()) return null;
        if (!client && global.supabase && global.supabase.createClient) {
            client = global.supabase.createClient(
                global.SUPABASE_URL,
                global.SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: false,
                    },
                }
            );
        }
        return client;
    }

    function getReturnPath() {
        var base = SiteBase.getBasePath();
        var path = global.location.pathname;
        if (path.indexOf(base) === 0) {
            path = path.slice(base.length);
        }
        path = path.replace(/^\//, '');
        if (!path || path === 'index.html') {
            path = 'index.html' + (global.location.hash || '#multiplicationSection');
        } else {
            path = path + global.location.search + global.location.hash;
        }
        return path;
    }

    function authRedirectUrl(nextPath) {
        var next = nextPath || SiteBase.path(getReturnPath());
        if (next.indexOf('/') !== 0 && next.indexOf('http') !== 0) {
            next = SiteBase.path(next);
        }
        return global.location.origin + SiteBase.path('auth/callback.html') +
            '?next=' + encodeURIComponent(next);
    }

    async function fetchProfile(userId) {
        var sb = getClient();
        if (!sb || !userId) return null;

        var res = await sb
            .from('multiplication_profiles')
            .select('id,email,username,country,grade,avatar_url,created_at,updated_at')
            .eq('id', userId)
            .maybeSingle();

        if (res.error) throw res.error;
        return res.data;
    }

    async function ensureProfile(user) {
        var profile = await fetchProfile(user.id);
        if (profile) return profile;

        var fallbackName = String(user.email || 'player').split('@')[0];
        var baseUsername = (fallbackName.slice(0, 20) || 'player').replace(/[^a-zA-Z0-9 _-]/g, '') || 'player';
        var finalUsername = baseUsername;
        var suffix = 0;

        while (suffix < 50) {
            var insertRes = await getClient()
                .from('multiplication_profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    username: finalUsername,
                    avatar_url: user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture),
                })
                .select('id,email,username,country,grade,avatar_url,created_at,updated_at')
                .single();

            if (!insertRes.error) return insertRes.data;

            var errMsg = String(insertRes.error.message || '');
            var isDuplicate = insertRes.error.code === '23505' || errMsg.indexOf('unique') !== -1;
            if (!isDuplicate) throw insertRes.error;

            suffix += 1;
            finalUsername = (baseUsername.slice(0, 17) || 'player') + suffix;
        }

        throw new Error('Could not create profile. Please try again.');
    }

    async function init() {
        if (initPromise) return initPromise;

        initPromise = (async function () {
            currentUser = null;
            currentProfile = null;

            var sb = getClient();
            if (!sb) return { user: null, profile: null };

            var sessionRes = await sb.auth.getSession();
            if (sessionRes.error) {
                try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* ignore */ }
                return { user: null, profile: null };
            }

            var session = sessionRes.data && sessionRes.data.session;
            if (!session || !session.user) {
                return { user: null, profile: null };
            }

            currentUser = session.user;
            try {
                currentProfile = await ensureProfile(session.user);
            } catch (profileErr) {
                console.error('Profile setup failed:', profileErr);
                currentProfile = null;
            }
            return { user: currentUser, profile: currentProfile };
        })();

        return initPromise;
    }

    function getUser() {
        return currentUser;
    }

    function getProfile() {
        return currentProfile;
    }

    async function getAccessToken() {
        var sb = getClient();
        if (!sb) return null;
        var sessionRes = await sb.auth.getSession();
        var session = sessionRes.data && sessionRes.data.session;
        return session ? session.access_token : null;
    }

    function oauthSetupHint() {
        var origin = global.location.origin;
        var supabaseHost = String(global.SUPABASE_URL || '').replace(/\/$/, '');
        var supabaseCallback = supabaseHost ? supabaseHost + '/auth/v1/callback' : '(your-project).supabase.co/auth/v1/callback';
        return (
            'Google OAuth setup (fix "Access blocked / request is invalid"):\n\n' +
            'GOOGLE CLOUD CONSOLE → Credentials → OAuth 2.0 Client (type: Web application)\n' +
            '  Authorized JavaScript origins:\n    ' + origin + '\n' +
            '  Authorized redirect URIs (Supabase only — NOT localhost):\n    ' + supabaseCallback + '\n\n' +
            'SUPABASE → Authentication → Providers → Google\n' +
            '  Use the Client ID + Secret from that same Google OAuth client.\n\n' +
            'SUPABASE → Authentication → URL Configuration → Redirect URLs:\n    ' + origin + '/**\n\n' +
            'Use one host consistently (localhost vs 127.0.0.1 are different).'
        );
    }

    async function signInWithGoogle(nextPath) {
        var sb = getClient();
        if (!sb) throw new Error('Supabase is not configured.');

        try {
            await sb.auth.signOut({ scope: 'local' });
        } catch (e) {
            /* clear stale local session before fresh OAuth */
        }
        currentUser = null;
        currentProfile = null;
        initPromise = null;

        var returnPath = nextPath || getReturnPath();
        var res = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: authRedirectUrl(returnPath),
                queryParams: {
                    prompt: 'select_account',
                },
            },
        });

        if (res.error) throw res.error;
        return res.data;
    }

    async function signOut() {
        var sb = getClient();
        if (sb) await sb.auth.signOut();
        currentUser = null;
        currentProfile = null;
        initPromise = null;
        if (global.SprintSession) SprintSession.clearSession();
    }

    async function updateProfile(fields) {
        var sb = getClient();
        if (!sb || !currentUser) throw new Error('Not signed in.');

        var payload = {
            username: fields.username,
            country: fields.country,
            grade: fields.grade,
            updated_at: new Date().toISOString(),
        };

        var res = await sb
            .from('multiplication_profiles')
            .update(payload)
            .eq('id', currentUser.id)
            .select('id,email,username,country,grade,avatar_url,created_at,updated_at')
            .single();

        if (res.error) throw res.error;
        currentProfile = res.data;
        return currentProfile;
    }

    async function deleteAccount() {
        var sb = getClient();
        if (!sb || !currentUser) throw new Error('Not signed in.');

        var res = await sb.rpc('delete_own_account');
        if (res.error) throw res.error;

        await signOut();
    }

    function onAuthChange(callback) {
        var sb = getClient();
        if (!sb) return function () {};

        var sub = sb.auth.onAuthStateChange(function (event, session) {
            if (!session || !session.user) {
                currentUser = null;
                currentProfile = null;
                initPromise = null;
                callback(event, null, null);
                return;
            }

            currentUser = session.user;
            ensureProfile(session.user)
                .then(function (profile) {
                    currentProfile = profile;
                    callback(event, currentUser, currentProfile);
                })
                .catch(function (err) {
                    console.error('Profile load failed:', err);
                    callback(event, currentUser, null);
                });
        });

        return function () {
            if (sub && sub.data && sub.data.subscription) {
                sub.data.subscription.unsubscribe();
            }
        };
    }

    global.SprintAuth = {
        init: init,
        getUser: getUser,
        getProfile: getProfile,
        getAccessToken: getAccessToken,
        signInWithGoogle: signInWithGoogle,
        signOut: signOut,
        updateProfile: updateProfile,
        deleteAccount: deleteAccount,
        onAuthChange: onAuthChange,
        isConfigured: isConfigured,
        oauthSetupHint: oauthSetupHint,
        getReturnPath: getReturnPath,
    };
})(window);
