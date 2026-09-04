// ================= FASE 3 — Véu Carmesim =================
PHASE_DEFS[3] = {
    name: 'Véu Carmesim',
    bgTop: '#1a0410',
    bgBottom: '#050002',
    decor: 'nebula',
    decorAccent: '#ff2266',
    enemiesToKill: 21,
    boss: {
        name: 'Devoradora Escarlate',
        primaryColor: '#380018',
        secondaryColor: '#8a0038',
        plateColor: '#ff2a7a',
        coreColor: '#ff6ab0',
        eyeColor: '#ff0',
        projectileColor: '#ff2a7a',
        projectileAltColor: '#ff8ac8',
        pattern: 2,      // tiro mirado no jogador
        stages: 3,       // mira direta, espiral e ataque múltiplo
        sizeScale: 1.05,
        shape: 'devourer'
    }
};
