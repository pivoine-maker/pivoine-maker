// 卡牌类
class Card extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cardType, layer = 0) {
        super(scene, x, y);
        
        this.scene = scene;
        this.cardType = cardType;
        this.layer = layer;
        this.state = CARD_STATE.NORMAL;
        this.originalX = x;
        this.originalY = y;
        this.isClickable = true;
        this.id = `card_${Date.now()}_${Math.random()}`;
        
        this.createCard();
        this.setupInteraction();
        
        // 添加到场景
        scene.add.existing(this);
        scene.physics.add.existing(this);
    }
    
    createCard() {
        // 创建卡牌背景
        this.background = this.scene.add.rectangle(
            0, 0, 
            GAME_CONFIG.cardWidth, 
            GAME_CONFIG.cardHeight, 
            GAME_CONFIG.colors.cardBg
        );
        this.background.setStrokeStyle(2, GAME_CONFIG.colors.cardBorder);
        this.add(this.background);
        
        // 创建卡牌图标文字
        this.iconText = this.scene.add.text(0, 0, this.cardType, {
            fontSize: '32px',
            fill: '#000000',
            align: 'center'
        });
        this.iconText.setOrigin(0.5, 0.5);
        this.add(this.iconText);
        
        // 创建层级显示（调试用）
        if (this.layer > 0) {
            this.layerText = this.scene.add.text(
                GAME_CONFIG.cardWidth/2 - 8, 
                -GAME_CONFIG.cardHeight/2 + 8, 
                this.layer.toString(), 
                {
                    fontSize: '12px',
                    fill: '#666666',
                    backgroundColor: '#ffffff',
                    padding: { x: 2, y: 1 }
                }
            );
            this.layerText.setOrigin(0.5, 0.5);
            this.add(this.layerText);
        }
        
        // 设置深度
        this.setDepth(this.layer * 10);
    }
    
    setupInteraction() {
        // 设置交互区域
        this.background.setInteractive();
        
        // 桌面端悬停效果
        if (!GameUtils.isMobile()) {
            this.background.on('pointerover', () => {
                if (this.isClickable && this.state === CARD_STATE.NORMAL) {
                    this.setHighlighted(true);
                }
            });
            
            this.background.on('pointerout', () => {
                if (this.state === CARD_STATE.HIGHLIGHTED) {
                    this.setHighlighted(false);
                }
            });
        }
        
        // 点击/触摸事件
        this.background.on('pointerdown', (pointer, localX, localY, event) => {
            if (this.isClickable && this.state !== CARD_STATE.MOVING) {
                // 移动端触觉反馈
                if (GameUtils.isMobile() && navigator.vibrate) {
                    navigator.vibrate(50); // 轻微震动反馈
                }
                
                this.onClick();
                
                // 阻止事件冒泡（避免误触）
                event.stopPropagation();
            }
        });
        
        // 移动端触摸开始效果
        if (GameUtils.isMobile()) {
            this.background.on('pointerdown', () => {
                if (this.isClickable && this.state === CARD_STATE.NORMAL) {
                    this.setHighlighted(true);
                }
            });
            
            this.background.on('pointerup', () => {
                if (this.state === CARD_STATE.HIGHLIGHTED) {
                    this.setHighlighted(false);
                }
            });
            
            this.background.on('pointerupoutside', () => {
                if (this.state === CARD_STATE.HIGHLIGHTED) {
                    this.setHighlighted(false);
                }
            });
        }
    }
    
    onClick() {
        if (!this.canBeClicked()) {
            return;
        }
        
        // 触发点击事件
        this.scene.events.emit('cardClicked', this);
        
        // 播放点击音效（如果有的话）
        // this.scene.sound.play('cardClick');
        
        // 视觉反馈
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    canBeClicked() {
        // 检查卡牌是否可以被点击
        if (!this.isClickable || this.state === CARD_STATE.MOVING) {
            return false;
        }
        
        // 检查是否被上层卡牌遮挡
        return this.scene.cardManager.isCardClickable(this);
    }
    
    setHighlighted(highlighted) {
        if (highlighted) {
            this.state = CARD_STATE.HIGHLIGHTED;
            this.background.setFillStyle(0xFFFF99); // 高亮颜色
            this.setScale(1.05);
        } else {
            this.state = CARD_STATE.NORMAL;
            this.background.setFillStyle(GAME_CONFIG.colors.cardBg);
            this.setScale(1.0);
        }
    }
    
    setSelected(selected) {
        if (selected) {
            this.state = CARD_STATE.SELECTED;
            this.background.setFillStyle(0x99FF99); // 选中颜色
        } else {
            this.state = CARD_STATE.NORMAL;
            this.background.setFillStyle(GAME_CONFIG.colors.cardBg);
        }
    }
    
    setDisabled(disabled) {
        if (disabled) {
            this.state = CARD_STATE.DISABLED;
            this.setAlpha(0.5);
            this.isClickable = false;
        } else {
            this.state = CARD_STATE.NORMAL;
            this.setAlpha(1.0);
            this.isClickable = true;
        }
    }
    
    moveToSlot(slotX, slotY, callback) {
        this.state = CARD_STATE.MOVING;
        this.isClickable = false;
        
        // 移动动画
        this.scene.tweens.add({
            targets: this,
            x: slotX,
            y: slotY,
            duration: GAME_CONFIG.cardMoveSpeed,
            ease: 'Power2',
            onComplete: () => {
                this.state = CARD_STATE.NORMAL;
                this.isClickable = false; // 在卡槽中不可点击
                if (callback) callback();
            }
        });
    }
    
    moveToPosition(x, y, callback) {
        this.state = CARD_STATE.MOVING;
        
        this.scene.tweens.add({
            targets: this,
            x: x,
            y: y,
            duration: GAME_CONFIG.cardMoveSpeed,
            ease: 'Power2',
            onComplete: () => {
                this.state = CARD_STATE.NORMAL;
                if (callback) callback();
            }
        });
    }
    
    animateMatch(callback) {
        // 消除动画
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            rotation: Math.PI * 2,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
                if (callback) callback();
            }
        });
    }
    
    updateDepth() {
        // 更新显示深度
        this.setDepth(this.layer * 10 + this.y * 0.1);
    }
    
    getInfo() {
        return {
            id: this.id,
            type: this.cardType,
            layer: this.layer,
            x: this.x,
            y: this.y,
            state: this.state
        };
    }
    
    destroy() {
        // 清理资源
        if (this.background) {
            this.background.removeAllListeners();
        }
        super.destroy();
    }
}

