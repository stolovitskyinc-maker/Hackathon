// 1. Keep your local database variable empty at start
let CITY_DATABASE = [];

// 2. State tracking for user selections
let userItinerary = [];

// 3. Elements selector
const citySearchInput = document.getElementById("city-search");
const cityListContainer = document.getElementById("city-list");
const timelineContainer = document.getElementById("itinerary-timeline");
const rule1Card = document.getElementById("rule-1");
const rule2Card = document.getElementById("rule-2");
const rule3Card = document.getElementById("rule-3");

// Base exchange rates against 1 USD
let marketRates = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 155.5,
    EGP: 47.5
};

// Variable to store our live chaos timer loop
let marketChaosInterval = null;

// 4. Update your initialization function to be ASYNC
async function init() {
    cityListContainer.innerHTML = "<p style='color: gray; padding: 10px;'>Loading global cities...</p>";
    
    // Fetch real global cities from the API
    await fetchGlobalCities();
    
    // Setup controls once data arrives
    setupEventListeners();
    validateRules();
}

// 5. Connect to the public API and parse the payload
async function fetchGlobalCities() {
    try {
        // 1. Target the base v5 endpoint to fetch all countries at once
        const url = 'https://api.restcountries.com/countries/v5';
        
        // 2. Use their exact Header authentication layout
        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${API_KEYS.REST_COUNTRIES_KEY}` 
            }
        });

        if (!response.ok) {
            throw new Error(`Server returned status code: ${response.status}`);
        }

        const jsonPayload = await response.json();
        
        // 3. The API wraps your country list array inside a 'data' property
        const records = jsonPayload.data || [];

        // 4. Map the API objects into your clean game state
        CITY_DATABASE = records
            .filter(country => country.capitals && country.capitals.length > 0)
            .map(country => {
                return {
                    // Extract the first capital name from their nested properties
                    name: country.capitals[0], 
                    country: country.names?.common || "Unknown",
                    // Pull geography array for your upcoming Weather Rule
                    lat: country.geography?.latlng ? country.geography.latlng[0] : 0,
                    lng: country.geography?.latlng ? country.geography.latlng[1] : 0
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        // 5. Build your visual game sidebar
        renderCityPool(CITY_DATABASE);

    } catch (error) {
        console.warn("API Server Blocked Connection. Booting up bulletproof local database fallback...", error);
        
       // Replace just the fallback array inside your fetchGlobalCities catch block so they have currencies:
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



// 6. Sidebar renderer
function renderCityPool(cities) {
    cityListContainer.innerHTML = "";
    
    // Display a maximum of 30 choices at once to prevent browser slowdowns
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

// 7. Add a Selected City to the Itinerary Array
function addCityToItinerary(city) {
    const newStop = { ...city, id: Date.now() + Math.random() };
    userItinerary.push(newStop);
    updateTimelineUI();
    validateRules();
}

// 8. Remove a Selected City from the Itinerary Array
function removeCityFromItinerary(idToIdentify) {
    userItinerary = userItinerary.filter(city => city.id !== idToIdentify);
    updateTimelineUI();
    validateRules();
}

// 9. Sync state array with DOM
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

// 10. Instant filter search functionality
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

// 11. The Game Engine: Async Cascading Rules Validator
async function validateRules() {
    const badge1 = rule1Card.querySelector(".status-badge");
    const badge2 = rule2Card.querySelector(".status-badge");

    // Fallback if the user clears out their timeline entirely
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

    // --- Handle Cascading Progression Gates ---
    if (isRule1Valid) {
        updateRuleStatus(rule1Card, badge1, "valid", "Passed Chain");
        
        // Unlock Rule 2 container visual states
        rule2Card.style.opacity = "1";
        updateRuleStatus(rule2Card, badge2, "checking", "Checking weather...");
        
        // Hand execution over to the async weather calculator
        await validateWeatherRule(badge2);
    } else {
        updateRuleStatus(rule1Card, badge1, "invalid", "Broken Connection");
        lockRule(rule2Card, badge2);
        lockRule(rule3Card, rule3Card.querySelector(".status-badge"));
        stopMarketChaos(); // Shuts off timer loops if player breaks rules early
    }
}

// 12. Asynchronous Weather Network Endpoint Validator
async function validateWeatherRule(badge) {
    if (userItinerary.length < 2) {
        updateRuleStatus(rule2Card, badge, "invalid", "Add at least 2 cities");
        lockRule(rule3Card, rule3Card.querySelector(".status-badge"));
        stopMarketChaos();
        return;
    }

    try {
        let temperatures = [];

        // Consecutively query Open-Meteo for every city tracking point coordinates
        for (let city of userItinerary) {
            const response = await fetch(`https://open-meteo.com{city.lat}&longitude=${city.lng}&current_weather=true`);
            const data = await response.json();
            
            const temp = data.current_weather.temperature;
            temperatures.push(temp);
            console.log(`Live Temperature feed for ${city.name}: ${temp}°C`);
        }

        let isWeatherAlternating = true;
        
        // Inspect temperature arrays to check for alternating values
        for (let i = 0; i < temperatures.length - 1; i++) {
            const currentTemp = temperatures[i];
            const nextTemp = temperatures[i + 1];

            const isCurrentHot = currentTemp > 18;
            const isCurrentCold = currentTemp <= 15;
            const isNextHot = nextTemp > 18;
            const isNextCold = nextTemp <= 15;

            // Fails if conditions match or read within the 16-17 degree grey buffer zone
            if ((isCurrentHot && isNextHot) || (isCurrentCold && isNextCold) || (!isCurrentHot && !isCurrentCold) || (!isNextHot && !isNextCold)) {
                isWeatherAlternating = false;
                break;
            }
        }

        if (isWeatherAlternating) {
            updateRuleStatus(rule2Card, badge, "valid", "Passed Climate Test!");
            
            // 🔓 UNLOCK RULE 3 VISUALS
            rule3Card.style.opacity = "1";
            const badge3 = rule3Card.querySelector(".status-badge");
            updateRuleStatus(rule3Card, badge3, "checking", "Calculating Market Risk...");
            
            // Run the currency validation rule
            validateCurrencyRule(badge3);
            
            // Start the chaos engine loop if it isn't running yet
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

// 13. Validate Currency Exchange Rates
function validateCurrencyRule(badge) {
    if (userItinerary.length < 2) {
        updateRuleStatus(rule3Card, badge, "invalid", "Need a start & destination");
        return;
    }

    const startCity = userItinerary[0];
    const endCity = userItinerary[userItinerary.length - 1];

    // Read exchange values from our shifting market object
    const startRate = marketRates[startCity.currency || "USD"];
    const endRate = marketRates[endCity.currency || "USD"];

    // A higher exchange rate means you get MORE local coins per 1 USD (making that currency weaker)
    if (endRate > startRate) {
        updateRuleStatus(rule3Card, badge, "valid", "🎉 Trip Complete! You survived!");
    } else {
        updateRuleStatus(rule3Card, badge, "invalid", `Market Fail: ${endCity.currency || 'USD'} is too strong`);
    }
}

// 14. The Chaos Loop Engine (Asynchronous setInterval)
function startMarketChaos(badge3) {
    if (marketChaosInterval) return; // Prevent multiple overlapping intervals

    console.log("⚠️ Market Chaos Engine Activated!");
    
    marketChaosInterval = setInterval(() => {
        // Randomly crash or spike currency valuations across the globe
        for (let currency in marketRates) {
            if (currency !== "USD") {
                // Fluctuate rates up or down by a random percentage change
                const fluctuation = 1 + (Math.random() * 0.4 - 0.2); // +/- 20% shifts
                marketRates[currency] = parseFloat((marketRates[currency] * fluctuation).toFixed(2));
            }
        }
        
        console.log("📉 EMERGENCY MARKET SHIFT:", marketRates);
        
        // Instantly re-evaluate if the player is still winning or losing the game
        validateCurrencyRule(badge3);
    }, 15000); // Triggers chaos every 15 seconds
}

function stopMarketChaos() {
    if (marketChaosInterval) {
        clearInterval(marketChaosInterval);
        marketChaosInterval = null;
        console.log("🛑 Market Chaos Engine Paused");
    }
}

// 15. Component State Utility Helpers
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

// 16. Initialize the Application Engine
init();
