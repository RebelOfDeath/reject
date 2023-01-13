import {VARS} from "./var.js";

export const FUNS = new Map();

export class Fn {

    constructor(name, params = [], block = []) {
        this.name = name;
        this.params = params;
        this.block = block;
    }

    invoke(...params) {
        if (this.params.length !== params.length) {
            throw new Error(`Invalid argument count of ${params.length} for function call of '${this.name}'`);
        }

        for (let i = 0; i < params.length; i++) {
            let variable = this.params[i];
            variable.value = params[i];

            VARS.set(variable.name, variable);
        }

        this.block.eval();
    }
}

export class AFn extends Fn {

    constructor(params, block) {
        super("", params, block)
    }

    invoke(...params) {
        if (this.params.length !== params.length) {
            throw new Error(`Invalid argument count of ${params.length} for function call of '${this.name}'`);
        }

        for (let i = 0; i < params.length; i++) {
            let variable = this.params[i];
            variable.value = params[i];

            VARS.set(variable.name, variable);
        }

        this.block.eval();
    }
}

export class NativeFn extends Fn {

    constructor(name, afn) {
        super(name);

        this.afn = afn;
    }

    invoke(...params) {
        if (this.afn.length !== params.length) {
            throw new Error(`Invalid argument count of ${params.length} for function call of '${this.name}'`);
        }

        this.afn(params);
    }
}

// registers a single function
export function register(fn) {
    if (fn.name.length === 0) {
        throw new Error("Cannot register anonymous functions");
    }

    FUNS.set(fn.name, fn);
}

// registers a native function, provided with a map
export function registerNatives(map) {

    for (const name in map) {
        let fn = map[name];

        register(new NativeFn(name, fn));
    }
}