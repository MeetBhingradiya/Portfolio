async function getCSRFToken() {
    const response = await fetch('/api/trace', { method: 'POST' });
    if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
    } else {
        console.error('Failed to fetch CSRF token');
    }
}

export { getCSRFToken };