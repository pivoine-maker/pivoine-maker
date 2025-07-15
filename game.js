// 游戏主文件 - 启动和初始化游戏

// 错误显示函数（需要在最前面定义）
function showError(message) {
    // 显示错误信息
    console.error(message);
    
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
            ">
                <h3 style="color: #ff4444; margin-bottom: 15px;">游戏错误</h3>
                <p style="margin-bottom: 20px; color: #666;">${message}</p>
                <button onclick="location.reload()" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">刷新页面</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
}

// 等待所有资源加载完成
window.addEventListener('load', function() {
    // 确保所有依赖都已加载
    if (typeof Phaser === 'undefined') {
        console.error('Phaser.js 未加载');
        showError('Phaser.js 框架加载失败');
        return;
    }
    
    if (typeof GAME_CONFIG === 'undefined') {
        console.error('游戏配置未加载');
        showError('游戏配置加载失败');
        return;
    }
    
    if (typeof GameUtils === 'undefined') {
        console.error('游戏工具未加载');
        showError('游戏工具加载失败');
        return;
    }
    
    // 初始化Phaser配置
    if (typeof initPhaserConfig === 'function') {
        initPhaserConfig();
    } else {
        console.error('initPhaserConfig函数未定义');
        showError('Phaser配置初始化失败');
        return;
    }
    
    if (typeof phaserConfig === 'undefined') {
        console.error('Phaser配置初始化失败');
        showError('Phaser配置加载失败');
        return;
    }
    
    console.log('羊了个羊游戏开始初始化...');
    
    // 短暂延迟确保所有脚本都执行完成
    setTimeout(() => {
        try {
            // 初始化游戏
            initGame();
            
            // 设置全局事件监听
            setupGlobalEvents();
            
            // 隐藏加载屏幕
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            
            console.log('游戏初始化完成!');
        } catch (error) {
            console.error('游戏初始化过程中出错:', error);
            showError(`游戏初始化失败: ${error.message}`);
        }
    }, 100);
});

function initGame() {
    try {
        // 创建Phaser游戏实例
        game = new Phaser.Game(phaserConfig);
        
        // 保存游戏实例到全局
        window.gameInstance = game;
        
        console.log('Phaser游戏实例创建成功');
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        showError('游戏初始化失败，请刷新页面重试');
    }
}

function setupGlobalEvents() {
    // 窗口大小改变事件
    window.addEventListener('resize', handleResize);
    
    // 页面可见性改变事件
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    
    // 防止右键菜单
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // 防止页面滑动（移动端）
    if (GameUtils.isMobile()) {
        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    }
}

function handleResize() {
    // 处理窗口大小改变
    if (game && game.scene && game.scene.scenes[0]) {
        const scene = game.scene.scenes[0];
        
        // 调整游戏尺寸
        game.scale.refresh();
        
        console.log('游戏窗口已调整');
    }
}

function handleVisibilityChange() {
    // 处理页面可见性改变
    if (document.hidden) {
        // 页面隐藏时暂停游戏
        if (game && game.scene && game.scene.scenes[0]) {
            game.scene.pause();
            console.log('游戏已暂停');
        }
    } else {
        // 页面显示时恢复游戏
        if (game && game.scene && game.scene.scenes[0]) {
            game.scene.resume();
            console.log('游戏已恢复');
        }
    }
}

function handleKeyDown(event) {
    // 处理键盘快捷键
    if (!game) return;
    
    switch (event.code) {
        case 'KeyR':
            // R键重新开始
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                if (window.gameUtils) {
                    window.gameUtils.restartGame();
                }
            }
            break;
            
        case 'KeyP':
            // P键暂停/恢复
            togglePause();
            break;
            
        case 'Space':
            // 空格键洗牌
            event.preventDefault();
            if (window.gameScene && typeof useProp === 'function') {
                useProp.call(window.gameScene, PROP_TYPE.SHUFFLE);
            }
            break;
            
        case 'Escape':
            // ESC键显示菜单（如果有的话）
            toggleMenu();
            break;
            
        case 'F11':
            // F11全屏
            toggleFullscreen();
            break;
    }
}

function togglePause() {
    // 切换暂停状态
    if (!game || !game.scene.scenes[0]) return;
    
    const scene = game.scene.scenes[0];
    
    if (scene.scene.isPaused()) {
        scene.scene.resume();
        showMessage('游戏已恢复');
    } else {
        scene.scene.pause();
        showMessage('游戏已暂停 (按P键恢复)');
    }
}

function toggleMenu() {
    // 切换菜单显示（简化版本）
    console.log('菜单功能待实现');
}

function toggleFullscreen() {
    // 切换全屏模式
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('无法进入全屏模式:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function showMessage(message, duration = 3000) {
    // 显示临时消息
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 9999;
        font-size: 16px;
        font-weight: bold;
        pointer-events: none;
        animation: fadeInOut ${duration}ms ease-in-out;
    `;
    
    // 添加CSS动画
    if (!document.getElementById('message-style')) {
        const style = document.createElement('style');
        style.id = 'message-style';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, duration);
}

// 游戏统计和调试工具
window.gameDebug = {
    // 获取游戏状态
    getState: function() {
        if (window.gameUtils) {
            return window.gameUtils.getGameState();
        }
        return null;
    },
    
    // 添加分数
    addScore: function(points) {
        if (window.gameScene) {
            score += points;
            updateUI();
            console.log(`添加分数: ${points}, 当前分数: ${score}`);
        }
    },
    
    // 获取性能信息
    getPerformance: function() {
        if (!game) return null;
        
        return {
            fps: game.loop.actualFps,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB'
            } : 'N/A'
        };
    },
    
    // 切换调试模式
    toggleDebug: function() {
        if (game && game.scene.scenes[0] && game.scene.scenes[0].physics) {
            const physics = game.scene.scenes[0].physics;
            physics.world.debugGraphic.visible = !physics.world.debugGraphic.visible;
            console.log('调试模式已', physics.world.debugGraphic.visible ? '开启' : '关闭');
        }
    },
    
    // 清理卡槽
    clearSlots: function() {
        if (window.gameScene && window.gameScene.slotSystem) {
            window.gameScene.slotSystem.clear();
            console.log('卡槽已清空');
        }
    },
    
    // 强制胜利
    forceWin: function() {
        if (window.gameScene) {
            window.gameScene.events.emit('gameOver', 'victory');
            console.log('强制胜利');
        }
    }
};

// 性能监控
function startPerformanceMonitoring() {
    setInterval(() => {
        const perf = window.gameDebug.getPerformance();
        if (perf && perf.fps < 30) {
            console.warn('游戏帧率较低:', perf.fps);
        }
    }, 5000);
}

// 如果是开发环境，启动性能监控
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    startPerformanceMonitoring();
    console.log('开发模式：性能监控已启动');
    console.log('调试工具可通过 window.gameDebug 访问');
}

// 导出全局函数
window.showMessage = showMessage;
window.showError = showError; 