<div align="center">
<h3>📚 Reject</h3>
<strong><a href="https://rebelofdeath.github.io/reject/editor">Editor</a> | <a href="https://github.com/RebelOfDeath/reject/wiki">Get started</a> | <a href="https://github.com/RebelOfDeath/reject">Source</a> | by <a href="https://github.com/Efnilite">Efnilite</a> & <a href="https://github.com/RebelOfDeath">RebelOfDeath</a> </strong>
<br><br>
</div>

This repo is the home of the Reject language and online editor. Reject is a dynamic and functional scripting language built for mathematical calculations or programs. Being easy to understand by design makes it easy for anyone, even those without prior programming experience, to pick up this language. It's primary purpose is to serve as a fast way to quickly calculate something. Of course, that isn't the limit of what it can do. Feel free to find the limit yourself in the Editor.

### Features
- Easy to learn and use
- Extensive mathematical functions
- Multiple useful (in math, at least) types, like imaginary numbers and matrices

### Contributing/building locally
If you want to contribute to Reject, try it out offline or modify some elements for yourself, you can do so by following the following steps. For contributing, forking this project will allow you to create PRs.

**Cloning to your local machine**

Use git clone or your IDE to clone the project to a local folder. 

```
git clone https://github.com/rebelofdeath/reject
```

**Adding new JS files**

If you have JS files that aren't mentioned in any `import` statement in `reject.js` or the default JS files, they won't be included in the bundle. To add them to the bundle, simply import them in `reject.js`, like below. [Example](https://github.com/RebelOfDeath/reject/blob/main/src/reject.js#L12).

```
import "./src/thing.js";
```

**Building and running**

Building the project requires you to have [Rollup](https://rollupjs.org/introduction/#installation) installed. To build it, enter the below command. This will compile all mentioned JS files (see above warning!) to a bundle, which can be shipped with the website. 

```
rollup --config rollup.config.js
```

After performing this command, you can open editor.html, and you're done!
