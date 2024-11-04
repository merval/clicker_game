// script.js

let money = 0;
let incomePerSec = 0;
let upgrades = [];


let businesses = {};
const businessesClickable = {};

// Fetch businesses data from JSON file
async function loadGameData() {
  try {
    const response = await fetch("static/businesses.json");
    const data = await response.json();

    businesses = data.businesses.reduce((obj, business) => {
      obj[business.name] = { ...business, currentSpeed: business.initialSpeed };
      businessesClickable[business.name] = true;
      return obj;
    }, {});

    upgrades = data.upgrades;

    // Generate HTML for each business
    generateBusinessHTML();
    generateUpgradeHTML();
  } catch (error) {
    console.error("Failed to load game data:", error);
  }
}


// Utility function to capitalize the first letter of a word
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Generate HTML for upgrades
function generateUpgradeHTML() {
  const upgradeContainer = document.getElementById("upgrade-list");

  upgrades.forEach(upgrade => {
    const upgradeButton = document.createElement("button");
    upgradeButton.innerText = `${upgrade.name} - $${upgrade.cost}`;
    upgradeButton.onclick = () => buyUpgrade(upgrade);
    upgradeContainer.appendChild(upgradeButton);
  });
}

// Function to buy a manager
function buyManager(businessName) {
  const business = businesses[businessName];
  if (money >= business.manager.cost) {
    money -= business.manager.cost;
    business.manager.hired = true; // Mark manager as hired
    startAutoEarning(businessName);
    updateMoney();
    updateBusinessDisplay(businessName);

    // Hide manager button after purchase
    document.querySelector(`#${businessName} .manager-button`).style.display = "none";
  } else {
    alert("Not enough money to hire the manager!");
  }
}

// Function to start automatic income generation for a business
function startAutoEarning(businessName) {
  const business = businesses[businessName];
  setInterval(() => {
    if (business.manager && business.manager.hired) {
      earnMoney(businessName);
    }
  }, 1000); // Adjust the interval for desired auto-click speed
}

// Helper functions (updateMoney, updateBusinessDisplay, etc.) go here

// Load data and initialize game
window.onload = loadGameData;

// Upgrade types and possible attributes
const upgradeTypes = [
  { type: "incomeMultiplier", minEffect: 1.5, maxEffect: 3.0 },
  { type: "passiveIncomeBoost", minEffect: 1, maxEffect: 5 },
  { type: "costReduction", minEffect: 0.1, maxEffect: 0.5 }
];


// Function to earn money with countdown progress bar and display remaining time
function earnMoney(businessName) {
  const business = businesses[businessName];
  const progressBar = document.querySelector(`#${businessName} .progress-bar`);
  const progressText = document.querySelector(`#${businessName} .progress-text`);

  // Check if the button is clickable
  if (businessesClickable[businessName]) {
    // Set button as not clickable
    businessesClickable[businessName] = false;

    // Update money
    money += business.income;
    updateMoney();

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

      // When the countdown finishes, reset the progress bar and make button clickable
      if (tick >= totalTicks) {
        clearInterval(interval);
        progressBar.style.width = '0%'; // Reset progress bar
        progressText.innerText = ''; // Clear countdown text
        businessesClickable[businessName] = true; // Make button clickable again
      }
    }, intervalTime);
  } else {
    alert("Please wait until the progress bar finishes before clicking again!");
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
      <button class="business-click-button" onclick="earnMoney('${business.name}')" ${business.unlocked ? "" : "disabled"}>
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
  } else {
    alert("Not enough money to upgrade!");
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

  const businessElement = document.getElementById(businessType);
  businessElement.classList.remove("locked");
  businessElement.querySelector(".business-click-button").disabled = false;
  businessElement.querySelector(".upgrade-button").disabled = false;
  businessElement.querySelector(".unlock-info").style.display = "none";
}

// Function to create a unique name based on the upgrade type and strength
function generateUpgradeName(type, effect) {
  switch (type) {
    case "incomeMultiplier":
      return `Profit Multiplier x${effect}`;
    case "passiveIncomeBoost":
      return `Passive Boost +${effect} income/sec`;
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

  // Re-display available upgrades
  upgrades.forEach(upgrade => {
    const upgradeButton = document.createElement("button");
    upgradeButton.innerText = `${upgrade.name} - $${upgrade.cost}`;
    upgradeButton.onclick = () => buyUpgrade(upgrade);
    upgradeList.appendChild(upgradeButton);
  });
}

// Display an upgrade in the sidebar (same as before)
function displayUpgrade(upgrade) {
  const upgradeList = document.getElementById("upgrade-list");
  const upgradeButton = document.createElement("button");
  upgradeButton.innerText = `${upgrade.name} - $${upgrade.cost}`;
  upgradeButton.onclick = () => buyUpgrade(upgrade);
  upgradeList.appendChild(upgradeButton);
}

// Initial upgrades
for (let i = 0; i < 3; i++) {
  generateUpgrade();
}

// Initial upgrades and intervals for passive income
setInterval(() => {
  money += incomePerSec;
  updateMoney();
  checkForUnlocks();
}, 1000);
