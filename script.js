// Estado do jogo
let players = [];
let currentPlayerIndex = 0;
let scores = {};
let round = 1;

// Elementos DOM (serão inicializados após DOM carregar)
let modeScreen;
let setupScreen;
let gameScreen;
let statsScreen;
let modeIndividualBtn;
let modeDuplasBtn;
let backToModeBtn;
let startGameBtn;
let backBtn;
let resetBtn;
let playersGrid;
let currentPlayerName;
let scoreButtons;
let customPointsInput;
let addCustomBtn;
let nextRoundBtn;
let finishGameBtn;

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
    // Inicializar elementos DOM
    modeScreen = document.getElementById('mode-screen');
    setupScreen = document.getElementById('setup-screen');
    gameScreen = document.getElementById('game-screen');
    statsScreen = document.getElementById('stats-screen');
    modeIndividualBtn = document.getElementById('mode-individual');
    modeDuplasBtn = document.getElementById('mode-duplas');
    backToModeBtn = document.getElementById('back-to-mode');
    startGameBtn = document.getElementById('start-game');
    backBtn = document.getElementById('back-btn');
    resetBtn = document.getElementById('reset-btn');
    playersGrid = document.getElementById('players-grid');
    currentPlayerName = document.getElementById('current-player-name');
    scoreButtons = document.querySelectorAll('.score-btn');
    customPointsInput = document.getElementById('custom-points');
    addCustomBtn = document.getElementById('add-custom');
    nextRoundBtn = document.getElementById('next-round');
    finishGameBtn = document.getElementById('finish-game');
    
    // Garantir que os elementos existem
    if (!modeScreen || !setupScreen || !gameScreen) {
        console.error('Elementos de tela não encontrados');
        return;
    }
    
    setupEventListeners();
    loadFromStorage();
    preventDoubleTapZoom();
});

// Prevenir zoom por double-tap em dispositivos móveis
function preventDoubleTapZoom() {
    let lastTouchEnd = 0;
    
    document.addEventListener('touchend', (event) => {
        // Não prevenir se for um botão ou elemento clicável
        if (event.target.closest('button') || event.target.closest('a') || event.target.closest('input')) {
            return;
        }
        
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
    
    // Prevenir double-click zoom (mas não em botões)
    document.addEventListener('dblclick', (event) => {
        if (!event.target.closest('button')) {
            event.preventDefault();
        }
    });
    
    // Prevenir gestos de pinch zoom
    document.addEventListener('gesturestart', (event) => {
        event.preventDefault();
    });
    
    document.addEventListener('gesturechange', (event) => {
        event.preventDefault();
    });
    
    document.addEventListener('gestureend', (event) => {
        event.preventDefault();
    });
}

function setupEventListeners() {
    // Botão Individual - SIMPLES E DIRETO
    document.getElementById('mode-individual').onclick = function() {
        document.getElementById('mode-screen').classList.remove('active');
        document.getElementById('setup-screen').classList.add('active');
    };
    
    // Botão Voltar
    if (backToModeBtn) {
        backToModeBtn.onclick = function() {
            document.getElementById('setup-screen').classList.remove('active');
            document.getElementById('mode-screen').classList.add('active');
        };
    }
    startGameBtn.addEventListener('click', startGame);
    backBtn.addEventListener('click', goBack);
    resetBtn.addEventListener('click', resetGame);
    
    scoreButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Ignorar botão do dado (não deve adicionar pontos)
            if (btn.classList.contains('score-btn-dice')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const points = parseInt(btn.dataset.points);
            if (points) {
                addPoints(points);
            }
        });
    });
    
    addCustomBtn.addEventListener('click', () => {
        const pointsValue = customPointsInput.value.trim();
        const points = parseInt(pointsValue, 10);
        if (!isNaN(points) && points >= 0) {
            setCustomPoints(points);
            customPointsInput.value = '';
        }
    });
    
    customPointsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const pointsValue = customPointsInput.value.trim();
            const points = parseInt(pointsValue, 10);
            if (!isNaN(points) && points >= 0) {
                setCustomPoints(points);
                customPointsInput.value = '';
            }
        }
    });
    
    nextRoundBtn.addEventListener('click', nextRound);
    
    if (finishGameBtn) {
        finishGameBtn.addEventListener('click', async () => {
            const confirmed = await customConfirm('Deseja encerrar a partida?');
            if (confirmed) {
                showStats();
            }
        });
    }
    
    // Botões da tela de estatísticas
    const shareStatsBtn = document.getElementById('share-stats');
    const newGameBtn = document.getElementById('new-game');
    
    if (shareStatsBtn) {
        shareStatsBtn.addEventListener('click', shareStats);
    }
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            document.getElementById('stats-screen').classList.remove('active');
            document.getElementById('mode-screen').classList.add('active');
            // Limpar dados do jogo
            players = [];
            scores = {};
            round = 1;
            currentPlayerIndex = 0;
            localStorage.removeItem('dominoGame');
        });
    }
    
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