// 卡牌管理器
class CardManager {
    constructor(scene) {
        this.scene = scene;
        this.cards = [];
        this.cardGrid = new Map(); // 用于快速位置查找
        this.layers = [];
    }
    
    createCards() {
        this.cards = [];
        this.layers = [];
        
        // 计算总卡牌数量，确保能被3整除
        const totalCards = GAME_CONFIG.layers * GAME_CONFIG.cardsPerLayer;
        const cardTypesNeeded = Math.ceil(totalCards / GAME_CONFIG.matchCount);
        
        // 生成卡牌类型数组
        let cardTypes = [];
        for (let i = 0; i < cardTypesNeeded; i++) {
            const type = GAME_CONFIG.cardTypes[i % GAME_CONFIG.cardTypes.length];
            for (let j = 0; j < GAME_CONFIG.matchCount; j++) {
                cardTypes.push(type);
            }
        }
        
        // 如果有多余的卡牌，随机移除
        while (cardTypes.length > totalCards) {
            cardTypes.pop();
        }
        
        // 打乱卡牌类型
        cardTypes = GameUtils.shuffleArray(cardTypes);
        
        // 创建层级
        for (let layer = 0; layer < GAME_CONFIG.layers; layer++) {
            this.layers[layer] = [];
            
            for (let i = 0; i < GAME_CONFIG.cardsPerLayer; i++) {
                const cardIndex = layer * GAME_CONFIG.cardsPerLayer + i;
                if (cardIndex < cardTypes.length) {
                    const position = this.getCardPosition(layer, i);
                    const card = new Card(
                        this.scene, 
                        position.x, 
                        position.y, 
                        cardTypes[cardIndex], 
                        layer
                    );
                    
                    this.cards.push(card);
                    this.layers[layer].push(card);
                    this.updateCardGrid(card);
                }
            }
        }
        
        this.updateAllCardsDepth();
    }
    
