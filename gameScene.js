// Phaser游戏配置
var phaserConfig;

// 游戏变量声明
var game;
var cardManager;
var slotSystem;
var gameState;
var score = 0;
var level = 1;
var propCounts;

// 初始化Phaser配置
function initPhaserConfig() {
    phaserConfig = {
        type: Phaser.AUTO,
        width: GAME_CONFIG.width,
        height: GAME_CONFIG.height,
        parent: 'game-canvas',
        backgroundColor: GAME_CONFIG.colors.background,
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            min: {
                width: 320,
                height: 480
            },
            max: {
                width: 1200,
                height: 960
            }
        },
        physics: {
            default: 'arcade',
            arcade: {
                enableBody: true,
                debug: false
            }
        },
        input: {
            activePointers: 3, // 支持多点触控
            touch: true,
            mouse: true,
            keyboard: true
        },
        render: {
            antialias: true,
            pixelArt: false,
            roundPixels: false
        }
    };
}

// Phaser场景函数
function preload() {
    // 这里可以预加载音效、图片等资源
    // 由于使用emoji作为卡牌图标，暂时不需要预加载图片
    
    // 如果需要音效，可以在这里加载
    // this.load.audio('cardClick', 'assets/sounds/card_click.mp3');
    // this.load.audio('match', 'assets/sounds/match.mp3');
    // this.load.audio('gameOver', 'assets/sounds/game_over.mp3');
    
    console.log('游戏资源预加载完成');
}

function create() {
    // 初始化游戏对象
    initializeGame.call(this);
    
    // 移动端优化
    setupMobileOptimizations.call(this);
    
    // 创建游戏UI元素
    createGameUI.call(this);
    
    // 设置事件监听
    setupEventListeners.call(this);
    
    // 开始游戏
    startGame.call(this);
    
    console.log('游戏创建完成');
}

function update() {
    // 游戏主循环
    if (gameState === GAME_STATE.PLAYING) {
        // 检查游戏状态
        checkGameConditions.call(this);
        
        // 更新卡牌深度显示
        if (cardManager) {
            cardManager.updateAllCardsDepth();
        }
    }
}

// 游戏初始化
function initializeGame() {
    // 保存场景引用到全局变量
    window.gameScene = this;
    
    // 初始化游戏状态变量
    gameState = GAME_STATE.PLAYING;
    score = 0;
    level = 1;
    propCounts = { ...GAME_CONFIG.propCounts };
    
    // 创建卡牌管理器
    cardManager = new CardManager(this);
    this.cardManager = cardManager;
    
    // 创建卡槽系统
    slotSystem = new SlotSystem(this);
    this.slotSystem = slotSystem;
}

// 移动端优化设置
function setupMobileOptimizations() {
    if (GameUtils.isMobile()) {
        // 调整卡牌大小适应移动端
        GAME_CONFIG.cardWidth = Math.min(GAME_CONFIG.cardWidth, 50);
        GAME_CONFIG.cardHeight = Math.min(GAME_CONFIG.cardHeight, 50);
        
        // 调整动画速度（移动端使用更快的动画）
        GAME_CONFIG.cardMoveSpeed = Math.max(200, GAME_CONFIG.cardMoveSpeed - 100);
        
        // 禁用右键菜单和双击缩放
        this.input.mouse.disableContextMenu();
        
        // 设置触摸输入
        this.input.addPointer(2); // 支持多点触控
        
        // 优化渲染性能
        this.renderer.antialias = false;
        
        console.log('移动端优化已启用');
    }
    
    // 响应式调整游戏尺寸
    this.scale.on('resize', (gameSize) => {
        const { width, height } = gameSize;
        
        // 根据屏幕尺寸调整游戏元素
        if (width < 768) {
            // 小屏幕优化
            this.isMobileLayout = true;
        } else {
            this.isMobileLayout = false;
        }
        
        console.log(`游戏尺寸调整: ${width}x${height}`);
    });
}

function createGameUI() {
    // 创建背景
    this.add.rectangle(
        GAME_CONFIG.width / 2, 
        GAME_CONFIG.height / 2, 
        GAME_CONFIG.width, 
        GAME_CONFIG.height, 
        GAME_CONFIG.colors.background
    ).setDepth(-10);
    
    // 创建游戏提示文字
    this.hintText = this.add.text(GAME_CONFIG.width / 2, 35, '点击卡牌，三个相同即可消除', {
        fontSize: '24px',
        fill: '#ffffff',
        align: 'center'
    });
    this.hintText.setOrigin(0.5, 0.5);
    this.hintText.setDepth(100);
}

function setupEventListeners() {
    // 卡牌点击事件
    this.events.on('cardClicked', (card) => {
        handleCardClick.call(this, card);
    });
    
    // 卡牌匹配事件
    this.events.on('cardsMatched', (matchInfo) => {
        handleCardsMatched.call(this, matchInfo);
    });
    
    // 游戏结束事件
    this.events.on('gameOver', (reason) => {
        handleGameOver.call(this, reason);
    });
    
    // 设置道具按钮事件监听
    setupPropButtons.call(this);
}

