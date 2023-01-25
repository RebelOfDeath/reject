import {VARS} from "./var.js";
import {Return} from "./return.js";

export const FUNS = new Map();

export class Fn {

    constructor(name, params = [], block = []) {
        this.name = name;
        this.params = params;
        this.block = block;
    }

    invoke(params) {
        if (params.length === undefined) { // if a single value is passed
            params = [params];
        }

        for (let i = 0; i < params.length; i++) {
            let variable = this.params[i];
            variable.value = params[i];

            VARS.set(variable.name, variable);
        }

        // flatten to remove when, for indentation
        try {
            const returns = this.block.parse()
                .flat(Infinity)
                .filter(ret => ret instanceof Return);

            return returns !== null ? returns[0].value : true;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

export class AFn extends Fn {

    constructor(params, block) {
        super("", params, block);
    }

    invoke(params) {
        if (params.length === undefined) { // if a single value is passed
            params = [params];
        }

        for (let i = 0; i < params.length; i++) {
            let variable = this.params[i];
            variable.value = params[i];

            VARS.set(variable.name, variable);
        }

        try {
            return this.block.parse();
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

export class NativeFn extends Fn {

    constructor(name, afn) {
        super(name);

        this.afn = afn;
    }

    invoke(params) {
        return this.afn(...params);
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
export function registerNativeFns(map) {

    for (const name in map) {
        let fn = map[name];

        register(new NativeFn(name, fn));
    }
}