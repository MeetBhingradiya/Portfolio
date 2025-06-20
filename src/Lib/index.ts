import { getClientIp } from "./request-ip";
import { MemoryStore } from "./memory-store";

const Libraries = {
    requestIp: getClientIp,
    MemoryStore
};

export default Libraries;

export { getClientIp as requestIp };
