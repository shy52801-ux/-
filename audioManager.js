/*
 * audioManager.js
 * 微仰音效系统（独立模块，WebAudio 合成，无音频文件）。
 * 统一暴露三个方法：
 *   playClick()      —— 按钮轻点反馈
 *   playComplete()   —— 任务完成确认音
 *   playBlindOpen()  —— 进入支线空间的轻微环境音
 * 未来可扩展：setEnabled(on) / setVolume(v) / 替换为音频文件。
 */
var AudioManager = (function() {
    var ctx = null;
    var enabled = true;
    var volume = 0.8;

    function ensureCtx() {
        if (!ctx) {
            try {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (AC) ctx = new AC();
            } catch (e) {}
        }
        if (ctx && ctx.state === 'suspended') {
            try { ctx.resume(); } catch (e) {}
        }
        return ctx;
    }

    function tone(freq, startOffset, duration, type, peak) {
        if (!ctx) return;
        var t0 = ctx.currentTime + startOffset;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        var p = (peak || 0.15) * volume;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(p, t0 + 0.014);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.06);
    }

    function noiseWhoosh(duration, cutoffStart, cutoffEnd, peak) {
        if (!ctx) return;
        var t0 = ctx.currentTime;
        var len = Math.floor(ctx.sampleRate * duration);
        var buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        }
        var src = ctx.createBufferSource();
        src.buffer = buffer;
        var filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 0.8;
        filter.frequency.setValueAtTime(cutoffStart, t0);
        filter.frequency.exponentialRampToValueAtTime(cutoffEnd, t0 + duration);
        var gain = ctx.createGain();
        var p = (peak || 0.08) * volume;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(p, t0 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(t0);
    }

    return {
        playClick: function() {
            if (!enabled || !ensureCtx()) return;
            try {
                tone(980, 0, 0.06, 'triangle', 0.09);
            } catch (e) {}
        },
        playComplete: function() {
            if (!enabled || !ensureCtx()) return;
            try {
                tone(523.25, 0, 0.16, 'sine', 0.12);
                tone(659.25, 0.09, 0.18, 'sine', 0.12);
                tone(783.99, 0.18, 0.26, 'sine', 0.12);
            } catch (e) {}
        },
        playBlindOpen: function() {
            if (!enabled || !ensureCtx()) return;
            try {
                tone(220, 0, 1.1, 'sine', 0.05);
                tone(329.63, 0.05, 1.0, 'sine', 0.04);
                noiseWhoosh(0.9, 700, 2600, 0.05);
            } catch (e) {}
        },
        setEnabled: function(on) {
            enabled = !!on;
        },
        setVolume: function(v) {
            volume = Math.max(0, Math.min(1, v));
        }
    };
})();

if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}