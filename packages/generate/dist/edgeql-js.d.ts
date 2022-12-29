import type { ConnectConfig } from "edgedb/dist/conUtils";
import { CommandOptions } from "./commandutil";
import { $ } from "edgedb";
import { DirBuilder } from "./builders";
export declare const configFileHeader = "// EdgeDB query builder. To update, run `npx @edgedb/generate edgeql-js`";
export declare type GeneratorParams = {
    dir: DirBuilder;
    types: $.introspect.Types;
    typesByName: Record<string, $.introspect.Type>;
    casts: $.introspect.Casts;
    scalars: $.introspect.ScalarTypes;
    functions: $.introspect.FunctionTypes;
    globals: $.introspect.Globals;
    operators: $.introspect.OperatorTypes;
};
export declare function exitWithError(message: string): never;
export declare type Target = "ts" | "esm" | "cjs" | "mts" | "deno";
export declare type Version = {
    major: number;
    minor: number;
};
export declare function generateQueryBuilder(params: {
    root: string | null;
    options: CommandOptions;
    connectionConfig: ConnectConfig;
}): Promise<void>;
