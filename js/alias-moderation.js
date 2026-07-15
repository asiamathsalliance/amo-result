/**
 * Alias moderation — blocks profanity, slurs, and obfuscated variants before leaderboard insert.
 */
(function (global) {
    var BLOCKED = [
        'fuck', 'fuk', 'fck', 'fcuk', 'shit', 'sh1t', 'bitch', 'b1tch', 'asshole', 'arsehole',
        'damn', 'cunt', 'cock', 'dick', 'pussy', 'whore', 'slut', 'piss', 'bastard', 'wanker',
        'bollocks', 'twat', 'nigger', 'nigga', 'n1gger', 'n1gga', 'negro', 'coon', 'chink',
        'gook', 'kike', 'spic', 'wetback', 'beaner', 'faggot', 'fag', 'dyke', 'tranny', 'retard',
        'retarded', 'rape', 'rapist', 'nazi', 'hitler', 'kkk', 'isis', 'terrorist', 'kill yourself',
        'kys', 'suicide', 'pedo', 'pedophile', 'childporn', 'incest', 'bestiality'
    ];

    var LEET_MAP = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a',
        '$': 's', '!': 'i', '+': 't'
    };

    function normalizeLeet(text) {
        var out = String(text || '').toLowerCase();
        out = out.replace(/[0134578@$!+]/g, function (ch) {
            return LEET_MAP[ch] || ch;
        });
        return out;
    }

    function compact(text) {
        return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function collapseRepeats(text) {
        return String(text || '').replace(/(.)\1{2,}/g, '$1$1');
    }

    function variants(raw) {
        var base = String(raw || '').trim().toLowerCase();
        var leet = normalizeLeet(base);
        var forms = [
            base,
            leet,
            compact(base),
            compact(leet),
            collapseRepeats(base),
            collapseRepeats(leet),
            collapseRepeats(compact(base)),
            collapseRepeats(compact(leet)),
        ];
        var seen = {};
        return forms.filter(function (f) {
            if (!f || seen[f]) return false;
            seen[f] = true;
            return true;
        });
    }

    function containsBlockedTerm(text) {
        var checks = variants(text);
        for (var i = 0; i < checks.length; i++) {
            var form = checks[i];
            for (var j = 0; j < BLOCKED.length; j++) {
                if (form.indexOf(BLOCKED[j]) !== -1) return true;
            }
        }
        return false;
    }

    function isAllowed(raw) {
        var trimmed = String(raw || '').trim();
        if (!trimmed) {
            return { allowed: false, reason: 'Nickname is required.' };
        }
        if (containsBlockedTerm(trimmed)) {
            return { allowed: false, reason: 'Please choose a different nickname.' };
        }
        return { allowed: true, alias: trimmed };
    }

    global.SprintAliasModeration = {
        isAllowed: isAllowed,
        containsBlockedTerm: containsBlockedTerm,
    };
})(window);
