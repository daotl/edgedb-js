import type { GeneratorParams } from "../genutil";
export declare type GenerateInterfacesParams = Pick<GeneratorParams, "dir" | "types">;
export declare const generateInterfaces: (params: GenerateInterfacesParams) => void;
