// Главный объект игры
const Game = {
    state: 'start',
    playerName: '',
    score: 0,
    timeLeft: 120,
    isTestMode: false,
    timerInterval: null,
    gameLoopId: null,
    lives: 3,

    player: {
        x: 150, y: 500, vy: 0,
        width: 32, height: 32,
        grounded: true,
        jumpCount: 0, maxJumps: 3,
        frame: 0,
        animTimer: 0,
        onPlatform: null
    },
    coins: [],
    enemies: [],         // наземные враги (бандиты)
    flyingEnemies: [],   // воздушные враги (вороны)
    clouds: [],
    backgroundOffset: 0,

    GRAVITY: 0.8,
    JUMP_FORCE: -12,
    GROUND_Y: 536,
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 600,

    spriteSheet: null,

    init() {
        SoundManager.init();

        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('restart-button').addEventListener('click', () => this.resetToStart());
        document.getElementById('pause-button').addEventListener('click', () => this.togglePause());
        document.getElementById('exit-test').addEventListener('click', () => this.endGame(true));

        const nameInput = document.getElementById('player-name');
        const startBtn = document.getElementById('start-button');
        const errorMsg = document.getElementById('name-error');

        function validateName() {
            const name = nameInput.value.trim();
            if (name.length === 0) {
                startBtn.disabled = true;
                errorMsg.textContent = 'Имя не может быть пустым';
            } else if (name.length > 15) {
                startBtn.disabled = true;
                errorMsg.textContent = 'Имя слишком длинное (макс. 15 символов)';
            } else {
                startBtn.disabled = false;
                errorMsg.textContent = '';
            }
        }

        nameInput.addEventListener('input', validateName);
        validateName();

        document.getElementById('font-inc').addEventListener('click', () => this.changeFontSize(0.1));
        document.getElementById('font-dec').addEventListener('click', () => this.changeFontSize(-0.1));
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        const soundBtn = document.getElementById('sound-toggle');
        soundBtn.addEventListener('click', () => {
            const isOn = SoundManager.toggleAllSound();
            soundBtn.textContent = isOn ? '🔊' : '🔇';
        });

        this.createSpriteSheet();
        document.documentElement.style.setProperty('--font-size-multiplier', '1');
    },

 createSpriteSheet() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Рыцарь (4 кадра)
    const knightFrames = [
        { x: 0, y: 0 },
        { x: 32, y: 0 },
        { x: 64, y: 0 },
        { x: 96, y: 0 }
    ];

    knightFrames.forEach((pos, i) => {
        ctx.fillStyle = '#3498db';
        ctx.fillRect(pos.x + 6, pos.y + 10, 20, 18);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(pos.x + 10, pos.y + 2, 12, 12);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(pos.x + 6, pos.y + 22, 20, 4);
        ctx.fillStyle = '#2c3e50';
        if (i % 2 === 0) {
            ctx.fillRect(pos.x + 8, pos.y + 26, 6, 6);
            ctx.fillRect(pos.x + 18, pos.y + 26, 6, 6);
        } else {
            ctx.fillRect(pos.x + 4, pos.y + 26, 6, 6);
            ctx.fillRect(pos.x + 20, pos.y + 26, 6, 6);
        }
        ctx.fillStyle = '#fff';
        ctx.fillRect(pos.x + 14, pos.y + 6, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(pos.x + 16, pos.y + 8, 2, 2);
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(pos.x + 26, pos.y + 10, 4, 14);
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(pos.x + 24, pos.y + 8, 8, 4);
    });

    // Бандит в фиолетовом плаще (позиция 0,32)
    const bx = 0, by = 32;
    ctx.fillStyle = '#6a0dad';
    ctx.fillRect(bx + 6, by + 4, 20, 24);
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(bx + 8, by + 6, 16, 20);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(bx + 6, by + 18, 20, 3);
    ctx.fillStyle = '#4a0072';
    ctx.fillRect(bx + 10, by - 2, 12, 10);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(bx + 12, by + 2, 8, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(bx + 14, by + 4, 2, 2);
    ctx.fillRect(bx + 18, by + 4, 2, 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(bx + 10, by + 24, 5, 8);
    ctx.fillRect(bx + 19, by + 24, 5, 8);

    // Монета (позиция 32,32)
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(36, 32, 12, 12);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(38, 34, 8, 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(40, 36, 4, 4);

    // Ворон (позиция 64,32 – 95,63)
    const vx = 64, vy = 32;
    // Тело птицы (тёмно-серое, почти чёрное)
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(vx + 10, vy + 8, 16, 10);
    // Голова
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(vx + 18, vy + 2, 10, 10);
    // Глаз (белый с чёрным зрачком)
    ctx.fillStyle = '#fff';
    ctx.fillRect(vx + 20, vy + 4, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(vx + 21, vy + 5, 2, 2);
    // Клюв (оранжевый)
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(vx + 26, vy + 8, 6, 3);
    // Крылья (серые)
    ctx.fillStyle = '#555';
    ctx.fillRect(vx + 4, vy + 10, 10, 8);   // левое крыло
    ctx.fillRect(vx + 22, vy + 12, 10, 8);  // правое крыло
    // Хвост
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(vx + 2, vy + 12, 6, 4);

    this.spriteSheet = canvas;
},

    changeFontSize(delta) {
        const root = document.documentElement;
        let current = parseFloat(getComputedStyle(root).getPropertyValue('--font-size-multiplier') || 1);
        let newVal = Math.min(1.5, Math.max(0.8, current + delta));
        root.style.setProperty('--font-size-multiplier', newVal);
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    resetToStart() {
        this.clearGameData();
        this.showScreen('start-screen');
        document.getElementById('player-name').value = '';
        document.getElementById('start-button').disabled = true;
        this.state = 'start';
    },

    clearGameData() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
        this.score = 0;
        this.lives = 3;
        this.timeLeft = 120;
        this.coins = [];
        this.enemies = [];
        this.flyingEnemies = [];   // очищаем ворон
        this.clouds = [];
        this.generateClouds();
        this.player.y = 500;
        this.player.vy = 0;
        this.player.grounded = true;
        this.player.onPlatform = null;
        this.backgroundOffset = 0;
        this.updateUI();
    },

    generateClouds() {
        this.clouds.push({ x: 300, y: 400, width: 100, height: 24, speed: 0.8, dir: 1 });
        this.clouds.push({ x: 600, y: 300, width: 120, height: 24, speed: 1.2, dir: -1 });
        this.clouds.push({ x: 150, y: 200, width: 90,  height: 24, speed: 0.6, dir: 1 });
        this.clouds.push({ x: 800, y: 350, width: 110, height: 24, speed: 1.0, dir: -1 });
    },

    startGame() {
        const name = document.getElementById('player-name').value.trim();
        if (!name) return;
        this.playerName = name;
        this.isTestMode = (name.toLowerCase() === 'tester');
        this.clearGameData();
        this.showScreen('game-screen');
        document.getElementById('player-display').textContent = this.playerName;

        const testBadge = document.getElementById('test-mode-badge');
        const exitBtn = document.getElementById('exit-test');
        if (this.isTestMode) {
            testBadge.classList.remove('hidden');
            exitBtn.classList.remove('hidden');
        } else {
            testBadge.classList.add('hidden');
            exitBtn.classList.add('hidden');
            this.startTimer();
        }
        this.state = 'playing';
        SoundManager.startMusic();
        this.gameLoop();
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            if (this.state !== 'playing') return;
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                this.endGame(false);
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const mins = Math.floor(Math.max(0, this.timeLeft) / 60);
        const secs = Math.floor(Math.max(0, this.timeLeft) % 60);
        const display = document.getElementById('timer-display');
        display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        const classList = display.classList;
        if (this.timeLeft <= 10) {
            classList.add('timer-danger');
            classList.remove('timer-warning');
        } else if (this.timeLeft <= 30) {
            classList.add('timer-warning');
            classList.remove('timer-danger');
        } else {
            classList.remove('timer-warning', 'timer-danger');
        }
    },

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-button').textContent = 'Продолжить';
            SoundManager.stopMusic();
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-button').textContent = 'Пауза';
            SoundManager.startMusic();
        }
    },

    endGame(forcedByTest = false) {
        if (this.state === 'gameover') return;
        this.state = 'gameover';
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);

        SoundManager.stopMusic();
        SoundManager.play('gameover');

        this.saveScore();
        document.getElementById('final-score').textContent = this.score;
        const leaderboard = this.getLeaderboard();
        const position = leaderboard.findIndex(entry =>
            entry.name === this.playerName && entry.score === this.score
        ) + 1;
        document.getElementById('result-position').textContent =
            position ? `Вы заняли ${position} место!` : 'Результат не вошёл в топ-10';
        const tbody = document.querySelector('#leaderboard tbody');
        tbody.innerHTML = '';
        leaderboard.forEach((entry, index) => {
            const row = tbody.insertRow();
            row.insertCell().textContent = index + 1;
            row.insertCell().textContent = entry.name;
            row.insertCell().textContent = entry.score;
        });
        this.showScreen('end-screen');
    },

    saveScore() {
        let leaderboard = this.getLeaderboard();
        leaderboard.push({ name: this.playerName, score: this.score });
        leaderboard.sort((a, b) => b.score - a.score);
        const top10 = leaderboard.slice(0, 10);
        localStorage.setItem('platformer_leaderboard', JSON.stringify(top10));
    },

    getLeaderboard() {
        const data = localStorage.getItem('platformer_leaderboard');
        return data ? JSON.parse(data) : [];
    },

    gameLoop() {
        if (this.state !== 'playing' && this.state !== 'paused') return;
        if (this.state === 'playing') this.updateGame();
        this.render();
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    },

    updateGame() {
        // Движение облаков
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed * cloud.dir;
            if (cloud.x <= 0) {
                cloud.x = 0;
                cloud.dir = 1;
            }
            if (cloud.x + cloud.width >= this.CANVAS_WIDTH) {
                cloud.x = this.CANVAS_WIDTH - cloud.width;
                cloud.dir = -1;
            }
        });

        // Гравитация игрока
        this.player.vy += this.GRAVITY;
        this.player.y += this.player.vy;

        if (this.player.onPlatform) {
            this.player.x += this.player.onPlatform.speed * this.player.onPlatform.dir;
        }

        // Земля
        if (this.player.y >= this.GROUND_Y - this.player.height) {
            this.player.y = this.GROUND_Y - this.player.height;
            this.player.vy = 0;
            this.player.grounded = true;
            this.player.jumpCount = 0;
            this.player.onPlatform = null;
        } else {
            this.player.grounded = false;
        }

        // Облака-платформы
        if (this.player.vy >= 0) {
            for (let cloud of this.clouds) {
                if (this.player.x + this.player.width > cloud.x &&
                    this.player.x < cloud.x + cloud.width &&
                    this.player.y + this.player.height >= cloud.y &&
                    this.player.y + this.player.height - this.player.vy <= cloud.y) {
                    this.player.y = cloud.y - this.player.height;
                    this.player.vy = 0;
                    this.player.grounded = true;
                    this.player.jumpCount = 0;
                    this.player.onPlatform = cloud;
                    break;
                }
            }
        }

        // Генерация монет и врагов
        if (Math.random() < 0.02) this.spawnCoin();
        if (Math.random() < 0.01) this.spawnEnemy();           // бандиты
        if (Math.random() < 0.001) this.spawnFlyingEnemy();    // вороны (редко)

        // Движение объектов
        this.coins.forEach(coin => coin.x -= 5);
        this.enemies.forEach(enemy => enemy.x -= 6);
        this.flyingEnemies.forEach(bird => bird.x -= 3);  // вороны летят медленнее

        // Удаление за экраном
        this.coins = this.coins.filter(c => c.x > -50);
        this.enemies = this.enemies.filter(e => e.x > -100);
        this.flyingEnemies = this.flyingEnemies.filter(b => b.x > -50);

        // Сбор монет
        for (let i = this.coins.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.coins[i])) {
                this.score += 10;
                SoundManager.play('coin');
                this.coins.splice(i, 1);
                this.updateUI();
            }
        }

        // Столкновение с наземными врагами
        if (!this.isTestMode) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.checkCollision(this.player, this.enemies[i])) {
                    this.lives--;
                    SoundManager.play('hit');
                    this.enemies.splice(i, 1);
                    if (this.lives <= 0) {
                        this.endGame(false);
                        return;
                    }
                    this.updateUI();
                }
            }
            // Столкновение с воздушными врагами
            for (let i = this.flyingEnemies.length - 1; i >= 0; i--) {
                if (this.checkCollision(this.player, this.flyingEnemies[i])) {
                    this.lives--;
                    SoundManager.play('hit');
                    this.flyingEnemies.splice(i, 1);
                    if (this.lives <= 0) {
                        this.endGame(false);
                        return;
                    }
                    this.updateUI();
                }
            }
        }

        this.backgroundOffset = (this.backgroundOffset + 2) % this.CANVAS_WIDTH;
    },

    checkCollision(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    },

    spawnCoin() {
        this.coins.push({
            x: this.CANVAS_WIDTH + 50,
            y: this.GROUND_Y - 80 - Math.random() * 150,
            width: 16, height: 16
        });
    },

    spawnEnemy() {
        this.enemies.push({
            x: this.CANVAS_WIDTH + 100,
            y: this.GROUND_Y - 32,
            width: 32, height: 32
        });
    },

    // Новый метод: спавн ворона на высоте облаков
    spawnFlyingEnemy() {
        const possibleY = [200, 300, 350, 400]; // высоты, где есть облака
        const y = possibleY[Math.floor(Math.random() * possibleY.length)] + 10; // немного выше облака
        this.flyingEnemies.push({
            x: this.CANVAS_WIDTH + 50,
            y: y,
            width: 32,
            height: 24
        });
    },

    updateUI() {
        document.getElementById('score-display').textContent = this.score;
    },

    render() {
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        this.drawBackground(ctx);

        // Облака-платформы
        this.clouds.forEach(cloud => {
            ctx.fillStyle = '#ffffffcc';
            ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
            ctx.fillRect(cloud.x + 10, cloud.y - 8, 30, 12);
            ctx.fillRect(cloud.x + cloud.width - 40, cloud.y - 8, 30, 12);
            ctx.fillRect(cloud.x + cloud.width/2 - 20, cloud.y - 12, 40, 16);
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.strokeRect(cloud.x, cloud.y, cloud.width, cloud.height);
        });

        // Монеты
        this.coins.forEach(coin => {
            ctx.drawImage(this.spriteSheet, 32, 32, 16, 16, coin.x, coin.y, coin.width, coin.height);
        });

        // Наземные враги (бандиты)
        this.enemies.forEach(enemy => {
            ctx.drawImage(this.spriteSheet, 0, 32, 32, 32, enemy.x, enemy.y, enemy.width, enemy.height);
        });

        // Воздушные враги (вороны)
        this.flyingEnemies.forEach(bird => {
            ctx.drawImage(this.spriteSheet, 64, 32, 32, 24, bird.x, bird.y, bird.width, bird.height);
        });

        // Игрок
        const frameX = (this.player.frame % 4) * 32;
        ctx.drawImage(this.spriteSheet, frameX, 0, 32, 32, this.player.x, this.player.y, this.player.width, this.player.height);

        // Жизни
        for (let i = 0; i < this.lives; i++) {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(20 + i * 30, this.GROUND_Y + 20, 16, 16);
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(22 + i * 30, this.GROUND_Y + 22, 12, 4);
            ctx.fillRect(24 + i * 30, this.GROUND_Y + 24, 8, 8);
        }

        if (this.state === 'paused') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
            ctx.font = 'bold 50px "Press Start 2P"';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('ПАУЗА', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
            ctx.textAlign = 'left';
        }

        this.player.animTimer++;
        if (this.player.animTimer >= 10) {
            this.player.frame++;
            this.player.animTimer = 0;
        }
    },

    drawBackground(ctx) {
        for (let y = 0; y < this.CANVAS_HEIGHT; y += 10) {
            const color = `hsl(${200 + y * 0.1}, 70%, ${50 + y * 0.05}%)`;
            ctx.fillStyle = color;
            ctx.fillRect(0, y, this.CANVAS_WIDTH, 10);
        }

        ctx.fillStyle = '#ffffffaa';
        for (let i = 0; i < 3; i++) {
            const cloudX = (this.backgroundOffset * 0.3 + i * 350) % (this.CANVAS_WIDTH + 100) - 50;
            ctx.fillRect(cloudX, 60, 64, 24);
            ctx.fillRect(cloudX + 16, 44, 32, 24);
            ctx.fillRect(cloudX + 32, 52, 24, 16);
        }

        ctx.fillStyle = '#5d8c4a';
        ctx.fillRect(0, this.GROUND_Y, this.CANVAS_WIDTH, 64);
        ctx.fillStyle = '#3d632a';
        for (let x = 0; x < this.CANVAS_WIDTH; x += 16) {
            ctx.fillRect(x + (this.backgroundOffset % 16), this.GROUND_Y + 4, 12, 12);
        }
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(0, this.GROUND_Y + 20, this.CANVAS_WIDTH, 12);
    },

    handleKeyDown(e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (this.state === 'playing' || this.state === 'paused') {
                this.togglePause();
            }
            return;
        }
        if (this.state !== 'playing') return;
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
            e.preventDefault();
            if (this.player.jumpCount < this.player.maxJumps) {
                this.player.vy = this.JUMP_FORCE;
                this.player.grounded = false;
                this.player.jumpCount++;
                this.player.onPlatform = null;
                SoundManager.play('jump');
            }
        }
    }
};

window.addEventListener('load', () => {
    Game.init();
});