function setupPropButtons() {
    // 洗牌按钮
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            useProp.call(this, PROP_TYPE.SHUFFLE);
        });
    }
    
    // 移除按钮
    const removeBtn = document.getElementById('remove-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            useProp.call(this, PROP_TYPE.REMOVE);
        });
    }
    
    // 撤销按钮
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            useProp.call(this, PROP_TYPE.UNDO);
        });
    }
    
    // 重新开始按钮
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            restartGame.call(this);
        });
    }
}

function startGame() {
    // 创建卡牌
    cardManager.createCards();
    
    // 更新UI显示
    updateUI();
    
    console.log(`开始游戏 - 关卡 ${level}`);
}

function handleCardClick(card) {
    if (gameState !== GAME_STATE.PLAYING) {
        return;
    }
    
    // 检查卡牌是否可以点击
    if (!card.canBeClicked()) {
        // 显示提示信息
        showHint.call(this, '此卡牌被遮挡，无法选择');
        return;
    }
    
    // 将卡牌添加到卡槽
    const success = slotSystem.addCard(card);
    
    if (success) {
        // 播放音效
        playSound.call(this, 'cardClick');
        
        // 更新分数
        score += GAME_CONFIG.scorePerCard;
        updateUI();
    }
}

function handleCardsMatched(matchInfo) {
    // 增加分数
    score += matchInfo.score;
    
    // 播放匹配音效
    playSound.call(this, 'match');
    
    // 显示匹配效果
    showMatchEffect.call(this, matchInfo);
    
    // 更新UI
    updateUI();
    
    console.log(`匹配成功: ${matchInfo.type} x${matchInfo.count}, 得分: ${matchInfo.score}`);
}

function handleGameOver(reason) {
    gameState = GAME_STATE.GAME_OVER;
    
    let message = '游戏结束';
    let isWin = false;
    
    switch (reason) {
        case 'slots_full':
            message = '卡槽已满，游戏失败！';
            break;
        case 'no_moves':
            message = '无可用操作，游戏失败！';
            break;
        case 'victory':
            message = `恭喜完成第 ${level} 关！`;
            isWin = true;
            break;
    }
    
    // 播放游戏结束音效
    playSound.call(this, isWin ? 'victory' : 'gameOver');
    
    // 显示游戏结束界面
    showGameOverScreen(message, isWin);
    
    if (isWin) {
        // 胜利，进入下一关
        this.time.delayedCall(2000, () => { // 等待2秒进入下一关
            level++;
            restartForNextLevel.call(this);
        });
    }
    
    console.log(`游戏结束: ${reason} - ${message}`);
}

function useProp(propType) {
    if (gameState !== GAME_STATE.PLAYING) {
        return;
    }
    
    if (propCounts[propType] <= 0) {
        showHint.call(this, '道具数量不足');
        return;
    }
    
    let success = false;
    
    switch (propType) {
        case PROP_TYPE.SHUFFLE:
            // Pause game logic during shuffle animation
            gameState = GAME_STATE.PAUSED;
            success = true;

            showHint.call(this, '正在洗牌...');

            cardManager.shuffleCards(() => {
                // Restore game state when shuffle is complete
                gameState = GAME_STATE.PLAYING;
                showHint.call(this, '洗牌完成！');
                
                // Re-check conditions after shuffle to ensure game validity
                checkGameConditions.call(this);
            });
            break;
            
        case PROP_TYPE.REMOVE:
            success = slotSystem.removeRandomCard();
            if (success) {
                showHint.call(this, '已移除一张卡牌');
            } else {
                showHint.call(this, '卡槽为空，无法移除');
            }
            break;
            
        case PROP_TYPE.UNDO:
            success = slotSystem.undo();
            if (success) {
                showHint.call(this, '已撤销上一步操作');
            } else {
                showHint.call(this, '无可撤销的操作');
            }
            break;
    }
    
    if (success) {
        propCounts[propType]--;
        updateUI();
        
        // 播放道具使用音效
        playSound.call(this, 'prop');
    }
}

function checkGameConditions() {
    // 检查胜利条件
    if (cardManager.getRemainingCards() === 0) {
        this.events.emit('gameOver', 'victory');
        return;
    }
    
    // 检查失败条件
    if (slotSystem.isFull()) {
        const canMatch = checkForPossibleMatches();
        if (!canMatch) {
            this.events.emit('gameOver', 'slots_full');
            return;
        }
    }
    
    // 增加保护，如果卡牌在移动中，则不判断“无路可走”的失败
    const isCardMoving = cardManager.cards.some(c => c.state === CARD_STATE.MOVING);
    if (isCardMoving) {
        return;
    }

    // 检查是否有可点击的卡牌
    const clickableCards = cardManager.getClickableCards();
    if (clickableCards.length === 0 && cardManager.getRemainingCards() > 0) {
        this.events.emit('gameOver', 'no_moves');
        return;
    }
}

