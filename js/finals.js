/**
 * AMO 2026 Trial Round — medal lists (requires js/finals-2026-data.js).
 */
(function () {
    var DATA = window.FINALS_2026_DATA || [];
    var CATS = {
        NK: { name: 'Normal Kidbee', cut: [52, 41, 36] },
        OK: { name: 'Open Kidbee', cut: [67, 58, 50] },
        NS: { name: 'Normal Senior', cut: [74, 57, 49] },
        OS: { name: 'Open Senior', cut: [87, 76, 64] },
    };
    var AW = [
        ['G', 'Gold', 'g', true],
        ['S', 'Silver', 's', true],
        ['B', 'Bronze', 'b', false],
    ];
    var cat = 'NK';

    function $(id) {
        return document.getElementById(id);
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function buildTabs() {
        var tabs = $('finalsTabs');
        if (!tabs) return;
        tabs.innerHTML = Object.entries(CATS)
            .map(function (entry) {
                var k = entry[0];
                var c = entry[1];
                var n = DATA.filter(function (r) {
                    return r[0] === k;
                }).length;
                return (
                    '<button type="button" class="finals-tab" role="tab" data-k="' +
                    k +
                    '" aria-selected="' +
                    (k === cat) +
                    '">' +
                    esc(c.name) +
                    ' <span class="c">(' +
                    n +
                    ')</span></button>'
                );
            })
            .join('');
        tabs.querySelectorAll('.finals-tab').forEach(function (b) {
            b.onclick = function () {
                cat = b.dataset.k;
                buildTabs();
                buildCountries();
                render();
            };
        });
    }

    function buildCountries() {
        var select = $('finalsCountry');
        if (!select) return;
        var keep = select.value || '';
        var countrySet = {};
        DATA.filter(function (r) {
            return r[0] === cat;
        }).forEach(function (r) {
            countrySet[r[6]] = true;
        });
        var cs = Object.keys(countrySet).sort();
        select.innerHTML =
            '<option value="">All countries</option>' +
            cs
                .map(function (c) {
                    return '<option' + (c === keep ? ' selected' : '') + '>' + esc(c) + '</option>';
                })
                .join('');
    }

    function render() {
        var countryEl = $('finalsCountry');
        var qEl = $('finalsSearch');
        var summaryEl = $('finalsSummary');
        var groupsEl = $('finalsGroups');
        if (!groupsEl) return;

        var country = countryEl ? countryEl.value : '';
        var q = qEl ? qEl.value.trim().toLowerCase() : '';
        var rows = DATA.filter(function (r) {
            if (r[0] !== cat) return false;
            if (country && r[6] !== country) return false;
            if (q && (r[3] + ' ' + r[4]).toLowerCase().indexOf(q) === -1) return false;
            return true;
        });
        if (countryEl) {
            countryEl.classList.toggle('is-placeholder', !country);
        }

        if (summaryEl) {
            summaryEl.textContent =
                country || q
                    ? 'Showing ' +
                      rows.length +
                      ' matching student' +
                      (rows.length === 1 ? '' : 's') +
                      '.'
                    : '';
        }

        groupsEl.innerHTML = AW.map(function (aw) {
            var code = aw[0];
            var label = aw[1];
            var cls = aw[2];
            var fin = aw[3];
            var g = rows.filter(function (r) {
                return r[1] === code;
            });
            var body = g.length
                ? g
                      .map(function (r) {
                          return (
                              '<div class="finals-row">' +
                              '<span class="finals-rank">#' +
                              r[2] +
                              '</span>' +
                              '<div class="finals-who"><b>' +
                              esc(r[3]) +
                              (code === 'B' && r[8]
                                  ? '<span class="finals-tag">Finalist</span>'
                                  : '') +
                              '</b><small>' +
                              esc(r[4]) +
                              (r[5] ? ' · ' + esc(r[5]) : '') +
                              ' · ' +
                              esc(r[6]) +
                              '</small></div>' +
                              '<div class="finals-score"><b>' +
                              r[7] +
                              '</b><small>score</small></div>' +
                              '</div>'
                          );
                      })
                      .join('')
                : '<div class="finals-empty">No ' + label.toLowerCase() + ' winners match.</div>';
            var bronzeFinCount =
                code === 'B'
                    ? g.filter(function (r) {
                          return r[8];
                      }).length
                    : 0;
            return (
                '<section class="finals-group ' +
                cls +
                '"><div class="finals-group-head"><h3>' +
                label +
                '</h3>' +
                (fin ? '<span class="finals-pill">Finalist</span>' : '') +
                '<span class="finals-count">' +
                g.length +
                ' student' +
                (g.length === 1 ? '' : 's') +
                (code === 'B'
                    ? ' · ' +
                      bronzeFinCount +
                      ' finalist' +
                      (bronzeFinCount === 1 ? '' : 's')
                    : '') +
                '</span></div><div class="finals-list">' +
                body +
                '</div></section>'
            );
        }).join('');
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!DATA.length) {
            var groupsEl = $('finalsGroups');
            if (groupsEl) {
                groupsEl.innerHTML =
                    '<p class="finals-empty">Finals data failed to load. Please refresh the page.</p>';
            }
            return;
        }
        var countryEl = $('finalsCountry');
        var qEl = $('finalsSearch');
        if (countryEl) countryEl.onchange = render;
        if (qEl) qEl.oninput = render;
        buildTabs();
        buildCountries();
        render();
    });
})();
