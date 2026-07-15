/**
 * Shared sprint helpers — countdown + scroll game into view.
 */
(function (global) {
    function scrollGameIntoView(targetEl) {
        var target = targetEl ||
            document.getElementById('sprintGameShell') ||
            document.getElementById('multiplicationSection') ||
            document.querySelector('.game-shell');

        if (!target) return;

        requestAnimationFrame(function () {
            var headerOffset = 92;
            var rect = target.getBoundingClientRect();
            var viewportMid = window.innerHeight * 0.5;
            var targetMid = rect.top + rect.height * 0.5;
            var y = window.scrollY + targetMid - viewportMid - headerOffset * 0.25;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        });
    }

    function runCountdown(opts) {
        var countdownEl = opts.countdownEl;
        var countdownText = opts.countdownText;
        var onComplete = opts.onComplete;
        var steps = ['3', '2', '1', 'Go!'];
        var stepMs = 850;
        var fadeMs = 180;
        var index = 0;
        var cancelled = false;
        var timerIds = [];

        function clearTimers() {
            timerIds.forEach(function (id) {
                clearTimeout(id);
            });
            timerIds = [];
        }

        function schedule(fn, ms) {
            var id = setTimeout(fn, ms);
            timerIds.push(id);
            return id;
        }

        function finish() {
            if (cancelled) return;
            countdownEl.classList.add('is-hidden');
            countdownText.textContent = '';
            countdownText.classList.remove('sprint-countdown-pop', 'sprint-countdown-fade');
            if (onComplete) onComplete();
        }

        if (!countdownEl || !countdownText) {
            if (onComplete) onComplete();
            return { cancel: function () {} };
        }

        countdownText.textContent = '';
        countdownText.classList.remove('sprint-countdown-pop', 'sprint-countdown-fade');
        countdownEl.classList.remove('is-hidden');

        function showStep() {
            if (cancelled) return;

            if (index >= steps.length) {
                countdownText.classList.add('sprint-countdown-fade');
                schedule(finish, fadeMs + 120);
                return;
            }

            countdownText.classList.remove('sprint-countdown-pop');
            countdownText.classList.add('sprint-countdown-fade');

            schedule(function () {
                if (cancelled) return;

                countdownText.textContent = steps[index];
                countdownText.classList.remove('sprint-countdown-fade');
                void countdownText.offsetWidth;
                countdownText.classList.add('sprint-countdown-pop');

                index += 1;
                schedule(showStep, stepMs);
            }, index === 0 ? 100 : fadeMs);
        }

        schedule(showStep, 80);

        return {
            cancel: function () {
                cancelled = true;
                clearTimers();
                countdownEl.classList.add('is-hidden');
                countdownText.textContent = '';
                countdownText.classList.remove('sprint-countdown-pop', 'sprint-countdown-fade');
            },
        };
    }

    global.SprintUtils = {
        scrollGameIntoView: scrollGameIntoView,
        runCountdown: runCountdown,
        sleep: function (ms) {
            return new Promise(function (resolve) {
                setTimeout(resolve, ms);
            });
        },
    };
})(window);
