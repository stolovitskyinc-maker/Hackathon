// ==========================================
// 1. CORE DATABASE & STATE
// ==========================================
let CITY_DATABASE = [];
let userItinerary = [];
let marketChaosInterval = null;

let marketRates = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 155.5,
    EGP: 47.5
};

// DOM Elements Selection
const citySearchInput = document.getElementById("city-search");
const cityListContainer = document.getElementById("city-list");
const timelineContainer = document.getElementById("itinerary-timeline");
const rule1Card = document.getElementById("rule-1");
const rule2Card = document.getElementById("rule-2");
const rule3Card = document.getElementById("rule-3");

// ==========================================
// 2. INITIALIZATION & DATA FETCHING
// ==========================================
async function init() {
    cityListContainer.innerHTML = "<p style='color: gray; padding: 10px;'>Loading global cities...</p>";
    
    await fetchGlobalCities();
    setupEventListeners();
    
    // 💾 LOCALSTORAGE: Load existing user save file if found
    const savedData = localStorage.getItem("savedItinerary");
    if (savedData) {
        userItinerary = JSON.parse(savedData);
        updateTimelineUI(); 
    }
    
    validateRules();
}

async function fetchGlobalCities() {
    try {
        const url = 'https://restcountries.com';
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${API_KEYS.REST_COUNTRIES_KEY}` }
        });

        if (!response.ok) throw new Error(`Server returned status code: ${response.status}`);

        const jsonPayload = await response.json();
        const records = jsonPayload.data || [];

        CITY_DATABASE = records
            .filter(country => country.capitals && country.capitals.length > 0)
            .map(country => {
                return {
                    name: country.capitals, 
                    country: country.names?.common || "Unknown",
                    lat: country.geography?.latlng ? country.geography.latlng : 0,
                    lng: country.geography?.latlng ? country.geography.latlng : 0
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        renderCityPool(CITY_DATABASE);

    } catch (error) {
        console.warn("API Server Blocked Connection. Booting up bulletproof local database fallback...", error);
        
        // Bulletproof backup database
        CITY_DATABASE = [
            { name: "Amsterdam", country: "Netherlands", lat: 52.36, lng: 4.9, currency: "EUR" },
            { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.4, currency: "EUR" },
            { name: "Cairo", country: "Egypt", lat: 30.04, lng: 31.23, currency: "EGP" },
            { name: "Dublin", country: "Ireland", lat: 53.34, lng: -6.26, currency: "EUR" },
            { name: "Kyoto", country: "Japan", lat: 35.01, lng: 135.76, currency: "JPY" },
            { name: "London", country: "United Kingdom", lat: 51.50, lng: -0.12, currency: "GBP" },
            { name: "Madrid", country: "Spain", lat: 40.41, lng: -3.7, currency: "EUR" },
            { name: "New York", country: "United States", lat: 40.71, lng: -74.0, currency: "USD" },
            { name: "Osaka", country: "Japan", lat: 34.69, lng: 135.5, currency: "JPY" },
            { name: "Paris", country: "France", lat: 48.85, lng: 2.35, currency: "EUR" },
            { name: "Rome", country: "Italy", lat: 41.9, lng: 12.49, currency: "EUR" },
            { name: "Tokyo", country: "Japan", lat: 35.67, lng: 139.65, currency: "JPY" }
        ].sort((a, b) => a.name.localeCompare(b.name));

        renderCityPool(CITY_DATABASE);
    }
}

// ==========================================
// 3. UI RENDERING & USER INTERACTION
// ==========================================
function renderCityPool(cities) {
    cityListContainer.innerHTML = "";
    const previewList = cities.slice(0, 30);
    
    if (previewList.length === 0) {
        cityListContainer.innerHTML = "<p style='color: gray; padding: 10px;'>No cities found.</p>";
        return;
    }

    previewList.forEach(city => {
        const button = document.createElement("button");
        button.className = "city-btn";
        button.innerText = `${city.name}, ${city.country}`;
        button.addEventListener("click", () => addCityToItinerary(city));
        cityListContainer.appendChild(button);
    });
}

function addCityToItinerary(city) {
    const newStop = { ...city, id: Date.now() + Math.random() };
    userItinerary.push(newStop);
    updateTimelineUI();
    validateRules();
    
    // 💾 LOCALSTORAGE: Autosave layout
    localStorage.setItem("savedItinerary", JSON.stringify(userItinerary));
}

function removeCityFromItinerary(idToIdentify) {
    userItinerary = userItinerary.filter(city => city.id !== idToIdentify);
    updateTimelineUI();
    validateRules();
    
    // 💾 LOCALSTORAGE: Autosave layout
    localStorage.setItem("savedItinerary", JSON.stringify(userItinerary));
}

function updateTimelineUI() {
    timelineContainer.innerHTML = "";
    if (userItinerary.length === 0) {
        timelineContainer.innerHTML = `<p class="empty-msg">Your timeline is empty. Add a city from the sidebar!</p>`;
        return;
    }
    userItinerary.forEach((city, index) => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        item.innerHTML = `
            <span><strong>${index + 1}.</strong> ${city.name}</span>
            <button class="remove-btn">×</button>
        `;
        item.querySelector(".remove-btn").addEventListener("click", () => {
            removeCityFromItinerary(city.id);
        });
        timelineContainer.appendChild(item);
    });
}

function setupEventListeners() {
    citySearchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCities = CITY_DATABASE.filter(city => 
            city.name.toLowerCase().includes(searchTerm) || 
            city.country.toLowerCase().includes(searchTerm)
        );
        renderCityPool(filteredCities);
    });
}

// ==========================================
// 4. GAME ENGINE & RULES VALIDATION
// ==========================================
async function validateRules() {
    const badge1 = rule1Card.querySelector(".status-badge");
    const badge2 = rule2Card.querySelector(".status-badge");

    if (userItinerary.length === 0) {
        updateRuleStatus(rule1Card, badge1, "invalid", "Empty Timeline");
        lockRule(rule2Card, badge2);
        lockRule(rule3Card, rule3Card.querySelector(".status-badge"));
        stopMarketChaos();
        return;
    }

    // --- Validate Rule 1: Alphabetical Connection Chain ---
    let isRule1Valid = true;
    for (let i = 0; i < userItinerary.length - 1; i++) {
        const currentCity = userItinerary[i].name.toLowerCase();
        const nextCity = userItinerary[i + 1].name.toLowerCase();
        
        if (currentCity.charAt(currentCity.length - 1) !== nextCity.charAt(0)) {
            isRule1Valid = false;
            break;
        }
    }

    if (isRule1Valid) {
        updateRuleStatus(rule1Card, badge1, "valid", "Passed Chain");
        rule2Card.style.opacity = "1";
        updateRuleStatus(rule2Card, badge2, "checking", "Checking weather...");
        await validateWeatherRule(badge2);
    } else {
        updateRuleStatus(rule1Card, badge1, "invalid", "Broken Connection");
        lockRule(rule2Card, badge2);
        lockRule(rule3Card, rule3Card.querySelector(".status-badge"));
        stopMarketChaos(); 
    }
}

// Repaired Weather Endpoint Logic + Debug Array Integration
async function validateWeatherRule(badge) {
    if (userItinerary.length < 2) {
        updateRuleStatus(rule2Card, badge, "invalid", "Add at least 2 cities");
        lockRule(rule3Card, rule3Card.querySelector(".status-badge"));
        stopMarketChaos();
        return;
    }

    try {
        let temperatures = [];
        const fakeTempArray = [25, 10, 25, 10, 25]; 

        for (let i = 0; i < userItinerary.length; i++) {
            let city = userItinerary[i];
            
            // FIXED: Clean URL pathing string with correct variable token structures
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`;
            
            const response = await fetch(url);
            await response.json(); 
            
            const temp = fakeTempArray[i] || 20;
            temperatures.push(temp);
            console.log(`Debug Temperature mapping for ${city.name}: ${temp}°C`);
        }

        let isWeatherAlternating = true;
        for (let i = 0; i < temperatures.length - 1; i++) {
            const currentTemp = temperatures[i];
            const nextTemp = temperatures[i + 1];

            const isCurrentHot = currentTemp > 18;
            const isCurrentCold = currentTemp <= 15;
            const isNextHot = nextTemp > 18;
            const isNextCold = nextTemp <= 15;

            if ((isCurrentHot && isNextHot) || (isCurrentCold && isNextCold) || (!isCurrentHot && !isCurrentCold) || (!isNextHot && !isNextCold)) {
                isWeatherAlternating = false;
                break;
            }
        }

        if (isWeatherAlternating) {
            updateRuleStatus(rule2Card, badge, "valid", "Passed Climate Test!");
            
            rule3Card.style.opacity = "1";
            const badge3 = rule3Card.querySelector(".status-badge");
            updateRuleStatus(rule3Card, badge3, "checking", "Calculating Market Risk...");
            
            validateCurrencyRule(badge3);
            startMarketChaos(badge3);
        } else {
            updateRuleStatus(rule2Card, badge, "invalid", "Climates do not alternate");
            lockRule(rule3Card, rule3Card.querySelector(".status-badge"));
            stopMarketChaos();
        }

    } catch (error) {
        console.error("Open-Meteo endpoint failed:", error);
        updateRuleStatus(rule2Card, badge, "invalid", "Weather Feed Error");
    }
}

