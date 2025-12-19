// Configuration for the game
const CONFIG = {
  passwordHash:
    "fe8f5e54bbbb685eaca9f1c3f25675912d28f9f95359459cb3ca00201d269c4b", // Password for the game as hashed

  // 8x6 Grid Layout (rows × columns) [web:15]
  // 6x8 Grid (Cols x Rows) based on your image
  grid: [
    ["S", "U", "R", "G", "N", "S"], // Row 0
    ["N", "I", "F", "I", "U", "I"], // Row 1
    ["G", "M", "B", "A", "L", "A"], // Row 2
    ["C", "L", "I", "N", "D", "H"], // Row 3
    ["A", "C", "A", "S", "K", "I"], // Row 4
    ["M", "P", "E", "S", "E", "I"], // Row 5
    ["V", "R", "E", "C", "R", "N"], // Row 6
    ["A", "N", "I", "O", "H", "G"], // Row 7
  ],

  // Theme words to find
  words: [
    {
      word: "HIKING",
      coordinates: [
        [3, 5],
        [4, 5],
        [4, 4],
        [5, 5],
        [6, 5],
        [7, 5],
      ],
    },
    {
      word: "HORSES",
      coordinates: [
        [7, 4],
        [7, 3],
        [6, 4],
        [5, 3],
        [5, 4],
        [4, 3],
      ],
    },
    {
      word: "ANDALUSIA",
      coordinates: [
        [4, 2],
        [3, 3],
        [3, 4],
        [2, 3],
        [2, 4],
        [1, 4],
        [0, 5],
        [1, 5],
        [2, 5],
      ],
    },
    {
      word: "CAMPERVAN",
      coordinates: [
        [3, 0],
        [4, 0],
        [5, 0],
        [5, 1],
        [6, 2],
        [6, 1],
        [6, 0],
        [7, 0],
        [7, 1],
      ],
    },
    {
      word: "SURFING",
      coordinates: [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 2],
        [1, 1],
        [1, 0],
        [2, 0],
      ],
    },
  ],

  // Spangram (Yellow path across the board)
  spangram: {
    word: "ICECLIMBING",
    coordinates: [
      [7, 2],
      [6, 3],
      [5, 2],
      [4, 1],
      [3, 1], // I-C-E-C-L (Bottom to mid)
      [3, 2],
      [2, 1],
      [2, 2],
      [1, 3],
      [0, 4],
      [0, 3], // I-M-B-I-N-G (Mid to top)
    ],
  },
    // Present unlock milestones
    presentUnlocks: [
        { 
            index: 0, 
            requirement: 1, 
            message: 'First word found! Open your present!', // Short notification
            reward: 'Guess first! Reward hint: French, Travel, Clean, Two' // Hidden inside popup
        },
        { 
            index: 1, 
            requirement: 3, 
            message: 'Three words down! Another present unlocked!', 
            reward: 'Guess what is it! Reward hint: Flowers, Memory, Drying, One' 
        },
        { 
            index: 2, 
            requirement: 4, 
            message: 'Almost there! Check your reward!', 
            reward: 'So what is it? Reward hint: Roses, Fire, Smell, Two' 
        },
        { 
            index: 3, 
            requirement: 5, 
            message: 'All regular words found! Amazing job!', 
            reward: 'Reward hint: Creative, Scent, Knowledge, Two' 
        },
        { 
            index: 4, 
            requirement: 'spangram', 
            message: 'Spangram found! Special present unlocked!', 
            reward: 'Reward hint: Resemblance, Neroli, Perfume, One' 
        },
        { 
            index: 5, 
            requirement: 'all', 
            message: 'ALL COMPLETE! The final present is yours!', 
            reward: 'Final Reward hint: Hydration, Pilates, Travel, One' 
        }
  ],

  // Fun messages
  messages: {
    incorrect: [
      "Oh no! That's not it! You owe me a kiss on the cheek!",
      "Hmm... not quite! You need to kiss me on the lips!",
      "Nope! Kiss with tongue! You know what I mean!",
      "Not this time! I need to give you a spanking for that!",
      "Almost! But not quite there yet! I have to bite your nose for that!",
    ],
    correct: [
      "Yes! You found it Honey!",
      "Brilliant! That's correct Honey!",
      "Amazing work! Keep going Honey!",
      "Perfect! You got it Honey!",
      "Wonderful! Keep going Honey!",
    ],
  },
};

