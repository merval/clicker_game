// script.js

let money = 0;
let incomePerSec = 0;
let upgrades = [];


// Business stats
const businesses = {
  lemonade: { cost: 10, income: 1.0, upgradeCost: 10, unlocked: true, unlockCost: 0, owned: 1 },
  newspaper: { cost: 50, income: 5.0, upgradeCost: 50, unlocked: false, unlockCost: 100, owned: 0 }
};

// Upgrade types and possible attributes
const upgradeTypes = [
  { type: "incomeMultiplier", minEffect: 1.5, maxEffect: 3.0 },
  { type: "passiveIncomeBoost", minEffect: 1, maxEffect: 5 },
  { type: "costReduction", minEffect: 0.1, maxEffect: 0.5 }
];

// Function to earn money on button click
function earnMoney(businessType) {
  const business = businesses[businessType];
  if (business.unlocked) {
    if (business.owned === 0) {
      business.owned = 1;
    }
    money += business.income;
    updateMoney();
    checkForUnlocks();
  }
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
