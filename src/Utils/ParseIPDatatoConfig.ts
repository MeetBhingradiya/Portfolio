/**
 *  @FileID          Utils\ParseIPDatatoConfig.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 03/03/25 8:12 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:12 AM IST (Kolkata +5:30 UTC)
 */


import type { IResponse } from "./IPData"
import { Config } from "@Config"

/**
 * Parses threat indicators from an IP response and returns a filtered list of recognized threats.
 *
 * This function inspects various threat flags within the provided response object (e.g., "TOR", "VPN", "ICloud-Relay",
 * "Proxy", "Datacenter", "Anonymous", "KnownAttacker", "KnownAbuser", "Threat", "Bogon"). For each flag that is enabled,
 * it adds the corresponding threat string to a list. The function then filters this list against a predefined set of valid
 * threat types defined in {@link Config.ThreatIntelligence} and finally returns an object containing a boolean flag indicating
 * whether any recognized threat was found and the filtered list of threats.
 *
 * @param Response - The response object containing IP threat indicator properties.
 * @returns An object with an 'isFound' boolean that is true if any valid threat was detected, and a 'Threats' array with the filtered threat strings.
 */
function ParseIPDataConfig(Response: IResponse) {
    // ? "TOR" | "VPN" | "ICloud-Relay" | "Proxy" | "Datacenter" | "Anonymous" | "KnownAttacker" | "KnownAbuser" | "Threat" | "Bogon"
    // ? is_tor is_vpn is_icloud_relay is_proxy is_datacenter is_anonymous is_known_attacker is_known_abuser is_threat is_bogon

    let Threats: string[] = []
    if (Response.threat.is_tor) Threats.push("TOR")
    if (Response.threat.is_vpn) Threats.push("VPN")
    if (Response.threat.is_icloud_relay) Threats.push("ICloud-Relay")
    if (Response.threat.is_proxy) Threats.push("Proxy")
    if (Response.threat.is_datacenter) Threats.push("Datacenter")
    if (Response.threat.is_anonymous) Threats.push("Anonymous")
    if (Response.threat.is_known_attacker) Threats.push("KnownAttacker")
    if (Response.threat.is_known_abuser) Threats.push("KnownAbuser")
    if (Response.threat.is_threat) Threats.push("Threat")
    if (Response.threat.is_bogon) Threats.push("Bogon")
        
    // ? Map with Config
    Threats = Threats.filter((threat) => Config.ThreatIntelligence.includes(threat as any))
        
    return {
        isFound: Threats.length > 0,
        Threats: Threats,
    }
}

export {
    ParseIPDataConfig
}