const board = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const pauseBtn = document.getElementById("pause-btn");
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const gameContainer = document.getElementById("game-container");

const barDNA = document.getElementById("bar-dna");
const barMutation = document.getElementById("bar-mutation");

const boardSize = 20;
let blob = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let food = randomPosition();
let powerUps = [];
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let paused = false;
let speed = 150;
let gameInterval;
let doublePoints = false;
let activeDNA = 0;
let activeMutation = 0;
let trails = [];

highScoreDisplay.textContent = "High Score: " + highScore;

// Start game
startBtn.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  resetGame();
  gameInterval = setInterval(gameLoop, speed);
});

pauseBtn.addEventListener("click", togglePause);

function drawBoard() {
  board.innerHTML = "";
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const cell = document.createElement("div");
      const inBlob = blob.some(seg => seg.x === x && seg.y === y);
      const inTrail = trails.some(t => t.x === x && t.y === y);
      const power = powerUps.find(p => p.x === x && p.y === y);
      if (inBlob) cell.classList.add("blob");
      else if (x === food.x && y === food.y) cell.classList.add("food");
      else if (inTrail) cell.classList.add("trail");
      else if (power) cell.classList.add(power.type);
      board.appendChild(cell);
    }
  }
}

function moveBlob() {
  if (paused) return;
  const head = { ...blob[0] };
  head.x += direction.x;
  head.y += direction.y;

  // Collision
  if (
    head.x < 0 || head.x >= boardSize ||
    head.y < 0 || head.y >= boardSize ||
    blob.some(seg => seg.x === head.x && seg.y === head.y)
  ) {
    alert("💀 Game Over! Final Score: " + score);
    resetGame();
    return;
  }

// Trail effect
  trails.push({ ...blob[blob.length - 1] });
  if (trails.length > 20) trails.shift();

  blob.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    food = randomPosition();
    score += doublePoints ? 2 : 1;
    updateScore();
    spawnPowerUp();
  } else {
    blob.pop();
  }

// Power-up collision
  const puIndex = powerUps.findIndex(p => p.x === head.x && p.y === head.y);
  if (puIndex !== -1) {
    const pu = powerUps[puIndex];
    powerUps.splice(puIndex, 1);
    activatePowerUp(pu.type);
  }
}

function updateScore() {
  scoreDisplay.textContent = "Score: " + score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    highScoreDisplay.textContent = "High Score: " + highScore;
  }
}

function resetGame() {
  blob = [{ x: 10, y: 10 }];
  direction = { x: 1, y: 0 }; // Start moving right
  food = randomPosition();
  powerUps = [];
  score = 0;
  speed = 150;
  doublePoints = false;
  activeDNA = 0;
  activeMutation = 0;
  trails = [];
  updateScore();
  updatePowerupUI();
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, speed);
}


function randomPosition() {
  let pos;
  while (
    !pos || blob.some(s => s.x === pos.x && s.y === pos.y)
  ) {
    pos = {
      x: Math.floor(Math.random() * boardSize),
      y: Math.floor(Math.random() * boardSize)
    };
  }
  return pos;
}

function spawnPowerUp() {
  if (Math.random() < 0.4) {
    const types = ["dna", "mutation"];
    const type = types[Math.floor(Math.random() * types.length)];
    const pos = randomPosition();
    powerUps.push({ ...pos, type });
  }
}

function activatePowerUp(type) {
  shakeScreen();
  if (type === "dna") {
    activeDNA = 100;
    clearInterval(gameInterval);
    speed = 80;
    gameInterval = setInterval(gameLoop, speed);
    const interval = setInterval(() => {
      activeDNA -= 2;
      updatePowerupUI();
      if (activeDNA <= 0) {
        clearInterval(interval);
        speed = 150;
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, speed);
      }
    }, 150);
  } else if (type === "mutation") {
    activeMutation = 100;
    doublePoints = true;
    const interval = setInterval(() => {
      activeMutation -= 2;
      updatePowerupUI();
      if (activeMutation <= 0) {
        clearInterval(interval);
        doublePoints = false;
      }
    }, 200);
  }
}

function updatePowerupUI() {
  barDNA.style.width = `${activeDNA}%`;
  barMutation.style.width = `${activeMutation}%`;
}

function togglePause() {
  paused = !paused;
  pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
}

function gameLoop() {
  moveBlob();
  drawBoard();
}

function shakeScreen() {
  board.style.transition = 'transform 0.1s';
  board.style.transform = 'translate(2px, 2px)';
  setTimeout(() => board.style.transform = 'translate(-2px, -2px)', 50);
  setTimeout(() => board.style.transform = 'translate(0, 0)', 100);
}

window.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowUp":
    case "w":
      if (direction.y === 0) direction = { x: 0, y: -1 };
      break;
    case "ArrowDown":
    case "s":
      if (direction.y === 0) direction = { x: 0, y: 1 };
      break;
    case "ArrowLeft":
    case "a":
      if (direction.x === 0) direction = { x: -1, y: 0 };
      break;
    case "ArrowRight":
    case "d":
      if (direction.x === 0) direction = { x: 1, y: 0 };
      break;
    case "p":
      togglePause();
      break;
  }
});

// Mobile touch controls
document.querySelectorAll(".touch-controls .btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const dir = btn.classList;
    if (dir.contains("up") && direction.y === 0) direction = { x: 0, y: -1 };
    if (dir.contains("down") && direction.y === 0) direction = { x: 0, y: 1 };
    if (dir.contains("left") && direction.x === 0) direction = { x: -1, y: 0 };
    if (dir.contains("right") && direction.x === 0) direction = { x: 1, y: 0 };
  });
});
