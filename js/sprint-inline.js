/**
 * Main page multiplication section — alias validation, redirect to play page.
 */
document.addEventListener('DOMContentLoaded', function () {
    var section = document.getElementById('multiplicationSection');
    var aliasInput = document.getElementById('gameAliasInput');
    var aliasError = document.getElementById('gameAliasError');
    var aliasRequired = document.getElementById('gameAliasRequired');
    var startBtn = document.getElementById('gameStartBtn');

    if (!section || !aliasInput || !startBtn) return;

    function updateStartState() {
        var trimmed = aliasInput.value.trim();
        var check = SprintSession.validateAlias(aliasInput.value);
        startBtn.disabled = !check.valid;

        if (aliasRequired) {
            aliasRequired.hidden = trimmed.length > 0;
        }

        if (trimmed && !check.valid && check.error !== 'Nickname is required.') {
            aliasError.textContent = check.error;
        } else {
            aliasError.textContent = '';
        }
    }

    startBtn.addEventListener('click', function () {
        var result = SprintSession.createSessionFromAlias(aliasInput.value);
        if (!result.ok) {
            if (result.error !== 'Nickname is required.') {
                aliasError.textContent = result.error;
            }
            startBtn.disabled = true;
            return;
        }
        window.location.href = SiteBase.path('sprint/play/');
    });

    aliasInput.addEventListener('input', updateStartState);

    aliasInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !startBtn.disabled) {
            e.preventDefault();
            startBtn.click();
        }
    });

    if (window.location.hash === '#multiplicationSection') {
        var headerOffset = 92;
        setTimeout(function () {
            var y = section.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }, 200);
    }

    updateStartState();
});