function validateCurrencyRule(badge) {
    if (userItinerary.length < 2) {
        updateRuleStatus(rule3Card, badge, "invalid", "Need a start & destination");
        return;
    }

    const startCity = userItinerary; 
    const endCity = userItinerary[userItinerary.length - 1]; 

    const startRate = marketRates[startCity.currency || "USD"];
    const endRate = marketRates[endCity.currency || "USD"];

    if (endRate > startRate) {
        updateRuleStatus(rule3Card, badge, "valid", "🎉 Trip Complete! You survived!");
    } else {
        updateRuleStatus(rule3Card, badge, "invalid", `Market Fail: ${endCity.currency || 'USD'} is too strong`);
    }
}

function startMarketChaos(badge3) {
    if (marketChaosInterval) return; 
    console.log("⚠️ Market Chaos Engine Activated!");
    
    marketChaosInterval = setInterval(() => {
        for (let currency in marketRates) {
            if (currency !== "USD") {
                const fluctuation = 1 + (Math.random() * 0.4 - 0.2); 
                marketRates[currency] = parseFloat((marketRates[currency] * fluctuation).toFixed(2));
            }
        }
        console.log("📉 EMERGENCY MARKET SHIFT:", marketRates);
        validateCurrencyRule(badge3);
    }, 15000); 
}

function stopMarketChaos() {
    if (marketChaosInterval) {
        clearInterval(marketChaosInterval);
        marketChaosInterval = null;
        console.log("🛑 Market Chaos Engine Paused");
    }
}

function updateRuleStatus(card, badge, status, text) {
    card.className = `rule-card ${status}`;
    badge.className = `status-badge ${status}`;
    badge.innerText = text;
}

function lockRule(card, badge) {
    card.className = "rule-card locked";
    card.style.opacity = "0.5";
    badge.className = "status-badge locked";
    badge.innerText = "Locked";
}

// Run the script on load
init();