// State
let gameState = {
  foundWords: new Set(),
  spangramFound: false,
  selectedCells: [],
  currentWord: "",
  isDragging: false,
  unlockedPresents: new Set(),
};

// SHA-256 hash function
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

// Password screen
async function checkPassword() {
  const input = document.getElementById("passwordInput");
  const error = document.getElementById("passwordError");
  const button = event.target;

  button.disabled = true;
  button.textContent = "Checking...";

  const inputHash = await sha256(input.value);

  if (inputHash === CONFIG.passwordHash) {
    document.getElementById("passwordScreen").classList.remove("active");
    document.getElementById("gameScreen").classList.add("active");
    initGame();
  } else {
    error.textContent = "Wrong password! Try again...";
    error.style.animation = "shake 0.5s";
    input.value = "";
    input.focus();
    button.disabled = false;
    button.textContent = "Enter";
    setTimeout(() => {
      error.style.animation = "";
    }, 500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("passwordInput");
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") checkPassword();
    });
    passwordInput.focus();
  }
});

// Game initialization
function initGame() {
  renderGrid();
  setupDragSelection(); // NEW!
  updateProgress();
  loadProgress();

  const wordInput = document.getElementById("wordInput");
  wordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") submitWord();
  });
}

function renderGrid() {
  const grid = document.getElementById("strandsGrid");
  grid.innerHTML = "";

  CONFIG.grid.forEach((row, rowIndex) => {
    row.forEach((letter, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "letter-cell";
      cell.textContent = letter;
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.dataset.letter = letter;
      grid.appendChild(cell);
    });
  });
}

// Drag - word selection
function setupDragSelection() {
  const grid = document.getElementById("strandsGrid");
  const cells = grid.querySelectorAll(".letter-cell");

  // Mouse events
  cells.forEach((cell) => {
    cell.addEventListener("mousedown", startSelection);
    cell.addEventListener("mouseenter", continueSelection);
    cell.addEventListener("mouseup", endSelection);
  });

  // Touch events for mobile
  cells.forEach((cell) => {
    cell.addEventListener("touchstart", handleTouchStart, { passive: false });
    cell.addEventListener("touchmove", handleTouchMove, { passive: false });
    cell.addEventListener("touchend", handleTouchEnd, { passive: false });
  });

  document.addEventListener("mouseup", endSelection);
}

// Check if touch/mouse is near the center of a cell (makes dragging more precise)
function isNearCenter(clientX, clientY, cell) {
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));    
    // slighly reduced
    return distance < (rect.width * 0.6); 
}

// Draw a line connecting selected letters
function drawConnectorLines() {
    const grid = document.getElementById("strandsGrid");
    let svg = document.getElementById("connections-layer");
    
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "connections-layer";
        // Z-INDEX 50 ensures it sits ON TOP of the letters
        svg.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:50;";
        grid.appendChild(svg);
    }
    
    svg.innerHTML = ''; 
    if (gameState.selectedCells.length < 2) return;

    let pathD = "";
    gameState.selectedCells.forEach((item, index) => {
        const rect = item.cell.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - gridRect.left;
        const y = rect.top + rect.height / 2 - gridRect.top;
        pathD += (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    });

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("stroke", "rgba(102, 126, 234, 0.5)"); // 50% opacity Blue
    path.setAttribute("stroke-width", "20"); // Thicker line
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("fill", "none");
    svg.appendChild(path);
}

