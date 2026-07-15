/**
 * Confetti burst for result modals (AMO + sprint).
 */
(function (global) {
    function styleConfettiCanvases() {
        document.querySelectorAll('body > canvas').forEach(function (canvas) {
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '10000';
            canvas.style.pointerEvents = 'none';
        });
    }

    function fireResultConfetti() {
        if (typeof global.confetti !== 'function') return;

        var colors = ['#B08D57', '#14213D', '#FFFFFF', '#2F6F4E', '#1C2B4A'];
        var base = {
            ticks: 220,
            gravity: 0.9,
            decay: 0.92,
            startVelocity: 28,
            colors: colors,
        };

        global.confetti(Object.assign({}, base, {
            particleCount: 90,
            spread: 70,
            origin: { x: 0.18, y: 0.58 },
        }));
        global.confetti(Object.assign({}, base, {
            particleCount: 90,
            spread: 70,
            origin: { x: 0.82, y: 0.58 },
        }));
        global.confetti(Object.assign({}, base, {
            particleCount: 150,
            spread: 120,
            origin: { x: 0.5, y: 0.42 },
        }));

        setTimeout(styleConfettiCanvases, 0);
        setTimeout(styleConfettiCanvases, 80);
    }

    global.fireResultConfetti = fireResultConfetti;
})(window);
