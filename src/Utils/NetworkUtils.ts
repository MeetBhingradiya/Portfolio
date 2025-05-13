import { NextRequest } from 'next/server';

/**
 * Extracts the client IP address from various request headers
 * @param req NextRequest object
 * @returns Client IP address string
 */
export function getClientIP(req: NextRequest): string {
  // Check for forwarded IP (usually from reverse proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first IP if there are multiple in the chain
    return forwardedFor.split(',')[0].trim();
  }
  
  // Check other common headers
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Get from connection info if available
  const connectionRemoteAddress = req.headers.get('x-vercel-forwarded-for') || 
                                 req.headers.get('x-vercel-ip') ||
                                 req.headers.get('cf-connecting-ip');
  if (connectionRemoteAddress) {
    return connectionRemoteAddress;
  }
  
  // Fallback
  return '0.0.0.0';
}

/**
 * Validates if an IP address is in CIDR notation range
 * @param ip IP address to check
 * @param cidr CIDR notation range (e.g., "192.168.0.0/24")
 * @returns Boolean indicating if IP is in range
 */
export function isIPInRange(ip: string, cidr: string): boolean {
  // Simple implementation for IPv4
  try {
    const [range, bits = "32"] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    
    const ipInt = ipToInt(ip);
    const rangeInt = ipToInt(range);
    const maskInt = mask >>> 0; // Convert to unsigned
    
    return (ipInt & maskInt) === (rangeInt & maskInt);
  } catch (e) {
    return false;
  }
}

/**
 * Convert IP address to integer
 * @param ip IP address string
 * @returns Integer representation of IP
 */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Checks if IP address is in the whitelist
 * @param ip IP address to check
 * @param whitelist Array of allowed IPs/CIDR ranges
 * @returns Boolean indicating if IP is whitelisted
 */
export function isIPWhitelisted(ip: string, whitelist: string[]): boolean {
  if (!whitelist || whitelist.length === 0) {
    return false;
  }
  
  return whitelist.some(entry => {
    if (entry.includes('/')) {
      // CIDR notation
      return isIPInRange(ip, entry);
    } else {
      // Exact match
      return ip === entry;
    }
  });
}

/**
 * Gets geo-location information for an IP address
 * This is a stub - in production you would use a geo-IP service
 * @param ip IP address
 * @returns Location information
 */
export async function getIPGeolocation(ip: string): Promise<{ 
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
} | null> {
  // In a real implementation, you would call a geo-IP service like MaxMind,
  // ipstack, ipinfo.io, etc.
  
  // Example implementation (stub):
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
    return {
      country: 'Local',
      region: 'Local',
      city: 'Localhost',
      isp: 'Local Network'
    };
  }
  
  // Return null for now - replace with actual API call in production
  return null;
}