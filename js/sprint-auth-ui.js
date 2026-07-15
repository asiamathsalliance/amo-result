/**
 * Google auth UI — header profile menu, settings modal (all pages), sprint entry card.
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

    var GOOGLE_ICON_SVG =
        '<svg viewBox="0 0 24 24" width="18" height="18">' +
            '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>' +
            '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>' +
            '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>' +
            '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>' +
        '</svg>';

    var SETTINGS_MODAL_HTML =
        '<div id="profileSettingsModal" class="modal">' +
            '<div class="modal-content profile-settings-modal">' +
                '<span id="profileSettingsClose" class="close-modal">&times;</span>' +
                '<h2>Account Settings</h2>' +
                '<p class="profile-settings-sub">Edit your multiplication game profile.</p>' +
                '<div class="profile-settings-fields">' +
                    '<div class="profile-field-group">' +
                        '<label for="profileSettingsEmail">Email</label>' +
                        '<div class="profile-field-readonly">' +
                            '<span class="profile-field-lock" aria-hidden="true">' +
                                '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z"/></svg>' +
                            '</span>' +
                            '<input type="email" id="profileSettingsEmail" readonly aria-readonly="true">' +
                        '</div>' +
                        '<p class="profile-field-hint">Linked to your Google account</p>' +
                    '</div>' +
                    '<div class="profile-field-group">' +
                        '<label for="profileSettingsUsername">Username</label>' +
                        '<input type="text" id="profileSettingsUsername" maxlength="20" placeholder="Leaderboard display name">' +
                    '</div>' +
                    '<div class="profile-field-row">' +
                        '<div class="profile-field-group">' +
                            '<label for="profileSettingsCountry">Country</label>' +
                            '<select id="profileSettingsCountry"></select>' +
                        '</div>' +
                        '<div class="profile-field-group">' +
                            '<label for="profileSettingsGrade">Grade</label>' +
                            '<select id="profileSettingsGrade"></select>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<p id="profileSettingsError" class="profile-settings-error" aria-live="polite"></p>' +
                '<div class="profile-settings-actions">' +
                    '<button type="button" id="profileSettingsSave" class="btn-secondary">Save</button>' +
                    '<button type="button" id="profileSettingsCancel" class="btn-outline">Cancel</button>' +
                '</div>' +
                '<div class="profile-settings-danger">' +
                    '<button type="button" id="profileSettingsDelete" class="profile-delete-btn">Delete account</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    var settingsModalBound = false;

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

    function ensureSettingsModal() {
        if (!$('profileSettingsModal')) {
            document.body.insertAdjacentHTML('beforeend', SETTINGS_MODAL_HTML);
        }
        bindSettingsModalEvents();
    }

    var settingsModalBound = false;
    var PROFILE_CACHE_KEY = 'amo_sprint_profile_cache';

    function cacheProfile(profile) {
        try {
            if (!profile) {
                sessionStorage.removeItem(PROFILE_CACHE_KEY);
                return;
            }
            sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
                username: profile.username || '',
                avatar_url: profile.avatar_url || '',
            }));
        } catch (e) {
            /* ignore storage errors */
        }
    }

    function readCachedProfile() {
        try {
            var raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || !data.username) return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function profileInitial(profile) {
        return String((profile && profile.username) || '?').charAt(0).toUpperCase();
    }

    function ensureHeaderGoogleBtn() {
        var actions = document.querySelector('.top-bar-actions');
        if (!actions || $('headerGoogleSignIn')) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'headerGoogleSignIn';
        btn.className = 'btn-google btn-google--header';
        btn.hidden = true;
        btn.innerHTML =
            '<span class="btn-google-icon" aria-hidden="true">' + GOOGLE_ICON_SVG + '</span>' +
            'Sign in with Google';

        var contactBtn = actions.querySelector('.nav-contact');
        if (contactBtn) {
            actions.insertBefore(btn, contactBtn);
        } else {
            actions.appendChild(btn);
        }
    }

    function renderHeaderGoogleBtn(profile) {
        var btn = $('headerGoogleSignIn');
        if (!btn) return;
        var show = !profile;
        btn.hidden = !show;
        btn.style.display = show ? '' : 'none';
        btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    function startGoogleSignIn() {
        var returnPath = SprintAuth.getReturnPath ? SprintAuth.getReturnPath() : 'index.html#multiplicationSection';
        return SprintAuth.signInWithGoogle(returnPath)
            .catch(function (err) {
                console.error(err);
                var hint = SprintAuth.oauthSetupHint ? SprintAuth.oauthSetupHint() : '';
                alert('Could not start Google sign-in.\n\n' + hint);
            });
    }

    function renderHeaderProfile(profile) {
        var wrap = $('headerProfileWrap');
        var img = $('profileAvatarImg');
        var fallback = $('profileAvatarFallback');
        if (!wrap || !img) return;

        if (!profile) {
            wrap.hidden = true;
            wrap.setAttribute('aria-hidden', 'true');
            img.hidden = true;
            img.removeAttribute('src');
            if (fallback) {
                fallback.hidden = true;
                fallback.textContent = '';
            }
            closeProfileDropdown();
            renderHeaderGoogleBtn(null);
            return;
        }

        wrap.hidden = false;
        wrap.setAttribute('aria-hidden', 'false');
        renderHeaderGoogleBtn(profile);
        var avatarUrl = String(profile.avatar_url || '').trim();
        var initial = profileInitial(profile);

        if (avatarUrl) {
            if (fallback) fallback.hidden = true;
            img.alt = profile.username + ' profile photo';

            if (img.getAttribute('src') === avatarUrl && !img.hidden) {
                return;
            }

            img.hidden = true;
            var preloader = new Image();
            preloader.onload = function () {
                if (img.getAttribute('src') !== avatarUrl) {
                    img.src = avatarUrl;
                }
                img.hidden = false;
            };
            preloader.onerror = function () {
                img.hidden = true;
                if (fallback) {
                    fallback.textContent = initial;
                    fallback.hidden = false;
                }
            };
            preloader.src = avatarUrl;
        } else {
            img.hidden = true;
            img.removeAttribute('src');
            if (fallback) {
                fallback.textContent = initial;
                fallback.hidden = false;
            }
            img.alt = profile.username;
        }
    }

    function needsProfileSetup(profile) {
        if (!profile) return false;
        return !String(profile.country || '').trim() || !String(profile.grade || '').trim();
    }

    function renderSprintEntry(profile) {
        var googleBtn = $('sprintGoogleSignIn');
        var startBtn = $('gameStartBtn');
        var card = $('gameEntryCard');
        var subtext = $('gameEntryCardSubtext');
        if (!googleBtn || !startBtn) return;

        if (!profile) {
            googleBtn.hidden = false;
            googleBtn.style.display = '';
            startBtn.disabled = true;
            if (card) card.classList.remove('game-entry-card--signed-in');
            if (subtext) {
                subtext.textContent = 'Sign in with Google to save your score on the leaderboard.';
            }
            return;
        }

        googleBtn.hidden = true;
        googleBtn.style.display = 'none';
        startBtn.disabled = false;
        if (card) card.classList.add('game-entry-card--signed-in');
        if (subtext) {
            subtext.textContent = 'Your scores are saved automatically — press Start Sprint when you are ready.';
        }
    }

    function openSettingsModal(profile, options) {
        ensureSettingsModal();
        var modal = $('profileSettingsModal');
        if (!modal || !profile) return;

        var isSetup = (options && options.setup) || needsProfileSetup(profile);
        var titleEl = modal.querySelector('h2');
        var subEl = modal.querySelector('.profile-settings-sub');
        var dangerEl = modal.querySelector('.profile-settings-danger');
        var cancelBtn = $('profileSettingsCancel');

        if (titleEl) {
            titleEl.textContent = isSetup ? 'Set Up Your Profile' : 'Account Settings';
        }
        if (subEl) {
            subEl.textContent = isSetup
                ? 'Choose a username, country, and grade before your first sprint.'
                : 'Edit your multiplication game profile.';
        }
        if (dangerEl) dangerEl.hidden = isSetup;
        if (cancelBtn) cancelBtn.hidden = isSetup;
        modal.classList.toggle('profile-settings-modal--setup', isSetup);

        $('profileSettingsEmail').value = profile.email || '';
        $('profileSettingsUsername').value = profile.username || '';
        fillSelect($('profileSettingsCountry'), COUNTRIES, profile.country || '');
        fillSelect($('profileSettingsGrade'), GRADES, profile.grade || '');
        $('profileSettingsError').textContent = '';
        resetSaveButton();
        setSettingsFormLocked(false);
        modal.style.display = 'flex';
    }

    function maybeOpenProfileSetup(profile) {
        if (!profile || !needsProfileSetup(profile)) return;
        openSettingsModal(profile, { setup: true });
    }

    function resetSaveButton() {
        var btn = $('profileSettingsSave');
        if (!btn) return;
        btn.disabled = false;
        btn.classList.remove('profile-settings-save-btn--saving', 'profile-settings-save-btn--saved');
        btn.innerHTML = 'Save';
        btn.setAttribute('aria-busy', 'false');
    }

    function setSaveButtonState(state) {
        var btn = $('profileSettingsSave');
        var modal = $('profileSettingsModal');
        if (!btn) return;

        if (state === 'saving') {
            btn.disabled = true;
            btn.classList.add('profile-settings-save-btn--saving');
            btn.classList.remove('profile-settings-save-btn--saved');
            btn.setAttribute('aria-busy', 'true');
            btn.innerHTML =
                '<span>SAVING...</span>' +
                '<span class="profile-settings-save-spinner" aria-hidden="true"></span>';
            if (modal) modal.classList.add('profile-settings-modal--saving');
            return;
        }

        if (state === 'saved') {
            btn.disabled = true;
            btn.classList.remove('profile-settings-save-btn--saving');
            btn.classList.add('profile-settings-save-btn--saved');
            btn.setAttribute('aria-busy', 'false');
            btn.innerHTML = '<span>SAVED!</span>';
            if (modal) modal.classList.remove('profile-settings-modal--saving');
            return;
        }

        resetSaveButton();
        if (modal) modal.classList.remove('profile-settings-modal--saving');
    }

    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function setSettingsFormLocked(locked) {
        var modal = $('profileSettingsModal');
        var closeBtn = $('profileSettingsClose');
        var cancelBtn = $('profileSettingsCancel');
        var deleteBtn = $('profileSettingsDelete');
        if (modal) modal.classList.toggle('profile-settings-modal--saving', locked);
        if (closeBtn) closeBtn.disabled = locked;
        if (cancelBtn) cancelBtn.disabled = locked;
        if (deleteBtn) deleteBtn.disabled = locked;
    }

    function clearSetupQueryParam() {
        var params = new URLSearchParams(window.location.search);
        if (!params.has('setupProfile')) return;
        params.delete('setupProfile');
        var query = params.toString();
        var cleanUrl = window.location.pathname +
            (query ? '?' + query : '') +
            window.location.hash;
        window.history.replaceState(null, '', cleanUrl);
    }

    function closeSettingsModal() {
        var modal = $('profileSettingsModal');
        if (!modal) return;
        modal.style.display = 'none';
        modal.classList.remove('profile-settings-modal--setup', 'profile-settings-modal--saving');
        var dangerEl = modal.querySelector('.profile-settings-danger');
        var cancelBtn = $('profileSettingsCancel');
        if (dangerEl) dangerEl.hidden = false;
        if (cancelBtn) cancelBtn.hidden = false;
        resetSaveButton();
        setSettingsFormLocked(false);
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

    function bindSettingsModalEvents() {
        if (settingsModalBound) return;
        settingsModalBound = true;

        var closeSettings = $('profileSettingsClose');
        if (closeSettings) closeSettings.addEventListener('click', closeSettingsModal);

        var cancelSettings = $('profileSettingsCancel');
        if (cancelSettings) cancelSettings.addEventListener('click', closeSettingsModal);

        var saveSettings = $('profileSettingsSave');
        if (saveSettings) {
            saveSettings.addEventListener('click', async function () {
                if (saveSettings.disabled && saveSettings.classList.contains('profile-settings-save-btn--saving')) {
                    return;
                }

                var errorEl = $('profileSettingsError');
                var username = $('profileSettingsUsername').value.trim();
                var country = $('profileSettingsCountry').value;
                var grade = $('profileSettingsGrade').value;
                var check = SprintSession.validateAlias(username);
                if (!check.valid) {
                    errorEl.textContent = check.error;
                    return;
                }
                if (!country || !grade) {
                    errorEl.textContent = 'Please select your country and grade.';
                    return;
                }

                errorEl.textContent = '';
                setSaveButtonState('saving');
                setSettingsFormLocked(true);

                var saveStarted = Date.now();

                try {
                    var profile = await SprintAuth.updateProfile({
                        username: check.alias,
                        country: country,
                        grade: grade,
                    });

                    var elapsed = Date.now() - saveStarted;
                    if (elapsed < 3000) {
                        await sleep(3000 - elapsed);
                    }

                    setSaveButtonState('saved');
                    renderHeaderProfile(profile);
                    renderSprintEntry(profile);
                    cacheProfile(profile);

                    await sleep(1000);
                    closeSettingsModal();
                    clearSetupQueryParam();
                } catch (err) {
                    setSaveButtonState('idle');
                    setSettingsFormLocked(false);
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
                    cacheProfile(null);
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

    function bindEvents() {
        ensureHeaderGoogleBtn();

        var googleBtn = $('sprintGoogleSignIn');
        if (googleBtn) {
            googleBtn.addEventListener('click', function () {
                startGoogleSignIn();
            });
        }

        var headerGoogleBtn = $('headerGoogleSignIn');
        if (headerGoogleBtn) {
            headerGoogleBtn.addEventListener('click', function () {
                startGoogleSignIn();
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
                var profile = SprintAuth.getProfile();
                if (!profile) return;
                openSettingsModal(profile);
            });
        }

        var signOutBtn = $('profileSignOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async function () {
                closeProfileDropdown();
                await SprintAuth.signOut();
                renderHeaderProfile(null);
                renderSprintEntry(null);
                cacheProfile(null);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!window.SprintAuth) return;

        ensureSettingsModal();
        bindEvents();

        SprintAuth.init()
            .then(function (result) {
                if (result.profile) {
                    cacheProfile(result.profile);
                } else {
                    cacheProfile(null);
                }
                renderHeaderProfile(result.profile);
                renderSprintEntry(result.profile);

                var params = new URLSearchParams(window.location.search);
                if (params.get('openSettings') === '1' && result.profile) {
                    openSettingsModal(result.profile);
                    clearSetupQueryParam();
                } else if (result.profile) {
                    maybeOpenProfileSetup(result.profile);
                    clearSetupQueryParam();
                }
            })
            .catch(function (err) {
                console.error('Auth init failed:', err);
            });

        SprintAuth.onAuthChange(function (event, _user, profile) {
            if (profile) cacheProfile(profile);
            else cacheProfile(null);
            renderHeaderProfile(profile);
            renderSprintEntry(profile);
            if (event === 'SIGNED_IN' && profile) {
                maybeOpenProfileSetup(profile);
            }
        });
    });
})();
