import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';

export default {
    input: 'reject.js',
    output: {
        file: 'bundle.js',
        format: 'iife',
        name: 'rejectBundle'
    },
    plugins: [nodeResolve(), nodePolyfills()]
};