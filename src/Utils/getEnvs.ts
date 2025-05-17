function getEnvs(env:string) {
    return Object.keys(process.env).filter(key => key.startsWith(env)).map(key => process.env[key]);
}

export {
    getEnvs
}