    getCardPosition(layer, index) {
        // 计算卡牌在不同层级的位置
        const centerX = GAME_CONFIG.width / 2;
        const centerY = GAME_CONFIG.height / 2 - 50;
        const layerOffset = layer * 5; // 每层偏移量
        
        // 使用圆形排列
        const radius = 150 + layer * 20;
        const angle = (index / GAME_CONFIG.cardsPerLayer) * Math.PI * 2;
        
        const x = centerX + Math.cos(angle) * radius + layerOffset;
        const y = centerY + Math.sin(angle) * radius * 0.6 + layerOffset;
        
        return { x, y };
    }
    
    updateCardGrid(card) {
        // 更新卡牌网格，用于快速查找
        const gridX = Math.floor(card.x / 20);
        const gridY = Math.floor(card.y / 20);
        const key = `${gridX},${gridY}`;
        
        if (!this.cardGrid.has(key)) {
            this.cardGrid.set(key, []);
        }
        this.cardGrid.get(key).push(card);
    }
    
    isCardClickable(card) {
        // 检查卡牌是否被上层卡牌遮挡
        for (let layer = card.layer + 1; layer < this.layers.length; layer++) {
            for (let otherCard of this.layers[layer]) {
                if (this.cardsOverlap(card, otherCard)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    cardsOverlap(card1, card2) {
        // 检查两张卡牌是否重叠
        const distance = GameUtils.getDistance(card1.x, card1.y, card2.x, card2.y);
        return distance < GAME_CONFIG.cardWidth * 0.8;
    }
    
    rebuildSpatialInfo() {
        // Clear grid and layers
        this.cardGrid.clear();
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i]) {
                this.layers[i].length = 0;
            }
        }

        // Repopulate
        for (const card of this.cards) {
            if (card.active) {
                // Ensure layer array exists
                while (this.layers.length <= card.layer) {
                    this.layers.push([]);
                }
                this.layers[card.layer].push(card);
                this.updateCardGrid(card); // This uses card.x and card.y
            }
        }
    }

    removeCard(card) {
        // 从管理器中移除卡牌
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
        }
        
        if (card.layer < this.layers.length && this.layers[card.layer]) {
            const layerIndex = this.layers[card.layer].indexOf(card);
            if (layerIndex > -1) {
                this.layers[card.layer].splice(layerIndex, 1);
            }
        }
    }
    
    shuffleCards(onComplete) {
        // Only shuffle cards that are on the board, not in the slot system
        const cardsToShuffle = this.cards.filter(card => 
            card.active && !this.scene.slotSystem.isCardInSlot(card)
        );

        if (!cardsToShuffle || cardsToShuffle.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        const cardData = cardsToShuffle.map(card => ({
            x: card.x,
            y: card.y,
            layer: card.layer
        }));

        // Fisher-Yates shuffle algorithm
        for (let i = cardData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardData[i], cardData[j]] = [cardData[j], cardData[i]];
        }
        
        let completedTweens = 0;
        cardsToShuffle.forEach((card, index) => {
            // Update card's layer
            card.layer = cardData[index].layer;

            this.scene.tweens.add({
                targets: card,
                x: cardData[index].x,
                y: cardData[index].y,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    completedTweens++;
                    if (completedTweens === cardsToShuffle.length) {
                        this.rebuildSpatialInfo();
                        this.updateAllCardsDepth();
                        
                        if (onComplete) {
                            onComplete();
                        }
                    }
                }
            });
        });
    }

    // 更新所有卡牌的层级关系
    updateAllCardsDepth() {
        // 更新所有卡牌的显示深度
        this.cards.forEach(card => {
            if (card && card.active) {
                card.updateDepth();
            }
        });
    }
    
    getClickableCards() {
        // 获取所有可点击的卡牌
        return this.cards.filter(card => 
            card.active && 
            card.canBeClicked() && 
            this.isCardClickable(card)
        );
    }
    
    getRemainingCards() {
        // 获取剩余卡牌数量
        return this.cards.filter(card => card.active).length;
    }
}