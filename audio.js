const SoundManager = {
    audioCtx: null,
    sfxEnabled: true,

    music: null,
    musicEnabled: true,

    init() {

        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API не поддерживается, звуковые эффекты не будут работать');
        }

        this.music = new Audio('sounds/background.mp3');
        this.music.loop = true;
        this.music.volume = 0.2; 
        this.music.preload = 'auto';
    },
    play(type) {
        if (!this.sfxEnabled || !this.audioCtx) return;
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.1;
        const now = ctx.currentTime;

        switch (type) {
            case 'coin':
                osc.type = 'square';
                osc.frequency.setValueAtTime(988, now);
                osc.frequency.setValueAtTime(1319, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'hit':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            case 'jump':
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'gameover':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
                osc.start(now);
                osc.stop(now + 1.0);
                break;
        }
    },

    startMusic() {
        if (!this.music || !this.musicEnabled) return;
        if (this.music.paused) {
            this.music.play().catch(err => {
                console.warn('Не удалось запустить музыку:', err);
            });
        }
    },

    stopMusic() {
        if (!this.music) return;
        this.music.pause();
        this.music.currentTime = 0;
    },

    toggleAllSound() {
        this.sfxEnabled = !this.sfxEnabled;
        if (!this.sfxEnabled) {
            this.musicEnabled = false;
            this.stopMusic();
        } else {
            this.musicEnabled = true;
        }
        return this.sfxEnabled;
    }
};