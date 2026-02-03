/**
 * API Simulada - Sistema de autenticación básico
 * Dificulta el copiado casual del código
 */

// Token de sesión simple (regenerado en cada carga)
const SESSION_TOKEN = btoa(Date.now() + Math.random().toString()).substring(0, 32);

// Almacenamiento encriptado básico
const SecureStorage = {
    _key: SESSION_TOKEN,
    
    set(key, value) {
        const encrypted = btoa(JSON.stringify(value) + this._key);
        sessionStorage.setItem(key, encrypted);
    },
    
    get(key) {
        const encrypted = sessionStorage.getItem(key);
        if (!encrypted) return null;
        
        try {
            const decrypted = atob(encrypted);
            const data = decrypted.substring(0, decrypted.length - this._key.length);
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    },
    
    remove(key) {
        sessionStorage.removeItem(key);
    }
};

// API para validar acceso
export const API = {
    /**
     * Inicializa la sesión
     */
    async init() {
        const sessionId = this._generateSessionId();
        SecureStorage.set('session_id', sessionId);
        SecureStorage.set('init_time', Date.now());
        
        console.log('%c🔒 Sesión iniciada', 'color: #10b981; font-weight: bold');
        return true;
    },
    
    /**
     * Valida que la sesión sea válida
     */
    validateSession() {
        const sessionId = SecureStorage.get('session_id');
        const initTime = SecureStorage.get('init_time');
        
        if (!sessionId || !initTime) {
            console.warn('Sesión inválida');
            return false;
        }
        
        // Sesión expira después de 8 horas
        const elapsed = Date.now() - initTime;
        if (elapsed > 8 * 60 * 60 * 1000) {
            console.warn('Sesión expirada');
            return false;
        }
        
        return true;
    },
    
    /**
     * Carga recursos protegidos
     */
    async loadResource(resourcePath) {
        if (!this.validateSession()) {
            throw new Error('Unauthorized access');
        }
        
        try {
            const response = await fetch(resourcePath);
            if (!response.ok) throw new Error('Resource not found');
            
            return await response.text();
        } catch (error) {
            console.error('Error loading resource:', error);
            throw error;
        }
    },
    
    /**
     * Registra actividad del usuario
     */
    logActivity(action, data = {}) {
        const log = SecureStorage.get('activity_log') || [];
        log.push({
            timestamp: Date.now(),
            action,
            data,
            token: this._hash(SESSION_TOKEN)
        });
        
        // Mantener solo los últimos 100 registros
        if (log.length > 100) {
            log.shift();
        }
        
        SecureStorage.set('activity_log', log);
    },
    
    /**
     * Obtiene información de uso
     */
    getUsageStats() {
        const log = SecureStorage.get('activity_log') || [];
        const initTime = SecureStorage.get('init_time');
        
        return {
            sessionDuration: Date.now() - initTime,
            totalActions: log.length,
            lastAction: log[log.length - 1]?.action
        };
    },
    
    // Métodos privados
    _generateSessionId() {
        return btoa(Date.now() + Math.random() + navigator.userAgent).substring(0, 64);
    },
    
    _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return btoa(hash.toString());
    }
};

// Protección contra inspección de código
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Deshabilitar click derecho en producción
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        console.log('%c⚠️ Esta aplicación está protegida', 'color: #ef4444; font-weight: bold');
    });
    
    // Detectar DevTools
    const devtools = { open: false };
    const threshold = 160;
    
    setInterval(() => {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                console.log('%c🔍 Herramientas de desarrollo detectadas', 'color: #f59e0b; font-weight: bold');
                API.logActivity('devtools_opened');
            }
        } else {
            devtools.open = false;
        }
    }, 500);
}

// Mensaje en consola
console.log(`
%c╔═════════════════════════════════════════════════════════╗
║                                                           ║
║  🚀 LIKERT CHART VISUALIZER - Sistema Modular             ║
║                                                           ║
║  ⚠️  AVISO: Este código está protegido por derechos      ║
║     de autor: Raidell Avello. El uso no autorizado puede  ║
║     resultar en acciones legales.                         ║
║                                                           ║
║  📧 Para consultas: ravellom.docencia@gmail.com           ║
║  🌐 Documentación: TBD                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`, 'color: #3b82f6; font-family: monospace; font-size: 12px; font-weight: bold');

console.log('%cSesión ID: ' + SESSION_TOKEN.substring(0, 16) + '...', 'color: #64748b; font-size: 10px');

export default API;
