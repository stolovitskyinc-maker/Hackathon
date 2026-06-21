// 1. Core Database of Available Cities
const CITY_DATABASE = [
    { name: "London", country: "United Kingdom" },
    { name: "New York", country: "United States" },
    { name: "Kyoto", country: "Japan" },
    { name: "Orlando", country: "United States" },
    { name: "Osaka", country: "Japan" },
    { name: "Amsterdam", country: "Netherlands" },
    { name: "Madrid", country: "Spain" },
    { name: "Dublin", country: "Ireland" }
];

// 2. Active Game State Tracking
let userItinerary = [];

// 3. DOM Elements Selection
const citySearchInput = document.getElementById("city-search");
const cityListContainer = document.getElementById("city-list");
const timelineContainer = document.getElementById("itinerary-timeline");
const rule1Card = document.getElementById("rule-1");

// 4. Initialize the Application
function init() {
    renderCityPool(CITY_DATABASE);
    setupEventListeners();
    validateRules();
}

// 5. Render Available Cities to the Sidebar
function renderCityPool(cities) {
    cityListContainer.innerHTML = "";
    cities.forEach(city => {
        const button = document.createElement("button");
        button.className = "city-btn";
        button.innerText = `${city.name}, ${city.country}`;
        button.addEventListener("click", () => addCityToItinerary(city));
        cityListContainer.appendChild(button);
    });
}

// 6. Add a Selected City to the Itinerary Array
function addCityToItinerary(city) {
    // Generate a unique ID to handle duplicates safely
    const newStop = { ...city, id: Date.now() + Math.random() };
    userItinerary.push(newStop);
    updateTimelineUI();
    validateRules();
}

// 7. Remove a Selected City from the Itinerary Array
function removeCityFromItinerary(idToIdenitfy) {
    userItinerary = userItinerary.filter(city => city.id !== idToIdenitfy);
    updateTimelineUI();
    validateRules();
}

// 8. Sync the JavaScript Itinerary State Array to the Visual DOM Timeline
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
        
        // Listen to the close button click
        item.querySelector(".remove-btn").addEventListener("click", () => {
            removeCityFromItinerary(city.id);
        });

        timelineContainer.appendChild(item);
    });
}

// 9. Simple Search Filter Mechanism
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

// 10. The Password Game Core System: Rules Validator
function validateRules() {
    const badge = rule1Card.querySelector(".status-badge");

    // Empty itinerary fallback
    if (userItinerary.length === 0) {
        updateRuleStatus(rule1Card, badge, "invalid", "Empty Timeline");
        return;
    }

    let isRule1Valid = true;

    // Loop through the itinerary to check connections
    for (let i = 0; i < userItinerary.length - 1; i++) {
        const currentCity = userItinerary[i].name.toLowerCase();
        const nextCity = userItinerary[i + 1].name.toLowerCase();

        const lastLetterOfCurrent = currentCity.charAt(currentCity.length - 1);
        const firstLetterOfNext = nextCity.charAt(0);

        if (lastLetterOfCurrent !== firstLetterOfNext) {
            isRule1Valid = false;
            break; // Immediately exit loop if a broken connection is detected
        }
    }

    // Apply visual CSS status changes
    if (isRule1Valid) {
        updateRuleStatus(rule1Card, badge, "valid", "Passed");
        // TODO: This is where Rule 2 will be triggered later!
    } else {
        updateRuleStatus(rule1Card, badge, "invalid", "Broken Connection");
    }
}

// Helper utility to keep UI updates dry
function updateRuleStatus(card, badge, status, text) {
    card.className = `rule-card ${status}`;
    badge.className = `status-badge ${status}`;
    badge.innerText = text;
}

// Run the script on load
init();
