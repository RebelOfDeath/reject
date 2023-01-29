import {AFn, registerNativeFns} from "../element/fn.js";
import Chart from 'chart.js/auto';
import {assert, assertNotNull, getLineColour, range} from "../element/util.js";
import {Collection} from "../types/collection.js";
import {Fraction} from "../types/fraction.js";

const line = "rgb(159,49,49)";
const bg = "rgba(155,155,155,0.5)";

const graphFuns = {
    plot_line: async (arr) => {
        assert(arr instanceof Collection, "Values is not a collection");

        const ys = arr.items.map(x => x.evaluate());
        const xs = range(new Fraction(0), new Fraction(ys.length));

        const data = {
            labels: xs,
            datasets: [{
                label: 'Dataset',
                data: ys,
                borderColor: line,
                backgroundColor: bg
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        };

        new Chart(document.getElementById(`${createCanvas()}`), config);

        log("Generating graph... Open the Generated Graphs menu to see the graph.");

        return true;
    },
    plot_functions: async (a, b, increment, ...fns) => {
        assertNotNull(a);
        assertNotNull(b);
        assertNotNull(increment);
        assertNotNull(fns);

        const xs = range(a, b.add(increment), increment).map(x => x.evaluate());

        let datasets = [];
        for (const fn of fns) {
            assert(fn instanceof AFn, "Values is not an anonymous function");

            const ys = xs.map(x => {
                try {
                    return fn.invoke(
                        new Fraction(x))
                        .evaluate();
                } catch (error) {
                    return null;
                }
            });

            datasets[datasets.length] = {
                label: `${fn.block.sourceString.trim()}`,
                data: ys,
                borderColor: `${getLineColour()}`,
                backgroundColor: bg
            }
        }

        const data = {
            labels: xs,
            datasets: datasets
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        };

        new Chart(document.getElementById(`${createCanvas()}`), config);

        log("Generating graph... Open the Generated Graphs menu to see the graph.");

        return true;
    }
}

registerNativeFns(graphFuns);
