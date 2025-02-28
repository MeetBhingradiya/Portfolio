import type { IResponse } from "./IPData"
import { Config } from "@Config"

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