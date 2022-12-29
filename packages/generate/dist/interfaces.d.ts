import { CommandOptions } from "./commandutil";
import type { ConnectConfig } from "edgedb/dist/conUtils";
export declare function runInterfacesGenerator(params: {
    root: string | null;
    options: CommandOptions;
    connectionConfig: ConnectConfig;
}): Promise<void>;