// Tornar função globalmente acessível
window.startGameWithPlayers = function(playersList) {
    // Definir jogadores globalmente
    players = playersList;
    
    console.log('Jogadores recebidos:', players);
    
    // Inicializar pontuações
    scores = {};
    players.forEach(player => {
        scores[player] = 0;
    });
    
    currentPlayerIndex = 0;
    round = 1;
    
    // Garantir que playersGrid existe
    if (!playersGrid) {
        playersGrid = document.getElementById('players-grid');
    }
    
    // Salvar no localStorage
    saveToStorage();
    
    // Pequeno delay para garantir que a tela foi trocada
    setTimeout(() => {
        renderGame();
    }, 100);
};

function startGame() {
    // Coletar nomes dos jogadores
    players = [];
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`player${i}`);
        if (input) {
            const name = input.value.trim();
            if (name) {
                players.push(name);
            }
        }
    }
    
    // Validar pelo menos 2 jogadores
    if (players.length < 2) {
        customAlert('Por favor, adicione pelo menos 2 jogadores!');
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
    
    // Renderizar o jogo
    renderGame();
}

function switchScreen(screen) {
    if (!modeScreen || !setupScreen || !gameScreen) {
        return;
    }
    
    // Remover active de todas as telas
    modeScreen.classList.remove('active');
    setupScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    if (statsScreen) {
        statsScreen.classList.remove('active');
    }
    
    // Adicionar active na tela selecionada
    if (screen === 'mode') {
        modeScreen.classList.add('active');
    } else if (screen === 'setup') {
        setupScreen.classList.add('active');
    } else if (screen === 'game') {
        gameScreen.classList.add('active');
    } else if (screen === 'stats') {
        if (statsScreen) {
            statsScreen.classList.add('active');
        }
    }
}

function showStats() {
    // Trocar para tela de estatísticas
    gameScreen.classList.remove('active');
    if (!statsScreen) {
        statsScreen = document.getElementById('stats-screen');
    }
    if (statsScreen) {
        statsScreen.classList.add('active');
    }
    
    // Atualizar estatísticas
    const statsRounds = document.getElementById('stats-rounds');
    if (statsRounds) {
        statsRounds.textContent = round;
    }
    
    // Ordenar jogadores por pontuação
    const sortedPlayers = players.map(player => ({
        name: player,
        score: scores[player] || 0
    })).sort((a, b) => b.score - a.score);
    
    // Renderizar lista de jogadores
    const statsPlayersList = document.getElementById('stats-players-list');
    if (statsPlayersList) {
        statsPlayersList.innerHTML = '';
        
        // Determinar posições e medalhas considerando empates
        let currentRank = 1;
        let previousScore = null;
        
        sortedPlayers.forEach((player, index) => {
            // Se a pontuação mudou, atualizar o rank
            if (previousScore !== null && player.score !== previousScore) {
                currentRank = index + 1;
            }
            previousScore = player.score;
            
            // Determinar medalha baseado na posição e empates
            let medal = '';
            if (currentRank === 1) {
                medal = '🥇';
            } else if (currentRank === 2 && sortedPlayers[0].score !== player.score) {
                medal = '🥈';
            } else if (currentRank === 3 && sortedPlayers[0].score !== player.score && sortedPlayers[1].score !== player.score) {
                medal = '🥉';
            }
            
            const playerCard = document.createElement('div');
            playerCard.className = 'stats-player-card';
            
            // Adicionar classe winner se for primeiro lugar (mesmo com empate)
            if (player.score === sortedPlayers[0].score) {
                playerCard.classList.add('winner');
            }
            
            playerCard.innerHTML = `
                <div class="stats-player-rank">${currentRank}º</div>
                <div class="stats-player-info">
                    <div class="stats-player-name">${medal} ${player.name}</div>
                    <div class="stats-player-score">${player.score} pontos</div>
                </div>
            `;
            
            statsPlayersList.appendChild(playerCard);
        });
    }
}