function startSelection(e) {
  const cell = e.target;
  if (cell.classList.contains("found") || cell.classList.contains("spangram"))
    return;

  gameState.isDragging = true;
  gameState.selectedCells = [];
  gameState.currentWord = "";

  selectCell(cell);
}

function continueSelection(e) {
    if (!gameState.isDragging) return;
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    const cell = document.elementFromPoint(clientX, clientY);

    if (cell && cell.classList.contains("letter-cell")) {
        // Only select if finger is close to center (Fixes diagonal issue)
        if (isNearCenter(clientX, clientY, cell)) {
            if (!cell.classList.contains("found") && !cell.classList.contains("spangram")) {
                const coordKey = `${cell.dataset.row},${cell.dataset.col}`;
                // Check if already selected
                if (!gameState.selectedCells.find(c => `${c.row},${c.col}` === coordKey)) {
                    // Check adjacency (prevent jumping across board)
                    const last = gameState.selectedCells[gameState.selectedCells.length - 1];
                    if (last && (Math.abs(cell.dataset.row - last.row) > 1 || Math.abs(cell.dataset.col - last.col) > 1)) return;
                    
                    selectCell(cell);
                    drawConnectorLines(); // Draw line!
                }
            }
        }
    }
}

function endSelection(e) {
  if (!gameState.isDragging) return;
  gameState.isDragging = false;

  if (gameState.currentWord.length > 0) {
    checkDraggedWord();
  }
}

function selectCell(cell) {
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const letter = cell.dataset.letter;

  gameState.selectedCells.push({ row, col, cell });
  gameState.currentWord += letter;
  cell.classList.add("selected");

  // Update input field
  document.getElementById("wordInput").value = gameState.currentWord;
}

function clearSelection() {
    gameState.selectedCells.forEach(({ cell }) => cell.classList.remove("selected"));
    gameState.selectedCells = [];
    gameState.currentWord = "";
    document.getElementById("wordInput").value = "";
    
    // Clear the lines
    const svg = document.getElementById("connections-layer");
    if (svg) svg.innerHTML = '';
}

// Touch handling [web:26][web:29]
function handleTouchStart(e) {
  e.preventDefault();
  startSelection({ target: e.target });
}

function handleTouchMove(e) {
    e.preventDefault(); // Stop scrolling
    continueSelection(e); // Use same logic as mouse
}

function handleTouchEnd(e) {
  e.preventDefault();
  endSelection(e);
}

function checkDraggedWord() {
    const word = gameState.currentWord.toUpperCase();

    if (gameState.foundWords.has(word)) {
        showMessage("You already found that word!", "error");
        clearSelection();
        return;
    }

    // 1. Check Spangram
    if (word === CONFIG.spangram.word && !gameState.spangramFound) {
        gameState.spangramFound = true;
        highlightWord(CONFIG.spangram.coordinates, true);
        
        // NEW: Draw Yellow Line
        drawPermanentLine(CONFIG.spangram.coordinates, true);

        showMessage(randomMessage("correct"), "success");
        celebrate();
        checkPresents();
        saveProgress();
        clearSelection();
        updateProgress();
        return;
    }

    // 2. Check Regular Words
    const foundWord = CONFIG.words.find((w) => w.word === word);
    if (foundWord && !gameState.foundWords.has(word)) {
        gameState.foundWords.add(word);
        highlightWord(foundWord.coordinates, false);

        // NEW: Draw Blue Line
        drawPermanentLine(foundWord.coordinates, false);

        showMessage(randomMessage("correct"), "success");
        celebrate();
        checkPresents();
        saveProgress();
        clearSelection();
        updateProgress();
        return;
    }

    // 3. Incorrect
    showMessage(randomMessage("incorrect"), "error");
    clearSelection();
}

