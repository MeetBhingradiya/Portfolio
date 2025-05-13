/**
 *  @FileID          Utils/ParseIPDatatoConfig.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

import type { IResponse } from "./IPData"
import { Config } from "@Config"

interface ThreatAnalysisResult {
    isFound: boolean;
    Threats: string[];
}

function ParseIPDataConfig(ipDataResponse: IResponse): ThreatAnalysisResult {
    // ? "TOR" | "VPN" | "ICloud-Relay" | "Proxy" | "Datacenter" | "Anonymous" | "KnownAttacker" | "KnownAbuser" | "Threat" | "Bogon"
    // ? is_tor is_vpn is_icloud_relay is_proxy is_datacenter is_anonymous is_known_attacker is_known_abuser is_threat is_bogon

    let Threats: string[] = []

    if (!ipDataResponse?.threat) {
        return {
            isFound: false,
            Threats: [],
        };
    }

    const { threat } = ipDataResponse;

    if (threat.is_tor) Threats.push("TOR")
    if (threat.is_vpn) Threats.push("VPN")
    if (threat.is_icloud_relay) Threats.push("ICloud-Relay")
    if (threat.is_proxy) Threats.push("Proxy")
    if (threat.is_datacenter) Threats.push("Datacenter")
    if (threat.is_anonymous) Threats.push("Anonymous")
    if (threat.is_known_attacker) Threats.push("KnownAttacker")
    if (threat.is_known_abuser) Threats.push("KnownAbuser")
    if (threat.is_threat) Threats.push("Threat")
    if (threat.is_bogon) Threats.push("Bogon")

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