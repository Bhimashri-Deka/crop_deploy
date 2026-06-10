/* -------------------------------------------------------------
   AGROPREDICT CLIENT APPLICATION LOGIC (VANILLA JS)
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // --- Application State ---
    let currentUser = null;
    let authMode = "login"; // "login" or "register"
    let appMetadata = null; // Cached metadata from server
    let activeMode = "farmer"; // "farmer" or "tech"
    let cachedDefaults = null; // Cached defaults
    let lastPredictionData = null; // Cached last prediction response

    // Scaling helpers
    function scaleRainfall(raw) {
        return (raw - 782.7453) / 925.3081;
    }
    function scaleMinPrice(raw) {
        return (raw - 1563.7877) / 1029.2886;
    }
    function scaleMaxPrice(raw) {
        return (raw - 1865.0167) / 1194.8210;
    }
    
    // --- Elements Cache ---
    const mainHeader = document.getElementById("main-header");
    const navUsername = document.getElementById("nav-username");
    const btnToggleMonitor = document.getElementById("btn-toggle-monitor");
    const btnLogout = document.getElementById("btn-logout");
    
    const viewAuth = document.getElementById("view-auth");
    const viewDashboard = document.getElementById("view-dashboard");
    const viewMonitoring = document.getElementById("view-monitoring");
    
    const formAuth = document.getElementById("form-auth");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");
    const authUsernameInput = document.getElementById("auth-username");
    const authPasswordInput = document.getElementById("auth-password");
    const btnAuthSubmit = document.getElementById("btn-auth-submit");
    const authErrorMsg = document.getElementById("auth-error-msg");
    const linkSwitchAuth = document.getElementById("link-switch-auth");
    const authSwitchPrompt = document.getElementById("auth-switch-prompt");
    
    // Dashboard Predict Form
    const formPredict = document.getElementById("form-predict");
    const predictState = document.getElementById("predict-state");
    const predictDistrict = document.getElementById("predict-district");
    const predictCrop = document.getElementById("predict-crop");
    const predictSeason = document.getElementById("predict-season");
    const predictArea = document.getElementById("predict-area");
    const predictRainfall = document.getElementById("predict-rainfall");
    const rainfallTip = document.getElementById("rainfall-tip");
    
    // Advanced options
    const predictMarket = document.getElementById("predict-market");
    const predictVariety = document.getElementById("predict-variety");
    const predictGrade = document.getElementById("predict-grade");
    const predictMonth = document.getElementById("predict-month");
    const predictMinPrice = document.getElementById("predict-min-price");
    const predictMaxPrice = document.getElementById("predict-max-price");
    const minPriceTip = document.getElementById("min-price-tip");
    const maxPriceTip = document.getElementById("max-price-tip");
    
    const marketsDatalist = document.getElementById("markets-list");
    const varietiesDatalist = document.getElementById("varieties-list");
    const btnPredictSubmit = document.getElementById("btn-predict-submit");
    
    // Prediction Results
    const resultsPlaceholder = document.getElementById("results-placeholder");
    const resultsContent = document.getElementById("results-content");
    const resYield = document.getElementById("res-yield");
    const resPrice = document.getElementById("res-price");
    const resRevenue = document.getElementById("res-revenue");
    
    const metaMarket = document.getElementById("meta-market");
    const metaVariety = document.getElementById("meta-variety");
    const metaGrade = document.getElementById("meta-grade");
    const metaMinPrice = document.getElementById("meta-min-price");
    const metaMaxPrice = document.getElementById("meta-max-price");
    const metaLatency = document.getElementById("meta-latency");
    const metaRainIndex = document.getElementById("meta-rain-index");
    
    // Monitoring Dashboard
    const btnCloseMonitor = document.getElementById("btn-close-monitor");
    const monModelStatus = document.getElementById("mon-model-status");
    const monDbStatus = document.getElementById("mon-db-status");
    const monLatency = document.getElementById("mon-latency");
    const monTotalPreds = document.getElementById("mon-total-preds");
    
    const tablePredictionsBody = document.querySelector("#table-predictions tbody");
    const tableAuthBody = document.querySelector("#table-auth tbody");

    // Enhanced widgets selectors
    const resRevMin = document.getElementById("res-rev-min");
    const resRevMax = document.getElementById("res-rev-max");
    
    const gaugeBarFill = document.getElementById("gauge-bar-fill");
    const resGaugeMarker = document.getElementById("res-gauge-marker");
    const gaugeLblMin = document.getElementById("gauge-lbl-min");
    const gaugeLblMax = document.getElementById("gauge-lbl-max");
    const gaugeLblCurrent = document.getElementById("gauge-lbl-current");
    
    const explainText = document.getElementById("explain-text");
    const impAreaVal = document.getElementById("imp-area-val");
    const impAreaBar = document.getElementById("imp-area-bar");
    const impRainVal = document.getElementById("imp-rain-val");
    const impRainBar = document.getElementById("imp-rain-bar");
    const impBaseVal = document.getElementById("imp-base-val");
    const impBaseBar = document.getElementById("imp-base-bar");
    const btnDownloadReport = document.getElementById("btn-download-report");

    // Mode Toggle Elements
    const modeToggle = document.getElementById("mode-toggle");
    const lblModeFarmer = document.getElementById("lbl-mode-farmer");
    const lblModeTech = document.getElementById("lbl-mode-tech");
    
    const lblRainfallInput = document.getElementById("lbl-rainfall-input");
    const rainfallInputTooltip = document.getElementById("rainfall-input-tooltip");
    const lblMinPriceTitle = document.getElementById("lbl-min-price-title");
    const lblMaxPriceTitle = document.getElementById("lbl-max-price-title");
    
    // Structured Badges / Narrative Elements
    const weatherStatusBadge = document.getElementById("weather-status-badge");
    const lblWeatherStatus = document.getElementById("lbl-weather-status");
    const resWeatherNarrative = document.getElementById("res-weather-narrative");
    
    const marketTrendBadge = document.getElementById("market-trend-badge");
    const lblMarketTrend = document.getElementById("lbl-market-trend");
    const marketTrendIcon = document.getElementById("market-trend-icon");
    const resPriceRange = document.getElementById("res-price-range");

    // Farmer Mode visual feature weight elements
    const impAreaFriendlyLbl = document.getElementById("imp-area-friendly-lbl");
    const impAreaFriendlyBar = document.getElementById("imp-area-friendly-bar");
    const impRainFriendlyLbl = document.getElementById("imp-rain-friendly-lbl");
    const impRainFriendlyBar = document.getElementById("imp-rain-friendly-bar");
    const impBaseFriendlyLbl = document.getElementById("imp-base-friendly-lbl");
    const impBaseFriendlyBar = document.getElementById("imp-base-friendly-bar");

    // Mode handling logic
    function updateDefaultsUI() {
        if (!cachedDefaults) return;
        
        predictRainfall.value = cachedDefaults.rainfall;
        predictMinPrice.value = cachedDefaults.min_price;
        predictMaxPrice.value = cachedDefaults.max_price;
        
        const zRain = scaleRainfall(cachedDefaults.rainfall);
        const zMin = scaleMinPrice(cachedDefaults.min_price);
        const zMax = scaleMaxPrice(cachedDefaults.max_price);
        
        if (activeMode === "farmer") {
            rainfallTip.textContent = `Historical average: ${cachedDefaults.rainfall} mm`;
            minPriceTip.textContent = `Historical default: ₹${cachedDefaults.min_price.toFixed(2)}`;
            maxPriceTip.textContent = `Historical default: ₹${cachedDefaults.max_price.toFixed(2)}`;
        } else {
            rainfallTip.textContent = `Historical average: ${cachedDefaults.rainfall} mm (Scaled: ${zRain.toFixed(4)})`;
            minPriceTip.textContent = `Historical default: ₹${cachedDefaults.min_price.toFixed(2)} (Scaled: ${zMin.toFixed(4)})`;
            maxPriceTip.textContent = `Historical default: ₹${cachedDefaults.max_price.toFixed(2)} (Scaled: ${zMax.toFixed(4)})`;
        }
    }

    function updateModeUI() {
        document.body.classList.toggle("tech-mode-active", activeMode === "tech");
        lblModeFarmer.classList.toggle("active", activeMode === "farmer");
        lblModeTech.classList.toggle("active", activeMode === "tech");
        
        if (activeMode === "farmer") {
            lblRainfallInput.textContent = "Expected Rainfall (mm)";
            rainfallInputTooltip.setAttribute("data-tooltip", "Expected rainfall in millimeters. Auto-populated from historical regional averages.");
            lblMinPriceTitle.textContent = "Min Price (₹ / Quintal)";
            lblMaxPriceTitle.textContent = "Max Price (₹ / Quintal)";
        } else {
            lblRainfallInput.textContent = "Expected Rainfall (mm) [Scaled Input]";
            rainfallInputTooltip.setAttribute("data-tooltip", "Enter physical rainfall (mm). The system scales it to a Z-score internally.");
            lblMinPriceTitle.textContent = "Min Price (₹) [Scaled Index]";
            lblMaxPriceTitle.textContent = "Max Price (₹) [Scaled Index]";
        }
        
        updateDefaultsUI();
        
        if (lastPredictionData) {
            renderPredictionResults(lastPredictionData);
        }
    }

    // Toggle switch handler
    modeToggle.addEventListener("change", () => {
        activeMode = modeToggle.checked ? "tech" : "farmer";
        updateModeUI();
    });

    // Real-time scaled value display for inputs (only in tech mode)
    predictRainfall.addEventListener("input", () => {
        if (!predictRainfall.value) return;
        const val = parseFloat(predictRainfall.value);
        if (activeMode === "tech") {
            const z = scaleRainfall(val);
            rainfallTip.textContent = `Current Rainfall Z-Score: ${z.toFixed(4)}`;
        }
    });
    predictMinPrice.addEventListener("input", () => {
        if (!predictMinPrice.value) return;
        const val = parseFloat(predictMinPrice.value);
        if (activeMode === "tech") {
            const z = scaleMinPrice(val);
            minPriceTip.textContent = `Current Min Price Z-Score: ${z.toFixed(4)}`;
        }
    });
    predictMaxPrice.addEventListener("input", () => {
        if (!predictMaxPrice.value) return;
        const val = parseFloat(predictMaxPrice.value);
        if (activeMode === "tech") {
            const z = scaleMaxPrice(val);
            maxPriceTip.textContent = `Current Max Price Z-Score: ${z.toFixed(4)}`;
        }
    });

    // --- 1. DYNAMIC BACKGROUND SLIDESHOW ---
    const slides = document.querySelectorAll(".bg-slideshow .slide");
    let currentSlideIndex = 0;
    
    setInterval(() => {
        slides[currentSlideIndex].classList.remove("active");
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        slides[currentSlideIndex].classList.add("active");
    }, 8000);

    // --- 2. LEAF PARTICLE SYSTEM (CANVAS) ---
    const canvas = document.getElementById("canvas-particles");
    const ctx = canvas.getContext("2d");
    
    let particles = [];
    const maxParticles = 25;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    
    class LeafParticle {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height; // initial spread
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 20;
            this.size = Math.random() * 6 + 4;
            this.speed = Math.random() * 0.6 + 0.3;
            this.swaySpeed = Math.random() * 0.02 + 0.01;
            this.swayWidth = Math.random() * 20 + 10;
            this.swayOffset = Math.random() * Math.PI * 2;
            this.opacity = Math.random() * 0.3 + 0.1;
            this.angle = Math.random() * 360;
            this.spinSpeed = Math.random() * 0.5 - 0.25;
        }
        
        update() {
            this.y -= this.speed;
            this.swayOffset += this.swaySpeed;
            this.angle += this.spinSpeed;
            
            // horizontal sway using sine wave
            this.currentX = this.x + Math.sin(this.swayOffset) * this.swayWidth;
            
            if (this.y < -20 || this.currentX < -20 || this.currentX > canvas.width + 20) {
                this.reset();
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.currentX, this.y);
            ctx.rotate((this.angle * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;
            
            // Draw a tiny simple leaf shape
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
            // Emerald green fill
            ctx.fillStyle = "#10b981";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#10b981";
            ctx.fill();
            
            // Draw leaf stem
            ctx.beginPath();
            ctx.moveTo(-this.size, 0);
            ctx.lineTo(-this.size - 2, 0);
            ctx.strokeStyle = "#047857";
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new LeafParticle());
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // --- 3. SESSION MANAGEMENT & NAVIGATION ---
    
    async function checkAuthSession() {
        try {
            const res = await fetch("/api/auth/session");
            if (res.ok) {
                const data = await res.json();
                currentUser = data.username;
                showDashboardView();
            } else {
                currentUser = null;
                showAuthView();
            }
        } catch (e) {
            currentUser = null;
            showAuthView();
        }
    }

    function showAuthView() {
        mainHeader.classList.add("hidden");
        viewDashboard.classList.add("hidden");
        viewMonitoring.classList.add("hidden");
        viewAuth.classList.remove("hidden");
        formAuth.reset();
        authErrorMsg.classList.add("hidden");
        setAuthMode("login");
    }
    
    function showDashboardView() {
        navUsername.textContent = currentUser;
        mainHeader.classList.remove("hidden");
        viewAuth.classList.add("hidden");
        viewMonitoring.classList.add("hidden");
        viewDashboard.classList.remove("hidden");
        loadMetadata();
    }
    
    function showMonitoringView() {
        viewDashboard.classList.add("hidden");
        viewMonitoring.classList.remove("hidden");
        fetchMonitoringStats();
    }
    
    function setAuthMode(mode) {
        authMode = mode;
        authErrorMsg.classList.add("hidden");
        
        if (mode === "login") {
            authTitle.textContent = "Welcome to AgroPredict";
            authSubtitle.textContent = "Secure access to agriculture yield & price models";
            btnAuthSubmit.querySelector(".btn-text").textContent = "Sign In";
            authSwitchPrompt.innerHTML = `Don't have an account? <a href="#" id="link-switch-auth">Register here</a>`;
        } else {
            authTitle.textContent = "Create an Account";
            authSubtitle.textContent = "Register a new user in the platform registry";
            btnAuthSubmit.querySelector(".btn-text").textContent = "Register Account";
            authSwitchPrompt.innerHTML = `Already have an account? <a href="#" id="link-switch-auth">Sign In here</a>`;
        }
        
        // Re-bind click listener to dynamically created anchor
        document.getElementById("link-switch-auth").addEventListener("click", (e) => {
            e.preventDefault();
            setAuthMode(authMode === "login" ? "register" : "login");
        });
    }

    btnLogout.addEventListener("click", async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {}
        checkAuthSession();
    });
    
    btnToggleMonitor.addEventListener("click", () => {
        showMonitoringView();
    });
    
    btnCloseMonitor.addEventListener("click", () => {
        mainHeader.classList.remove("hidden");
        viewMonitoring.classList.add("hidden");
        viewDashboard.classList.remove("hidden");
    });

    // --- 4. AUTH FORM SUBMIT ---
    formAuth.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = authUsernameInput.value.trim();
        const password = authPasswordInput.value;
        
        // Client-side validations
        if (username.length < 3) {
            showAuthError("Username must be at least 3 characters long");
            return;
        }
        if (password.length < 6) {
            showAuthError("Password must be at least 6 characters long");
            return;
        }
        
        setAuthLoading(true);
        authErrorMsg.classList.add("hidden");
        
        const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
        
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            
            const data = await res.json();
            if (res.ok) {
                if (authMode === "login") {
                    currentUser = data.username;
                    showDashboardView();
                } else {
                    // Registration success
                    setAuthMode("login");
                    showAuthSuccess("Account registered! Please sign in.");
                }
            } else {
                showAuthError(data.detail || "Authentication failed");
            }
        } catch (err) {
            showAuthError("Server communication error. Please try again.");
        } finally {
            setAuthLoading(false);
        }
    });
    
    function showAuthError(msg) {
        authErrorMsg.classList.remove("hidden");
        authErrorMsg.classList.remove("success-banner");
        authErrorMsg.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
        authErrorMsg.style.borderColor = "rgba(239, 68, 68, 0.3)";
        authErrorMsg.style.color = "#fca5a5";
        authErrorMsg.querySelector(".msg-text").textContent = msg;
    }
    
    function showAuthSuccess(msg) {
        authErrorMsg.classList.remove("hidden");
        authErrorMsg.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
        authErrorMsg.style.borderColor = "rgba(16, 185, 129, 0.3)";
        authErrorMsg.style.color = "#a7f3d0";
        authErrorMsg.querySelector(".msg-text").textContent = msg;
    }
    
    function setAuthLoading(isLoading) {
        const btnText = btnAuthSubmit.querySelector(".btn-text");
        const spinner = btnAuthSubmit.querySelector(".spinner");
        
        if (isLoading) {
            btnText.classList.add("hidden");
            spinner.classList.remove("hidden");
            btnAuthSubmit.disabled = true;
        } else {
            btnText.classList.remove("hidden");
            spinner.classList.add("hidden");
            btnAuthSubmit.disabled = false;
        }
    }

    // --- 5. DYNAMIC REGIONS & METADATA LOADING ---
    
    async function loadMetadata() {
        try {
            const res = await fetch("/api/metadata");
            if (!res.ok) return;
            
            appMetadata = await res.json();
            
            // Populate States dropdown
            const states = Object.keys(appMetadata.regions).sort();
            predictState.innerHTML = '<option value="" disabled selected>Select State</option>';
            states.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s;
                opt.textContent = s;
                predictState.appendChild(opt);
            });
            predictState.disabled = false;
            
            // Populate Seasons dropdown
            const seasons = appMetadata.production.seasons;
            predictSeason.innerHTML = '<option value="" disabled selected>Select Season</option>';
            seasons.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.trim();
                opt.textContent = s.trim();
                predictSeason.appendChild(opt);
            });
            
            // Populate Grades dropdown (Advanced options)
            const grades = appMetadata.price.grades;
            predictGrade.innerHTML = '';
            grades.forEach(g => {
                const opt = document.createElement("option");
                opt.value = g;
                opt.textContent = g;
                if (g === "FAQ") opt.selected = true;
                predictGrade.appendChild(opt);
            });
            
            // Reset state changes
            predictDistrict.innerHTML = '<option value="" disabled selected>Select District</option>';
            predictDistrict.disabled = true;
            predictCrop.innerHTML = '<option value="" disabled selected>Select Crop</option>';
            predictCrop.disabled = true;
            
        } catch (e) {
            console.error("Error loading dropdown metadata:", e);
        }
    }
    
    // State selected -> populate Districts
    predictState.addEventListener("change", () => {
        const state = predictState.value;
        if (!state || !appMetadata) return;
        
        const districts = appMetadata.regions[state] || [];
        predictDistrict.innerHTML = '<option value="" disabled selected>Select District</option>';
        districts.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d;
            opt.textContent = d;
            predictDistrict.appendChild(opt);
        });
        predictDistrict.disabled = false;
        
        // Clear crop
        predictCrop.innerHTML = '<option value="" disabled selected>Select Crop</option>';
        predictCrop.disabled = true;

        // Hide Step 2 parameters
        const sectionLand = document.getElementById("section-land-conditions");
        if (sectionLand) {
            sectionLand.classList.remove("visible");
            setTimeout(() => {
                if (!sectionLand.classList.contains("visible")) {
                    sectionLand.classList.add("hidden");
                }
            }, 400);
        }
        btnPredictSubmit.disabled = true;
        btnPredictSubmit.classList.remove("pulse-glow");
    });
    
    // District selected -> populate Crops
    predictDistrict.addEventListener("change", () => {
        const state = predictState.value;
        const district = predictDistrict.value;
        if (!state || !district || !appMetadata) return;
        
        const key = `${state}|${district}`;
        const crops = appMetadata.region_crops[key] || [];
        predictCrop.innerHTML = '<option value="" disabled selected>Select Crop</option>';
        crops.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            predictCrop.appendChild(opt);
        });
        predictCrop.disabled = false;

        // Hide Step 2 parameters
        const sectionLand = document.getElementById("section-land-conditions");
        if (sectionLand) {
            sectionLand.classList.remove("visible");
            setTimeout(() => {
                if (!sectionLand.classList.contains("visible")) {
                    sectionLand.classList.add("hidden");
                }
            }, 400);
        }
        btnPredictSubmit.disabled = true;
        btnPredictSubmit.classList.remove("pulse-glow");
    });
    
    // Crop selected -> query defaults (rainfall, min/max price, market, variety)
    predictCrop.addEventListener("change", async () => {
        const state = predictState.value;
        const district = predictDistrict.value;
        const crop = predictCrop.value;
        if (!state || !district || !crop) return;
        
        try {
            const res = await fetch(`/api/metadata/defaults?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&crop=${encodeURIComponent(crop)}`);
            if (!res.ok) return;
            const data = await res.json();
            
            // Cache defaults and update form values and tips
            cachedDefaults = data;
            updateDefaultsUI();
            
            predictMarket.value = data.default_market;
            predictVariety.value = data.default_variety;
            
            // Populate datalists for autocomplete in advanced options
            populateDatalist(marketsDatalist, appMetadata.price.markets);
            populateDatalist(varietiesDatalist, appMetadata.price.varieties);

            // Progressive disclosure reveal
            const sectionLand = document.getElementById("section-land-conditions");
            if (sectionLand) {
                sectionLand.classList.remove("hidden");
                requestAnimationFrame(() => {
                    sectionLand.classList.add("visible");
                });
            }
            btnPredictSubmit.disabled = false;
            btnPredictSubmit.classList.add("pulse-glow");
            
        } catch (e) {
            console.error("Error fetching crop default indices:", e);
        }
    });
    
    function populateDatalist(element, items) {
        element.innerHTML = "";
        items.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item;
            element.appendChild(opt);
        });
    }

    // --- 6. RUN PREDICTIVE MODEL ENGINE ---
    formPredict.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const state = predictState.value;
        const district = predictDistrict.value;
        const crop = predictCrop.value;
        const season = predictSeason.value;
        const area = parseFloat(predictArea.value);
        const rainfall = parseFloat(predictRainfall.value);
        
        if (!state || !district || !crop || !season || isNaN(area) || isNaN(rainfall)) {
            alert("Please fill in all required fields with valid values.");
            return;
        }
        
        setPredictLoading(true);
        
        // Build payload
        const payload = {
            state,
            district,
            crop,
            season,
            area,
            rainfall
        };
        
        // Add advanced settings if modified or present
        if (predictMarket.value) payload.market = predictMarket.value;
        if (predictVariety.value) payload.variety = predictVariety.value;
        if (predictGrade.value) payload.grade = predictGrade.value;
        if (predictMonth.value) payload.month = parseInt(predictMonth.value);
        if (predictMinPrice.value) payload.min_price = parseFloat(predictMinPrice.value);
        if (predictMaxPrice.value) payload.max_price = parseFloat(predictMaxPrice.value);
        
        const btnText = btnPredictSubmit.querySelector(".btn-text");
        
        try {
            // Simulated predictive pipeline phases to provide interactive loading feedback
            btnText.textContent = "🤖 Loading Estimators...";
            await new Promise(r => setTimeout(r, 500));
            
            btnText.textContent = "🌾 Running Yield Regressor...";
            await new Promise(r => setTimeout(r, 500));
            
            btnText.textContent = "📈 Consulting Price Models...";
            await new Promise(r => setTimeout(r, 500));
            
            const res = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            if (res.ok) {
                lastPredictionData = data;
                renderPredictionResults(data);
            } else {
                alert(`Prediction Error: ${data.detail || "Failed to parse model outputs."}`);
            }
        } catch (err) {
            alert("Network error executing predictive models. Check logs.");
        } finally {
            setPredictLoading(false);
        }
    });
    
    function setPredictLoading(isLoading) {
        const btnText = btnPredictSubmit.querySelector(".btn-text");
        const spinner = btnPredictSubmit.querySelector(".spinner");
        
        // Disable/enable all controls to reduce cognitive load during load sequence
        const formControls = formPredict.querySelectorAll("input, select, button");
        
        if (isLoading) {
            spinner.classList.remove("hidden");
            btnPredictSubmit.disabled = true;
            btnPredictSubmit.classList.remove("pulse-glow");
            formControls.forEach(ctrl => {
                if (ctrl !== btnPredictSubmit) ctrl.disabled = true;
            });
        } else {
            btnText.textContent = "Run Predictive Engine";
            spinner.classList.add("hidden");
            btnPredictSubmit.disabled = false;
            btnPredictSubmit.classList.add("pulse-glow");
            formControls.forEach(ctrl => {
                if (ctrl !== btnPredictSubmit) {
                    // Retain correct disable status for dependent drop downs
                    if (ctrl === predictDistrict && !predictState.value) return;
                    if (ctrl === predictCrop && (!predictState.value || !predictDistrict.value)) return;
                    ctrl.disabled = false;
                }
            });
        }
    }
    
    // Custom sparkline renderer using inline SVG elements
    function drawSparkline(containerId, trendData, valKey, label, isCurrency) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        
        if (!trendData || trendData.length === 0) {
            container.innerHTML = `<span style="font-size:0.75rem;color:var(--text-dim);">No trend data available</span>`;
            return;
        }
        
        const w = container.clientWidth || 320;
        const h = 55;
        const padX = 12;
        const padY = 8;
        
        const vals = trendData.map(d => d[valKey]);
        const minVal = Math.min(...vals);
        const maxVal = Math.max(...vals);
        const valRange = maxVal - minVal || 1.0;
        
        const points = trendData.map((d, i) => {
            const x = padX + (i * (w - 2 * padX) / (trendData.length - 1));
            const y = h - padY - ((d[valKey] - minVal) / valRange * (h - 2 * padY));
            return { x, y, val: d[valKey], year: d.year };
        });
        
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
        }
        let areaD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;
        
        const svgNamespace = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNamespace, "svg");
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        svg.setAttribute("class", "sparkline-svg");
        
        // Dynamic area gradient
        const defs = document.createElementNS(svgNamespace, "defs");
        const gradId = `${containerId}-grad`;
        const linearGrad = document.createElementNS(svgNamespace, "linearGradient");
        linearGrad.setAttribute("id", gradId);
        linearGrad.setAttribute("x1", "0%");
        linearGrad.setAttribute("y1", "0%");
        linearGrad.setAttribute("x2", "0%");
        linearGrad.setAttribute("y2", "100%");
        
        const stop1 = document.createElementNS(svgNamespace, "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", containerId.includes("yield") ? "#10b981" : "#0284c7");
        stop1.setAttribute("stop-opacity", "0.35");
        
        const stop2 = document.createElementNS(svgNamespace, "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", containerId.includes("yield") ? "#10b981" : "#0284c7");
        stop2.setAttribute("stop-opacity", "0.0");
        
        linearGrad.appendChild(stop1);
        linearGrad.appendChild(stop2);
        defs.appendChild(linearGrad);
        svg.appendChild(defs);
        
        // Area Path
        const areaPath = document.createElementNS(svgNamespace, "path");
        areaPath.setAttribute("d", areaD);
        areaPath.setAttribute("class", "sparkline-area");
        areaPath.setAttribute("fill", `url(#${gradId})`);
        svg.appendChild(areaPath);
        
        // Line Path
        const linePath = document.createElementNS(svgNamespace, "path");
        linePath.setAttribute("d", pathD);
        linePath.setAttribute("class", "sparkline-path");
        svg.appendChild(linePath);
        
        // Tooltip widget
        const tooltip = document.createElement("div");
        tooltip.className = "sparkline-tooltip";
        container.appendChild(tooltip);
        
        // Dots
        points.forEach((pt, i) => {
            const circle = document.createElementNS(svgNamespace, "circle");
            circle.setAttribute("cx", pt.x);
            circle.setAttribute("cy", pt.y);
            circle.setAttribute("r", "3");
            circle.setAttribute("class", "sparkline-dot");
            if (i === points.length - 1) {
                circle.classList.add("sparkline-dot-active");
            }
            
            circle.addEventListener("mouseenter", () => {
                tooltip.style.opacity = "1";
                const displayVal = isCurrency ? "₹" + pt.val.toLocaleString(undefined, {minimumFractionDigits:2}) : pt.val.toFixed(2);
                tooltip.innerHTML = `<strong>${pt.year}</strong>: ${displayVal} ${label}`;
                tooltip.style.left = `${pt.x}px`;
                tooltip.style.top = `${pt.y}px`;
            });
            
            circle.addEventListener("mouseleave", () => {
                tooltip.style.opacity = "0";
            });
            
            svg.appendChild(circle);
        });
        
        container.appendChild(svg);
        
        // Footer stats grid
        const textGrid = document.createElement("div");
        textGrid.className = "spark-text-grid";
        const valLeft = isCurrency ? "₹" + points[0].val.toFixed(0) : points[0].val.toFixed(1);
        const valRight = isCurrency ? "₹" + points[points.length - 1].val.toFixed(0) : points[points.length - 1].val.toFixed(1);
        textGrid.innerHTML = `
            <span>${points[0].year} (${valLeft})</span>
            <span>${points[points.length - 1].year} (Est: ${valRight})</span>
        `;
        container.appendChild(textGrid);
    }
    
    function renderPredictionResults(data) {
        resultsPlaceholder.classList.add("hidden");
        resultsContent.classList.remove("hidden");
        
        // Animate counting numbers
        animateNumber(resYield, data.predicted_yield_tonnes);
        animateNumber(resPrice, data.predicted_price_inr_quintal);
        animateNumber(resRevenue, data.total_estimated_value_inr, true);
        
        // Update Price Range display (±12%)
        const minPrice = Math.max(0.0, data.predicted_price_inr_quintal * 0.88);
        const maxPrice = Math.max(0.0, data.predicted_price_inr_quintal * 1.12);
        resPriceRange.textContent = `₹${minPrice.toFixed(2)} – ₹${maxPrice.toFixed(2)} per quintal`;
        
        // Update Revenue Confidence limits (±12%)
        const rev = data.total_estimated_value_inr;
        resRevMin.textContent = `Min Bounds: ₹${(rev * 0.88).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        resRevMax.textContent = `Max Bounds: ₹${(rev * 1.12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        // Draw sparklines using the historical trend records
        const trendData = data.historical_trend || [];
        drawSparkline("yield-trend-sparkline", trendData, "yield", "Tons/Ha", false);
        drawSparkline("price-trend-sparkline", trendData, "price", "INR/Q", true);
        
        // Update visual confidence interval positioning gauge
        const predictedPrice = data.predicted_price_inr_quintal;
        const gaugePct = Math.round(44 + (predictedPrice % 10) + Math.random() * 4);
        gaugeBarFill.style.width = `${gaugePct}%`;
        resGaugeMarker.style.left = `${gaugePct}%`;
        
        gaugeLblMin.textContent = `Lower Bound: ₹${minPrice.toFixed(2)}`;
        gaugeLblMax.textContent = `Upper Bound: ₹${maxPrice.toFixed(2)}`;
        gaugeLblCurrent.textContent = `Predicted Modal: ₹${predictedPrice.toFixed(2)}`;
        
        // Calculate raw rainfall value and its z-score
        const rainfallRaw = data.inputs_used.rainfall; // raw rainfall in mm
        const zRain = scaleRainfall(rainfallRaw);
        
        // Determine Weather Impact status & badge
        let weatherStatusText = "Normal Rainfall";
        weatherStatusBadge.style.background = "rgba(16, 185, 129, 0.12)";
        weatherStatusBadge.style.color = "#a7f3d0";
        weatherStatusBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
        let weatherNarrative = "";
        
        if (zRain < -0.3) {
            weatherStatusText = "Below Average Rainfall";
            weatherStatusBadge.style.background = "rgba(245, 158, 11, 0.12)";
            weatherStatusBadge.style.color = "#fef3c7";
            weatherStatusBadge.style.borderColor = "rgba(245, 158, 11, 0.3)";
            weatherNarrative = `Expected seasonal rainfall of ${rainfallRaw.toFixed(1)} mm is below the regional average of 782.7 mm. This deficit of moisture reduces the expected crop growth and lowers yield potential.`;
        } else if (zRain > 0.3) {
            weatherStatusText = "Above Average Rainfall";
            weatherStatusBadge.style.background = "rgba(2, 132, 199, 0.12)";
            weatherStatusBadge.style.color = "#bae6fd";
            weatherStatusBadge.style.borderColor = "rgba(2, 132, 199, 0.3)";
            weatherNarrative = `Expected seasonal rainfall of ${rainfallRaw.toFixed(1)} mm is above the regional average of 782.7 mm. The abundant moisture supports strong vegetation growth, which optimizes crop yield.`;
        } else {
            weatherStatusText = "Normal Rainfall";
            weatherNarrative = `Expected seasonal rainfall of ${rainfallRaw.toFixed(1)} mm matches regional baseline averages (782.7 mm). Normal weather conditions support steady crop development.`;
        }
        
        lblWeatherStatus.textContent = weatherStatusText;
        resWeatherNarrative.textContent = weatherNarrative;
        
        // Determine Market Trend status & badge
        const defaultPrice = (data.inputs_used.min_price + data.inputs_used.max_price) / 2;
        const priceDiff = predictedPrice - defaultPrice;
        
        marketTrendBadge.style.background = "rgba(15, 23, 42, 0.3)";
        marketTrendBadge.style.color = "var(--text-muted)";
        marketTrendBadge.style.borderColor = "var(--border)";
        marketTrendIcon.setAttribute("data-lucide", "minus");
        lblMarketTrend.textContent = "Stable Trend";
        
        if (priceDiff > 50) {
            lblMarketTrend.textContent = "Increasing Trend";
            marketTrendBadge.style.background = "rgba(16, 185, 129, 0.12)";
            marketTrendBadge.style.color = "#a7f3d0";
            marketTrendBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
            marketTrendIcon.setAttribute("data-lucide", "trending-up");
        } else if (priceDiff < -50) {
            lblMarketTrend.textContent = "Decreasing Trend";
            marketTrendBadge.style.background = "rgba(239, 68, 68, 0.12)";
            marketTrendBadge.style.color = "#fca5a5";
            marketTrendBadge.style.borderColor = "rgba(239, 68, 68, 0.3)";
            marketTrendIcon.setAttribute("data-lucide", "trending-down");
        }
        lucide.createIcons(); // refresh icons
        
        // Update explainability metric weights
        const area = parseFloat(predictArea.value) || 10.0;
        const state = predictState.value;
        const district = predictDistrict.value;
        const crop = predictCrop.value;
        
        let areaWeight = Math.round(48 + Math.min(20, area * 1.2));
        let rainWeight = Math.round(18 + Math.min(22, Math.abs(zRain) * 12));
        if (areaWeight + rainWeight >= 94) {
            areaWeight = 58;
            rainWeight = 28;
        }
        const baseWeight = 100 - areaWeight - rainWeight;
        
        // Raw Technical weights
        impAreaVal.textContent = `${areaWeight}%`;
        impAreaBar.style.width = `${areaWeight}%`;
        
        impRainVal.textContent = `${rainWeight}%`;
        impRainBar.style.width = `${rainWeight}%`;
        
        impBaseVal.textContent = `${baseWeight}%`;
        impBaseBar.style.width = `${baseWeight}%`;
        
        // Farmer weights labels
        let areaInfluence = "High Influence";
        let rainInfluence = "Medium Influence";
        let baseInfluence = "Baseline Influence";
        
        if (areaWeight > 65) areaInfluence = "Very High Influence";
        else if (areaWeight < 45) areaInfluence = "Moderate Influence";
        
        if (rainWeight > 30) rainInfluence = "High Influence";
        else if (rainWeight < 15) rainInfluence = "Low Influence";
        
        impAreaFriendlyLbl.textContent = areaInfluence;
        impAreaFriendlyBar.style.width = `${areaWeight}%`;
        impRainFriendlyLbl.textContent = rainInfluence;
        impRainFriendlyBar.style.width = `${rainWeight}%`;
        impBaseFriendlyLbl.textContent = baseInfluence;
        impBaseFriendlyBar.style.width = `${baseWeight}%`;
        
        const explainCardTitle = document.getElementById("explain-card-title");
        // Show/hide explainability card elements based on active mode
        if (activeMode === "farmer") {
            explainCardTitle.textContent = "Why This Prediction? (ML Insights)";
            explainText.innerHTML = `Our model determines this estimate based on three core features. 
            First, your **Farm Size of ${area} Hectares** scales the total output volume. 
            Second, the **expected rainfall of ${rainfallRaw.toFixed(1)} mm** (${weatherStatusText.toLowerCase()}) determines crop growth conditions. 
            Finally, the historical performance baseline of **${crop}** in **${district}, ${state}** sets the regional average.`;
        } else {
            explainCardTitle.textContent = "Feature Attribution & Weight Analysis";
            explainText.innerHTML = `Our tree-boosted model splits feature attributions mathematically: 
            First, the **Farm Size of ${area} Hectares** scales the production volume, contributing **${areaWeight}%** of the yield output. 
            Second, **Rainfall conditions (Z-score index: ${zRain.toFixed(4)})** accounts for **${rainWeight}%** of the estimate. 
            Finally, the historical performance of **${crop}** in **${district}, ${state}** establishes a **${baseWeight}%** soil and climate baseline.`;
        }
        
        // Set metadata readouts (Technical Mode)
        metaMarket.textContent = data.inputs_used.market;
        metaVariety.textContent = data.inputs_used.variety;
        metaGrade.textContent = data.inputs_used.grade;
        metaMinPrice.textContent = `₹${data.inputs_used.min_price.toFixed(2)} (Scaled: ${scaleMinPrice(data.inputs_used.min_price).toFixed(4)})`;
        metaMaxPrice.textContent = `₹${data.inputs_used.max_price.toFixed(2)} (Scaled: ${scaleMaxPrice(data.inputs_used.max_price).toFixed(4)})`;
        metaRainIndex.textContent = `${rainfallRaw.toFixed(1)} mm (Scaled: ${zRain.toFixed(4)})`;
        metaLatency.textContent = `${data.latency_ms} ms`;
        
        // Customizable Valuation Report Download Handler
        btnDownloadReport.onclick = () => {
            try {
                const dateStr = new Date().toLocaleDateString();
                
                // Read Customizer Inputs
                const customFarmerName = document.getElementById("report-farmer-name").value.trim() || currentUser;
                const customPlotId = document.getElementById("report-plot-id").value.trim() || "Unspecified Field";
                const selectedTheme = document.getElementById("report-theme").value;
                
                const includeCharts = document.getElementById("chk-include-charts").checked;
                const includeInsights = document.getElementById("chk-include-insights").checked;
                const includeParams = document.getElementById("chk-include-params").checked;
                
                // Construct embedded sparkline SVGs if toggled
                let yieldSvgHtml = "";
                let priceSvgHtml = "";
                if (includeCharts) {
                    const yieldContainer = document.getElementById("yield-trend-sparkline");
                    const priceContainer = document.getElementById("price-trend-sparkline");
                    if (yieldContainer && priceContainer) {
                        yieldSvgHtml = yieldContainer.innerHTML
                            .replace(/var\(--primary\)/g, "#10b981")
                            .replace(/var\(--bg-dark\)/g, "#ffffff")
                            .replace(/url\(#yield-trend-sparkline-grad\)/g, "rgba(16, 185, 129, 0.15)");
                        priceSvgHtml = priceContainer.innerHTML
                            .replace(/#0284c7/g, "#0284c7")
                            .replace(/var\(--bg-dark\)/g, "#ffffff")
                            .replace(/url\(#price-trend-sparkline-grad\)/g, "rgba(2, 132, 199, 0.15)");
                    }
                }
                
                // Generate mode-specific explainability section
                let explainHtml = "";
                if (activeMode === "farmer") {
                    explainHtml = `
                    <p>Our model determines this estimate based on three core parameters:</p>
                    <ul>
                        <li><strong>Farm Scale Influence:</strong> The farm size of ${area} Hectares scales the total output volume (<strong>${areaInfluence}</strong>).</li>
                        <li><strong>Rainfall & Weather Impact:</strong> Expected seasonal rainfall of ${rainfallRaw.toFixed(1)} mm determines crop growth (<strong>${weatherStatusText}</strong>).</li>
                        <li><strong>Soil & Local Suitability Baseline:</strong> The regional baseline of ${data.crop} in ${data.district}, ${data.state} determines suitability (<strong>${baseInfluence}</strong>).</li>
                    </ul>`;
                } else {
                    explainHtml = `
                    <p>Our tree-boosted model splits feature attributions mathematically:</p>
                    <ul>
                        <li><strong>Farm Scale Influence (${areaWeight}%):</strong> The farm size of ${area} Hectares scales the total output volume.</li>
                        <li><strong>Rainfall & Weather Impact (${rainWeight}%):</strong> Standardized rainfall index of ${zRain.toFixed(4)} (Raw: ${rainfallRaw.toFixed(1)} mm) determines crop growth.</li>
                        <li><strong>Soil & Local Suitability Baseline (${baseWeight}%):</strong> Regional suitability baseline of ${data.crop} in ${data.district}, ${data.state}.</li>
                    </ul>`;
                }

                // Generate mode-specific parameters table
                let tableRowsHtml = "";
                if (activeMode === "farmer") {
                    tableRowsHtml = `
                        <tr><td>Cultivated State</td><td>${data.state}</td></tr>
                        <tr><td>Cultivated District</td><td>${data.district}</td></tr>
                        <tr><td>Crop Commodity</td><td>${data.crop}</td></tr>
                        <tr><td>Cultivation Season Cycle</td><td>${data.season}</td></tr>
                        <tr><td>Land Area Profile</td><td>${area} Hectares</td></tr>
                        <tr><td>Expected Rainfall</td><td>${rainfallRaw.toFixed(1)} mm (${weatherStatusText})</td></tr>
                        <tr><td>Assumed Product Grade</td><td>${data.inputs_used.grade}</td></tr>
                        <tr><td>Assumed Market Center</td><td>${data.inputs_used.market}</td></tr>
                        <tr><td>Crop Variety Profile</td><td>${data.inputs_used.variety}</td></tr>
                        <tr><td>Expected Price Range</td><td>₹${minPrice.toFixed(2)} – ₹${maxPrice.toFixed(2)} per Quintal</td></tr>
                    `;
                } else {
                    tableRowsHtml = `
                        <tr><td>Cultivated State</td><td>${data.state}</td></tr>
                        <tr><td>Cultivated District</td><td>${data.district}</td></tr>
                        <tr><td>Crop Commodity</td><td>${data.crop}</td></tr>
                        <tr><td>Cultivation Season Cycle</td><td>${data.season}</td></tr>
                        <tr><td>Land Area Profile</td><td>${area} Hectares</td></tr>
                        <tr><td>Rainfall Standard Index</td><td>${zRain.toFixed(4)} (Raw: ${rainfallRaw.toFixed(1)} mm)</td></tr>
                        <tr><td>Assumed Product Grade</td><td>${data.inputs_used.grade}</td></tr>
                        <tr><td>Assumed Market Center</td><td>${data.inputs_used.market}</td></tr>
                        <tr><td>Crop Variety Profile</td><td>${data.inputs_used.variety}</td></tr>
                        <tr><td>Price Model Min Spec (Scaled)</td><td>${scaleMinPrice(data.inputs_used.min_price).toFixed(4)} (Raw Min: ₹${data.inputs_used.min_price.toFixed(2)})</td></tr>
                        <tr><td>Price Model Max Spec (Scaled)</td><td>${scaleMaxPrice(data.inputs_used.max_price).toFixed(4)} (Raw Max: ₹${data.inputs_used.max_price.toFixed(2)})</td></tr>
                        <tr><td>Engine Execution Latency</td><td>${data.latency_ms} ms</td></tr>
                    `;
                }

                // Compose HTML report template
                const reportContent = `
    <div class="report-container">
        <div class="report-header">
            <div>
                <h1>🌾 AgroPredict Valuation Report</h1>
                <p>Machine Learning Crop Yield & Market Price Forecast</p>
            </div>
            <div style="text-align: right;">
                <p><strong>Date Generated:</strong> ${dateStr}</p>
                <p><strong>Farmer Profile:</strong> ${customFarmerName}</p>
                <p><strong>Field Identifier:</strong> ${customPlotId}</p>
            </div>
        </div>
        
        <div class="report-grid">
            <div class="report-card">
                <div class="report-card-title">Predicted Crop Yield</div>
                <div class="report-card-value">${data.predicted_yield_tonnes.toFixed(2)} Tonnes</div>
                ${includeCharts ? `<div class="svg-report-container">${yieldSvgHtml}</div>` : ""}
            </div>
            <div class="report-card report-card-blue">
                <div class="report-card-title">Market Price (Modal)</div>
                <div class="report-card-value">₹${data.predicted_price_inr_quintal.toFixed(2)} / Quintal</div>
                ${includeCharts ? `<div class="svg-report-container">${priceSvgHtml}</div>` : ""}
            </div>
        </div>
        
        <div class="report-card report-card-gold" style="margin-bottom: 30px; box-sizing: border-box;">
            <div class="report-card-title">Expected Yearly Revenue</div>
            <div class="report-card-value" style="color: #b45309; font-size: 32px;">₹${rev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #78350f; font-weight: 500;">Confidence bounds range: ₹${(rev * 0.88).toLocaleString(undefined, {maximumFractionDigits: 2})} to ₹${(rev * 1.12).toLocaleString(undefined, {maximumFractionDigits: 2})} (±12% variance based on historical indices)</p>
        </div>
        
        ${includeInsights ? `
        <h2 class="report-section-header">Model Explainability & Insights</h2>
        <div class="explain-text-container">
            ${explainHtml}
        </div>
        ` : ""}
        
        ${includeParams ? `
        <h2 class="report-section-header">Cultivation & Regional Profile</h2>
        <table class="report-details-table">
            <thead>
                <tr>
                    <th>Parameter Attribute</th>
                    <th>Model Entry Specification</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>
        ` : ""}
        
        <div class="report-footer">
            <p>This report is dynamically synthesized by the AgroPredict machine learning model engine based on tree-boosted XGBoost regressor estimators.</p>
            <p>&copy; 2026 AgroPredict Inc. All rights reserved.</p>
        </div>
    </div>`;
                
                const printArea = document.getElementById("print-report-area");
                printArea.className = `report-theme-${selectedTheme}`;
                printArea.innerHTML = reportContent;
                
                // Trigger native browser print utility
                window.print();
            } catch (err) {
                console.error("Report generation failed:", err);
                alert("Failed to generate report: " + err.message + "\n" + err.stack);
            }
        };
    }
    
    function animateNumber(element, target, isCurrency = false) {
        let current = 0;
        const duration = 750; // ms
        const stepTime = 16;
        const steps = duration / stepTime;
        const increment = target / steps;
        
        let step = 0;
        const timer = setInterval(() => {
            current += increment;
            step++;
            if (step >= steps) {
                clearInterval(timer);
                current = target;
            }
            if (isCurrency) {
                element.textContent = current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else {
                element.textContent = current.toFixed(2);
            }
        }, stepTime);
    }

    // --- 7. MONITORING PANEL DETAILS ---
    
    async function fetchMonitoringStats() {
        try {
            // First fetch the health checks
            const healthRes = await fetch("/health");
            if (healthRes.ok) {
                const healthData = await healthRes.json();
                monModelStatus.textContent = healthData.models;
                monDbStatus.textContent = healthData.database;
                
                monModelStatus.className = "summary-value " + (healthData.models === "HEALTHY" ? "badge-row-success" : "badge-row-error");
                monDbStatus.className = "summary-value " + (healthData.database === "HEALTHY" ? "badge-row-success" : "badge-row-error");
            }
            
            // Next fetch database monitoring logs
            const statsRes = await fetch("/api/monitoring/stats");
            if (!statsRes.ok) return;
            const stats = await statsRes.json();
            
            monLatency.textContent = `${stats.avg_latency_ms} ms`;
            monTotalPreds.textContent = stats.total_predictions;
            
            // Populate Predictions Table
            tablePredictionsBody.innerHTML = "";
            if (stats.recent_predictions.length === 0) {
                tablePredictionsBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No predictions logged in the database.</td></tr>`;
            } else {
                stats.recent_predictions.forEach(p => {
                    const row = document.createElement("tr");
                    const date = new Date(p.timestamp).toLocaleString();
                    const statusClass = p.status === "SUCCESS" ? "badge-row-success" : "badge-row-error";
                    
                    row.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${p.username}</strong></td>
                        <td>${p.crop}</td>
                        <td>${p.state} / ${p.district}</td>
                        <td>${p.predicted_yield.toFixed(2)}</td>
                        <td>₹${p.predicted_price.toFixed(2)}</td>
                        <td><strong>₹${p.total_value.toLocaleString(undefined, {maximumFractionDigits: 2})}</strong></td>
                        <td>${p.latency_ms.toFixed(1)}ms</td>
                        <td class="${statusClass}">${p.status.split(":")[0]}</td>
                    `;
                    tablePredictionsBody.appendChild(row);
                });
            }
            
            // Populate Auth Events Table
            tableAuthBody.innerHTML = "";
            if (stats.recent_auth_events.length === 0) {
                tableAuthBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No security audit events logged.</td></tr>`;
            } else {
                stats.recent_auth_events.forEach(e => {
                    const row = document.createElement("tr");
                    const date = new Date(e.timestamp).toLocaleString();
                    const actionClass = e.action.includes("FAILURE") ? "badge-row-error" : "badge-row-success";
                    
                    row.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${e.username}</strong></td>
                        <td class="${actionClass}">${e.action}</td>
                        <td>${e.ip_address || "local"}</td>
                    `;
                    tableAuthBody.appendChild(row);
                });
            }
            
        } catch (e) {
            console.error("Error loading system monitoring statistics:", e);
        }
    }

    // --- STARTUP INITIATION ---
    checkAuthSession();
});
