import { RedirectProtocols } from "@Config/RedirectProtocols";
import { Config } from "@Config";

function RedirectProtocolExecuter(ServerResponseStatuscode: string | undefined) {
    const Protocol = RedirectProtocols.find((protocol) => protocol.protocol === ServerResponseStatuscode);

    if (Protocol) {
        if (Protocol.useUserPathasRedirect) {
            window.location.href = `https://${Config.WhiteListedDomains[0]}${window.location.pathname}`;
        } else {
            window.location.href = `https://${Config.WhiteListedDomains[0]}${Protocol?.redirectpath}`;
        }
    }

    return;
}

export { RedirectProtocolExecuter };