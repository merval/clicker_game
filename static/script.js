// script.js

let money = 0;
let incomePerSec = 0;
let upgrades = [];
let businesses = {};
const businessesClickable = {};

// Upgrade types and possible attributes
const upgradeTypes = [
  { type: "incomeMultiplier", minEffect: 1.5, maxEffect: 3.0 },
  { type: "passiveIncomeBoost", minEffect: 1, maxEffect: 5 },
  { type: "costReduction", minEffect: 0.1, maxEffect: 0.5 }
];

// Fetch businesses data from JSON file
async function loadGameData() {
  try {
    const response = await fetch("static/businesses.json");
    const data = await response.json();

    businesses = data.businesses.reduce((obj, business) => {
      obj[business.name] = { ...business, currentSpeed: business.speed };
      businessesClickable[business.name] = true;
      return obj;
    }, {});

    data.upgrades.forEach(upgrade => {
    upgrades.push(upgrade);
    displayUpgrade(upgrade);
  });

    // Generate HTML for each business
    generateBusinessHTML();
    refreshUpgradeDisplay();
  } catch (error) {
    console.error("Failed to load game data:", error);
  }
}

function buildUpgradeButton(upgrade, upgradeList) {
  const upgradeButton = document.createElement("button");
  upgradeButton.className = "upgrade-button";
  upgradeButton.innerText = `${upgrade.name} - $${upgrade.cost}`;
  upgradeButton.onclick = () => buyUpgrade(upgrade);
  upgradeList.appendChild(upgradeButton);
}

// Utility function to capitalize the first letter of a word
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function buyManager(businessName) {
  const business = businesses[businessName];
  if (money >= business.manager.cost) {
    money -= business.manager.cost;
    business.manager.hired = true;
    startAutoEarning(businessName);
    updateMoney();
    updateBusinessDisplay(businessName);
    document.querySelector(`#${businessName} .manager-button`).style.display = "none";
    document.querySelector(`#${businessName} .earn-income`).style.display = "none";
  }
}

function startAutoEarning(businessName) {
  const business = businesses[businessName];
  setInterval(() => {
    if (business.manager && business.manager.hired) {
      earnMoney(businessName);
    }
  }, 500);
}

// Function to start earning money with countdown and delayed money update
function earnMoney(businessName) {
  const business = businesses[businessName];
  business.owned = 1
  const progressBar = document.querySelector(`#${businessName} .progress-bar`);
  const progressText = document.querySelector(`#${businessName} .progress-text`);

  // Check if the button is clickable
  if (businessesClickable[businessName]) {
    // Set button as not clickable
    businessesClickable[businessName] = false;

    // Start the countdown with progress bar animation
    let remainingTime = business.currentSpeed;
    const intervalTime = 100; // Update every 100 ms
    const totalTicks = remainingTime / intervalTime;
    let tick = 0;

    const interval = setInterval(() => {
      tick++;
      const progressPercent = (tick / totalTicks) * 100;
      progressBar.style.width = `${progressPercent}%`;

      // Calculate and display remaining time in seconds
      const secondsLeft = ((totalTicks - tick) * intervalTime) / 1000;
      progressText.innerText = `${secondsLeft.toFixed(1)}s`; // Display remaining time

      // When the countdown finishes, update money, reset progress bar, and make button clickable
      if (tick >= totalTicks) {
        clearInterval(interval);
        progressBar.style.width = '0%'; // Reset progress bar
        progressText.innerText = ''; // Clear countdown text

        // Add income to money only after countdown completes
        money += business.income;
        updateMoney();

        // Make button clickable again
        businessesClickable[businessName] = true;
      }
    }, intervalTime);
  }
}

// Generate the HTML for businesses with the progress bar
function generateBusinessHTML() {
  const businessContainer = document.getElementById("business-container");

  Object.keys(businesses).forEach(businessName => {
    const business = businesses[businessName];

    const businessElement = document.createElement("div");
    businessElement.id = business.name;
    businessElement.className = "business " + (business.unlocked ? "" : "locked");

    businessElement.innerHTML = `
      <h3>${capitalizeFirstLetter(business.name)}</h3>
      <p>Income per click: $${business.income.toFixed(2)}</p>
      <button class="earn-income" onclick="earnMoney('${business.name}')" ${business.unlocked ? "" : "disabled"}>
        Earn Income
      </button>
      <div class="progress-container">
        <div class="progress-bar">
            <span class="progress-text"></span>
        </div>
      </div>
      <button class="upgrade-button" onclick="upgradeBusiness('${business.name}')" ${business.unlocked ? "" : "disabled"}>
        Upgrade - $${business.upgradeCost}
      </button>
      ${business.manager ? `<button class="manager-button" onclick="buyManager('${business.name}')" ${business.unlocked ? "" : "disabled"}>
        Hire ${business.manager.name} - $${business.manager.cost}
      </button>` : ""}
      ${!business.unlocked ? `<p class="unlock-info">Unlocks at $${business.unlockCost}</p>` : ""}
    `;

    businessContainer.appendChild(businessElement);
  });
}

