import API_BASE from '../config/api';

export const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://localhost') || url.startsWith('http://10.0.2.2')) return null;
    if (url.startsWith('https://storage.googleapis.com/')) return url;
    if (url.startsWith('https://')) return url;
    if (url.startsWith('http://')) return null;
    if (url.startsWith('/')) return API_BASE + url;
    return null;
};
