// ========== CONFIGURATION ==========
const CONFIG = {
    password: 'christmas2025', // Password for the game
    
    // 6x8 Grid Layout (rows × columns) [web:15]
    grid: [
        ['P', 'A', 'R', 'I', 'S', 'C', 'O', 'F'],
        ['V', 'E', 'N', 'I', 'C', 'E', 'F', 'F'],
        ['A', 'M', 'S', 'T', 'E', 'R', 'D', 'A'],
        ['M', 'U', 'S', 'I', 'C', 'V', 'A', 'M'],
        ['B', 'E', 'R', 'L', 'I', 'N', 'Y', 'I'],
        ['R', 'O', 'M', 'E', 'D', 'A', 'N', 'C']
    ],
    
    // Theme words to find
    words: [
        { word: 'PARIS', coordinates: [[0,0], [0,1], [0,2], [0,3], [0,4]] },
        { word: 'VENICE', coordinates: [[1,0], [1,1], [1,2], [1,3], [1,4], [1,5]] },
        { word: 'AMSTERDAM', coordinates: [[2,0], [2,1], [2,2], [2,3], [2,4], [2,5], [2,6], [2,7], [3,7]] },
        { word: 'BERLIN', coordinates: [[4,0], [4,1], [4,2], [4,3], [4,4], [4,5]] },
        { word: 'ROME', coordinates: [[5,0], [5,1], [5,2], [5,3]] },
        { word: 'MUSIC', coordinates: [[3,0], [3,1], [3,2], [3,3], [3,4]] },
        { word: 'DANCE', coordinates: [[5,4], [5,5], [5,6], [5,7], [4,7]] }
    ],
    
    // Spangram (spans opposite sides) [web:15]
    spangram: { word: 'COFFEE', coordinates: [[0,5], [0,6], [0,7], [1,7], [1,6], [1,5]] },
    
    // Present unlock milestones
    presentUnlocks: [
        { index: 0, requirement: 1, message: '🎁 First present unlocked! Check your hints...' },
        { index: 1, requirement: 3, message: '🎁 Third word! Another present awaits...' },
        { index: 2, requirement: 5, message: '🎁 Amazing! Fifth word unlocked!' },
        { index: 3, requirement: 'spangram', message: '🎀 Spangram found! Special present unlocked!' },
        { index: 4, requirement: 'all', message: '🌟 ALL COMPLETE! Main present is yours!' }
    ],
    
    // Fun messages
    messages: {
        incorrect: [
            'Oh no! That\'s not it! Try again! 💭',
            'Hmm... not quite! Keep trying! 🤔',
            'Nope! But you\'re getting warmer! 🔥',
            'Not this time! Give it another shot! 💪',
            'Almost! But not quite there yet! 🎯'
        ],
        correct: [
            'YES! You found it! 🎉',
            'Brilliant! That\'s correct! ⭐',
            'Amazing work! 💫',
            'Perfect! You got it! 🌟',
            'Wonderful! Keep going! 🎊'
        ]
    }
};

// ========== STATE ==========
let gameState = {
    foundWords: new Set(),
    spangramFound: false,
    selectedCells: [],
    unlockedPresents: new Set()
};

// ========== PASSWORD SCREEN ==========
function checkPassword() {
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');
    
    if (input.value === CONFIG.password) {
        document.getElementById('passwordScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        initGame();
    } else {
        error.textContent = '❌ Wrong password! Try again...';
        input.value = '';
        input.focus();
    }
}

// Allow Enter key for password
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
        passwordInput.focus();
    }
});

// ========== GAME INITIALIZATION ==========
function initGame() {
    renderGrid();
    updateProgress();
    loadProgress();
    
    // Allow Enter key for word submission
    const wordInput = document.getElementById('wordInput');
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitWord();
    });
    wordInput.focus();
}

function renderGrid() {
    const grid = document.getElementById('strandsGrid');
    grid.innerHTML = '';
    
    CONFIG.grid.forEach((row, rowIndex) => {
        row.forEach((letter, colIndex) => {
            const cell = document.createElement('div');
            cell.className = 'letter-cell';
            cell.textContent = letter;
            cell.dataset.row = rowIndex;
            cell.dataset.col = colIndex;
            cell.onclick = () => selectCell(rowIndex, colIndex);
            grid.appendChild(cell);
        });
    });
}

