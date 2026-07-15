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
        var index = 0;

        if (countdownEl) countdownEl.classList.remove('is-hidden');

        function showStep() {
            countdownText.textContent = steps[index];
            countdownText.classList.remove('sprint-countdown-pop');
            void countdownText.offsetWidth;
            countdownText.classList.add('sprint-countdown-pop');

            index += 1;
            if (index < steps.length) {
                setTimeout(showStep, 1000);
            } else {
                setTimeout(function () {
                    if (countdownEl) countdownEl.classList.add('is-hidden');
                    if (onComplete) onComplete();
                }, 600);
            }
        }

        showStep();
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
