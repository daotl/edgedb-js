import type { CodeBuilder, CodeFragment, DirBuilder, IdentRef } from "./builders";
import type * as introspect from "edgedb/dist/reflection/queries/types";
export { $ } from "edgedb";
import type { $ } from "edgedb";
export declare function splitName(name: string): {
    mod: string;
    name: string;
};
export declare function toIdent(name: string): string;
export declare const makePlainIdent: (name: string) => string;
export declare function quote(val: string): string;
export declare const scalarToLiteralMapping: {
    [key: string]: {
        type: string;
        literalKind?: "typeof" | "instanceof";
        extraTypes?: string[];
    };
};
export declare const literalToScalarMapping: {
    [key: string]: {
        type: string;
        literalKind: "typeof" | "instanceof";
    };
};
export declare function toTSScalarType(type: introspect.PrimitiveType, types: introspect.Types, opts?: {
    getEnumRef?: (type: introspect.Type) => string;
    edgedbDatatypePrefix: string;
}): CodeFragment[];
export declare function toTSObjectType(type: introspect.ObjectType, types: introspect.Types, currentMod: string, code: CodeBuilder, level?: number): CodeFragment[];
export declare function capitalize(str: string): string;
export declare function displayName(str: string): string;
export declare function getInternalName({ fqn, id }: {
    fqn: string;
    id: string;
}): string;
export declare function makeValidIdent({ id, name, skipKeywordCheck }: {
    id: string;
    name: string;
    skipKeywordCheck?: boolean;
}): string;
export declare function getRef(name: string, opts?: {
    prefix?: string;
}): IdentRef;
export declare function frag(strings: TemplateStringsArray, ...exprs: (CodeFragment | CodeFragment[])[]): CodeFragment[];
export declare function joinFrags(frags: (CodeFragment | CodeFragment[])[], sep: string): CodeFragment[];
export declare const reservedIdents: Set<string>;
export declare function writeDirWithTarget(dir: DirBuilder, target: Target, params: {
    outputDir: string;
    written?: Set<string>;
}): Promise<void>;
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
