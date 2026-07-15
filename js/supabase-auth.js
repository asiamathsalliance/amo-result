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

    function authRedirectUrl(nextPath) {
        var next = nextPath || SiteBase.path('index.html#multiplicationSection');
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
        var insertRes = await getClient()
            .from('multiplication_profiles')
            .insert({
                id: user.id,
                email: user.email,
                username: fallbackName.slice(0, 20) || 'player',
                avatar_url: user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture),
            })
            .select('id,email,username,country,grade,avatar_url,created_at,updated_at')
            .single();

        if (insertRes.error) throw insertRes.error;
        return insertRes.data;
    }

    async function init() {
        if (initPromise) return initPromise;

        initPromise = (async function () {
            currentUser = null;
            currentProfile = null;

            var sb = getClient();
            if (!sb) return { user: null, profile: null };

            var sessionRes = await sb.auth.getSession();
            if (sessionRes.error) throw sessionRes.error;

            var session = sessionRes.data && sessionRes.data.session;
            if (!session || !session.user) {
                return { user: null, profile: null };
            }

            currentUser = session.user;
            currentProfile = await ensureProfile(session.user);
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

    async function signInWithGoogle(nextPath) {
        var sb = getClient();
        if (!sb) throw new Error('Supabase is not configured.');

        var res = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: authRedirectUrl(nextPath),
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
    };
})(window);
