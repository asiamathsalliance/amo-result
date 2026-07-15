/**
 * Multiplication sprint game engine — timer, scoring, input handling.
 * Preserves logic from multiplication-game.js.
 */
(function (global) {
    var MIN_FEEDBACK_MS = 200;
    var CORRECT_EXTRA_MS = 80;
    var WRONG_EXTRA_MS = 120;
    var MAX_DIGITS = 4;

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function multiplicationPoints(streakBefore) {
        return 5 + Math.min(streakBefore, 10);
    }

    function sanitizeInput(raw) {
        return String(raw).replace(/\D/g, '').slice(0, MAX_DIGITS);
    }

    function createSprintEngine(options) {
        var els = options.elements;
        var session = options.session;
        var onComplete = options.onComplete || function () {};

        var operandRange = session.operandRange || { a: [1, 12], b: [1, 10] };
        var SPRINT_DURATION = session.durationSeconds || 60;

        var phase = 'idle';
        var endsAt = 0;
        var startedAt = 0;
        var timerInterval = null;
        var score = 0;
        var correct = 0;
        var incorrect = 0;
        var attempts = 0;
        var bestStreak = 0;
        var currentStreak = 0;
        var currentProblem = { operandA: 1, operandB: 1 };
        var feedback = null;
        var submitting = false;

        function randomPair() {
            return {
                operandA: randInt(operandRange.a[0], operandRange.a[1]),
                operandB: randInt(operandRange.b[0], operandRange.b[1]),
            };
        }

        function clearFeedbackClasses() {
            els.gameCard.classList.remove('is-correct', 'is-wrong');
        }

        function applyFeedbackClass(isCorrect) {
            clearFeedbackClasses();
            void els.gameCard.offsetWidth;
            els.gameCard.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
        }

        function updateStreakBadge() {
            if (currentStreak >= 2) {
                els.streakBadge.textContent = currentStreak + ' streak';
                els.streakBadge.classList.add('is-visible');
            } else {
                els.streakBadge.classList.remove('is-visible');
            }
        }

        function renderProblem() {
            els.operandA.textContent = currentProblem.operandA;
            els.operandB.textContent = currentProblem.operandB;
        }

        function updateStats() {
            els.score.textContent = score;
            els.correct.textContent = correct;
            updateStreakBadge();
        }

        function getElapsedSeconds() {
            if (!startedAt) return SPRINT_DURATION;
            var elapsed = Math.round((Date.now() - startedAt) / 1000);
            return Math.min(SPRINT_DURATION, Math.max(0, elapsed));
        }

        function endSprint() {
            if (phase !== 'running') return;
            clearInterval(timerInterval);
            timerInterval = null;
            setFrozen(true);
            feedback = null;
            clearFeedbackClasses();
            phase = 'results';

            var accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

            if (els.playPanel) els.playPanel.classList.remove('is-active');
            if (els.resultsPanel) els.resultsPanel.classList.add('is-active');

            if (els.resultsLoading) els.resultsLoading.classList.remove('is-hidden');
            if (els.resultsContent) {
                els.resultsContent.classList.add('is-hidden');
                els.resultsContent.classList.remove('results-content--visible');
            }

            if (els.resultsCorrectHero) els.resultsCorrectHero.textContent = correct;
            if (els.resultsScore) els.resultsScore.textContent = score;
            if (els.resultsAccuracy) els.resultsAccuracy.textContent = accuracy + '%';
            if (els.resultsStreak) els.resultsStreak.textContent = bestStreak;

            onComplete({
                score: score,
                correct: correct,
                incorrect: incorrect,
                attempts: attempts,
                bestStreak: bestStreak,
                accuracy: accuracy,
                timeTakenSeconds: getElapsedSeconds(),
                mode: session.mode,
                alias: session.alias,
            });
        }

        function revealResults() {
            if (els.resultsLoading) els.resultsLoading.classList.add('is-hidden');
            if (els.resultsContent) {
                els.resultsContent.classList.remove('is-hidden');
                requestAnimationFrame(function () {
                    els.resultsContent.classList.add('results-content--visible');
                });
            }
        }

        function updateTimer() {
            var remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
            els.timer.textContent = remaining;
            var pct = (remaining / SPRINT_DURATION) * 100;
            els.timerFill.style.width = pct + '%';
            if (remaining <= 0) endSprint();
        }

        function setFrozen(frozen) {
            els.answerInput.disabled = frozen;
            els.keypad.querySelectorAll('.game-key').forEach(function (btn) {
                btn.disabled = frozen;
            });
        }

        function prepareBoard() {
            score = 0;
            correct = 0;
            incorrect = 0;
            attempts = 0;
            bestStreak = 0;
            currentStreak = 0;
            feedback = null;
            submitting = false;
            phase = 'countdown';
            startedAt = 0;

            updateStats();
            els.answerInput.value = '';
            clearFeedbackClasses();
            els.streakBadge.classList.remove('is-visible');

            if (els.gameQuestion) els.gameQuestion.classList.add('is-waiting');
            if (els.operandA) els.operandA.textContent = '';
            if (els.operandB) els.operandB.textContent = '';

            els.timer.textContent = String(SPRINT_DURATION);
            els.timerFill.style.width = '100%';

            setFrozen(true);
            if (els.playPanel) els.playPanel.classList.add('is-active');
            if (els.resultsPanel) els.resultsPanel.classList.remove('is-active');
        }

        function startSprint() {
            score = 0;
            correct = 0;
            incorrect = 0;
            attempts = 0;
            bestStreak = 0;
            currentStreak = 0;
            feedback = null;
            submitting = false;
            currentProblem = randomPair();
            startedAt = Date.now();

            if (els.gameQuestion) els.gameQuestion.classList.remove('is-waiting');
            renderProblem();
            updateStats();
            els.answerInput.value = '';
            clearFeedbackClasses();
            els.streakBadge.classList.remove('is-visible');

            endsAt = Date.now() + SPRINT_DURATION * 1000;
            els.timerFill.style.width = '100%';
            updateTimer();

            setFrozen(false);
            phase = 'running';
            if (els.playPanel) els.playPanel.classList.add('is-active');
            if (els.resultsPanel) els.resultsPanel.classList.remove('is-active');
            els.answerInput.focus();

            clearInterval(timerInterval);
            timerInterval = setInterval(updateTimer, 250);
        }

        function nextProblem() {
            currentProblem = randomPair();
            renderProblem();
            els.answerInput.value = '';
            els.answerInput.focus();
        }

        function submitAnswer(value) {
            if (phase !== 'running' || submitting || feedback) return;

            var trimmed = String(value).trim();
            if (trimmed === '') return;

            submitting = true;
            var userValue = parseInt(trimmed, 10);
            var expected = currentProblem.operandA * currentProblem.operandB;
            var isCorrect = userValue === expected;
            var streakBefore = currentStreak;
            var feedbackStartedAt = Date.now();

            attempts += 1;
            feedback = isCorrect ? 'correct' : 'wrong';
            applyFeedbackClass(isCorrect);

            if (isCorrect) {
                correct += 1;
                currentStreak += 1;
                bestStreak = Math.max(bestStreak, currentStreak);
                score += multiplicationPoints(streakBefore);
            } else {
                incorrect += 1;
                currentStreak = 0;
            }

            updateStats();

            var minHold = isCorrect
                ? MIN_FEEDBACK_MS + CORRECT_EXTRA_MS
                : MIN_FEEDBACK_MS + WRONG_EXTRA_MS;
            var waitMs = Math.max(0, minHold - (Date.now() - feedbackStartedAt));

            setTimeout(function () {
                if (phase !== 'running') return;
                feedback = null;
                submitting = false;
                clearFeedbackClasses();
                nextProblem();
            }, waitMs);
        }

        function handleKeyPress(key) {
            if (phase !== 'running' || feedback || submitting) return;

            if (key === 'clear') {
                els.answerInput.value = '';
                els.answerInput.focus();
                return;
            }
            if (key === 'submit') {
                submitAnswer(els.answerInput.value);
                return;
            }
            els.answerInput.value = sanitizeInput(els.answerInput.value + key);
            els.answerInput.focus();
        }

        function bindEvents() {
            els.answerInput.addEventListener('input', function () {
                if (phase !== 'running' || feedback || submitting) return;
                els.answerInput.value = sanitizeInput(els.answerInput.value);
            });

            els.answerInput.addEventListener('keydown', function (e) {
                if (phase !== 'running' || feedback || submitting) return;
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitAnswer(els.answerInput.value);
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    els.answerInput.value = '';
                }
            });

            els.keypad.querySelectorAll('.game-key').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    handleKeyPress(btn.getAttribute('data-key'));
                });
            });
        }

        bindEvents();

        return {
            prepareBoard: prepareBoard,
            startSprint: startSprint,
            endSprint: endSprint,
            revealResults: revealResults,
            getState: function () {
                return { phase: phase, score: score, correct: correct, attempts: attempts };
            },
        };
    }

    global.SprintEngine = { createSprintEngine: createSprintEngine };
})(window);
