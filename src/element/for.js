import {VARS} from "./var.js";

export class For {
    constructor(params, values, block) {
        this.params = params;
        this.values = values;
        this.block = block;
    }

    invoke() {
        for (let i = 0; i < this.values.items.length; i++) {
            const value = this.values.items[i];

            // set vars
            for (let j = 0; j < this.params.length; j++) {
                let variable = this.params[j];
                variable.value = this.params.length === 1 ? value : value.items[j];

                VARS.set(variable.name, variable);
            }

            this.block.parse();
        }
    }
}