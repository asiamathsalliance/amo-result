/**
 * Leaderboard page — fetch and render top sprint scores.
 */
document.addEventListener('DOMContentLoaded', function () {
    var tbody = document.getElementById('leaderboardBody');
    var statusEl = document.getElementById('leaderboardStatus');
    var tableWrap = document.querySelector('.leaderboard-table-wrap');
    if (!tbody) return;

    function formatRelativeTime(iso) {
        var then = new Date(iso).getTime();
        if (isNaN(then)) return '—';
        var diff = Math.max(0, Date.now() - then);
        var sec = Math.floor(diff / 1000);
        if (sec < 60) return sec + 's ago';
        var min = Math.floor(sec / 60);
        if (min < 60) return min + 'm ago';
        var hr = Math.floor(min / 60);
        if (hr < 24) return hr + 'h ago';
        var day = Math.floor(hr / 24);
        if (day < 7) return day + 'd ago';
        return new Date(iso).toLocaleDateString();
    }

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

    function renderRows(rows) {
        tbody.innerHTML = '';
        if (tableWrap) tableWrap.classList.remove('is-empty');
        showStatus('', false);

        rows.forEach(function (row, i) {
            var correct = Number(row.correct_count);
            if (isNaN(correct)) correct = 0;
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td class="lb-rank">' + (i + 1) + '</td>' +
                '<td class="lb-alias">' + escapeHtml(row.alias) + '</td>' +
                '<td class="lb-correct">' + correct + '</td>' +
                '<td class="lb-when">' + formatRelativeTime(row.created_at) + '</td>';
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
