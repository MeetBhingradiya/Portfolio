import ChildProcess from "child_process";

interface ExecuteCommand_Options {
    /**
     * ? The command to be execute.
     */
    command: string
    /**
     * @default process.cwd()
     * ? The current working directory to execute the command in.
     */
    cwd?: string
    /**
     * @default false
     * ? Overlap the terminal output as a prefix.
     */
    prefix?: string
    /**
     * ? Disable Logs
     */
    disableLogs?: boolean
}

/**
 * 
 * @param param0 command, cwd, prefix
 * @returns 
 */
async function ExecuteCommand({ command, cwd = process.cwd(), prefix, disableLogs = false }: ExecuteCommand_Options) {

    process.env.FORCE_COLOR = '1';

    const child = ChildProcess.spawn(command, {
        /** Execute Command in Shell */
        shell: true,
        /** Current Working Directory */
        cwd: cwd,
        /** Capture Output */
        stdio: 'pipe',
        /** Need Color Output */
        // env: { FORCE_COLOR: '1' },
        env: process.env,
    });

    child.stdout?.on('data', (data: Buffer) => {
        if (disableLogs) {
            return;
        }

        if (prefix === undefined) {
            prefix = '';
        }

        console.log(`${prefix} ${data.toString()}`);
    });

    child.stderr?.on('data', (data: Buffer) => {
        console.error(`${prefix} ${data.toString()}`);
    });

    child.on('error', (error: any) => {
        console.error(`${prefix} Error: ${error.message}`);
    });

    child.on('exit', (code: number) => {
        if (code !== 0) {
            console.error(`${prefix} Command exited with code ${code}`);
        }
    });

    return child;
}

interface ExecuteCommands_Options {
    /**
     * ? Childs Object for @function ExecuteCommand
     */
    Childs: Array<ExecuteCommand_Options>
    /**
     * @default false
     * ? If true, the commands will be executed one by one in the order they are passed in.
     * ? This is useful when building a project that depends on another project or packages.
     */
    oneByOne?: boolean
}

/**
 * #### ExecuteCommands - Execute multiple commands for Cli Plugin
 * @param `Childs`
 * @returns `Promise<childProcess.ChildProcess[]>`
 */
async function ExecuteCommands({ Childs, oneByOne = false }: ExecuteCommands_Options) {
    const childProcesses: Promise<ChildProcess.ChildProcess>[] = [];

    for (const child of Childs) {
        const childProcessPromise = ExecuteCommand(child);
        childProcesses.push(childProcessPromise);
        if (oneByOne) {
            await childProcessPromise;
        }
    }

    await Promise.all(childProcesses);

    return childProcesses.map((promise) => promise.then((child) => child));
}

export {
    ExecuteCommands,
    ExecuteCommand
}

export type {
    ExecuteCommand_Options,
    ExecuteCommands_Options
}