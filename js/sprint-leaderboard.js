/**
 * Leaderboard page — fetch and render top sprint scores.
 */
document.addEventListener('DOMContentLoaded', function () {
    var tbody = document.getElementById('leaderboardBody');
    var statusEl = document.getElementById('leaderboardStatus');
    var tableWrap = document.querySelector('.leaderboard-table-wrap');
    if (!tbody) return;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showStatus(message, isError) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.classList.toggle('leaderboard-status--error', Boolean(isError));
    }

    function sortRows(rows) {
        return rows.slice().sort(function (a, b) {
            var correctDiff = Number(b.correct_count) - Number(a.correct_count);
            if (correctDiff !== 0) return correctDiff;
            return Number(b.score) - Number(a.score);
        });
    }

    function renderEmpty(message) {
        tbody.innerHTML = '';
        if (tableWrap) tableWrap.classList.add('is-empty');
        showStatus(message, false);
    }

    function displayValue(value) {
        var text = String(value || '').trim();
        return text ? escapeHtml(text) : '<span class="lb-muted">—</span>';
    }

    function renderAvatar(row) {
        if (row.avatar_url) {
            return '<img class="lb-avatar" src="' + escapeHtml(row.avatar_url) + '" alt="" loading="lazy">';
        }
        var initial = String(row.alias || '?').charAt(0).toUpperCase();
        return '<span class="lb-avatar lb-avatar--fallback" aria-hidden="true">' + escapeHtml(initial) + '</span>';
    }

    function renderRows(rows) {
        tbody.innerHTML = '';
        if (tableWrap) tableWrap.classList.remove('is-empty');
        showStatus('', false);

        rows.forEach(function (row, i) {
            var correct = Number(row.correct_count);
            if (isNaN(correct)) correct = 0;

            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td class="lb-player">' +
                    '<div class="lb-player-inner">' +
                        '<span class="lb-rank">' + (i + 1) + '</span>' +
                        renderAvatar(row) +
                        '<span class="lb-name">' + escapeHtml(row.alias) + '</span>' +
                    '</div>' +
                '</td>' +
                '<td class="lb-score">' + correct + '</td>' +
                '<td class="lb-grade">' + displayValue(row.grade) + '</td>' +
                '<td class="lb-country">' + displayValue(row.country) + '</td>';
            tbody.appendChild(tr);
        });
    }

    async function load() {
        if (typeof SprintSupabase === 'undefined') {
            renderEmpty('Leaderboard scripts failed to load. Please refresh the page.');
            return;
        }

        if (!SprintSupabase.isConfigured()) {
            renderEmpty('Leaderboard needs Supabase configured in js/supabase-config.local.js.');
            return;
        }

        showStatus('Loading scores…', false);

        try {
            var rows = await SprintSupabase.fetchLeaderboard(50);
            if (!Array.isArray(rows)) {
                throw new Error('Unexpected response from leaderboard API.');
            }
            rows = sortRows(rows);
            if (rows.length === 0) {
                renderEmpty('No scores yet. Play a sprint to appear here!');
                return;
            }
            renderRows(rows);
        } catch (err) {
            console.error('Leaderboard load failed:', err);
            renderEmpty('Could not load leaderboard.');
            showStatus('Could not load leaderboard: ' + (err.message || 'Please try again.'), true);
        }
    }

    load();
});
