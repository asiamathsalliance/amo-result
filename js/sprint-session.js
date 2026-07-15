/**
 * Sprint sessionStorage helpers + alias validation.
 */
(function (global) {
    var STORAGE_KEY = 'sprintSession';
    var MAX_ALIAS_LEN = 20;
    var ALIAS_PATTERN = /^[a-zA-Z0-9 _-]+$/;
    var SPRINT_DURATION_SECONDS = 60;

    function containsProfanity(text) {
        if (global.SprintAliasModeration) {
            return !SprintAliasModeration.isAllowed(text).allowed;
        }
        return false;
    }

    function defaultSession(alias) {
        return {
            alias: alias,
            mode: 'MULTIPLICATION',
            durationSeconds: SPRINT_DURATION_SECONDS,
            operandRange: { a: [1, 12], b: [1, 10] },
            createdAt: Date.now(),
        };
    }

    function validateAlias(raw) {
        var trimmed = String(raw || '').trim();
        if (!trimmed) {
            return { valid: false, error: 'Nickname is required.' };
        }
        if (trimmed.length > MAX_ALIAS_LEN) {
            return { valid: false, error: 'Nickname must be ' + MAX_ALIAS_LEN + ' characters or fewer.' };
        }
        if (!ALIAS_PATTERN.test(trimmed)) {
            return { valid: false, error: 'Use letters, numbers, spaces, hyphens, or underscores only.' };
        }
        if (containsProfanity(trimmed)) {
            return { valid: false, error: 'Please choose a different nickname.' };
        }
        return { valid: true, alias: trimmed };
    }

    function persistSession(session) {
        var json = JSON.stringify(session);
        try {
            sessionStorage.setItem(STORAGE_KEY, json);
        } catch (e) { /* ignore */ }
        try {
            localStorage.setItem(STORAGE_KEY, json);
        } catch (e) { /* ignore */ }
    }

    function readStoredRaw() {
        try {
            return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function saveSession(session) {
        persistSession(session);
    }

    function readSession() {
        try {
            var raw = readStoredRaw();
            if (!raw) return null;
            var data = JSON.parse(raw);
            var check = validateAlias(data.alias);
            if (!check.valid) return null;
            if (!data.mode) return null;
            data.durationSeconds = SPRINT_DURATION_SECONDS;
            return data;
        } catch (e) {
            return null;
        }
    }

    function clearSession() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }
    }

    function createSessionFromProfile(profile) {
        if (!profile || !profile.id || !profile.username) {
            return { ok: false, error: 'Please sign in with Google to play.' };
        }
        var check = validateAlias(profile.username);
        if (!check.valid) {
            return { ok: false, error: check.error };
        }
        var session = defaultSession(check.alias);
        session.userId = profile.id;
        saveSession(session);
        return { ok: true, session: session };
    }

    function createSessionFromAlias(alias) {
        var check = validateAlias(alias);
        if (!check.valid) return { ok: false, error: check.error };
        var session = defaultSession(check.alias);
        saveSession(session);
        return { ok: true, session: session };
    }

    global.SprintSession = {
        STORAGE_KEY: STORAGE_KEY,
        SPRINT_DURATION_SECONDS: SPRINT_DURATION_SECONDS,
        validateAlias: validateAlias,
        saveSession: saveSession,
        readSession: readSession,
        clearSession: clearSession,
        createSessionFromProfile: createSessionFromProfile,
        createSessionFromAlias: createSessionFromAlias,
        defaultSession: defaultSession,
    };
})(window);