// Typing words submission
function submitWord() {
  const input = document.getElementById("wordInput");
  const word = input.value.toUpperCase().trim();

  if (!word) {
    showMessage("Please enter a word!", "error");
    return;
  }

  if (gameState.foundWords.has(word)) {
    showMessage("You already found that word!", "error");
    input.value = "";
    return;
  }

  // Check spangram
  if (word === CONFIG.spangram.word && !gameState.spangramFound) {
    gameState.spangramFound = true;
    highlightWord(CONFIG.spangram.coordinates, true);
    showMessage(randomMessage("correct"), "success");
    celebrate();
    checkPresents();
    saveProgress();
    input.value = "";
    updateProgress();
    return;
  }

  // Check regular words
  const foundWord = CONFIG.words.find((w) => w.word === word);
  if (foundWord && !gameState.foundWords.has(word)) {
    gameState.foundWords.add(word);
    highlightWord(foundWord.coordinates, false);
    showMessage(randomMessage("correct"), "success");
    celebrate();
    checkPresents();
    saveProgress();
    input.value = "";
    updateProgress();
    return;
  }

  // Incorrect
  showMessage(randomMessage("incorrect"), "error");
  input.value = "";
}

// Word highlighting
function highlightWord(coordinates, isSpangram) {
  coordinates.forEach(([row, col]) => {
    const cell = document.querySelector(
      `.letter-cell[data-row="${row}"][data-col="${col}"]`
    );
    if (cell) {
      cell.classList.remove("selected");
      if (isSpangram) {
        cell.classList.add("spangram");
      } else {
        cell.classList.add("found");
      }
    }
  });
}

// Draws a permanent colored line for found words
function drawPermanentLine(coordinates, isSpangram) {
    const grid = document.getElementById("strandsGrid");
    let svg = document.getElementById("permanent-layer");
    
    // Create the layer if it doesn't exist yet
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "permanent-layer";
        // Z-Index 40: Above background, Below letters
        svg.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:40;";
        grid.appendChild(svg);
    }

    let pathD = "";
    coordinates.forEach((coord, index) => {
        // Find the specific cell for this coordinate
        const cell = document.querySelector(`.letter-cell[data-row="${coord[0]}"][data-col="${coord[1]}"]`);
        if(!cell) return;
        
        // Calculate center position
        const rect = cell.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - gridRect.left;
        const y = rect.top + rect.height / 2 - gridRect.top;
        
        pathD += (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    });

    // Draw the line
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("stroke", isSpangram ? "rgba(255, 215, 0, 0.6)" : "rgba(109, 213, 237, 0.6)"); // Yellow or Blue
    path.setAttribute("stroke-width", "20");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("fill", "none");
    svg.appendChild(path);
}

// Present unlocking
function checkPresents() {
  const wordsCount = gameState.foundWords.size;
  const allFound =
    wordsCount === CONFIG.words.length && gameState.spangramFound;

  CONFIG.presentUnlocks.forEach((unlock) => {
    if (gameState.unlockedPresents.has(unlock.index)) return;

    let shouldUnlock = false;

    if (unlock.requirement === "spangram" && gameState.spangramFound) {
      shouldUnlock = true;
    } else if (unlock.requirement === "all" && allFound) {
      shouldUnlock = true;
    } else if (
      typeof unlock.requirement === "number" &&
      wordsCount >= unlock.requirement
    ) {
      shouldUnlock = true;
    }

    if (shouldUnlock) {
      unlockPresent(unlock.index, unlock.message, unlock.reward);
    }
  });

  if (allFound) {
    setTimeout(showVictory, 1500);
  }
}

function unlockPresent(index, message, reward) {
  gameState.unlockedPresents.add(index);
  const present = document.querySelector(
    `.present-item[data-index="${index}"]`
  );

  if (present) {
    present.classList.add("unlocked");
    present.dataset.reward = reward;

    // Add click handler to show reward
    present.onclick = () => showReward(reward);

    setTimeout(() => {
      showMessage(message, "success");
      present.style.transform = "scale(1.2)";
      setTimeout(() => {
        present.style.transform = "scale(1)";
      }, 300);
    }, 600);
  }
}

