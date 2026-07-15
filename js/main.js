document.addEventListener('DOMContentLoaded', function() {
    const cutoffScores = {
        "AMC 10A": 1194.5,
        "AMC 10B": 11105,
        "AMC 12A": 1176.5,
        "AMC 12B": 1188.5
    };

    let tempFirstName, tempLastName, tempFullName, tempEmail, tempDob, tempCategory, tempResult, tempCertificate, tempMedal, tempCountry;
    function resetTempVariables() {
        tempFirstName = null;
        tempLastName = null;
        tempFullName = null;
        tempEmail = null;
        tempDob = null;
        tempCategory = null;
        tempResult = null;
        tempCertificate = null;
        tempMedal = null;
        tempCountry = null;
    }

    const loadingOverlay2 = document.getElementById('loadingOverlay2');


    const viewResult = document.getElementById('button1'); // View Result
    const downloadCert = document.getElementById('button2'); // download cert.

    const downloadContainer = document.getElementById('downloadContainer');
    const downloadOverlay = document.getElementById('downloadOverlay');
    downloadOverlay.style.display = 'none'; // hide initially
    downloadContainer.style.display = 'none'; // hide initially

    const progressBar = document.getElementById('downloadBar');
    const categorySelect = document.getElementById('categorySelect');
    const countrySelect = document.getElementById('countrySelect');

    /*get result modal box elements*/
    const emailBox = document.getElementById('emailBox');
    const closeBox = document.getElementById('closeBox');
    const submitEmail = document.getElementById('submitEmail');

    /*error box*/
    const errorBox = document.getElementById('errorModal');
    const closeErrorBox = document.getElementById('closeError');
    const errorText = document.getElementById('errorText');

    categorySelect.addEventListener('change', function() {
    if (this.value) {
        this.style.color = '#000';
    } else {
        this.style.color = '#999';
    }
    });

    countrySelect.addEventListener('change', function() {
    if (this.value) {
        this.style.color = '#000';
    } else {
        this.style.color = '#999';
    }
    });

    function getDirectDriveLink(shareLink) {
        const match = shareLink.match(/\/d\/(.*?)\//);
        return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : shareLink;
    }

    const headerMessage = document.getElementById('headerMessage');
    // VIEW RESULT BUTTON
    viewResult.addEventListener('click', function() {
        const headerMessage = document.getElementById('headerMessage');
        headerMessage.textContent = "Check Your Result!";
        emailBox.style.display = 'flex';
    });

    // CLOSE MODAL BUTTON FOR RESULT/CERTIFICATE
    function closeEmailModal() {
        emailBox.style.display = 'none';
        document.getElementById("categorySelect").selectedIndex = 0;
        document.getElementById("categorySelect").style.color = "#999";
        document.getElementById("countrySelect").selectedIndex = 0;
        document.getElementById("countrySelect").style.color = "#999";
    }
    closeBox.addEventListener('click', closeEmailModal);
    const closeEmailModalBtn = document.getElementById('closeEmailModal');
    if (closeEmailModalBtn) {
        closeEmailModalBtn.addEventListener('click', closeEmailModal);
    }

    // DOWNLOAD CERTIFICATE BUTTON
    downloadCert.addEventListener('click', function() {
        const headerMessage = document.getElementById('headerMessage');
        headerMessage.textContent = "Download Your Certificate!";
        emailBox.style.display = 'flex';

    });

    // SPINNER FUNCTIONS / ANIMATIONS. DONT TOUCH!
    function showSpinner() {
        loadingOverlay2.style.display = 'flex';
        const spinner = loadingOverlay2.querySelector('.spinner');
        spinner.style.display = 'flex'; 
        requestAnimationFrame(() => {
            loadingOverlay2.classList.add('active'); // smooth fade in
        });
    }
    function hideSpinnerKeepBackground() {
        const spinner = loadingOverlay2.querySelector('.spinner');
        spinner.style.display = 'none'; 
    }
    function resetSpinner() {
        loadingOverlay2.style.display = 'none';
        loadingOverlay2.classList.remove('active');
        const spinner = loadingOverlay2.querySelector('.spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
        void loadingOverlay2.offsetWidth; 
    }


    function fetchWithTimeout(url, options = {}, timeout = 6000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("timeout")), timeout)
            )
        ]);
    }

    function keepBackendAwake() {
        setInterval(() => {
            fetch("https://competition-backend-1-zd68.onrender.com/health")
            .then(res => {
                if (res.ok) console.log("✅ Backend ping successful");
                else console.warn("⚠️ Backend ping returned error:", res.status);
            })
            .catch(err => console.error("⚠️ Ping failed:", err));
        }, 5 * 60 * 1000); // 10 minutes
    }

        // Call it once when page loads
    keepBackendAwake();

    // FETCH STUDENT INFO FROM BACKEND RENDER
    async function updateStudentInfo(firstName, lastName, dob, email, category, country) {
        const data = { firstName, lastName, dob, email, category, country };
        try {
            const response = await fetchWithTimeout(
                "https://competition-backend-1-zd68.onrender.com/check-amo-result",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                },
                6000 // timeout after 6 seconds
            );
            const result = await response.json();

            if (result.success) {
                const student = result.student;
                tempFirstName    = student.firstName;
                tempLastName     = student.lastName;
                tempFullName     = student.fullName;
                tempEmail        = student.email;
                tempDob          = student.dob;
                tempCategory     = student.category;
                tempResult       = student.result;
                tempCertificate  = student.certificate;
                tempMedal        = student.medal;
                tempCountry      = student.country;
            } else {
                resetTempVariables();
                return null;
            }
        } catch (err) {
            errorText.textContent = "Server not responding. Please try again.";
            return null;
        }
    }



    /* CHECK RESULT / DOWNLOAD CERTIFICATE SUBMIT BUTTON */
    submitEmail.addEventListener('click', function() {
        /* VIEW RESULT */
        if(headerMessage.textContent === "Check Your Result!") {
            const firstName = capitalize(document.getElementById('firstNameInput').value.trim());
            const lastName = capitalize(document.getElementById('lastNameInput').value.trim());
            const dob = document.getElementById('dobInput').value;
            const email = document.getElementById('emailInput').value.trim();

            const categorySelect = document.getElementById('categorySelect');
            const selectedCategory = categorySelect.value;
            const countrySelect = document.getElementById('countrySelect');
            const selectedCountry = countrySelect.value;

            if (!firstName) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please enter your first name.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            if (!lastName) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please enter your last name.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            if (!dob && !email) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please enter your birth date or email.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            if(!selectedCountry) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please select a listed country.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            if(!selectedCategory) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please select a listed category.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            
            
            async function showResult() {
                try {
                    resetTempVariables();
                    resetSpinner();
                    showSpinner();

                    await updateStudentInfo(firstName, lastName, dob, email, selectedCategory, selectedCountry);

                    if(errorText.textContent === "Server not responding. Please try again.") {
                        showSpinner();
                        setTimeout(() => {
                            hideSpinnerKeepBackground();
                            loadingOverlay2.style.display = 'none';
                            errorBox.style.display = 'flex';
                            errorText.textContent = "Unable to find contestant.";
                        }, 2000);
                        closeErrorBox.addEventListener('click', function() {
                            errorBox.style.display = 'none';
                        });
                    } else if (tempCategory === null) {
                        showSpinner();
                        setTimeout(() => {
                            hideSpinnerKeepBackground();
                            loadingOverlay2.style.display = 'none';
                            errorBox.style.display = 'flex';
                            errorText.textContent = "Unable to find contestant.";
                        }, 2000);
                        closeErrorBox.addEventListener('click', function() {
                            errorBox.style.display = 'none';
                        });
                        return;
                    } else {
                        setTimeout(() => {
                            hideSpinnerKeepBackground();
                            loadingOverlay2.style.display = 'none';
                            document.getElementById('emailBox').style.display = 'none';

                            showResultModal();

                            categorySelect.selectedIndex = 0;
                            categorySelect.style.color = '#999';
                            
                        }, 1500);
                        document.querySelector('.close-result').addEventListener('click', () => {
                            document.getElementById('resultBox').style.display = 'none';
                            emailBox.style.display = 'none';
                        });
                    }
                } catch (err) {
                    return;
                }
            }
            showResult();
        
        
        /* DOWNLOAD CERTIFICATE*/
        } else {
            const firstName = capitalize(document.getElementById('firstNameInput').value.trim());
            const lastName = capitalize(document.getElementById('lastNameInput').value.trim());
            const dob = document.getElementById('dobInput').value;
            const email = document.getElementById('emailInput').value.trim();

            const categorySelect = document.getElementById('categorySelect');
            const selectedCategory = categorySelect.value;
            const countrySelect = document.getElementById('countrySelect');
            const selectedCountry = countrySelect.value;

            if (!firstName) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please enter your given first name.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            if (!lastName) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please enter your given last name.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            if (!dob && !email) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please enter your birth date or email.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            if(!selectedCountry) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please select a listed country.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }
            if(!selectedCategory) {
                showSpinner();
                setTimeout(() => {
                    hideSpinnerKeepBackground();
                    loadingOverlay2.style.display = 'none';
                    errorBox.style.display = 'flex';
                    errorText.textContent = "Please select a listed category.";
                }, 2000);
                closeErrorBox.addEventListener('click', function() {
                    errorBox.style.display = 'none';
                    resetSpinner();
                });
                return;
            }

            async function download() {
                try {
                    resetTempVariables();
                    resetSpinner();
                    showSpinner();

                    await updateStudentInfo(firstName, lastName, dob, email, selectedCategory, selectedCountry);

                    if(errorText.textContent === "Server not responding. Please try again.") {
                        showSpinner();
                        setTimeout(() => {
                            hideSpinnerKeepBackground();
                            loadingOverlay2.style.display = 'none';
                            errorBox.style.display = 'flex';
                            errorText.textContent = "Unable to find contestant.";
                        }, 2000);
                        closeErrorBox.addEventListener('click', function() {
                            errorBox.style.display = 'none';
                            loadingOverlay2.classList.remove('active');
                        });
                    } else if (tempCertificate === "" || tempCategory === null) {
                        showSpinner();
                        setTimeout(() => {
                            hideSpinnerKeepBackground();
                            loadingOverlay2.style.display = 'none';
                            errorBox.style.display = 'flex';
                            errorText.textContent = "Certificate has not released yet.";
                        }, 2000);
                        closeErrorBox.addEventListener('click', function() {
                            errorBox.style.display = 'none';
                            loadingOverlay2.classList.remove('active');
                        });
                    } else {
                        setTimeout(() => {
                            hideSpinnerKeepBackground();
                            loadingOverlay2.style.display = 'none';
                            downloadCertificate();
                        }, 2000);
                    }
                } catch (err) {
                    return;
                } 
            };
            download();
        }
        
    });

    // CLOSE BUTTON FOR ALL ERROR MODALS
    document.getElementById('closeError').addEventListener('click', function() {
        document.getElementById('errorModal').style.display = 'none';

    });

    function capitalizeFullName(name) {
        if (!name) return ""; // handle empty or undefined

        return name
            .split(" ")                    // split into words
            .filter(word => word.length)   // remove extra spaces
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()) // capitalize
            .join(" ");                    // join back into a string
    }

    

    // SHOW RESULT / 150 MODAL
    function showResultModal() {
        const modal = document.getElementById('resultBox');
        const name = document.getElementById('resultName');
        const messageText = document.getElementById('resultMessage');
        const scoreText = document.getElementById('resultText');
        const congratulationMessage = document.getElementById('resultCongratulation');

        
        if(tempMedal === 'Gold') {
            congratulationMessage.textContent = 'Congratulation for achieving GOLD!';

        } else if (tempMedal === 'Silver') {
            congratulationMessage.textContent = 'Congratulation for achieving SILVER!';

        } else if (tempMedal === 'Bronze') {
            congratulationMessage.textContent = 'Congratulation for achieving BRONZE!';

        } else {
            congratulationMessage.textContent = 'Thank you for participating in the AMO Preliminary Round.';
        }

        scoreText.textContent = tempResult + ' / 100';

        name.textContent = capitalize(tempFullName);

        messageText.textContent = 'Category: ' + tempCategory;
        modal.style.display = 'flex';

        setTimeout(function () {
            if (typeof fireResultConfetti === 'function') {
                fireResultConfetti();
            }
        }, 120);
    };

    // FORMAT NAME
    function capitalize(name) {
        if (!name) return '';
        return name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    }


    
    // LINK FROM RESULT MODAL TO DOWNLOAD CERTIFICATE MODAL
    document.getElementById("openCertLink").addEventListener("click", function(event) {
        event.preventDefault();
        resetSpinner();
        showSpinner();

        setTimeout(() => {
            document.getElementById("resultBox").style.display = "none";

            headerMessage.textContent = "Download Your Certificate!";
            document.getElementById("emailBox").style.display = "flex";
            hideSpinnerKeepBackground();
            loadingOverlay2.style.display = 'none';
            
        }, 1250);
        setTimeout (() => {
            resetSpinner();

        }, 1250);
    });

    /* ENQUIRY MODAL SET UP */
    document.querySelector("#enquiryModal .close-modal").onclick = function() {
        document.getElementById("enquiryForm").reset();
        document.getElementById("enquiryModal").style.display = "none";
    }


    /* EMAILJS FUNCTION */
    function sendEnquiryEmail() {
        let parms = {
            name: document.getElementById("enquiryName").value,
            email: document.getElementById("enquiryEmail").value,
            category: document.getElementById("enquiryCategory").value,
            message: document.getElementById("enquiryMessage").value
        };
        emailjs.send("service_btpe0sq", "template_hkzn2pc", parms);
        event.preventDefault();
        
    }

    // SUBMIT & SEND ENQUIRY
    document.getElementById("enquirySubmit").addEventListener("click", function(event) {
        const form = document.getElementById("enquiryForm");

        if (!form.checkValidity()) {
            event.preventDefault();
            form.reportValidity();
            return;
        } else {
            submitEnquiry();
        }     
    });


    /* CLOSE MODALS CLICKING OUTSIDE SET UP */
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("resultBox");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("certBox");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("emailBox");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("errorModal");
        if (event.target === modal) {
            modal.style.display = "none";
            resetSpinner();
        }
    });
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("enquiryModal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });



    /* DOWNLOAD CERTIFICATE WITH PROGRESS BAR */
    function downloadCertificate() {
        const scrollY = window.scrollY;
        downloadOverlay.classList.add('cert-download');
        downloadOverlay.style.display = 'flex';
        downloadContainer.style.display = 'flex';
        const message = document.getElementById('downloadLabel');
        message.textContent = "Downloading...";

        progressBar.style.width = '0%'; // reset

        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 5; // uneven progress for realism
            if (progress >= 100) {
                progress = 100;
                setTimeout(() => {
                    message.textContent = "Download Complete!";
                }, 300);
                progress = 100;
                clearInterval(interval);

                // Trigger download
                const directLink = getDirectDriveLink(tempCertificate);
                const link = document.createElement('a');
                link.href = directLink;
                link.download = 'Certificate.pdf';
                link.click();

                setTimeout(() => {
                    downloadOverlay.style.display = "none";
                    downloadOverlay.classList.remove('cert-download');
                    downloadContainer.style.display = "none";
                    message.textContent = "";
                    emailBox.style.display = 'none';
                    document.getElementById("categorySelect").selectedIndex = 0;
                    document.getElementById("categorySelect").style.color = "#999";
                    window.scrollTo(0, scrollY);
                }, 3800);
            }
            progressBar.style.width = progress + '%';
        }, 200); // update every 200ms
    }


    function submitEnquiry() {
        sendEnquiryEmail();
        downloadOverlay.classList.remove('cert-download');
        downloadOverlay.style.display = 'flex';
        downloadContainer.style.display = 'flex';
        const message = document.getElementById('downloadLabel');
        message.textContent = "Submitting enquiry...";

        progressBar.style.width = '0%'; // reset

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 5; // uneven progress for realism
            if (progress >= 100) {
                setTimeout(() => {
                    message.textContent = "We have received your enquiry!";
                }, 300);
                progress = 100;
                clearInterval(interval);
                
                setTimeout(() => {
                    downloadOverlay.style.display = "none";
                    downloadContainer.style.display = "none";
                    message.textContent = "";
                    document.getElementById("enquiryModal").style.display = "none";
                    document.getElementById("enquiryMessage").value = "";
                }, 2000);
            }
            progressBar.style.width = progress + '%';
        }, 200); // update every 200ms
    }


    /* SINGLE-PAGE SCROLL NAVIGATION */
    const navItems = document.querySelectorAll('.nav-item[data-target], .footer-link-btn[data-target]');
    const topBar = document.querySelector('.top-bar');
    const navToggle = document.getElementById('navToggle');
    const navClose = document.getElementById('navClose');
    const siteNav = document.getElementById('siteNav');
    const navOverlay = document.getElementById('navOverlay');
    const contactTriggers = document.querySelectorAll('.contact-nav');
    const headerOffset = 92;

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

    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (!targetSection) return;
            closeMobileNav();
            const scrollToTarget = () => {
                const y = targetSection.getBoundingClientRect().top + window.scrollY - headerOffset;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            };
            requestAnimationFrame(scrollToTarget);
        });
    });

    contactTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
            document.getElementById('enquiryModal').style.display = 'flex';
            closeMobileNav();
        });
    });

    const homeButton = document.querySelector('.home-button:not(.home-button--sprint)');
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            const targetSection = document.getElementById('amcSection');
            if (targetSection) {
                const y = targetSection.getBoundingClientRect().top + window.scrollY - headerOffset;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }
        });
    }

    if (window.location.hash) {
        const hashId = window.location.hash.slice(1);
        const hashSection = document.getElementById(hashId);
        if (hashSection) {
            setTimeout(() => {
                const y = hashSection.getBoundingClientRect().top + window.scrollY - headerOffset;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }, 120);
        }
    }

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute('id');
            document.querySelectorAll('.nav-item[data-target]').forEach((nav) => {
                nav.classList.toggle('active', nav.getAttribute('data-target') === id);
            });
        });
    }, { threshold: 0.35, rootMargin: '-10% 0px -45% 0px' });
    document.querySelectorAll('main section[id]').forEach(sec => sectionObserver.observe(sec));

    if (topBar) {
        const updateTopBarState = () => {
            topBar.classList.toggle('scrolled', window.scrollY > 4);
        };
        updateTopBarState();
        window.addEventListener('scroll', updateTopBarState, { passive: true });
    }

});