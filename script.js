// Configuration for the game
const CONFIG = {
    passwordHash: 'fe8f5e54bbbb685eaca9f1c3f25675912d28f9f95359459cb3ca00201d269c4b', // Password for the game as hashed
    
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
        { index: 0, requirement: 1, message: '🎁 First present unlocked! Reward hint: Roses!'},
        { index: 1, requirement: 3, message: '🎁 Third word! Another present awaits... Reward hint: Drying!'},
        { index: 2, requirement: 5, message: '🎁 Amazing! Fifth word unlocked! The present is on its way... Reward hint: Nerolis!' },
        { index: 3, requirement: 'spangram', message: '🎀 Spangram found! Special present unlocked! Reward hint: Hydration!' },
        { index: 4, requirement: 'all', message: '🌟 ALL COMPLETE! Main present is yours! Reward hint: Coziness!' }
    ],
    
    // Fun messages
    messages: {
        incorrect: [
            'Oh no! That\'s not it! You owe me a kiss on the cheek!',
            'Hmm... not quite! You need to kiss me on the lips!',
            'Nope! Kiss wiht tongue! You know what I mean!',
            'Not this time! I need to give you a spanking for that!',
            'Almost! But not quite there yet! I have to bite your nose for that!'
        ],
        correct: [
            'Yes! You found it Honey!',
            'Brilliant! That\'s correct Honey!',
            'Amazing work! Keep going Honey!',
            'Perfect! You got it Honey!',
            'Wonderful! Keep going Honey!'
        ]
    }
};

// State
let gameState = {
    foundWords: new Set(),  
    spangramFound: false,
    selectedCells: [],
    currentWord: '',
    isDragging: false,
    unlockedPresents: new Set()
};

// SHA-256 hash function
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Password screen
async function checkPassword() {
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');
    const button = event.target;
    
    button.disabled = true;
    button.textContent = 'Checking...';
    
    const inputHash = await sha256(input.value);
    
    if (inputHash === CONFIG.passwordHash) {
        document.getElementById('passwordScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        initGame();
    } else {
        error.textContent = 'Wrong password! Try again...';
        error.style.animation = 'shake 0.5s';
        input.value = '';
        input.focus();
        button.disabled = false;
        button.textContent = 'Enter';
        setTimeout(() => {
            error.style.animation = '';
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
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
    
    const wordInput = document.getElementById('wordInput');
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitWord();
    });
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
            cell.dataset.letter = letter;
            grid.appendChild(cell);
        });
    });
}

// Drag - word selection
function setupDragSelection() {
    const grid = document.getElementById('strandsGrid');
    const cells = grid.querySelectorAll('.letter-cell');
    
    // Mouse events
    cells.forEach(cell => {
        cell.addEventListener('mousedown', startSelection);
        cell.addEventListener('mouseenter', continueSelection);
        cell.addEventListener('mouseup', endSelection);
    });
    
    // Touch events for mobile
    cells.forEach(cell => {
        cell.addEventListener('touchstart', handleTouchStart, { passive: false });
        cell.addEventListener('touchmove', handleTouchMove, { passive: false });
        cell.addEventListener('touchend', handleTouchEnd, { passive: false });
    });
    
    document.addEventListener('mouseup', endSelection);
}

function startSelection(e) {
    const cell = e.target;
    if (cell.classList.contains('found') || cell.classList.contains('spangram')) return;
    
    gameState.isDragging = true;
    gameState.selectedCells = [];
    gameState.currentWord = '';
    
    selectCell(cell);
}

