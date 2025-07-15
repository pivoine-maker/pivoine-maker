// 卡槽系统
class SlotSystem {
    constructor(scene) {
        this.scene = scene;
        this.slots = [];
        this.slotCards = [];
        this.maxSlots = GAME_CONFIG.maxSlots;
        this.slotWidth = GAME_CONFIG.cardWidth + 10;
        this.slotHeight = GAME_CONFIG.cardHeight + 10;
        this.history = []; // 用于撤销功能
        
        this.createSlots();
    }
    
    createSlots() {
        // 计算卡槽区域的位置
        const startX = (GAME_CONFIG.width - (this.maxSlots * this.slotWidth)) / 2 + this.slotWidth / 2;
        const slotY = GAME_CONFIG.height - 50;
        
        // 创建卡槽背景
        this.slotBg = this.scene.add.rectangle(
            GAME_CONFIG.width / 2,
            slotY,
            this.maxSlots * this.slotWidth + 20,
            this.slotHeight + 20,
            GAME_CONFIG.colors.slotBg
        );
        this.slotBg.setStrokeStyle(3, GAME_CONFIG.colors.slotBorder);
        this.slotBg.setDepth(-1);
        
        // 创建各个卡槽
        for (let i = 0; i < this.maxSlots; i++) {
            const slotX = startX + i * this.slotWidth;
            
            // 创建卡槽视觉元素
            const slot = this.scene.add.rectangle(
                slotX,
                slotY,
                GAME_CONFIG.cardWidth,
                GAME_CONFIG.cardHeight,
                0xFFFFFF,
                0.3
            );
            slot.setStrokeStyle(2, 0x999999, 0.5);
            slot.setDepth(-1);
            
            // 添加卡槽编号
            const slotNumber = this.scene.add.text(slotX, slotY, (i + 1).toString(), {
                fontSize: '16px',
                fill: '#999999',
                align: 'center'
            });
            slotNumber.setOrigin(0.5, 0.5);
            slotNumber.setDepth(-1);
            
            this.slots.push({
                x: slotX,
                y: slotY,
                slot: slot,
                number: slotNumber,
                isEmpty: true
            });
        }
        
        // 初始化卡槽卡牌数组
        this.slotCards = new Array(this.maxSlots).fill(null);
    }
    
    addCard(card) {
        // 检查是否有空槽位
        const emptySlotIndex = this.findEmptySlot();
        if (emptySlotIndex === -1) {
            // 卡槽已满，游戏失败
            this.scene.events.emit('gameOver', 'slots_full');
            return false;
        }
        
        // 保存历史状态（用于撤销）
        this.saveState();
        
        // 将卡牌移动到卡槽
        const slot = this.slots[emptySlotIndex];
        this.slotCards[emptySlotIndex] = card;
        slot.isEmpty = false;
        
        // 隐藏卡槽编号
        slot.number.setVisible(false);
        
        // 移动卡牌到卡槽位置
        card.moveToSlot(slot.x, slot.y, () => {
            // 移动完成后检查匹配
            this.checkForMatches();
        });
        
        return true;
    }
    
