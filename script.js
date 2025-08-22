// =========================
// Event Listeners
// =========================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('computeRoute').addEventListener('click', run);
  document.getElementById('resetAll').addEventListener('click', resetAllInputs);
  document.getElementById('testSet').addEventListener('click', testSet);
  document.getElementById('testRoute').addEventListener('click', testRoute);
});
// =========================
// Test Helpers
// =========================
function testSet() {
  const testset = [
    "friendly_axe4", "friendly_axe41", "enemy_sword11", "enemy_axe31",
    "enemy_bow12", "enemy_bow12", "enemy_any21", "enemy_any21",
    "enemy_any21", "enemy_any21"
  ];
  computeBestRoute(testset);
}

function testRoute() {
  const testRoute = "friendly_axe4,enemy_bow12,enemy_sword11,enemy_bow12,enemy_axe31,friendly_axe41,enemy_any21";
  calculateRouteScore(testRoute);
  document.getElementById('routeOutput').innerHTML = generateOutputDisplay(testRoute);
}

// =========================
// Main Run Function
// =========================
function run() {
  const grids = document.querySelectorAll('.mini-grid');
  const results = [];

  grids.forEach(grid => {
    const name = grid.dataset.section || grid.id || 'unnamed-grid';
    const inputs = Array.from(grid.querySelectorAll('input'))
      .filter(input => input.value && input.value !== '0')
      .map(input => name + input.value);

    if (inputs.length) results.push(...inputs);
  });

  computeBestRoute(results);
}

// =========================
// Core Calculation
// =========================
function computeBestRoute(routes) {
  const timer = Date.now();
  const allOrders = permute(routes).map(p => p.join(","));
  console.log(`Computing all routes for ${routes} armies took ${Date.now() - timer} ms.`);

  let bestRoute = null;
  let bestScore = -Infinity;

  for (const order of allOrders) {
    const score = calculateRouteScore(order);
    if (score > bestScore) {
      bestScore = score;
      bestRoute = order;
    }
  }

  document.getElementById('routeOutput').innerHTML = generateOutputDisplay(bestRoute);
}

function calculateRouteScore(route) {
  const armies = route.split(',');
  let currentArmy = armies[0];

  for (let i = 1; i < armies.length; i++) {
    currentArmy = calculateInteraction(currentArmy, armies[i]);
  }

  return currentArmy.includes("friendly")
    ? getArmySize(currentArmy)
    : -getArmySize(currentArmy);
}

// =========================
// Display
// =========================
function generateOutputDisplay(route) {
  const armies = route.split(',');
  let output = `<div style="display: flex; gap: 10px; justify-content: center; align-items: center; margin-bottom: 20px;">`;

  // Top row: sequence of armies
  armies.forEach((army, i) => {
    output += `
      <div style="display: flex; align-items: center; gap: 5px;">
        <span>${getArmySize(army)}</span>
        <img src="images/${getArmyName(army)}.png" alt="${getArmyName(army)}" style="width: 40px;">
        ${i < armies.length - 1 ? `<img src="images/next.png" alt="next" style="height: 20px;">` : ''}
      </div>`;
  });
  output += `</div>`;

  // Battle breakdown
  output += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
  let currentArmy = armies[0];

  for (let i = 0; i < armies.length - 1; i++) {
    const nextArmy = armies[i + 1];
    const aSize = getArmySize(currentArmy);
    const aName = getArmyName(currentArmy);
    const bSize = getArmySize(nextArmy);
    const bName = getArmyName(nextArmy);

    output += `
      <div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
        <span>${aSize}</span> <img src="images/${aName}.png" style="width: 40px;">
        ${aName.includes("friendly") && bName.includes("friendly") ? '+' : '-'}
        <span>${bSize}</span> <img src="images/${bName}.png" style="width: 40px;">
        ${(() => {
          currentArmy = calculateInteraction(currentArmy, nextArmy);
          return `<span>= ${getArmySize(currentArmy)}</span> <img src="images/${getArmyName(currentArmy)}.png" style="width: 40px;">`;
        })()}
      </div>`;
  }

  output += `</div>`;
  return output;
}

// =========================
// Army Helpers
// =========================
function getArmySize(army) {
  return Number(army.match(/\d+/)[0]);
}

function getArmyName(army) {
  return army.replace(/\d+/g, '');
}

function getArmyType(army) {
  const name = getArmyName(army);
  if (name.includes("bow")) return "bow";
  if (name.includes("axe")) return "axe";
  if (name.includes("sword")) return "sword";
  if (name.includes("any")) return "any";
}

// =========================
// Battle Logic
// =========================
function calculateFight(advantageSide, disadvantageSide) {
  let advantageSize = getArmySize(advantageSide);
  let disadvantageSize = getArmySize(disadvantageSide);
  const advantageName = getArmyName(advantageSide);
  const disadvantageName = getArmyName(disadvantageSide);

  while (advantageSize > 0 && disadvantageSize > 0) {
    advantageSize -= 1;
    disadvantageSize -= 1.5;
  }

  advantageSize = Math.max(0, advantageSize);
  disadvantageSize = Math.max(0, disadvantageSize);

  if (disadvantageSize % 1 !== 0) disadvantageSize = Math.floor(disadvantageSize);

  return advantageSize > disadvantageSize
    ? `${advantageName}${advantageSize}`
    : `${disadvantageName}${disadvantageSize}`;
}

function calculateBattle(a, b) {
  const aSize = getArmySize(a);
  const bSize = getArmySize(b);
  const aName = getArmyName(a);
  const bName = getArmyName(b);
  const aType = getArmyType(a);
  const bType = getArmyType(b);

  // Same type or wildcard
  if (aType === bType || aType === "any" || bType === "any") {
    return aSize > bSize
      ? `${aName}${aSize - bSize}`
      : `${bName}${bSize - aSize}`;
  }

  // Advantage rules
  if (aType === "bow") return bType === "axe" ? calculateFight(a, b) : calculateFight(b, a);
  if (aType === "axe") return bType === "sword" ? calculateFight(a, b) : calculateFight(b, a);
  if (aType === "sword") return bType === "bow" ? calculateFight(a, b) : calculateFight(b, a);
}

function calculateInteraction(a, b) {
  const strengthLevel = parseInt(document.getElementById('strengthLevel').value, 10);
  const combineBonus = [0, 7, 11, 15][strengthLevel] || 0;

  const aSize = getArmySize(a);
  const bSize = getArmySize(b);
  const aName = getArmyName(a);
  const bName = getArmyName(b);

  // Combining armies
  if ((aName.includes("friendly") && bName.includes("friendly")) ||
      (aName.includes("enemy") && bName.includes("enemy"))) {
    if (aName.includes("friendly") && aName === bName) {
      return `${aName}${aSize + bSize + combineBonus}`;
    }
    return aSize > bSize
      ? `${aName}${aSize + bSize}`
      : `${bName}${aSize + bSize}`;
  }

  // Battle
  return calculateBattle(a, b);
}

// =========================
// Utility
// =========================
function permute(arr) {
  if (arr.length === 1) return [arr];
  const result = [];
  arr.forEach((item, index) => {
    const remaining = [...arr.slice(0, index), ...arr.slice(index + 1)];
    permute(remaining).forEach(perm => result.push([item, ...perm]));
  });
  return result;
}

function resetAllInputs() {
  document.querySelectorAll('.mini-grid input').forEach(input => input.value = '');
  const outputDiv = document.getElementById('routeOutput');
  if (outputDiv) outputDiv.textContent = '';
}