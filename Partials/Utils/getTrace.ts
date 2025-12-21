async function getCSRFToken() {
    console.log("[getCSRFToken] Requesting CSRF token from /api/trace");
    const response = await fetch("/api/trace", { 
        method: "POST",
        credentials: "include" // Important: include cookies
    });
    const data = await response.json();
    console.log("[getCSRFToken] Response:", data);
    return data;
}

export { getCSRFToken };
