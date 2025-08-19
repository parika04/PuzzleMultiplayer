let gameState = {
    roomCode: '',
    playerName: '',
    gameImage: null,
    gridSize: 4,
    pieces: [],
    timer: 300,
    mistakes: 0,
    gameStarted: false
};

let timerInterval;
let selectedPieceId = null;

// Array of hardcoded image URLs
const randomImageURLs = [
    'https://images.unsplash.com/photo-1549488349-e2630f3a372d?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579783902677-fcb03163353e?q=80&w=2557&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1610444589091-a67b4c2b9213?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472214379701-443b02000570?q=80&w=2669&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490730149028-56064052f759?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-82b304f5e27a?q=80&w=2500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-4010a30b4620?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505533321630-975218a5f66f?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498848148386-d2c6c4c3e80f?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520188989506-69925828a2a5?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507641018305-64906f2d4807?q=80&w=2670&auto=format&fit=crop'
];

// Helper function to show and hide screens
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Helper function to generate a random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    document.getElementById('playerName').value = `Player${Math.floor(Math.random() * 100)}`;
});

// Load pre-added images directly from the array
function loadRandomImages() {
    const container = document.getElementById('randomImagesContainer');
    const loading = document.getElementById('imagesLoading');
    const grid = document.getElementById('randomImagesGrid');

    container.style.display = 'block';
    loading.style.display = 'flex';
    grid.innerHTML = '';

    // Immediately display images without a delay
    loading.style.display = 'none';
    randomImageURLs.forEach((url, index) => {
        const option = document.createElement('div');
        option.className = 'random-image-option';
        option.onclick = () => selectRandomImage(url, option);

        const img = new Image();
        img.src = url;
        img.alt = `Random Image ${index + 1}`;

        option.appendChild(img);
        grid.appendChild(option);
    });
}

function selectRandomImage(url, element) {
    document.querySelectorAll('.random-image-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    element.classList.add('selected');

    gameState.gameImage = url;
    const preview = document.getElementById('previewImage');
    preview.src = url;
    preview.style.display = 'block';

    document.getElementById('imageUpload').value = '';
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            gameState.gameImage = e.target.result;
            const preview = document.getElementById('previewImage');
            preview.src = e.target.result;
            preview.style.display = 'block';

            document.getElementById('randomImagesContainer').style.display = 'none';
            document.querySelectorAll('.random-image-option').forEach(opt => opt.classList.remove('selected'));
        };
        reader.readAsDataURL(file);
    }
}

async function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();

    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    if (!gameState.gameImage) {
        alert('Please select or upload an image');
        return;
    }

    gameState.playerName = playerName;
    gameState.roomCode = document.getElementById('roomCode').value.trim() || generateRoomCode();

    document.getElementById('displayRoomCode').textContent = gameState.roomCode;
    showScreen('waitingScreen');

    // Wait for image to load before starting the game
    await new Promise(resolve => {
        const img = new Image();
        img.src = gameState.gameImage;
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to prevent infinite waiting
    });

    startGame();
}

function startGame() {
    showScreen('gameScreen');
    gameState.gameStarted = true;

    document.getElementById('player1Name').textContent = gameState.playerName;
    document.getElementById('player2Name').textContent = 'AI Partner';

    setupPuzzleGrid();
    generatePuzzlePieces();
    startTimer();
}

function setupPuzzleGrid() {
    const grid = document.getElementById('puzzleGrid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${gameState.gridSize}, 1fr)`;

    for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot';
            slot.dataset.row = row;
            slot.dataset.col = col;
            slot.onclick = () => handleSlotClick(row, col);
            grid.appendChild(slot);
        }
    }
}

function generatePuzzlePieces() {
    const container = document.getElementById('piecesGrid');
    container.innerHTML = '';
    gameState.pieces = [];

    const image = new Image();
    image.src = gameState.gameImage;

    image.onload = () => {
        const imgWidth = image.naturalWidth;
        const imgHeight = image.naturalHeight;
        const pieceWidth = imgWidth / gameState.gridSize;
        const pieceHeight = imgHeight / gameState.gridSize;

        const tempPieces = [];
        for (let row = 0; row < gameState.gridSize; row++) {
            for (let col = 0; col < gameState.gridSize; col++) {
                const piece = {
                    id: `piece_${row}_${col}`,
                    correctRow: row,
                    correctCol: col,
                    placed: false
                };
                tempPieces.push(piece);
            }
        }

        tempPieces.sort(() => Math.random() - 0.5);

        gameState.pieces = tempPieces;

        gameState.pieces.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.className = `puzzle-piece ${Math.random() > 0.5 ? 'player1-piece' : 'player2-piece'}`;
            pieceElement.dataset.pieceId = piece.id;
            pieceElement.onclick = () => selectPiece(piece.id);

            const canvas = document.createElement('canvas');
            canvas.width = pieceWidth;
            canvas.height = pieceHeight;
            const context = canvas.getContext('2d');

            context.drawImage(image, piece.correctCol * pieceWidth, piece.correctRow * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);

            pieceElement.style.backgroundImage = `url(${canvas.toDataURL()})`;

            container.appendChild(pieceElement);
        });
    };

    if (image.complete) {
        image.onload();
    }
}

