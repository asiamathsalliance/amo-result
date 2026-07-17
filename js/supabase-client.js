/**
 * Lightweight Supabase REST + authenticated client for sprint_leaderboard.
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
        return msg.indexOf('correct_count') !== -1 || msg.indexOf('user_id') !== -1;
    }

    function isMissingRpcError(err) {
        var msg = String((err && err.message) || '').toLowerCase();
        return msg.indexOf('upsert_sprint_leaderboard_best') !== -1 ||
            msg.indexOf('could not find the function') !== -1 ||
            msg.indexOf('function') !== -1 && msg.indexOf('does not exist') !== -1;
    }

    function compareScores(aCorrect, aScore, bCorrect, bScore) {
        var correctDiff = Number(bCorrect) - Number(aCorrect);
        if (correctDiff !== 0) return correctDiff;
        return Number(bScore) - Number(aScore);
    }

    async function getAuthHeaders() {
        var token = null;
        if (global.SprintAuth && SprintAuth.getAccessToken) {
            token = await SprintAuth.getAccessToken();
        }
        return {
            apikey: global.SUPABASE_ANON_KEY,
            Authorization: 'Bearer ' + (token || global.SUPABASE_ANON_KEY),
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
    }

    async function rest(path, options) {
        if (!isConfigured()) {
            throw new Error('Supabase not configured in js/supabase-config.js');
        }
        const url = global.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path;
        const baseHeaders = await getAuthHeaders();
        const res = await fetch(url, {
            ...options,
            headers: {
                ...baseHeaders,
                Prefer: options.prefer || 'return=minimal',
                ...(options.headers || {}),
            },
        });
        const text = await res.text();
        if (!res.ok) {
            throw new Error(text || 'Supabase request failed (' + res.status + ')');
        }
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    }

    async function insertLeaderboardRowLegacy(fullPayload) {
        return rest('sprint_leaderboard', {
            method: 'POST',
            body: JSON.stringify(fullPayload),
            prefer: 'return=representation',
        });
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
            user_id: row.user_id || null,
        };

        try {
            var rpcResult = await rest('rpc/upsert_sprint_leaderboard_best', {
                method: 'POST',
                body: JSON.stringify({
                    p_alias: fullPayload.alias,
                    p_score: fullPayload.score,
                    p_correct_count: fullPayload.correct_count,
                    p_time_taken_seconds: fullPayload.time_taken_seconds,
                    p_mode: fullPayload.mode,
                }),
            });

            if (rpcResult && typeof rpcResult.improved === 'boolean') {
                return {
                    improved: rpcResult.improved,
                    row: rpcResult.row || null,
                };
            }

            return { improved: true, row: rpcResult };
        } catch (err) {
            if (isMissingRpcError(err)) {
                await insertLeaderboardRowLegacy(fullPayload);
                return { improved: true, row: null };
            }
            if (!isMissingColumnError(err)) throw err;
            await rest('sprint_leaderboard', {
                method: 'POST',
                body: JSON.stringify({
                    alias: fullPayload.alias,
                    score: fullPayload.score,
                    time_taken_seconds: fullPayload.time_taken_seconds,
                    mode: fullPayload.mode,
                }),
                prefer: 'return=representation',
            });
            return { improved: true, row: null };
        }
    }

    async function fetchProfilesByUserIds(userIds) {
        var unique = [];
        var seen = {};
        userIds.forEach(function (id) {
            if (!id || seen[id]) return;
            seen[id] = true;
            unique.push(id);
        });
        if (!unique.length) return {};

        var filter = 'id=in.(' + unique.join(',') + ')';
        var profiles = await rest(
            'multiplication_profiles?select=id,country,grade,avatar_url,username&' + filter,
            { method: 'GET' }
        );

        var map = {};
        if (Array.isArray(profiles)) {
            profiles.forEach(function (profile) {
                map[profile.id] = profile;
            });
        }
        return map;
    }

    function enrichRowsWithProfiles(rows, profileMap) {
        return rows.map(function (row) {
            var profile = row.user_id ? profileMap[row.user_id] : null;
            return {
                alias: row.alias,
                score: row.score,
                correct_count: row.correct_count,
                time_taken_seconds: row.time_taken_seconds,
                mode: row.mode,
                created_at: row.created_at,
                user_id: row.user_id,
                country: profile && profile.country ? profile.country : '',
                grade: profile && profile.grade ? profile.grade : '',
                avatar_url: profile && profile.avatar_url ? profile.avatar_url : '',
            };
        });
    }

    function dedupeLeaderboardRows(rows) {
        var bestByKey = {};
        var order = [];

        rows.forEach(function (row) {
            var key = row.user_id ? ('user:' + row.user_id) : ('alias:' + String(row.alias || '').trim().toLowerCase());
            var existing = bestByKey[key];
            if (!existing || compareScores(row.correct_count, row.score, existing.correct_count, existing.score) > 0) {
                if (!existing) order.push(key);
                bestByKey[key] = row;
            }
        });

        return order.map(function (key) {
            return bestByKey[key];
        }).sort(function (a, b) {
            return compareScores(b.correct_count, b.score, a.correct_count, a.score);
        });
    }

    async function fetchLeaderboard(limit) {
        var maxRows = Math.max(Number(limit) || 50, 50);
        const fullQuery =
            'select=alias,score,correct_count,time_taken_seconds,mode,created_at,user_id' +
            '&order=correct_count.desc,score.desc' +
            '&limit=' + String(maxRows * 3);
        try {
            var rows = await rest('sprint_leaderboard?' + fullQuery, { method: 'GET' });
            if (!Array.isArray(rows)) return [];
            rows = dedupeLeaderboardRows(rows).slice(0, maxRows);
            var userIds = rows.map(function (row) { return row.user_id; });
            var profileMap = await fetchProfilesByUserIds(userIds);
            return enrichRowsWithProfiles(rows, profileMap);
        } catch (err) {
            if (!isMissingColumnError(err)) throw err;
            const legacyQuery =
                'select=alias,score,time_taken_seconds,mode,created_at' +
                '&order=score.desc' +
                '&limit=' + String(maxRows * 3);
            var legacyRows = await rest('sprint_leaderboard?' + legacyQuery, { method: 'GET' });
            if (!Array.isArray(legacyRows)) return [];
            legacyRows = dedupeLeaderboardRows(legacyRows.map(function (row) {
                return {
                    alias: row.alias,
                    score: row.score,
                    correct_count: row.score,
                    time_taken_seconds: row.time_taken_seconds,
                    mode: row.mode,
                    created_at: row.created_at,
                    user_id: null,
                };
            })).slice(0, maxRows);
            return legacyRows.map(function (row) {
                return {
                    alias: row.alias,
                    score: row.score,
                    correct_count: row.correct_count,
                    time_taken_seconds: row.time_taken_seconds,
                    mode: row.mode,
                    created_at: row.created_at,
                    user_id: null,
                    country: '',
                    grade: '',
                    avatar_url: '',
                };
            });
        }
    }

    global.SprintSupabase = {
        isConfigured,
        insertLeaderboardRow,
        fetchLeaderboard,
    };
})(window);