    findEmptySlot() {
        // 查找第一个空的卡槽
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.slotCards[i] === null) {
                return i;
            }
        }
        return -1;
    }
    
    checkForMatches() {
        // 统计每种卡牌类型的数量和位置
        const cardCounts = new Map();
        const cardPositions = new Map();
        
        this.slotCards.forEach((card, index) => {
            if (card !== null) {
                const type = card.cardType;
                if (!cardCounts.has(type)) {
                    cardCounts.set(type, 0);
                    cardPositions.set(type, []);
                }
                cardCounts.set(type, cardCounts.get(type) + 1);
                cardPositions.get(type).push(index);
            }
        });
        
        // 检查是否有三个相同的卡牌
        for (let [type, count] of cardCounts) {
            if (count >= GAME_CONFIG.matchCount) {
                this.performMatch(type, cardPositions.get(type));
                return; // 一次只处理一种匹配
            }
        }
    }
    
    performMatch(cardType, positions) {
        // 获取要消除的卡牌
        const cardsToRemove = positions.slice(0, GAME_CONFIG.matchCount).map(pos => this.slotCards[pos]);
        
        // 播放匹配动画
        let animationsCompleted = 0;
        cardsToRemove.forEach((card, index) => {
            card.animateMatch(() => {
                animationsCompleted++;
                if (animationsCompleted === cardsToRemove.length) {
                    // 所有动画完成后重新整理卡槽
                    this.reorganizeSlots();
                    
                    // 触发匹配事件
                    this.scene.events.emit('cardsMatched', {
                        type: cardType,
                        count: GAME_CONFIG.matchCount,
                        score: GAME_CONFIG.scorePerMatch
                    });
                }
            });
        });
        
        // 清空对应的卡槽位置
        positions.slice(0, GAME_CONFIG.matchCount).forEach(pos => {
            this.slotCards[pos] = null;
            this.slots[pos].isEmpty = true;
            this.slots[pos].number.setVisible(true);
        });
        
        // 从卡牌管理器中移除卡牌
        cardsToRemove.forEach(card => {
            this.scene.cardManager.removeCard(card);
        });
    }
    
    reorganizeSlots() {
        // 重新整理卡槽，将所有卡牌向左移动，填补空隙
        const activeCards = this.slotCards.filter(card => card !== null);
        
        // 清空所有卡槽
        this.slotCards.fill(null);
        this.slots.forEach(slot => {
            slot.isEmpty = true;
            slot.number.setVisible(true);
        });
        
        // 重新放置卡牌
        activeCards.forEach((card, index) => {
            this.slotCards[index] = card;
            this.slots[index].isEmpty = false;
            this.slots[index].number.setVisible(false);
            
            // 移动卡牌到新位置
            card.moveToPosition(this.slots[index].x, this.slots[index].y);
        });
    }

    isCardInSlot(card) {
        return this.slotCards.includes(card);
    }
    
    saveState() {
        // 保存当前状态用于撤销功能
        const state = {
            slotCards: this.slotCards.map(card => card ? card.getInfo() : null),
            timestamp: Date.now()
        };
        
        this.history.push(state);
        
        // 限制历史记录数量
        if (this.history.length > 10) {
            this.history.shift();
        }
    }
    
    undo() {
        // 撤销功能
        if (this.history.length === 0) {
            return false;
        }
    
        const lastState = this.history.pop();
        const lastSlotCardInfos = lastState.slotCards;
        const currentSlotCards = this.slotCards;
    
        let cardToMoveBack = null;
    
        // 查找被添加的卡牌
        for (const card of currentSlotCards) {
            if (card) {
                const isInLastState = lastSlotCardInfos.some(info => info && info.id === card.id);
                if (!isInLastState) {
                    cardToMoveBack = card;
                    break;
                }
            }
        }
    
        if (cardToMoveBack) {
            // 恢复卡槽状态
            const allCards = this.scene.cardManager.cards;
            this.slotCards = lastSlotCardInfos.map(info => {
                if (info === null) return null;
                return allCards.find(c => c.id === info.id) || null;
            });
    
            // 更新卡槽的视觉表现
            this.slots.forEach((slot, index) => {
                const card = this.slotCards[index];
                if (card) {
                    slot.isEmpty = false;
                    slot.number.setVisible(false);
                    card.moveToPosition(slot.x, slot.y);
                } else {
                    slot.isEmpty = true;
                    slot.number.setVisible(true);
                }
            });
    
            // 将卡牌移回原位
            cardToMoveBack.moveToPosition(cardToMoveBack.originalX, cardToMoveBack.originalY, () => {
                cardToMoveBack.isClickable = true;
                cardToMoveBack.setHighlighted(false);
                cardToMoveBack.updateDepth();
            });
    
            return true;
        } else {
            // 无法确定要撤销的卡牌，可能是撤销了匹配或移除操作
            this.history.push(lastState);
            return false;
        }
    }

    removeRandomCard() {
        // 移除道具：随机移除一张卡牌
        const activeCards = this.slotCards.filter(card => card !== null);
        if (activeCards.length === 0) {
            return false;
        }
        
        const randomCard = activeCards[Math.floor(Math.random() * activeCards.length)];
        const cardIndex = this.slotCards.indexOf(randomCard);
        
        if (cardIndex !== -1) {
            // 保存状态
            this.saveState();
            
            // 移除卡牌
            randomCard.animateMatch(() => {
                this.reorganizeSlots();
            });
            
            this.slotCards[cardIndex] = null;
            this.slots[cardIndex].isEmpty = true;
            this.slots[cardIndex].number.setVisible(true);
            
            // 从卡牌管理器中移除
            this.scene.cardManager.removeCard(randomCard);
            
            return true;
        }
        
        return false;
    }
    
    getSlotCount() {
        // 获取当前卡槽中的卡牌数量
        return this.slotCards.filter(card => card !== null).length;
    }
    
    isFull() {
        // 检查卡槽是否已满
        return this.getSlotCount() >= this.maxSlots;
    }
    
    isEmpty() {
        // 检查卡槽是否为空
        return this.getSlotCount() === 0;
    }
    
    clear() {
        // 清空所有卡槽
        this.slotCards.forEach((card, index) => {
            if (card !== null) {
                card.destroy();
                this.slotCards[index] = null;
                this.slots[index].isEmpty = true;
                this.slots[index].number.setVisible(true);
            }
        });
    }
    
    getSlotInfo() {
        // 获取卡槽信息（用于调试）
        return {
            totalSlots: this.maxSlots,
            usedSlots: this.getSlotCount(),
            emptySlots: this.maxSlots - this.getSlotCount(),
            cards: this.slotCards.map(card => card ? card.cardType : null)
        };
    }
    
    // 视觉效果方法
    highlightSlots(highlight = true) {
        // 高亮显示卡槽区域
        const alpha = highlight ? 0.8 : 0.3;
        const color = highlight ? 0xFFFF99 : GAME_CONFIG.colors.slotBg;
        
        this.slotBg.setFillStyle(color, alpha);
        
        this.slots.forEach(slot => {
            if (slot.isEmpty) {
                const slotAlpha = highlight ? 0.6 : 0.3;
                slot.slot.setAlpha(slotAlpha);
            }
        });
    }
    
    showSlotAnimation() {
        // 显示卡槽动画提示
        this.scene.tweens.add({
            targets: this.slotBg,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 300,
            yoyo: true,
            ease: 'Power2'
        });
    }
}