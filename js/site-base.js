/**
 * Detect GitHub Pages base path (e.g. /amo-result/) for subdirectory deploys.
 */
(function (global) {
    var cachedBase = null;

    function detectBasePath() {
        if (cachedBase !== null) return cachedBase;

        var scripts = document.getElementsByTagName('script');
        var marker = '/js/';

        for (var i = scripts.length - 1; i >= 0; i--) {
            var src = scripts[i].getAttribute('src');
            if (!src || src.indexOf(marker) === -1) continue;

            var pathname = src;
            try {
                pathname = new URL(src, global.location.href).pathname;
            } catch (e) {
                continue;
            }

            var idx = pathname.indexOf(marker);
            if (idx !== -1) {
                cachedBase = pathname.substring(0, idx + 1);
                return cachedBase;
            }
        }

        cachedBase = '/';
        return cachedBase;
    }

    function sitePath(relative) {
        var base = detectBasePath();
        var clean = String(relative || '').replace(/^\//, '');
        return base + clean;
    }

    global.SiteBase = {
        getBasePath: detectBasePath,
        path: sitePath,
    };
})(window);