function shareStats() {
    // Criar texto para compartilhar
    const sortedPlayers = players.map(player => ({
        name: player,
        score: scores[player] || 0
    })).sort((a, b) => b.score - a.score);
    
    let shareText = `🎲 Partida de Dominó Finalizada!\n\n`;
    shareText += `Rodadas: ${round}\n\n`;
    shareText += `Classificação:\n`;
    
    sortedPlayers.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        shareText += `${index + 1}º ${medal} ${player.name} - ${player.score} pontos\n`;
    });
    
    shareText += `\n🎮 Jogue também: http://dominoh.netlify.app`;
    
    // Tentar usar Web Share API se disponível
    if (navigator.share) {
        navigator.share({
            title: 'Resultados da Partida de Dominó',
            text: shareText,
            url: 'http://dominoh.netlify.app'
        }).catch(err => {
            console.log('Erro ao compartilhar:', err);
            copyToClipboard(shareText);
        });
    } else {
        // Fallback: copiar para clipboard
        copyToClipboard(shareText);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            // Texto copiado silenciosamente
        }).catch(() => {
            // Falha ao copiar - não exibir mensagem
        });
    } else {
        // Clipboard não disponível - não exibir mensagem
    }
}

function renderGame() {
    // Garantir que playersGrid existe
    if (!playersGrid) {
        playersGrid = document.getElementById('players-grid');
    }
    
    if (!playersGrid) {
        console.error('players-grid não encontrado');
        return;
    }
    
    // Verificar se há jogadores
    if (!players || players.length === 0) {
        console.error('Nenhum jogador encontrado');
        return;
    }
    
    // Atualizar título da rodada
    const gameTitle = document.querySelector('.game-title');
    if (gameTitle) {
        gameTitle.textContent = `🎲 Rodada ${round}`;
    }
    
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

// Tornar função globalmente acessível
window.addPoints = function(points) {
    if (players.length === 0) return;
    
    // Garantir que points é um número
    points = parseInt(points, 10);
    if (isNaN(points) || points <= 0) return;
    
    const currentPlayer = players[currentPlayerIndex];
    
    // Garantir que o score existe e inicializar se necessário
    if (typeof scores[currentPlayer] === 'undefined' || scores[currentPlayer] === null) {
        scores[currentPlayer] = 0;
    }
    
    // Converter para número e somar pontos
    const currentScore = parseInt(scores[currentPlayer], 10) || 0;
    scores[currentPlayer] = currentScore + points;
    
    // Atualizar display
    const scoreElement = document.getElementById(`score-${currentPlayer}`);
    if (scoreElement) {
        scoreElement.textContent = scores[currentPlayer];
        scoreElement.classList.add('score-increase');
        
        setTimeout(() => {
            scoreElement.classList.remove('score-increase');
        }, 500);
    }
    
    // Animação de feedback apenas se for o jogador ativo
    const card = document.querySelector(`.player-card[data-player="${currentPlayer}"]`);
    if (card && card.classList.contains('active')) {
        // A animação pulse já está ativa, não precisa de animação adicional
    }
    
    // Salvar estado
    saveToStorage();
};

// Função para definir pontos customizados (substitui o valor)
function setCustomPoints(points) {
    if (players.length === 0) return;
    
    // Garantir que points é um número
    points = parseInt(points, 10);
    if (isNaN(points) || points < 0) return;
    
    const currentPlayer = players[currentPlayerIndex];
    
    // Substituir o valor ao invés de somar
    scores[currentPlayer] = points;
    
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
    if (card && card.classList.contains('active')) {
        card.style.transform = 'scale(1.05)';
        setTimeout(() => {
            card.style.transform = '';
        }, 200);
    }
    
    // Salvar estado
    saveToStorage();
}

function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayer(currentPlayerIndex);
}

function nextRound() {
    round++;
    currentPlayerIndex = 0; // Resetar para o primeiro jogador
    document.querySelector('.game-title').textContent = `🎲 Rodada ${round}`;
    
    // Atualizar display do jogador atual
    setCurrentPlayer(0);
    
    // Animação de transição
    playersGrid.style.animation = 'none';
    setTimeout(() => {
        playersGrid.style.animation = 'slideUp 0.4s ease-out';
    }, 10);
    
    // Verificar vencedor
    checkWinner();
    
    // Salvar estado
    saveToStorage();
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
        switchScreen('mode');
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
