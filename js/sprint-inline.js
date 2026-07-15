/**
 * Main page multiplication section — Google auth + redirect to play page.
 */
document.addEventListener('DOMContentLoaded', function () {
    var section = document.getElementById('multiplicationSection');
    var startBtn = document.getElementById('gameStartBtn');

    if (!section || !startBtn) return;

    startBtn.addEventListener('click', function () {
        var profile = SprintAuth.getProfile();
        if (!profile) return;

        var result = SprintSession.createSessionFromProfile(profile);
        if (!result.ok) {
            alert(result.error || 'Could not start sprint.');
            return;
        }

        window.location.href = SiteBase.path('sprint/play/');
    });
});