function continueSelection(e) {
    if (!gameState.isDragging) return;
    const cell = e.target;
    if (cell.classList.contains('found') || cell.classList.contains('spangram')) return;
    
    const coordKey = `${cell.dataset.row},${cell.dataset.col}`;
    if (!gameState.selectedCells.find(c => `${c.row},${c.col}` === coordKey)) {
        selectCell(cell);
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
    cell.classList.add('selected');
    
    // Update input field
    document.getElementById('wordInput').value = gameState.currentWord;
}

function clearSelection() {
    gameState.selectedCells.forEach(({ cell }) => {
        cell.classList.remove('selected');
    });
    gameState.selectedCells = [];
    gameState.currentWord = '';
    document.getElementById('wordInput').value = '';
}

// Touch handling [web:26][web:29]
function handleTouchStart(e) {
    e.preventDefault();
    startSelection({ target: e.target });
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.classList.contains('letter-cell')) {
        continueSelection({ target: element });
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    endSelection(e);
}

function checkDraggedWord() {
    const word = gameState.currentWord.toUpperCase();
    
    if (gameState.foundWords.has(word)) {
        showMessage('You already found that word!', 'error');
        clearSelection();
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
        clearSelection();
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
        clearSelection();
        updateProgress();
        return;
    }
    
    // Incorrect
    showMessage(randomMessage('incorrect'), 'error');
    clearSelection();
}
// Typing words submission
function submitWord() {
    const input = document.getElementById('wordInput');
    const word = input.value.toUpperCase().trim();
    
    if (!word) {
        showMessage('Please enter a word!', 'error');
        return;
    }
    
    if (gameState.foundWords.has(word)) {
        showMessage('You already found that word!', 'error');
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
    
    // Incorrect
    showMessage(randomMessage('incorrect'), 'error');
    input.value = '';
}

// Word highlighting
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

// Present unlocking
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
            unlockPresent(unlock.index, unlock.message, unlock.reward);
        }
    });
    
    if (allFound) {
        setTimeout(showVictory, 1500);
    }
}

function unlockPresent(index, message, reward) {
    gameState.unlockedPresents.add(index);
    const present = document.querySelector(`.present-item[data-index="${index}"]`);
    
    if (present) {
        present.classList.add('unlocked');
        present.dataset.reward = reward;
        
        // Add click handler to show reward
        present.onclick = () => showReward(reward);
        
        setTimeout(() => {
            showMessage(message, 'success');
            present.style.transform = 'scale(1.2)';
            setTimeout(() => {
                present.style.transform = 'scale(1)';
            }, 300);
        }, 600);
    }
}

function showReward(reward) {
    const modal = document.getElementById('rewardModal');
    const rewardText = document.getElementById('rewardText');
    rewardText.textContent = reward;
    modal.classList.add('active');
}

function closeReward() {
    const modal = document.getElementById('rewardModal');
    modal.classList.remove('active');
}

// Messages
function showMessage(text, type) {
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = text;
    messageArea.className = `message-area ${type}`;
    
    // Animate
    messageArea.style.animation = 'none';
    setTimeout(() => {
        messageArea.style.animation = type === 'error' ? 'shake 0.5s' : 'bounce 0.6s';
    }, 10);
    
    setTimeout(() => {
        messageArea.className = 'message-area';
    }, 3000);
}

function randomMessage(type) {
    const messages = CONFIG.messages[type];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Progress
function updateProgress() {
    const totalWords = CONFIG.words.length + 1;
    const foundCount = gameState.foundWords.size + (gameState.spangramFound ? 1 : 0);
    
    document.getElementById('wordsFound').textContent = foundCount;
    document.getElementById('totalWords').textContent = totalWords;
}

// Confetti
function celebrate() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    
    // Fix canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    
    const confetti = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6c5ce7', '#ff9ff3'];
    
    for (let i = 0; i < 100; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            velocity: Math.random() * 4 + 2,
            angle: Math.random() * 360,
            spin: Math.random() * 10 - 5
        });
    }
    
    let animationFrameId;
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let allFallen = true;
        
        confetti.forEach(p => {
            p.y += p.velocity;
            p.angle += p.spin;
            p.x += Math.sin(p.y / 30) * 2;
            
            if (p.y < canvas.height) allFallen = false;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });
        
        if (!allFallen) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
            cancelAnimationFrame(animationFrameId);
        }
    }
    
    animate();
}

// Victory modal
function showVictory() {
    const modal = document.getElementById('victoryModal');
    modal.classList.add('active');
    celebrate();
}

function closeVictory() {
    const modal = document.getElementById('victoryModal');
    modal.classList.remove('active');
}

// Local storage
function saveProgress() {
    localStorage.setItem('christmasGame', JSON.stringify({
        foundWords: Array.from(gameState.foundWords),
        spangramFound: gameState.spangramFound,
        unlockedPresents: Array.from(gameState.unlockedPresents)
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('christmasGame');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.foundWords = new Set(data.foundWords);
        gameState.spangramFound = data.spangramFound;
        gameState.unlockedPresents = new Set(data.unlockedPresents);
        
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
            if (present) {
                present.classList.add('unlocked');
                const unlock = CONFIG.presentUnlocks.find(u => u.index === index);
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
    const modal = document.getElementById('rewardModal');
    modal.classList.remove('active');
}