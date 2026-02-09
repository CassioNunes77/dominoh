// Estado do jogo
let players = [];
let currentPlayerIndex = 0;
let scores = {};
let round = 1;

// Elementos DOM
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const startGameBtn = document.getElementById('start-game');
const backBtn = document.getElementById('back-btn');
const resetBtn = document.getElementById('reset-btn');
const playersGrid = document.getElementById('players-grid');
const currentPlayerName = document.getElementById('current-player-name');
const scoreButtons = document.querySelectorAll('.score-btn');
const customPointsInput = document.getElementById('custom-points');
const addCustomBtn = document.getElementById('add-custom');
const nextRoundBtn = document.getElementById('next-round');

// Cores para os jogadores - paleta roxo escuro
const playerColors = ['green', 'blue', 'teal', 'green'];

// Sistema de Modal Customizado
function showModal(title, message, type = 'alert') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalFooter.innerHTML = '';
        
        if (type === 'alert') {
            const okBtn = document.createElement('button');
            okBtn.className = 'modal-btn modal-btn-primary';
            okBtn.textContent = 'OK';
            okBtn.onclick = () => {
                hideModal();
                resolve(true);
            };
            modalFooter.appendChild(okBtn);
        } else if (type === 'confirm') {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'modal-btn modal-btn-secondary';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.onclick = () => {
                hideModal();
                resolve(false);
            };
            
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'modal-btn modal-btn-primary';
            confirmBtn.textContent = 'Confirmar';
            confirmBtn.onclick = () => {
                hideModal();
                resolve(true);
            };
            
            modalFooter.appendChild(cancelBtn);
            modalFooter.appendChild(confirmBtn);
        }
        
        modal.classList.add('show');
        
        // Fechar ao clicar no overlay
        const overlay = modal.querySelector('.modal-overlay');
        overlay.onclick = () => {
            if (type === 'alert') {
                hideModal();
                resolve(true);
            } else {
                hideModal();
                resolve(false);
            }
        };
    });
}

function hideModal() {
    const modal = document.getElementById('custom-modal');
    modal.classList.remove('show');
}

// Funções auxiliares para compatibilidade
async function customAlert(message) {
    await showModal('Atenção', message, 'alert');
}

async function customConfirm(message) {
    return await showModal('Confirmação', message, 'confirm');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadFromStorage();
});

function setupEventListeners() {
    startGameBtn.addEventListener('click', startGame);
    backBtn.addEventListener('click', goBack);
    resetBtn.addEventListener('click', resetGame);
    
    scoreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const points = parseInt(btn.dataset.points);
            addPoints(points);
        });
    });
    
    addCustomBtn.addEventListener('click', () => {
        const points = parseInt(customPointsInput.value);
        if (points > 0) {
            addPoints(points);
            customPointsInput.value = '';
        }
    });
    
    customPointsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCustomBtn.click();
        }
    });
    
    nextRoundBtn.addEventListener('click', nextRound);
    
    // Permitir adicionar pontos clicando no card do jogador
    playersGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.player-card');
        if (card) {
            const playerName = card.dataset.player;
            const index = players.indexOf(playerName);
            if (index !== -1) {
                setCurrentPlayer(index);
            }
        }
    });
}

async function startGame() {
    // Coletar nomes dos jogadores
    players = [];
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`player${i}`);
        const name = input.value.trim();
        if (name) {
            players.push(name);
        }
    }
    
    // Validar pelo menos 2 jogadores
    if (players.length < 2) {
        await customAlert('Por favor, adicione pelo menos 2 jogadores!');
        return;
    }
    
    // Inicializar pontuações
    scores = {};
    players.forEach(player => {
        scores[player] = 0;
    });
    
    currentPlayerIndex = 0;
    round = 1;
    
    // Salvar no localStorage
    saveToStorage();
    
    // Trocar tela
    switchScreen('game');
    renderGame();
}

function switchScreen(screen) {
    if (screen === 'setup') {
        setupScreen.classList.add('active');
        gameScreen.classList.remove('active');
    } else {
        setupScreen.classList.remove('active');
        gameScreen.classList.add('active');
    }
}

function renderGame() {
    // Atualizar título da rodada
    document.querySelector('.game-title').textContent = `🎲 Rodada ${round}`;
    
    // Limpar grid
    playersGrid.innerHTML = '';
    
    // Criar cards dos jogadores
    players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.dataset.player = player;
        card.dataset.color = playerColors[index % playerColors.length];
        
        if (index === currentPlayerIndex) {
            card.classList.add('active');
        }
        
        card.innerHTML = `
            <div class="player-name">${player}</div>
            <div class="player-score" id="score-${player}">${scores[player]}</div>
        `;
        
        playersGrid.appendChild(card);
    });
    
    // Atualizar nome do jogador atual
    updateCurrentPlayerDisplay();
}

