async function getCSRFToken() {
    const response = await fetch('/api/trace', { method: 'POST' });
    const data = await response.json();
    return data
}

export { getCSRFToken };