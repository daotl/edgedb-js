import type { ConnectConfig } from "edgedb/dist/conUtils";
import { CommandOptions } from "./commandutil";
export declare function generateQueryFiles(params: {
    root: string | null;
    options: CommandOptions;
    connectionConfig: ConnectConfig;
}): Promise<void>;