function updateCurrentPlayerDisplay() {
    if (players.length > 0) {
        currentPlayerName.textContent = players[currentPlayerIndex];
    }
}

function setCurrentPlayer(index) {
    currentPlayerIndex = index;
    
    // Atualizar cards
    document.querySelectorAll('.player-card').forEach((card, i) => {
        if (i === index) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    updateCurrentPlayerDisplay();
    
    // Animação de transição
    const activeCard = document.querySelector('.player-card.active');
    if (activeCard) {
        activeCard.style.animation = 'none';
        setTimeout(() => {
            activeCard.style.animation = 'pulse 2s ease-in-out infinite';
        }, 10);
    }
}

function addPoints(points) {
    if (players.length === 0) return;
    
    const currentPlayer = players[currentPlayerIndex];
    scores[currentPlayer] += points;
    
    // Atualizar display
    const scoreElement = document.getElementById(`score-${currentPlayer}`);
    if (scoreElement) {
        scoreElement.textContent = scores[currentPlayer];
        scoreElement.classList.add('score-increase');
        
        setTimeout(() => {
            scoreElement.classList.remove('score-increase');
        }, 500);
    }
    
    // Animação de feedback
    const card = document.querySelector(`.player-card[data-player="${currentPlayer}"]`);
    if (card) {
        card.style.transform = 'scale(1.1)';
        setTimeout(() => {
            card.style.transform = '';
        }, 200);
    }
    
    // Salvar estado
    saveToStorage();
    
    // Avançar para próximo jogador automaticamente
    setTimeout(() => {
        nextPlayer();
    }, 300);
}

function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayer(currentPlayerIndex);
}

function nextRound() {
    round++;
    document.querySelector('.game-title').textContent = `🎲 Rodada ${round}`;
    
    // Animação de transição
    playersGrid.style.animation = 'none';
    setTimeout(() => {
        playersGrid.style.animation = 'slideUp 0.4s ease-out';
    }, 10);
    
    // Verificar vencedor
    checkWinner();
}

function checkWinner() {
    // Encontrar maior pontuação
    let maxScore = -1;
    let winners = [];
    
    players.forEach(player => {
        if (scores[player] > maxScore) {
            maxScore = scores[player];
            winners = [player];
        } else if (scores[player] === maxScore) {
            winners.push(player);
        }
    });
    
    // Destacar vencedor(es)
    document.querySelectorAll('.player-card').forEach(card => {
        card.classList.remove('winner');
        if (winners.includes(card.dataset.player)) {
            card.classList.add('winner');
        }
    });
}

async function resetGame() {
    const confirmed = await customConfirm('Tem certeza que deseja reiniciar o jogo? Todas as pontuações serão zeradas.');
    if (confirmed) {
        players.forEach(player => {
            scores[player] = 0;
        });
        round = 1;
        currentPlayerIndex = 0;
        
        document.querySelector('.game-title').textContent = '🎲 Rodada 1';
        renderGame();
        saveToStorage();
    }
}

async function goBack() {
    const confirmed = await customConfirm('Voltar para a tela inicial? O progresso será salvo.');
    if (confirmed) {
        switchScreen('setup');
        saveToStorage();
    }
}

// Persistência
function saveToStorage() {
    const gameState = {
        players,
        scores,
        currentPlayerIndex,
        round
    };
    localStorage.setItem('dominoGame', JSON.stringify(gameState));
}

function loadFromStorage() {
    const saved = localStorage.getItem('dominoGame');
    if (saved) {
        try {
            const gameState = JSON.parse(saved);
            players = gameState.players || [];
            scores = gameState.scores || {};
            currentPlayerIndex = gameState.currentPlayerIndex || 0;
            round = gameState.round || 1;
            
            // Preencher inputs se houver jogadores salvos
            if (players.length > 0) {
                players.forEach((player, index) => {
                    const input = document.getElementById(`player${index + 1}`);
                    if (input) {
                        input.value = player;
                    }
                });
                
                // Se houver jogo em andamento, perguntar se quer continuar
                if (Object.keys(scores).length > 0) {
                    setTimeout(async () => {
                        const confirmed = await customConfirm('Encontramos um jogo em andamento. Deseja continuar?');
                        if (confirmed) {
                            switchScreen('game');
                            renderGame();
                        }
                    }, 500);
                }
            }
        } catch (e) {
            console.error('Erro ao carregar jogo salvo:', e);
        }
    }
}
