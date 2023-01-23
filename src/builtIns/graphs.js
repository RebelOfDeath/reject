import {AFn, registerNativeFns} from "../fn.js";
import Chart from 'chart.js/auto';
import {assert, assertNotNull, getLineColour, range} from "../util.js";
import {Collection} from "../collection.js";
import {Fraction} from "../fraction.js";

const line = "rgb(159,49,49)";
const bg = "rgba(155,155,155,0.5)";

const graphFuns = {
    plot_line: async (arr) => {
        assert(arr instanceof Collection, "Values is not a collection");

        const ys = arr.items.map(x => x.evaluate());
        const xs = range(0, ys.length);

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

        return true;
    },
    plot_function: async (a, b, increment, fn) => {
        assertNotNull(a);
        assertNotNull(b);
        assertNotNull(fn);
        assert(fn instanceof AFn, "Values is not an anonymous function");

        const xs = range(a.evaluate(), b.evaluate() + 1, increment.evaluate());
        const ys = xs.map(x => fn.invoke(new Fraction(x)).evaluate());

        const data = {
            labels: xs,
            datasets: [{
                label: `${fn.block.sourceString.trim()}`,
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

        return true;
    },
    plot_functions: async (a, b, increment, ...fns) => {
        assertNotNull(a);
        assertNotNull(b);
        assertNotNull(increment);
        assertNotNull(fns);

        const xs = range(a.evaluate(), b.evaluate() + increment.evaluate(), increment.evaluate());

        let datasets = [];
        for (const fn of fns) {
            assert(fn instanceof AFn, "Values is not an anonymous function");

            const ys = xs.map(x => fn.invoke(new Fraction(x)).evaluate());

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
        
        return true;
    }
}

registerNativeFns(graphFuns);
