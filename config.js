// 游戏配置常量
const GAME_CONFIG = {
    // 游戏尺寸
    width: 750,
    height: 600,
    
    // 卡牌设置
    cardWidth: 80,
    cardHeight: 80,
    cardTypes: ['🐑', '🐺', '🐸', '🐧', '🐰', '🐼', '🐯', '🐮', '🐷', '🐵'],
    
    // 布局设置
    layers: 8,           // 层数
    cardsPerLayer: 12,   // 每层卡牌数量
    maxSlots: 7,         // 卡槽数量
    
    // 游戏机制
    matchCount: 3,       // 消除数量
    propCounts: {
        shuffle: 3,      // 洗牌道具数量
        remove: 3,       // 移除道具数量
        undo: 3          // 撤销道具数量
    },
    
    // 分数设置
    scorePerMatch: 30,   // 每次消除得分
    scorePerCard: 10,    // 每张卡牌得分
    
    // 动画设置
    cardMoveSpeed: 300,  // 卡牌移动速度
    matchDelay: 200,     // 消除延迟
    
    // 颜色设置
    colors: {
        background: 0x87CEEB,    // 天空蓝
        cardBg: 0xFFFFFF,        // 卡牌背景
        cardBorder: 0xCCCCCC,    // 卡牌边框
        slotBg: 0xF0F0F0,        // 卡槽背景
        slotBorder: 0x999999     // 卡槽边框
    }
};

// 游戏状态枚举
const GAME_STATE = {
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    WIN: 'win'
};

// 卡牌状态枚举
const CARD_STATE = {
    NORMAL: 'normal',
    HIGHLIGHTED: 'highlighted',
    SELECTED: 'selected',
    DISABLED: 'disabled',
    MOVING: 'moving'
};

// 道具类型枚举
const PROP_TYPE = {
    SHUFFLE: 'shuffle',
    REMOVE: 'remove',
    UNDO: 'undo'
};

// 游戏工具函数
const GameUtils = {
    // 随机打乱数组
    shuffleArray: function(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },
    
    // 生成随机位置
    getRandomPosition: function(centerX, centerY, radius) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        return {
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance
        };
    },
    
    // 检查两点之间的距离
    getDistance: function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    // 线性插值
    lerp: function(start, end, factor) {
        return start + (end - start) * factor;
    },
    
    // 格式化分数
    formatScore: function(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // 检查是否为移动设备
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}; 
