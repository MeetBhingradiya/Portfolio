/**
 * Utility to parse multipart/form-data responses
 */

interface MultipartPart {
    name: string;
    filename?: string;
    contentType?: string;
    data: Uint8Array;
}

/**
 * Parse a multipart/form-data response
 * @param response - The fetch Response object
 * @returns Promise that resolves to parsed multipart data
 */
export async function parseMultipartResponse(response: Response): Promise<{
    metadata: any;
    files: Array<{ name: string; filename: string; blob: Blob; index: number }>;
}> {
    const contentType = response.headers.get('content-type') || '';
    const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
    
    if (!boundary) {
        throw new Error('No boundary found in multipart response');
    }

    // Get response as ArrayBuffer for proper binary handling
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert boundary to bytes for comparison
    const boundaryBytes = new TextEncoder().encode(`--${boundary}`);
    const crlfBytes = new TextEncoder().encode('\r\n');
    
    const parts: MultipartPart[] = [];
    let position = 0;
    
    // Find the first boundary
    let boundaryIndex = findBytes(uint8Array, boundaryBytes, position);
    
    while (boundaryIndex !== -1) {
        // Move past the boundary and CRLF
        position = boundaryIndex + boundaryBytes.length;
        
        // Skip CRLF after boundary
        if (position + 1 < uint8Array.length && 
            uint8Array[position] === 0x0D && uint8Array[position + 1] === 0x0A) {
            position += 2;
        }
        
        // Find the next boundary
        const nextBoundaryIndex = findBytes(uint8Array, boundaryBytes, position);
        
        if (nextBoundaryIndex === -1) break;
        
        // Extract the part between boundaries
        const partData = uint8Array.slice(position, nextBoundaryIndex - 2); // -2 for CRLF before boundary
        
        // Parse the part
        const part = parseMultipartPart(partData);
        if (part) {
            parts.push(part);
        }
        
        boundaryIndex = nextBoundaryIndex;
    }
    
    // Process parts to extract metadata and files
    let metadata: any = null;
    const files: Array<{ name: string; filename: string; blob: Blob; index: number }> = [];
    
    for (const part of parts) {
        if (part.name === 'metadata') {
            // Parse metadata JSON
            const metadataText = new TextDecoder().decode(part.data);
            try {
                metadata = JSON.parse(metadataText);
            } catch (e) {
                console.error('Failed to parse metadata:', e);
            }
        } else if (part.name.startsWith('file_') && part.filename) {
            // Extract file index
            const indexMatch = part.name.match(/file_(\d+)/);
            if (indexMatch) {
                const index = parseInt(indexMatch[1]);
                const blob = new Blob([part.data], { type: part.contentType || 'application/octet-stream' });
                
                files.push({
                    name: part.name,
                    filename: part.filename,
                    blob,
                    index
                });
            }
        }
    }
    
    return { metadata, files };
}

/**
 * Parse a single multipart part
 */
function parseMultipartPart(partData: Uint8Array): MultipartPart | null {
    // Find the end of headers (double CRLF)
    const doubleCrlf = new TextEncoder().encode('\r\n\r\n');
    const headerEndIndex = findBytes(partData, doubleCrlf, 0);
    
    if (headerEndIndex === -1) return null;
    
    // Extract headers
    const headerBytes = partData.slice(0, headerEndIndex);
    const headerText = new TextDecoder().decode(headerBytes);
    
    // Extract data
    const dataStart = headerEndIndex + doubleCrlf.length;
    const data = partData.slice(dataStart);
    
    // Parse headers
    const headers = parseHeaders(headerText);
    
    // Extract Content-Disposition parameters
    const contentDisposition = headers['content-disposition'] || '';
    const nameMatch = contentDisposition.match(/name="([^"]+)"/);
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
    
    if (!nameMatch) return null;
    
    return {
        name: nameMatch[1],
        filename: filenameMatch?.[1],
        contentType: headers['content-type'],
        data
    };
}

/**
 * Parse HTTP headers from text
 */
function parseHeaders(headerText: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const lines = headerText.split('\r\n');
    
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
            const key = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            headers[key] = value;
        }
    }
    
    return headers;
}

/**
 * Find a byte sequence within a Uint8Array
 */
function findBytes(haystack: Uint8Array, needle: Uint8Array, startIndex: number = 0): number {
    for (let i = startIndex; i <= haystack.length - needle.length; i++) {
        let found = true;
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                found = false;
                break;
            }
        }
        if (found) return i;
    }
    return -1;
}