function checkForPossibleMatches() {
    // 检查卡槽中是否有可能的匹配
    const slotInfo = slotSystem.getSlotInfo();
    const cardTypes = {};
    
    slotInfo.cards.forEach(cardType => {
        if (cardType !== null) {
            cardTypes[cardType] = (cardTypes[cardType] || 0) + 1;
        }
    });
    
    // 检查是否有任何类型的卡牌数量达到匹配要求
    for (let count of Object.values(cardTypes)) {
        if (count >= GAME_CONFIG.matchCount) {
            return true;
        }
    }
    
    return false;
}

function updateUI() {
    // 更新DOM元素
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `分数: ${GameUtils.formatScore(score)}`;
    }
    
    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.textContent = `第 ${level} 关`;
    }
    
    // 更新道具按钮
    updatePropButtons();
}

function updatePropButtons() {
    // 更新洗牌按钮
    const shuffleBtn = document.getElementById('shuffle-btn');
    const shuffleCount = shuffleBtn?.querySelector('.count');
    if (shuffleCount) {
        shuffleCount.textContent = propCounts.shuffle;
        shuffleBtn.disabled = propCounts.shuffle <= 0;
    }
    
    // 更新移除按钮
    const removeBtn = document.getElementById('remove-btn');
    const removeCount = removeBtn?.querySelector('.count');
    if (removeCount) {
        removeCount.textContent = propCounts.remove;
        removeBtn.disabled = propCounts.remove <= 0;
    }
    
    // 更新撤销按钮
    const undoBtn = document.getElementById('undo-btn');
    const undoCount = undoBtn?.querySelector('.count');
    if (undoCount) {
        undoCount.textContent = propCounts.undo;
        undoBtn.disabled = propCounts.undo <= 0;
    }
}

function showHint(message) {
    // 显示提示信息
    if (this.hintText) {
        this.hintText.setText(message);
        
        // 重置提示文字
        this.time.delayedCall(2000, () => {
            if (this.hintText) {
                this.hintText.setText('点击卡牌，三个相同即可消除');
            }
        });
    }
    
    console.log('提示:', message);
}

function showMatchEffect(matchInfo) {
    // 显示匹配特效
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;
    
    // 创建分数文字效果
    const scoreText = this.add.text(centerX, centerY - 50, `+${matchInfo.score}`, {
        fontSize: '48px',
        fill: '#FFD700',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    });
    scoreText.setOrigin(0.5, 0.5);
    scoreText.setDepth(1000);
    
    // 分数文字动画
    this.tweens.add({
        targets: scoreText,
        y: centerY - 100,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
            scoreText.destroy();
        }
    });
}

function playSound(soundName) {
    // 播放音效（如果有的话）
    // if (this.sound.get(soundName)) {
    //     this.sound.play(soundName);
    // }
    console.log(`播放音效: ${soundName}`);
}

function showGameOverScreen(message, isWin) {
    // 显示游戏结束屏幕
    const gameOverDiv = document.getElementById('game-over');
    const gameResult = document.getElementById('game-result');
    const finalScore = document.getElementById('final-score');
    
    if (gameOverDiv && gameResult && finalScore) {
        gameResult.textContent = message;
        gameResult.style.color = isWin ? '#4CAF50' : '#F44336';
        finalScore.textContent = `最终分数: ${GameUtils.formatScore(score)}`;
        gameOverDiv.style.display = 'flex';
    }
}

function restartGame() {
    // 重新开始游戏
    
    // 隐藏游戏结束界面
    const gameOverDiv = document.getElementById('game-over');
    if (gameOverDiv) {
        gameOverDiv.style.display = 'none';
    }
    
    // 清理现有游戏对象
    if (cardManager) {
        cardManager.cards.forEach(card => {
            if (card && card.active) {
                card.destroy();
            }
        });
    }
    
    if (slotSystem) {
        slotSystem.clear();
    }
    
    // 重置游戏状态
    gameState = GAME_STATE.PLAYING;
    score = 0;
    level = 1;
    propCounts = { ...GAME_CONFIG.propCounts };
    
    // 重新开始游戏
    startGame.call(this);
    
    console.log('游戏重新开始');
}

function restartForNextLevel() {
    // 隐藏游戏结束界面
    const gameOverDiv = document.getElementById('game-over');
    if (gameOverDiv) {
        gameOverDiv.style.display = 'none';
    }

    // 清理现有游戏对象
    if (cardManager) {
        cardManager.cards.forEach(card => {
            if (card && card.active) {
                card.destroy();
            }
        });
        cardManager.cards = []; // 清空卡牌数组
    }

    if (slotSystem) {
        slotSystem.clear();
    }

    // 重置游戏状态以进行下一关
    gameState = GAME_STATE.PLAYING;
    propCounts = { ...GAME_CONFIG.propCounts }; // 每关重置道具

    // 开始新关卡
    startGame.call(this);

    console.log(`游戏进入下一关: ${level}`);
}


// 导出函数供外部调用
window.gameUtils = {
    restartGame: function() {
        if (window.gameScene) {
            restartGame.call(window.gameScene);
        }
    },
    
    getGameState: function() {
        return {
            gameState,
            score,
            level,
            propCounts: { ...propCounts },
            remainingCards: cardManager ? cardManager.getRemainingCards() : 0,
            slotInfo: slotSystem ? slotSystem.getSlotInfo() : null
        };
    }
};
