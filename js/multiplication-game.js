document.addEventListener('DOMContentLoaded', function() {
    const startPanel = document.getElementById('gameStartPanel');
    if (!startPanel) return;

    const SPRINT_DURATION = 60;
    const MIN_FEEDBACK_MS = 200;
    const CORRECT_EXTRA_MS = 80;
    const WRONG_EXTRA_MS = 120;
    const MAX_DIGITS = 4;
    const isStandalonePage = !document.getElementById('button1');

    let phase = 'idle';
    let endsAt = 0;
    let timerInterval = null;
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let attempts = 0;
    let bestStreak = 0;
    let currentStreak = 0;
    let currentProblem = { operandA: 1, operandB: 1 };
    let feedback = null;
    let submitting = false;

    const playPanel = document.getElementById('gamePlayPanel');
    const resultsPanel = document.getElementById('gameResultsPanel');
    const startBtn = document.getElementById('gameStartBtn');
    const tryAgainBtn = document.getElementById('gameTryAgainBtn');
    const scoreEl = document.getElementById('gameScore');
    const correctEl = document.getElementById('gameCorrect');
    const timerEl = document.getElementById('gameTimer');
    const timerFill = document.getElementById('gameTimerFill');
    const operandAEl = document.getElementById('gameOperandA');
    const operandBEl = document.getElementById('gameOperandB');
    const answerInput = document.getElementById('gameAnswerInput');
    const gameCard = document.getElementById('gameCard');
    const streakBadge = document.getElementById('gameStreakBadge');
    const keypad = document.getElementById('gameKeypad');
    const resultsScore = document.getElementById('resultsScore');
    const resultsCorrect = document.getElementById('resultsCorrect');
    const resultsAccuracy = document.getElementById('resultsAccuracy');
    const resultsStreak = document.getElementById('resultsStreak');

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomPair() {
        return {
            operandA: randInt(1, 12),
            operandB: randInt(1, 10)
        };
    }

    function multiplicationPoints(streakBefore) {
        return 5 + Math.min(streakBefore, 10);
    }

    function sanitizeInput(raw) {
        return raw.replace(/\D/g, '').slice(0, MAX_DIGITS);
    }

    function showPanel(name) {
        startPanel.classList.toggle('is-active', name === 'start');
        playPanel.classList.toggle('is-active', name === 'play');
        resultsPanel.classList.toggle('is-active', name === 'results');
        phase = name === 'start' ? 'idle' : name === 'play' ? 'running' : 'results';
    }

    function clearFeedbackClasses() {
        gameCard.classList.remove('is-correct', 'is-wrong');
    }

    function applyFeedbackClass(isCorrect) {
        clearFeedbackClasses();
        void gameCard.offsetWidth;
        gameCard.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
    }

    function updateStreakBadge() {
        if (currentStreak >= 2) {
            streakBadge.textContent = currentStreak + ' streak';
            streakBadge.classList.add('is-visible');
        } else {
            streakBadge.classList.remove('is-visible');
        }
    }

    function renderProblem() {
        operandAEl.textContent = currentProblem.operandA;
        operandBEl.textContent = currentProblem.operandB;
    }

    function updateStats() {
        scoreEl.textContent = score;
        correctEl.textContent = correct;
        updateStreakBadge();
    }

    function updateTimer() {
        const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        timerEl.textContent = remaining;
        const pct = (remaining / SPRINT_DURATION) * 100;
        timerFill.style.width = pct + '%';

        if (remaining <= 0) {
            endSprint();
        }
    }

    function setFrozen(frozen) {
        answerInput.disabled = frozen;
        keypad.querySelectorAll('.game-key').forEach(btn => {
            btn.disabled = frozen;
        });
    }

    function endSprint() {
        if (phase !== 'running') return;
        clearInterval(timerInterval);
        timerInterval = null;
        setFrozen(true);
        feedback = null;
        clearFeedbackClasses();

        const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
        resultsScore.textContent = score;
        resultsCorrect.textContent = correct;
        resultsAccuracy.textContent = accuracy + '%';
        resultsStreak.textContent = bestStreak;

        showPanel('results');
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

        renderProblem();
        updateStats();
        answerInput.value = '';
        clearFeedbackClasses();
        streakBadge.classList.remove('is-visible');

        endsAt = Date.now() + SPRINT_DURATION * 1000;
        timerFill.style.width = '100%';
        updateTimer();

        setFrozen(false);
        showPanel('play');
        answerInput.focus();

        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 250);
    }

    function nextProblem() {
        currentProblem = randomPair();
        renderProblem();
        answerInput.value = '';
        answerInput.focus();
    }

    function submitAnswer(value) {
        if (phase !== 'running' || submitting || feedback) return;

        const trimmed = String(value).trim();
        if (trimmed === '') return;

        submitting = true;
        const userValue = parseInt(trimmed, 10);
        const expected = currentProblem.operandA * currentProblem.operandB;
        const isCorrect = userValue === expected;
        const streakBefore = currentStreak;
        const feedbackStartedAt = Date.now();

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

        const minHold = isCorrect
            ? MIN_FEEDBACK_MS + CORRECT_EXTRA_MS
            : MIN_FEEDBACK_MS + WRONG_EXTRA_MS;
        const waitMs = Math.max(0, minHold - (Date.now() - feedbackStartedAt));

        setTimeout(() => {
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
            answerInput.value = '';
            answerInput.focus();
            return;
        }
        if (key === 'submit') {
            submitAnswer(answerInput.value);
            return;
        }
        answerInput.value = sanitizeInput(answerInput.value + key);
        answerInput.focus();
    }

    startBtn.addEventListener('click', startSprint);
    tryAgainBtn.addEventListener('click', startSprint);

    answerInput.addEventListener('input', function() {
        if (phase !== 'running' || feedback || submitting) return;
        answerInput.value = sanitizeInput(answerInput.value);
    });

    answerInput.addEventListener('keydown', function(e) {
        if (phase !== 'running' || feedback || submitting) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            submitAnswer(answerInput.value);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            answerInput.value = '';
        }
    });

    keypad.querySelectorAll('.game-key').forEach(btn => {
        btn.addEventListener('click', function() {
            handleKeyPress(btn.getAttribute('data-key'));
        });
    });

    if (isStandalonePage) {
        initStandalonePageChrome();
    }

    function initStandalonePageChrome() {
        const topBar = document.querySelector('.top-bar');
        const navToggle = document.getElementById('navToggle');
        const navClose = document.getElementById('navClose');
        const siteNav = document.getElementById('siteNav');
        const navOverlay = document.getElementById('navOverlay');

        function closeMobileNav() {
            if (!siteNav || !navToggle || !navOverlay) return;
            siteNav.classList.remove('is-open');
            navOverlay.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', 'false');
        }

        function openMobileNav() {
            if (!siteNav || !navToggle || !navOverlay) return;
            siteNav.classList.add('is-open');
            navOverlay.classList.add('is-open');
            navToggle.setAttribute('aria-expanded', 'true');
        }

        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const isOpen = siteNav && siteNav.classList.contains('is-open');
                if (isOpen) closeMobileNav();
                else openMobileNav();
            });
        }
        if (navOverlay) navOverlay.addEventListener('click', closeMobileNav);
        if (navClose) navClose.addEventListener('click', closeMobileNav);

        if (topBar) {
            const updateTopBarState = () => {
                topBar.classList.toggle('scrolled', window.scrollY > 4);
            };
            updateTopBarState();
            window.addEventListener('scroll', updateTopBarState, { passive: true });
        }

        const contactTriggers = document.querySelectorAll('.contact-nav');
        const enquiryModal = document.getElementById('enquiryModal');
        const closeModal = document.querySelector('#enquiryModal .close-modal');
        const enquirySubmit = document.getElementById('enquirySubmit');

        if (!enquiryModal) return;

        contactTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                enquiryModal.style.display = 'flex';
                closeMobileNav();
            });
        });

        if (closeModal) {
            closeModal.onclick = function() {
                document.getElementById('enquiryForm').reset();
                enquiryModal.style.display = 'none';
            };
        }

        window.addEventListener('click', function(event) {
            if (event.target === enquiryModal) {
                enquiryModal.style.display = 'none';
            }
        });

        if (enquirySubmit) {
            enquirySubmit.addEventListener('click', function(event) {
                const form = document.getElementById('enquiryForm');
                if (!form.checkValidity()) {
                    event.preventDefault();
                    form.reportValidity();
                    return;
                }
                submitEnquiry();
            });
        }

        function submitEnquiry() {
            const parms = {
                name: document.getElementById('enquiryName').value,
                email: document.getElementById('enquiryEmail').value,
                category: document.getElementById('enquiryCategory').value,
                message: document.getElementById('enquiryMessage').value
            };
            emailjs.send('service_btpe0sq', 'template_hkzn2pc', parms);

            const downloadOverlay = document.getElementById('downloadOverlay');
            const downloadContainer = document.getElementById('downloadContainer');
            const progressBar = document.getElementById('downloadBar');
            const message = document.getElementById('downloadLabel');

            downloadOverlay.style.display = 'flex';
            downloadContainer.style.display = 'flex';
            message.textContent = 'Submitting enquiry...';
            progressBar.style.width = '0%';

            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 5;
                if (progress >= 100) {
                    setTimeout(() => {
                        message.textContent = 'We have received your enquiry!';
                    }, 300);
                    progress = 100;
                    clearInterval(interval);

                    setTimeout(() => {
                        downloadOverlay.style.display = 'none';
                        downloadContainer.style.display = 'none';
                        message.textContent = '';
                        enquiryModal.style.display = 'none';
                        document.getElementById('enquiryMessage').value = '';
                    }, 2000);
                }
                progressBar.style.width = progress + '%';
            }, 200);
        }
    }
});
