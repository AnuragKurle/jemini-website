let _ctx = null;
let _comp = null;
let _master = null;

const getAudio = () => {
    if (!_ctx) {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
        _comp = _ctx.createDynamicsCompressor();
        _comp.threshold.value = -20;
        _comp.knee.value = 40;
        _comp.ratio.value = 8;
        _comp.attack.value = 0.003;
        _comp.release.value = 0.25;
        _master = _ctx.createGain();
        _master.gain.value = 0.55;
        _comp.connect(_master);
        _master.connect(_ctx.destination);
    }
    return { ctx: _ctx, comp: _comp };
};

export const playSound = (type) => {
    if (!window.AudioContext && !window.webkitAudioContext) return;

    let ctx, comp;
    try {
        ({ ctx, comp } = getAudio());
        if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { return; }

    const now = ctx.currentTime;

    if (type === 'tap') {
        // Bright short "ting" — like tapping a glass surface gently.
        // Two layered sines at high pitch (fundamental + fifth) for richness.
        // No pitch drop (that causes the hooty/owl sound).
        [[1397, 0.045], [2093, 0.02]].forEach(([freq, vol]) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(vol, now + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
            osc.connect(g); g.connect(comp);
            osc.start(now); osc.stop(now + 0.09);
        });

    } else if (type === 'match') {
        // Bell-like chime — confirmed satisfying, keeping as-is
        [[880, 0.13], [1760, 0.055]].forEach(([freq, vol]) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(vol, now + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(g); g.connect(comp);
            osc.start(now); osc.stop(now + 0.5);
        });

    } else if (type === 'win') {
        // Warm arpeggio: triangle wave through lowpass — mellow, celebratory
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.7;
        filter.connect(comp);
        [523.25, 659.25, 783.99, 880, 1046.50, 1318.51].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const t = now + i * 0.1;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.09, t + 0.025);
            g.gain.setTargetAtTime(0, t + 0.12, 0.12);
            osc.connect(g); g.connect(filter);
            osc.start(t); osc.stop(t + 0.6);
        });

    } else if (type === 'tick') {
        // Ultra-soft ping for score count-up — same family as tap but quieter/shorter
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1397;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.018, now + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.connect(g); g.connect(comp);
        osc.start(now); osc.stop(now + 0.05);

    } else if (type === 'coinCollect') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 3;
        filter.connect(comp);

        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.value = 2400;
        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.07, now + 0.003);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc1.connect(g1); g1.connect(filter);
        osc1.start(now); osc1.stop(now + 0.1);

        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.value = 3200;
        const t2 = now + 0.07;
        g2.gain.setValueAtTime(0, t2);
        g2.gain.linearRampToValueAtTime(0.05, t2 + 0.003);
        g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.06);
        osc2.connect(g2); g2.connect(filter);
        osc2.start(t2); osc2.stop(t2 + 0.08);

    } else if (type === 'collect') {
        // Gentle rising chime: warm collect feel with filtered sweep
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1400;
        filter.Q.value = 1;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.15);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.08, now + 0.02);
        g.gain.setTargetAtTime(0, now + 0.08, 0.05);
        osc.connect(filter);
        filter.connect(g);
        g.connect(comp);
        osc.start(now); osc.stop(now + 0.25);
    }
};
