import {VARS} from "./var.js";

export const FUNS = new Map();

export class Function {

    constructor(name, params, block = []) {
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