// Function to upgrade a business
function upgradeBusiness(businessType) {
  const business = businesses[businessType];
  if (money >= business.upgradeCost) {
    money -= business.upgradeCost;
    business.income *= 1.5
    business.upgradeCost = Math.floor(business.upgradeCost * 1.5); // Increase upgrade cost by 50%
    updateMoney();
    updateBusinessDisplay(businessType);
  }
}

// Function to update the money display
function updateMoney() {
  document.getElementById("money").innerText = `$${money.toFixed(2)}`;
  document.getElementById("income").innerText = `$${incomePerSec}`
}

// Function to update the business display with new income and upgrade cost
function updateBusinessDisplay(businessType) {
  const business = businesses[businessType];
  const businessElement = document.getElementById(businessType);
  businessElement.querySelector("p").innerText = `Income per click: $${business.income.toFixed(2)}`;
  const upgradeButton = document.querySelector(`#${businessType} .upgrade-button`);
  upgradeButton.innerText = `Upgrade - $${business.upgradeCost}`;
}

// Function to check and unlock businesses based on money
function checkForUnlocks() {
  for (const businessType in businesses) {
    const business = businesses[businessType];
    if (!business.unlocked && money >= business.unlockCost) {
      unlockBusiness(businessType);
    }
    if (business.unlocked && money <= business.unlockCost && business.owned === 0) {
      lockBusiness(businessType)
    }
  }
}

// Function to unlock a business
function lockBusiness(businessType) {
  const business = businesses[businessType];
  business.unlocked = false;
  businessesClickable[business] = false;

  const businessElement = document.getElementById(businessType);
  businessElement.classList.add("locked");
  businessElement.querySelector(".business-click-button").disabled = true;
  businessElement.querySelector(".upgrade-button").disabled = true;
  businessElement.querySelector(".unlock-info").style.display = `Unlock for $${business.unlockCost}`;
}

// Function to unlock a business
function unlockBusiness(businessType) {
  const business = businesses[businessType];
  business.unlocked = true;
  businessesClickable[business] = true;

  const businessElement = document.getElementById(businessType);
  businessElement.classList.remove("locked");
  businessElement.querySelector(".earn-income").disabled = false;
  businessElement.querySelector(".upgrade-button").disabled = false;
  businessElement.querySelector(".unlock-info").style.display = "none";
}

// Function to create a unique name based on the upgrade type and strength
function generateUpgradeName(type, effect) {
  switch (type) {
    case "incomeMultiplier":
      return `Profit Multiplier x${effect}`;
    case "passiveIncomeBoost":
      return `Passive Boost +$${effect} income/sec`;
    case "costReduction":
      return `Efficiency Boost -${(effect * 100).toFixed(0)}% Cost`;
    default:
      return "Special Upgrade";
  }
}

// Function to generate a random upgrade (same as before)
function generateUpgrade() {
  const upgradeType = upgradeTypes[Math.floor(Math.random() * upgradeTypes.length)];
  const effectStrength = (Math.random() * (upgradeType.maxEffect - upgradeType.minEffect) + upgradeType.minEffect).toFixed(2);
  const cost = Math.floor(Math.random() * 100) + 50;

  const newUpgrade = {
    type: upgradeType.type,
    effect: parseFloat(effectStrength),
    cost: cost,
    name: generateUpgradeName(upgradeType.type, effectStrength)
  };

  upgrades.push(newUpgrade);
  displayUpgrade(newUpgrade);
}

// Function to apply an upgrade effect (same as before)
function buyUpgrade(upgrade) {
  if (money >= upgrade.cost) {
    money -= upgrade.cost;

    if (upgrade.type === "incomeMultiplier") {
      for (const business in businesses) {
        businesses[business].income *= upgrade.effect;
        updateBusinessDisplay(business)
      }
    } else if (upgrade.type === "passiveIncomeBoost") {
      incomePerSec += upgrade.effect;
    } else if (upgrade.type === "costReduction") {
      for (const business in businesses) {
        businesses[business].cost *= (1 - upgrade.effect);
      }
    }
    updateMoney();

    // Remove the purchased upgrade from the available upgrades
    upgrades = upgrades.filter(upg => upg.name !== upgrade.name);

    refreshUpgradeDisplay();
    generateUpgrade();
  } else {
    alert("Not enough money for this upgrade!");
  }
}

function refreshUpgradeDisplay() {
  const upgradeList = document.getElementById("upgrade-list");
  upgradeList.innerHTML = ""; // Clear existing upgrades

  upgrades.forEach(upgrade => {
    buildUpgradeButton(upgrade, upgradeList);
  });
}

function displayUpgrade(upgrade) {
  const upgradeList = document.getElementById("upgrade-list");
  buildUpgradeButton(upgrade, upgradeList);
  sortUpgradesByCost();
}

// // Initial upgrades
// for (let i = 0; i < 10; i++) {
//   generateUpgrade();
// }

// Initial upgrades and intervals for passive income
setInterval(() => {
  money += incomePerSec;
  updateMoney();
  checkForUnlocks();
}, 500);

// Sort upgrades by cost in ascending order
function sortUpgradesByCost() {
  upgrades.sort((a, b) => a.cost - b.cost);
}

// Load data and initialize game
window.onload = loadGameData;
