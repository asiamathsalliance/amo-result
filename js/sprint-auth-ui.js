/**
 * Google auth UI — header profile menu + multiplication entry card.
 */
(function () {
    var COUNTRIES = [
        'Singapore', 'Malaysia', 'Philippines', 'Indonesia', 'Thailand',
        'Vietnam', 'Japan', 'South Korea', 'China', 'India',
        'Australia', 'United States', 'United Kingdom', 'Canada', 'Other'
    ];

    var GRADES = [
        'Primary 4', 'Primary 5', 'Primary 6',
        'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12',
        'University', 'Other'
    ];

    function $(id) {
        return document.getElementById(id);
    }

    function fillSelect(select, options, selected) {
        if (!select) return;
        select.innerHTML = '';
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select…';
        placeholder.disabled = true;
        placeholder.hidden = true;
        if (!selected) placeholder.selected = true;
        select.appendChild(placeholder);

        options.forEach(function (value) {
            var opt = document.createElement('option');
            opt.value = value;
            opt.textContent = value;
            if (value === selected) opt.selected = true;
            select.appendChild(opt);
        });
    }

    function renderHeaderProfile(profile) {
        var wrap = $('headerProfileWrap');
        var img = $('profileAvatarImg');
        if (!wrap || !img) return;

        if (!profile) {
            wrap.hidden = true;
            return;
        }

        wrap.hidden = false;
        if (profile.avatar_url) {
            img.src = profile.avatar_url;
            img.alt = profile.username + ' profile photo';
        } else {
            img.removeAttribute('src');
            img.alt = profile.username;
        }
    }

    function renderSprintEntry(profile) {
        var signedOut = $('sprintAuthSignedOut');
        var signedIn = $('sprintAuthSignedIn');
        var continueAs = $('sprintContinueAs');
        var startBtn = $('gameStartBtn');
        if (!signedOut || !signedIn) return;

        if (!profile) {
            signedOut.hidden = false;
            signedIn.hidden = true;
            if (startBtn) startBtn.disabled = true;
            return;
        }

        signedOut.hidden = true;
        signedIn.hidden = false;
        if (continueAs) continueAs.textContent = profile.username;
        if (startBtn) startBtn.disabled = false;
    }

    function openSettingsModal(profile) {
        var modal = $('profileSettingsModal');
        if (!modal || !profile) return;

        $('profileSettingsEmail').value = profile.email || '';
        $('profileSettingsUsername').value = profile.username || '';
        fillSelect($('profileSettingsCountry'), COUNTRIES, profile.country || '');
        fillSelect($('profileSettingsGrade'), GRADES, profile.grade || '');
        $('profileSettingsError').textContent = '';
        modal.style.display = 'flex';
    }

    function closeSettingsModal() {
        var modal = $('profileSettingsModal');
        if (modal) modal.style.display = 'none';
    }

    function closeProfileDropdown() {
        var dropdown = $('profileDropdown');
        var btn = $('profileMenuBtn');
        if (dropdown) dropdown.hidden = true;
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function toggleProfileDropdown() {
        var dropdown = $('profileDropdown');
        var btn = $('profileMenuBtn');
        if (!dropdown || !btn) return;
        var open = dropdown.hidden;
        dropdown.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function bindEvents() {
        var googleBtn = $('sprintGoogleSignIn');
        if (googleBtn) {
            googleBtn.addEventListener('click', function () {
                SprintAuth.signInWithGoogle(SiteBase.path('index.html#multiplicationSection'))
                    .catch(function (err) {
                        console.error(err);
                        alert('Could not start Google sign-in. Check Supabase Google auth settings.');
                    });
            });
        }

        var menuBtn = $('profileMenuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleProfileDropdown();
            });
        }

        document.addEventListener('click', function () {
            closeProfileDropdown();
        });

        var settingsBtn = $('profileSettingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function () {
                closeProfileDropdown();
                var modal = $('profileSettingsModal');
                if (modal) {
                    openSettingsModal(SprintAuth.getProfile());
                    return;
                }
                window.location.href = SiteBase.path('index.html?openSettings=1#multiplicationSection');
            });
        }

        var signOutBtn = $('profileSignOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async function () {
                closeProfileDropdown();
                await SprintAuth.signOut();
                renderHeaderProfile(null);
                renderSprintEntry(null);
            });
        }

        var closeSettings = $('profileSettingsClose');
        if (closeSettings) closeSettings.addEventListener('click', closeSettingsModal);

        var cancelSettings = $('profileSettingsCancel');
        if (cancelSettings) cancelSettings.addEventListener('click', closeSettingsModal);

        var saveSettings = $('profileSettingsSave');
        if (saveSettings) {
            saveSettings.addEventListener('click', async function () {
                var errorEl = $('profileSettingsError');
                var username = $('profileSettingsUsername').value.trim();
                var check = SprintSession.validateAlias(username);
                if (!check.valid) {
                    errorEl.textContent = check.error;
                    return;
                }

                try {
                    var profile = await SprintAuth.updateProfile({
                        username: check.alias,
                        country: $('profileSettingsCountry').value,
                        grade: $('profileSettingsGrade').value,
                    });
                    renderHeaderProfile(profile);
                    renderSprintEntry(profile);
                    closeSettingsModal();
                } catch (err) {
                    errorEl.textContent = err.message || 'Could not save profile.';
                }
            });
        }

        var deleteBtn = $('profileSettingsDelete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async function () {
                if (!confirm('Delete your account and all multiplication game data? This cannot be undone.')) {
                    return;
                }
                try {
                    await SprintAuth.deleteAccount();
                    closeSettingsModal();
                    renderHeaderProfile(null);
                    renderSprintEntry(null);
                } catch (err) {
                    $('profileSettingsError').textContent = err.message || 'Could not delete account.';
                }
            });
        }

        window.addEventListener('click', function (e) {
            var modal = $('profileSettingsModal');
            if (modal && e.target === modal) closeSettingsModal();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!window.SprintAuth) return;

        bindEvents();

        SprintAuth.init()
            .then(function (result) {
                renderHeaderProfile(result.profile);
                renderSprintEntry(result.profile);

                var params = new URLSearchParams(window.location.search);
                if (params.get('openSettings') === '1' && result.profile) {
                    openSettingsModal(result.profile);
                }
            })
            .catch(function (err) {
                console.error('Auth init failed:', err);
            });

        SprintAuth.onAuthChange(function (_event, _user, profile) {
            renderHeaderProfile(profile);
            renderSprintEntry(profile);
        });
    });
})();
