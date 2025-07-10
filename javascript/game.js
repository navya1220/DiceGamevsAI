document.addEventListener('DOMContentLoaded', () => {
    const gameState = {
        playerTotal: 0,
        playerCurrent: 0,
        aiTotal: 0,
        aiCurrent: 0,
        round: 1,
        isPlayerTurn: true,
        gameOver: false,
        difficulty: 'medium',
        aiPersonality: 'neutral',
        targetScore: 100
    };

    // AI personalities
    const aiPersonalities = {
        easy: {
            riskThreshold: 15,
            bluffChance: 0.1,
            delay: 1000,
            messages: {
                roll: ["I'll try my luck!", "Let's roll!", "Feeling lucky!"],
                hold: ["I'll play it safe.", "Good enough for now.", "Your turn!"],
                win: ["Beginner's luck!", "I won? Yay!", "Easy peasy!"],
                lose: ["Good game!", "You're too good!", "I'll get you next time!"]
            }
        },
        medium: {
            riskThreshold: 20,
            bluffChance: 0.3,
            delay: 1500,
            messages: {
                roll: ["I'm feeling confident!", "Let's push further!", "Risk it for the biscuit!"],
                hold: ["Smart play time.", "I'll settle here.", "Your turn, human."],
                win: ["Victory is mine!", "Superior AI wins!", "I calculated this outcome."],
                lose: ["You got me this time.", "Well played.", "I underestimated you."]
            }
        },
        hard: {
            riskThreshold: 25,
            bluffChance: 0.5,
            delay: 2000,
            messages: {
                roll: ["I shall dominate!", "Pushing my advantage!", "I smell victory!"],
                hold: ["Strategic retreat.", "I'll bide my time.", "Your move, inferior being."],
                win: ["As predicted.", "Humanity stands no chance.", "Another victory for AI supremacy!"],
                lose: ["Impossible!", "You got lucky!", "This was a fluke!"]
            }
        }
    };

    // DOM elements
    const diceElement = document.getElementById('dice');
    const rollBtn = document.getElementById('roll-btn');
    const holdBtn = document.getElementById('hold-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const playerTotalElement = document.getElementById('player-total');
    const playerCurrentElement = document.getElementById('player-current');
    const aiTotalElement = document.getElementById('ai-total');
    const aiCurrentElement = document.getElementById('ai-current');
    const roundElement = document.getElementById('round-number');
    const messageBox = document.getElementById('message-box');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const playerStatus = document.querySelector('.player-status');
    const aiStatus = document.querySelector('.ai-status');
    const playerCurrentScore = document.querySelector('.player-section .current-score');
    const aiCurrentScore = document.querySelector('.ai-section .current-score');
    const particlesContainer = document.getElementById('particles');
    
    // Audio elements
    const diceSound = document.getElementById('diceSound');
    const winSound = document.getElementById('winSound');
    const loseSound = document.getElementById('loseSound');

    // Initialize particles
    function initParticles() {
        // Create 50 particles for background
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = `${Math.random() * 5 + 2}px`;
            particle.style.height = particle.style.width;
            particle.style.backgroundColor = `hsl(${Math.random() * 60 + 180}, 100%, 70%)`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            
            // Animation
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * -20;
            particle.style.animation = `float ${duration}s ${delay}s infinite linear`;
            
            particlesContainer.appendChild(particle);
        }
    }

    // Add CSS for particles
    const style = document.createElement('style');
    style.textContent = `
        .particle {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
        }
        
        @keyframes float {
            0% {
                transform: translateY(0) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 0.5;
            }
            90% {
                opacity: 0.5;
            }
            100% {
                transform: translateY(-100vh) translateX(20px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initialize game
    function initGame() {
        // Setup event listeners
        rollBtn.addEventListener('click', handleRoll);
        holdBtn.addEventListener('click', handleHold);
        newGameBtn.addEventListener('click', resetGame);
        
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
        });
        
        // Initialize particles
        initParticles();
        
        // Reset game state
        resetGame();
        
        // Start first turn
        updateUI();
        showMessage("Select difficulty and click ROLL to start!");
    }

    // Set game difficulty
    function setDifficulty(difficulty) {
        gameState.difficulty = difficulty;
        
        // Update active button
        difficultyButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
        
        showMessage(`Difficulty set to ${difficulty.toUpperCase()}. Ready to play!`);
    }

    // Reset game state
    function resetGame() {
        gameState.playerTotal = 0;
        gameState.playerCurrent = 0;
        gameState.aiTotal = 0;
        gameState.aiCurrent = 0;
        gameState.round = 1;
        gameState.isPlayerTurn = true;
        gameState.gameOver = false;
        
        // Reset UI
        updateUI();
        resetDice();
        enableButtons();
        
        // Update active player
        updateActivePlayer();
        
        showMessage("New game started! Your turn to roll.");
    }

    // Roll dice handler
    function handleRoll() {
        if (!gameState.isPlayerTurn || gameState.gameOver) return;
        
        disableButtons();
        rollDice();
    }

    // Hold handler
    function handleHold() {
        if (!gameState.isPlayerTurn || gameState.gameOver) return;
        
        // Add current to total
        gameState.playerTotal += gameState.playerCurrent;
        gameState.playerCurrent = 0;
        
        // Check for win
        if (gameState.playerTotal >= gameState.targetScore) {
            playerWins();
            return;
        }
        
        // Switch to AI turn
        gameState.isPlayerTurn = false;
        updateUI();
        updateActivePlayer();
        showMessage("You held. AI's turn now...");
        
        // AI takes turn after delay
        setTimeout(aiTurn, 1000);
    }

    // AI turn logic
    function aiTurn() {
        if (gameState.gameOver) return;
        
        const personality = aiPersonalities[gameState.difficulty];
        let aiDecision;
        
        // Simple AI logic - can be enhanced
        if (gameState.aiCurrent < personality.riskThreshold) {
            aiDecision = 'roll';
        } else {
            aiDecision = Math.random() > personality.bluffChance ? 'hold' : 'roll';
        }
        
        // Show AI thinking
        showMessage(`<span class="ai-thinking">AI is thinking...</span>`, personality.delay / 2);
        
        // Execute AI decision after delay
        setTimeout(() => {
            if (aiDecision === 'roll') {
                const aiMessage = personality.messages.roll[
                    Math.floor(Math.random() * personality.messages.roll.length)
                ];
                showMessage(`AI: "${aiMessage}"`);
                
                rollDice(true);
            } else {
                // AI holds
                gameState.aiTotal += gameState.aiCurrent;
                gameState.aiCurrent = 0;
                
                const aiMessage = personality.messages.hold[
                    Math.floor(Math.random() * personality.messages.hold.length)
                ];
                showMessage(`AI: "${aiMessage}"`);
                
                // Check for AI win
                if (gameState.aiTotal >= gameState.targetScore) {
                    aiWins();
                    return;
                }
                
                // Switch back to player
                gameState.isPlayerTurn = true;
                gameState.round++;
                updateUI();
                updateActivePlayer();
                showMessage("AI held. Your turn to roll!");
                enableButtons();
            }
        }, personality.delay);
    }

    // Roll the dice
    function rollDice(isAiTurn = false) {
        // Play dice sound
        diceSound.currentTime = 0;
        diceSound.play();
        
        // Disable buttons during roll
        disableButtons();
        
        // Show rolling animation
        diceElement.classList.add('rolling');
        
        // Generate random number after animation
        setTimeout(() => {
            const rollValue = Math.floor(Math.random() * 6) + 1;
            showDiceFace(rollValue);
            diceElement.classList.remove('rolling');
            
            // Handle roll result
            if (rollValue === 1) {
                // Rolled a 1 - lose current points
                if (isAiTurn) {
                    gameState.aiCurrent = 0;
                    showMessage("AI rolled a 1 and lost its current points!");
                } else {
                    gameState.playerCurrent = 0;
                    showMessage("You rolled a 1 and lost your current points!");
                }
                
                // Switch turns
                gameState.isPlayerTurn = !gameState.isPlayerTurn;
                
                // If it was player's turn, increment round
                if (!isAiTurn) {
                    gameState.round++;
                }
                
                updateUI();
                updateActivePlayer();
                
                // If it's now AI's turn, let them go
                if (!gameState.isPlayerTurn && !gameState.gameOver) {
                    setTimeout(aiTurn, 1000);
                } else if (!gameState.gameOver) {
                    showMessage("Your turn again!");
                    enableButtons();
                }
            } else {
                // Add to current score
                if (isAiTurn) {
                    gameState.aiCurrent += rollValue;
                    
                    // Check if AI should roll again
                    if (shouldAiRollAgain()) {
                        setTimeout(aiTurn, 1000);
                    } else {
                        // AI decides to hold
                        setTimeout(() => {
                            gameState.aiTotal += gameState.aiCurrent;
                            gameState.aiCurrent = 0;
                            
                            // Check for AI win
                            if (gameState.aiTotal >= gameState.targetScore) {
                                aiWins();
                                return;
                            }
                            
                            // Switch back to player
                            gameState.isPlayerTurn = true;
                            gameState.round++;
                            updateUI();
                            updateActivePlayer();
                            showMessage("AI held. Your turn to roll!");
                            enableButtons();
                        }, 1000);
                    }
                } else {
                    gameState.playerCurrent += rollValue;
                    enableButtons();
                    showMessage(`You rolled a ${rollValue}! Roll or Hold?`);
                }
                
                updateUI();
            }
        }, 1000);
    }

    // Determine if AI should roll again
    function shouldAiRollAgain() {
        const personality = aiPersonalities[gameState.difficulty];
        const riskFactor = gameState.aiCurrent / personality.riskThreshold;
        const randomFactor = Math.random();
        
        // More likely to hold as current score approaches risk threshold
        return randomFactor > (riskFactor * (1 - personality.bluffChance));
    }

    // Show specific dice face
    function showDiceFace(face) {
        // Reset all faces
        document.querySelectorAll('.dice-face').forEach(face => {
            face.style.display = 'none';
        });
        
        // Show the selected face
        document.querySelector(`.dice-face[data-face="${face}"]`).style.display = 'flex';
    }

    // Reset dice to initial state
    function resetDice() {
        showDiceFace(1);
    }

    // Player wins
    function playerWins() {
        gameState.gameOver = true;
        updateUI();
        
        // Play win sound
        winSound.play();
        
        // Show celebration
        showConfetti('player');
        showMessage("Congratulations! You won!", 0, true);
        
        // Disable buttons
        disableButtons();
    }

    // AI wins
    function aiWins() {
        gameState.gameOver = true;
        updateUI();
        
        // Play lose sound
        loseSound.play();
        
        // Get AI message
        const personality = aiPersonalities[gameState.difficulty];
        const aiMessage = personality.messages.lose[
            Math.floor(Math.random() * personality.messages.lose.length)
        ];
        
        // Show celebration
        showConfetti('ai');
        showMessage(`AI wins! "${aiMessage}"`, 0, true);
        
        // Disable buttons
        disableButtons();
    }

    // Show confetti animation
    function showConfetti(winner) {
        const colors = winner === 'player' ? 
            ['#00f0ff', '#00d8ff', '#0095ff'] : 
            ['#ff8e00', '#ff5500', '#ff2d00'];
        
        // Create 50 confetti particles
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.bottom = '0';
            confetti.style.position = 'absolute';
            confetti.style.borderRadius = '2px';
            confetti.style.zIndex = '10';
            confetti.style.opacity = '0.8';
            
            // Random animation
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 1;
            const rotation = Math.random() * 720;
            const xMovement = (Math.random() - 0.5) * 200;
            
            confetti.style.animation = `
                confetti ${duration}s ${delay}s forwards ease-out
            `;
            
            document.body.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                confetti.remove();
            }, (duration + delay) * 1000);
        }
    }

    // Add CSS for confetti
    const confettiStyle = document.createElement('style');
    confettiStyle.textContent = `
        @keyframes confetti {
            0% {
                transform: translateY(0) translateX(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 200}px) rotate(${Math.random() * 360}deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(confettiStyle);

    // Update UI with current game state
    function updateUI() {
        playerTotalElement.textContent = gameState.playerTotal;
        playerCurrentElement.textContent = gameState.playerCurrent;
        aiTotalElement.textContent = gameState.aiTotal;
        aiCurrentElement.textContent = gameState.aiCurrent;
        roundElement.textContent = gameState.round;
        
        // Update current score indicators
        if (gameState.playerCurrent > 0) {
            playerCurrentScore.classList.add('active');
        } else {
            playerCurrentScore.classList.remove('active');
        }
        
        if (gameState.aiCurrent > 0) {
            aiCurrentScore.classList.add('active');
        } else {
            aiCurrentScore.classList.remove('active');
        }
    }

    // Update active player indicator
    function updateActivePlayer() {
        if (gameState.isPlayerTurn) {
            playerStatus.classList.add('active');
            aiStatus.classList.remove('active');
        } else {
            playerStatus.classList.remove('active');
            aiStatus.classList.add('active');
        }
    }

    // Show message in message box
    function showMessage(message, duration = 0, isPersistent = false) {
        messageBox.innerHTML = `<p>${message}</p>`;
        
        if (isPersistent) return;
        
        if (duration > 0) {
            setTimeout(() => {
                if (!gameState.gameOver) {
                    messageBox.innerHTML = '<p>Make your move!</p>';
                }
            }, duration);
        }
    }

    // Disable action buttons
    function disableButtons() {
        rollBtn.disabled = true;
        holdBtn.disabled = true;
    }

    // Enable action buttons
    function enableButtons() {
        if (gameState.isPlayerTurn && !gameState.gameOver) {
            rollBtn.disabled = false;
            holdBtn.disabled = false;
        }
    }

    // Initialize the game
    initGame();
});