function selectPiece(pieceId) {
    document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('selected'));

    selectedPieceId = pieceId;
    const pieceElement = document.querySelector(`[data-piece-id="${pieceId}"]`);
    if (pieceElement) {
        pieceElement.classList.add('selected');
    }
}

function handleSlotClick(row, col) {
    if (!selectedPieceId) return;

    const piece = gameState.pieces.find(p => p.id === selectedPieceId);
    if (!piece || piece.placed) return;

    const slot = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (slot.classList.contains('occupied')) return;

    const isCorrect = piece.correctRow === row && piece.correctCol === col;

    if (isCorrect) {
        placePiece(piece, slot);

        if (gameState.pieces.every(p => p.placed)) {
            completeGame();
        }
    } else {
        gameState.mistakes++;
        gameState.timer -= 10;
        showPenalty();
    }

    selectedPieceId = null;
    document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('selected'));
}

function placePiece(piece, slot) {
    piece.placed = true;
    slot.classList.add('occupied');

    const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
    if (pieceElement) {
        const bgImage = pieceElement.style.backgroundImage;

        pieceElement.remove();

        const placedPiece = document.createElement('div');
        placedPiece.className = 'placed-piece';
        placedPiece.style.backgroundImage = bgImage;

        slot.appendChild(placedPiece);
    }
}

function showPenalty() {
    const flash = document.createElement('div');
    flash.className = 'penalty-flash';
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.background = 'rgba(231, 76, 60, 0.4)';
    flash.style.zIndex = '999';
    flash.style.pointerEvents = 'none';

    document.body.appendChild(flash);

    setTimeout(() => {
        document.body.removeChild(flash);
    }, 500);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        gameState.timer--;
        updateTimer();

        if (gameState.timer <= 0) {
            clearInterval(timerInterval);
            gameOver();
        }
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    const timerElement = document.getElementById('gameTimer');

    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (gameState.timer <= 60) {
        timerElement.classList.add('warning');
    } else {
        timerElement.classList.remove('warning');
    }
}

function completeGame() {
    clearInterval(timerInterval);

    const finalTime = 300 - gameState.timer;
    const minutes = Math.floor(finalTime / 60);
    const seconds = finalTime % 60;

    document.getElementById('scoreboardTitle').textContent = '🎉 Puzzle Complete! 🎉';
    document.getElementById('finalTime').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('totalMistakes').textContent = gameState.mistakes;

    const teamworkScore = Math.max(0, 100 - (gameState.mistakes * 5));
    document.getElementById('teamworkScore').textContent = `${teamworkScore}%`;

    showScreen('scoreboardScreen');
}

function gameOver() {
    clearInterval(timerInterval);
    document.getElementById('scoreboardTitle').textContent = 'Time\'s Up! Game Over.';
    document.getElementById('finalTime').textContent = '05:00';
    document.getElementById('totalMistakes').textContent = gameState.mistakes;
    document.getElementById('teamworkScore').textContent = '0%';

    showScreen('scoreboardScreen');
}

function leaveRoom() {
    clearInterval(timerInterval);
    goHome();
}

function goHome() {
    gameState = {
        roomCode: '',
        playerName: '',
        gameImage: null,
        gridSize: 4,
        pieces: [],
        timer: 300,
        mistakes: 0,
        gameStarted: false
    };
    selectedPieceId = null;
    clearInterval(timerInterval);

    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('randomImagesContainer').style.display = 'none';
    document.getElementById('imageUpload').value = '';

    showScreen('startScreen');
}

function playAgain() {
    gameState.pieces = [];
    gameState.timer = 300;
    gameState.mistakes = 0;
    gameState.gameStarted = true;
    selectedPieceId = null;

    startGame();
}