/**
 * Lightweight Supabase REST client for sprint_leaderboard (no SDK required).
 */
(function (global) {
    function isConfigured() {
        var url = String(global.SUPABASE_URL || '').trim();
        var key = String(global.SUPABASE_ANON_KEY || '').trim();
        return Boolean(
            url &&
            key &&
            url.indexOf('YOUR-PROJECT') === -1 &&
            key !== 'eyJ...'
        );
    }

    function isMissingColumnError(err) {
        var msg = String((err && err.message) || '');
        return msg.indexOf('correct_count') !== -1;
    }

    async function rest(path, options) {
        if (!isConfigured()) {
            throw new Error('Supabase not configured in js/supabase-config.js');
        }
        const url = global.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path;
        const res = await fetch(url, {
            ...options,
            headers: {
                apikey: global.SUPABASE_ANON_KEY,
                Authorization: 'Bearer ' + global.SUPABASE_ANON_KEY,
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Prefer: options.prefer || 'return=minimal',
                ...(options.headers || {}),
            },
        });
        const text = await res.text();
        if (!res.ok) {
            throw new Error(text || 'Supabase request failed (' + res.status + ')');
        }
        if (!text) return [];
        try {
            return JSON.parse(text);
        } catch (e) {
            return [];
        }
    }

    async function insertLeaderboardRow(row) {
        var alias = String(row.alias || '').trim();
        if (global.SprintAliasModeration) {
            var moderation = SprintAliasModeration.isAllowed(alias);
            if (!moderation.allowed) {
                throw new Error(moderation.reason || 'Nickname not allowed on leaderboard.');
            }
            alias = moderation.alias;
        }

        const fullPayload = {
            alias: alias,
            score: Math.max(0, Math.floor(Number(row.score) || 0)),
            correct_count: Math.max(0, Math.floor(Number(row.correct_count) || 0)),
            time_taken_seconds: Math.max(0, Math.floor(Number(row.time_taken_seconds) || 0)),
            mode: row.mode || 'MULTIPLICATION',
        };

        try {
            return await rest('sprint_leaderboard', {
                method: 'POST',
                body: JSON.stringify(fullPayload),
                prefer: 'return=representation',
            });
        } catch (err) {
            if (!isMissingColumnError(err)) throw err;
            const legacyPayload = {
                alias: fullPayload.alias,
                score: fullPayload.score,
                time_taken_seconds: fullPayload.time_taken_seconds,
                mode: fullPayload.mode,
            };
            return rest('sprint_leaderboard', {
                method: 'POST',
                body: JSON.stringify(legacyPayload),
                prefer: 'return=representation',
            });
        }
    }

    async function fetchLeaderboard(limit) {
        const fullQuery =
            'select=alias,score,correct_count,time_taken_seconds,mode,created_at' +
            '&order=correct_count.desc,score.desc' +
            '&limit=' + String(limit || 50);
        try {
            return await rest('sprint_leaderboard?' + fullQuery, { method: 'GET' });
        } catch (err) {
            if (!isMissingColumnError(err)) throw err;
            const legacyQuery =
                'select=alias,score,time_taken_seconds,mode,created_at' +
                '&order=score.desc' +
                '&limit=' + String(limit || 50);
            return rest('sprint_leaderboard?' + legacyQuery, { method: 'GET' });
        }
    }

    global.SprintSupabase = {
        isConfigured,
        insertLeaderboardRow,
        fetchLeaderboard,
    };
})(window);