function showReward(reward) {
  const modal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  rewardText.textContent = reward;
  modal.classList.add("active");
}

function closeReward() {
  const modal = document.getElementById("rewardModal");
  modal.classList.remove("active");
}

// Messages
function showMessage(text, type) {
  const messageArea = document.getElementById("messageArea");
  messageArea.textContent = text;
  messageArea.className = `message-area ${type}`;

  // Animate
  messageArea.style.animation = "none";
  setTimeout(() => {
    messageArea.style.animation =
      type === "error" ? "shake 0.5s" : "bounce 0.6s";
  }, 10);

  setTimeout(() => {
    messageArea.className = "message-area";
  }, 3000);
}

function randomMessage(type) {
  const messages = CONFIG.messages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Progress
function updateProgress() {
  const totalWords = CONFIG.words.length + 1;
  const foundCount =
    gameState.foundWords.size + (gameState.spangramFound ? 1 : 0);

  document.getElementById("wordsFound").textContent = foundCount;
  document.getElementById("totalWords").textContent = totalWords;
}

// Confetti
function celebrate() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");

  // Fix canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = "block";

  const confetti = [];
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#ffd93d",
    "#6c5ce7",
    "#ff9ff3",
  ];

  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      velocity: Math.random() * 4 + 2,
      angle: Math.random() * 360,
      spin: Math.random() * 10 - 5,
    });
  }

  let animationFrameId;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allFallen = true;

    confetti.forEach((p) => {
      p.y += p.velocity;
      p.angle += p.spin;
      p.x += Math.sin(p.y / 30) * 2;

      if (p.y < canvas.height) allFallen = false;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (!allFallen) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
      cancelAnimationFrame(animationFrameId);
    }
  }

  animate();
}

// Victory modal
function showVictory() {
  const modal = document.getElementById("victoryModal");
  modal.classList.add("active");
  celebrate();
}

function closeVictory() {
  const modal = document.getElementById("victoryModal");
  modal.classList.remove("active");
}

// Local storage
function saveProgress() {
  localStorage.setItem(
    "christmasGame",
    JSON.stringify({
      foundWords: Array.from(gameState.foundWords),
      spangramFound: gameState.spangramFound,
      unlockedPresents: Array.from(gameState.unlockedPresents),
    })
  );
}

function loadProgress() {
    const saved = localStorage.getItem("christmasGame");
    if (saved) {
        const data = JSON.parse(saved);
        gameState.foundWords = new Set(data.foundWords);
        gameState.spangramFound = data.spangramFound;
        gameState.unlockedPresents = new Set(data.unlockedPresents);

        // Redraw regular words
        CONFIG.words.forEach((word) => {
            if (gameState.foundWords.has(word.word)) {
                highlightWord(word.coordinates, false);
                drawPermanentLine(word.coordinates, false); // NEW
            }
        });

        // Redraw Spangram
        if (gameState.spangramFound) {
            highlightWord(CONFIG.spangram.coordinates, true);
            drawPermanentLine(CONFIG.spangram.coordinates, true); // NEW
        }

        // Unlock presents
        gameState.unlockedPresents.forEach((index) => {
            const present = document.querySelector(`.present-item[data-index="${index}"]`);
            if (present) {
                present.classList.add("unlocked");
                const unlock = CONFIG.presentUnlocks.find((u) => u.index === index);
                if (unlock) {
                    present.dataset.reward = unlock.reward;
                    present.onclick = () => showReward(unlock.reward);
                }
            }
        });

        updateProgress();
    }
}

// Close reward modal
function closeReward() {
  const modal = document.getElementById("rewardModal");
  modal.classList.remove("active");
}

function resetGame() {
    if(confirm("Are you sure you want to reset the game? All progress will be lost!")) {
        localStorage.removeItem("christmasGame");
        location.reload();
    }
}