// ========== WORD SUBMISSION ==========
function submitWord() {
    const input = document.getElementById('wordInput');
    const word = input.value.toUpperCase().trim();
    
    if (!word) return;
    
    // Check if already found
    if (gameState.foundWords.has(word)) {
        showMessage('You already found that word! 🔄', 'error');
        input.value = '';
        return;
    }
    
    // Check spangram
    if (word === CONFIG.spangram.word && !gameState.spangramFound) {
        gameState.spangramFound = true;
        highlightWord(CONFIG.spangram.coordinates, true);
        showMessage(randomMessage('correct'), 'success');
        celebrate();
        checkPresents();
        saveProgress();
        input.value = '';
        updateProgress();
        return;
    }
    
    // Check regular words
    const foundWord = CONFIG.words.find(w => w.word === word);
    if (foundWord && !gameState.foundWords.has(word)) {
        gameState.foundWords.add(word);
        highlightWord(foundWord.coordinates, false);
        showMessage(randomMessage('correct'), 'success');
        celebrate();
        checkPresents();
        saveProgress();
        input.value = '';
        updateProgress();
        return;
    }
    
    // Incorrect word
    showMessage(randomMessage('incorrect'), 'error');
    input.value = '';
}

// ========== WORD HIGHLIGHTING ==========
function highlightWord(coordinates, isSpangram) {
    coordinates.forEach(([row, col]) => {
        const cell = document.querySelector(
            `.letter-cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell) {
            cell.classList.remove('selected');
            if (isSpangram) {
                cell.classList.add('spangram');
            } else {
                cell.classList.add('found');
            }
        }
    });
}

// ========== CELL SELECTION (VISUAL ONLY) ==========
function selectCell(row, col) {
    const cell = document.querySelector(
        `.letter-cell[data-row="${row}"][data-col="${col}"]`
    );
    
    if (cell.classList.contains('found') || cell.classList.contains('spangram')) {
        return;
    }
    
    cell.classList.toggle('selected');
}

// ========== PRESENT UNLOCKING ==========
function checkPresents() {
    const wordsCount = gameState.foundWords.size;
    const allFound = wordsCount === CONFIG.words.length && gameState.spangramFound;
    
    CONFIG.presentUnlocks.forEach(unlock => {
        if (gameState.unlockedPresents.has(unlock.index)) return;
        
        let shouldUnlock = false;
        
        if (unlock.requirement === 'spangram' && gameState.spangramFound) {
            shouldUnlock = true;
        } else if (unlock.requirement === 'all' && allFound) {
            shouldUnlock = true;
        } else if (typeof unlock.requirement === 'number' && wordsCount >= unlock.requirement) {
            shouldUnlock = true;
        }
        
        if (shouldUnlock) {
            unlockPresent(unlock.index, unlock.message);
        }
    });
    
    // Check victory
    if (allFound) {
        setTimeout(showVictory, 1000);
    }
}

function unlockPresent(index, message) {
    gameState.unlockedPresents.add(index);
    const present = document.querySelector(`.present-item[data-index="${index}"]`);
    if (present) {
        present.classList.add('unlocked');
        setTimeout(() => showMessage(message, 'success'), 500);
    }
}

// ========== MESSAGES ==========
function showMessage(text, type) {
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = text;
    messageArea.className = `message-area ${type}`;
    
    setTimeout(() => {
        messageArea.className = 'message-area';
    }, 3000);
}

function randomMessage(type) {
    const messages = CONFIG.messages[type];
    return messages[Math.floor(Math.random() * messages.length)];
}

// ========== PROGRESS ==========
function updateProgress() {
    const totalWords = CONFIG.words.length + 1; // +1 for spangram
    const foundCount = gameState.foundWords.size + (gameState.spangramFound ? 1 : 0);
    
    document.getElementById('wordsFound').textContent = foundCount;
    document.getElementById('totalWords').textContent = totalWords;
}

// ========== CONFETTI ANIMATION ========== [web:17][web:20]
function celebrate() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6c5ce7'];
    
    for (let i = 0; i < 50; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 5 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            velocity: Math.random() * 3 + 2,
            angle: Math.random() * 360
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach(p => {
            p.y += p.velocity;
            p.angle += 2;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });
        
        if (confetti[0].y < canvas.height) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animate();
}

// ========== VICTORY MODAL ==========
function showVictory() {
    const modal = document.getElementById('victoryModal');
    modal.classList.add('active');
    celebrate();
}

function closeVictory() {
    const modal = document.getElementById('victoryModal');
    modal.classList.remove('active');
}

// ========== LOCAL STORAGE ==========
function saveProgress() {
    localStorage.setItem('gameState', JSON.stringify({
        foundWords: Array.from(gameState.foundWords),
        spangramFound: gameState.spangramFound,
        unlockedPresents: Array.from(gameState.unlockedPresents)
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.foundWords = new Set(data.foundWords);
        gameState.spangramFound = data.spangramFound;
        gameState.unlockedPresents = new Set(data.unlockedPresents);
        
        // Restore visual state
        CONFIG.words.forEach(word => {
            if (gameState.foundWords.has(word.word)) {
                highlightWord(word.coordinates, false);
            }
        });
        
        if (gameState.spangramFound) {
            highlightWord(CONFIG.spangram.coordinates, true);
        }
        
        gameState.unlockedPresents.forEach(index => {
            const present = document.querySelector(`.present-item[data-index="${index}"]`);
            if (present) present.classList.add('unlocked');
        });
        
        updateProgress();
    }
}