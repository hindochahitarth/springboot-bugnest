import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
});

/** True only if this request actually sent Bearer auth (AxiosHeaders or plain object). */
function requestSentBearerAuthorization(config) {
    if (!config?.headers) return false;
    const h = config.headers;
    let auth;
    if (typeof h.get === 'function') {
        auth = h.get('Authorization') || h.get('authorization');
    } else {
        auth = h.Authorization || h.authorization;
    }
    return typeof auth === 'string' && auth.startsWith('Bearer ');
}

api.interceptors.request.use((config) => {
    const t = localStorage.getItem('token');
    if (t) {
        config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        // Only treat as "session invalid" if we sent a JWT and the server rejected it.
        // 401 without Authorization (e.g. race, misconfigured request) must not wipe login.
        if (err.response?.status === 401 && requestSentBearerAuthorization(err.config)) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/' && path !== '/register') {
                window.location.assign('/login');
            }
        }
        return Promise.reject(err);
    }
);

export default api;
