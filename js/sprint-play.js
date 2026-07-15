/**
 * Sprint play page — session guard, countdown, engine init, Supabase insert, results reveal.
 */
document.addEventListener('DOMContentLoaded', async function () {
    if (window.SprintAuth) {
        await SprintAuth.init();
    }

    var session = SprintSession.readSession();
    var profile = SprintAuth.getProfile();

    if (!session || !profile || session.userId !== profile.id) {
        window.location.replace(SiteBase.path('index.html#multiplicationSection'));
        return;
    }

    var countdownEl = document.getElementById('sprintCountdown');
    var countdownText = document.getElementById('sprintCountdownText');
    var gameShell = document.getElementById('sprintGameShell');
    var playPanel = document.getElementById('gamePlayPanel');
    var resultsPanel = document.getElementById('gameResultsPanel');
    var aliasDisplay = document.getElementById('sprintAliasDisplay');
    var saveStatusEl = document.getElementById('resultsSaveStatus');
    var gameQuestion = document.getElementById('gameQuestion');

    var submitted = false;
    var RESULTS_LOADING_MS = 2000;

    var elements = {
        playPanel: playPanel,
        resultsPanel: resultsPanel,
        resultsLoading: document.getElementById('resultsLoading'),
        resultsContent: document.getElementById('resultsContent'),
        score: document.getElementById('gameScore'),
        correct: document.getElementById('gameCorrect'),
        timer: document.getElementById('gameTimer'),
        timerFill: document.getElementById('gameTimerFill'),
        operandA: document.getElementById('gameOperandA'),
        operandB: document.getElementById('gameOperandB'),
        answerInput: document.getElementById('gameAnswerInput'),
        gameCard: document.getElementById('gameCard'),
        gameQuestion: gameQuestion,
        streakBadge: document.getElementById('gameStreakBadge'),
        keypad: document.getElementById('gameKeypad'),
        resultsCorrectHero: document.getElementById('resultsCorrectHero'),
        resultsScore: document.getElementById('resultsScore'),
        resultsAccuracy: document.getElementById('resultsAccuracy'),
        resultsStreak: document.getElementById('resultsStreak'),
    };

    if (aliasDisplay) aliasDisplay.textContent = session.alias;
    if (playPanel) playPanel.classList.add('is-active');
    if (gameShell) gameShell.classList.add('is-visible');

    var engine = SprintEngine.createSprintEngine({
        session: session,
        elements: elements,
        onComplete: function (result) {
            handleComplete(result);
        },
    });

    engine.prepareBoard();

    setTimeout(function () {
        SprintUtils.scrollGameIntoView(gameShell);
    }, 80);

    async function submitScore(result) {
        if (submitted) return { ok: true, skipped: true };
        if (!SprintSupabase.isConfigured()) {
            return { ok: false, error: 'Supabase is not configured.' };
        }

        if (SprintAliasModeration) {
            var moderation = SprintAliasModeration.isAllowed(result.alias);
            if (!moderation.allowed) {
                return { ok: false, error: moderation.reason || 'Nickname not allowed.' };
            }
        }

        try {
            await SprintSupabase.insertLeaderboardRow({
                alias: result.alias,
                score: result.score,
                correct_count: result.correct,
                time_taken_seconds: result.timeTakenSeconds,
                mode: result.mode,
                user_id: result.userId || (SprintAuth.getProfile() && SprintAuth.getProfile().id),
            });
            submitted = true;
            return { ok: true };
        } catch (err) {
            console.error('Leaderboard save failed:', err);
            return { ok: false, error: err.message || 'Save failed' };
        }
    }

    async function handleComplete(result) {
        var saveResult = { ok: false, error: 'Save did not run.' };

        try {
            var savePromise = submitScore(result);
            var results = await Promise.all([savePromise, SprintUtils.sleep(RESULTS_LOADING_MS)]);
            saveResult = results[0];
        } catch (err) {
            console.error('Results handling failed:', err);
            saveResult = { ok: false, error: err.message || 'Unexpected error' };
        }

        if (engine) engine.revealResults();

        setTimeout(function () {
            if (typeof fireResultConfetti === 'function') {
                fireResultConfetti();
            }
        }, 80);

        if (saveStatusEl) {
            if (saveResult.ok && !saveResult.skipped) {
                saveStatusEl.textContent = 'Score saved to leaderboard.';
                saveStatusEl.classList.remove('results-save-status--error');
            } else if (!saveResult.ok) {
                saveStatusEl.textContent = 'Could not save score: ' + (saveResult.error || 'Unknown error');
                saveStatusEl.classList.add('results-save-status--error');
            } else {
                saveStatusEl.textContent = '';
            }
        }

        setTimeout(function () {
            SprintUtils.scrollGameIntoView(resultsPanel);
        }, 120);
    }

    SprintUtils.runCountdown({
        countdownEl: countdownEl,
        countdownText: countdownText,
        onComplete: function () {
            engine.startSprint();
        },
    });

    var homeBtn = document.getElementById('sprintBackHomeBtn');
    var leaderboardBtn = document.getElementById('sprintViewLeaderboardBtn');
    var playAgainBtn = document.getElementById('gameTryAgainBtn');

    if (homeBtn) {
        homeBtn.addEventListener('click', function () {
            SprintSession.clearSession();
            window.location.href = SiteBase.path('index.html');
        });
    }

    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', function () {
            window.location.href = SiteBase.path('leaderboard/');
        });
    }

    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', function () {
            window.location.href = SiteBase.path('index.html#multiplicationSection');
        });
    }
});
