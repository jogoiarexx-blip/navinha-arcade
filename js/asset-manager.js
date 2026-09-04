// Gerenciador central de recursos. CORE e SHARED continuam carregados pelo
// index; LEVEL contém apenas os recursos da fase ativa.
const AssetManager = (() => {
    const sharedCache = new Map();
    const levelCache = new Map();
    let activeLevel = null;
    let activeScript = null;
    let loadGeneration = 0;

    const LOAD_TIMEOUT_MS = 10000;
    const MAX_ATTEMPTS = 2;

    function loadScript(url, level, attempt) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            let settled = false;
            const timer = setTimeout(() => finish(new Error('Tempo esgotado: ' + url)), LOAD_TIMEOUT_MS);

            function finish(error) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                script.onload = null;
                script.onerror = null;
                if (error) {
                    script.remove();
                    delete PHASE_DEFS[level];
                    reject(error);
                } else {
                    resolve(script);
                }
            }

            script.async = true;
            script.dataset.levelAsset = String(level);
            script.onload = () => {
                if (!PHASE_DEFS[level] || !PHASE_DEFS[level].boss) {
                    finish(new Error('Configuração inválida da Fase ' + level + ': ' + url));
                    return;
                }
                finish();
            };
            script.onerror = () => finish(new Error('Falha ao carregar: ' + url));
            // Evita cachear uma resposta de erro entre as tentativas, sem
            // interferir no cache normal do navegador na primeira carga.
            script.src = attempt > 1 ? url + (url.includes('?') ? '&' : '?') + 'retry=' + Date.now() : url;
            document.body.appendChild(script);
        });
    }

    async function withRetry(loader, label) {
        let lastError;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return await loader(attempt);
            } catch (error) {
                lastError = error;
                console.warn('[AssetManager] tentativa ' + attempt + ' falhou em ' + label, error);
            }
        }
        throw lastError || new Error('Não foi possível carregar ' + label);
    }

    function unloadLevel(level) {
        if (level === null || level === undefined) return;
        const resources = levelCache.get(level) || [];
        resources.forEach(resource => {
            if (resource && resource.tagName === 'SCRIPT') resource.remove();
            if (resource && resource.image) resource.image.src = '';
            if (resource && resource.objectUrl) URL.revokeObjectURL(resource.objectUrl);
        });
        levelCache.delete(level);
        delete PHASE_DEFS[level];
        if (activeLevel === level) {
            activeLevel = null;
            activeScript = null;
        }
    }

    function disposeResources(resources) {
        (resources || []).forEach(resource => {
            if (resource && resource.tagName === 'SCRIPT') resource.remove();
            if (resource && resource.image) resource.image.src = '';
            if (resource && resource.objectUrl) URL.revokeObjectURL(resource.objectUrl);
        });
    }

    function loadImage(url, key, attempt) {
        return new Promise((resolve, reject) => {
            if (typeof Image === 'undefined') {
                resolve({ type: 'image', key, url, image: null, ready: false });
                return;
            }
            const image = new Image();
            let settled = false;
            const timer = setTimeout(() => finish(new Error('Tempo esgotado: ' + url)), LOAD_TIMEOUT_MS);
            function finish(error) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                image.onload = null;
                image.onerror = null;
                if (error) reject(error);
                else resolve({ type: 'image', key, url, image, ready: true });
            }
            image.onload = () => finish();
            image.onerror = () => finish(new Error('Falha ao carregar: ' + url));
            image.src = attempt > 1 ? url + (url.includes('?') ? '&' : '?') + 'retry=' + Date.now() : url;
        });
    }

    async function loadLevel(level, onProgress) {
        const generation = ++loadGeneration;
        const meta = getPhaseMeta(level);
        const assets = [{ type: 'script', url: meta.script }].concat(meta.assets || []);
        const loaded = [];

        onProgress(0, 'Preparando recursos');
        for (let index = 0; index < assets.length; index++) {
            const asset = assets[index];
            try {
                if (asset.type === 'script') {
                    loaded.push(await withRetry(
                        attempt => loadScript(asset.url, level, attempt),
                        asset.url
                    ));
                } else if (asset.type === 'image') {
                    loaded.push(await withRetry(
                        attempt => loadImage(asset.url, asset.key, attempt),
                        asset.url
                    ));
                }
            } catch (error) {
                loaded.forEach(resource => resource.remove && resource.remove());
                delete PHASE_DEFS[level];
                console.error('[AssetManager] recurso da Fase ' + level + ' com erro:', asset.url, error);
                throw error;
            }
            if (generation !== loadGeneration) {
                disposeResources(loaded);
                const cancelled = new Error('Carregamento substituído por uma nova transição');
                cancelled.cancelled = true;
                throw cancelled;
            }
            onProgress(Math.round(((index + 1) / assets.length) * 100), asset.url);
        }

        if (generation !== loadGeneration) {
            disposeResources(loaded);
            const cancelled = new Error('Carregamento cancelado');
            cancelled.cancelled = true;
            throw cancelled;
        }
        levelCache.set(level, loaded);
        activeLevel = level;
        activeScript = loaded[0] || null;
        return PHASE_DEFS[level];
    }

    function loadSharedImage(key, url) {
        if (typeof Image === 'undefined') return Promise.resolve(null);
        const cached = sharedCache.get(key);
        if (cached && cached.url === url) return cached.promise;
        if (cached && cached.image) cached.image.src = '';
        const image = new Image();
        const entry = { type: 'image', url, image, ready: false, promise: null };
        entry.promise = new Promise((resolve, reject) => {
            image.onload = () => { entry.ready = true; resolve(image); };
            image.onerror = () => {
                if (sharedCache.get(key) === entry) sharedCache.delete(key);
                reject(new Error('Falha ao carregar imagem compartilhada: ' + url));
            };
        });
        sharedCache.set(key, entry);
        image.src = url;
        return entry.promise;
    }

    function getSharedImage(key) {
        const entry = sharedCache.get(key);
        return entry && entry.ready ? entry.image : null;
    }

    function unloadShared(key) {
        const entry = sharedCache.get(key);
        if (entry && entry.image) entry.image.src = '';
        sharedCache.delete(key);
    }

    function getLevelImage(key) {
        if (activeLevel === null) return null;
        const resources = levelCache.get(activeLevel) || [];
        const entry = resources.find(resource => resource && resource.type === 'image' && resource.key === key);
        return entry && entry.ready ? entry.image : null;
    }

    return {
        loadLevel,
        unloadLevel,
        loadSharedImage,
        getSharedImage,
        unloadShared,
        getLevelImage,
        getActiveLevel: () => activeLevel,
        cancelPending: () => { loadGeneration++; },
        getStats: () => ({
            sharedAssets: sharedCache.size,
            levelAssets: activeLevel === null ? 0 : (levelCache.get(activeLevel) || []).length,
            activeLevel,
            hasActiveScript: !!activeScript
        })
    };
})();
