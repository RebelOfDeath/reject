var rejectBundle = (function () {
  'use strict';

  /// <reference types="../index.d.ts" />
  var main$1 = {exports: {}};

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  /*
    `Failure`s represent expressions that weren't matched while parsing. They are used to generate
    error messages automatically. The interface of `Failure`s includes the collowing methods:

    - getText() : String
    - getType() : String  (one of {"description", "string", "code"})
    - isDescription() : bool
    - isStringTerminal() : bool
    - isCode() : bool
    - isFluffy() : bool
    - makeFluffy() : void
    - subsumes(Failure) : bool
  */

  function isValidType(type) {
    return type === 'description' || type === 'string' || type === 'code';
  }

  function Failure$2(pexpr, text, type) {
    if (!isValidType(type)) {
      throw new Error('invalid Failure type: ' + type);
    }
    this.pexpr = pexpr;
    this.text = text;
    this.type = type;
    this.fluffy = false;
  }

  Failure$2.prototype.getPExpr = function() {
    return this.pexpr;
  };

  Failure$2.prototype.getText = function() {
    return this.text;
  };

  Failure$2.prototype.getType = function() {
    return this.type;
  };

  Failure$2.prototype.isDescription = function() {
    return this.type === 'description';
  };

  Failure$2.prototype.isStringTerminal = function() {
    return this.type === 'string';
  };

  Failure$2.prototype.isCode = function() {
    return this.type === 'code';
  };

  Failure$2.prototype.isFluffy = function() {
    return this.fluffy;
  };

  Failure$2.prototype.makeFluffy = function() {
    this.fluffy = true;
  };

  Failure$2.prototype.clearFluffy = function() {
    this.fluffy = false;
  };

  Failure$2.prototype.subsumes = function(that) {
    return (
      this.getText() === that.getText() &&
      this.type === that.type &&
      (!this.isFluffy() || (this.isFluffy() && that.isFluffy()))
    );
  };

  Failure$2.prototype.toString = function() {
    return this.type === 'string' ? JSON.stringify(this.getText()) : this.getText();
  };

  Failure$2.prototype.clone = function() {
    const failure = new Failure$2(this.pexpr, this.text, this.type);
    if (this.isFluffy()) {
      failure.makeFluffy();
    }
    return failure;
  };

  Failure$2.prototype.toKey = function() {
    return this.toString() + '#' + this.type;
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var Failure_1 = Failure$2;

  var common$l = {};

  (function (exports) {

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  exports.abstract = function(optMethodName) {
    const methodName = optMethodName || '';
    return function() {
      throw new Error(
          'this method ' +
          methodName +
          ' is abstract! ' +
          '(it has no implementation in class ' +
          this.constructor.name +
          ')'
      );
    };
  };

  exports.assert = function(cond, message) {
    if (!cond) {
      throw new Error(message || 'Assertion failed');
    }
  };

  // Define a lazily-computed, non-enumerable property named `propName`
  // on the object `obj`. `getterFn` will be called to compute the value the
  // first time the property is accessed.
  exports.defineLazyProperty = function(obj, propName, getterFn) {
    let memo;
    Object.defineProperty(obj, propName, {
      get() {
        if (!memo) {
          memo = getterFn.call(this);
        }
        return memo;
      },
    });
  };

  exports.clone = function(obj) {
    if (obj) {
      return Object.assign({}, obj);
    }
    return obj;
  };

  exports.repeatFn = function(fn, n) {
    const arr = [];
    while (n-- > 0) {
      arr.push(fn());
    }
    return arr;
  };

  exports.repeatStr = function(str, n) {
    return new Array(n + 1).join(str);
  };

  exports.repeat = function(x, n) {
    return exports.repeatFn(() => x, n);
  };

  exports.getDuplicates = function(array) {
    const duplicates = [];
    for (let idx = 0; idx < array.length; idx++) {
      const x = array[idx];
      if (array.lastIndexOf(x) !== idx && duplicates.indexOf(x) < 0) {
        duplicates.push(x);
      }
    }
    return duplicates;
  };

  exports.copyWithoutDuplicates = function(array) {
    const noDuplicates = [];
    array.forEach(entry => {
      if (noDuplicates.indexOf(entry) < 0) {
        noDuplicates.push(entry);
      }
    });
    return noDuplicates;
  };

  exports.isSyntactic = function(ruleName) {
    const firstChar = ruleName[0];
    return firstChar === firstChar.toUpperCase();
  };

  exports.isLexical = function(ruleName) {
    return !exports.isSyntactic(ruleName);
  };

  exports.padLeft = function(str, len, optChar) {
    const ch = optChar || ' ';
    if (str.length < len) {
      return exports.repeatStr(ch, len - str.length) + str;
    }
    return str;
  };

  // StringBuffer

  exports.StringBuffer = function() {
    this.strings = [];
  };

  exports.StringBuffer.prototype.append = function(str) {
    this.strings.push(str);
  };

  exports.StringBuffer.prototype.contents = function() {
    return this.strings.join('');
  };

  const escapeUnicode = str => String.fromCodePoint(parseInt(str, 16));

  exports.unescapeCodePoint = function(s) {
    if (s.charAt(0) === '\\') {
      switch (s.charAt(1)) {
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'v':
          return '\v';
        case 'x':
          return escapeUnicode(s.slice(2, 4));
        case 'u':
          return s.charAt(2) === '{' ?
            escapeUnicode(s.slice(3, -1)) :
            escapeUnicode(s.slice(2, 6));
        default:
          return s.charAt(1);
      }
    } else {
      return s;
    }
  };

  // Helper for producing a description of an unknown object in a safe way.
  // Especially useful for error messages where an unexpected type of object was encountered.
  exports.unexpectedObjToString = function(obj) {
    if (obj == null) {
      return String(obj);
    }
    const baseToString = Object.prototype.toString.call(obj);
    try {
      let typeName;
      if (obj.constructor && obj.constructor.name) {
        typeName = obj.constructor.name;
      } else if (baseToString.indexOf('[object ') === 0) {
        typeName = baseToString.slice(8, -1); // Extract e.g. "Array" from "[object Array]".
      } else {
        typeName = typeof obj;
      }
      return typeName + ': ' + JSON.stringify(String(obj));
    } catch (e) {
      return baseToString;
    }
  };
  }(common$l));

  const common$k = common$l;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  class Node {
    constructor(matchLength) {
      this.matchLength = matchLength;
    }

    get ctorName() {
      throw new Error('subclass responsibility');
    }

    numChildren() {
      return this.children ? this.children.length : 0;
    }

    childAt(idx) {
      if (this.children) {
        return this.children[idx];
      }
    }

    indexOfChild(arg) {
      return this.children.indexOf(arg);
    }

    hasChildren() {
      return this.numChildren() > 0;
    }

    hasNoChildren() {
      return !this.hasChildren();
    }

    onlyChild() {
      if (this.numChildren() !== 1) {
        throw new Error(
            'cannot get only child of a node of type ' +
            this.ctorName +
            ' (it has ' +
            this.numChildren() +
            ' children)'
        );
      } else {
        return this.firstChild();
      }
    }

    firstChild() {
      if (this.hasNoChildren()) {
        throw new Error(
            'cannot get first child of a ' + this.ctorName + ' node, which has no children'
        );
      } else {
        return this.childAt(0);
      }
    }

    lastChild() {
      if (this.hasNoChildren()) {
        throw new Error(
            'cannot get last child of a ' + this.ctorName + ' node, which has no children'
        );
      } else {
        return this.childAt(this.numChildren() - 1);
      }
    }

    childBefore(child) {
      const childIdx = this.indexOfChild(child);
      if (childIdx < 0) {
        throw new Error('Node.childBefore() called w/ an argument that is not a child');
      } else if (childIdx === 0) {
        throw new Error('cannot get child before first child');
      } else {
        return this.childAt(childIdx - 1);
      }
    }

    childAfter(child) {
      const childIdx = this.indexOfChild(child);
      if (childIdx < 0) {
        throw new Error('Node.childAfter() called w/ an argument that is not a child');
      } else if (childIdx === this.numChildren() - 1) {
        throw new Error('cannot get child after last child');
      } else {
        return this.childAt(childIdx + 1);
      }
    }

    isTerminal() {
      return false;
    }

    isNonterminal() {
      return false;
    }

    isIteration() {
      return false;
    }

    isOptional() {
      return false;
    }
  }

  // Terminals

  class TerminalNode$2 extends Node {
    get ctorName() {
      return '_terminal';
    }

    isTerminal() {
      return true;
    }

    get primitiveValue() {
      throw new Error('The `primitiveValue` property was removed in Ohm v17.');
    }
  }

  // Nonterminals

  class NonterminalNode$1 extends Node {
    constructor(ruleName, children, childOffsets, matchLength) {
      super(matchLength);
      this.ruleName = ruleName;
      this.children = children;
      this.childOffsets = childOffsets;
    }

    get ctorName() {
      return this.ruleName;
    }

    isNonterminal() {
      return true;
    }

    isLexical() {
      return common$k.isLexical(this.ctorName);
    }

    isSyntactic() {
      return common$k.isSyntactic(this.ctorName);
    }
  }

  // Iterations

  class IterationNode$2 extends Node {
    constructor(children, childOffsets, matchLength, isOptional) {
      super(matchLength);
      this.children = children;
      this.childOffsets = childOffsets;
      this.optional = isOptional;
    }

    get ctorName() {
      return '_iter';
    }

    isIteration() {
      return true;
    }

    isOptional() {
      return this.optional;
    }
  }

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var nodes$1 = {
    Node,
    TerminalNode: TerminalNode$2,
    NonterminalNode: NonterminalNode$1,
    IterationNode: IterationNode$2,
  };

  var pexprsMain = {};

  // Based on https://github.com/mathiasbynens/unicode-9.0.0.
  // These are just categories that are used in ES5/ES2015.
  // The full list of Unicode categories is here: http://www.fileformat.info/info/unicode/category/index.htm.
  var UnicodeCategories$1 = {
    // Letters
    Lu: /[A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A]|\uD801[\uDC00-\uDC27\uDCB0-\uDCD3]|\uD803[\uDC80-\uDCB2]|\uD806[\uDCA0-\uDCBF]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]|\uD83A[\uDD00-\uDD21]/,
    Ll: /[a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1C80-\u1C88\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A]|\uD801[\uDC28-\uDC4F\uDCD8-\uDCFB]|\uD803[\uDCC0-\uDCF2]|\uD806[\uDCC0-\uDCDF]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD83A[\uDD22-\uDD43]/,
    Lt: /[\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC]/,
    Lm: /[\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5\u06E6\u07F4\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C\uA69D\uA717-\uA71F\uA770\uA788\uA7F8\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3\uAAF4\uAB5C-\uAB5F\uFF70\uFF9E\uFF9F]|\uD81A[\uDF40-\uDF43]|\uD81B[\uDF93-\uDF9F\uDFE0]/,
    Lo: /[\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05F0-\u05F2\u0620-\u063F\u0641-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E45\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10D0-\u10FA\u10FD-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC50-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,

    // Numbers
    Nl: /[\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF]|\uD800[\uDD40-\uDD74\uDF41\uDF4A\uDFD1-\uDFD5]|\uD809[\uDC00-\uDC6E]/,
    Nd: /[0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19]|\uD801[\uDCA0-\uDCA9]|\uD804[\uDC66-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDEF0-\uDEF9]|[\uD805\uD807][\uDC50-\uDC59\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF39]|\uD806[\uDCE0-\uDCE9]|\uD81A[\uDE60-\uDE69\uDF50-\uDF59]|\uD835[\uDFCE-\uDFFF]|\uD83A[\uDD50-\uDD59]/,

    // Marks
    Mn: /[\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D4-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D01\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFB-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA8C4\uA8C5\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD804[\uDC01\uDC38-\uDC46\uDC7F-\uDC81\uDCB3-\uDCB6\uDCB9\uDCBA\uDD00-\uDD02\uDD27-\uDD2B\uDD2D-\uDD34\uDD73\uDD80\uDD81\uDDB6-\uDDBE\uDDCA-\uDDCC\uDE2F-\uDE31\uDE34\uDE36\uDE37\uDE3E\uDEDF\uDEE3-\uDEEA\uDF00\uDF01\uDF3C\uDF40\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC38-\uDC3F\uDC42-\uDC44\uDC46\uDCB3-\uDCB8\uDCBA\uDCBF\uDCC0\uDCC2\uDCC3\uDDB2-\uDDB5\uDDBC\uDDBD\uDDBF\uDDC0\uDDDC\uDDDD\uDE33-\uDE3A\uDE3D\uDE3F\uDE40\uDEAB\uDEAD\uDEB0-\uDEB5\uDEB7\uDF1D-\uDF1F\uDF22-\uDF25\uDF27-\uDF2B]|\uD807[\uDC30-\uDC36\uDC38-\uDC3D\uDC3F\uDC92-\uDCA7\uDCAA-\uDCB0\uDCB2\uDCB3\uDCB5\uDCB6]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDD00-\uDDEF]/,
    Mc: /[\u0903-\u0903]|[\u093E-\u0940]|[\u0949-\u094C]|[\u0982-\u0983]|[\u09BE-\u09C0]|[\u09C7-\u09C8]|[\u09CB-\u09CC]|[\u09D7-\u09D7]|[\u0A3E-\u0A40]|[\u0A83-\u0A83]|[\u0ABE-\u0AC0]|[\u0AC9-\u0AC9]|[\u0ACB-\u0ACC]|[\u0B02-\u0B03]|[\u0B3E-\u0B3E]|[\u0B40-\u0B40]|[\u0B47-\u0B48]|[\u0B4B-\u0B4C]|[\u0B57-\u0B57]|[\u0B83-\u0B83]|[\u0BBE-\u0BBF]|[\u0BC1-\u0BC2]|[\u0BC6-\u0BC8]|[\u0BCA-\u0BCC]|[\u0BD7-\u0BD7]|[\u0C01-\u0C03]|[\u0C41-\u0C44]|[\u0C82-\u0C83]|[\u0CBE-\u0CBE]|[\u0CC0-\u0CC4]|[\u0CC7-\u0CC8]|[\u0CCA-\u0CCB]|[\u0CD5-\u0CD6]|[\u0D02-\u0D03]|[\u0D3E-\u0D40]|[\u0D46-\u0D48]|[\u0D4A-\u0D4C]|[\u0D57-\u0D57]|[\u0F3E-\u0F3F]|[\u0F7F-\u0F7F]/,

    // Punctuation, Connector
    Pc: /[_\u203F\u2040\u2054\uFE33\uFE34\uFE4D-\uFE4F\uFF3F]/,

    // Separator, Space
    Zs: /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,

    // These two are not real Unicode categories, but our useful for Ohm.
    // L is a combination of all the letter categories.
    // Ltmo is a combination of Lt, Lm, and Lo.
    L: /[A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,
    Ltmo: /[\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC]|[\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5\u06E6\u07F4\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C\uA69D\uA717-\uA71F\uA770\uA788\uA7F8\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3\uAAF4\uAB5C-\uAB5F\uFF70\uFF9E\uFF9F]|\uD81A[\uDF40-\uDF43]|\uD81B[\uDF93-\uDF9F\uDFE0]|[\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05F0-\u05F2\u0620-\u063F\u0641-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E45\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10D0-\u10FA\u10FD-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC50-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const UnicodeCategories = UnicodeCategories$1;
  const common$j = common$l;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  // General stuff

  class PExpr$1 {
    constructor() {
      if (this.constructor === PExpr$1) {
        throw new Error("PExpr cannot be instantiated -- it's abstract");
      }
    }

    // Set the `source` property to the interval containing the source for this expression.
    withSource(interval) {
      if (interval) {
        this.source = interval.trimmed();
      }
      return this;
    }
  }

  // Any

  const any = Object.create(PExpr$1.prototype);

  // End

  const end = Object.create(PExpr$1.prototype);

  // Terminals

  class Terminal$1 extends PExpr$1 {
    constructor(obj) {
      super();
      this.obj = obj;
    }
  }

  // Ranges

  class Range extends PExpr$1 {
    constructor(from, to) {
      super();
      this.from = from;
      this.to = to;
      // If either `from` or `to` is made up of multiple code units, then
      // the range should consume a full code point, not a single code unit.
      this.matchCodePoint = from.length > 1 || to.length > 1;
    }
  }

  // Parameters

  class Param extends PExpr$1 {
    constructor(index) {
      super();
      this.index = index;
    }
  }

  // Alternation

  class Alt extends PExpr$1 {
    constructor(terms) {
      super();
      this.terms = terms;
    }
  }

  // Extend is an implementation detail of rule extension

  class Extend extends Alt {
    constructor(superGrammar, name, body) {
      const origBody = superGrammar.rules[name].body;
      super([body, origBody]);

      this.superGrammar = superGrammar;
      this.name = name;
      this.body = body;
    }
  }

  // Splice is an implementation detail of rule overriding with the `...` operator.
  class Splice extends Alt {
    constructor(superGrammar, ruleName, beforeTerms, afterTerms) {
      const origBody = superGrammar.rules[ruleName].body;
      super([...beforeTerms, origBody, ...afterTerms]);

      this.superGrammar = superGrammar;
      this.ruleName = ruleName;
      this.expansionPos = beforeTerms.length;
    }
  }

  // Sequences

  class Seq extends PExpr$1 {
    constructor(factors) {
      super();
      this.factors = factors;
    }
  }

  // Iterators and optionals

  class Iter extends PExpr$1 {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  }

  class Star extends Iter {}
  class Plus extends Iter {}
  class Opt extends Iter {}

  Star.prototype.operator = '*';
  Plus.prototype.operator = '+';
  Opt.prototype.operator = '?';

  Star.prototype.minNumMatches = 0;
  Plus.prototype.minNumMatches = 1;
  Opt.prototype.minNumMatches = 0;

  Star.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
  Plus.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
  Opt.prototype.maxNumMatches = 1;

  // Predicates

  class Not extends PExpr$1 {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  }

  class Lookahead extends PExpr$1 {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  }

  // "Lexification"

  class Lex extends PExpr$1 {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  }

  // Rule application

  class Apply extends PExpr$1 {
    constructor(ruleName, args = []) {
      super();
      this.ruleName = ruleName;
      this.args = args;
    }

    isSyntactic() {
      return common$j.isSyntactic(this.ruleName);
    }

    // This method just caches the result of `this.toString()` in a non-enumerable property.
    toMemoKey() {
      if (!this._memoKey) {
        Object.defineProperty(this, '_memoKey', {value: this.toString()});
      }
      return this._memoKey;
    }
  }

  // Unicode character

  class UnicodeChar extends PExpr$1 {
    constructor(category) {
      super();
      this.category = category;
      this.pattern = UnicodeCategories[category];
    }
  }

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  pexprsMain.PExpr = PExpr$1;
  pexprsMain.any = any;
  pexprsMain.end = end;
  pexprsMain.Terminal = Terminal$1;
  pexprsMain.Range = Range;
  pexprsMain.Param = Param;
  pexprsMain.Alt = Alt;
  pexprsMain.Extend = Extend;
  pexprsMain.Splice = Splice;
  pexprsMain.Seq = Seq;
  pexprsMain.Iter = Iter;
  pexprsMain.Star = Star;
  pexprsMain.Plus = Plus;
  pexprsMain.Opt = Opt;
  pexprsMain.Not = Not;
  pexprsMain.Lookahead = Lookahead;
  pexprsMain.Lex = Lex;
  pexprsMain.Apply = Apply;
  pexprsMain.UnicodeChar = UnicodeChar;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$i = common$l;
  const pexprs$l = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Return true if we should skip spaces preceding this expression in a syntactic context.
  */
  pexprs$l.PExpr.prototype.allowsSkippingPrecedingSpace = common$i.abstract(
      'allowsSkippingPrecedingSpace'
  );

  /*
    Generally, these are all first-order expressions and (with the exception of Apply)
    directly read from the input stream.
  */
  pexprs$l.any.allowsSkippingPrecedingSpace =
    pexprs$l.end.allowsSkippingPrecedingSpace =
    pexprs$l.Apply.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.Terminal.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.Range.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.UnicodeChar.prototype.allowsSkippingPrecedingSpace =
      function() {
        return true;
      };

  /*
    Higher-order expressions that don't directly consume input.
  */
  pexprs$l.Alt.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.Iter.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.Lex.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.Lookahead.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.Not.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.Param.prototype.allowsSkippingPrecedingSpace =
    pexprs$l.Seq.prototype.allowsSkippingPrecedingSpace =
      function() {
        return false;
      };

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function Namespace$2() {}
  Namespace$2.prototype = Object.create(null);

  Namespace$2.asNamespace = function(objOrNamespace) {
    if (objOrNamespace instanceof Namespace$2) {
      return objOrNamespace;
    }
    return Namespace$2.createNamespace(objOrNamespace);
  };

  // Create a new namespace. If `optProps` is specified, all of its properties
  // will be copied to the new namespace.
  Namespace$2.createNamespace = function(optProps) {
    return Namespace$2.extend(Namespace$2.prototype, optProps);
  };

  // Create a new namespace which extends another namespace. If `optProps` is
  // specified, all of its properties will be copied to the new namespace.
  Namespace$2.extend = function(namespace, optProps) {
    if (namespace !== Namespace$2.prototype && !(namespace instanceof Namespace$2)) {
      throw new TypeError('not a Namespace object: ' + namespace);
    }
    const ns = Object.create(namespace, {
      constructor: {
        value: Namespace$2,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
    return Object.assign(ns, optProps);
  };

  // TODO: Should this be a regular method?
  Namespace$2.toString = function(ns) {
    return Object.prototype.toString.call(ns);
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var Namespace_1 = Namespace$2;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const {assert: assert$3} = common$l;
  const Namespace$1 = Namespace_1;
  const pexprs$k = pexprsMain;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function createError(message, optInterval) {
    let e;
    if (optInterval) {
      e = new Error(optInterval.getLineAndColumnMessage() + message);
      e.shortMessage = message;
      e.interval = optInterval;
    } else {
      e = new Error(message);
    }
    return e;
  }

  // ----------------- errors about intervals -----------------

  function intervalSourcesDontMatch() {
    return createError("Interval sources don't match");
  }

  // ----------------- errors about grammars -----------------

  // Grammar syntax error

  function grammarSyntaxError(matchFailure) {
    const e = new Error();
    Object.defineProperty(e, 'message', {
      enumerable: true,
      get() {
        return matchFailure.message;
      },
    });
    Object.defineProperty(e, 'shortMessage', {
      enumerable: true,
      get() {
        return 'Expected ' + matchFailure.getExpectedText();
      },
    });
    e.interval = matchFailure.getInterval();
    return e;
  }

  // Undeclared grammar

  function undeclaredGrammar(grammarName, namespace, interval) {
    const message = namespace ?
      'Grammar ' +
        grammarName +
        ' is not declared in namespace ' +
        Namespace$1.toString(namespace) :
      'Undeclared grammar ' + grammarName;
    return createError(message, interval);
  }

  // Duplicate grammar declaration

  function duplicateGrammarDeclaration(grammar, namespace) {
    return createError('Grammar ' + grammar.name + ' is already declared in this namespace');
  }

  // ----------------- rules -----------------

  // Undeclared rule

  function undeclaredRule(ruleName, grammarName, optInterval) {
    return createError(
        'Rule ' + ruleName + ' is not declared in grammar ' + grammarName,
        optInterval
    );
  }

  // Cannot override undeclared rule

  function cannotOverrideUndeclaredRule(ruleName, grammarName, optSource) {
    return createError(
        'Cannot override rule ' + ruleName + ' because it is not declared in ' + grammarName,
        optSource
    );
  }

  // Cannot extend undeclared rule

  function cannotExtendUndeclaredRule(ruleName, grammarName, optSource) {
    return createError(
        'Cannot extend rule ' + ruleName + ' because it is not declared in ' + grammarName,
        optSource
    );
  }

  // Duplicate rule declaration

  function duplicateRuleDeclaration(ruleName, grammarName, declGrammarName, optSource) {
    let message =
      "Duplicate declaration for rule '" + ruleName + "' in grammar '" + grammarName + "'";
    if (grammarName !== declGrammarName) {
      message += " (originally declared in '" + declGrammarName + "')";
    }
    return createError(message, optSource);
  }

  // Wrong number of parameters

  function wrongNumberOfParameters(ruleName, expected, actual, source) {
    return createError(
        'Wrong number of parameters for rule ' +
        ruleName +
        ' (expected ' +
        expected +
        ', got ' +
        actual +
        ')',
        source
    );
  }

  // Wrong number of arguments

  function wrongNumberOfArguments(ruleName, expected, actual, expr) {
    return createError(
        'Wrong number of arguments for rule ' +
        ruleName +
        ' (expected ' +
        expected +
        ', got ' +
        actual +
        ')',
        expr
    );
  }

  // Duplicate parameter names

  function duplicateParameterNames(ruleName, duplicates, source) {
    return createError(
        'Duplicate parameter names in rule ' + ruleName + ': ' + duplicates.join(', '),
        source
    );
  }

  // Invalid parameter expression

  function invalidParameter(ruleName, expr) {
    return createError(
        'Invalid parameter to rule ' +
        ruleName +
        ': ' +
        expr +
        ' has arity ' +
        expr.getArity() +
        ', but parameter expressions must have arity 1',
        expr.source
    );
  }

  // Application of syntactic rule from lexical rule

  const syntacticVsLexicalNote =
    'NOTE: A _syntactic rule_ is a rule whose name begins with a capital letter. ' +
    'See https://ohmjs.org/d/svl for more details.';

  function applicationOfSyntacticRuleFromLexicalContext(ruleName, applyExpr) {
    return createError(
        'Cannot apply syntactic rule ' + ruleName + ' from here (inside a lexical context)',
        applyExpr.source
    );
  }

  // Lexical rule application used with applySyntactic

  function applySyntacticWithLexicalRuleApplication(applyExpr) {
    const {ruleName} = applyExpr;
    return createError(
        `applySyntactic is for syntactic rules, but '${ruleName}' is a lexical rule. ` +
        syntacticVsLexicalNote,
        applyExpr.source
    );
  }

  // Application of applySyntactic in a syntactic context

  function unnecessaryExperimentalApplySyntactic(applyExpr) {
    return createError(
        'applySyntactic is not required here (in a syntactic context)',
        applyExpr.source
    );
  }

  // Incorrect argument type

  function incorrectArgumentType(expectedType, expr) {
    return createError('Incorrect argument type: expected ' + expectedType, expr.source);
  }

  // Multiple instances of the super-splice operator (`...`) in the rule body.

  function multipleSuperSplices(expr) {
    return createError("'...' can appear at most once in a rule body", expr.source);
  }

  // Unicode code point escapes

  function invalidCodePoint(applyWrapper) {
    const node = applyWrapper._node;
    assert$3(node && node.isNonterminal() && node.ctorName === 'escapeChar_unicodeCodePoint');

    // Get an interval that covers all of the hex digits.
    const digitIntervals = applyWrapper.children.slice(1, -1).map(d => d.source);
    const fullInterval = digitIntervals[0].coverageWith(...digitIntervals.slice(1));
    return createError(
        `U+${fullInterval.contents} is not a valid Unicode code point`,
        fullInterval
    );
  }

  // ----------------- Kleene operators -----------------

  function kleeneExprHasNullableOperand(kleeneExpr, applicationStack) {
    const actuals =
      applicationStack.length > 0 ? applicationStack[applicationStack.length - 1].args : [];
    const expr = kleeneExpr.expr.substituteParams(actuals);
    let message =
      'Nullable expression ' +
      expr +
      " is not allowed inside '" +
      kleeneExpr.operator +
      "' (possible infinite loop)";
    if (applicationStack.length > 0) {
      const stackTrace = applicationStack
          .map(app => new pexprs$k.Apply(app.ruleName, app.args))
          .join('\n');
      message += '\nApplication stack (most recent application last):\n' + stackTrace;
    }
    return createError(message, kleeneExpr.expr.source);
  }

  // ----------------- arity -----------------

  function inconsistentArity(ruleName, expected, actual, expr) {
    return createError(
        'Rule ' +
        ruleName +
        ' involves an alternation which has inconsistent arity ' +
        '(expected ' +
        expected +
        ', got ' +
        actual +
        ')',
        expr.source
    );
  }

  // ----------------- properties -----------------

  function duplicatePropertyNames(duplicates) {
    return createError('Object pattern has duplicate property names: ' + duplicates.join(', '));
  }

  // ----------------- constructors -----------------

  function invalidConstructorCall(grammar, ctorName, children) {
    return createError(
        'Attempt to invoke constructor ' + ctorName + ' with invalid or unexpected arguments'
    );
  }

  // ----------------- convenience -----------------

  function multipleErrors(errors) {
    const messages = errors.map(e => e.message);
    return createError(['Errors:'].concat(messages).join('\n- '), errors[0].interval);
  }

  // ----------------- semantic -----------------

  function missingSemanticAction(ctorName, name, type, stack) {
    let stackTrace = stack
        .slice(0, -1)
        .map(info => {
          const ans = '  ' + info[0].name + ' > ' + info[1];
          return info.length === 3 ? ans + " for '" + info[2] + "'" : ans;
        })
        .join('\n');
    stackTrace += '\n  ' + name + ' > ' + ctorName;

    let moreInfo = '';
    if (ctorName === '_iter') {
      moreInfo = [
        '\nNOTE: as of Ohm v16, there is no default action for iteration nodes — see ',
        '  https://ohmjs.org/d/dsa for details.',
      ].join('\n');
    }

    const message = [
      `Missing semantic action for '${ctorName}' in ${type} '${name}'.${moreInfo}`,
      'Action stack (most recent call last):',
      stackTrace,
    ].join('\n');

    const e = createError(message);
    e.name = 'missingSemanticAction';
    return e;
  }

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var errors$9 = {
    applicationOfSyntacticRuleFromLexicalContext,
    applySyntacticWithLexicalRuleApplication,
    cannotExtendUndeclaredRule,
    cannotOverrideUndeclaredRule,
    duplicateGrammarDeclaration,
    duplicateParameterNames,
    duplicatePropertyNames,
    duplicateRuleDeclaration,
    inconsistentArity,
    incorrectArgumentType,
    intervalSourcesDontMatch,
    invalidCodePoint,
    invalidConstructorCall,
    invalidParameter,
    grammarSyntaxError,
    kleeneExprHasNullableOperand,
    missingSemanticAction,
    multipleSuperSplices,
    undeclaredGrammar,
    undeclaredRule,
    unnecessaryExperimentalApplySyntactic,
    wrongNumberOfArguments,
    wrongNumberOfParameters,

    throwErrors(errors) {
      if (errors.length === 1) {
        throw errors[0];
      }
      if (errors.length > 1) {
        throw multipleErrors(errors);
      }
    },
  };

  var util$7 = {};

  (function (exports) {

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common = common$l;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  // Given an array of numbers `arr`, return an array of the numbers as strings,
  // right-justified and padded to the same length.
  function padNumbersToEqualLength(arr) {
    let maxLen = 0;
    const strings = arr.map(n => {
      const str = n.toString();
      maxLen = Math.max(maxLen, str.length);
      return str;
    });
    return strings.map(s => common.padLeft(s, maxLen));
  }

  // Produce a new string that would be the result of copying the contents
  // of the string `src` onto `dest` at offset `offest`.
  function strcpy(dest, src, offset) {
    const origDestLen = dest.length;
    const start = dest.slice(0, offset);
    const end = dest.slice(offset + src.length);
    return (start + src + end).substr(0, origDestLen);
  }

  // Casts the underlying lineAndCol object to a formatted message string,
  // highlighting `ranges`.
  function lineAndColumnToMessage(...ranges) {
    const lineAndCol = this;
    const {offset} = lineAndCol;
    const {repeatStr} = common;

    const sb = new common.StringBuffer();
    sb.append('Line ' + lineAndCol.lineNum + ', col ' + lineAndCol.colNum + ':\n');

    // An array of the previous, current, and next line numbers as strings of equal length.
    const lineNumbers = padNumbersToEqualLength([
      lineAndCol.prevLine == null ? 0 : lineAndCol.lineNum - 1,
      lineAndCol.lineNum,
      lineAndCol.nextLine == null ? 0 : lineAndCol.lineNum + 1,
    ]);

    // Helper for appending formatting input lines to the buffer.
    const appendLine = (num, content, prefix) => {
      sb.append(prefix + lineNumbers[num] + ' | ' + content + '\n');
    };

    // Include the previous line for context if possible.
    if (lineAndCol.prevLine != null) {
      appendLine(0, lineAndCol.prevLine, '  ');
    }
    // Line that the error occurred on.
    appendLine(1, lineAndCol.line, '> ');

    // Build up the line that points to the offset and possible indicates one or more ranges.
    // Start with a blank line, and indicate each range by overlaying a string of `~` chars.
    const lineLen = lineAndCol.line.length;
    let indicationLine = repeatStr(' ', lineLen + 1);
    for (let i = 0; i < ranges.length; ++i) {
      let startIdx = ranges[i][0];
      let endIdx = ranges[i][1];
      common.assert(startIdx >= 0 && startIdx <= endIdx, 'range start must be >= 0 and <= end');

      const lineStartOffset = offset - lineAndCol.colNum + 1;
      startIdx = Math.max(0, startIdx - lineStartOffset);
      endIdx = Math.min(endIdx - lineStartOffset, lineLen);

      indicationLine = strcpy(indicationLine, repeatStr('~', endIdx - startIdx), startIdx);
    }
    const gutterWidth = 2 + lineNumbers[1].length + 3;
    sb.append(repeatStr(' ', gutterWidth));
    indicationLine = strcpy(indicationLine, '^', lineAndCol.colNum - 1);
    sb.append(indicationLine.replace(/ +$/, '') + '\n');

    // Include the next line for context if possible.
    if (lineAndCol.nextLine != null) {
      appendLine(2, lineAndCol.nextLine, '  ');
    }
    return sb.contents();
  }

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  let builtInRulesCallbacks = [];

  // Since Grammar.BuiltInRules is bootstrapped, most of Ohm can't directly depend it.
  // This function allows modules that do depend on the built-in rules to register a callback
  // that will be called later in the initialization process.
  exports.awaitBuiltInRules = cb => {
    builtInRulesCallbacks.push(cb);
  };

  exports.announceBuiltInRules = grammar => {
    builtInRulesCallbacks.forEach(cb => {
      cb(grammar);
    });
    builtInRulesCallbacks = null;
  };

  // Return an object with the line and column information for the given
  // offset in `str`.
  exports.getLineAndColumn = (str, offset) => {
    let lineNum = 1;
    let colNum = 1;

    let currOffset = 0;
    let lineStartOffset = 0;

    let nextLine = null;
    let prevLine = null;
    let prevLineStartOffset = -1;

    while (currOffset < offset) {
      const c = str.charAt(currOffset++);
      if (c === '\n') {
        lineNum++;
        colNum = 1;
        prevLineStartOffset = lineStartOffset;
        lineStartOffset = currOffset;
      } else if (c !== '\r') {
        colNum++;
      }
    }

    // Find the end of the target line.
    let lineEndOffset = str.indexOf('\n', lineStartOffset);
    if (lineEndOffset === -1) {
      lineEndOffset = str.length;
    } else {
      // Get the next line.
      const nextLineEndOffset = str.indexOf('\n', lineEndOffset + 1);
      nextLine =
        nextLineEndOffset === -1 ?
          str.slice(lineEndOffset) :
          str.slice(lineEndOffset, nextLineEndOffset);
      // Strip leading and trailing EOL char(s).
      nextLine = nextLine.replace(/^\r?\n/, '').replace(/\r$/, '');
    }

    // Get the previous line.
    if (prevLineStartOffset >= 0) {
      // Strip trailing EOL char(s).
      prevLine = str.slice(prevLineStartOffset, lineStartOffset).replace(/\r?\n$/, '');
    }

    // Get the target line, stripping a trailing carriage return if necessary.
    const line = str.slice(lineStartOffset, lineEndOffset).replace(/\r$/, '');

    return {
      offset,
      lineNum,
      colNum,
      line,
      prevLine,
      nextLine,
      toString: lineAndColumnToMessage,
    };
  };

  // Return a nicely-formatted string describing the line and column for the
  // given offset in `str` highlighting `ranges`.
  exports.getLineAndColumnMessage = function(str, offset, ...ranges) {
    return exports.getLineAndColumn(str, offset).toString(...ranges);
  };

  exports.uniqueId = (() => {
    let idCounter = 0;
    return prefix => '' + prefix + idCounter++;
  })();
  }(util$7));

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const {abstract: abstract$1, isSyntactic} = common$l;
  const errors$8 = errors$9;
  const pexprs$j = pexprsMain;
  const util$6 = util$7;

  let BuiltInRules;

  util$6.awaitBuiltInRules(g => {
    BuiltInRules = g;
  });

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  let lexifyCount;

  pexprs$j.PExpr.prototype.assertAllApplicationsAreValid = function(ruleName, grammar) {
    lexifyCount = 0;
    this._assertAllApplicationsAreValid(ruleName, grammar);
  };

  pexprs$j.PExpr.prototype._assertAllApplicationsAreValid = abstract$1(
      '_assertAllApplicationsAreValid'
  );

  pexprs$j.any._assertAllApplicationsAreValid =
    pexprs$j.end._assertAllApplicationsAreValid =
    pexprs$j.Terminal.prototype._assertAllApplicationsAreValid =
    pexprs$j.Range.prototype._assertAllApplicationsAreValid =
    pexprs$j.Param.prototype._assertAllApplicationsAreValid =
    pexprs$j.UnicodeChar.prototype._assertAllApplicationsAreValid =
      function(ruleName, grammar) {
        // no-op
      };

  pexprs$j.Lex.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
    lexifyCount++;
    this.expr._assertAllApplicationsAreValid(ruleName, grammar);
    lexifyCount--;
  };

  pexprs$j.Alt.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      this.terms[idx]._assertAllApplicationsAreValid(ruleName, grammar);
    }
  };

  pexprs$j.Seq.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx]._assertAllApplicationsAreValid(ruleName, grammar);
    }
  };

  pexprs$j.Iter.prototype._assertAllApplicationsAreValid =
    pexprs$j.Not.prototype._assertAllApplicationsAreValid =
    pexprs$j.Lookahead.prototype._assertAllApplicationsAreValid =
      function(ruleName, grammar) {
        this.expr._assertAllApplicationsAreValid(ruleName, grammar);
      };

  pexprs$j.Apply.prototype._assertAllApplicationsAreValid = function(
      ruleName,
      grammar,
      skipSyntacticCheck = false
  ) {
    const ruleInfo = grammar.rules[this.ruleName];
    const isContextSyntactic = isSyntactic(ruleName) && lexifyCount === 0;

    // Make sure that the rule exists...
    if (!ruleInfo) {
      throw errors$8.undeclaredRule(this.ruleName, grammar.name, this.source);
    }

    // ...and that this application is allowed
    if (!skipSyntacticCheck && isSyntactic(this.ruleName) && !isContextSyntactic) {
      throw errors$8.applicationOfSyntacticRuleFromLexicalContext(this.ruleName, this);
    }

    // ...and that this application has the correct number of arguments.
    const actual = this.args.length;
    const expected = ruleInfo.formals.length;
    if (actual !== expected) {
      throw errors$8.wrongNumberOfArguments(this.ruleName, expected, actual, this.source);
    }

    const isBuiltInApplySyntactic =
      BuiltInRules && ruleInfo === BuiltInRules.rules.applySyntactic;
    const isBuiltInCaseInsensitive =
      BuiltInRules && ruleInfo === BuiltInRules.rules.caseInsensitive;

    // If it's an application of 'caseInsensitive', ensure that the argument is a Terminal.
    if (isBuiltInCaseInsensitive) {
      if (!(this.args[0] instanceof pexprs$j.Terminal)) {
        throw errors$8.incorrectArgumentType('a Terminal (e.g. "abc")', this.args[0]);
      }
    }

    if (isBuiltInApplySyntactic) {
      const arg = this.args[0];
      if (!(arg instanceof pexprs$j.Apply)) {
        throw errors$8.incorrectArgumentType('a syntactic rule application', arg);
      }
      if (!isSyntactic(arg.ruleName)) {
        throw errors$8.applySyntacticWithLexicalRuleApplication(arg);
      }
      if (isContextSyntactic) {
        throw errors$8.unnecessaryExperimentalApplySyntactic(this);
      }
    }

    // ...and that all of the argument expressions only have valid applications and have arity 1.
    // If `this` is an application of the built-in applySyntactic rule, then its arg is
    // allowed (and expected) to be a syntactic rule, even if we're in a lexical context.
    this.args.forEach(arg => {
      arg._assertAllApplicationsAreValid(ruleName, grammar, isBuiltInApplySyntactic);
      if (arg.getArity() !== 1) {
        throw errors$8.invalidParameter(this.ruleName, arg);
      }
    });
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$h = common$l;
  const errors$7 = errors$9;
  const pexprs$i = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  pexprs$i.PExpr.prototype.assertChoicesHaveUniformArity = common$h.abstract(
      'assertChoicesHaveUniformArity'
  );

  pexprs$i.any.assertChoicesHaveUniformArity =
    pexprs$i.end.assertChoicesHaveUniformArity =
    pexprs$i.Terminal.prototype.assertChoicesHaveUniformArity =
    pexprs$i.Range.prototype.assertChoicesHaveUniformArity =
    pexprs$i.Param.prototype.assertChoicesHaveUniformArity =
    pexprs$i.Lex.prototype.assertChoicesHaveUniformArity =
    pexprs$i.UnicodeChar.prototype.assertChoicesHaveUniformArity =
      function(ruleName) {
        // no-op
      };

  pexprs$i.Alt.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    if (this.terms.length === 0) {
      return;
    }
    const arity = this.terms[0].getArity();
    for (let idx = 0; idx < this.terms.length; idx++) {
      const term = this.terms[idx];
      term.assertChoicesHaveUniformArity();
      const otherArity = term.getArity();
      if (arity !== otherArity) {
        throw errors$7.inconsistentArity(ruleName, arity, otherArity, term);
      }
    }
  };

  pexprs$i.Extend.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    // Extend is a special case of Alt that's guaranteed to have exactly two
    // cases: [extensions, origBody].
    const actualArity = this.terms[0].getArity();
    const expectedArity = this.terms[1].getArity();
    if (actualArity !== expectedArity) {
      throw errors$7.inconsistentArity(ruleName, expectedArity, actualArity, this.terms[0]);
    }
  };

  pexprs$i.Seq.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx].assertChoicesHaveUniformArity(ruleName);
    }
  };

  pexprs$i.Iter.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    this.expr.assertChoicesHaveUniformArity(ruleName);
  };

  pexprs$i.Not.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    // no-op (not required b/c the nested expr doesn't show up in the CST)
  };

  pexprs$i.Lookahead.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    this.expr.assertChoicesHaveUniformArity(ruleName);
  };

  pexprs$i.Apply.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    // The arities of the parameter expressions is required to be 1 by
    // `assertAllApplicationsAreValid()`.
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$g = common$l;
  const errors$6 = errors$9;
  const pexprs$h = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  pexprs$h.PExpr.prototype.assertIteratedExprsAreNotNullable = common$g.abstract(
      'assertIteratedExprsAreNotNullable'
  );

  pexprs$h.any.assertIteratedExprsAreNotNullable =
    pexprs$h.end.assertIteratedExprsAreNotNullable =
    pexprs$h.Terminal.prototype.assertIteratedExprsAreNotNullable =
    pexprs$h.Range.prototype.assertIteratedExprsAreNotNullable =
    pexprs$h.Param.prototype.assertIteratedExprsAreNotNullable =
    pexprs$h.UnicodeChar.prototype.assertIteratedExprsAreNotNullable =
      function(grammar) {
        // no-op
      };

  pexprs$h.Alt.prototype.assertIteratedExprsAreNotNullable = function(grammar) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      this.terms[idx].assertIteratedExprsAreNotNullable(grammar);
    }
  };

  pexprs$h.Seq.prototype.assertIteratedExprsAreNotNullable = function(grammar) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx].assertIteratedExprsAreNotNullable(grammar);
    }
  };

  pexprs$h.Iter.prototype.assertIteratedExprsAreNotNullable = function(grammar) {
    // Note: this is the implementation of this method for `Star` and `Plus` expressions.
    // It is overridden for `Opt` below.
    this.expr.assertIteratedExprsAreNotNullable(grammar);
    if (this.expr.isNullable(grammar)) {
      throw errors$6.kleeneExprHasNullableOperand(this, []);
    }
  };

  pexprs$h.Opt.prototype.assertIteratedExprsAreNotNullable =
    pexprs$h.Not.prototype.assertIteratedExprsAreNotNullable =
    pexprs$h.Lookahead.prototype.assertIteratedExprsAreNotNullable =
    pexprs$h.Lex.prototype.assertIteratedExprsAreNotNullable =
      function(grammar) {
        this.expr.assertIteratedExprsAreNotNullable(grammar);
      };

  pexprs$h.Apply.prototype.assertIteratedExprsAreNotNullable = function(grammar) {
    this.args.forEach(arg => {
      arg.assertIteratedExprsAreNotNullable(grammar);
    });
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const {assert: assert$2} = common$l;
  const errors$5 = errors$9;
  const util$5 = util$7;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function Interval$3(sourceString, startIdx, endIdx) {
    this.sourceString = sourceString;
    this.startIdx = startIdx;
    this.endIdx = endIdx;
  }

  Interval$3.coverage = function(firstInterval, ...intervals) {
    let {startIdx, endIdx} = firstInterval;
    for (const interval of intervals) {
      if (interval.sourceString !== firstInterval.sourceString) {
        throw errors$5.intervalSourcesDontMatch();
      } else {
        startIdx = Math.min(startIdx, interval.startIdx);
        endIdx = Math.max(endIdx, interval.endIdx);
      }
    }
    return new Interval$3(firstInterval.sourceString, startIdx, endIdx);
  };

  Interval$3.prototype = {
    coverageWith(...intervals) {
      return Interval$3.coverage(...intervals, this);
    },

    collapsedLeft() {
      return new Interval$3(this.sourceString, this.startIdx, this.startIdx);
    },

    collapsedRight() {
      return new Interval$3(this.sourceString, this.endIdx, this.endIdx);
    },

    getLineAndColumn() {
      return util$5.getLineAndColumn(this.sourceString, this.startIdx);
    },

    getLineAndColumnMessage() {
      const range = [this.startIdx, this.endIdx];
      return util$5.getLineAndColumnMessage(this.sourceString, this.startIdx, range);
    },

    // Returns an array of 0, 1, or 2 intervals that represents the result of the
    // interval difference operation.
    minus(that) {
      if (this.sourceString !== that.sourceString) {
        throw errors$5.intervalSourcesDontMatch();
      } else if (this.startIdx === that.startIdx && this.endIdx === that.endIdx) {
        // `this` and `that` are the same interval!
        return [];
      } else if (this.startIdx < that.startIdx && that.endIdx < this.endIdx) {
        // `that` splits `this` into two intervals
        return [
          new Interval$3(this.sourceString, this.startIdx, that.startIdx),
          new Interval$3(this.sourceString, that.endIdx, this.endIdx),
        ];
      } else if (this.startIdx < that.endIdx && that.endIdx < this.endIdx) {
        // `that` contains a prefix of `this`
        return [new Interval$3(this.sourceString, that.endIdx, this.endIdx)];
      } else if (this.startIdx < that.startIdx && that.startIdx < this.endIdx) {
        // `that` contains a suffix of `this`
        return [new Interval$3(this.sourceString, this.startIdx, that.startIdx)];
      } else {
        // `that` and `this` do not overlap
        return [this];
      }
    },

    // Returns a new Interval that has the same extent as this one, but which is relative
    // to `that`, an Interval that fully covers this one.
    relativeTo(that) {
      if (this.sourceString !== that.sourceString) {
        throw errors$5.intervalSourcesDontMatch();
      }
      assert$2(
          this.startIdx >= that.startIdx && this.endIdx <= that.endIdx,
          'other interval does not cover this one'
      );
      return new Interval$3(
          this.sourceString,
          this.startIdx - that.startIdx,
          this.endIdx - that.startIdx
      );
    },

    // Returns a new Interval which contains the same contents as this one,
    // but with whitespace trimmed from both ends.
    trimmed() {
      const {contents} = this;
      const startIdx = this.startIdx + contents.match(/^\s*/)[0].length;
      const endIdx = this.endIdx - contents.match(/\s*$/)[0].length;
      return new Interval$3(this.sourceString, startIdx, endIdx);
    },

    subInterval(offset, len) {
      const newStartIdx = this.startIdx + offset;
      return new Interval$3(this.sourceString, newStartIdx, newStartIdx + len);
    },
  };

  Object.defineProperties(Interval$3.prototype, {
    contents: {
      get() {
        if (this._contents === undefined) {
          this._contents = this.sourceString.slice(this.startIdx, this.endIdx);
        }
        return this._contents;
      },
      enumerable: true,
    },
    length: {
      get() {
        return this.endIdx - this.startIdx;
      },
      enumerable: true,
    },
  });

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var Interval_1 = Interval$3;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Interval$2 = Interval_1;
  const common$f = common$l;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  // Unicode characters that are used in the `toString` output.
  const BALLOT_X = '\u2717';
  const CHECK_MARK = '\u2713';
  const DOT_OPERATOR = '\u22C5';
  const RIGHTWARDS_DOUBLE_ARROW = '\u21D2';
  const SYMBOL_FOR_HORIZONTAL_TABULATION = '\u2409';
  const SYMBOL_FOR_LINE_FEED = '\u240A';
  const SYMBOL_FOR_CARRIAGE_RETURN = '\u240D';

  const Flags = {
    succeeded: 1 << 0,
    isRootNode: 1 << 1,
    isImplicitSpaces: 1 << 2,
    isMemoized: 1 << 3,
    isHeadOfLeftRecursion: 1 << 4,
    terminatesLR: 1 << 5,
  };

  function spaces(n) {
    return common$f.repeat(' ', n).join('');
  }

  // Return a string representation of a portion of `input` at offset `pos`.
  // The result will contain exactly `len` characters.
  function getInputExcerpt(input, pos, len) {
    const excerpt = asEscapedString(input.slice(pos, pos + len));

    // Pad the output if necessary.
    if (excerpt.length < len) {
      return excerpt + common$f.repeat(' ', len - excerpt.length).join('');
    }
    return excerpt;
  }

  function asEscapedString(obj) {
    if (typeof obj === 'string') {
      // Replace non-printable characters with visible symbols.
      return obj
          .replace(/ /g, DOT_OPERATOR)
          .replace(/\t/g, SYMBOL_FOR_HORIZONTAL_TABULATION)
          .replace(/\n/g, SYMBOL_FOR_LINE_FEED)
          .replace(/\r/g, SYMBOL_FOR_CARRIAGE_RETURN);
    }
    return String(obj);
  }

  // ----------------- Trace -----------------

  function Trace$2(input, pos1, pos2, expr, succeeded, bindings, optChildren) {
    this.input = input;
    this.pos = this.pos1 = pos1;
    this.pos2 = pos2;
    this.source = new Interval$2(input, pos1, pos2);
    this.expr = expr;
    this.bindings = bindings;
    this.children = optChildren || [];
    this.terminatingLREntry = null;

    this._flags = succeeded ? Flags.succeeded : 0;
  }

  // A value that can be returned from visitor functions to indicate that a
  // node should not be recursed into.
  Trace$2.prototype.SKIP = {};

  Object.defineProperty(Trace$2.prototype, 'displayString', {
    get() {
      return this.expr.toDisplayString();
    },
  });

  // For convenience, create a getter and setter for the boolean flags in `Flags`.
  Object.keys(Flags).forEach(name => {
    const mask = Flags[name];
    Object.defineProperty(Trace$2.prototype, name, {
      get() {
        return (this._flags & mask) !== 0;
      },
      set(val) {
        if (val) {
          this._flags |= mask;
        } else {
          this._flags &= ~mask;
        }
      },
    });
  });

  Trace$2.prototype.clone = function() {
    return this.cloneWithExpr(this.expr);
  };

  Trace$2.prototype.cloneWithExpr = function(expr) {
    const ans = new Trace$2(
        this.input,
        this.pos,
        this.pos2,
        expr,
        this.succeeded,
        this.bindings,
        this.children
    );

    ans.isHeadOfLeftRecursion = this.isHeadOfLeftRecursion;
    ans.isImplicitSpaces = this.isImplicitSpaces;
    ans.isMemoized = this.isMemoized;
    ans.isRootNode = this.isRootNode;
    ans.terminatesLR = this.terminatesLR;
    ans.terminatingLREntry = this.terminatingLREntry;
    return ans;
  };

  // Record the trace information for the terminating condition of the LR loop.
  Trace$2.prototype.recordLRTermination = function(ruleBodyTrace, value) {
    this.terminatingLREntry = new Trace$2(
        this.input,
        this.pos,
        this.pos2,
        this.expr,
        false,
        [value],
        [ruleBodyTrace]
    );
    this.terminatingLREntry.terminatesLR = true;
  };

  // Recursively traverse this trace node and all its descendents, calling a visitor function
  // for each node that is visited. If `vistorObjOrFn` is an object, then its 'enter' property
  // is a function to call before visiting the children of a node, and its 'exit' property is
  // a function to call afterwards. If `visitorObjOrFn` is a function, it represents the 'enter'
  // function.
  //
  // The functions are called with three arguments: the Trace node, its parent Trace, and a number
  // representing the depth of the node in the tree. (The root node has depth 0.) `optThisArg`, if
  // specified, is the value to use for `this` when executing the visitor functions.
  Trace$2.prototype.walk = function(visitorObjOrFn, optThisArg) {
    let visitor = visitorObjOrFn;
    if (typeof visitor === 'function') {
      visitor = {enter: visitor};
    }

    function _walk(node, parent, depth) {
      let recurse = true;
      if (visitor.enter) {
        if (visitor.enter.call(optThisArg, node, parent, depth) === Trace$2.prototype.SKIP) {
          recurse = false;
        }
      }
      if (recurse) {
        node.children.forEach(child => {
          _walk(child, node, depth + 1);
        });
        if (visitor.exit) {
          visitor.exit.call(optThisArg, node, parent, depth);
        }
      }
    }
    if (this.isRootNode) {
      // Don't visit the root node itself, only its children.
      this.children.forEach(c => {
        _walk(c, null, 0);
      });
    } else {
      _walk(this, null, 0);
    }
  };

  // Return a string representation of the trace.
  // Sample:
  //     12⋅+⋅2⋅*⋅3 ✓ exp ⇒  "12"
  //     12⋅+⋅2⋅*⋅3   ✓ addExp (LR) ⇒  "12"
  //     12⋅+⋅2⋅*⋅3       ✗ addExp_plus
  Trace$2.prototype.toString = function() {
    const sb = new common$f.StringBuffer();
    this.walk((node, parent, depth) => {
      if (!node) {
        return this.SKIP;
      }
      const ctorName = node.expr.constructor.name;
      // Don't print anything for Alt nodes.
      if (ctorName === 'Alt') {
        return; // eslint-disable-line consistent-return
      }
      sb.append(getInputExcerpt(node.input, node.pos, 10) + spaces(depth * 2 + 1));
      sb.append((node.succeeded ? CHECK_MARK : BALLOT_X) + ' ' + node.displayString);
      if (node.isHeadOfLeftRecursion) {
        sb.append(' (LR)');
      }
      if (node.succeeded) {
        const contents = asEscapedString(node.source.contents);
        sb.append(' ' + RIGHTWARDS_DOUBLE_ARROW + '  ');
        sb.append(typeof contents === 'string' ? '"' + contents + '"' : contents);
      }
      sb.append('\n');
    });
    return sb.contents();
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var Trace_1 = Trace$2;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Trace$1 = Trace_1;
  const common$e = common$l;
  const errors$4 = errors$9;
  const nodes = nodes$1;
  const pexprs$g = pexprsMain;

  const {TerminalNode: TerminalNode$1} = nodes;
  const {NonterminalNode} = nodes;
  const {IterationNode: IterationNode$1} = nodes;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Evaluate the expression and return `true` if it succeeds, `false` otherwise. This method should
    only be called directly by `State.prototype.eval(expr)`, which also updates the data structures
    that are used for tracing. (Making those updates in a method of `State` enables the trace-specific
    data structures to be "secrets" of that class, which is good for modularity.)

    The contract of this method is as follows:
    * When the return value is `true`,
      - the state object will have `expr.getArity()` more bindings than it did before the call.
    * When the return value is `false`,
      - the state object may have more bindings than it did before the call, and
      - its input stream's position may be anywhere.

    Note that `State.prototype.eval(expr)`, unlike this method, guarantees that neither the state
    object's bindings nor its input stream's position will change if the expression fails to match.
  */
  pexprs$g.PExpr.prototype.eval = common$e.abstract('eval'); // function(state) { ... }

  pexprs$g.any.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const ch = inputStream.next();
    if (ch) {
      state.pushBinding(new TerminalNode$1(ch.length), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };

  pexprs$g.end.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    if (inputStream.atEnd()) {
      state.pushBinding(new TerminalNode$1(0), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };

  pexprs$g.Terminal.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    if (!inputStream.matchString(this.obj)) {
      state.processFailure(origPos, this);
      return false;
    } else {
      state.pushBinding(new TerminalNode$1(this.obj.length), origPos);
      return true;
    }
  };

  pexprs$g.Range.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;

    // A range can operate in one of two modes: matching a single, 16-bit _code unit_,
    // or matching a _code point_. (Code points over 0xFFFF take up two 16-bit code units.)
    const cp = this.matchCodePoint ? inputStream.nextCodePoint() : inputStream.nextCharCode();

    // Always compare by code point value to get the correct result in all scenarios.
    // Note that for strings of length 1, codePointAt(0) and charPointAt(0) are equivalent.
    if (cp !== undefined && this.from.codePointAt(0) <= cp && cp <= this.to.codePointAt(0)) {
      state.pushBinding(new TerminalNode$1(String.fromCodePoint(cp).length), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };

  pexprs$g.Param.prototype.eval = function(state) {
    return state.eval(state.currentApplication().args[this.index]);
  };

  pexprs$g.Lex.prototype.eval = function(state) {
    state.enterLexifiedContext();
    const ans = state.eval(this.expr);
    state.exitLexifiedContext();
    return ans;
  };

  pexprs$g.Alt.prototype.eval = function(state) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      if (state.eval(this.terms[idx])) {
        return true;
      }
    }
    return false;
  };

  pexprs$g.Seq.prototype.eval = function(state) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      const factor = this.factors[idx];
      if (!state.eval(factor)) {
        return false;
      }
    }
    return true;
  };

  pexprs$g.Iter.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const arity = this.getArity();
    const cols = [];
    const colOffsets = [];
    while (cols.length < arity) {
      cols.push([]);
      colOffsets.push([]);
    }

    let numMatches = 0;
    let prevPos = origPos;
    let idx;
    while (numMatches < this.maxNumMatches && state.eval(this.expr)) {
      if (inputStream.pos === prevPos) {
        throw errors$4.kleeneExprHasNullableOperand(this, state._applicationStack);
      }
      prevPos = inputStream.pos;
      numMatches++;
      const row = state._bindings.splice(state._bindings.length - arity, arity);
      const rowOffsets = state._bindingOffsets.splice(
          state._bindingOffsets.length - arity,
          arity
      );
      for (idx = 0; idx < row.length; idx++) {
        cols[idx].push(row[idx]);
        colOffsets[idx].push(rowOffsets[idx]);
      }
    }
    if (numMatches < this.minNumMatches) {
      return false;
    }
    let offset = state.posToOffset(origPos);
    let matchLength = 0;
    if (numMatches > 0) {
      const lastCol = cols[arity - 1];
      const lastColOffsets = colOffsets[arity - 1];

      const endOffset =
        lastColOffsets[lastColOffsets.length - 1] + lastCol[lastCol.length - 1].matchLength;
      offset = colOffsets[0][0];
      matchLength = endOffset - offset;
    }
    const isOptional = this instanceof pexprs$g.Opt;
    for (idx = 0; idx < cols.length; idx++) {
      state._bindings.push(
          new IterationNode$1(cols[idx], colOffsets[idx], matchLength, isOptional)
      );
      state._bindingOffsets.push(offset);
    }
    return true;
  };

  pexprs$g.Not.prototype.eval = function(state) {
    /*
      TODO:
      - Right now we're just throwing away all of the failures that happen inside a `not`, and
        recording `this` as a failed expression.
      - Double negation should be equivalent to lookahead, but that's not the case right now wrt
        failures. E.g., ~~'foo' produces a failure for ~~'foo', but maybe it should produce
        a failure for 'foo' instead.
    */

    const {inputStream} = state;
    const origPos = inputStream.pos;
    state.pushFailuresInfo();

    const ans = state.eval(this.expr);

    state.popFailuresInfo();
    if (ans) {
      state.processFailure(origPos, this);
      return false;
    }

    inputStream.pos = origPos;
    return true;
  };

  pexprs$g.Lookahead.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    if (state.eval(this.expr)) {
      inputStream.pos = origPos;
      return true;
    } else {
      return false;
    }
  };

  pexprs$g.Apply.prototype.eval = function(state) {
    const caller = state.currentApplication();
    const actuals = caller ? caller.args : [];
    const app = this.substituteParams(actuals);

    const posInfo = state.getCurrentPosInfo();
    if (posInfo.isActive(app)) {
      // This rule is already active at this position, i.e., it is left-recursive.
      return app.handleCycle(state);
    }

    const memoKey = app.toMemoKey();
    const memoRec = posInfo.memo[memoKey];

    if (memoRec && posInfo.shouldUseMemoizedResult(memoRec)) {
      if (state.hasNecessaryInfo(memoRec)) {
        return state.useMemoizedResult(state.inputStream.pos, memoRec);
      }
      delete posInfo.memo[memoKey];
    }
    return app.reallyEval(state);
  };

  pexprs$g.Apply.prototype.handleCycle = function(state) {
    const posInfo = state.getCurrentPosInfo();
    const {currentLeftRecursion} = posInfo;
    const memoKey = this.toMemoKey();
    let memoRec = posInfo.memo[memoKey];

    if (currentLeftRecursion && currentLeftRecursion.headApplication.toMemoKey() === memoKey) {
      // We already know about this left recursion, but it's possible there are "involved
      // applications" that we don't already know about, so...
      memoRec.updateInvolvedApplicationMemoKeys();
    } else if (!memoRec) {
      // New left recursion detected! Memoize a failure to try to get a seed parse.
      memoRec = posInfo.memoize(memoKey, {
        matchLength: 0,
        examinedLength: 0,
        value: false,
        rightmostFailureOffset: -1,
      });
      posInfo.startLeftRecursion(this, memoRec);
    }
    return state.useMemoizedResult(state.inputStream.pos, memoRec);
  };

  pexprs$g.Apply.prototype.reallyEval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const origPosInfo = state.getCurrentPosInfo();
    const ruleInfo = state.grammar.rules[this.ruleName];
    const {body} = ruleInfo;
    const {description} = ruleInfo;

    state.enterApplication(origPosInfo, this);

    if (description) {
      state.pushFailuresInfo();
    }

    // Reset the input stream's examinedLength property so that we can track
    // the examined length of this particular application.
    const origInputStreamExaminedLength = inputStream.examinedLength;
    inputStream.examinedLength = 0;

    let value = this.evalOnce(body, state);
    const currentLR = origPosInfo.currentLeftRecursion;
    const memoKey = this.toMemoKey();
    const isHeadOfLeftRecursion = currentLR && currentLR.headApplication.toMemoKey() === memoKey;
    let memoRec;

    if (isHeadOfLeftRecursion) {
      value = this.growSeedResult(body, state, origPos, currentLR, value);
      origPosInfo.endLeftRecursion();
      memoRec = currentLR;
      memoRec.examinedLength = inputStream.examinedLength - origPos;
      memoRec.rightmostFailureOffset = state._getRightmostFailureOffset();
      origPosInfo.memoize(memoKey, memoRec); // updates origPosInfo's maxExaminedLength
    } else if (!currentLR || !currentLR.isInvolved(memoKey)) {
      // This application is not involved in left recursion, so it's ok to memoize it.
      memoRec = origPosInfo.memoize(memoKey, {
        matchLength: inputStream.pos - origPos,
        examinedLength: inputStream.examinedLength - origPos,
        value,
        failuresAtRightmostPosition: state.cloneRecordedFailures(),
        rightmostFailureOffset: state._getRightmostFailureOffset(),
      });
    }
    const succeeded = !!value;

    if (description) {
      state.popFailuresInfo();
      if (!succeeded) {
        state.processFailure(origPos, this);
      }
      if (memoRec) {
        memoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();
      }
    }

    // Record trace information in the memo table, so that it is available if the memoized result
    // is used later.
    if (state.isTracing() && memoRec) {
      const entry = state.getTraceEntry(origPos, this, succeeded, succeeded ? [value] : []);
      if (isHeadOfLeftRecursion) {
        common$e.assert(entry.terminatingLREntry != null || !succeeded);
        entry.isHeadOfLeftRecursion = true;
      }
      memoRec.traceEntry = entry;
    }

    // Fix the input stream's examinedLength -- it should be the maximum examined length
    // across all applications, not just this one.
    inputStream.examinedLength = Math.max(
        inputStream.examinedLength,
        origInputStreamExaminedLength
    );

    state.exitApplication(origPosInfo, value);

    return succeeded;
  };

  pexprs$g.Apply.prototype.evalOnce = function(expr, state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;

    if (state.eval(expr)) {
      const arity = expr.getArity();
      const bindings = state._bindings.splice(state._bindings.length - arity, arity);
      const offsets = state._bindingOffsets.splice(state._bindingOffsets.length - arity, arity);
      const matchLength = inputStream.pos - origPos;
      return new NonterminalNode(this.ruleName, bindings, offsets, matchLength);
    } else {
      return false;
    }
  };

  pexprs$g.Apply.prototype.growSeedResult = function(body, state, origPos, lrMemoRec, newValue) {
    if (!newValue) {
      return false;
    }

    const {inputStream} = state;

    while (true) {
      lrMemoRec.matchLength = inputStream.pos - origPos;
      lrMemoRec.value = newValue;
      lrMemoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();

      if (state.isTracing()) {
        // Before evaluating the body again, add a trace node for this application to the memo entry.
        // Its only child is a copy of the trace node from `newValue`, which will always be the last
        // element in `state.trace`.
        const seedTrace = state.trace[state.trace.length - 1];
        lrMemoRec.traceEntry = new Trace$1(
            state.input,
            origPos,
            inputStream.pos,
            this,
            true,
            [newValue],
            [seedTrace.clone()]
        );
      }
      inputStream.pos = origPos;
      newValue = this.evalOnce(body, state);
      if (inputStream.pos - origPos <= lrMemoRec.matchLength) {
        break;
      }
      if (state.isTracing()) {
        state.trace.splice(-2, 1); // Drop the trace for the old seed.
      }
    }
    if (state.isTracing()) {
      // The last entry is for an unused result -- pop it and save it in the "real" entry.
      lrMemoRec.traceEntry.recordLRTermination(state.trace.pop(), newValue);
    }
    inputStream.pos = origPos + lrMemoRec.matchLength;
    return lrMemoRec.value;
  };

  pexprs$g.UnicodeChar.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const ch = inputStream.next();
    if (ch && this.pattern.test(ch)) {
      state.pushBinding(new TerminalNode$1(ch.length), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$d = common$l;
  const pexprs$f = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  pexprs$f.PExpr.prototype.getArity = common$d.abstract('getArity');

  pexprs$f.any.getArity =
    pexprs$f.end.getArity =
    pexprs$f.Terminal.prototype.getArity =
    pexprs$f.Range.prototype.getArity =
    pexprs$f.Param.prototype.getArity =
    pexprs$f.Apply.prototype.getArity =
    pexprs$f.UnicodeChar.prototype.getArity =
      function() {
        return 1;
      };

  pexprs$f.Alt.prototype.getArity = function() {
    // This is ok b/c all terms must have the same arity -- this property is
    // checked by the Grammar constructor.
    return this.terms.length === 0 ? 0 : this.terms[0].getArity();
  };

  pexprs$f.Seq.prototype.getArity = function() {
    let arity = 0;
    for (let idx = 0; idx < this.factors.length; idx++) {
      arity += this.factors[idx].getArity();
    }
    return arity;
  };

  pexprs$f.Iter.prototype.getArity = function() {
    return this.expr.getArity();
  };

  pexprs$f.Not.prototype.getArity = function() {
    return 0;
  };

  pexprs$f.Lookahead.prototype.getArity = pexprs$f.Lex.prototype.getArity = function() {
    return this.expr.getArity();
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$c = common$l;
  const pexprs$e = pexprsMain;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function getMetaInfo(expr, grammarInterval) {
    const metaInfo = {};
    if (expr.source && grammarInterval) {
      const adjusted = expr.source.relativeTo(grammarInterval);
      metaInfo.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
    }
    return metaInfo;
  }

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  pexprs$e.PExpr.prototype.outputRecipe = common$c.abstract('outputRecipe');

  pexprs$e.any.outputRecipe = function(formals, grammarInterval) {
    return ['any', getMetaInfo(this, grammarInterval)];
  };

  pexprs$e.end.outputRecipe = function(formals, grammarInterval) {
    return ['end', getMetaInfo(this, grammarInterval)];
  };

  pexprs$e.Terminal.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['terminal', getMetaInfo(this, grammarInterval), this.obj];
  };

  pexprs$e.Range.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['range', getMetaInfo(this, grammarInterval), this.from, this.to];
  };

  pexprs$e.Param.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['param', getMetaInfo(this, grammarInterval), this.index];
  };

  pexprs$e.Alt.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['alt', getMetaInfo(this, grammarInterval)].concat(
        this.terms.map(term => term.outputRecipe(formals, grammarInterval))
    );
  };

  pexprs$e.Extend.prototype.outputRecipe = function(formals, grammarInterval) {
    const extension = this.terms[0]; // [extension, original]
    return extension.outputRecipe(formals, grammarInterval);
  };

  pexprs$e.Splice.prototype.outputRecipe = function(formals, grammarInterval) {
    const beforeTerms = this.terms.slice(0, this.expansionPos);
    const afterTerms = this.terms.slice(this.expansionPos + 1);
    return [
      'splice',
      getMetaInfo(this, grammarInterval),
      beforeTerms.map(term => term.outputRecipe(formals, grammarInterval)),
      afterTerms.map(term => term.outputRecipe(formals, grammarInterval)),
    ];
  };

  pexprs$e.Seq.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['seq', getMetaInfo(this, grammarInterval)].concat(
        this.factors.map(factor => factor.outputRecipe(formals, grammarInterval))
    );
  };

  pexprs$e.Star.prototype.outputRecipe =
    pexprs$e.Plus.prototype.outputRecipe =
    pexprs$e.Opt.prototype.outputRecipe =
    pexprs$e.Not.prototype.outputRecipe =
    pexprs$e.Lookahead.prototype.outputRecipe =
    pexprs$e.Lex.prototype.outputRecipe =
      function(formals, grammarInterval) {
        return [
          this.constructor.name.toLowerCase(),
          getMetaInfo(this, grammarInterval),
          this.expr.outputRecipe(formals, grammarInterval),
        ];
      };

  pexprs$e.Apply.prototype.outputRecipe = function(formals, grammarInterval) {
    return [
      'app',
      getMetaInfo(this, grammarInterval),
      this.ruleName,
      this.args.map(arg => arg.outputRecipe(formals, grammarInterval)),
    ];
  };

  pexprs$e.UnicodeChar.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['unicodeChar', getMetaInfo(this, grammarInterval), this.category];
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$b = common$l;
  const pexprs$d = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Called at grammar creation time to rewrite a rule body, replacing each reference to a formal
    parameter with a `Param` node. Returns a PExpr -- either a new one, or the original one if
    it was modified in place.
  */
  pexprs$d.PExpr.prototype.introduceParams = common$b.abstract('introduceParams');

  pexprs$d.any.introduceParams =
    pexprs$d.end.introduceParams =
    pexprs$d.Terminal.prototype.introduceParams =
    pexprs$d.Range.prototype.introduceParams =
    pexprs$d.Param.prototype.introduceParams =
    pexprs$d.UnicodeChar.prototype.introduceParams =
      function(formals) {
        return this;
      };

  pexprs$d.Alt.prototype.introduceParams = function(formals) {
    this.terms.forEach((term, idx, terms) => {
      terms[idx] = term.introduceParams(formals);
    });
    return this;
  };

  pexprs$d.Seq.prototype.introduceParams = function(formals) {
    this.factors.forEach((factor, idx, factors) => {
      factors[idx] = factor.introduceParams(formals);
    });
    return this;
  };

  pexprs$d.Iter.prototype.introduceParams =
    pexprs$d.Not.prototype.introduceParams =
    pexprs$d.Lookahead.prototype.introduceParams =
    pexprs$d.Lex.prototype.introduceParams =
      function(formals) {
        this.expr = this.expr.introduceParams(formals);
        return this;
      };

  pexprs$d.Apply.prototype.introduceParams = function(formals) {
    const index = formals.indexOf(this.ruleName);
    if (index >= 0) {
      if (this.args.length > 0) {
        // TODO: Should this be supported? See issue #64.
        throw new Error('Parameterized rules cannot be passed as arguments to another rule.');
      }
      return new pexprs$d.Param(index).withSource(this.source);
    } else {
      this.args.forEach((arg, idx, args) => {
        args[idx] = arg.introduceParams(formals);
      });
      return this;
    }
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$a = common$l;
  const pexprs$c = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  // Returns `true` if this parsing expression may accept without consuming any input.
  pexprs$c.PExpr.prototype.isNullable = function(grammar) {
    return this._isNullable(grammar, Object.create(null));
  };

  pexprs$c.PExpr.prototype._isNullable = common$a.abstract('_isNullable');

  pexprs$c.any._isNullable =
    pexprs$c.Range.prototype._isNullable =
    pexprs$c.Param.prototype._isNullable =
    pexprs$c.Plus.prototype._isNullable =
    pexprs$c.UnicodeChar.prototype._isNullable =
      function(grammar, memo) {
        return false;
      };

  pexprs$c.end._isNullable = function(grammar, memo) {
    return true;
  };

  pexprs$c.Terminal.prototype._isNullable = function(grammar, memo) {
    if (typeof this.obj === 'string') {
      // This is an over-simplification: it's only correct if the input is a string. If it's an array
      // or an object, then the empty string parsing expression is not nullable.
      return this.obj === '';
    } else {
      return false;
    }
  };

  pexprs$c.Alt.prototype._isNullable = function(grammar, memo) {
    return this.terms.length === 0 || this.terms.some(term => term._isNullable(grammar, memo));
  };

  pexprs$c.Seq.prototype._isNullable = function(grammar, memo) {
    return this.factors.every(factor => factor._isNullable(grammar, memo));
  };

  pexprs$c.Star.prototype._isNullable =
    pexprs$c.Opt.prototype._isNullable =
    pexprs$c.Not.prototype._isNullable =
    pexprs$c.Lookahead.prototype._isNullable =
      function(grammar, memo) {
        return true;
      };

  pexprs$c.Lex.prototype._isNullable = function(grammar, memo) {
    return this.expr._isNullable(grammar, memo);
  };

  pexprs$c.Apply.prototype._isNullable = function(grammar, memo) {
    const key = this.toMemoKey();
    if (!Object.prototype.hasOwnProperty.call(memo, key)) {
      const {body} = grammar.rules[this.ruleName];
      const inlined = body.substituteParams(this.args);
      memo[key] = false; // Prevent infinite recursion for recursive rules.
      memo[key] = inlined._isNullable(grammar, memo);
    }
    return memo[key];
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$9 = common$l;
  const pexprs$b = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Returns a PExpr that results from recursively replacing every formal parameter (i.e., instance
    of `Param`) inside this PExpr with its actual value from `actuals` (an Array).

    The receiver must not be modified; a new PExpr must be returned if any replacement is necessary.
  */
  // function(actuals) { ... }
  pexprs$b.PExpr.prototype.substituteParams = common$9.abstract('substituteParams');

  pexprs$b.any.substituteParams =
    pexprs$b.end.substituteParams =
    pexprs$b.Terminal.prototype.substituteParams =
    pexprs$b.Range.prototype.substituteParams =
    pexprs$b.UnicodeChar.prototype.substituteParams =
      function(actuals) {
        return this;
      };

  pexprs$b.Param.prototype.substituteParams = function(actuals) {
    return actuals[this.index];
  };

  pexprs$b.Alt.prototype.substituteParams = function(actuals) {
    return new pexprs$b.Alt(this.terms.map(term => term.substituteParams(actuals)));
  };

  pexprs$b.Seq.prototype.substituteParams = function(actuals) {
    return new pexprs$b.Seq(this.factors.map(factor => factor.substituteParams(actuals)));
  };

  pexprs$b.Iter.prototype.substituteParams =
    pexprs$b.Not.prototype.substituteParams =
    pexprs$b.Lookahead.prototype.substituteParams =
    pexprs$b.Lex.prototype.substituteParams =
      function(actuals) {
        return new this.constructor(this.expr.substituteParams(actuals));
      };

  pexprs$b.Apply.prototype.substituteParams = function(actuals) {
    if (this.args.length === 0) {
      // Avoid making a copy of this application, as an optimization
      return this;
    } else {
      const args = this.args.map(arg => arg.substituteParams(actuals));
      return new pexprs$b.Apply(this.ruleName, args);
    }
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$8 = common$l;
  const pexprs$a = pexprsMain;

  const {copyWithoutDuplicates} = common$8;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function isRestrictedJSIdentifier(str) {
    return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str);
  }

  function resolveDuplicatedNames(argumentNameList) {
    // `count` is used to record the number of times each argument name occurs in the list,
    // this is useful for checking duplicated argument name. It maps argument names to ints.
    const count = Object.create(null);
    argumentNameList.forEach(argName => {
      count[argName] = (count[argName] || 0) + 1;
    });

    // Append subscripts ('_1', '_2', ...) to duplicate argument names.
    Object.keys(count).forEach(dupArgName => {
      if (count[dupArgName] <= 1) {
        return;
      }

      // This name shows up more than once, so add subscripts.
      let subscript = 1;
      argumentNameList.forEach((argName, idx) => {
        if (argName === dupArgName) {
          argumentNameList[idx] = argName + '_' + subscript++;
        }
      });
    });
  }

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Returns a list of strings that will be used as the default argument names for its receiver
    (a pexpr) in a semantic action. This is used exclusively by the Semantics Editor.

    `firstArgIndex` is the 1-based index of the first argument name that will be generated for this
    pexpr. It enables us to name arguments positionally, e.g., if the second argument is a
    non-alphanumeric terminal like "+", it will be named '$2'.

    `noDupCheck` is true if the caller of `toArgumentNameList` is not a top level caller. It enables
    us to avoid nested duplication subscripts appending, e.g., '_1_1', '_1_2', by only checking
    duplicates at the top level.

    Here is a more elaborate example that illustrates how this method works:
    `(a "+" b).toArgumentNameList(1)` evaluates to `['a', '$2', 'b']` with the following recursive
    calls:

      (a).toArgumentNameList(1) -> ['a'],
      ("+").toArgumentNameList(2) -> ['$2'],
      (b).toArgumentNameList(3) -> ['b']

    Notes:
    * This method must only be called on well-formed expressions, e.g., the receiver must
      not have any Alt sub-expressions with inconsistent arities.
    * e.getArity() === e.toArgumentNameList(1).length
  */
  // function(firstArgIndex, noDupCheck) { ... }
  pexprs$a.PExpr.prototype.toArgumentNameList = common$8.abstract('toArgumentNameList');

  pexprs$a.any.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ['any'];
  };

  pexprs$a.end.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ['end'];
  };

  pexprs$a.Terminal.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    if (typeof this.obj === 'string' && /^[_a-zA-Z0-9]+$/.test(this.obj)) {
      // If this terminal is a valid suffix for a JS identifier, just prepend it with '_'
      return ['_' + this.obj];
    } else {
      // Otherwise, name it positionally.
      return ['$' + firstArgIndex];
    }
  };

  pexprs$a.Range.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    let argName = this.from + '_to_' + this.to;
    // If the `argName` is not valid then try to prepend a `_`.
    if (!isRestrictedJSIdentifier(argName)) {
      argName = '_' + argName;
    }
    // If the `argName` still not valid after prepending a `_`, then name it positionally.
    if (!isRestrictedJSIdentifier(argName)) {
      argName = '$' + firstArgIndex;
    }
    return [argName];
  };

  pexprs$a.Alt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    // `termArgNameLists` is an array of arrays where each row is the
    // argument name list that corresponds to a term in this alternation.
    const termArgNameLists = this.terms.map(term =>
      term.toArgumentNameList(firstArgIndex, true)
    );

    const argumentNameList = [];
    const numArgs = termArgNameLists[0].length;
    for (let colIdx = 0; colIdx < numArgs; colIdx++) {
      const col = [];
      for (let rowIdx = 0; rowIdx < this.terms.length; rowIdx++) {
        col.push(termArgNameLists[rowIdx][colIdx]);
      }
      const uniqueNames = copyWithoutDuplicates(col);
      argumentNameList.push(uniqueNames.join('_or_'));
    }

    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };

  pexprs$a.Seq.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    // Generate the argument name list, without worrying about duplicates.
    let argumentNameList = [];
    this.factors.forEach(factor => {
      const factorArgumentNameList = factor.toArgumentNameList(firstArgIndex, true);
      argumentNameList = argumentNameList.concat(factorArgumentNameList);

      // Shift the firstArgIndex to take this factor's argument names into account.
      firstArgIndex += factorArgumentNameList.length;
    });
    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };

  pexprs$a.Iter.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    const argumentNameList = this.expr
        .toArgumentNameList(firstArgIndex, noDupCheck)
        .map(exprArgumentString =>
        exprArgumentString[exprArgumentString.length - 1] === 's' ?
          exprArgumentString + 'es' :
          exprArgumentString + 's'
        );
    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };

  pexprs$a.Opt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return this.expr.toArgumentNameList(firstArgIndex, noDupCheck).map(argName => {
      return 'opt' + argName[0].toUpperCase() + argName.slice(1);
    });
  };

  pexprs$a.Not.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return [];
  };

  pexprs$a.Lookahead.prototype.toArgumentNameList = pexprs$a.Lex.prototype.toArgumentNameList =
    function(firstArgIndex, noDupCheck) {
      return this.expr.toArgumentNameList(firstArgIndex, noDupCheck);
    };

  pexprs$a.Apply.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return [this.ruleName];
  };

  pexprs$a.UnicodeChar.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ['$' + firstArgIndex];
  };

  pexprs$a.Param.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ['param' + this.index];
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$7 = common$l;
  const pexprs$9 = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  // Returns a string representing the PExpr, for use as a UI label, etc.
  pexprs$9.PExpr.prototype.toDisplayString = common$7.abstract('toDisplayString');

  pexprs$9.Alt.prototype.toDisplayString = pexprs$9.Seq.prototype.toDisplayString = function() {
    if (this.source) {
      return this.source.trimmed().contents;
    }
    return '[' + this.constructor.name + ']';
  };

  pexprs$9.any.toDisplayString =
    pexprs$9.end.toDisplayString =
    pexprs$9.Iter.prototype.toDisplayString =
    pexprs$9.Not.prototype.toDisplayString =
    pexprs$9.Lookahead.prototype.toDisplayString =
    pexprs$9.Lex.prototype.toDisplayString =
    pexprs$9.Terminal.prototype.toDisplayString =
    pexprs$9.Range.prototype.toDisplayString =
    pexprs$9.Param.prototype.toDisplayString =
      function() {
        return this.toString();
      };

  pexprs$9.Apply.prototype.toDisplayString = function() {
    if (this.args.length > 0) {
      const ps = this.args.map(arg => arg.toDisplayString());
      return this.ruleName + '<' + ps.join(',') + '>';
    } else {
      return this.ruleName;
    }
  };

  pexprs$9.UnicodeChar.prototype.toDisplayString = function() {
    return 'Unicode [' + this.category + '] character';
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Failure$1 = Failure_1;
  const common$6 = common$l;
  const pexprs$8 = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  pexprs$8.PExpr.prototype.toFailure = common$6.abstract('toFailure');

  pexprs$8.any.toFailure = function(grammar) {
    return new Failure$1(this, 'any object', 'description');
  };

  pexprs$8.end.toFailure = function(grammar) {
    return new Failure$1(this, 'end of input', 'description');
  };

  pexprs$8.Terminal.prototype.toFailure = function(grammar) {
    return new Failure$1(this, this.obj, 'string');
  };

  pexprs$8.Range.prototype.toFailure = function(grammar) {
    // TODO: come up with something better
    return new Failure$1(this, JSON.stringify(this.from) + '..' + JSON.stringify(this.to), 'code');
  };

  pexprs$8.Not.prototype.toFailure = function(grammar) {
    const description =
      this.expr === pexprs$8.any ? 'nothing' : 'not ' + this.expr.toFailure(grammar);
    return new Failure$1(this, description, 'description');
  };

  pexprs$8.Lookahead.prototype.toFailure = function(grammar) {
    return this.expr.toFailure(grammar);
  };

  pexprs$8.Apply.prototype.toFailure = function(grammar) {
    let {description} = grammar.rules[this.ruleName];
    if (!description) {
      const article = /^[aeiouAEIOU]/.test(this.ruleName) ? 'an' : 'a';
      description = article + ' ' + this.ruleName;
    }
    return new Failure$1(this, description, 'description');
  };

  pexprs$8.UnicodeChar.prototype.toFailure = function(grammar) {
    return new Failure$1(this, 'a Unicode [' + this.category + '] character', 'description');
  };

  pexprs$8.Alt.prototype.toFailure = function(grammar) {
    const fs = this.terms.map(t => t.toFailure(grammar));
    const description = '(' + fs.join(' or ') + ')';
    return new Failure$1(this, description, 'description');
  };

  pexprs$8.Seq.prototype.toFailure = function(grammar) {
    const fs = this.factors.map(f => f.toFailure(grammar));
    const description = '(' + fs.join(' ') + ')';
    return new Failure$1(this, description, 'description');
  };

  pexprs$8.Iter.prototype.toFailure = function(grammar) {
    const description = '(' + this.expr.toFailure(grammar) + this.operator + ')';
    return new Failure$1(this, description, 'description');
  };

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$5 = common$l;
  const pexprs$7 = pexprsMain;

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    e1.toString() === e2.toString() ==> e1 and e2 are semantically equivalent.
    Note that this is not an iff (<==>): e.g.,
    (~"b" "a").toString() !== ("a").toString(), even though
    ~"b" "a" and "a" are interchangeable in any grammar,
    both in terms of the languages they accept and their arities.
  */
  pexprs$7.PExpr.prototype.toString = common$5.abstract('toString');

  pexprs$7.any.toString = function() {
    return 'any';
  };

  pexprs$7.end.toString = function() {
    return 'end';
  };

  pexprs$7.Terminal.prototype.toString = function() {
    return JSON.stringify(this.obj);
  };

  pexprs$7.Range.prototype.toString = function() {
    return JSON.stringify(this.from) + '..' + JSON.stringify(this.to);
  };

  pexprs$7.Param.prototype.toString = function() {
    return '$' + this.index;
  };

  pexprs$7.Lex.prototype.toString = function() {
    return '#(' + this.expr.toString() + ')';
  };

  pexprs$7.Alt.prototype.toString = function() {
    return this.terms.length === 1 ?
      this.terms[0].toString() :
      '(' + this.terms.map(term => term.toString()).join(' | ') + ')';
  };

  pexprs$7.Seq.prototype.toString = function() {
    return this.factors.length === 1 ?
      this.factors[0].toString() :
      '(' + this.factors.map(factor => factor.toString()).join(' ') + ')';
  };

  pexprs$7.Iter.prototype.toString = function() {
    return this.expr + this.operator;
  };

  pexprs$7.Not.prototype.toString = function() {
    return '~' + this.expr;
  };

  pexprs$7.Lookahead.prototype.toString = function() {
    return '&' + this.expr;
  };

  pexprs$7.Apply.prototype.toString = function() {
    if (this.args.length > 0) {
      const ps = this.args.map(arg => arg.toString());
      return this.ruleName + '<' + ps.join(',') + '>';
    } else {
      return this.ruleName;
    }
  };

  pexprs$7.UnicodeChar.prototype.toString = function() {
    return '\\p{' + this.category + '}';
  };

  // --------------------------------------------------------------------
  // Re-export classes
  // --------------------------------------------------------------------

  var pexprs$6 = pexprsMain;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Failure = Failure_1;
  const {TerminalNode} = nodes$1;
  const {assert: assert$1$1} = common$l;
  const {PExpr, Terminal} = pexprs$6;

  class CaseInsensitiveTerminal$1 extends PExpr {
    constructor(param) {
      super();
      this.obj = param;
    }

    _getString(state) {
      const terminal = state.currentApplication().args[this.obj.index];
      assert$1$1(terminal instanceof Terminal, 'expected a Terminal expression');
      return terminal.obj;
    }

    // Implementation of the PExpr API

    allowsSkippingPrecedingSpace() {
      return true;
    }

    eval(state) {
      const {inputStream} = state;
      const origPos = inputStream.pos;
      const matchStr = this._getString(state);
      if (!inputStream.matchString(matchStr, true)) {
        state.processFailure(origPos, this);
        return false;
      } else {
        state.pushBinding(new TerminalNode(matchStr.length), origPos);
        return true;
      }
    }

    getArity() {
      return 1;
    }

    substituteParams(actuals) {
      return new CaseInsensitiveTerminal$1(this.obj.substituteParams(actuals));
    }

    toDisplayString() {
      return this.obj.toDisplayString() + ' (case-insensitive)';
    }

    toFailure(grammar) {
      return new Failure(
          this,
          this.obj.toFailure(grammar) + ' (case-insensitive)',
          'description'
      );
    }

    _isNullable(grammar, memo) {
      return this.obj._isNullable(grammar, memo);
    }
  }

  var CaseInsensitiveTerminal_1 = CaseInsensitiveTerminal$1;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Interval$1 = Interval_1;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function InputStream$3(source) {
    this.source = source;
    this.pos = 0;
    this.examinedLength = 0;
  }

  InputStream$3.prototype = {
    atEnd() {
      const ans = this.pos === this.source.length;
      this.examinedLength = Math.max(this.examinedLength, this.pos + 1);
      return ans;
    },

    next() {
      const ans = this.source[this.pos++];
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return ans;
    },

    nextCharCode() {
      const nextChar = this.next();
      return nextChar && nextChar.charCodeAt(0);
    },

    nextCodePoint() {
      const cp = this.source.slice(this.pos++).codePointAt(0);
      // If the code point is beyond plane 0, it takes up two characters.
      if (cp > 0xffff) {
        this.pos += 1;
      }
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return cp;
    },

    matchString(s, optIgnoreCase) {
      let idx;
      if (optIgnoreCase) {
        /*
          Case-insensitive comparison is a tricky business. Some notable gotchas include the
          "Turkish I" problem (http://www.i18nguy.com/unicode/turkish-i18n.html) and the fact
          that the German Esszet (ß) turns into "SS" in upper case.

          This is intended to be a locale-invariant comparison, which means it may not obey
          locale-specific expectations (e.g. "i" => "İ").
         */
        for (idx = 0; idx < s.length; idx++) {
          const actual = this.next();
          const expected = s[idx];
          if (actual == null || actual.toUpperCase() !== expected.toUpperCase()) {
            return false;
          }
        }
        return true;
      }
      // Default is case-sensitive comparison.
      for (idx = 0; idx < s.length; idx++) {
        if (this.next() !== s[idx]) {
          return false;
        }
      }
      return true;
    },

    sourceSlice(startIdx, endIdx) {
      return this.source.slice(startIdx, endIdx);
    },

    interval(startIdx, optEndIdx) {
      return new Interval$1(this.source, startIdx, optEndIdx ? optEndIdx : this.pos);
    },
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var InputStream_1 = InputStream$3;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const common$4 = common$l;
  const util$4 = util$7;
  const Interval = Interval_1;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function MatchResult$2(
      matcher,
      input,
      startExpr,
      cst,
      cstOffset,
      rightmostFailurePosition,
      optRecordedFailures
  ) {
    this.matcher = matcher;
    this.input = input;
    this.startExpr = startExpr;
    this._cst = cst;
    this._cstOffset = cstOffset;
    this._rightmostFailurePosition = rightmostFailurePosition;
    this._rightmostFailures = optRecordedFailures;

    if (this.failed()) {
      /* eslint-disable no-invalid-this */
      common$4.defineLazyProperty(this, 'message', function() {
        const detail = 'Expected ' + this.getExpectedText();
        return (
          util$4.getLineAndColumnMessage(this.input, this.getRightmostFailurePosition()) + detail
        );
      });
      common$4.defineLazyProperty(this, 'shortMessage', function() {
        const detail = 'expected ' + this.getExpectedText();
        const errorInfo = util$4.getLineAndColumn(this.input, this.getRightmostFailurePosition());
        return 'Line ' + errorInfo.lineNum + ', col ' + errorInfo.colNum + ': ' + detail;
      });
      /* eslint-enable no-invalid-this */
    }
  }

  MatchResult$2.prototype.succeeded = function() {
    return !!this._cst;
  };

  MatchResult$2.prototype.failed = function() {
    return !this.succeeded();
  };

  MatchResult$2.prototype.getRightmostFailurePosition = function() {
    return this._rightmostFailurePosition;
  };

  MatchResult$2.prototype.getRightmostFailures = function() {
    if (!this._rightmostFailures) {
      this.matcher.setInput(this.input);
      const matchResultWithFailures = this.matcher._match(
          this.startExpr,
          false,
          this.getRightmostFailurePosition()
      );
      this._rightmostFailures = matchResultWithFailures.getRightmostFailures();
    }
    return this._rightmostFailures;
  };

  MatchResult$2.prototype.toString = function() {
    return this.succeeded() ?
      '[match succeeded]' :
      '[match failed at position ' + this.getRightmostFailurePosition() + ']';
  };

  // Return a string summarizing the expected contents of the input stream when
  // the match failure occurred.
  MatchResult$2.prototype.getExpectedText = function() {
    if (this.succeeded()) {
      throw new Error('cannot get expected text of a successful MatchResult');
    }

    const sb = new common$4.StringBuffer();
    let failures = this.getRightmostFailures();

    // Filter out the fluffy failures to make the default error messages more useful
    failures = failures.filter(failure => !failure.isFluffy());

    for (let idx = 0; idx < failures.length; idx++) {
      if (idx > 0) {
        if (idx === failures.length - 1) {
          sb.append(failures.length > 2 ? ', or ' : ' or ');
        } else {
          sb.append(', ');
        }
      }
      sb.append(failures[idx].toString());
    }
    return sb.contents();
  };

  MatchResult$2.prototype.getInterval = function() {
    const pos = this.getRightmostFailurePosition();
    return new Interval(this.input, pos, pos);
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var MatchResult_1 = MatchResult$2;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function PosInfo$1() {
    this.applicationMemoKeyStack = []; // active applications at this position
    this.memo = {};
    this.maxExaminedLength = 0;
    this.maxRightmostFailureOffset = -1;
    this.currentLeftRecursion = undefined;
  }

  PosInfo$1.prototype = {
    isActive(application) {
      return this.applicationMemoKeyStack.indexOf(application.toMemoKey()) >= 0;
    },

    enter(application) {
      this.applicationMemoKeyStack.push(application.toMemoKey());
    },

    exit() {
      this.applicationMemoKeyStack.pop();
    },

    startLeftRecursion(headApplication, memoRec) {
      memoRec.isLeftRecursion = true;
      memoRec.headApplication = headApplication;
      memoRec.nextLeftRecursion = this.currentLeftRecursion;
      this.currentLeftRecursion = memoRec;

      const {applicationMemoKeyStack} = this;
      const indexOfFirstInvolvedRule =
        applicationMemoKeyStack.indexOf(headApplication.toMemoKey()) + 1;
      const involvedApplicationMemoKeys = applicationMemoKeyStack.slice(
          indexOfFirstInvolvedRule
      );

      memoRec.isInvolved = function(applicationMemoKey) {
        return involvedApplicationMemoKeys.indexOf(applicationMemoKey) >= 0;
      };

      memoRec.updateInvolvedApplicationMemoKeys = function() {
        for (let idx = indexOfFirstInvolvedRule; idx < applicationMemoKeyStack.length; idx++) {
          const applicationMemoKey = applicationMemoKeyStack[idx];
          if (!this.isInvolved(applicationMemoKey)) {
            involvedApplicationMemoKeys.push(applicationMemoKey);
          }
        }
      };
    },

    endLeftRecursion() {
      this.currentLeftRecursion = this.currentLeftRecursion.nextLeftRecursion;
    },

    // Note: this method doesn't get called for the "head" of a left recursion -- for LR heads,
    // the memoized result (which starts out being a failure) is always used.
    shouldUseMemoizedResult(memoRec) {
      if (!memoRec.isLeftRecursion) {
        return true;
      }
      const {applicationMemoKeyStack} = this;
      for (let idx = 0; idx < applicationMemoKeyStack.length; idx++) {
        const applicationMemoKey = applicationMemoKeyStack[idx];
        if (memoRec.isInvolved(applicationMemoKey)) {
          return false;
        }
      }
      return true;
    },

    memoize(memoKey, memoRec) {
      this.memo[memoKey] = memoRec;
      this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
      this.maxRightmostFailureOffset = Math.max(
          this.maxRightmostFailureOffset,
          memoRec.rightmostFailureOffset
      );
      return memoRec;
    },

    clearObsoleteEntries(pos, invalidatedIdx) {
      if (pos + this.maxExaminedLength <= invalidatedIdx) {
        // Optimization: none of the rule applications that were memoized here examined the
        // interval of the input that changed, so nothing has to be invalidated.
        return;
      }

      const {memo} = this;
      this.maxExaminedLength = 0;
      this.maxRightmostFailureOffset = -1;
      Object.keys(memo).forEach(k => {
        const memoRec = memo[k];
        if (pos + memoRec.examinedLength > invalidatedIdx) {
          delete memo[k];
        } else {
          this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
          this.maxRightmostFailureOffset = Math.max(
              this.maxRightmostFailureOffset,
              memoRec.rightmostFailureOffset
          );
        }
      });
    },
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var PosInfo_1 = PosInfo$1;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const InputStream$2 = InputStream_1;
  const MatchResult$1 = MatchResult_1;
  const PosInfo = PosInfo_1;
  const Trace = Trace_1;
  const pexprs$5 = pexprs$6;
  const util$3 = util$7;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  let builtInApplySyntacticBody;

  util$3.awaitBuiltInRules(builtInRules => {
    builtInApplySyntacticBody = builtInRules.rules.applySyntactic.body;
  });

  const applySpaces = new pexprs$5.Apply('spaces');

  function MatchState$1(matcher, startExpr, optPositionToRecordFailures) {
    this.matcher = matcher;
    this.startExpr = startExpr;

    this.grammar = matcher.grammar;
    this.input = matcher.input;
    this.inputStream = new InputStream$2(matcher.input);
    this.memoTable = matcher.memoTable;

    this._bindings = [];
    this._bindingOffsets = [];
    this._applicationStack = [];
    this._posStack = [0];
    this.inLexifiedContextStack = [false];

    this.rightmostFailurePosition = -1;
    this._rightmostFailurePositionStack = [];
    this._recordedFailuresStack = [];

    if (optPositionToRecordFailures !== undefined) {
      this.positionToRecordFailures = optPositionToRecordFailures;
      this.recordedFailures = Object.create(null);
    }
  }

  MatchState$1.prototype = {
    posToOffset(pos) {
      return pos - this._posStack[this._posStack.length - 1];
    },

    enterApplication(posInfo, app) {
      this._posStack.push(this.inputStream.pos);
      this._applicationStack.push(app);
      this.inLexifiedContextStack.push(false);
      posInfo.enter(app);
      this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
      this.rightmostFailurePosition = -1;
    },

    exitApplication(posInfo, optNode) {
      const origPos = this._posStack.pop();
      this._applicationStack.pop();
      this.inLexifiedContextStack.pop();
      posInfo.exit();

      this.rightmostFailurePosition = Math.max(
          this.rightmostFailurePosition,
          this._rightmostFailurePositionStack.pop()
      );

      if (optNode) {
        this.pushBinding(optNode, origPos);
      }
    },

    enterLexifiedContext() {
      this.inLexifiedContextStack.push(true);
    },

    exitLexifiedContext() {
      this.inLexifiedContextStack.pop();
    },

    currentApplication() {
      return this._applicationStack[this._applicationStack.length - 1];
    },

    inSyntacticContext() {
      const currentApplication = this.currentApplication();
      if (currentApplication) {
        return currentApplication.isSyntactic() && !this.inLexifiedContext();
      } else {
        // The top-level context is syntactic if the start application is.
        return this.startExpr.factors[0].isSyntactic();
      }
    },

    inLexifiedContext() {
      return this.inLexifiedContextStack[this.inLexifiedContextStack.length - 1];
    },

    skipSpaces() {
      this.pushFailuresInfo();
      this.eval(applySpaces);
      this.popBinding();
      this.popFailuresInfo();
      return this.inputStream.pos;
    },

    skipSpacesIfInSyntacticContext() {
      return this.inSyntacticContext() ? this.skipSpaces() : this.inputStream.pos;
    },

    maybeSkipSpacesBefore(expr) {
      if (expr.allowsSkippingPrecedingSpace() && expr !== applySpaces) {
        return this.skipSpacesIfInSyntacticContext();
      } else {
        return this.inputStream.pos;
      }
    },

    pushBinding(node, origPos) {
      this._bindings.push(node);
      this._bindingOffsets.push(this.posToOffset(origPos));
    },

    popBinding() {
      this._bindings.pop();
      this._bindingOffsets.pop();
    },

    numBindings() {
      return this._bindings.length;
    },

    truncateBindings(newLength) {
      // Yes, this is this really faster than setting the `length` property (tested with
      // bin/es5bench on Node v6.1.0).
      // Update 2021-10-25: still true on v14.15.5 — it's ~20% speedup on es5bench.
      while (this._bindings.length > newLength) {
        this.popBinding();
      }
    },

    getCurrentPosInfo() {
      return this.getPosInfo(this.inputStream.pos);
    },

    getPosInfo(pos) {
      let posInfo = this.memoTable[pos];
      if (!posInfo) {
        posInfo = this.memoTable[pos] = new PosInfo();
      }
      return posInfo;
    },

    processFailure(pos, expr) {
      this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, pos);

      if (this.recordedFailures && pos === this.positionToRecordFailures) {
        const app = this.currentApplication();
        if (app) {
          // Substitute parameters with the actual pexprs that were passed to
          // the current rule.
          expr = expr.substituteParams(app.args);
        }

        this.recordFailure(expr.toFailure(this.grammar), false);
      }
    },

    recordFailure(failure, shouldCloneIfNew) {
      const key = failure.toKey();
      if (!this.recordedFailures[key]) {
        this.recordedFailures[key] = shouldCloneIfNew ? failure.clone() : failure;
      } else if (this.recordedFailures[key].isFluffy() && !failure.isFluffy()) {
        this.recordedFailures[key].clearFluffy();
      }
    },

    recordFailures(failures, shouldCloneIfNew) {
      Object.keys(failures).forEach(key => {
        this.recordFailure(failures[key], shouldCloneIfNew);
      });
    },

    cloneRecordedFailures() {
      if (!this.recordedFailures) {
        return undefined;
      }

      const ans = Object.create(null);
      Object.keys(this.recordedFailures).forEach(key => {
        ans[key] = this.recordedFailures[key].clone();
      });
      return ans;
    },

    getRightmostFailurePosition() {
      return this.rightmostFailurePosition;
    },

    _getRightmostFailureOffset() {
      return this.rightmostFailurePosition >= 0 ?
        this.posToOffset(this.rightmostFailurePosition) :
        -1;
    },

    // Returns the memoized trace entry for `expr` at `pos`, if one exists, `null` otherwise.
    getMemoizedTraceEntry(pos, expr) {
      const posInfo = this.memoTable[pos];
      if (posInfo && expr instanceof pexprs$5.Apply) {
        const memoRec = posInfo.memo[expr.toMemoKey()];
        if (memoRec && memoRec.traceEntry) {
          const entry = memoRec.traceEntry.cloneWithExpr(expr);
          entry.isMemoized = true;
          return entry;
        }
      }
      return null;
    },

    // Returns a new trace entry, with the currently active trace array as its children.
    getTraceEntry(pos, expr, succeeded, bindings) {
      if (expr instanceof pexprs$5.Apply) {
        const app = this.currentApplication();
        const actuals = app ? app.args : [];
        expr = expr.substituteParams(actuals);
      }
      return (
        this.getMemoizedTraceEntry(pos, expr) ||
        new Trace(this.input, pos, this.inputStream.pos, expr, succeeded, bindings, this.trace)
      );
    },

    isTracing() {
      return !!this.trace;
    },

    hasNecessaryInfo(memoRec) {
      if (this.trace && !memoRec.traceEntry) {
        return false;
      }

      if (
        this.recordedFailures &&
        this.inputStream.pos + memoRec.rightmostFailureOffset === this.positionToRecordFailures
      ) {
        return !!memoRec.failuresAtRightmostPosition;
      }

      return true;
    },

    useMemoizedResult(origPos, memoRec) {
      if (this.trace) {
        this.trace.push(memoRec.traceEntry);
      }

      const memoRecRightmostFailurePosition =
        this.inputStream.pos + memoRec.rightmostFailureOffset;
      this.rightmostFailurePosition = Math.max(
          this.rightmostFailurePosition,
          memoRecRightmostFailurePosition
      );
      if (
        this.recordedFailures &&
        this.positionToRecordFailures === memoRecRightmostFailurePosition &&
        memoRec.failuresAtRightmostPosition
      ) {
        this.recordFailures(memoRec.failuresAtRightmostPosition, true);
      }

      this.inputStream.examinedLength = Math.max(
          this.inputStream.examinedLength,
          memoRec.examinedLength + origPos
      );

      if (memoRec.value) {
        this.inputStream.pos += memoRec.matchLength;
        this.pushBinding(memoRec.value, origPos);
        return true;
      }
      return false;
    },

    // Evaluate `expr` and return `true` if it succeeded, `false` otherwise. On success, `bindings`
    // will have `expr.getArity()` more elements than before, and the input stream's position may
    // have increased. On failure, `bindings` and position will be unchanged.
    eval(expr) {
      const {inputStream} = this;
      const origNumBindings = this._bindings.length;

      let origRecordedFailures;
      if (this.recordedFailures) {
        origRecordedFailures = this.recordedFailures;
        this.recordedFailures = Object.create(null);
      }

      const origPos = inputStream.pos;
      const memoPos = this.maybeSkipSpacesBefore(expr);

      let origTrace;
      if (this.trace) {
        origTrace = this.trace;
        this.trace = [];
      }

      // Do the actual evaluation.
      const ans = expr.eval(this);

      if (this.trace) {
        const bindings = this._bindings.slice(origNumBindings);
        const traceEntry = this.getTraceEntry(memoPos, expr, ans, bindings);
        traceEntry.isImplicitSpaces = expr === applySpaces;
        traceEntry.isRootNode = expr === this.startExpr;
        origTrace.push(traceEntry);
        this.trace = origTrace;
      }

      if (ans) {
        if (this.recordedFailures && inputStream.pos === this.positionToRecordFailures) {
          Object.keys(this.recordedFailures).forEach(key => {
            this.recordedFailures[key].makeFluffy();
          });
        }
      } else {
        // Reset the position and the bindings.
        inputStream.pos = origPos;
        this.truncateBindings(origNumBindings);
      }

      if (this.recordedFailures) {
        this.recordFailures(origRecordedFailures, false);
      }

      // The built-in applySyntactic rule needs special handling: we want to skip
      // trailing spaces, just as with the top-level application of a syntactic rule.
      if (expr === builtInApplySyntacticBody) {
        this.skipSpaces();
      }

      return ans;
    },

    getMatchResult() {
      this.eval(this.startExpr);
      let rightmostFailures;
      if (this.recordedFailures) {
        rightmostFailures = Object.keys(this.recordedFailures).map(
            key => this.recordedFailures[key]
        );
      }
      const cst = this._bindings[0];
      if (cst) {
        cst.grammar = this.grammar;
      }
      return new MatchResult$1(
          this.matcher,
          this.input,
          this.startExpr,
          cst,
          this._bindingOffsets[0],
          this.rightmostFailurePosition,
          rightmostFailures
      );
    },

    getTrace() {
      this.trace = [];
      const matchResult = this.getMatchResult();

      // The trace node for the start rule is always the last entry. If it is a syntactic rule,
      // the first entry is for an application of 'spaces'.
      // TODO(pdubroy): Clean this up by introducing a special `Match<startAppl>` rule, which will
      // ensure that there is always a single root trace node.
      const rootTrace = this.trace[this.trace.length - 1];
      rootTrace.result = matchResult;
      return rootTrace;
    },

    pushFailuresInfo() {
      this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
      this._recordedFailuresStack.push(this.recordedFailures);
    },

    popFailuresInfo() {
      this.rightmostFailurePosition = this._rightmostFailurePositionStack.pop();
      this.recordedFailures = this._recordedFailuresStack.pop();
    },
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var MatchState_1 = MatchState$1;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const MatchState = MatchState_1;

  const pexprs$4 = pexprs$6;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function Matcher$1(grammar) {
    this.grammar = grammar;
    this.memoTable = [];
    this.input = '';
  }

  Matcher$1.prototype.getInput = function() {
    return this.input;
  };

  Matcher$1.prototype.setInput = function(str) {
    if (this.input !== str) {
      this.replaceInputRange(0, this.input.length, str);
    }
    return this;
  };

  Matcher$1.prototype.replaceInputRange = function(startIdx, endIdx, str) {
    const currentInput = this.input;
    if (
      startIdx < 0 ||
      startIdx > currentInput.length ||
      endIdx < 0 ||
      endIdx > currentInput.length ||
      startIdx > endIdx
    ) {
      throw new Error('Invalid indices: ' + startIdx + ' and ' + endIdx);
    }

    // update input
    this.input = currentInput.slice(0, startIdx) + str + currentInput.slice(endIdx);

    // update memo table (similar to the above)
    const restOfMemoTable = this.memoTable.slice(endIdx);
    this.memoTable.length = startIdx;
    for (let idx = 0; idx < str.length; idx++) {
      this.memoTable.push(undefined);
    }
    restOfMemoTable.forEach(function(posInfo) {
      this.memoTable.push(posInfo);
    }, this);

    // Invalidate memoRecs
    for (let pos = 0; pos < startIdx; pos++) {
      const posInfo = this.memoTable[pos];
      if (posInfo) {
        posInfo.clearObsoleteEntries(pos, startIdx);
      }
    }

    return this;
  };

  Matcher$1.prototype.match = function(optStartApplicationStr) {
    return this._match(this._getStartExpr(optStartApplicationStr), false);
  };

  Matcher$1.prototype.trace = function(optStartApplicationStr) {
    return this._match(this._getStartExpr(optStartApplicationStr), true);
  };

  Matcher$1.prototype._match = function(startExpr, tracing, optPositionToRecordFailures) {
    const state = new MatchState(this, startExpr, optPositionToRecordFailures);
    return tracing ? state.getTrace() : state.getMatchResult();
  };

  /*
    Returns the starting expression for this Matcher's associated grammar. If `optStartApplicationStr`
    is specified, it is a string expressing a rule application in the grammar. If not specified, the
    grammar's default start rule will be used.
  */
  Matcher$1.prototype._getStartExpr = function(optStartApplicationStr) {
    const applicationStr = optStartApplicationStr || this.grammar.defaultStartRule;
    if (!applicationStr) {
      throw new Error('Missing start rule argument -- the grammar has no default start rule.');
    }

    const startApp = this.grammar.parseApplication(applicationStr);
    return new pexprs$4.Seq([startApp, pexprs$4.end]);
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var Matcher_1 = Matcher$1;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const InputStream$1 = InputStream_1;
  const {IterationNode} = nodes$1;
  const MatchResult = MatchResult_1;
  const common$3 = common$l;
  const errors$3 = errors$9;
  const util$2 = util$7;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  const globalActionStack = [];

  const hasOwnProperty$1 = (x, prop) => Object.prototype.hasOwnProperty.call(x, prop);

  // ----------------- Wrappers -----------------

  // Wrappers decorate CST nodes with all of the functionality (i.e., operations and attributes)
  // provided by a Semantics (see below). `Wrapper` is the abstract superclass of all wrappers. A
  // `Wrapper` must have `_node` and `_semantics` instance variables, which refer to the CST node and
  // Semantics (resp.) for which it was created, and a `_childWrappers` instance variable which is
  // used to cache the wrapper instances that are created for its child nodes. Setting these instance
  // variables is the responsibility of the constructor of each Semantics-specific subclass of
  // `Wrapper`.
  class Wrapper {
    constructor(node, sourceInterval, baseInterval) {
      this._node = node;
      this.source = sourceInterval;

      // The interval that the childOffsets of `node` are relative to. It should be the source
      // of the closest Nonterminal node.
      this._baseInterval = baseInterval;

      if (node.isNonterminal()) {
        common$3.assert(sourceInterval === baseInterval);
      }
      this._childWrappers = [];
    }

    toString() {
      return '[semantics wrapper for ' + this._node.grammar.name + ']';
    }

    _forgetMemoizedResultFor(attributeName) {
      // Remove the memoized attribute from the cstNode and all its children.
      delete this._node[this._semantics.attributeKeys[attributeName]];
      this.children.forEach(child => {
        child._forgetMemoizedResultFor(attributeName);
      });
    }

    // Returns the wrapper of the specified child node. Child wrappers are created lazily and
    // cached in the parent wrapper's `_childWrappers` instance variable.
    child(idx) {
      if (!(0 <= idx && idx < this._node.numChildren())) {
        // TODO: Consider throwing an exception here.
        return undefined;
      }
      let childWrapper = this._childWrappers[idx];
      if (!childWrapper) {
        const childNode = this._node.childAt(idx);
        const offset = this._node.childOffsets[idx];

        const source = this._baseInterval.subInterval(offset, childNode.matchLength);
        const base = childNode.isNonterminal() ? source : this._baseInterval;
        childWrapper = this._childWrappers[idx] = this._semantics.wrap(childNode, source, base);
      }
      return childWrapper;
    }

    // Returns an array containing the wrappers of all of the children of the node associated
    // with this wrapper.
    _children() {
      // Force the creation of all child wrappers
      for (let idx = 0; idx < this._node.numChildren(); idx++) {
        this.child(idx);
      }
      return this._childWrappers;
    }

    // Returns `true` if the CST node associated with this wrapper corresponds to an iteration
    // expression, i.e., a Kleene-*, Kleene-+, or an optional. Returns `false` otherwise.
    isIteration() {
      return this._node.isIteration();
    }

    // Returns `true` if the CST node associated with this wrapper is a terminal node, `false`
    // otherwise.
    isTerminal() {
      return this._node.isTerminal();
    }

    // Returns `true` if the CST node associated with this wrapper is a nonterminal node, `false`
    // otherwise.
    isNonterminal() {
      return this._node.isNonterminal();
    }

    // Returns `true` if the CST node associated with this wrapper is a nonterminal node
    // corresponding to a syntactic rule, `false` otherwise.
    isSyntactic() {
      return this.isNonterminal() && this._node.isSyntactic();
    }

    // Returns `true` if the CST node associated with this wrapper is a nonterminal node
    // corresponding to a lexical rule, `false` otherwise.
    isLexical() {
      return this.isNonterminal() && this._node.isLexical();
    }

    // Returns `true` if the CST node associated with this wrapper is an iterator node
    // having either one or no child (? operator), `false` otherwise.
    // Otherwise, throws an exception.
    isOptional() {
      return this._node.isOptional();
    }

    // Create a new _iter wrapper in the same semantics as this wrapper.
    iteration(optChildWrappers) {
      const childWrappers = optChildWrappers || [];

      const childNodes = childWrappers.map(c => c._node);
      const iter = new IterationNode(childNodes, [], -1, false);

      const wrapper = this._semantics.wrap(iter, null, null);
      wrapper._childWrappers = childWrappers;
      return wrapper;
    }

    // Returns an array containing the children of this CST node.
    get children() {
      return this._children();
    }

    // Returns the name of grammar rule that created this CST node.
    get ctorName() {
      return this._node.ctorName;
    }

    // TODO: Remove this eventually (deprecated in v0.12).
    get interval() {
      throw new Error('The `interval` property is deprecated -- use `source` instead');
    }

    // Returns the number of children of this CST node.
    get numChildren() {
      return this._node.numChildren();
    }

    // Returns the contents of the input stream consumed by this CST node.
    get sourceString() {
      return this.source.contents;
    }
  }

  // ----------------- Semantics -----------------

  // A Semantics is a container for a family of Operations and Attributes for a given grammar.
  // Semantics enable modularity (different clients of a grammar can create their set of operations
  // and attributes in isolation) and extensibility even when operations and attributes are mutually-
  // recursive. This constructor should not be called directly except from
  // `Semantics.createSemantics`. The normal ways to create a Semantics, given a grammar 'g', are
  // `g.createSemantics()` and `g.extendSemantics(parentSemantics)`.
  function Semantics$2(grammar, superSemantics) {
    const self = this;
    this.grammar = grammar;
    this.checkedActionDicts = false;

    // Constructor for wrapper instances, which are passed as the arguments to the semantic actions
    // of an operation or attribute. Operations and attributes require double dispatch: the semantic
    // action is chosen based on both the node's type and the semantics. Wrappers ensure that
    // the `execute` method is called with the correct (most specific) semantics object as an
    // argument.
    this.Wrapper = class extends (superSemantics ? superSemantics.Wrapper : Wrapper) {
      constructor(node, sourceInterval, baseInterval) {
        super(node, sourceInterval, baseInterval);
        self.checkActionDictsIfHaventAlready();
        this._semantics = self;
      }
    };

    this.super = superSemantics;
    if (superSemantics) {
      if (!(grammar.equals(this.super.grammar) || grammar._inheritsFrom(this.super.grammar))) {
        throw new Error(
            "Cannot extend a semantics for grammar '" +
            this.super.grammar.name +
            "' for use with grammar '" +
            grammar.name +
            "' (not a sub-grammar)"
        );
      }
      this.operations = Object.create(this.super.operations);
      this.attributes = Object.create(this.super.attributes);
      this.attributeKeys = Object.create(null);

      // Assign unique symbols for each of the attributes inherited from the super-semantics so that
      // they are memoized independently.
      // eslint-disable-next-line guard-for-in
      for (const attributeName in this.attributes) {
        Object.defineProperty(this.attributeKeys, attributeName, {
          value: util$2.uniqueId(attributeName),
        });
      }
    } else {
      this.operations = Object.create(null);
      this.attributes = Object.create(null);
      this.attributeKeys = Object.create(null);
    }
  }

  Semantics$2.prototype.toString = function() {
    return '[semantics for ' + this.grammar.name + ']';
  };

  Semantics$2.prototype.checkActionDictsIfHaventAlready = function() {
    if (!this.checkedActionDicts) {
      this.checkActionDicts();
      this.checkedActionDicts = true;
    }
  };

  // Checks that the action dictionaries for all operations and attributes in this semantics,
  // including the ones that were inherited from the super-semantics, agree with the grammar.
  // Throws an exception if one or more of them doesn't.
  Semantics$2.prototype.checkActionDicts = function() {
    let name;
    // eslint-disable-next-line guard-for-in
    for (name in this.operations) {
      this.operations[name].checkActionDict(this.grammar);
    }
    // eslint-disable-next-line guard-for-in
    for (name in this.attributes) {
      this.attributes[name].checkActionDict(this.grammar);
    }
  };

  Semantics$2.prototype.toRecipe = function(semanticsOnly) {
    function hasSuperSemantics(s) {
      return s.super !== Semantics$2.BuiltInSemantics._getSemantics();
    }

    let str = '(function(g) {\n';
    if (hasSuperSemantics(this)) {
      str += '  var semantics = ' + this.super.toRecipe(true) + '(g';

      const superSemanticsGrammar = this.super.grammar;
      let relatedGrammar = this.grammar;
      while (relatedGrammar !== superSemanticsGrammar) {
        str += '.superGrammar';
        relatedGrammar = relatedGrammar.superGrammar;
      }

      str += ');\n';
      str += '  return g.extendSemantics(semantics)';
    } else {
      str += '  return g.createSemantics()';
    }
    ['Operation', 'Attribute'].forEach(type => {
      const semanticOperations = this[type.toLowerCase() + 's'];
      Object.keys(semanticOperations).forEach(name => {
        const {actionDict, formals, builtInDefault} = semanticOperations[name];

        let signature = name;
        if (formals.length > 0) {
          signature += '(' + formals.join(', ') + ')';
        }

        let method;
        if (hasSuperSemantics(this) && this.super[type.toLowerCase() + 's'][name]) {
          method = 'extend' + type;
        } else {
          method = 'add' + type;
        }
        str += '\n    .' + method + '(' + JSON.stringify(signature) + ', {';

        const srcArray = [];
        Object.keys(actionDict).forEach(actionName => {
          if (actionDict[actionName] !== builtInDefault) {
            let source = actionDict[actionName].toString().trim();

            // Convert method shorthand to plain old function syntax.
            // https://github.com/harc/ohm/issues/263
            source = source.replace(/^.*\(/, 'function(');

            srcArray.push('\n      ' + JSON.stringify(actionName) + ': ' + source);
          }
        });
        str += srcArray.join(',') + '\n    })';
      });
    });
    str += ';\n  })';

    if (!semanticsOnly) {
      str =
        '(function() {\n' +
        '  var grammar = this.fromRecipe(' +
        this.grammar.toRecipe() +
        ');\n' +
        '  var semantics = ' +
        str +
        '(grammar);\n' +
        '  return semantics;\n' +
        '});\n';
    }

    return str;
  };

  function parseSignature$1(signature, type) {
    if (!Semantics$2.prototypeGrammar) {
      // The Operations and Attributes grammar won't be available while Ohm is loading,
      // but we can get away the following simplification b/c none of the operations
      // that are used while loading take arguments.
      common$3.assert(signature.indexOf('(') === -1);
      return {
        name: signature,
        formals: [],
      };
    }

    const r = Semantics$2.prototypeGrammar.match(
        signature,
      type === 'operation' ? 'OperationSignature' : 'AttributeSignature'
    );
    if (r.failed()) {
      throw new Error(r.message);
    }

    return Semantics$2.prototypeGrammarSemantics(r).parse();
  }

  function newDefaultAction(type, name, doIt) {
    return function(...children) {
      const thisThing = this._semantics.operations[name] || this._semantics.attributes[name];
      const args = thisThing.formals.map(formal => this.args[formal]);

      if (!this.isIteration() && children.length === 1) {
        // This CST node corresponds to a non-terminal in the grammar (e.g., AddExpr). The fact that
        // we got here means that this action dictionary doesn't have an action for this particular
        // non-terminal or a generic `_nonterminal` action.
        // As a convenience, if this node only has one child, we just return the result of applying
        // this operation / attribute to the child node.
        return doIt.apply(children[0], args);
      } else {
        // Otherwise, we throw an exception to let the programmer know that we don't know what
        // to do with this node.
        throw errors$3.missingSemanticAction(this.ctorName, name, type, globalActionStack);
      }
    };
  }

  Semantics$2.prototype.addOperationOrAttribute = function(type, signature, actionDict) {
    const typePlural = type + 's';

    const parsedNameAndFormalArgs = parseSignature$1(signature, type);
    const {name} = parsedNameAndFormalArgs;
    const {formals} = parsedNameAndFormalArgs;

    // TODO: check that there are no duplicate formal arguments

    this.assertNewName(name, type);

    // Create the action dictionary for this operation / attribute that contains a `_default` action
    // which defines the default behavior of iteration, terminal, and non-terminal nodes...
    const builtInDefault = newDefaultAction(type, name, doIt);
    const realActionDict = {_default: builtInDefault};
    // ... and add in the actions supplied by the programmer, which may override some or all of the
    // default ones.
    Object.keys(actionDict).forEach(name => {
      realActionDict[name] = actionDict[name];
    });

    const entry =
      type === 'operation' ?
        new Operation(name, formals, realActionDict, builtInDefault) :
        new Attribute(name, realActionDict, builtInDefault);

    // The following check is not strictly necessary (it will happen later anyway) but it's better to
    // catch errors early.
    entry.checkActionDict(this.grammar);

    this[typePlural][name] = entry;

    function doIt(...args) {
      // Dispatch to most specific version of this operation / attribute -- it may have been
      // overridden by a sub-semantics.
      const thisThing = this._semantics[typePlural][name];

      // Check that the caller passed the correct number of arguments.
      if (arguments.length !== thisThing.formals.length) {
        throw new Error(
            'Invalid number of arguments passed to ' +
            name +
            ' ' +
            type +
            ' (expected ' +
            thisThing.formals.length +
            ', got ' +
            arguments.length +
            ')'
        );
      }

      // Create an "arguments object" from the arguments that were passed to this
      // operation / attribute.
      const argsObj = Object.create(null);
      for (const [idx, val] of Object.entries(args)) {
        const formal = thisThing.formals[idx];
        argsObj[formal] = val;
      }

      const oldArgs = this.args;
      this.args = argsObj;
      const ans = thisThing.execute(this._semantics, this);
      this.args = oldArgs;
      return ans;
    }

    if (type === 'operation') {
      this.Wrapper.prototype[name] = doIt;
      this.Wrapper.prototype[name].toString = function() {
        return '[' + name + ' operation]';
      };
    } else {
      Object.defineProperty(this.Wrapper.prototype, name, {
        get: doIt,
        configurable: true, // So the property can be deleted.
      });
      Object.defineProperty(this.attributeKeys, name, {
        value: util$2.uniqueId(name),
      });
    }
  };

  Semantics$2.prototype.extendOperationOrAttribute = function(type, name, actionDict) {
    const typePlural = type + 's';

    // Make sure that `name` really is just a name, i.e., that it doesn't also contain formals.
    parseSignature$1(name, 'attribute');

    if (!(this.super && name in this.super[typePlural])) {
      throw new Error(
          'Cannot extend ' +
          type +
          " '" +
          name +
          "': did not inherit an " +
          type +
          ' with that name'
      );
    }
    if (hasOwnProperty$1(this[typePlural], name)) {
      throw new Error('Cannot extend ' + type + " '" + name + "' again");
    }

    // Create a new operation / attribute whose actionDict delegates to the super operation /
    // attribute's actionDict, and which has all the keys from `inheritedActionDict`.
    const inheritedFormals = this[typePlural][name].formals;
    const inheritedActionDict = this[typePlural][name].actionDict;
    const newActionDict = Object.create(inheritedActionDict);
    Object.keys(actionDict).forEach(name => {
      newActionDict[name] = actionDict[name];
    });

    this[typePlural][name] =
      type === 'operation' ?
        new Operation(name, inheritedFormals, newActionDict) :
        new Attribute(name, newActionDict);

    // The following check is not strictly necessary (it will happen later anyway) but it's better to
    // catch errors early.
    this[typePlural][name].checkActionDict(this.grammar);
  };

  Semantics$2.prototype.assertNewName = function(name, type) {
    if (hasOwnProperty$1(Wrapper.prototype, name)) {
      throw new Error('Cannot add ' + type + " '" + name + "': that's a reserved name");
    }
    if (name in this.operations) {
      throw new Error(
          'Cannot add ' + type + " '" + name + "': an operation with that name already exists"
      );
    }
    if (name in this.attributes) {
      throw new Error(
          'Cannot add ' + type + " '" + name + "': an attribute with that name already exists"
      );
    }
  };

  // Returns a wrapper for the given CST `node` in this semantics.
  // If `node` is already a wrapper, returns `node` itself.  // TODO: why is this needed?
  Semantics$2.prototype.wrap = function(node, source, optBaseInterval) {
    const baseInterval = optBaseInterval || source;
    return node instanceof this.Wrapper ? node : new this.Wrapper(node, source, baseInterval);
  };

  // Creates a new Semantics instance for `grammar`, inheriting operations and attributes from
  // `optSuperSemantics`, if it is specified. Returns a function that acts as a proxy for the new
  // Semantics instance. When that function is invoked with a CST node as an argument, it returns
  // a wrapper for that node which gives access to the operations and attributes provided by this
  // semantics.
  Semantics$2.createSemantics = function(grammar, optSuperSemantics) {
    const s = new Semantics$2(
        grammar,
      optSuperSemantics !== undefined ?
        optSuperSemantics :
        Semantics$2.BuiltInSemantics._getSemantics()
    );

    // To enable clients to invoke a semantics like a function, return a function that acts as a proxy
    // for `s`, which is the real `Semantics` instance.
    const proxy = function ASemantics(matchResult) {
      if (!(matchResult instanceof MatchResult)) {
        throw new TypeError(
            'Semantics expected a MatchResult, but got ' +
            common$3.unexpectedObjToString(matchResult)
        );
      }
      if (matchResult.failed()) {
        throw new TypeError('cannot apply Semantics to ' + matchResult.toString());
      }

      const cst = matchResult._cst;
      if (cst.grammar !== grammar) {
        throw new Error(
            "Cannot use a MatchResult from grammar '" +
            cst.grammar.name +
            "' with a semantics for '" +
            grammar.name +
            "'"
        );
      }
      const inputStream = new InputStream$1(matchResult.input);
      return s.wrap(cst, inputStream.interval(matchResult._cstOffset, matchResult.input.length));
    };

    // Forward public methods from the proxy to the semantics instance.
    proxy.addOperation = function(signature, actionDict) {
      s.addOperationOrAttribute('operation', signature, actionDict);
      return proxy;
    };
    proxy.extendOperation = function(name, actionDict) {
      s.extendOperationOrAttribute('operation', name, actionDict);
      return proxy;
    };
    proxy.addAttribute = function(name, actionDict) {
      s.addOperationOrAttribute('attribute', name, actionDict);
      return proxy;
    };
    proxy.extendAttribute = function(name, actionDict) {
      s.extendOperationOrAttribute('attribute', name, actionDict);
      return proxy;
    };
    proxy._getActionDict = function(operationOrAttributeName) {
      const action =
        s.operations[operationOrAttributeName] || s.attributes[operationOrAttributeName];
      if (!action) {
        throw new Error(
            '"' +
            operationOrAttributeName +
            '" is not a valid operation or attribute ' +
            'name in this semantics for "' +
            grammar.name +
            '"'
        );
      }
      return action.actionDict;
    };
    proxy._remove = function(operationOrAttributeName) {
      let semantic;
      if (operationOrAttributeName in s.operations) {
        semantic = s.operations[operationOrAttributeName];
        delete s.operations[operationOrAttributeName];
      } else if (operationOrAttributeName in s.attributes) {
        semantic = s.attributes[operationOrAttributeName];
        delete s.attributes[operationOrAttributeName];
      }
      delete s.Wrapper.prototype[operationOrAttributeName];
      return semantic;
    };
    proxy.getOperationNames = function() {
      return Object.keys(s.operations);
    };
    proxy.getAttributeNames = function() {
      return Object.keys(s.attributes);
    };
    proxy.getGrammar = function() {
      return s.grammar;
    };
    proxy.toRecipe = function(semanticsOnly) {
      return s.toRecipe(semanticsOnly);
    };

    // Make the proxy's toString() work.
    proxy.toString = s.toString.bind(s);

    // Returns the semantics for the proxy.
    proxy._getSemantics = function() {
      return s;
    };

    return proxy;
  };

  // ----------------- Operation -----------------

  // An Operation represents a function to be applied to a concrete syntax tree (CST) -- it's very
  // similar to a Visitor (http://en.wikipedia.org/wiki/Visitor_pattern). An operation is executed by
  // recursively walking the CST, and at each node, invoking the matching semantic action from
  // `actionDict`. See `Operation.prototype.execute` for details of how a CST node's matching semantic
  // action is found.
  class Operation {
    constructor(name, formals, actionDict, builtInDefault) {
      this.name = name;
      this.formals = formals;
      this.actionDict = actionDict;
      this.builtInDefault = builtInDefault;
    }

    checkActionDict(grammar) {
      grammar._checkTopDownActionDict(this.typeName, this.name, this.actionDict);
    }

    // Execute this operation on the CST node associated with `nodeWrapper` in the context of the
    // given Semantics instance.
    execute(semantics, nodeWrapper) {
      try {
        // Look for a semantic action whose name matches the node's constructor name, which is either
        // the name of a rule in the grammar, or '_terminal' (for a terminal node), or '_iter' (for an
        // iteration node).
        const {ctorName} = nodeWrapper._node;
        let actionFn = this.actionDict[ctorName];
        if (actionFn) {
          globalActionStack.push([this, ctorName]);
          return actionFn.apply(nodeWrapper, nodeWrapper._children());
        }

        // The action dictionary does not contain a semantic action for this specific type of node.
        // If this is a nonterminal node and the programmer has provided a `_nonterminal` semantic
        // action, we invoke it:
        if (nodeWrapper.isNonterminal()) {
          actionFn = this.actionDict._nonterminal;
          if (actionFn) {
            globalActionStack.push([this, '_nonterminal', ctorName]);
            return actionFn.apply(nodeWrapper, nodeWrapper._children());
          }
        }

        // Otherwise, we invoke the '_default' semantic action.
        globalActionStack.push([this, 'default action', ctorName]);
        return this.actionDict._default.apply(nodeWrapper, nodeWrapper._children());
      } finally {
        globalActionStack.pop();
      }
    }
  }

  Operation.prototype.typeName = 'operation';

  // ----------------- Attribute -----------------

  // Attributes are Operations whose results are memoized. This means that, for any given semantics,
  // the semantic action for a CST node will be invoked no more than once.
  class Attribute extends Operation {
    constructor(name, actionDict, builtInDefault) {
      super(name, [], actionDict, builtInDefault);
    }

    execute(semantics, nodeWrapper) {
      const node = nodeWrapper._node;
      const key = semantics.attributeKeys[this.name];
      if (!hasOwnProperty$1(node, key)) {
        // The following is a super-send -- isn't JS beautiful? :/
        node[key] = Operation.prototype.execute.call(this, semantics, nodeWrapper);
      }
      return node[key];
    }
  }

  Attribute.prototype.typeName = 'attribute';

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var Semantics_1 = Semantics$2;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const CaseInsensitiveTerminal = CaseInsensitiveTerminal_1;
  const Matcher = Matcher_1;
  const Semantics$1 = Semantics_1;
  const common$2 = common$l;
  const errors$2 = errors$9;
  const pexprs$3 = pexprs$6;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  const SPECIAL_ACTION_NAMES = ['_iter', '_terminal', '_nonterminal', '_default'];

  function getSortedRuleValues(grammar) {
    return Object.keys(grammar.rules)
        .sort()
        .map(name => grammar.rules[name]);
  }

  // Until ES2019, JSON was not a valid subset of JavaScript because U+2028 (line separator)
  // and U+2029 (paragraph separator) are allowed in JSON string literals, but not in JS.
  // This function properly encodes those two characters so that the resulting string is
  // represents both valid JSON, and valid JavaScript (for ES2018 and below).
  // See https://v8.dev/features/subsume-json for more details.
  const jsonToJS = str => str.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

  function Grammar$4(name, superGrammar, rules, optDefaultStartRule) {
    this.name = name;
    this.superGrammar = superGrammar;
    this.rules = rules;
    if (optDefaultStartRule) {
      if (!(optDefaultStartRule in rules)) {
        throw new Error(
            "Invalid start rule: '" +
            optDefaultStartRule +
            "' is not a rule in grammar '" +
            name +
            "'"
        );
      }
      this.defaultStartRule = optDefaultStartRule;
    }
  }

  let ohmGrammar$2;
  let buildGrammar$1;

  // This method is called from main.js once Ohm has loaded.
  Grammar$4.initApplicationParser = function(grammar, builderFn) {
    ohmGrammar$2 = grammar;
    buildGrammar$1 = builderFn;
  };

  Grammar$4.prototype = {
    matcher() {
      return new Matcher(this);
    },

    // Return true if the grammar is a built-in grammar, otherwise false.
    // NOTE: This might give an unexpected result if called before BuiltInRules is defined!
    isBuiltIn() {
      return this === Grammar$4.ProtoBuiltInRules || this === Grammar$4.BuiltInRules;
    },

    equals(g) {
      if (this === g) {
        return true;
      }
      // Do the cheapest comparisons first.
      if (
        g == null ||
        this.name !== g.name ||
        this.defaultStartRule !== g.defaultStartRule ||
        !(this.superGrammar === g.superGrammar || this.superGrammar.equals(g.superGrammar))
      ) {
        return false;
      }
      const myRules = getSortedRuleValues(this);
      const otherRules = getSortedRuleValues(g);
      return (
        myRules.length === otherRules.length &&
        myRules.every((rule, i) => {
          return (
            rule.description === otherRules[i].description &&
            rule.formals.join(',') === otherRules[i].formals.join(',') &&
            rule.body.toString() === otherRules[i].body.toString()
          );
        })
      );
    },

    match(input, optStartApplication) {
      const m = this.matcher();
      m.replaceInputRange(0, 0, input);
      return m.match(optStartApplication);
    },

    trace(input, optStartApplication) {
      const m = this.matcher();
      m.replaceInputRange(0, 0, input);
      return m.trace(optStartApplication);
    },

    createSemantics() {
      return Semantics$1.createSemantics(this);
    },

    extendSemantics(superSemantics) {
      return Semantics$1.createSemantics(this, superSemantics._getSemantics());
    },

    // Check that every key in `actionDict` corresponds to a semantic action, and that it maps to
    // a function of the correct arity. If not, throw an exception.
    _checkTopDownActionDict(what, name, actionDict) {
      const problems = [];

      // eslint-disable-next-line guard-for-in
      for (const k in actionDict) {
        const v = actionDict[k];
        const isSpecialAction = SPECIAL_ACTION_NAMES.includes(k);

        if (!isSpecialAction && !(k in this.rules)) {
          problems.push(`'${k}' is not a valid semantic action for '${this.name}'`);
          continue;
        }
        if (typeof v !== 'function') {
          problems.push(`'${k}' must be a function in an action dictionary for '${this.name}'`);
          continue;
        }
        const actual = v.length;
        const expected = this._topDownActionArity(k);
        if (actual !== expected) {
          let details;
          if (k === '_iter' || k === '_nonterminal') {
            details =
              `it should use a rest parameter, e.g. \`${k}(...children) {}\`. ` +
              'NOTE: this is new in Ohm v16 — see https://ohmjs.org/d/ati for details.';
          } else {
            details = `expected ${expected}, got ${actual}`;
          }
          problems.push(`Semantic action '${k}' has the wrong arity: ${details}`);
        }
      }
      if (problems.length > 0) {
        const prettyProblems = problems.map(problem => '- ' + problem);
        const error = new Error(
            [
              `Found errors in the action dictionary of the '${name}' ${what}:`,
              ...prettyProblems,
            ].join('\n')
        );
        error.problems = problems;
        throw error;
      }
    },

    // Return the expected arity for a semantic action named `actionName`, which
    // is either a rule name or a special action name like '_nonterminal'.
    _topDownActionArity(actionName) {
      // All special actions have an expected arity of 0, though all but _terminal
      // are expected to use the rest parameter syntax (e.g. `_iter(...children)`).
      // This is considered to have arity 0, i.e. `((...args) => {}).length` is 0.
      return SPECIAL_ACTION_NAMES.includes(actionName) ?
        0 :
        this.rules[actionName].body.getArity();
    },

    _inheritsFrom(grammar) {
      let g = this.superGrammar;
      while (g) {
        if (g.equals(grammar, true)) {
          return true;
        }
        g = g.superGrammar;
      }
      return false;
    },

    toRecipe(superGrammarExpr = undefined) {
      const metaInfo = {};
      // Include the grammar source if it is available.
      if (this.source) {
        metaInfo.source = this.source.contents;
      }

      let startRule = null;
      if (this.defaultStartRule) {
        startRule = this.defaultStartRule;
      }

      const rules = {};
      Object.keys(this.rules).forEach(ruleName => {
        const ruleInfo = this.rules[ruleName];
        const {body} = ruleInfo;
        const isDefinition = !this.superGrammar || !this.superGrammar.rules[ruleName];

        let operation;
        if (isDefinition) {
          operation = 'define';
        } else {
          operation = body instanceof pexprs$3.Extend ? 'extend' : 'override';
        }

        const metaInfo = {};
        if (ruleInfo.source && this.source) {
          const adjusted = ruleInfo.source.relativeTo(this.source);
          metaInfo.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
        }

        const description = isDefinition ? ruleInfo.description : null;
        const bodyRecipe = body.outputRecipe(ruleInfo.formals, this.source);

        rules[ruleName] = [
          operation, // "define"/"extend"/"override"
          metaInfo,
          description,
          ruleInfo.formals,
          bodyRecipe,
        ];
      });

      // If the caller provided an expression to use for the supergrammar, use that.
      // Otherwise, if the supergrammar is a user grammar, use its recipe inline.
      let superGrammarOutput = 'null';
      if (superGrammarExpr) {
        superGrammarOutput = superGrammarExpr;
      } else if (this.superGrammar && !this.superGrammar.isBuiltIn()) {
        superGrammarOutput = this.superGrammar.toRecipe();
      }

      const recipeElements = [
        ...['grammar', metaInfo, this.name].map(JSON.stringify),
        superGrammarOutput,
        ...[startRule, rules].map(JSON.stringify),
      ];
      return jsonToJS(`[${recipeElements.join(',')}]`);
    },

    // TODO: Come up with better names for these methods.
    // TODO: Write the analog of these methods for inherited attributes.
    toOperationActionDictionaryTemplate() {
      return this._toOperationOrAttributeActionDictionaryTemplate();
    },
    toAttributeActionDictionaryTemplate() {
      return this._toOperationOrAttributeActionDictionaryTemplate();
    },

    _toOperationOrAttributeActionDictionaryTemplate() {
      // TODO: add the super-grammar's templates at the right place, e.g., a case for AddExpr_plus
      // should appear next to other cases of AddExpr.

      const sb = new common$2.StringBuffer();
      sb.append('{');

      let first = true;
      // eslint-disable-next-line guard-for-in
      for (const ruleName in this.rules) {
        const {body} = this.rules[ruleName];
        if (first) {
          first = false;
        } else {
          sb.append(',');
        }
        sb.append('\n');
        sb.append('  ');
        this.addSemanticActionTemplate(ruleName, body, sb);
      }

      sb.append('\n}');
      return sb.contents();
    },

    addSemanticActionTemplate(ruleName, body, sb) {
      sb.append(ruleName);
      sb.append(': function(');
      const arity = this._topDownActionArity(ruleName);
      sb.append(common$2.repeat('_', arity).join(', '));
      sb.append(') {\n');
      sb.append('  }');
    },

    // Parse a string which expresses a rule application in this grammar, and return the
    // resulting Apply node.
    parseApplication(str) {
      let app;
      if (str.indexOf('<') === -1) {
        // simple application
        app = new pexprs$3.Apply(str);
      } else {
        // parameterized application
        const cst = ohmGrammar$2.match(str, 'Base_application');
        app = buildGrammar$1(cst, {});
      }

      // Ensure that the application is valid.
      if (!(app.ruleName in this.rules)) {
        throw errors$2.undeclaredRule(app.ruleName, this.name);
      }
      const {formals} = this.rules[app.ruleName];
      if (formals.length !== app.args.length) {
        const {source} = this.rules[app.ruleName];
        throw errors$2.wrongNumberOfParameters(
            app.ruleName,
            formals.length,
            app.args.length,
            source
        );
      }
      return app;
    },
  };

  // The following grammar contains a few rules that couldn't be written  in "userland".
  // At the bottom of src/main.js, we create a sub-grammar of this grammar that's called
  // `BuiltInRules`. That grammar contains several convenience rules, e.g., `letter` and
  // `digit`, and is implicitly the super-grammar of any grammar whose super-grammar
  // isn't specified.
  Grammar$4.ProtoBuiltInRules = new Grammar$4(
      'ProtoBuiltInRules', // name
      undefined, // supergrammar
      {
        any: {
          body: pexprs$3.any,
          formals: [],
          description: 'any character',
          primitive: true,
        },
        end: {
          body: pexprs$3.end,
          formals: [],
          description: 'end of input',
          primitive: true,
        },

        caseInsensitive: {
          body: new CaseInsensitiveTerminal(new pexprs$3.Param(0)),
          formals: ['str'],
          primitive: true,
        },
        lower: {
          body: new pexprs$3.UnicodeChar('Ll'),
          formals: [],
          description: 'a lowercase letter',
          primitive: true,
        },
        upper: {
          body: new pexprs$3.UnicodeChar('Lu'),
          formals: [],
          description: 'an uppercase letter',
          primitive: true,
        },
        // Union of Lt (titlecase), Lm (modifier), and Lo (other), i.e. any letter not in Ll or Lu.
        unicodeLtmo: {
          body: new pexprs$3.UnicodeChar('Ltmo'),
          formals: [],
          description: 'a Unicode character in Lt, Lm, or Lo',
          primitive: true,
        },

        // These rules are not truly primitive (they could be written in userland) but are defined
        // here for bootstrapping purposes.
        spaces: {
          body: new pexprs$3.Star(new pexprs$3.Apply('space')),
          formals: [],
        },
        space: {
          body: new pexprs$3.Range('\x00', ' '),
          formals: [],
          description: 'a space',
        },
      }
  );

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var Grammar_1 = Grammar$4;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Grammar$3 = Grammar_1;
  const InputStream = InputStream_1;
  const common$1 = common$l;
  const errors$1 = errors$9;
  const pexprs$2 = pexprs$6;

  // --------------------------------------------------------------------
  // Private Stuff
  // --------------------------------------------------------------------

  // Constructors

  function GrammarDecl$1(name) {
    this.name = name;
  }

  // Helpers

  GrammarDecl$1.prototype.sourceInterval = function(startIdx, endIdx) {
    return this.source.subInterval(startIdx, endIdx - startIdx);
  };

  GrammarDecl$1.prototype.ensureSuperGrammar = function() {
    if (!this.superGrammar) {
      this.withSuperGrammar(
        // TODO: The conditional expression below is an ugly hack. It's kind of ok because
        // I doubt anyone will ever try to declare a grammar called `BuiltInRules`. Still,
        // we should try to find a better way to do this.
        this.name === 'BuiltInRules' ? Grammar$3.ProtoBuiltInRules : Grammar$3.BuiltInRules
      );
    }
    return this.superGrammar;
  };

  GrammarDecl$1.prototype.ensureSuperGrammarRuleForOverriding = function(name, source) {
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    if (!ruleInfo) {
      throw errors$1.cannotOverrideUndeclaredRule(name, this.superGrammar.name, source);
    }
    return ruleInfo;
  };

  GrammarDecl$1.prototype.installOverriddenOrExtendedRule = function(
      name,
      formals,
      body,
      source
  ) {
    const duplicateParameterNames = common$1.getDuplicates(formals);
    if (duplicateParameterNames.length > 0) {
      throw errors$1.duplicateParameterNames(name, duplicateParameterNames, source);
    }
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    const expectedFormals = ruleInfo.formals;
    const expectedNumFormals = expectedFormals ? expectedFormals.length : 0;
    if (formals.length !== expectedNumFormals) {
      throw errors$1.wrongNumberOfParameters(name, expectedNumFormals, formals.length, source);
    }
    return this.install(name, formals, body, ruleInfo.description, source);
  };

  GrammarDecl$1.prototype.install = function(name, formals, body, description, source) {
    this.rules[name] = {
      body: body.introduceParams(formals),
      formals,
      description,
      source,
    };
    return this;
  };

  // Stuff that you should only do once

  GrammarDecl$1.prototype.withSuperGrammar = function(superGrammar) {
    if (this.superGrammar) {
      throw new Error('the super grammar of a GrammarDecl cannot be set more than once');
    }
    this.superGrammar = superGrammar;
    this.rules = Object.create(superGrammar.rules);

    // Grammars with an explicit supergrammar inherit a default start rule.
    if (!superGrammar.isBuiltIn()) {
      this.defaultStartRule = superGrammar.defaultStartRule;
    }
    return this;
  };

  GrammarDecl$1.prototype.withDefaultStartRule = function(ruleName) {
    this.defaultStartRule = ruleName;
    return this;
  };

  GrammarDecl$1.prototype.withSource = function(source) {
    this.source = new InputStream(source).interval(0, source.length);
    return this;
  };

  // Creates a Grammar instance, and if it passes the sanity checks, returns it.
  GrammarDecl$1.prototype.build = function() {
    const grammar = new Grammar$3(
        this.name,
        this.ensureSuperGrammar(),
        this.rules,
        this.defaultStartRule
    );

    // TODO: change the pexpr.prototype.assert... methods to make them add
    // exceptions to an array that's provided as an arg. Then we'll be able to
    // show more than one error of the same type at a time.
    // TODO: include the offending pexpr in the errors, that way we can show
    // the part of the source that caused it.
    const grammarErrors = [];
    let grammarHasInvalidApplications = false;
    Object.keys(grammar.rules).forEach(ruleName => {
      const {body} = grammar.rules[ruleName];
      try {
        body.assertChoicesHaveUniformArity(ruleName);
      } catch (e) {
        grammarErrors.push(e);
      }
      try {
        body.assertAllApplicationsAreValid(ruleName, grammar);
      } catch (e) {
        grammarErrors.push(e);
        grammarHasInvalidApplications = true;
      }
    });
    if (!grammarHasInvalidApplications) {
      // The following check can only be done if the grammar has no invalid applications.
      Object.keys(grammar.rules).forEach(ruleName => {
        const {body} = grammar.rules[ruleName];
        try {
          body.assertIteratedExprsAreNotNullable(grammar, []);
        } catch (e) {
          grammarErrors.push(e);
        }
      });
    }
    if (grammarErrors.length > 0) {
      errors$1.throwErrors(grammarErrors);
    }
    if (this.source) {
      grammar.source = this.source;
    }

    return grammar;
  };

  // Rule declarations

  GrammarDecl$1.prototype.define = function(name, formals, body, description, source) {
    this.ensureSuperGrammar();
    if (this.superGrammar.rules[name]) {
      throw errors$1.duplicateRuleDeclaration(name, this.name, this.superGrammar.name, source);
    } else if (this.rules[name]) {
      throw errors$1.duplicateRuleDeclaration(name, this.name, this.name, source);
    }
    const duplicateParameterNames = common$1.getDuplicates(formals);
    if (duplicateParameterNames.length > 0) {
      throw errors$1.duplicateParameterNames(name, duplicateParameterNames, source);
    }
    return this.install(name, formals, body, description, source);
  };

  GrammarDecl$1.prototype.override = function(name, formals, body, descIgnored, source) {
    this.ensureSuperGrammarRuleForOverriding(name, source);
    this.installOverriddenOrExtendedRule(name, formals, body, source);
    return this;
  };

  GrammarDecl$1.prototype.extend = function(name, formals, fragment, descIgnored, source) {
    const ruleInfo = this.ensureSuperGrammar().rules[name];
    if (!ruleInfo) {
      throw errors$1.cannotExtendUndeclaredRule(name, this.superGrammar.name, source);
    }
    const body = new pexprs$2.Extend(this.superGrammar, name, fragment);
    body.source = fragment.source;
    this.installOverriddenOrExtendedRule(name, formals, body, source);
    return this;
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var GrammarDecl_1 = GrammarDecl$1;

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Grammar$2 = Grammar_1;
  const GrammarDecl = GrammarDecl_1;
  const pexprs$1 = pexprs$6;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function Builder$2() {}

  Builder$2.prototype = {
    currentDecl: null,
    currentRuleName: null,

    newGrammar(name) {
      return new GrammarDecl(name);
    },

    grammar(metaInfo, name, superGrammar, defaultStartRule, rules) {
      const gDecl = new GrammarDecl(name);
      if (superGrammar) {
        // `superGrammar` may be a recipe (i.e. an Array), or an actual grammar instance.
        gDecl.withSuperGrammar(
          superGrammar instanceof Grammar$2 ? superGrammar : this.fromRecipe(superGrammar)
        );
      }
      if (defaultStartRule) {
        gDecl.withDefaultStartRule(defaultStartRule);
      }
      if (metaInfo && metaInfo.source) {
        gDecl.withSource(metaInfo.source);
      }

      this.currentDecl = gDecl;
      Object.keys(rules).forEach(ruleName => {
        this.currentRuleName = ruleName;
        const ruleRecipe = rules[ruleName];

        const action = ruleRecipe[0]; // define/extend/override
        const metaInfo = ruleRecipe[1];
        const description = ruleRecipe[2];
        const formals = ruleRecipe[3];
        const body = this.fromRecipe(ruleRecipe[4]);

        let source;
        if (gDecl.source && metaInfo && metaInfo.sourceInterval) {
          source = gDecl.source.subInterval(
              metaInfo.sourceInterval[0],
              metaInfo.sourceInterval[1] - metaInfo.sourceInterval[0]
          );
        }
        gDecl[action](ruleName, formals, body, description, source);
      });
      this.currentRuleName = this.currentDecl = null;
      return gDecl.build();
    },

    terminal(x) {
      return new pexprs$1.Terminal(x);
    },

    range(from, to) {
      return new pexprs$1.Range(from, to);
    },

    param(index) {
      return new pexprs$1.Param(index);
    },

    alt(...termArgs) {
      let terms = [];
      for (let arg of termArgs) {
        if (!(arg instanceof pexprs$1.PExpr)) {
          arg = this.fromRecipe(arg);
        }
        if (arg instanceof pexprs$1.Alt) {
          terms = terms.concat(arg.terms);
        } else {
          terms.push(arg);
        }
      }
      return terms.length === 1 ? terms[0] : new pexprs$1.Alt(terms);
    },

    seq(...factorArgs) {
      let factors = [];
      for (let arg of factorArgs) {
        if (!(arg instanceof pexprs$1.PExpr)) {
          arg = this.fromRecipe(arg);
        }
        if (arg instanceof pexprs$1.Seq) {
          factors = factors.concat(arg.factors);
        } else {
          factors.push(arg);
        }
      }
      return factors.length === 1 ? factors[0] : new pexprs$1.Seq(factors);
    },

    star(expr) {
      if (!(expr instanceof pexprs$1.PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new pexprs$1.Star(expr);
    },

    plus(expr) {
      if (!(expr instanceof pexprs$1.PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new pexprs$1.Plus(expr);
    },

    opt(expr) {
      if (!(expr instanceof pexprs$1.PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new pexprs$1.Opt(expr);
    },

    not(expr) {
      if (!(expr instanceof pexprs$1.PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new pexprs$1.Not(expr);
    },

    la(expr) {
      // TODO: temporary to still be able to read old recipes
      return this.lookahead(expr);
    },

    lookahead(expr) {
      if (!(expr instanceof pexprs$1.PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new pexprs$1.Lookahead(expr);
    },

    lex(expr) {
      if (!(expr instanceof pexprs$1.PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new pexprs$1.Lex(expr);
    },

    app(ruleName, optParams) {
      if (optParams && optParams.length > 0) {
        optParams = optParams.map(function(param) {
          return param instanceof pexprs$1.PExpr ? param : this.fromRecipe(param);
        }, this);
      }
      return new pexprs$1.Apply(ruleName, optParams);
    },

    // Note that unlike other methods in this class, this method cannot be used as a
    // convenience constructor. It only works with recipes, because it relies on
    // `this.currentDecl` and `this.currentRuleName` being set.
    splice(beforeTerms, afterTerms) {
      return new pexprs$1.Splice(
          this.currentDecl.superGrammar,
          this.currentRuleName,
          beforeTerms.map(term => this.fromRecipe(term)),
          afterTerms.map(term => this.fromRecipe(term))
      );
    },

    fromRecipe(recipe) {
      // the meta-info of 'grammar' is processed in Builder.grammar
      const args = recipe[0] === 'grammar' ? recipe.slice(1) : recipe.slice(2);
      const result = this[recipe[0]](...args);

      const metaInfo = recipe[1];
      if (metaInfo) {
        if (metaInfo.sourceInterval && this.currentDecl) {
          result.withSource(this.currentDecl.sourceInterval(...metaInfo.sourceInterval));
        }
      }
      return result;
    },
  };

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  var Builder_1 = Builder$2;

  var name$1 = "ohm-js";
  var version$2 = "16.6.0";
  var description = "An object-oriented language for parsing and pattern matching";
  var repository = "https://github.com/harc/ohm";
  var keywords = [
  	"parser",
  	"compiler",
  	"pattern matching",
  	"pattern-matching",
  	"ometa",
  	"ometa/js",
  	"ometa-js",
  	"ometajs",
  	"rapid",
  	"prototyping"
  ];
  var homepage = "https://ohmjs.org";
  var bugs = "https://github.com/harc/ohm/issues";
  var main = "index.js";
  var module = "dist/ohm.esm.js";
  var files = [
  	"src",
  	"dist",
  	"extras",
  	"third_party",
  	"index.d.ts"
  ];
  var types = "index.d.ts";
  var scripts = {
  	prebootstrap: "bash scripts/prebootstrap",
  	bootstrap: "bash scripts/bootstrap --test || (echo 'Bootstrap failed.' && mv -v dist/ohm-grammar.js.old dist/ohm-grammar.js && mv -v dist/built-in-rules.js.old dist/built-in-rules.js && mv -v dist/operations-and-attributes.js.old dist/operations-and-attributes.js)",
  	build: "yarn build-debug && webpack --mode=production",
  	"build-debug": "webpack --mode=development && yarn build-esm && node scripts/generate-types.mjs",
  	"build-esm": "rollup -c rollup.config.mjs",
  	clean: "rm -f dist/ohm.js dist/ohm.min.js",
  	lint: "eslint . --ignore-path ../.eslintignore",
  	format: "prettier . --write --ignore-path ../.prettierignore --config ../.prettierrc && eslint . --ignore-path ../.eslintignore --fix",
  	test: "ava && ava --config ava-ts.config.js test/test-typings.ts",
  	"test-watch": "ava --watch",
  	"pre-commit": "yarn run lint && yarn run build && yarn run test",
  	prepublishOnly: "bash scripts/prepublishOnly",
  	prepack: "cp ../../README.md . && yarn build",
  	postpack: "rm README.md",
  	postpublish: "echo '👉  Now go to https://github.com/harc/ohm/releases and create a release.'",
  	"unsafe-bootstrap": "bash scripts/bootstrap",
  	"update-contributors": "bash scripts/update-contributors",
  	watch: "webpack --mode=development --watch"
  };
  var license = "MIT";
  var author = "Alex Warth <alexwarth@gmail.com> (http://tinlizzie.org/~awarth)";
  var contributors = [
  	"Patrick Dubroy <pdubroy@gmail.com>",
  	"Meixian Li <lmeixian@gmail.com>",
  	"Marko Röder <m.roeder@photon-software.de>",
  	"Tony Garnock-Jones <tonygarnockjones@gmail.com>",
  	"Saketh Kasibatla <sake.kasi@gmail.com>",
  	"Lionel Landwerlin <llandwerlin@gmail.com>",
  	"Jason Merrill <jwmerrill@gmail.com>",
  	"Ray Toal <rtoal@lmu.edu>",
  	"Yoshiki Ohshima <Yoshiki.Ohshima@acm.org>",
  	"megabuz <3299889+megabuz@users.noreply.github.com>",
  	"Jonathan Edwards <JonathanMEdwards@gmail.com>",
  	"Milan Lajtoš <milan.lajtos@me.com>",
  	"Neil Jewers <njjewers@uwaterloo.ca>",
  	"stagas <gstagas@gmail.com>",
  	"AngryPowman <angrypowman@qq.com>",
  	"Arthur Carabott <arthurc@gmail.com>",
  	"Casey Olson <casey.m.olson@gmail.com>",
  	"Daniel Tomlinson <DanielTomlinson@me.com>",
  	"Ian Harris <ian@fofgof.xyz>",
  	"Justin Chase <justin.m.chase@gmail.com>",
  	"Leslie Ying <acetophore@users.noreply.github.com>",
  	"Luca Guzzon <luca.guzzon@gmail.com>",
  	"Mike Niebling <(none)>",
  	"Patrick Dubroy <patrick@sourcegraph.com>",
  	"Pierre Donias <pierre.donias@gmail.com>",
  	"Stan Rozenraukh <stan@stanistan.com>",
  	"Stephan Seidt <stephan.seidt@gmail.com>",
  	"Steve Phillips <steve@tryingtobeawesome.com>",
  	"Szymon Kaliski <kaliskiszymon@gmail.com>",
  	"Thomas Nyberg <tomnyberg@gmail.com>",
  	"Vse Mozhet Byt <vsemozhetbyt@gmail.com>",
  	"Wil Chung <10446+iamwilhelm@users.noreply.github.com>",
  	"Zachary Sakowitz <zsakowitz@gmail.com>",
  	"abego <ub@abego-software.de>",
  	"acslk <d_vd415@hotmail.com>",
  	"codeZeilen <codeZeilen@users.noreply.github.com>",
  	"kassadin <kassadin@foxmail.com>",
  	"owch <bowenrainyday@gmail.com>",
  	"sfinnie <scott.finnie@gmail.com>"
  ];
  var dependencies = {
  };
  var devDependencies = {
  	"@ohm-js/cli": "^1.0.0",
  	"@rollup/plugin-commonjs": "^21.0.1",
  	"@rollup/plugin-json": "^4.1.0",
  	"@rollup/plugin-node-resolve": "^13.1.3",
  	ava: "^3.15.0",
  	"ava-spec": "^1.1.1",
  	dedent: "^0.7.0",
  	eslint: "^7.9.0",
  	"eslint-config-google": "^0.14.0",
  	"eslint-plugin-ava": "^11.0.0",
  	"eslint-plugin-camelcase-ohm": "^0.2.1",
  	"eslint-plugin-no-extension-in-require": "^0.2.0",
  	husky: "^4.2.5",
  	jsdom: "^9.9.1",
  	json: "^9.0.6",
  	markscript: "^0.5.0",
  	"node-static": "^0.7.11",
  	"ohm-grammar-ecmascript": "^1.0.0",
  	rollup: "^2.63.0",
  	"ts-loader": "^8.0.4",
  	"ts-node": "^9.0.0",
  	typescript: "^4.0.3",
  	"walk-sync": "^2.2.0",
  	webpack: "^4.44.2",
  	"webpack-cli": "^3.3.12"
  };
  var engines = {
  	node: ">=0.12.1"
  };
  var require$$0 = {
  	name: name$1,
  	version: version$2,
  	description: description,
  	repository: repository,
  	keywords: keywords,
  	homepage: homepage,
  	bugs: bugs,
  	main: main,
  	module: module,
  	files: files,
  	types: types,
  	scripts: scripts,
  	license: license,
  	author: author,
  	contributors: contributors,
  	dependencies: dependencies,
  	devDependencies: devDependencies,
  	engines: engines
  };

  /* global __GLOBAL_OHM_VERSION__ */

  // When running under Node, read the version from package.json. For the browser,
  // use a special global variable defined in the build process (see webpack.config.js).
  var version$1 =
    typeof __GLOBAL_OHM_VERSION__ === 'string' ?
      __GLOBAL_OHM_VERSION__ :
      require$$0.version;

  var makeRecipe$5 = {};

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Builder$1 = Builder_1;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function makeRecipe$4(recipe) {
    if (typeof recipe === 'function') {
      return recipe.call(new Builder$1());
    } else {
      if (typeof recipe === 'string') {
        // stringified JSON recipe
        recipe = JSON.parse(recipe);
      }
      return new Builder$1().fromRecipe(recipe);
    }
  }

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  makeRecipe$5.makeRecipe = makeRecipe$4;

  var {makeRecipe: makeRecipe$3} = makeRecipe$5;
  var builtInRules = makeRecipe$3(["grammar",{"source":"BuiltInRules {\n\n  alnum  (an alpha-numeric character)\n    = letter\n    | digit\n\n  letter  (a letter)\n    = lower\n    | upper\n    | unicodeLtmo\n\n  digit  (a digit)\n    = \"0\"..\"9\"\n\n  hexDigit  (a hexadecimal digit)\n    = digit\n    | \"a\"..\"f\"\n    | \"A\"..\"F\"\n\n  ListOf<elem, sep>\n    = NonemptyListOf<elem, sep>\n    | EmptyListOf<elem, sep>\n\n  NonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  EmptyListOf<elem, sep>\n    = /* nothing */\n\n  listOf<elem, sep>\n    = nonemptyListOf<elem, sep>\n    | emptyListOf<elem, sep>\n\n  nonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  emptyListOf<elem, sep>\n    = /* nothing */\n\n  // Allows a syntactic rule application within a lexical context.\n  applySyntactic<app> = app\n}"},"BuiltInRules",null,null,{"alnum":["define",{"sourceInterval":[18,78]},"an alpha-numeric character",[],["alt",{"sourceInterval":[60,78]},["app",{"sourceInterval":[60,66]},"letter",[]],["app",{"sourceInterval":[73,78]},"digit",[]]]],"letter":["define",{"sourceInterval":[82,142]},"a letter",[],["alt",{"sourceInterval":[107,142]},["app",{"sourceInterval":[107,112]},"lower",[]],["app",{"sourceInterval":[119,124]},"upper",[]],["app",{"sourceInterval":[131,142]},"unicodeLtmo",[]]]],"digit":["define",{"sourceInterval":[146,177]},"a digit",[],["range",{"sourceInterval":[169,177]},"0","9"]],"hexDigit":["define",{"sourceInterval":[181,254]},"a hexadecimal digit",[],["alt",{"sourceInterval":[219,254]},["app",{"sourceInterval":[219,224]},"digit",[]],["range",{"sourceInterval":[231,239]},"a","f"],["range",{"sourceInterval":[246,254]},"A","F"]]],"ListOf":["define",{"sourceInterval":[258,336]},null,["elem","sep"],["alt",{"sourceInterval":[282,336]},["app",{"sourceInterval":[282,307]},"NonemptyListOf",[["param",{"sourceInterval":[297,301]},0],["param",{"sourceInterval":[303,306]},1]]],["app",{"sourceInterval":[314,336]},"EmptyListOf",[["param",{"sourceInterval":[326,330]},0],["param",{"sourceInterval":[332,335]},1]]]]],"NonemptyListOf":["define",{"sourceInterval":[340,388]},null,["elem","sep"],["seq",{"sourceInterval":[372,388]},["param",{"sourceInterval":[372,376]},0],["star",{"sourceInterval":[377,388]},["seq",{"sourceInterval":[378,386]},["param",{"sourceInterval":[378,381]},1],["param",{"sourceInterval":[382,386]},0]]]]],"EmptyListOf":["define",{"sourceInterval":[392,434]},null,["elem","sep"],["seq",{"sourceInterval":[438,438]}]],"listOf":["define",{"sourceInterval":[438,516]},null,["elem","sep"],["alt",{"sourceInterval":[462,516]},["app",{"sourceInterval":[462,487]},"nonemptyListOf",[["param",{"sourceInterval":[477,481]},0],["param",{"sourceInterval":[483,486]},1]]],["app",{"sourceInterval":[494,516]},"emptyListOf",[["param",{"sourceInterval":[506,510]},0],["param",{"sourceInterval":[512,515]},1]]]]],"nonemptyListOf":["define",{"sourceInterval":[520,568]},null,["elem","sep"],["seq",{"sourceInterval":[552,568]},["param",{"sourceInterval":[552,556]},0],["star",{"sourceInterval":[557,568]},["seq",{"sourceInterval":[558,566]},["param",{"sourceInterval":[558,561]},1],["param",{"sourceInterval":[562,566]},0]]]]],"emptyListOf":["define",{"sourceInterval":[572,682]},null,["elem","sep"],["seq",{"sourceInterval":[685,685]}]],"applySyntactic":["define",{"sourceInterval":[685,710]},null,["app"],["param",{"sourceInterval":[707,710]},0]]}]);

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Grammar$1 = Grammar_1;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  Grammar$1.BuiltInRules = builtInRules;

  var {makeRecipe: makeRecipe$2} = makeRecipe$5;
  var operationsAndAttributes = makeRecipe$2(["grammar",{"source":"OperationsAndAttributes {\n\n  AttributeSignature =\n    name\n\n  OperationSignature =\n    name Formals?\n\n  Formals\n    = \"(\" ListOf<name, \",\"> \")\"\n\n  name  (a name)\n    = nameFirst nameRest*\n\n  nameFirst\n    = \"_\"\n    | letter\n\n  nameRest\n    = \"_\"\n    | alnum\n\n}"},"OperationsAndAttributes",null,"AttributeSignature",{"AttributeSignature":["define",{"sourceInterval":[29,58]},null,[],["app",{"sourceInterval":[54,58]},"name",[]]],"OperationSignature":["define",{"sourceInterval":[62,100]},null,[],["seq",{"sourceInterval":[87,100]},["app",{"sourceInterval":[87,91]},"name",[]],["opt",{"sourceInterval":[92,100]},["app",{"sourceInterval":[92,99]},"Formals",[]]]]],"Formals":["define",{"sourceInterval":[104,143]},null,[],["seq",{"sourceInterval":[118,143]},["terminal",{"sourceInterval":[118,121]},"("],["app",{"sourceInterval":[122,139]},"ListOf",[["app",{"sourceInterval":[129,133]},"name",[]],["terminal",{"sourceInterval":[135,138]},","]]],["terminal",{"sourceInterval":[140,143]},")"]]],"name":["define",{"sourceInterval":[147,187]},"a name",[],["seq",{"sourceInterval":[168,187]},["app",{"sourceInterval":[168,177]},"nameFirst",[]],["star",{"sourceInterval":[178,187]},["app",{"sourceInterval":[178,186]},"nameRest",[]]]]],"nameFirst":["define",{"sourceInterval":[191,223]},null,[],["alt",{"sourceInterval":[207,223]},["terminal",{"sourceInterval":[207,210]},"_"],["app",{"sourceInterval":[217,223]},"letter",[]]]],"nameRest":["define",{"sourceInterval":[227,257]},null,[],["alt",{"sourceInterval":[242,257]},["terminal",{"sourceInterval":[242,245]},"_"],["app",{"sourceInterval":[252,257]},"alnum",[]]]]}]);

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Semantics = Semantics_1;
  const util$1 = util$7;

  // ----------------- Deferred initialization -----------------

  util$1.awaitBuiltInRules(builtInRules => {
    const operationsAndAttributesGrammar = operationsAndAttributes;
    initBuiltInSemantics(builtInRules);
    initPrototypeParser(operationsAndAttributesGrammar); // requires BuiltInSemantics
  });

  function initBuiltInSemantics(builtInRules) {
    const actions = {
      empty() {
        return this.iteration();
      },
      nonEmpty(first, _, rest) {
        return this.iteration([first].concat(rest.children));
      },
    };

    Semantics.BuiltInSemantics = Semantics.createSemantics(builtInRules, null).addOperation(
        'asIteration',
        {
          emptyListOf: actions.empty,
          nonemptyListOf: actions.nonEmpty,
          EmptyListOf: actions.empty,
          NonemptyListOf: actions.nonEmpty,
        }
    );
  }

  function initPrototypeParser(grammar) {
    Semantics.prototypeGrammarSemantics = grammar.createSemantics().addOperation('parse', {
      AttributeSignature(name) {
        return {
          name: name.parse(),
          formals: [],
        };
      },
      OperationSignature(name, optFormals) {
        return {
          name: name.parse(),
          formals: optFormals.children.map(c => c.parse())[0] || [],
        };
      },
      Formals(oparen, fs, cparen) {
        return fs.asIteration().children.map(c => c.parse());
      },
      name(first, rest) {
        return this.sourceString;
      },
    });
    Semantics.prototypeGrammar = grammar;
  }

  var {makeRecipe: makeRecipe$1} = makeRecipe$5;
  var ohmGrammar$1 = makeRecipe$1(["grammar",{"source":"Ohm {\n\n  Grammars\n    = Grammar*\n\n  Grammar\n    = ident SuperGrammar? \"{\" Rule* \"}\"\n\n  SuperGrammar\n    = \"<:\" ident\n\n  Rule\n    = ident Formals? ruleDescr? \"=\"  RuleBody  -- define\n    | ident Formals?            \":=\" OverrideRuleBody  -- override\n    | ident Formals?            \"+=\" RuleBody  -- extend\n\n  RuleBody\n    = \"|\"? NonemptyListOf<TopLevelTerm, \"|\">\n\n  TopLevelTerm\n    = Seq caseName  -- inline\n    | Seq\n\n  OverrideRuleBody\n    = \"|\"? NonemptyListOf<OverrideTopLevelTerm, \"|\">\n\n  OverrideTopLevelTerm\n    = \"...\"  -- superSplice\n    | TopLevelTerm\n\n  Formals\n    = \"<\" ListOf<ident, \",\"> \">\"\n\n  Params\n    = \"<\" ListOf<Seq, \",\"> \">\"\n\n  Alt\n    = NonemptyListOf<Seq, \"|\">\n\n  Seq\n    = Iter*\n\n  Iter\n    = Pred \"*\"  -- star\n    | Pred \"+\"  -- plus\n    | Pred \"?\"  -- opt\n    | Pred\n\n  Pred\n    = \"~\" Lex  -- not\n    | \"&\" Lex  -- lookahead\n    | Lex\n\n  Lex\n    = \"#\" Base  -- lex\n    | Base\n\n  Base\n    = ident Params? ~(ruleDescr? \"=\" | \":=\" | \"+=\")  -- application\n    | oneCharTerminal \"..\" oneCharTerminal           -- range\n    | terminal                                       -- terminal\n    | \"(\" Alt \")\"                                    -- paren\n\n  ruleDescr  (a rule description)\n    = \"(\" ruleDescrText \")\"\n\n  ruleDescrText\n    = (~\")\" any)*\n\n  caseName\n    = \"--\" (~\"\\n\" space)* name (~\"\\n\" space)* (\"\\n\" | &\"}\")\n\n  name  (a name)\n    = nameFirst nameRest*\n\n  nameFirst\n    = \"_\"\n    | letter\n\n  nameRest\n    = \"_\"\n    | alnum\n\n  ident  (an identifier)\n    = name\n\n  terminal\n    = \"\\\"\" terminalChar* \"\\\"\"\n\n  oneCharTerminal\n    = \"\\\"\" terminalChar \"\\\"\"\n\n  terminalChar\n    = escapeChar\n      | ~\"\\\\\" ~\"\\\"\" ~\"\\n\" \"\\u{0}\"..\"\\u{10FFFF}\"\n\n  escapeChar  (an escape sequence)\n    = \"\\\\\\\\\"                                     -- backslash\n    | \"\\\\\\\"\"                                     -- doubleQuote\n    | \"\\\\\\'\"                                     -- singleQuote\n    | \"\\\\b\"                                      -- backspace\n    | \"\\\\n\"                                      -- lineFeed\n    | \"\\\\r\"                                      -- carriageReturn\n    | \"\\\\t\"                                      -- tab\n    | \"\\\\u{\" hexDigit hexDigit? hexDigit?\n             hexDigit? hexDigit? hexDigit? \"}\"   -- unicodeCodePoint\n    | \"\\\\u\" hexDigit hexDigit hexDigit hexDigit  -- unicodeEscape\n    | \"\\\\x\" hexDigit hexDigit                    -- hexEscape\n\n  space\n   += comment\n\n  comment\n    = \"//\" (~\"\\n\" any)* &(\"\\n\" | end)  -- singleLine\n    | \"/*\" (~\"*/\" any)* \"*/\"  -- multiLine\n\n  tokens = token*\n\n  token = caseName | comment | ident | operator | punctuation | terminal | any\n\n  operator = \"<:\" | \"=\" | \":=\" | \"+=\" | \"*\" | \"+\" | \"?\" | \"~\" | \"&\"\n\n  punctuation = \"<\" | \">\" | \",\" | \"--\"\n}"},"Ohm",null,"Grammars",{"Grammars":["define",{"sourceInterval":[9,32]},null,[],["star",{"sourceInterval":[24,32]},["app",{"sourceInterval":[24,31]},"Grammar",[]]]],"Grammar":["define",{"sourceInterval":[36,83]},null,[],["seq",{"sourceInterval":[50,83]},["app",{"sourceInterval":[50,55]},"ident",[]],["opt",{"sourceInterval":[56,69]},["app",{"sourceInterval":[56,68]},"SuperGrammar",[]]],["terminal",{"sourceInterval":[70,73]},"{"],["star",{"sourceInterval":[74,79]},["app",{"sourceInterval":[74,78]},"Rule",[]]],["terminal",{"sourceInterval":[80,83]},"}"]]],"SuperGrammar":["define",{"sourceInterval":[87,116]},null,[],["seq",{"sourceInterval":[106,116]},["terminal",{"sourceInterval":[106,110]},"<:"],["app",{"sourceInterval":[111,116]},"ident",[]]]],"Rule_define":["define",{"sourceInterval":[131,181]},null,[],["seq",{"sourceInterval":[131,170]},["app",{"sourceInterval":[131,136]},"ident",[]],["opt",{"sourceInterval":[137,145]},["app",{"sourceInterval":[137,144]},"Formals",[]]],["opt",{"sourceInterval":[146,156]},["app",{"sourceInterval":[146,155]},"ruleDescr",[]]],["terminal",{"sourceInterval":[157,160]},"="],["app",{"sourceInterval":[162,170]},"RuleBody",[]]]],"Rule_override":["define",{"sourceInterval":[188,248]},null,[],["seq",{"sourceInterval":[188,235]},["app",{"sourceInterval":[188,193]},"ident",[]],["opt",{"sourceInterval":[194,202]},["app",{"sourceInterval":[194,201]},"Formals",[]]],["terminal",{"sourceInterval":[214,218]},":="],["app",{"sourceInterval":[219,235]},"OverrideRuleBody",[]]]],"Rule_extend":["define",{"sourceInterval":[255,305]},null,[],["seq",{"sourceInterval":[255,294]},["app",{"sourceInterval":[255,260]},"ident",[]],["opt",{"sourceInterval":[261,269]},["app",{"sourceInterval":[261,268]},"Formals",[]]],["terminal",{"sourceInterval":[281,285]},"+="],["app",{"sourceInterval":[286,294]},"RuleBody",[]]]],"Rule":["define",{"sourceInterval":[120,305]},null,[],["alt",{"sourceInterval":[131,305]},["app",{"sourceInterval":[131,170]},"Rule_define",[]],["app",{"sourceInterval":[188,235]},"Rule_override",[]],["app",{"sourceInterval":[255,294]},"Rule_extend",[]]]],"RuleBody":["define",{"sourceInterval":[309,362]},null,[],["seq",{"sourceInterval":[324,362]},["opt",{"sourceInterval":[324,328]},["terminal",{"sourceInterval":[324,327]},"|"]],["app",{"sourceInterval":[329,362]},"NonemptyListOf",[["app",{"sourceInterval":[344,356]},"TopLevelTerm",[]],["terminal",{"sourceInterval":[358,361]},"|"]]]]],"TopLevelTerm_inline":["define",{"sourceInterval":[385,408]},null,[],["seq",{"sourceInterval":[385,397]},["app",{"sourceInterval":[385,388]},"Seq",[]],["app",{"sourceInterval":[389,397]},"caseName",[]]]],"TopLevelTerm":["define",{"sourceInterval":[366,418]},null,[],["alt",{"sourceInterval":[385,418]},["app",{"sourceInterval":[385,397]},"TopLevelTerm_inline",[]],["app",{"sourceInterval":[415,418]},"Seq",[]]]],"OverrideRuleBody":["define",{"sourceInterval":[422,491]},null,[],["seq",{"sourceInterval":[445,491]},["opt",{"sourceInterval":[445,449]},["terminal",{"sourceInterval":[445,448]},"|"]],["app",{"sourceInterval":[450,491]},"NonemptyListOf",[["app",{"sourceInterval":[465,485]},"OverrideTopLevelTerm",[]],["terminal",{"sourceInterval":[487,490]},"|"]]]]],"OverrideTopLevelTerm_superSplice":["define",{"sourceInterval":[522,543]},null,[],["terminal",{"sourceInterval":[522,527]},"..."]],"OverrideTopLevelTerm":["define",{"sourceInterval":[495,562]},null,[],["alt",{"sourceInterval":[522,562]},["app",{"sourceInterval":[522,527]},"OverrideTopLevelTerm_superSplice",[]],["app",{"sourceInterval":[550,562]},"TopLevelTerm",[]]]],"Formals":["define",{"sourceInterval":[566,606]},null,[],["seq",{"sourceInterval":[580,606]},["terminal",{"sourceInterval":[580,583]},"<"],["app",{"sourceInterval":[584,602]},"ListOf",[["app",{"sourceInterval":[591,596]},"ident",[]],["terminal",{"sourceInterval":[598,601]},","]]],["terminal",{"sourceInterval":[603,606]},">"]]],"Params":["define",{"sourceInterval":[610,647]},null,[],["seq",{"sourceInterval":[623,647]},["terminal",{"sourceInterval":[623,626]},"<"],["app",{"sourceInterval":[627,643]},"ListOf",[["app",{"sourceInterval":[634,637]},"Seq",[]],["terminal",{"sourceInterval":[639,642]},","]]],["terminal",{"sourceInterval":[644,647]},">"]]],"Alt":["define",{"sourceInterval":[651,685]},null,[],["app",{"sourceInterval":[661,685]},"NonemptyListOf",[["app",{"sourceInterval":[676,679]},"Seq",[]],["terminal",{"sourceInterval":[681,684]},"|"]]]],"Seq":["define",{"sourceInterval":[689,704]},null,[],["star",{"sourceInterval":[699,704]},["app",{"sourceInterval":[699,703]},"Iter",[]]]],"Iter_star":["define",{"sourceInterval":[719,736]},null,[],["seq",{"sourceInterval":[719,727]},["app",{"sourceInterval":[719,723]},"Pred",[]],["terminal",{"sourceInterval":[724,727]},"*"]]],"Iter_plus":["define",{"sourceInterval":[743,760]},null,[],["seq",{"sourceInterval":[743,751]},["app",{"sourceInterval":[743,747]},"Pred",[]],["terminal",{"sourceInterval":[748,751]},"+"]]],"Iter_opt":["define",{"sourceInterval":[767,783]},null,[],["seq",{"sourceInterval":[767,775]},["app",{"sourceInterval":[767,771]},"Pred",[]],["terminal",{"sourceInterval":[772,775]},"?"]]],"Iter":["define",{"sourceInterval":[708,794]},null,[],["alt",{"sourceInterval":[719,794]},["app",{"sourceInterval":[719,727]},"Iter_star",[]],["app",{"sourceInterval":[743,751]},"Iter_plus",[]],["app",{"sourceInterval":[767,775]},"Iter_opt",[]],["app",{"sourceInterval":[790,794]},"Pred",[]]]],"Pred_not":["define",{"sourceInterval":[809,824]},null,[],["seq",{"sourceInterval":[809,816]},["terminal",{"sourceInterval":[809,812]},"~"],["app",{"sourceInterval":[813,816]},"Lex",[]]]],"Pred_lookahead":["define",{"sourceInterval":[831,852]},null,[],["seq",{"sourceInterval":[831,838]},["terminal",{"sourceInterval":[831,834]},"&"],["app",{"sourceInterval":[835,838]},"Lex",[]]]],"Pred":["define",{"sourceInterval":[798,862]},null,[],["alt",{"sourceInterval":[809,862]},["app",{"sourceInterval":[809,816]},"Pred_not",[]],["app",{"sourceInterval":[831,838]},"Pred_lookahead",[]],["app",{"sourceInterval":[859,862]},"Lex",[]]]],"Lex_lex":["define",{"sourceInterval":[876,892]},null,[],["seq",{"sourceInterval":[876,884]},["terminal",{"sourceInterval":[876,879]},"#"],["app",{"sourceInterval":[880,884]},"Base",[]]]],"Lex":["define",{"sourceInterval":[866,903]},null,[],["alt",{"sourceInterval":[876,903]},["app",{"sourceInterval":[876,884]},"Lex_lex",[]],["app",{"sourceInterval":[899,903]},"Base",[]]]],"Base_application":["define",{"sourceInterval":[918,979]},null,[],["seq",{"sourceInterval":[918,963]},["app",{"sourceInterval":[918,923]},"ident",[]],["opt",{"sourceInterval":[924,931]},["app",{"sourceInterval":[924,930]},"Params",[]]],["not",{"sourceInterval":[932,963]},["alt",{"sourceInterval":[934,962]},["seq",{"sourceInterval":[934,948]},["opt",{"sourceInterval":[934,944]},["app",{"sourceInterval":[934,943]},"ruleDescr",[]]],["terminal",{"sourceInterval":[945,948]},"="]],["terminal",{"sourceInterval":[951,955]},":="],["terminal",{"sourceInterval":[958,962]},"+="]]]]],"Base_range":["define",{"sourceInterval":[986,1041]},null,[],["seq",{"sourceInterval":[986,1022]},["app",{"sourceInterval":[986,1001]},"oneCharTerminal",[]],["terminal",{"sourceInterval":[1002,1006]},".."],["app",{"sourceInterval":[1007,1022]},"oneCharTerminal",[]]]],"Base_terminal":["define",{"sourceInterval":[1048,1106]},null,[],["app",{"sourceInterval":[1048,1056]},"terminal",[]]],"Base_paren":["define",{"sourceInterval":[1113,1168]},null,[],["seq",{"sourceInterval":[1113,1124]},["terminal",{"sourceInterval":[1113,1116]},"("],["app",{"sourceInterval":[1117,1120]},"Alt",[]],["terminal",{"sourceInterval":[1121,1124]},")"]]],"Base":["define",{"sourceInterval":[907,1168]},null,[],["alt",{"sourceInterval":[918,1168]},["app",{"sourceInterval":[918,963]},"Base_application",[]],["app",{"sourceInterval":[986,1022]},"Base_range",[]],["app",{"sourceInterval":[1048,1056]},"Base_terminal",[]],["app",{"sourceInterval":[1113,1124]},"Base_paren",[]]]],"ruleDescr":["define",{"sourceInterval":[1172,1231]},"a rule description",[],["seq",{"sourceInterval":[1210,1231]},["terminal",{"sourceInterval":[1210,1213]},"("],["app",{"sourceInterval":[1214,1227]},"ruleDescrText",[]],["terminal",{"sourceInterval":[1228,1231]},")"]]],"ruleDescrText":["define",{"sourceInterval":[1235,1266]},null,[],["star",{"sourceInterval":[1255,1266]},["seq",{"sourceInterval":[1256,1264]},["not",{"sourceInterval":[1256,1260]},["terminal",{"sourceInterval":[1257,1260]},")"]],["app",{"sourceInterval":[1261,1264]},"any",[]]]]],"caseName":["define",{"sourceInterval":[1270,1338]},null,[],["seq",{"sourceInterval":[1285,1338]},["terminal",{"sourceInterval":[1285,1289]},"--"],["star",{"sourceInterval":[1290,1304]},["seq",{"sourceInterval":[1291,1302]},["not",{"sourceInterval":[1291,1296]},["terminal",{"sourceInterval":[1292,1296]},"\n"]],["app",{"sourceInterval":[1297,1302]},"space",[]]]],["app",{"sourceInterval":[1305,1309]},"name",[]],["star",{"sourceInterval":[1310,1324]},["seq",{"sourceInterval":[1311,1322]},["not",{"sourceInterval":[1311,1316]},["terminal",{"sourceInterval":[1312,1316]},"\n"]],["app",{"sourceInterval":[1317,1322]},"space",[]]]],["alt",{"sourceInterval":[1326,1337]},["terminal",{"sourceInterval":[1326,1330]},"\n"],["lookahead",{"sourceInterval":[1333,1337]},["terminal",{"sourceInterval":[1334,1337]},"}"]]]]],"name":["define",{"sourceInterval":[1342,1382]},"a name",[],["seq",{"sourceInterval":[1363,1382]},["app",{"sourceInterval":[1363,1372]},"nameFirst",[]],["star",{"sourceInterval":[1373,1382]},["app",{"sourceInterval":[1373,1381]},"nameRest",[]]]]],"nameFirst":["define",{"sourceInterval":[1386,1418]},null,[],["alt",{"sourceInterval":[1402,1418]},["terminal",{"sourceInterval":[1402,1405]},"_"],["app",{"sourceInterval":[1412,1418]},"letter",[]]]],"nameRest":["define",{"sourceInterval":[1422,1452]},null,[],["alt",{"sourceInterval":[1437,1452]},["terminal",{"sourceInterval":[1437,1440]},"_"],["app",{"sourceInterval":[1447,1452]},"alnum",[]]]],"ident":["define",{"sourceInterval":[1456,1489]},"an identifier",[],["app",{"sourceInterval":[1485,1489]},"name",[]]],"terminal":["define",{"sourceInterval":[1493,1531]},null,[],["seq",{"sourceInterval":[1508,1531]},["terminal",{"sourceInterval":[1508,1512]},"\""],["star",{"sourceInterval":[1513,1526]},["app",{"sourceInterval":[1513,1525]},"terminalChar",[]]],["terminal",{"sourceInterval":[1527,1531]},"\""]]],"oneCharTerminal":["define",{"sourceInterval":[1535,1579]},null,[],["seq",{"sourceInterval":[1557,1579]},["terminal",{"sourceInterval":[1557,1561]},"\""],["app",{"sourceInterval":[1562,1574]},"terminalChar",[]],["terminal",{"sourceInterval":[1575,1579]},"\""]]],"terminalChar":["define",{"sourceInterval":[1583,1660]},null,[],["alt",{"sourceInterval":[1602,1660]},["app",{"sourceInterval":[1602,1612]},"escapeChar",[]],["seq",{"sourceInterval":[1621,1660]},["not",{"sourceInterval":[1621,1626]},["terminal",{"sourceInterval":[1622,1626]},"\\"]],["not",{"sourceInterval":[1627,1632]},["terminal",{"sourceInterval":[1628,1632]},"\""]],["not",{"sourceInterval":[1633,1638]},["terminal",{"sourceInterval":[1634,1638]},"\n"]],["range",{"sourceInterval":[1639,1660]},"\u0000","􏿿"]]]],"escapeChar_backslash":["define",{"sourceInterval":[1703,1758]},null,[],["terminal",{"sourceInterval":[1703,1709]},"\\\\"]],"escapeChar_doubleQuote":["define",{"sourceInterval":[1765,1822]},null,[],["terminal",{"sourceInterval":[1765,1771]},"\\\""]],"escapeChar_singleQuote":["define",{"sourceInterval":[1829,1886]},null,[],["terminal",{"sourceInterval":[1829,1835]},"\\'"]],"escapeChar_backspace":["define",{"sourceInterval":[1893,1948]},null,[],["terminal",{"sourceInterval":[1893,1898]},"\\b"]],"escapeChar_lineFeed":["define",{"sourceInterval":[1955,2009]},null,[],["terminal",{"sourceInterval":[1955,1960]},"\\n"]],"escapeChar_carriageReturn":["define",{"sourceInterval":[2016,2076]},null,[],["terminal",{"sourceInterval":[2016,2021]},"\\r"]],"escapeChar_tab":["define",{"sourceInterval":[2083,2132]},null,[],["terminal",{"sourceInterval":[2083,2088]},"\\t"]],"escapeChar_unicodeCodePoint":["define",{"sourceInterval":[2139,2243]},null,[],["seq",{"sourceInterval":[2139,2221]},["terminal",{"sourceInterval":[2139,2145]},"\\u{"],["app",{"sourceInterval":[2146,2154]},"hexDigit",[]],["opt",{"sourceInterval":[2155,2164]},["app",{"sourceInterval":[2155,2163]},"hexDigit",[]]],["opt",{"sourceInterval":[2165,2174]},["app",{"sourceInterval":[2165,2173]},"hexDigit",[]]],["opt",{"sourceInterval":[2188,2197]},["app",{"sourceInterval":[2188,2196]},"hexDigit",[]]],["opt",{"sourceInterval":[2198,2207]},["app",{"sourceInterval":[2198,2206]},"hexDigit",[]]],["opt",{"sourceInterval":[2208,2217]},["app",{"sourceInterval":[2208,2216]},"hexDigit",[]]],["terminal",{"sourceInterval":[2218,2221]},"}"]]],"escapeChar_unicodeEscape":["define",{"sourceInterval":[2250,2309]},null,[],["seq",{"sourceInterval":[2250,2291]},["terminal",{"sourceInterval":[2250,2255]},"\\u"],["app",{"sourceInterval":[2256,2264]},"hexDigit",[]],["app",{"sourceInterval":[2265,2273]},"hexDigit",[]],["app",{"sourceInterval":[2274,2282]},"hexDigit",[]],["app",{"sourceInterval":[2283,2291]},"hexDigit",[]]]],"escapeChar_hexEscape":["define",{"sourceInterval":[2316,2371]},null,[],["seq",{"sourceInterval":[2316,2339]},["terminal",{"sourceInterval":[2316,2321]},"\\x"],["app",{"sourceInterval":[2322,2330]},"hexDigit",[]],["app",{"sourceInterval":[2331,2339]},"hexDigit",[]]]],"escapeChar":["define",{"sourceInterval":[1664,2371]},"an escape sequence",[],["alt",{"sourceInterval":[1703,2371]},["app",{"sourceInterval":[1703,1709]},"escapeChar_backslash",[]],["app",{"sourceInterval":[1765,1771]},"escapeChar_doubleQuote",[]],["app",{"sourceInterval":[1829,1835]},"escapeChar_singleQuote",[]],["app",{"sourceInterval":[1893,1898]},"escapeChar_backspace",[]],["app",{"sourceInterval":[1955,1960]},"escapeChar_lineFeed",[]],["app",{"sourceInterval":[2016,2021]},"escapeChar_carriageReturn",[]],["app",{"sourceInterval":[2083,2088]},"escapeChar_tab",[]],["app",{"sourceInterval":[2139,2221]},"escapeChar_unicodeCodePoint",[]],["app",{"sourceInterval":[2250,2291]},"escapeChar_unicodeEscape",[]],["app",{"sourceInterval":[2316,2339]},"escapeChar_hexEscape",[]]]],"space":["extend",{"sourceInterval":[2375,2394]},null,[],["app",{"sourceInterval":[2387,2394]},"comment",[]]],"comment_singleLine":["define",{"sourceInterval":[2412,2458]},null,[],["seq",{"sourceInterval":[2412,2443]},["terminal",{"sourceInterval":[2412,2416]},"//"],["star",{"sourceInterval":[2417,2429]},["seq",{"sourceInterval":[2418,2427]},["not",{"sourceInterval":[2418,2423]},["terminal",{"sourceInterval":[2419,2423]},"\n"]],["app",{"sourceInterval":[2424,2427]},"any",[]]]],["lookahead",{"sourceInterval":[2430,2443]},["alt",{"sourceInterval":[2432,2442]},["terminal",{"sourceInterval":[2432,2436]},"\n"],["app",{"sourceInterval":[2439,2442]},"end",[]]]]]],"comment_multiLine":["define",{"sourceInterval":[2465,2501]},null,[],["seq",{"sourceInterval":[2465,2487]},["terminal",{"sourceInterval":[2465,2469]},"/*"],["star",{"sourceInterval":[2470,2482]},["seq",{"sourceInterval":[2471,2480]},["not",{"sourceInterval":[2471,2476]},["terminal",{"sourceInterval":[2472,2476]},"*/"]],["app",{"sourceInterval":[2477,2480]},"any",[]]]],["terminal",{"sourceInterval":[2483,2487]},"*/"]]],"comment":["define",{"sourceInterval":[2398,2501]},null,[],["alt",{"sourceInterval":[2412,2501]},["app",{"sourceInterval":[2412,2443]},"comment_singleLine",[]],["app",{"sourceInterval":[2465,2487]},"comment_multiLine",[]]]],"tokens":["define",{"sourceInterval":[2505,2520]},null,[],["star",{"sourceInterval":[2514,2520]},["app",{"sourceInterval":[2514,2519]},"token",[]]]],"token":["define",{"sourceInterval":[2524,2600]},null,[],["alt",{"sourceInterval":[2532,2600]},["app",{"sourceInterval":[2532,2540]},"caseName",[]],["app",{"sourceInterval":[2543,2550]},"comment",[]],["app",{"sourceInterval":[2553,2558]},"ident",[]],["app",{"sourceInterval":[2561,2569]},"operator",[]],["app",{"sourceInterval":[2572,2583]},"punctuation",[]],["app",{"sourceInterval":[2586,2594]},"terminal",[]],["app",{"sourceInterval":[2597,2600]},"any",[]]]],"operator":["define",{"sourceInterval":[2604,2669]},null,[],["alt",{"sourceInterval":[2615,2669]},["terminal",{"sourceInterval":[2615,2619]},"<:"],["terminal",{"sourceInterval":[2622,2625]},"="],["terminal",{"sourceInterval":[2628,2632]},":="],["terminal",{"sourceInterval":[2635,2639]},"+="],["terminal",{"sourceInterval":[2642,2645]},"*"],["terminal",{"sourceInterval":[2648,2651]},"+"],["terminal",{"sourceInterval":[2654,2657]},"?"],["terminal",{"sourceInterval":[2660,2663]},"~"],["terminal",{"sourceInterval":[2666,2669]},"&"]]],"punctuation":["define",{"sourceInterval":[2673,2709]},null,[],["alt",{"sourceInterval":[2687,2709]},["terminal",{"sourceInterval":[2687,2690]},"<"],["terminal",{"sourceInterval":[2693,2696]},">"],["terminal",{"sourceInterval":[2699,2702]},","],["terminal",{"sourceInterval":[2705,2709]},"--"]]]}]);

  // --------------------------------------------------------------------
  // Imports
  // --------------------------------------------------------------------

  const Builder = Builder_1;
  const Grammar = Grammar_1;
  const Namespace = Namespace_1;
  const common = common$l;
  const errors = errors$9;
  const pexprs = pexprs$6;
  const util = util$7;
  const version$3 = version$1;
  const {makeRecipe} = makeRecipe$5;

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  // The metagrammar, i.e. the grammar for Ohm grammars. Initialized at the
  // bottom of this file because loading the grammar requires Ohm itself.
  let ohmGrammar;

  const superSplicePlaceholder = Object.create(pexprs.PExpr.prototype);

  const isBuffer$1 = obj =>
    !!obj.constructor &&
    typeof obj.constructor.isBuffer === 'function' &&
    obj.constructor.isBuffer(obj);

  // Returns a Grammar instance (i.e., an object with a `match` method) for
  // `tree`, which is the concrete syntax tree of a user-written grammar.
  // The grammar will be assigned into `namespace` under the name of the grammar
  // as specified in the source.
  function buildGrammar(match, namespace, optOhmGrammarForTesting) {
    const builder = new Builder();
    let decl;
    let currentRuleName;
    let currentRuleFormals;
    let overriding = false;
    const metaGrammar = optOhmGrammarForTesting || ohmGrammar;

    // A visitor that produces a Grammar instance from the CST.
    const helpers = metaGrammar.createSemantics().addOperation('visit', {
      Grammars(grammarIter) {
        return grammarIter.children.map(c => c.visit());
      },
      Grammar(id, s, _open, rules, _close) {
        const grammarName = id.visit();
        decl = builder.newGrammar(grammarName, namespace);
        s.child(0) && s.child(0).visit();
        rules.children.map(c => c.visit());
        const g = decl.build();
        g.source = this.source.trimmed();
        if (grammarName in namespace) {
          throw errors.duplicateGrammarDeclaration(g, namespace);
        }
        namespace[grammarName] = g;
        return g;
      },

      SuperGrammar(_, n) {
        const superGrammarName = n.visit();
        if (superGrammarName === 'null') {
          decl.withSuperGrammar(null);
        } else {
          if (!namespace || !(superGrammarName in namespace)) {
            throw errors.undeclaredGrammar(superGrammarName, namespace, n.source);
          }
          decl.withSuperGrammar(namespace[superGrammarName]);
        }
      },

      Rule_define(n, fs, d, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map(c => c.visit())[0] || [];
        // If there is no default start rule yet, set it now. This must be done before visiting
        // the body, because it might contain an inline rule definition.
        if (!decl.defaultStartRule && decl.ensureSuperGrammar() !== Grammar.ProtoBuiltInRules) {
          decl.withDefaultStartRule(currentRuleName);
        }
        const body = b.visit();
        const description = d.children.map(c => c.visit())[0];
        const source = this.source.trimmed();
        return decl.define(currentRuleName, currentRuleFormals, body, description, source);
      },
      Rule_override(n, fs, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map(c => c.visit())[0] || [];

        const source = this.source.trimmed();
        decl.ensureSuperGrammarRuleForOverriding(currentRuleName, source);

        overriding = true;
        const body = b.visit();
        overriding = false;
        return decl.override(currentRuleName, currentRuleFormals, body, null, source);
      },
      Rule_extend(n, fs, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map(c => c.visit())[0] || [];
        const body = b.visit();
        const source = this.source.trimmed();
        return decl.extend(currentRuleName, currentRuleFormals, body, null, source);
      },
      RuleBody(_, terms) {
        return builder.alt(...terms.visit()).withSource(this.source);
      },
      OverrideRuleBody(_, terms) {
        const args = terms.visit();

        // Check if the super-splice operator (`...`) appears in the terms.
        const expansionPos = args.indexOf(superSplicePlaceholder);
        if (expansionPos >= 0) {
          const beforeTerms = args.slice(0, expansionPos);
          const afterTerms = args.slice(expansionPos + 1);

          // Ensure it appears no more than once.
          afterTerms.forEach(t => {
            if (t === superSplicePlaceholder) throw errors.multipleSuperSplices(t);
          });

          return new pexprs.Splice(
              decl.superGrammar,
              currentRuleName,
              beforeTerms,
              afterTerms
          ).withSource(this.source);
        } else {
          return builder.alt(...args).withSource(this.source);
        }
      },
      Formals(opointy, fs, cpointy) {
        return fs.visit();
      },

      Params(opointy, ps, cpointy) {
        return ps.visit();
      },

      Alt(seqs) {
        return builder.alt(...seqs.visit()).withSource(this.source);
      },

      TopLevelTerm_inline(b, n) {
        const inlineRuleName = currentRuleName + '_' + n.visit();
        const body = b.visit();
        const source = this.source.trimmed();
        const isNewRuleDeclaration = !(
          decl.superGrammar && decl.superGrammar.rules[inlineRuleName]
        );
        if (overriding && !isNewRuleDeclaration) {
          decl.override(inlineRuleName, currentRuleFormals, body, null, source);
        } else {
          decl.define(inlineRuleName, currentRuleFormals, body, null, source);
        }
        const params = currentRuleFormals.map(formal => builder.app(formal));
        return builder.app(inlineRuleName, params).withSource(body.source);
      },
      OverrideTopLevelTerm_superSplice(_) {
        return superSplicePlaceholder;
      },

      Seq(expr) {
        return builder.seq(...expr.children.map(c => c.visit())).withSource(this.source);
      },

      Iter_star(x, _) {
        return builder.star(x.visit()).withSource(this.source);
      },
      Iter_plus(x, _) {
        return builder.plus(x.visit()).withSource(this.source);
      },
      Iter_opt(x, _) {
        return builder.opt(x.visit()).withSource(this.source);
      },

      Pred_not(_, x) {
        return builder.not(x.visit()).withSource(this.source);
      },
      Pred_lookahead(_, x) {
        return builder.lookahead(x.visit()).withSource(this.source);
      },

      Lex_lex(_, x) {
        return builder.lex(x.visit()).withSource(this.source);
      },

      Base_application(rule, ps) {
        const params = ps.children.map(c => c.visit())[0] || [];
        return builder.app(rule.visit(), params).withSource(this.source);
      },
      Base_range(from, _, to) {
        return builder.range(from.visit(), to.visit()).withSource(this.source);
      },
      Base_terminal(expr) {
        return builder.terminal(expr.visit()).withSource(this.source);
      },
      Base_paren(open, x, close) {
        return x.visit();
      },

      ruleDescr(open, t, close) {
        return t.visit();
      },
      ruleDescrText(_) {
        return this.sourceString.trim();
      },

      caseName(_, space1, n, space2, end) {
        return n.visit();
      },

      name(first, rest) {
        return this.sourceString;
      },
      nameFirst(expr) {},
      nameRest(expr) {},

      terminal(open, cs, close) {
        return cs.children.map(c => c.visit()).join('');
      },

      oneCharTerminal(open, c, close) {
        return c.visit();
      },

      escapeChar(c) {
        try {
          return common.unescapeCodePoint(this.sourceString);
        } catch (err) {
          if (err instanceof RangeError && err.message.startsWith('Invalid code point ')) {
            throw errors.invalidCodePoint(c);
          }
          throw err; // Rethrow
        }
      },

      NonemptyListOf(x, _, xs) {
        return [x.visit()].concat(xs.children.map(c => c.visit()));
      },
      EmptyListOf() {
        return [];
      },

      _terminal() {
        return this.sourceString;
      },
    });
    return helpers(match).visit();
  }

  function compileAndLoad(source, namespace) {
    const m = ohmGrammar.match(source, 'Grammars');
    if (m.failed()) {
      throw errors.grammarSyntaxError(m);
    }
    return buildGrammar(m, namespace);
  }

  function grammar(source, optNamespace) {
    const ns = grammars(source, optNamespace);

    // Ensure that the source contained no more than one grammar definition.
    const grammarNames = Object.keys(ns);
    if (grammarNames.length === 0) {
      throw new Error('Missing grammar definition');
    } else if (grammarNames.length > 1) {
      const secondGrammar = ns[grammarNames[1]];
      const interval = secondGrammar.source;
      throw new Error(
          util.getLineAndColumnMessage(interval.sourceString, interval.startIdx) +
          'Found more than one grammar definition -- use ohm.grammars() instead.'
      );
    }
    return ns[grammarNames[0]]; // Return the one and only grammar.
  }

  function grammars(source, optNamespace) {
    const ns = Namespace.extend(Namespace.asNamespace(optNamespace));
    if (typeof source !== 'string') {
      // For convenience, detect Node.js Buffer objects and automatically call toString().
      if (isBuffer$1(source)) {
        source = source.toString();
      } else {
        throw new TypeError(
            'Expected string as first argument, got ' + common.unexpectedObjToString(source)
        );
      }
    }
    compileAndLoad(source, ns);
    return ns;
  }

  function grammarFromScriptElement(optNode) {
    throw new Error(
        'grammarFromScriptElement was removed in Ohm v16.0. See https://ohmjs.org/d/gfs for more info.'
    );
  }

  function grammarsFromScriptElements(optNodeOrNodeList) {
    throw new Error(
        'grammarsFromScriptElements was removed in Ohm v16.0. See https://ohmjs.org/d/gfs for more info.'
    );
  }

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  // Stuff that users should know about
  main$1.exports = {
    createNamespace: Namespace.createNamespace,
    grammar,
    grammars,
    grammarFromScriptElement,
    grammarsFromScriptElements,
    makeRecipe,
    ohmGrammar: null, // Initialized below, after Grammar.BuiltInRules.
    pexprs,
    util,
    version: version$3,
  };

  // Stuff for testing, etc.
  main$1.exports._buildGrammar = buildGrammar;

  // Late initialization for stuff that is bootstrapped.


  util.announceBuiltInRules(Grammar.BuiltInRules);

  main$1.exports.ohmGrammar = ohmGrammar = ohmGrammar$1;
  Grammar.initApplicationParser(ohmGrammar, buildGrammar);

  var ohm = main$1.exports;

  var global$1 = (typeof global !== "undefined" ? global :
    typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window : {});

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var inited = false;
  function init () {
    inited = true;
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }

    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;
  }

  function toByteArray (b64) {
    if (!inited) {
      init();
    }
    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4')
    }

    // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice
    placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

    // base64 is 4/3 + up to two characters of the original data
    arr = new Arr(len * 3 / 4 - placeHolders);

    // if there are placeholders, only get up to the last complete 4 chars
    l = placeHolders > 0 ? len - 4 : len;

    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = (tmp >> 16) & 0xFF;
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr
  }

  function tripletToBase64 (num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
  }

  function encodeChunk (uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
      output.push(tripletToBase64(tmp));
    }
    return output.join('')
  }

  function fromByteArray (uint8) {
    if (!inited) {
      init();
    }
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[(tmp << 4) & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
      output += lookup[tmp >> 10];
      output += lookup[(tmp >> 4) & 0x3F];
      output += lookup[(tmp << 2) & 0x3F];
      output += '=';
    }

    parts.push(output);

    return parts.join('')
  }

  function read (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? (nBytes - 1) : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity)
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
  }

  function write (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  }

  var toString = {}.toString;

  var isArray$2 = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   */

  var INSPECT_MAX_BYTES = 50;

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */
  Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
    ? global$1.TYPED_ARRAY_SUPPORT
    : true;

  /*
   * Export kMaxLength after typed array support is determined.
   */
  kMaxLength();

  function kMaxLength () {
    return Buffer.TYPED_ARRAY_SUPPORT
      ? 0x7fffffff
      : 0x3fffffff
  }

  function createBuffer (that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length')
    }
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer(length);
      }
      that.length = length;
    }

    return that
  }

  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Buffer (arg, encodingOrOffset, length) {
    if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
      return new Buffer(arg, encodingOrOffset, length)
    }

    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error(
          'If encoding is specified then the first argument must be a string'
        )
      }
      return allocUnsafe(this, arg)
    }
    return from$1(this, arg, encodingOrOffset, length)
  }

  Buffer.poolSize = 8192; // not used by this implementation

  // TODO: Legacy, not needed anymore. Remove in next major version.
  Buffer._augment = function (arr) {
    arr.__proto__ = Buffer.prototype;
    return arr
  };

  function from$1 (that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number')
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length)
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset)
    }

    return fromObject$1(that, value)
  }

  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/
  Buffer.from = function (value, encodingOrOffset, length) {
    return from$1(null, value, encodingOrOffset, length)
  };

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;
    if (typeof Symbol !== 'undefined' && Symbol.species &&
        Buffer[Symbol.species] === Buffer) ;
  }

  function assertSize (size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number')
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative')
    }
  }

  function alloc (that, size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer(that, size)
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string'
        ? createBuffer(that, size).fill(fill, encoding)
        : createBuffer(that, size).fill(fill)
    }
    return createBuffer(that, size)
  }

  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/
  Buffer.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding)
  };

  function allocUnsafe (that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }
    return that
  }

  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */
  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(null, size)
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */
  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size)
  };

  function fromString (that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding')
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);

    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that
  }

  function fromArrayLike (that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that
  }

  function fromArrayBuffer (that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds')
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds')
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }
    return that
  }

  function fromObject$1 (that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that
      }

      obj.copy(that, 0, 0, len);
      return that
    }

    if (obj) {
      if ((typeof ArrayBuffer !== 'undefined' &&
          obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0)
        }
        return fromArrayLike(that, obj)
      }

      if (obj.type === 'Buffer' && isArray$2(obj.data)) {
        return fromArrayLike(that, obj.data)
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
  }

  function checked (length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                           'size: 0x' + kMaxLength().toString(16) + ' bytes')
    }
    return length | 0
  }
  Buffer.isBuffer = isBuffer;
  function internalIsBuffer (b) {
    return !!(b != null && b._isBuffer)
  }

  Buffer.compare = function compare (a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError('Arguments must be Buffers')
    }

    if (a === b) return 0

    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  Buffer.isEncoding = function isEncoding (encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  };

  Buffer.concat = function concat (list, length) {
    if (!isArray$2(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }

    if (list.length === 0) {
      return Buffer.alloc(0)
    }

    var i;
    if (length === undefined) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;
    for (i = 0; i < list.length; ++i) {
      var buf = list[i];
      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
      buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer
  };

  function byteLength (string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length
    }
    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
        (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength
    }
    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0

    // Use a for loop to avoid recursion
    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len
        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2
        case 'hex':
          return len >>> 1
        case 'base64':
          return base64ToBytes(string).length
        default:
          if (loweredCase) return utf8ToBytes(string).length // assume utf8
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.byteLength = byteLength;

  function slowToString (encoding, start, end) {
    var loweredCase = false;

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
      start = 0;
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
      return ''
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return ''
    }

    // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return ''
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end)

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end)

        case 'ascii':
          return asciiSlice(this, start, end)

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end)

        case 'base64':
          return base64Slice(this, start, end)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  }

  // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.
  Buffer.prototype._isBuffer = true;

  function swap$1 (b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer.prototype.swap16 = function swap16 () {
    var len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits')
    }
    for (var i = 0; i < len; i += 2) {
      swap$1(this, i, i + 1);
    }
    return this
  };

  Buffer.prototype.swap32 = function swap32 () {
    var len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits')
    }
    for (var i = 0; i < len; i += 4) {
      swap$1(this, i, i + 3);
      swap$1(this, i + 1, i + 2);
    }
    return this
  };

  Buffer.prototype.swap64 = function swap64 () {
    var len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits')
    }
    for (var i = 0; i < len; i += 8) {
      swap$1(this, i, i + 7);
      swap$1(this, i + 1, i + 6);
      swap$1(this, i + 2, i + 5);
      swap$1(this, i + 3, i + 4);
    }
    return this
  };

  Buffer.prototype.toString = function toString () {
    var length = this.length | 0;
    if (length === 0) return ''
    if (arguments.length === 0) return utf8Slice(this, 0, length)
    return slowToString.apply(this, arguments)
  };

  Buffer.prototype.equals = function equals (b) {
    if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
    if (this === b) return true
    return Buffer.compare(this, b) === 0
  };

  Buffer.prototype.inspect = function inspect () {
    var str = '';
    var max = INSPECT_MAX_BYTES;
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }
    return '<Buffer ' + str + '>'
  };

  Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target)) {
      throw new TypeError('Argument must be a Buffer')
    }

    if (start === undefined) {
      start = 0;
    }
    if (end === undefined) {
      end = target ? target.length : 0;
    }
    if (thisStart === undefined) {
      thisStart = 0;
    }
    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index')
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0
    }
    if (thisStart >= thisEnd) {
      return -1
    }
    if (start >= end) {
      return 1
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;

    if (this === target) return 0

    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);

    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf
  function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset;  // Coerce to Number.
    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : (buffer.length - 1);
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
      if (dir) return -1
      else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1
    }

    // Normalize val
    if (typeof val === 'string') {
      val = Buffer.from(val, encoding);
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (internalIsBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]
      if (Buffer.TYPED_ARRAY_SUPPORT &&
          typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
        }
      }
      return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
    }

    throw new TypeError('val must be string, number or Buffer')
  }

  function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();
      if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read (buf, i) {
      if (indexSize === 1) {
        return buf[i]
      } else {
        return buf.readUInt16BE(i * indexSize)
      }
    }

    var i;
    if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        var found = true;
        for (var j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break
          }
        }
        if (found) return i
      }
    }

    return -1
  }

  Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1
  };

  Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
  };

  Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
  };

  function hexWrite (buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }

    // must be an even number of digits
    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

    if (length > strLen / 2) {
      length = strLen / 2;
    }
    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i
      buf[offset + i] = parsed;
    }
    return i
  }

  function utf8Write (buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  }

  function asciiWrite (buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length)
  }

  function latin1Write (buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length)
  }

  function base64Write (buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length)
  }

  function ucs2Write (buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  }

  Buffer.prototype.write = function write (string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0;
    // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0;
    // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      }
    // legacy write(string, encoding, offset, length) - remove in v0.13
    } else {
      throw new Error(
        'Buffer.write(string, encoding, offset[, length]) is no longer supported'
      )
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds')
    }

    if (!encoding) encoding = 'utf8';

    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length)

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length)

        case 'ascii':
          return asciiWrite(this, string, offset, length)

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length)

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer.prototype.toJSON = function toJSON () {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  };

  function base64Slice (buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf)
    } else {
      return fromByteArray(buf.slice(start, end))
    }
  }

  function utf8Slice (buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];

    var i = start;
    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = (firstByte > 0xEF) ? 4
        : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
        : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }
            break
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res)
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray (codePoints) {
    var len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    var res = '';
    var i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      );
    }
    return res
  }

  function asciiSlice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret
  }

  function latin1Slice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret
  }

  function hexSlice (buf, start, end) {
    var len = buf.length;

    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;

    var out = '';
    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }
    return out
  }

  function utf16leSlice (buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res
  }

  Buffer.prototype.slice = function slice (start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;

    var newBuf;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, undefined);
      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf
  };

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
  }

  Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val
  };

  Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val
  };

  Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset]
  };

  Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | (this[offset + 1] << 8)
  };

  Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return (this[offset] << 8) | this[offset + 1]
  };

  Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  };

  Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
  };

  Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  };

  Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | (this[offset + 1] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | (this[offset] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
  };

  Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
  };

  Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4)
  };

  Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4)
  };

  Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8)
  };

  Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8)
  };

  function checkInt (buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
  }

  Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = (value & 0xff);
    return offset + 1
  };

  function objectWriteUInt16 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
        (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  function objectWriteUInt32 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
    }
  }

  Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = (value >>> 24);
      this[offset + 2] = (value >>> 16);
      this[offset + 1] = (value >>> 8);
      this[offset] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = (value & 0xff);
    return offset + 1
  };

  Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
      this[offset + 2] = (value >>> 16);
      this[offset + 3] = (value >>> 24);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
    if (offset < 0) throw new RangeError('Index out of range')
  }

  function writeFloat (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }
    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  };

  Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
  };

  function writeDouble (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }
    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  };

  Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  };

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer.prototype.copy = function copy (target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;

    // Copy 0 bytes; we're done
    if (end === start) return 0
    if (target.length === 0 || this.length === 0) return 0

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds')
    }
    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
    if (end < 0) throw new RangeError('sourceEnd out of bounds')

    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(
        target,
        this.subarray(start, start + len),
        targetStart
      );
    }

    return len
  };

  // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])
  Buffer.prototype.fill = function fill (val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }
      if (val.length === 1) {
        var code = val.charCodeAt(0);
        if (code < 256) {
          val = code;
        }
      }
      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string')
      }
      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index')
    }

    if (end <= start) {
      return this
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;

    if (!val) val = 0;

    var i;
    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val)
        ? val
        : utf8ToBytes(new Buffer(val, encoding).toString());
      var len = bytes.length;
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this
  };

  // HELPER FUNCTIONS
  // ================

  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean (str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, '');
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return ''
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '=';
    }
    return str
  }

  function stringtrim (str) {
    if (str.trim) return str.trim()
    return str.replace(/^\s+|\s+$/g, '')
  }

  function toHex (n) {
    if (n < 16) return '0' + n.toString(16)
    return n.toString(16)
  }

  function utf8ToBytes (string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);

      // is surrogate component
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          }

          // valid lead
          leadSurrogate = codePoint;

          continue
        }

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue
        }

        // valid surrogate pair
        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null;

      // encode utf8
      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break
        bytes.push(
          codePoint >> 0x6 | 0xC0,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break
        bytes.push(
          codePoint >> 0xC | 0xE0,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break
        bytes.push(
          codePoint >> 0x12 | 0xF0,
          codePoint >> 0xC & 0x3F | 0x80,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else {
        throw new Error('Invalid code point')
      }
    }

    return bytes
  }

  function asciiToBytes (str) {
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray
  }

  function utf16leToBytes (str, units) {
    var c, hi, lo;
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break

      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray
  }


  function base64ToBytes (str) {
    return toByteArray(base64clean(str))
  }

  function blitBuffer (src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if ((i + offset >= dst.length) || (i >= src.length)) break
      dst[i + offset] = src[i];
    }
    return i
  }

  function isnan (val) {
    return val !== val // eslint-disable-line no-self-compare
  }


  // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually
  function isBuffer(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
  }

  function isFastBuffer (obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
  }

  // For Node v0.10 support. Remove this eventually.
  function isSlowBuffer (obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
  }

  var inherits;
  if (typeof Object.create === 'function'){
    inherits = function inherits(ctor, superCtor) {
      // implementation from standard node.js 'util' module
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    };
  } else {
    inherits = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function () {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    };
  }
  var inherits$1 = inherits;

  /**
   * Echos the value of a value. Trys to print the value out
   * in the best way possible given the different types.
   *
   * @param {Object} obj The object to print out.
   * @param {Object} opts Optional options object that alters the output.
   */
  /* legacy: obj, showHidden, depth, colors*/
  function inspect$1(obj, opts) {
    // default options
    var ctx = {
      seen: [],
      stylize: stylizeNoColor
    };
    // legacy...
    if (arguments.length >= 3) ctx.depth = arguments[2];
    if (arguments.length >= 4) ctx.colors = arguments[3];
    if (isBoolean(opts)) {
      // legacy...
      ctx.showHidden = opts;
    } else if (opts) {
      // got an "options" object
      _extend(ctx, opts);
    }
    // set default options
    if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
    if (isUndefined(ctx.depth)) ctx.depth = 2;
    if (isUndefined(ctx.colors)) ctx.colors = false;
    if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
    if (ctx.colors) ctx.stylize = stylizeWithColor;
    return formatValue(ctx, obj, ctx.depth);
  }

  // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
  inspect$1.colors = {
    'bold' : [1, 22],
    'italic' : [3, 23],
    'underline' : [4, 24],
    'inverse' : [7, 27],
    'white' : [37, 39],
    'grey' : [90, 39],
    'black' : [30, 39],
    'blue' : [34, 39],
    'cyan' : [36, 39],
    'green' : [32, 39],
    'magenta' : [35, 39],
    'red' : [31, 39],
    'yellow' : [33, 39]
  };

  // Don't use 'blue' not visible on cmd.exe
  inspect$1.styles = {
    'special': 'cyan',
    'number': 'yellow',
    'boolean': 'yellow',
    'undefined': 'grey',
    'null': 'bold',
    'string': 'green',
    'date': 'magenta',
    // "name": intentionally not styling
    'regexp': 'red'
  };


  function stylizeWithColor(str, styleType) {
    var style = inspect$1.styles[styleType];

    if (style) {
      return '\u001b[' + inspect$1.colors[style][0] + 'm' + str +
             '\u001b[' + inspect$1.colors[style][1] + 'm';
    } else {
      return str;
    }
  }


  function stylizeNoColor(str, styleType) {
    return str;
  }


  function arrayToHash(array) {
    var hash = {};

    array.forEach(function(val, idx) {
      hash[val] = true;
    });

    return hash;
  }


  function formatValue(ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (ctx.customInspect &&
        value &&
        isFunction$1(value.inspect) &&
        // Filter out the util module, it's inspect function is special
        value.inspect !== inspect$1 &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      var ret = value.inspect(recurseTimes, ctx);
      if (!isString(ret)) {
        ret = formatValue(ctx, ret, recurseTimes);
      }
      return ret;
    }

    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value);
    if (primitive) {
      return primitive;
    }

    // Look up the keys of the object.
    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);

    if (ctx.showHidden) {
      keys = Object.getOwnPropertyNames(value);
    }

    // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
    if (isError(value)
        && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
      return formatError(value);
    }

    // Some type of object without properties can be shortcutted.
    if (keys.length === 0) {
      if (isFunction$1(value)) {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }
      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toString.call(value), 'date');
      }
      if (isError(value)) {
        return formatError(value);
      }
    }

    var base = '', array = false, braces = ['{', '}'];

    // Make Array say that they are Array
    if (isArray$1(value)) {
      array = true;
      braces = ['[', ']'];
    }

    // Make functions say that they are functions
    if (isFunction$1(value)) {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    }

    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    }

    // Make error with message first say the error
    if (isError(value)) {
      base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      } else {
        return ctx.stylize('[Object]', 'special');
      }
    }

    ctx.seen.push(value);

    var output;
    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else {
      output = keys.map(function(key) {
        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
      });
    }

    ctx.seen.pop();

    return reduceToSingleString(output, base, braces);
  }


  function formatPrimitive(ctx, value) {
    if (isUndefined(value))
      return ctx.stylize('undefined', 'undefined');
    if (isString(value)) {
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');
    }
    if (isNumber$1(value))
      return ctx.stylize('' + value, 'number');
    if (isBoolean(value))
      return ctx.stylize('' + value, 'boolean');
    // For some reason typeof null is "object", so special case here.
    if (isNull(value))
      return ctx.stylize('null', 'null');
  }


  function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }


  function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];
    for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
            String(i), true));
      } else {
        output.push('');
      }
    }
    keys.forEach(function(key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
            key, true));
      }
    });
    return output;
  }


  function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
    if (desc.get) {
      if (desc.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (desc.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
    if (!hasOwnProperty(visibleKeys, key)) {
      name = '[' + key + ']';
    }
    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        if (isNull(recurseTimes)) {
          str = formatValue(ctx, desc.value, null);
        } else {
          str = formatValue(ctx, desc.value, recurseTimes - 1);
        }
        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str.split('\n').map(function(line) {
              return '  ' + line;
            }).join('\n').substr(2);
          } else {
            str = '\n' + str.split('\n').map(function(line) {
              return '   ' + line;
            }).join('\n');
          }
        }
      } else {
        str = ctx.stylize('[Circular]', 'special');
      }
    }
    if (isUndefined(name)) {
      if (array && key.match(/^\d+$/)) {
        return str;
      }
      name = JSON.stringify('' + key);
      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2);
        name = ctx.stylize(name, 'name');
      } else {
        name = name.replace(/'/g, "\\'")
                   .replace(/\\"/g, '"')
                   .replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }

    return name + ': ' + str;
  }


  function reduceToSingleString(output, base, braces) {
    var length = output.reduce(function(prev, cur) {
      if (cur.indexOf('\n') >= 0) ;
      return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
    }, 0);

    if (length > 60) {
      return braces[0] +
             (base === '' ? '' : base + '\n ') +
             ' ' +
             output.join(',\n  ') +
             ' ' +
             braces[1];
    }

    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  }


  // NOTE: These type checking functions intentionally don't use `instanceof`
  // because it is fragile and can be easily faked with `Object.create()`.
  function isArray$1(ar) {
    return Array.isArray(ar);
  }

  function isBoolean(arg) {
    return typeof arg === 'boolean';
  }

  function isNull(arg) {
    return arg === null;
  }

  function isNumber$1(arg) {
    return typeof arg === 'number';
  }

  function isString(arg) {
    return typeof arg === 'string';
  }

  function isUndefined(arg) {
    return arg === void 0;
  }

  function isRegExp(re) {
    return isObject$1(re) && objectToString(re) === '[object RegExp]';
  }

  function isObject$1(arg) {
    return typeof arg === 'object' && arg !== null;
  }

  function isDate(d) {
    return isObject$1(d) && objectToString(d) === '[object Date]';
  }

  function isError(e) {
    return isObject$1(e) &&
        (objectToString(e) === '[object Error]' || e instanceof Error);
  }

  function isFunction$1(arg) {
    return typeof arg === 'function';
  }

  function isPrimitive(arg) {
    return arg === null ||
           typeof arg === 'boolean' ||
           typeof arg === 'number' ||
           typeof arg === 'string' ||
           typeof arg === 'symbol' ||  // ES6 symbol
           typeof arg === 'undefined';
  }

  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }

  function _extend(origin, add) {
    // Don't do anything if add isn't an object
    if (!add || !isObject$1(add)) return origin;

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }
    return origin;
  }
  function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function compare(a, b) {
    if (a === b) {
      return 0;
    }

    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }

    if (x < y) {
      return -1;
    }
    if (y < x) {
      return 1;
    }
    return 0;
  }
  var hasOwn = Object.prototype.hasOwnProperty;

  var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) {
      if (hasOwn.call(obj, key)) keys.push(key);
    }
    return keys;
  };
  var pSlice = Array.prototype.slice;
  var _functionsHaveNames;
  function functionsHaveNames() {
    if (typeof _functionsHaveNames !== 'undefined') {
      return _functionsHaveNames;
    }
    return _functionsHaveNames = (function () {
      return function foo() {}.name === 'foo';
    }());
  }
  function pToString (obj) {
    return Object.prototype.toString.call(obj);
  }
  function isView(arrbuf) {
    if (isBuffer(arrbuf)) {
      return false;
    }
    if (typeof global$1.ArrayBuffer !== 'function') {
      return false;
    }
    if (typeof ArrayBuffer.isView === 'function') {
      return ArrayBuffer.isView(arrbuf);
    }
    if (!arrbuf) {
      return false;
    }
    if (arrbuf instanceof DataView) {
      return true;
    }
    if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
      return true;
    }
    return false;
  }
  // 1. The assert module provides functions that throw
  // AssertionError's when particular conditions are not met. The
  // assert module must conform to the following interface.

  function assert$1(value, message) {
    if (!value) fail(value, true, message, '==', ok);
  }

  // 2. The AssertionError is defined in assert.
  // new assert.AssertionError({ message: message,
  //                             actual: actual,
  //                             expected: expected })

  var regex = /\s*function\s+([^\(\s]*)\s*/;
  // based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
  function getName(func) {
    if (!isFunction$1(func)) {
      return;
    }
    if (functionsHaveNames()) {
      return func.name;
    }
    var str = func.toString();
    var match = str.match(regex);
    return match && match[1];
  }
  assert$1.AssertionError = AssertionError;
  function AssertionError(options) {
    this.name = 'AssertionError';
    this.actual = options.actual;
    this.expected = options.expected;
    this.operator = options.operator;
    if (options.message) {
      this.message = options.message;
      this.generatedMessage = false;
    } else {
      this.message = getMessage(this);
      this.generatedMessage = true;
    }
    var stackStartFunction = options.stackStartFunction || fail;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, stackStartFunction);
    } else {
      // non v8 browsers so we can have a stacktrace
      var err = new Error();
      if (err.stack) {
        var out = err.stack;

        // try to strip useless frames
        var fn_name = getName(stackStartFunction);
        var idx = out.indexOf('\n' + fn_name);
        if (idx >= 0) {
          // once we have located the function frame
          // we need to strip out everything before it (and its line)
          var next_line = out.indexOf('\n', idx + 1);
          out = out.substring(next_line + 1);
        }

        this.stack = out;
      }
    }
  }

  // assert.AssertionError instanceof Error
  inherits$1(AssertionError, Error);

  function truncate(s, n) {
    if (typeof s === 'string') {
      return s.length < n ? s : s.slice(0, n);
    } else {
      return s;
    }
  }
  function inspect(something) {
    if (functionsHaveNames() || !isFunction$1(something)) {
      return inspect$1(something);
    }
    var rawname = getName(something);
    var name = rawname ? ': ' + rawname : '';
    return '[Function' +  name + ']';
  }
  function getMessage(self) {
    return truncate(inspect(self.actual), 128) + ' ' +
           self.operator + ' ' +
           truncate(inspect(self.expected), 128);
  }

  // At present only the three keys mentioned above are used and
  // understood by the spec. Implementations or sub modules can pass
  // other keys to the AssertionError's constructor - they will be
  // ignored.

  // 3. All of the following functions must throw an AssertionError
  // when a corresponding condition is not met, with a message that
  // may be undefined if not provided.  All assertion methods provide
  // both the actual and expected values to the assertion error for
  // display purposes.

  function fail(actual, expected, message, operator, stackStartFunction) {
    throw new AssertionError({
      message: message,
      actual: actual,
      expected: expected,
      operator: operator,
      stackStartFunction: stackStartFunction
    });
  }

  // EXTENSION! allows for well behaved errors defined elsewhere.
  assert$1.fail = fail;

  // 4. Pure assertion tests whether a value is truthy, as determined
  // by !!guard.
  // assert.ok(guard, message_opt);
  // This statement is equivalent to assert.equal(true, !!guard,
  // message_opt);. To test strictly for the value true, use
  // assert.strictEqual(true, guard, message_opt);.

  function ok(value, message) {
    if (!value) fail(value, true, message, '==', ok);
  }
  assert$1.ok = ok;

  // 5. The equality assertion tests shallow, coercive equality with
  // ==.
  // assert.equal(actual, expected, message_opt);
  assert$1.equal = equal;
  function equal(actual, expected, message) {
    if (actual != expected) fail(actual, expected, message, '==', equal);
  }

  // 6. The non-equality assertion tests for whether two objects are not equal
  // with != assert.notEqual(actual, expected, message_opt);
  assert$1.notEqual = notEqual;
  function notEqual(actual, expected, message) {
    if (actual == expected) {
      fail(actual, expected, message, '!=', notEqual);
    }
  }

  // 7. The equivalence assertion tests a deep equality relation.
  // assert.deepEqual(actual, expected, message_opt);
  assert$1.deepEqual = deepEqual;
  function deepEqual(actual, expected, message) {
    if (!_deepEqual(actual, expected, false)) {
      fail(actual, expected, message, 'deepEqual', deepEqual);
    }
  }
  assert$1.deepStrictEqual = deepStrictEqual;
  function deepStrictEqual(actual, expected, message) {
    if (!_deepEqual(actual, expected, true)) {
      fail(actual, expected, message, 'deepStrictEqual', deepStrictEqual);
    }
  }

  function _deepEqual(actual, expected, strict, memos) {
    // 7.1. All identical values are equivalent, as determined by ===.
    if (actual === expected) {
      return true;
    } else if (isBuffer(actual) && isBuffer(expected)) {
      return compare(actual, expected) === 0;

    // 7.2. If the expected value is a Date object, the actual value is
    // equivalent if it is also a Date object that refers to the same time.
    } else if (isDate(actual) && isDate(expected)) {
      return actual.getTime() === expected.getTime();

    // 7.3 If the expected value is a RegExp object, the actual value is
    // equivalent if it is also a RegExp object with the same source and
    // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
    } else if (isRegExp(actual) && isRegExp(expected)) {
      return actual.source === expected.source &&
             actual.global === expected.global &&
             actual.multiline === expected.multiline &&
             actual.lastIndex === expected.lastIndex &&
             actual.ignoreCase === expected.ignoreCase;

    // 7.4. Other pairs that do not both pass typeof value == 'object',
    // equivalence is determined by ==.
    } else if ((actual === null || typeof actual !== 'object') &&
               (expected === null || typeof expected !== 'object')) {
      return strict ? actual === expected : actual == expected;

    // If both values are instances of typed arrays, wrap their underlying
    // ArrayBuffers in a Buffer each to increase performance
    // This optimization requires the arrays to have the same type as checked by
    // Object.prototype.toString (aka pToString). Never perform binary
    // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
    // bit patterns are not identical.
    } else if (isView(actual) && isView(expected) &&
               pToString(actual) === pToString(expected) &&
               !(actual instanceof Float32Array ||
                 actual instanceof Float64Array)) {
      return compare(new Uint8Array(actual.buffer),
                     new Uint8Array(expected.buffer)) === 0;

    // 7.5 For all other Object pairs, including Array objects, equivalence is
    // determined by having the same number of owned properties (as verified
    // with Object.prototype.hasOwnProperty.call), the same set of keys
    // (although not necessarily the same order), equivalent values for every
    // corresponding key, and an identical 'prototype' property. Note: this
    // accounts for both named and indexed properties on Arrays.
    } else if (isBuffer(actual) !== isBuffer(expected)) {
      return false;
    } else {
      memos = memos || {actual: [], expected: []};

      var actualIndex = memos.actual.indexOf(actual);
      if (actualIndex !== -1) {
        if (actualIndex === memos.expected.indexOf(expected)) {
          return true;
        }
      }

      memos.actual.push(actual);
      memos.expected.push(expected);

      return objEquiv(actual, expected, strict, memos);
    }
  }

  function isArguments(object) {
    return Object.prototype.toString.call(object) == '[object Arguments]';
  }

  function objEquiv(a, b, strict, actualVisitedObjects) {
    if (a === null || a === undefined || b === null || b === undefined)
      return false;
    // if one is a primitive, the other must be same
    if (isPrimitive(a) || isPrimitive(b))
      return a === b;
    if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
      return false;
    var aIsArgs = isArguments(a);
    var bIsArgs = isArguments(b);
    if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
      return false;
    if (aIsArgs) {
      a = pSlice.call(a);
      b = pSlice.call(b);
      return _deepEqual(a, b, strict);
    }
    var ka = objectKeys(a);
    var kb = objectKeys(b);
    var key, i;
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length !== kb.length)
      return false;
    //the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] !== kb[i])
        return false;
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i];
      if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
        return false;
    }
    return true;
  }

  // 8. The non-equivalence assertion tests for any deep inequality.
  // assert.notDeepEqual(actual, expected, message_opt);
  assert$1.notDeepEqual = notDeepEqual;
  function notDeepEqual(actual, expected, message) {
    if (_deepEqual(actual, expected, false)) {
      fail(actual, expected, message, 'notDeepEqual', notDeepEqual);
    }
  }

  assert$1.notDeepStrictEqual = notDeepStrictEqual;
  function notDeepStrictEqual(actual, expected, message) {
    if (_deepEqual(actual, expected, true)) {
      fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
    }
  }


  // 9. The strict equality assertion tests strict equality, as determined by ===.
  // assert.strictEqual(actual, expected, message_opt);
  assert$1.strictEqual = strictEqual;
  function strictEqual(actual, expected, message) {
    if (actual !== expected) {
      fail(actual, expected, message, '===', strictEqual);
    }
  }

  // 10. The strict non-equality assertion tests for strict inequality, as
  // determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
  assert$1.notStrictEqual = notStrictEqual;
  function notStrictEqual(actual, expected, message) {
    if (actual === expected) {
      fail(actual, expected, message, '!==', notStrictEqual);
    }
  }

  function expectedException(actual, expected) {
    if (!actual || !expected) {
      return false;
    }

    if (Object.prototype.toString.call(expected) == '[object RegExp]') {
      return expected.test(actual);
    }

    try {
      if (actual instanceof expected) {
        return true;
      }
    } catch (e) {
      // Ignore.  The instanceof check doesn't work for arrow functions.
    }

    if (Error.isPrototypeOf(expected)) {
      return false;
    }

    return expected.call({}, actual) === true;
  }

  function _tryBlock(block) {
    var error;
    try {
      block();
    } catch (e) {
      error = e;
    }
    return error;
  }

  function _throws(shouldThrow, block, expected, message) {
    var actual;

    if (typeof block !== 'function') {
      throw new TypeError('"block" argument must be a function');
    }

    if (typeof expected === 'string') {
      message = expected;
      expected = null;
    }

    actual = _tryBlock(block);

    message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
              (message ? ' ' + message : '.');

    if (shouldThrow && !actual) {
      fail(actual, expected, 'Missing expected exception' + message);
    }

    var userProvidedMessage = typeof message === 'string';
    var isUnwantedException = !shouldThrow && isError(actual);
    var isUnexpectedException = !shouldThrow && actual && !expected;

    if ((isUnwantedException &&
        userProvidedMessage &&
        expectedException(actual, expected)) ||
        isUnexpectedException) {
      fail(actual, expected, 'Got unwanted exception' + message);
    }

    if ((shouldThrow && actual && expected &&
        !expectedException(actual, expected)) || (!shouldThrow && actual)) {
      throw actual;
    }
  }

  // 11. Expected to throw an error:
  // assert.throws(block, Error_opt, message_opt);
  assert$1.throws = throws;
  function throws(block, /*optional*/error, /*optional*/message) {
    _throws(true, block, error, message);
  }

  // EXTENSION! This is annoying to write outside this module.
  assert$1.doesNotThrow = doesNotThrow;
  function doesNotThrow(block, /*optional*/error, /*optional*/message) {
    _throws(false, block, error, message);
  }

  assert$1.ifError = ifError;
  function ifError(err) {
    if (err) throw err;
  }

  class Collection {
      constructor(items) {
          this.items = items;
      }

      // Add an item to the end of the collection
      append(item) {
          this.items.push(item);
      }

      // Insert an item at a specific index
      insert(index, item) {
          this.items.splice(index, 0, item);
      }

      // Remove an item from the collection
      remove(item) {
          const index = this.items.indexOf(item);
          if (index !== -1) {
              this.items.splice(index, 1);
          }
      }

      // Find the index of an item in the collection
      index(item) {
          return this.items.indexOf(item);
      }

      // Check if an item is in the collection
      contains(item) {
          return this.index(item) !== -1;
      }

      // Get the length of the collection
      length() {
          return this.items.length;
      }

      // Get the item at a specific index
      get(index) {
          return this.items[index];
      }

      // Set the item at a specific index
      set(index, item) {
          this.items[index] = item;
      }

      // Get a sub-collection (slice) of the collection
      slice(start, end) {
          return new Collection(this.items.slice(start, end));
      }

      map(fn) {
          const mapped = this.items.map(fn);
          return new Collection(mapped);
      }

      // Reduce the collection to a single value by applying a function to each item in the collection
      reduce(fn, initialValue) {
          return this.items.reduce(fn, initialValue);
      }

      // Filter the collection to a new Collection with only the items that pass a test function
      filter(fn) {
          return new Collection(this.items.filter(fn));
      }

      toString() {
          return `[${this.items.join(", ")}]`;
      }
  }

  const collection = new Collection([1, 2, 3, 4]);

  assert$1.deepStrictEqual(collection.items, [1, 2, 3, 4]);

  collection.append(5);
  assert$1.deepStrictEqual(collection.items, [1, 2, 3, 4, 5]);

  collection.insert(1, 1.5);
  assert$1.deepStrictEqual(collection.items, [1, 1.5, 2, 3, 4, 5]);

  collection.remove(2);
  assert$1.deepStrictEqual(collection.items, [1, 1.5, 3, 4, 5]);

  assert$1.strictEqual(collection.index(3), 2);

  assert$1(collection.contains(3));
  assert$1(!collection.contains(10));

  assert$1.strictEqual(collection.length(), 5);

  assert$1.strictEqual(collection.get(1), 1.5);

  collection.set(1, 2);
  assert$1.deepStrictEqual(collection.items, [1, 2, 3, 4, 5]);

  const subCollection = collection.slice(1, 3);
  assert$1.deepStrictEqual(subCollection.items, [2, 3]);

  const mapped = collection.map(x => x * 2);
  assert$1.deepStrictEqual(mapped.items, [2, 4, 6, 8, 10]);

  const reduced = collection.reduce((acc, x) => acc + x, 0);
  assert$1.strictEqual(reduced, 15);

  const filtered = collection.filter(x => x % 2 === 0);
  assert$1.deepStrictEqual(filtered.items, [2, 4]);

  const VARS = new Map();

  class Var {

      constructor(name, value, scope = "global") {
          this.name = name;
          this.value = value;
          this.scope = scope;
      }

      get var() {
          return this.value;
      }

      set var(value) {
          this.value = value;
      }
  }

  function registerNativeConstants(map) {

      for (const name in map) {
          let value = map[name];

          VARS.set(name, new Var(name, value));
      }
  }

  class Fraction {

      constructor(numerator, denominator = 1) {
          if (denominator === 0) {
              throw new Error("Cannot divide by 0");
          }

          if (arguments.length === 2) {
              // Both numerator and denominator are provided
              this.numerator = numerator;
              this.denominator = denominator;
          } else {
              // Only numerator is provided
              if (Number.isInteger(numerator)) {
                  this.numerator = numerator;
                  this.denominator = 1;
              } else {
                  this.numerator = numerator * Math.pow(10, numerator.toString().split(".")[1].length);
                  this.denominator = Math.pow(10, numerator.toString().split(".")[1].length);
                  this.simplify();
              }
          }
      }

      add(otherFraction) {
          const numerator =
              this.numerator * otherFraction.denominator +
              otherFraction.numerator * this.denominator;
          const denominator = this.denominator * otherFraction.denominator;
          return new Fraction(numerator, denominator).simplify();
      }

      subtract(otherFraction) {
          const numerator =
              this.numerator * otherFraction.denominator -
              otherFraction.numerator * this.denominator;
          const denominator = this.denominator * otherFraction.denominator;
          return new Fraction(numerator, denominator).simplify();
      }

      multiply(otherFraction) {
          const numerator = this.numerator * otherFraction.numerator;
          const denominator = this.denominator * otherFraction.denominator;
          return new Fraction(numerator, denominator).simplify();
      }

      divide(otherFraction) {
          const numerator = this.numerator * otherFraction.denominator;
          const denominator = this.denominator * otherFraction.numerator;
          return new Fraction(numerator, denominator).simplify();
      }

      pow(otherFraction) {
          const numerator = this.numerator ** otherFraction.numerator;
          const denominator = this.denominator ** otherFraction.denominator;
          return new Fraction(numerator, denominator).simplify();
      }

      factorial() {
          let x = 1;
          for (let i = 2; i <= this.numerator; i++) {
              x *= i;
          }

          return new Fraction(x);
      }

      abs() {
          return new Fraction(Math.abs(this.numerator), Math.abs(this.denominator));
      }

      simplify() {
          let gcd = this.getGCD(this.numerator, this.denominator);
          this.numerator = this.numerator / gcd;
          this.denominator = this.denominator / gcd;
          return this;
      }

      getGCD(a, b) {
          if (b === 0) {
              return a;
          }
          return this.getGCD(b, a % b);
      }

      toString() {
          const pretty = VARS.get("pretty_printing");

          if (pretty !== undefined && pretty) {
              return this.evaluate().toString();
          } else {
              return `${this.numerator}/${this.denominator}`;
          }
      }

      evaluate() {
          return this.numerator / this.denominator;
      }

      parse() {
          return this;
      }
  }

  const f1 = new Fraction(1, 2);
  assert$1.strictEqual(f1.numerator, 1);
  assert$1.strictEqual(f1.denominator, 2);

  // Test creating a fraction with only numerator
  const f2 = new Fraction(1);
  assert$1.strictEqual(f2.numerator, 1);
  assert$1.strictEqual(f2.denominator, 1);

  // Test creating a fraction from a float
  const f3 = new Fraction(0.125);
  assert$1.strictEqual(f3.numerator, 1);
  assert$1.strictEqual(f3.denominator, 8);

  // Test adding two fractions
  const f4 = f1.add(f2);
  assert$1.strictEqual(f4.numerator, 3);
  assert$1.strictEqual(f4.denominator, 2);

  // Test subtracting two fractions
  f1.subtract(f2);
  // assert.strictEqual(f5.numerator, -1);
  // assert.strictEqual(f5.denominator, 2);

  // Test multiplying two fractions
  const f6 = f1.multiply(f2);
  assert$1.strictEqual(f6.numerator, 1);
  assert$1.strictEqual(f6.denominator, 2);

  // Test dividing two fractions
  const f7 = f1.divide(f2);
  assert$1.strictEqual(f7.numerator, 1);
  assert$1.strictEqual(f7.denominator, 2);

  // Test simplifying a fraction
  const f8 = new Fraction(2, 4);
  f8.simplify();
  assert$1.strictEqual(f8.numerator, 1);
  assert$1.strictEqual(f8.denominator, 2);

  // Test converting a fraction to a string
  assert$1.strictEqual(f1.toString(), '1/2');

  class Complex {
      constructor(real, imag) {
          this.real = real instanceof Fraction ? real : new Fraction(real);
          this.imag = imag instanceof Fraction ? imag : new Fraction(imag);
      }

      //adds to Complex types together
      add(other) {
          if (!(other instanceof Complex)) {
              other = new Complex(other);
          }
          return new Complex(
              this.real.add(other.real),
              this.imag.add(other.imag)
          );
      }

      //subtracts two Complex types from each other
      subtract(other) {
          if (!(other instanceof Complex)) {
              other = new Complex(other);
          }
          return new Complex(
              this.real.subtract(other.real),
              this.imag.subtract(other.imag)
          );
      }

      //multiplies to Complex types with each other
      multiply(other) {
          if (!(other instanceof Complex)) {
              other = new Complex(other);
          }
          return new Complex(
              this.real
                  .multiply(other.real)
                  .subtract(this.imag.multiply(other.imag)),
              this.real.multiply(other.imag).add(this.imag.multiply(other.real))
          );
      }

      //divides two Complex types by each other
      divide(other) {
          if (!(other instanceof Complex)) {
              other = new Complex(other);
          }
          // const denom = other.real ** 2 + other.imag ** 2;
          // return new Complex(
          //     (this.real * other.real + this.imag * other.imag) / denom,
          //     (this.imag * other.real - this.real * other.imag) / denom
          // );
          //I have no idea if this will work!! 10:30 pm vibez man!
          let real = this.real
              .multiply(other.real)
              .add(this.imag.multiply(other.imag));
          let imag = this.imag
              .multiply(other.real)
              .subtract(this.real.multiply(other.imag));
          let denom = other.real
              .multiply(other.real)
              .add(other.imag.multiply(other.imag));
          return new Complex(
              real.divide(denom).evaluate(),
              imag.divide(denom).evaluate()
          );
      }

      //returns the conjugate of the complex number, which is obtained by negating the imaginary part of the complex number
      conjugate() {
          return new Complex(this.real, this.imag.multiply(-1));
      }

      //returns the absolute value (magnitude) of the complex number
      abs() {
          return new Fraction(Math.sqrt(
              this.real.multiply(this.real).add(this.imag.multiply(this.imag))
          ));
      }

      //returns the argument (angle) of the complex number in radians when no input is given
      //when input is true, the answer given is in degrees
      arg(degrees = false) {
          const argument = Math.atan2(this.imag.evaluate(), this.real.evaluate());
          return new Fraction(degrees ? (argument * 180) / Math.PI : argument);
      }

      //returns the nth power of the complex number.
      pow(n) {
          if (!(n instanceof Fraction)) {
              n = new Fraction(n);
          } // todo is this supposed to be fraction or ?

          const magnitude = this.abs();
          const argument = this.arg();
          return new Complex(
              magnitude ** n.evaluate() * Math.cos(argument * n.evaluate()),
              magnitude ** n.evaluate() * Math.sin(argument * n.evaluate())
          );
      }

      //returns the exponential of the complex number, which is defined as e^(a+bi) = e^a * (cos(b) + i*sin(b))
      exp() {
          return new Complex(
              Math.exp(this.real.evaluate()) * Math.cos(this.imag.evaluate()),
              Math.exp(this.real.evaluate()) * Math.sin(this.imag.evaluate())
          );
      }

      //return the length of the complex number
      length() {
          let real = this.real.evaluate();
          let imag = this.imag.evaluate();
          return new Fraction(
              Math.sqrt((real ^ 2) + (imag ^ 2))
          )
      }

      //returns the sine of the complex number
      sin() {
          return new Complex(
              Math.sin(this.real.evaluate()) * Math.cosh(this.imag.evaluate()),
              Math.cos(this.real.evaluate()) * Math.sinh(this.imag.evaluate())
          );
      }

      //returns the cosine of the complex number
      cos() {
          return new Complex(
              Math.cos(this.real.evaluate()) * Math.cosh(this.imag.evaluate()),
              -Math.sin(this.real.evaluate()) * Math.sinh(this.imag.evaluate())
          );
      }

      //return the tangent of the complex number
      tan() {
          return this.sin().divide(this.cos());
      }

      //returns the hyperbolic cosine of the complex number
      cosh() {
          return new Complex(
              Math.cos(this.imag.evaluate()) * Math.cosh(this.real.evaluate()),
              Math.sin(this.imag.evaluate()) * Math.sinh(this.real.evaluate())
          );
      }

      //returns the hyperbolic sine of the complex number
      sinh() {
          return new Complex(
              Math.sin(this.imag.evaluate()) * Math.cosh(this.real.evaluate()),
              Math.cos(this.imag.evaluate()) * Math.sinh(this.real.evaluate())
          );
      }

      //returns the hyperbolic tangent of the complex number
      tanh() {
          return this.sinh().divide(this.cosh());
      }

      //returns a string representation of the complex number
      toString() {
          let imag = this.imag.evaluate();

          let imag_part = imag > 0
              ? `+ ${imag}`
              : `- ${Math.abs(imag)}`;
          return `(${this.real.evaluate()} ${imag_part} i)`;
      }
  }

  const FUNS = new Map();

  class Fn {

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

          return this.block.parse();
      }
  }

  class AFn extends Fn {

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

          return this.block.parse();
      }
  }

  class NativeFn extends Fn {

      constructor(name, afn) {
          super(name);

          this.afn = afn;
      }

      invoke(params) {
          return this.afn(...params);
      }
  }

  // registers a single function
  function register(fn) {
      if (fn.name.length === 0) {
          throw new Error("Cannot register anonymous functions");
      }

      FUNS.set(fn.name, fn);
  }

  // registers a native function, provided with a map
  function registerNativeFns(map) {

      for (const name in map) {
          let fn = map[name];

          register(new NativeFn(name, fn));
      }
  }

  class Str extends Collection {
      constructor(items = []) {
          if (typeof items === "string") {
              items = items.split("");
          }
          super(items);
      }

      // Get the complete string as a JavaScript string
      get string() {
          return this.items.join("");
      }

      // Set the complete string by splitting it into an array of characters
      set string(string) {
          this.items = string.split("");
      }

      // Reverse the string
      reverse() {
          return new Str(this.items.reverse());
      }

      // Get the character at a specific index
      charAt(index) {
          return this.items[index];
      }

      // Get the index of the first occurrence of a substring
      indexOf(substring) {
          return this.string.indexOf(substring);
      }

      // Get the index of the last occurrence of a substring
      lastIndexOf(substring) {
          return this.string.lastIndexOf(substring);
      }

      // Check if the string starts with a specific substring
      startsWith(substring) {
          return this.string.startsWith(substring);
      }

      // Check if the string ends with a specific substring
      endsWith(substring) {
          return this.string.endsWith(substring);
      }

      // Get the substring between two indices (inclusive)
      slice(start, end) {
          return new Str(this.items.slice(start, end + 1));
      }

      // Split the string into an array of substrings
      split(separator) {
          return new Collection(this.string.split(separator));
      }

      // Replace all occurrences of a substring with another string
      replace(substring, replacement) {
          return new Str(
              this.string.replace(substring, replacement).split("")
          );
      }

      // Remove leading and trailing whitespace from the string
      trim() {
          return new Str(this.string).trim().split("");
      }

      // Convert the string to uppercase
      toUpperCase() {
          return new Str(this.string.toUpperCase().split(""));
      }

      // Convert the string to lowercase
      toLowerCase() {
          return new Str(this.string.toLowerCase().split(""));
      }

      // Convert the string to a number
      toNumber() {
          return Number(this.string);
      }

      // Check if the string is empty
      isEmpty() {
          return this.items.length === 0;
      }

      getCharAt(index) {
          if (index < 0 || index >= this.items.length) {
              throw new RangeError("Index out of bounds");
          }
          return this.items[index];
      }

      // Set the character at a specific index
      setCharAt(index, char) {
          if (index < 0 || index >= this.items.length) {
              throw new RangeError("Index out of bounds");
          }
          if (typeof char !== "string" || char.length !== 1) {
              throw new TypeError("Value must be a single character string");
          }
          this.items[index] = char;
      }

      // Concatenate multiple strings or String objects
      concat(...strings) {
          let combinedString = this.string;
          for (const string of strings) {
              if (string instanceof Str) {
                  combinedString = combinedString.concat(string.string);
              } else if (typeof string === "string") {
                  combinedString = combinedString.concat(string);
              } else {
                  throw new TypeError("Value must be a string or String object");
              }
          }
          return new Str(combinedString);
      }

      // Pad the start of the string with a character or string
      padStart(length, padString = " ") {
          if (typeof length !== "number" || length < 0) {
              throw new TypeError("Length must be a non-negative number");
          }
          if (typeof padString !== "string") {
              throw new TypeError("Pad string must be a string");
          }
          return new Str(this.string.padStart(length, padString));
      }

      // Pad the end of the string with a character or string
      padEnd(length, padString = " ") {
          if (typeof length !== "number" || length < 0) {
              throw new TypeError("Length must be a non-negative number");
          }
          if (typeof padString !== "string") {
              throw new TypeError("Pad string must be a string");
          }
          return new Str(this.string.padEnd(length, padString));
      }

      // Pad the start and end of the string with a character or string
      pad(startLength, endLength = startLength, padString = " ") {
          if (typeof startLength !== "number" || startLength < 0) {
              throw new TypeError("Start length must be a non-negative number");
          }
          if (typeof endLength !== "number" || endLength < 0) {
              throw new TypeError("End length must be a non-negative number");
          }
          if (typeof padString !== "string") {
              throw new TypeError("Pad string must be a string");
          }
          return this.padStart(startLength, padString).padEnd(
              endLength,
              padString
          );
      }

      // Repeat the string a specified number of times
      repeat(count) {
          if (typeof count !== "number" || count < 0) {
              throw new TypeError("Count must be a non-negative number");
          }
          return new Str(this.string.repeat(count));
      }

      // Get the substring between two indices (inclusive)
      substring(start, end) {
          if (
              typeof start !== "number" ||
              start < 0 ||
              start > this.items.length
          ) {
              throw new RangeError("Start index out of bounds");
          }
          if (typeof end !== "number" || end < 0 || end > this.items.length) {
              throw new RangeError("End index out of bounds");
          }
          return new Str(this.items.slice(start, end + 1));
      }

      match(regex) {
          return this.string.match(new RegExp(regex, "g"));
      }

      // Search for a substring or regular expression in the string
      search(query) {
          return this.string.search(query);
      }

      // Truncate the string to a given length and append an ellipsis if necessary
      truncate(length, ellipsis = "...") {
          if (this.string.length > length) {
              return new Str(
                  this.string.slice(0, length - ellipsis.length) + ellipsis
              );
          }
          return new Str(this.string);
      }

      // Get the Unicode code point value at a specific index
      codePointAt(index) {
          return this.string.codePointAt(index);
      }

      add(other) {
          if (!(other instanceof Str)) {
              throw new TypeError("Cannot add another type to String");
          }

          return this.string.concat(other);
      }

      fillTokens() {
          let string = this.string;
          const regex = /\$(([a-zA-Z_]\w*)(\(.*?\))?)/g;

          for (let item of this.string.matchAll(regex)) {
              const full = item[0];
              const importantStuff = item[1];
              const ident = item[2];

              if (item[3] !== undefined) { // fn invocation
                  const fn = FUNS.get(ident);

                  if (fn === undefined) {
                      continue;
                  }

                  string = string.replace(full, parseInput(importantStuff).toString());
              } else { // var
                  const variable = VARS.get(ident);

                  if (variable === undefined) {
                      continue;
                  }

                  string = string.replace(full, variable.value === null ? "unknown" : variable.value.toString());
              }
          }

          return string;
      }

      toString() {
          return this.fillTokens();
      }
  }

  class Matrix extends Collection {

      // Initialize a Matrix with a 2D array of numbers or a Collection instance
      // accounts that all rows of the matrix must be of the same length
      // when matrix rows are not of the same length, they are filled with 0's
      constructor(matrix) {
          super();

          if (matrix instanceof Collection) {
              matrix = matrix.items;
          }

          const maxRowLength = Math.max(...matrix.map((row) => row.length));
          this.items = matrix.map((row) => {
              while (row.length < maxRowLength) {
                  row.push(0);
              }
              return row;
          });
      }

      // Transpose the Matrix (swap rows and columns)
      transpose() {
          const transposed = this.items[0].map((col, i) =>
              this.items.map((row) => row[i])
          );
          return new Matrix(transposed);
      }

      // Multiply the Matrix by another Matrix or a scalar value
      multiply(other) {
          if (other instanceof Matrix) {
              if (this.items[0].length !== other.items.length) {
                  throw new Error("Invalid matrix dimensions for multiplication");
              }

              const product = this.items.map((row) => {
                  return other.transpose().items.map((col) => {
                      return row.reduce(
                          (total, value, i) => total + value * col[i],
                          0
                      );
                  });
              });

              return new Matrix(product);
          } else {
              const product = this.items.map((row) =>
                  row.map((value) => value * other)
              );
              return new Matrix(product);
          }
      }

      // Add the Matrix to another Matrix
      add(other) {
          if (
              this.items.length !== other.items.length ||
              this.items[0].length !== other.items[0].length
          ) {
              throw new Error("Invalid matrix dimensions for addition");
          }

          const sum = this.items.map((row, i) =>
              row.map((value, j) => value + other.items[i][j])
          );
          return new Matrix(sum);
      }

      // Subtract another Matrix from the Matrix
      subtract(other) {
          if (
              this.items.length !== other.items.length ||
              this.items[0].length !== other.items[0].length
          ) {
              throw new Error("Invalid matrix dimensions for subtraction");
          }

          const difference = this.items.map((row, i) =>
              row.map((value, j) => value - other.items[i][j])
          );
          return new Matrix(difference);
      }

      // Get the determinant of the Matrix (only works for square matrices)
      determinant() {
          if (this.items.length !== this.items[0].length) {
              throw new Error("Matrix must be square to calculate determinant");
          }

          if (this.items.length === 2) {
              return (
                  this.items[0][0] * this.items[1][1] -
                  this.items[0][1] * this.items[1][0]
              );
          }

          let determinant = 0;
          for (let i = 0; i < this.items[0].length; i++) {
              const cofactor = new Matrix(
                  this.items
                      .slice(1)
                      .map((row) => row.slice(0, i).concat(row.slice(i + 1)))
              );
              determinant +=
                  (i % 2 === 0 ? 1 : -1) *
                  this.items[0][i] *
                  cofactor.determinant();
          }
          return determinant;
      }

      // todo add
      pow(n) {

      }

      // todo add
      factorial() {

      }

      // Get the number of columns in the Matrix
      col() {
          return this.items[0].length;
      }

      // Get the number of rows in the Matrix
      row() {
          return this.items.length;
      }

      // Get the dimensions of the Matrix (number of rows and columns)
      dimensions() {
          return {rows: this.row(), cols: this.col()};
      }

      // Transform the Matrix into a square Matrix, filling missing values with 0's
      toSquare() {
          const maxDimension = Math.max(this.row(), this.col());
          const squareMatrix = new Array(maxDimension)
              .fill(0)
              .map(() => new Array(maxDimension).fill(0));
          this.items.forEach((row, i) => {
              row.forEach((value, j) => {
                  squareMatrix[i][j] = value;
              });
          });
          return new Matrix(squareMatrix);
      }

      // Get the value at a specific position in the Matrix
      get(row, col) {
          if (row >= this.row() || col >= this.col()) {
              throw new Error("Invalid matrix position");
          }
          return this.items[row][col];
      }

      // Set the value at a specific position in the Matrix
      set(row, col, value) {
          if (row >= this.row() || col >= this.col()) {
              throw new Error("Invalid matrix position");
          }
          this.items[row][col] = value;
      }

      // Add a row to the Matrix
      addRow(row) {
          if (!row) {
              row = new Array(this.col()).fill(0);
          }
          if (row.length > this.col()) {
              row = row.slice(0, this.col());
          }
          if (row.length < this.col()) {
              while (row.length < this.col()) {
                  row.push(0);
              }
          }
          this.items.push(row);
      }

      // Add a column to the Matrix
      addCol(col) {
          if (!col) {
              col = new Array(this.row()).fill(0);
          }
          if (col.length > this.row()) {
              col = col.slice(0, this.row());
          }
          if (col.length < this.row()) {
              while (col.length < this.row()) {
                  col.push(0);
              }
          }
          this.items = this.items.map((row, i) => row.concat(col[i]));
      }

      // Check if the Matrix is a square matrix
      isSquare() {
          return this.items.length === this.items[0].length;
      }

      // Check if the Matrix is a diagonal matrix
      isDiagonal() {
          if (!this.isSquare()) {
              return false;
          }
          for (let i = 0; i < this.items.length; i++) {
              for (let j = 0; j < this.items[0].length; j++) {
                  if (i !== j && this.items[i][j] !== 0) {
                      return false;
                  }
              }
          }
          return true;
      }

      // Check if the Matrix is an identity matrix
      isIdentity() {
          if (!this.isSquare()) {
              return false;
          }
          for (let i = 0; i < this.items.length; i++) {
              for (let j = 0; j < this.items[0].length; j++) {
                  if (i === j && this.items[i][j] !== 1) {
                      return false;
                  }
                  if (i !== j && this.items[i][j] !== 0) {
                      return false;
                  }
              }
          }
          return true;
      }

      // Check if the Matrix is a lower triangular matrix
      isLowerTriangular() {
          if (!this.isSquare()) {
              return false;
          }
          for (let i = 0; i < this.items.length; i++) {
              for (let j = 0; j < this.items[0].length; j++) {
                  if (i < j && this.items[i][j] !== 0) {
                      return false;
                  }
              }
          }
          return true;
      }

      // Check if the Matrix is an upper triangular matrix
      isUpperTriangular() {
          if (!this.isSquare()) {
              return false;
          }
          for (let i = 0; i < this.items.length; i++) {
              for (let j = 0; j < this.items[0].length; j++) {
                  if (i > j && this.items[i][j] !== 0) {
                      return false;
                  }
              }
          }
          return true;
      }

      inverse() {
          if (!this.isSquare()) {
              throw new Error("Matrix must be square to calculate inverse");
          }

          // Check if matrix is invertible
          const det = this.determinant();
          if (det === 0) {
              throw new Error("Matrix is not invertible");
          }

          // Calculate inverse using cofactor expansion
          const inverted = this.items.map((row, i) => {
              return row.map((value, j) => {
                  const cofactor = new Matrix(
                      this.items
                          .slice(0, i)
                          .concat(this.items.slice(i + 1))
                          .map((row) => row.slice(0, j).concat(row.slice(j + 1)))
                  );
                  return (i + j) % 2 === 0
                      ? cofactor.determinant()
                      : -cofactor.determinant();
              });
          });
          return new Matrix(inverted).multiply(1 / det);
      }

      // Calculate the rank of a matrix
      rank() {
          // Convert matrix to reduced row echelon form
          const rref = this.rref();
          let rank = 0;
          rref.items.forEach((row) => {
              if (!row.every((value) => value === 0)) {
                  rank++;
              }
          });
          return rank;
      }

      //rhs stands for right hand side and as a parameter represents the vector of constants
      //on the right side of the equation represented by the matrix
      solve(rhs) {
          // Check if the matrix is square
          if (!this.isSquare()) {
              throw new Error(
                  "Matrix must be square to solve system of equations"
              );
          }

          // Check if the matrix is invertible
          if (this.determinant() === 0) {
              throw new Error(
                  "System has no solution or an infinite number of solutions"
              );
          }

          // Calculate the inverse of the matrix
          const inverse = this.inverse();

          // Multiply the inverse by the right-hand side to get the solution
          const solution = inverse.multiply(rhs);

          return solution;
      }

      equals(other) {
          if (
              this.items.length !== other.items.length ||
              this.items[0].length !== other.items[0].length
          ) {
              return false;
          }
          return this.items.every((row, i) =>
              row.every((value, j) => value === other.items[i][j])
          );
      }

      isSymmetric() {
          if (!this.isSquare()) {
              throw new Error("Matrix must be square to check symmetry");
          }
          return this.equals(this.transpose());
      }

      isSkewSymmetric() {
          // Check if the matrix is square
          if (!this.isSquare()) {
              return false;
          }

          // Check if the matrix is equal to the negation of its transpose
          const transpose = this.transpose();
          const skewSymmetric = this.items.every((row, i) =>
              row.every((value, j) => value === -transpose.items[i][j])
          );
          return skewSymmetric;
      }

      isOrthogonal() {
          // Check if the matrix is square
          if (!this.isSquare()) {
              return false;
          }

          // Check if the determinant of the matrix is 1 or -1
          if (this.determinant() !== 1 && this.determinant() !== -1) {
              return false;
          }

          // Check if the columns of the matrix are mutually orthonormal
          for (let i = 0; i < this.items[0].length; i++) {
              for (let j = 0; j < this.items[0].length; j++) {
                  if (i !== j) {
                      const columnI = new Matrix([
                          this.items.map((row) => row[i]),
                      ]);
                      const columnJ = new Matrix([
                          this.items.map((row) => row[j]),
                      ]);
                      if (
                          columnI.transpose().multiply(columnJ).determinant() !==
                          0
                      ) {
                          return false;
                      }
                  }
              }
          }

          return true;
      }

      toString() {
          return `{${this.items.join(", ")}}`;
      }
  }

  assert$1.deepStrictEqual(new Matrix([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
  ]).items, [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
  ]);

  assert$1.notDeepStrictEqual(new Matrix([
      [1, 2, 3],
      [4, 5]
  ]), [
      [1, 2, 3],
      [4, 5, 0],
  ]);

  assert$1.deepStrictEqual(new Matrix([
      [1, 2, 3],
      [4, 5, 6]]
  ).items, [
      [1, 2, 3],
      [4, 5, 6],
  ]);

  try {
      new Matrix([
          [1, 2, 3],
          [4, "a", 6],
      ]);
  } catch (error) {
      assert$1.strictEqual(error.message, "Matrix must contain only numeric values");
  }


  /*

  TODO: implement the following statistical functions for the matrix class

  1. mean
  2. median
  3. mode
  4. variance
  5. standardDeviation
  6. covariance
  7. correlation
  8. percentile
  9. zScore
  10. tTest
  11. anova

  */

  let constants = {
      pi: new Fraction(355, 113),
      e: new Fraction(Math.E),
      pretty_printing: false
  };

  registerNativeConstants(constants);

  let general = {
      print: (...xs) => {
          log(xs
              .map(x => x.toString())
              .join(" "));
          return true;
      },
      sgn: (num) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          num = num.evaluate();
          return num === 0 ? new Fraction(0) : new Fraction(Math.sign(num));
      },
      floor: (num) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          num = num.evaluate();
          return new Fraction(Math.floor(num));
      },
      ceil: (num) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          num = num.evaluate();
          return new Fraction(Math.ceil(num));
      },
      round: (num) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          num = num.evaluate();
          return new Fraction(Math.round(num));
      },
      ln: (num) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          return new Fraction(Math.log(num.evaluate()));
      },
      log: (num, base = 10) => {
          if (!((num instanceof Fraction) && (base === 10 || base instanceof Fraction))) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          num = num.evaluate();
          return new Fraction(Math.log(num) / (base === 10 ? Math.log(10) : Math.log(base.evaluate())));
      },
      max: (num1, ...rest) => {
          if (!(num1 instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }

          let max = num1.evaluate();
          for (let elem in rest) {
              if (!(elem instanceof Fraction)) {
                  throw new TypeError('Function only supports numeric type (Fraction)');
              }
              max = (elem.evaluate() > max ? elem.evaluate() : max);
          }
          return new Fraction(max);
      },
      min: (num1, ...rest) => {
          if (!(num1 instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }

          let min = num1.evaluate();
          for (let elem in rest) {
              if (!(elem instanceof Fraction)) {
                  throw new TypeError('Function only supports numeric type (Fraction)');
              }
              min = (elem.evaluate() < min ? elem.evaluate() : min);
          }
          return new Fraction(min);
      },
      mod: (number, divisor) => {
          if (!(number instanceof Fraction && divisor instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          number = number.evaluate();
          divisor = divisor.evaluate();
          return new Fraction(number % divisor);
      },
      sqrt: (number) => {
          if (!(number instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          number = number.evaluate();
          return new Fraction(Math.sqrt(number));
      },
      root: (number, n) => {
          if (!(number instanceof Fraction && n instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          number = number.evaluate();
          n = n.evaluate();

          return new Fraction(Math.pow(number, 1 / n));
      },
      exp: (number, n = Math.E) => {
          if (!(number instanceof Fraction && (n instanceof Fraction || n === Math.E))) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          number = number.evaluate();
          n = (n === Math.E ? Math.E : n.evaluate());
          return new Fraction(Math.pow(n, number))
      },
      det: (matrix) => {
          if (!(matrix instanceof Matrix)) {
              throw new TypeError('Function only supports matrices');
          }
          return new Fraction(matrix.determinant())
      },
      gcd: (num1, num2) => {
          if (!(num1 instanceof Fraction && num2 instanceof Fraction)) {
              throw new TypeError('Function only supports matrices');
          }
          let x = Math.abs(num1.evaluate());
          let y = Math.abs(num2.evaluate());

          while (y) {
              let t = y;
              y = x % y;
              x = t;
          }

          return new Fraction(x)
      },
      lcm: (num1, num2) => {
          let gcd = general.gcd(num1, num2);
          return new Fraction((num1.evaluate() * num2.evaluate()) / gcd);
      },
      sum: (num1, ...rest) => {
          if (!(num1 instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let sum = num1.evaluate();
          for (let elem in rest) {
              if (!(elem instanceof Fraction)) {
                  throw new TypeError('Function only supports numeric type (Fraction)');
              }
              sum = sum + elem.evaluate();
          }
          return new Fraction(sum);
      },
      discriminant: (a, b, c) => {
          if (!(a instanceof Fraction && b instanceof Fraction && c instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          a = a.evaluate();
          b = b.evaluate();
          c = c.evaluate();
          return new Fraction((b ^ 2) - (4 * a * c));
      },
      poly2: (a, b, c) => {
          let D = general.D(a, b, c).evaluate();
          a = a.evaluate();
          b = b.evaluate();
          c = c.evaluate();

          if (D < 0) {
              throw new Error("Discriminant value below 0")
          } else if (D === 0) {
              return new Fraction((-b) / (2 * a))
          } else {
              let sqrtD = Math.sqrt(D);
              return new Collection([(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)])
          }
      },
      abs: (elem) => {
          if (elem instanceof Fraction) {
              return elem.abs();
          } else if (elem instanceof Collection) {
              return new Fraction(elem.length());
          } else if (elem instanceof Complex) {
              return new Fraction(elem.length())
          } else {
              throw new TypeError('Function does not support provided type');
          }
      }
  };

  registerNativeFns(general);

  /*!
   * @kurkle/color v0.3.2
   * https://github.com/kurkle/color#readme
   * (c) 2023 Jukka Kurkela
   * Released under the MIT License
   */
  function round(v) {
    return v + 0.5 | 0;
  }
  const lim = (v, l, h) => Math.max(Math.min(v, h), l);
  function p2b(v) {
    return lim(round(v * 2.55), 0, 255);
  }
  function n2b(v) {
    return lim(round(v * 255), 0, 255);
  }
  function b2n(v) {
    return lim(round(v / 2.55) / 100, 0, 1);
  }
  function n2p(v) {
    return lim(round(v * 100), 0, 100);
  }

  const map$1 = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, a: 10, b: 11, c: 12, d: 13, e: 14, f: 15};
  const hex = [...'0123456789ABCDEF'];
  const h1 = b => hex[b & 0xF];
  const h2 = b => hex[(b & 0xF0) >> 4] + hex[b & 0xF];
  const eq = b => ((b & 0xF0) >> 4) === (b & 0xF);
  const isShort = v => eq(v.r) && eq(v.g) && eq(v.b) && eq(v.a);
  function hexParse(str) {
    var len = str.length;
    var ret;
    if (str[0] === '#') {
      if (len === 4 || len === 5) {
        ret = {
          r: 255 & map$1[str[1]] * 17,
          g: 255 & map$1[str[2]] * 17,
          b: 255 & map$1[str[3]] * 17,
          a: len === 5 ? map$1[str[4]] * 17 : 255
        };
      } else if (len === 7 || len === 9) {
        ret = {
          r: map$1[str[1]] << 4 | map$1[str[2]],
          g: map$1[str[3]] << 4 | map$1[str[4]],
          b: map$1[str[5]] << 4 | map$1[str[6]],
          a: len === 9 ? (map$1[str[7]] << 4 | map$1[str[8]]) : 255
        };
      }
    }
    return ret;
  }
  const alpha = (a, f) => a < 255 ? f(a) : '';
  function hexString(v) {
    var f = isShort(v) ? h1 : h2;
    return v
      ? '#' + f(v.r) + f(v.g) + f(v.b) + alpha(v.a, f)
      : undefined;
  }

  const HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
  function hsl2rgbn(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return [f(0), f(8), f(4)];
  }
  function hsv2rgbn(h, s, v) {
    const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
  }
  function hwb2rgbn(h, w, b) {
    const rgb = hsl2rgbn(h, 1, 0.5);
    let i;
    if (w + b > 1) {
      i = 1 / (w + b);
      w *= i;
      b *= i;
    }
    for (i = 0; i < 3; i++) {
      rgb[i] *= 1 - w - b;
      rgb[i] += w;
    }
    return rgb;
  }
  function hueValue(r, g, b, d, max) {
    if (r === max) {
      return ((g - b) / d) + (g < b ? 6 : 0);
    }
    if (g === max) {
      return (b - r) / d + 2;
    }
    return (r - g) / d + 4;
  }
  function rgb2hsl(v) {
    const range = 255;
    const r = v.r / range;
    const g = v.g / range;
    const b = v.b / range;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h, s, d;
    if (max !== min) {
      d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = hueValue(r, g, b, d, max);
      h = h * 60 + 0.5;
    }
    return [h | 0, s || 0, l];
  }
  function calln(f, a, b, c) {
    return (
      Array.isArray(a)
        ? f(a[0], a[1], a[2])
        : f(a, b, c)
    ).map(n2b);
  }
  function hsl2rgb(h, s, l) {
    return calln(hsl2rgbn, h, s, l);
  }
  function hwb2rgb(h, w, b) {
    return calln(hwb2rgbn, h, w, b);
  }
  function hsv2rgb(h, s, v) {
    return calln(hsv2rgbn, h, s, v);
  }
  function hue(h) {
    return (h % 360 + 360) % 360;
  }
  function hueParse(str) {
    const m = HUE_RE.exec(str);
    let a = 255;
    let v;
    if (!m) {
      return;
    }
    if (m[5] !== v) {
      a = m[6] ? p2b(+m[5]) : n2b(+m[5]);
    }
    const h = hue(+m[2]);
    const p1 = +m[3] / 100;
    const p2 = +m[4] / 100;
    if (m[1] === 'hwb') {
      v = hwb2rgb(h, p1, p2);
    } else if (m[1] === 'hsv') {
      v = hsv2rgb(h, p1, p2);
    } else {
      v = hsl2rgb(h, p1, p2);
    }
    return {
      r: v[0],
      g: v[1],
      b: v[2],
      a: a
    };
  }
  function rotate(v, deg) {
    var h = rgb2hsl(v);
    h[0] = hue(h[0] + deg);
    h = hsl2rgb(h);
    v.r = h[0];
    v.g = h[1];
    v.b = h[2];
  }
  function hslString(v) {
    if (!v) {
      return;
    }
    const a = rgb2hsl(v);
    const h = a[0];
    const s = n2p(a[1]);
    const l = n2p(a[2]);
    return v.a < 255
      ? `hsla(${h}, ${s}%, ${l}%, ${b2n(v.a)})`
      : `hsl(${h}, ${s}%, ${l}%)`;
  }

  const map$2 = {
    x: 'dark',
    Z: 'light',
    Y: 're',
    X: 'blu',
    W: 'gr',
    V: 'medium',
    U: 'slate',
    A: 'ee',
    T: 'ol',
    S: 'or',
    B: 'ra',
    C: 'lateg',
    D: 'ights',
    R: 'in',
    Q: 'turquois',
    E: 'hi',
    P: 'ro',
    O: 'al',
    N: 'le',
    M: 'de',
    L: 'yello',
    F: 'en',
    K: 'ch',
    G: 'arks',
    H: 'ea',
    I: 'ightg',
    J: 'wh'
  };
  const names$1 = {
    OiceXe: 'f0f8ff',
    antiquewEte: 'faebd7',
    aqua: 'ffff',
    aquamarRe: '7fffd4',
    azuY: 'f0ffff',
    beige: 'f5f5dc',
    bisque: 'ffe4c4',
    black: '0',
    blanKedOmond: 'ffebcd',
    Xe: 'ff',
    XeviTet: '8a2be2',
    bPwn: 'a52a2a',
    burlywood: 'deb887',
    caMtXe: '5f9ea0',
    KartYuse: '7fff00',
    KocTate: 'd2691e',
    cSO: 'ff7f50',
    cSnflowerXe: '6495ed',
    cSnsilk: 'fff8dc',
    crimson: 'dc143c',
    cyan: 'ffff',
    xXe: '8b',
    xcyan: '8b8b',
    xgTMnPd: 'b8860b',
    xWay: 'a9a9a9',
    xgYF: '6400',
    xgYy: 'a9a9a9',
    xkhaki: 'bdb76b',
    xmagFta: '8b008b',
    xTivegYF: '556b2f',
    xSange: 'ff8c00',
    xScEd: '9932cc',
    xYd: '8b0000',
    xsOmon: 'e9967a',
    xsHgYF: '8fbc8f',
    xUXe: '483d8b',
    xUWay: '2f4f4f',
    xUgYy: '2f4f4f',
    xQe: 'ced1',
    xviTet: '9400d3',
    dAppRk: 'ff1493',
    dApskyXe: 'bfff',
    dimWay: '696969',
    dimgYy: '696969',
    dodgerXe: '1e90ff',
    fiYbrick: 'b22222',
    flSOwEte: 'fffaf0',
    foYstWAn: '228b22',
    fuKsia: 'ff00ff',
    gaRsbSo: 'dcdcdc',
    ghostwEte: 'f8f8ff',
    gTd: 'ffd700',
    gTMnPd: 'daa520',
    Way: '808080',
    gYF: '8000',
    gYFLw: 'adff2f',
    gYy: '808080',
    honeyMw: 'f0fff0',
    hotpRk: 'ff69b4',
    RdianYd: 'cd5c5c',
    Rdigo: '4b0082',
    ivSy: 'fffff0',
    khaki: 'f0e68c',
    lavFMr: 'e6e6fa',
    lavFMrXsh: 'fff0f5',
    lawngYF: '7cfc00',
    NmoncEffon: 'fffacd',
    ZXe: 'add8e6',
    ZcSO: 'f08080',
    Zcyan: 'e0ffff',
    ZgTMnPdLw: 'fafad2',
    ZWay: 'd3d3d3',
    ZgYF: '90ee90',
    ZgYy: 'd3d3d3',
    ZpRk: 'ffb6c1',
    ZsOmon: 'ffa07a',
    ZsHgYF: '20b2aa',
    ZskyXe: '87cefa',
    ZUWay: '778899',
    ZUgYy: '778899',
    ZstAlXe: 'b0c4de',
    ZLw: 'ffffe0',
    lime: 'ff00',
    limegYF: '32cd32',
    lRF: 'faf0e6',
    magFta: 'ff00ff',
    maPon: '800000',
    VaquamarRe: '66cdaa',
    VXe: 'cd',
    VScEd: 'ba55d3',
    VpurpN: '9370db',
    VsHgYF: '3cb371',
    VUXe: '7b68ee',
    VsprRggYF: 'fa9a',
    VQe: '48d1cc',
    VviTetYd: 'c71585',
    midnightXe: '191970',
    mRtcYam: 'f5fffa',
    mistyPse: 'ffe4e1',
    moccasR: 'ffe4b5',
    navajowEte: 'ffdead',
    navy: '80',
    Tdlace: 'fdf5e6',
    Tive: '808000',
    TivedBb: '6b8e23',
    Sange: 'ffa500',
    SangeYd: 'ff4500',
    ScEd: 'da70d6',
    pOegTMnPd: 'eee8aa',
    pOegYF: '98fb98',
    pOeQe: 'afeeee',
    pOeviTetYd: 'db7093',
    papayawEp: 'ffefd5',
    pHKpuff: 'ffdab9',
    peru: 'cd853f',
    pRk: 'ffc0cb',
    plum: 'dda0dd',
    powMrXe: 'b0e0e6',
    purpN: '800080',
    YbeccapurpN: '663399',
    Yd: 'ff0000',
    Psybrown: 'bc8f8f',
    PyOXe: '4169e1',
    saddNbPwn: '8b4513',
    sOmon: 'fa8072',
    sandybPwn: 'f4a460',
    sHgYF: '2e8b57',
    sHshell: 'fff5ee',
    siFna: 'a0522d',
    silver: 'c0c0c0',
    skyXe: '87ceeb',
    UXe: '6a5acd',
    UWay: '708090',
    UgYy: '708090',
    snow: 'fffafa',
    sprRggYF: 'ff7f',
    stAlXe: '4682b4',
    tan: 'd2b48c',
    teO: '8080',
    tEstN: 'd8bfd8',
    tomato: 'ff6347',
    Qe: '40e0d0',
    viTet: 'ee82ee',
    JHt: 'f5deb3',
    wEte: 'ffffff',
    wEtesmoke: 'f5f5f5',
    Lw: 'ffff00',
    LwgYF: '9acd32'
  };
  function unpack() {
    const unpacked = {};
    const keys = Object.keys(names$1);
    const tkeys = Object.keys(map$2);
    let i, j, k, ok, nk;
    for (i = 0; i < keys.length; i++) {
      ok = nk = keys[i];
      for (j = 0; j < tkeys.length; j++) {
        k = tkeys[j];
        nk = nk.replace(k, map$2[k]);
      }
      k = parseInt(names$1[ok], 16);
      unpacked[nk] = [k >> 16 & 0xFF, k >> 8 & 0xFF, k & 0xFF];
    }
    return unpacked;
  }

  let names;
  function nameParse(str) {
    if (!names) {
      names = unpack();
      names.transparent = [0, 0, 0, 0];
    }
    const a = names[str.toLowerCase()];
    return a && {
      r: a[0],
      g: a[1],
      b: a[2],
      a: a.length === 4 ? a[3] : 255
    };
  }

  const RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
  function rgbParse(str) {
    const m = RGB_RE.exec(str);
    let a = 255;
    let r, g, b;
    if (!m) {
      return;
    }
    if (m[7] !== r) {
      const v = +m[7];
      a = m[8] ? p2b(v) : lim(v * 255, 0, 255);
    }
    r = +m[1];
    g = +m[3];
    b = +m[5];
    r = 255 & (m[2] ? p2b(r) : lim(r, 0, 255));
    g = 255 & (m[4] ? p2b(g) : lim(g, 0, 255));
    b = 255 & (m[6] ? p2b(b) : lim(b, 0, 255));
    return {
      r: r,
      g: g,
      b: b,
      a: a
    };
  }
  function rgbString(v) {
    return v && (
      v.a < 255
        ? `rgba(${v.r}, ${v.g}, ${v.b}, ${b2n(v.a)})`
        : `rgb(${v.r}, ${v.g}, ${v.b})`
    );
  }

  const to = v => v <= 0.0031308 ? v * 12.92 : Math.pow(v, 1.0 / 2.4) * 1.055 - 0.055;
  const from = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  function interpolate$1(rgb1, rgb2, t) {
    const r = from(b2n(rgb1.r));
    const g = from(b2n(rgb1.g));
    const b = from(b2n(rgb1.b));
    return {
      r: n2b(to(r + t * (from(b2n(rgb2.r)) - r))),
      g: n2b(to(g + t * (from(b2n(rgb2.g)) - g))),
      b: n2b(to(b + t * (from(b2n(rgb2.b)) - b))),
      a: rgb1.a + t * (rgb2.a - rgb1.a)
    };
  }

  function modHSL(v, i, ratio) {
    if (v) {
      let tmp = rgb2hsl(v);
      tmp[i] = Math.max(0, Math.min(tmp[i] + tmp[i] * ratio, i === 0 ? 360 : 1));
      tmp = hsl2rgb(tmp);
      v.r = tmp[0];
      v.g = tmp[1];
      v.b = tmp[2];
    }
  }
  function clone$1(v, proto) {
    return v ? Object.assign(proto || {}, v) : v;
  }
  function fromObject(input) {
    var v = {r: 0, g: 0, b: 0, a: 255};
    if (Array.isArray(input)) {
      if (input.length >= 3) {
        v = {r: input[0], g: input[1], b: input[2], a: 255};
        if (input.length > 3) {
          v.a = n2b(input[3]);
        }
      }
    } else {
      v = clone$1(input, {r: 0, g: 0, b: 0, a: 1});
      v.a = n2b(v.a);
    }
    return v;
  }
  function functionParse(str) {
    if (str.charAt(0) === 'r') {
      return rgbParse(str);
    }
    return hueParse(str);
  }
  class Color {
    constructor(input) {
      if (input instanceof Color) {
        return input;
      }
      const type = typeof input;
      let v;
      if (type === 'object') {
        v = fromObject(input);
      } else if (type === 'string') {
        v = hexParse(input) || nameParse(input) || functionParse(input);
      }
      this._rgb = v;
      this._valid = !!v;
    }
    get valid() {
      return this._valid;
    }
    get rgb() {
      var v = clone$1(this._rgb);
      if (v) {
        v.a = b2n(v.a);
      }
      return v;
    }
    set rgb(obj) {
      this._rgb = fromObject(obj);
    }
    rgbString() {
      return this._valid ? rgbString(this._rgb) : undefined;
    }
    hexString() {
      return this._valid ? hexString(this._rgb) : undefined;
    }
    hslString() {
      return this._valid ? hslString(this._rgb) : undefined;
    }
    mix(color, weight) {
      if (color) {
        const c1 = this.rgb;
        const c2 = color.rgb;
        let w2;
        const p = weight === w2 ? 0.5 : weight;
        const w = 2 * p - 1;
        const a = c1.a - c2.a;
        const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        w2 = 1 - w1;
        c1.r = 0xFF & w1 * c1.r + w2 * c2.r + 0.5;
        c1.g = 0xFF & w1 * c1.g + w2 * c2.g + 0.5;
        c1.b = 0xFF & w1 * c1.b + w2 * c2.b + 0.5;
        c1.a = p * c1.a + (1 - p) * c2.a;
        this.rgb = c1;
      }
      return this;
    }
    interpolate(color, t) {
      if (color) {
        this._rgb = interpolate$1(this._rgb, color._rgb, t);
      }
      return this;
    }
    clone() {
      return new Color(this.rgb);
    }
    alpha(a) {
      this._rgb.a = n2b(a);
      return this;
    }
    clearer(ratio) {
      const rgb = this._rgb;
      rgb.a *= 1 - ratio;
      return this;
    }
    greyscale() {
      const rgb = this._rgb;
      const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
      rgb.r = rgb.g = rgb.b = val;
      return this;
    }
    opaquer(ratio) {
      const rgb = this._rgb;
      rgb.a *= 1 + ratio;
      return this;
    }
    negate() {
      const v = this._rgb;
      v.r = 255 - v.r;
      v.g = 255 - v.g;
      v.b = 255 - v.b;
      return this;
    }
    lighten(ratio) {
      modHSL(this._rgb, 2, ratio);
      return this;
    }
    darken(ratio) {
      modHSL(this._rgb, 2, -ratio);
      return this;
    }
    saturate(ratio) {
      modHSL(this._rgb, 1, ratio);
      return this;
    }
    desaturate(ratio) {
      modHSL(this._rgb, 1, -ratio);
      return this;
    }
    rotate(deg) {
      rotate(this._rgb, deg);
      return this;
    }
  }

  /*!
   * Chart.js v4.2.0
   * https://www.chartjs.org
   * (c) 2023 Chart.js Contributors
   * Released under the MIT License
   */

  /**
   * @namespace Chart.helpers
   */ /**
   * An empty function that can be used, for example, for optional callback.
   */ function noop() {
  /* noop */ }
  /**
   * Returns a unique id, sequentially generated from a global variable.
   */ const uid = (()=>{
      let id = 0;
      return ()=>id++;
  })();
  /**
   * Returns true if `value` is neither null nor undefined, else returns false.
   * @param value - The value to test.
   * @since 2.7.0
   */ function isNullOrUndef(value) {
      return value === null || typeof value === 'undefined';
  }
  /**
   * Returns true if `value` is an array (including typed arrays), else returns false.
   * @param value - The value to test.
   * @function
   */ function isArray(value) {
      if (Array.isArray && Array.isArray(value)) {
          return true;
      }
      const type = Object.prototype.toString.call(value);
      if (type.slice(0, 7) === '[object' && type.slice(-6) === 'Array]') {
          return true;
      }
      return false;
  }
  /**
   * Returns true if `value` is an object (excluding null), else returns false.
   * @param value - The value to test.
   * @since 2.7.0
   */ function isObject(value) {
      return value !== null && Object.prototype.toString.call(value) === '[object Object]';
  }
  /**
   * Returns true if `value` is a finite number, else returns false
   * @param value  - The value to test.
   */ function isNumberFinite(value) {
      return (typeof value === 'number' || value instanceof Number) && isFinite(+value);
  }
  /**
   * Returns `value` if finite, else returns `defaultValue`.
   * @param value - The value to return if defined.
   * @param defaultValue - The value to return if `value` is not finite.
   */ function finiteOrDefault(value, defaultValue) {
      return isNumberFinite(value) ? value : defaultValue;
  }
  /**
   * Returns `value` if defined, else returns `defaultValue`.
   * @param value - The value to return if defined.
   * @param defaultValue - The value to return if `value` is undefined.
   */ function valueOrDefault(value, defaultValue) {
      return typeof value === 'undefined' ? defaultValue : value;
  }
  const toPercentage = (value, dimension)=>typeof value === 'string' && value.endsWith('%') ? parseFloat(value) / 100 : +value / dimension;
  const toDimension = (value, dimension)=>typeof value === 'string' && value.endsWith('%') ? parseFloat(value) / 100 * dimension : +value;
  /**
   * Calls `fn` with the given `args` in the scope defined by `thisArg` and returns the
   * value returned by `fn`. If `fn` is not a function, this method returns undefined.
   * @param fn - The function to call.
   * @param args - The arguments with which `fn` should be called.
   * @param [thisArg] - The value of `this` provided for the call to `fn`.
   */ function callback(fn, args, thisArg) {
      if (fn && typeof fn.call === 'function') {
          return fn.apply(thisArg, args);
      }
  }
  function each(loopable, fn, thisArg, reverse) {
      let i, len, keys;
      if (isArray(loopable)) {
          len = loopable.length;
          if (reverse) {
              for(i = len - 1; i >= 0; i--){
                  fn.call(thisArg, loopable[i], i);
              }
          } else {
              for(i = 0; i < len; i++){
                  fn.call(thisArg, loopable[i], i);
              }
          }
      } else if (isObject(loopable)) {
          keys = Object.keys(loopable);
          len = keys.length;
          for(i = 0; i < len; i++){
              fn.call(thisArg, loopable[keys[i]], keys[i]);
          }
      }
  }
  /**
   * Returns true if the `a0` and `a1` arrays have the same content, else returns false.
   * @param a0 - The array to compare
   * @param a1 - The array to compare
   * @private
   */ function _elementsEqual(a0, a1) {
      let i, ilen, v0, v1;
      if (!a0 || !a1 || a0.length !== a1.length) {
          return false;
      }
      for(i = 0, ilen = a0.length; i < ilen; ++i){
          v0 = a0[i];
          v1 = a1[i];
          if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
              return false;
          }
      }
      return true;
  }
  /**
   * Returns a deep copy of `source` without keeping references on objects and arrays.
   * @param source - The value to clone.
   */ function clone(source) {
      if (isArray(source)) {
          return source.map(clone);
      }
      if (isObject(source)) {
          const target = Object.create(null);
          const keys = Object.keys(source);
          const klen = keys.length;
          let k = 0;
          for(; k < klen; ++k){
              target[keys[k]] = clone(source[keys[k]]);
          }
          return target;
      }
      return source;
  }
  function isValidKey(key) {
      return [
          '__proto__',
          'prototype',
          'constructor'
      ].indexOf(key) === -1;
  }
  /**
   * The default merger when Chart.helpers.merge is called without merger option.
   * Note(SB): also used by mergeConfig and mergeScaleConfig as fallback.
   * @private
   */ function _merger(key, target, source, options) {
      if (!isValidKey(key)) {
          return;
      }
      const tval = target[key];
      const sval = source[key];
      if (isObject(tval) && isObject(sval)) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          merge(tval, sval, options);
      } else {
          target[key] = clone(sval);
      }
  }
  function merge(target, source, options) {
      const sources = isArray(source) ? source : [
          source
      ];
      const ilen = sources.length;
      if (!isObject(target)) {
          return target;
      }
      options = options || {};
      const merger = options.merger || _merger;
      let current;
      for(let i = 0; i < ilen; ++i){
          current = sources[i];
          if (!isObject(current)) {
              continue;
          }
          const keys = Object.keys(current);
          for(let k = 0, klen = keys.length; k < klen; ++k){
              merger(keys[k], target, current, options);
          }
      }
      return target;
  }
  function mergeIf(target, source) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return merge(target, source, {
          merger: _mergerIf
      });
  }
  /**
   * Merges source[key] in target[key] only if target[key] is undefined.
   * @private
   */ function _mergerIf(key, target, source) {
      if (!isValidKey(key)) {
          return;
      }
      const tval = target[key];
      const sval = source[key];
      if (isObject(tval) && isObject(sval)) {
          mergeIf(tval, sval);
      } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
          target[key] = clone(sval);
      }
  }
  // resolveObjectKey resolver cache
  const keyResolvers = {
      // Chart.helpers.core resolveObjectKey should resolve empty key to root object
      '': (v)=>v,
      // default resolvers
      x: (o)=>o.x,
      y: (o)=>o.y
  };
  /**
   * @private
   */ function _splitKey(key) {
      const parts = key.split('.');
      const keys = [];
      let tmp = '';
      for (const part of parts){
          tmp += part;
          if (tmp.endsWith('\\')) {
              tmp = tmp.slice(0, -1) + '.';
          } else {
              keys.push(tmp);
              tmp = '';
          }
      }
      return keys;
  }
  function _getKeyResolver(key) {
      const keys = _splitKey(key);
      return (obj)=>{
          for (const k of keys){
              if (k === '') {
                  break;
              }
              obj = obj && obj[k];
          }
          return obj;
      };
  }
  function resolveObjectKey(obj, key) {
      const resolver = keyResolvers[key] || (keyResolvers[key] = _getKeyResolver(key));
      return resolver(obj);
  }
  /**
   * @private
   */ function _capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
  }
  const defined = (value)=>typeof value !== 'undefined';
  const isFunction = (value)=>typeof value === 'function';
  // Adapted from https://stackoverflow.com/questions/31128855/comparing-ecma6-sets-for-equality#31129384
  const setsEqual = (a, b)=>{
      if (a.size !== b.size) {
          return false;
      }
      for (const item of a){
          if (!b.has(item)) {
              return false;
          }
      }
      return true;
  };
  /**
   * @param e - The event
   * @private
   */ function _isClickEvent(e) {
      return e.type === 'mouseup' || e.type === 'click' || e.type === 'contextmenu';
  }

  /**
   * @alias Chart.helpers.math
   * @namespace
   */ const PI = Math.PI;
  const TAU = 2 * PI;
  const PITAU = TAU + PI;
  const INFINITY = Number.POSITIVE_INFINITY;
  const RAD_PER_DEG = PI / 180;
  const HALF_PI = PI / 2;
  const QUARTER_PI = PI / 4;
  const TWO_THIRDS_PI = PI * 2 / 3;
  const log10 = Math.log10;
  const sign = Math.sign;
  function almostEquals(x, y, epsilon) {
      return Math.abs(x - y) < epsilon;
  }
  /**
   * Implementation of the nice number algorithm used in determining where axis labels will go
   */ function niceNum(range) {
      const roundedRange = Math.round(range);
      range = almostEquals(range, roundedRange, range / 1000) ? roundedRange : range;
      const niceRange = Math.pow(10, Math.floor(log10(range)));
      const fraction = range / niceRange;
      const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
      return niceFraction * niceRange;
  }
  /**
   * Returns an array of factors sorted from 1 to sqrt(value)
   * @private
   */ function _factorize(value) {
      const result = [];
      const sqrt = Math.sqrt(value);
      let i;
      for(i = 1; i < sqrt; i++){
          if (value % i === 0) {
              result.push(i);
              result.push(value / i);
          }
      }
      if (sqrt === (sqrt | 0)) {
          result.push(sqrt);
      }
      result.sort((a, b)=>a - b).pop();
      return result;
  }
  function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
  }
  function almostWhole(x, epsilon) {
      const rounded = Math.round(x);
      return rounded - epsilon <= x && rounded + epsilon >= x;
  }
  /**
   * @private
   */ function _setMinAndMaxByKey(array, target, property) {
      let i, ilen, value;
      for(i = 0, ilen = array.length; i < ilen; i++){
          value = array[i][property];
          if (!isNaN(value)) {
              target.min = Math.min(target.min, value);
              target.max = Math.max(target.max, value);
          }
      }
  }
  function toRadians(degrees) {
      return degrees * (PI / 180);
  }
  function toDegrees(radians) {
      return radians * (180 / PI);
  }
  /**
   * Returns the number of decimal places
   * i.e. the number of digits after the decimal point, of the value of this Number.
   * @param x - A number.
   * @returns The number of decimal places.
   * @private
   */ function _decimalPlaces(x) {
      if (!isNumberFinite(x)) {
          return;
      }
      let e = 1;
      let p = 0;
      while(Math.round(x * e) / e !== x){
          e *= 10;
          p++;
      }
      return p;
  }
  // Gets the angle from vertical upright to the point about a centre.
  function getAngleFromPoint(centrePoint, anglePoint) {
      const distanceFromXCenter = anglePoint.x - centrePoint.x;
      const distanceFromYCenter = anglePoint.y - centrePoint.y;
      const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
      let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
      if (angle < -0.5 * PI) {
          angle += TAU; // make sure the returned angle is in the range of (-PI/2, 3PI/2]
      }
      return {
          angle,
          distance: radialDistanceFromCenter
      };
  }
  function distanceBetweenPoints(pt1, pt2) {
      return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
  }
  /**
   * Shortest distance between angles, in either direction.
   * @private
   */ function _angleDiff(a, b) {
      return (a - b + PITAU) % TAU - PI;
  }
  /**
   * Normalize angle to be between 0 and 2*PI
   * @private
   */ function _normalizeAngle(a) {
      return (a % TAU + TAU) % TAU;
  }
  /**
   * @private
   */ function _angleBetween(angle, start, end, sameAngleIsFullCircle) {
      const a = _normalizeAngle(angle);
      const s = _normalizeAngle(start);
      const e = _normalizeAngle(end);
      const angleToStart = _normalizeAngle(s - a);
      const angleToEnd = _normalizeAngle(e - a);
      const startToAngle = _normalizeAngle(a - s);
      const endToAngle = _normalizeAngle(a - e);
      return a === s || a === e || sameAngleIsFullCircle && s === e || angleToStart > angleToEnd && startToAngle < endToAngle;
  }
  /**
   * Limit `value` between `min` and `max`
   * @param value
   * @param min
   * @param max
   * @private
   */ function _limitValue(value, min, max) {
      return Math.max(min, Math.min(max, value));
  }
  /**
   * @param {number} value
   * @private
   */ function _int16Range(value) {
      return _limitValue(value, -32768, 32767);
  }
  /**
   * @param value
   * @param start
   * @param end
   * @param [epsilon]
   * @private
   */ function _isBetween(value, start, end, epsilon = 1e-6) {
      return value >= Math.min(start, end) - epsilon && value <= Math.max(start, end) + epsilon;
  }

  function _lookup(table, value, cmp) {
      cmp = cmp || ((index)=>table[index] < value);
      let hi = table.length - 1;
      let lo = 0;
      let mid;
      while(hi - lo > 1){
          mid = lo + hi >> 1;
          if (cmp(mid)) {
              lo = mid;
          } else {
              hi = mid;
          }
      }
      return {
          lo,
          hi
      };
  }
  /**
   * Binary search
   * @param table - the table search. must be sorted!
   * @param key - property name for the value in each entry
   * @param value - value to find
   * @param last - lookup last index
   * @private
   */ const _lookupByKey = (table, key, value, last)=>_lookup(table, value, last ? (index)=>{
          const ti = table[index][key];
          return ti < value || ti === value && table[index + 1][key] === value;
      } : (index)=>table[index][key] < value);
  /**
   * Reverse binary search
   * @param table - the table search. must be sorted!
   * @param key - property name for the value in each entry
   * @param value - value to find
   * @private
   */ const _rlookupByKey = (table, key, value)=>_lookup(table, value, (index)=>table[index][key] >= value);
  /**
   * Return subset of `values` between `min` and `max` inclusive.
   * Values are assumed to be in sorted order.
   * @param values - sorted array of values
   * @param min - min value
   * @param max - max value
   */ function _filterBetween(values, min, max) {
      let start = 0;
      let end = values.length;
      while(start < end && values[start] < min){
          start++;
      }
      while(end > start && values[end - 1] > max){
          end--;
      }
      return start > 0 || end < values.length ? values.slice(start, end) : values;
  }
  const arrayEvents = [
      'push',
      'pop',
      'shift',
      'splice',
      'unshift'
  ];
  function listenArrayEvents(array, listener) {
      if (array._chartjs) {
          array._chartjs.listeners.push(listener);
          return;
      }
      Object.defineProperty(array, '_chartjs', {
          configurable: true,
          enumerable: false,
          value: {
              listeners: [
                  listener
              ]
          }
      });
      arrayEvents.forEach((key)=>{
          const method = '_onData' + _capitalize(key);
          const base = array[key];
          Object.defineProperty(array, key, {
              configurable: true,
              enumerable: false,
              value (...args) {
                  const res = base.apply(this, args);
                  array._chartjs.listeners.forEach((object)=>{
                      if (typeof object[method] === 'function') {
                          object[method](...args);
                      }
                  });
                  return res;
              }
          });
      });
  }
  function unlistenArrayEvents(array, listener) {
      const stub = array._chartjs;
      if (!stub) {
          return;
      }
      const listeners = stub.listeners;
      const index = listeners.indexOf(listener);
      if (index !== -1) {
          listeners.splice(index, 1);
      }
      if (listeners.length > 0) {
          return;
      }
      arrayEvents.forEach((key)=>{
          delete array[key];
      });
      delete array._chartjs;
  }
  /**
   * @param items
   */ function _arrayUnique(items) {
      const set = new Set();
      let i, ilen;
      for(i = 0, ilen = items.length; i < ilen; ++i){
          set.add(items[i]);
      }
      if (set.size === ilen) {
          return items;
      }
      return Array.from(set);
  }
  /**
  * Request animation polyfill
  */ const requestAnimFrame = function() {
      if (typeof window === 'undefined') {
          return function(callback) {
              return callback();
          };
      }
      return window.requestAnimationFrame;
  }();
  /**
   * Throttles calling `fn` once per animation frame
   * Latest arguments are used on the actual call
   */ function throttled(fn, thisArg) {
      let argsToUse = [];
      let ticking = false;
      return function(...args) {
          // Save the args for use later
          argsToUse = args;
          if (!ticking) {
              ticking = true;
              requestAnimFrame.call(window, ()=>{
                  ticking = false;
                  fn.apply(thisArg, argsToUse);
              });
          }
      };
  }
  /**
   * Debounces calling `fn` for `delay` ms
   */ function debounce(fn, delay) {
      let timeout;
      return function(...args) {
          if (delay) {
              clearTimeout(timeout);
              timeout = setTimeout(fn, delay, args);
          } else {
              fn.apply(this, args);
          }
          return delay;
      };
  }
  /**
   * Converts 'start' to 'left', 'end' to 'right' and others to 'center'
   * @private
   */ const _toLeftRightCenter = (align)=>align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
  /**
   * Returns `start`, `end` or `(start + end) / 2` depending on `align`. Defaults to `center`
   * @private
   */ const _alignStartEnd = (align, start, end)=>align === 'start' ? start : align === 'end' ? end : (start + end) / 2;
  /**
   * Returns `left`, `right` or `(left + right) / 2` depending on `align`. Defaults to `left`
   * @private
   */ const _textX = (align, left, right, rtl)=>{
      const check = rtl ? 'left' : 'right';
      return align === check ? right : align === 'center' ? (left + right) / 2 : left;
  };
  /**
   * Return start and count of visible points.
   * @private
   */ function _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled) {
      const pointCount = points.length;
      let start = 0;
      let count = pointCount;
      if (meta._sorted) {
          const { iScale , _parsed  } = meta;
          const axis = iScale.axis;
          const { min , max , minDefined , maxDefined  } = iScale.getUserBounds();
          if (minDefined) {
              start = _limitValue(Math.min(// @ts-expect-error Need to type _parsed
              _lookupByKey(_parsed, iScale.axis, min).lo, // @ts-expect-error Need to fix types on _lookupByKey
              animationsDisabled ? pointCount : _lookupByKey(points, axis, iScale.getPixelForValue(min)).lo), 0, pointCount - 1);
          }
          if (maxDefined) {
              count = _limitValue(Math.max(// @ts-expect-error Need to type _parsed
              _lookupByKey(_parsed, iScale.axis, max, true).hi + 1, // @ts-expect-error Need to fix types on _lookupByKey
              animationsDisabled ? 0 : _lookupByKey(points, axis, iScale.getPixelForValue(max), true).hi + 1), start, pointCount) - start;
          } else {
              count = pointCount - start;
          }
      }
      return {
          start,
          count
      };
  }
  /**
   * Checks if the scale ranges have changed.
   * @param {object} meta - dataset meta.
   * @returns {boolean}
   * @private
   */ function _scaleRangesChanged(meta) {
      const { xScale , yScale , _scaleRanges  } = meta;
      const newRanges = {
          xmin: xScale.min,
          xmax: xScale.max,
          ymin: yScale.min,
          ymax: yScale.max
      };
      if (!_scaleRanges) {
          meta._scaleRanges = newRanges;
          return true;
      }
      const changed = _scaleRanges.xmin !== xScale.min || _scaleRanges.xmax !== xScale.max || _scaleRanges.ymin !== yScale.min || _scaleRanges.ymax !== yScale.max;
      Object.assign(_scaleRanges, newRanges);
      return changed;
  }

  const atEdge = (t)=>t === 0 || t === 1;
  const elasticIn = (t, s, p)=>-(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
  const elasticOut = (t, s, p)=>Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
  /**
   * Easing functions adapted from Robert Penner's easing equations.
   * @namespace Chart.helpers.easing.effects
   * @see http://www.robertpenner.com/easing/
   */ const effects = {
      linear: (t)=>t,
      easeInQuad: (t)=>t * t,
      easeOutQuad: (t)=>-t * (t - 2),
      easeInOutQuad: (t)=>(t /= 0.5) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1),
      easeInCubic: (t)=>t * t * t,
      easeOutCubic: (t)=>(t -= 1) * t * t + 1,
      easeInOutCubic: (t)=>(t /= 0.5) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2),
      easeInQuart: (t)=>t * t * t * t,
      easeOutQuart: (t)=>-((t -= 1) * t * t * t - 1),
      easeInOutQuart: (t)=>(t /= 0.5) < 1 ? 0.5 * t * t * t * t : -0.5 * ((t -= 2) * t * t * t - 2),
      easeInQuint: (t)=>t * t * t * t * t,
      easeOutQuint: (t)=>(t -= 1) * t * t * t * t + 1,
      easeInOutQuint: (t)=>(t /= 0.5) < 1 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2) * t * t * t * t + 2),
      easeInSine: (t)=>-Math.cos(t * HALF_PI) + 1,
      easeOutSine: (t)=>Math.sin(t * HALF_PI),
      easeInOutSine: (t)=>-0.5 * (Math.cos(PI * t) - 1),
      easeInExpo: (t)=>t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
      easeOutExpo: (t)=>t === 1 ? 1 : -Math.pow(2, -10 * t) + 1,
      easeInOutExpo: (t)=>atEdge(t) ? t : t < 0.5 ? 0.5 * Math.pow(2, 10 * (t * 2 - 1)) : 0.5 * (-Math.pow(2, -10 * (t * 2 - 1)) + 2),
      easeInCirc: (t)=>t >= 1 ? t : -(Math.sqrt(1 - t * t) - 1),
      easeOutCirc: (t)=>Math.sqrt(1 - (t -= 1) * t),
      easeInOutCirc: (t)=>(t /= 0.5) < 1 ? -0.5 * (Math.sqrt(1 - t * t) - 1) : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
      easeInElastic: (t)=>atEdge(t) ? t : elasticIn(t, 0.075, 0.3),
      easeOutElastic: (t)=>atEdge(t) ? t : elasticOut(t, 0.075, 0.3),
      easeInOutElastic (t) {
          const s = 0.1125;
          const p = 0.45;
          return atEdge(t) ? t : t < 0.5 ? 0.5 * elasticIn(t * 2, s, p) : 0.5 + 0.5 * elasticOut(t * 2 - 1, s, p);
      },
      easeInBack (t) {
          const s = 1.70158;
          return t * t * ((s + 1) * t - s);
      },
      easeOutBack (t) {
          const s = 1.70158;
          return (t -= 1) * t * ((s + 1) * t + s) + 1;
      },
      easeInOutBack (t) {
          let s = 1.70158;
          if ((t /= 0.5) < 1) {
              return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
          }
          return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
      },
      easeInBounce: (t)=>1 - effects.easeOutBounce(1 - t),
      easeOutBounce (t) {
          const m = 7.5625;
          const d = 2.75;
          if (t < 1 / d) {
              return m * t * t;
          }
          if (t < 2 / d) {
              return m * (t -= 1.5 / d) * t + 0.75;
          }
          if (t < 2.5 / d) {
              return m * (t -= 2.25 / d) * t + 0.9375;
          }
          return m * (t -= 2.625 / d) * t + 0.984375;
      },
      easeInOutBounce: (t)=>t < 0.5 ? effects.easeInBounce(t * 2) * 0.5 : effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5
  };

  function isPatternOrGradient(value) {
      if (value && typeof value === 'object') {
          const type = value.toString();
          return type === '[object CanvasPattern]' || type === '[object CanvasGradient]';
      }
      return false;
  }
  function color(value) {
      return isPatternOrGradient(value) ? value : new Color(value);
  }
  function getHoverColor(value) {
      return isPatternOrGradient(value) ? value : new Color(value).saturate(0.5).darken(0.1).hexString();
  }

  const numbers = [
      'x',
      'y',
      'borderWidth',
      'radius',
      'tension'
  ];
  const colors = [
      'color',
      'borderColor',
      'backgroundColor'
  ];
  function applyAnimationsDefaults(defaults) {
      defaults.set('animation', {
          delay: undefined,
          duration: 1000,
          easing: 'easeOutQuart',
          fn: undefined,
          from: undefined,
          loop: undefined,
          to: undefined,
          type: undefined
      });
      defaults.describe('animation', {
          _fallback: false,
          _indexable: false,
          _scriptable: (name)=>name !== 'onProgress' && name !== 'onComplete' && name !== 'fn'
      });
      defaults.set('animations', {
          colors: {
              type: 'color',
              properties: colors
          },
          numbers: {
              type: 'number',
              properties: numbers
          }
      });
      defaults.describe('animations', {
          _fallback: 'animation'
      });
      defaults.set('transitions', {
          active: {
              animation: {
                  duration: 400
              }
          },
          resize: {
              animation: {
                  duration: 0
              }
          },
          show: {
              animations: {
                  colors: {
                      from: 'transparent'
                  },
                  visible: {
                      type: 'boolean',
                      duration: 0
                  }
              }
          },
          hide: {
              animations: {
                  colors: {
                      to: 'transparent'
                  },
                  visible: {
                      type: 'boolean',
                      easing: 'linear',
                      fn: (v)=>v | 0
                  }
              }
          }
      });
  }

  function applyLayoutsDefaults(defaults) {
      defaults.set('layout', {
          autoPadding: true,
          padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
          }
      });
  }

  const intlCache = new Map();
  function getNumberFormat(locale, options) {
      options = options || {};
      const cacheKey = locale + JSON.stringify(options);
      let formatter = intlCache.get(cacheKey);
      if (!formatter) {
          formatter = new Intl.NumberFormat(locale, options);
          intlCache.set(cacheKey, formatter);
      }
      return formatter;
  }
  function formatNumber(num, locale, options) {
      return getNumberFormat(locale, options).format(num);
  }

  const formatters = {
   values (value) {
          return isArray(value) ?  value : '' + value;
      },
   numeric (tickValue, index, ticks) {
          if (tickValue === 0) {
              return '0';
          }
          const locale = this.chart.options.locale;
          let notation;
          let delta = tickValue;
          if (ticks.length > 1) {
              const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
              if (maxTick < 1e-4 || maxTick > 1e+15) {
                  notation = 'scientific';
              }
              delta = calculateDelta(tickValue, ticks);
          }
          const logDelta = log10(Math.abs(delta));
          const numDecimal = Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
          const options = {
              notation,
              minimumFractionDigits: numDecimal,
              maximumFractionDigits: numDecimal
          };
          Object.assign(options, this.options.ticks.format);
          return formatNumber(tickValue, locale, options);
      },
   logarithmic (tickValue, index, ticks) {
          if (tickValue === 0) {
              return '0';
          }
          const remain = ticks[index].significand || tickValue / Math.pow(10, Math.floor(log10(tickValue)));
          if ([
              1,
              2,
              3,
              5,
              10,
              15
          ].includes(remain) || index > 0.8 * ticks.length) {
              return formatters.numeric.call(this, tickValue, index, ticks);
          }
          return '';
      }
  };
  function calculateDelta(tickValue, ticks) {
      let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
      if (Math.abs(delta) >= 1 && tickValue !== Math.floor(tickValue)) {
          delta = tickValue - Math.floor(tickValue);
      }
      return delta;
  }
   var Ticks = {
      formatters
  };

  function applyScaleDefaults(defaults) {
      defaults.set('scale', {
          display: true,
          offset: false,
          reverse: false,
          beginAtZero: false,
   bounds: 'ticks',
   grace: 0,
          grid: {
              display: true,
              lineWidth: 1,
              drawOnChartArea: true,
              drawTicks: true,
              tickLength: 8,
              tickWidth: (_ctx, options)=>options.lineWidth,
              tickColor: (_ctx, options)=>options.color,
              offset: false
          },
          border: {
              display: true,
              dash: [],
              dashOffset: 0.0,
              width: 1
          },
          title: {
              display: false,
              text: '',
              padding: {
                  top: 4,
                  bottom: 4
              }
          },
          ticks: {
              minRotation: 0,
              maxRotation: 50,
              mirror: false,
              textStrokeWidth: 0,
              textStrokeColor: '',
              padding: 3,
              display: true,
              autoSkip: true,
              autoSkipPadding: 3,
              labelOffset: 0,
              callback: Ticks.formatters.values,
              minor: {},
              major: {},
              align: 'center',
              crossAlign: 'near',
              showLabelBackdrop: false,
              backdropColor: 'rgba(255, 255, 255, 0.75)',
              backdropPadding: 2
          }
      });
      defaults.route('scale.ticks', 'color', '', 'color');
      defaults.route('scale.grid', 'color', '', 'borderColor');
      defaults.route('scale.border', 'color', '', 'borderColor');
      defaults.route('scale.title', 'color', '', 'color');
      defaults.describe('scale', {
          _fallback: false,
          _scriptable: (name)=>!name.startsWith('before') && !name.startsWith('after') && name !== 'callback' && name !== 'parser',
          _indexable: (name)=>name !== 'borderDash' && name !== 'tickBorderDash' && name !== 'dash'
      });
      defaults.describe('scales', {
          _fallback: 'scale'
      });
      defaults.describe('scale.ticks', {
          _scriptable: (name)=>name !== 'backdropPadding' && name !== 'callback',
          _indexable: (name)=>name !== 'backdropPadding'
      });
  }

  const overrides = Object.create(null);
  const descriptors = Object.create(null);
   function getScope$1(node, key) {
      if (!key) {
          return node;
      }
      const keys = key.split('.');
      for(let i = 0, n = keys.length; i < n; ++i){
          const k = keys[i];
          node = node[k] || (node[k] = Object.create(null));
      }
      return node;
  }
  function set(root, scope, values) {
      if (typeof scope === 'string') {
          return merge(getScope$1(root, scope), values);
      }
      return merge(getScope$1(root, ''), scope);
  }
   class Defaults {
      constructor(_descriptors, _appliers){
          this.animation = undefined;
          this.backgroundColor = 'rgba(0,0,0,0.1)';
          this.borderColor = 'rgba(0,0,0,0.1)';
          this.color = '#666';
          this.datasets = {};
          this.devicePixelRatio = (context)=>context.chart.platform.getDevicePixelRatio();
          this.elements = {};
          this.events = [
              'mousemove',
              'mouseout',
              'click',
              'touchstart',
              'touchmove'
          ];
          this.font = {
              family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              size: 12,
              style: 'normal',
              lineHeight: 1.2,
              weight: null
          };
          this.hover = {};
          this.hoverBackgroundColor = (ctx, options)=>getHoverColor(options.backgroundColor);
          this.hoverBorderColor = (ctx, options)=>getHoverColor(options.borderColor);
          this.hoverColor = (ctx, options)=>getHoverColor(options.color);
          this.indexAxis = 'x';
          this.interaction = {
              mode: 'nearest',
              intersect: true,
              includeInvisible: false
          };
          this.maintainAspectRatio = true;
          this.onHover = null;
          this.onClick = null;
          this.parsing = true;
          this.plugins = {};
          this.responsive = true;
          this.scale = undefined;
          this.scales = {};
          this.showLine = true;
          this.drawActiveElementsOnTop = true;
          this.describe(_descriptors);
          this.apply(_appliers);
      }
   set(scope, values) {
          return set(this, scope, values);
      }
   get(scope) {
          return getScope$1(this, scope);
      }
   describe(scope, values) {
          return set(descriptors, scope, values);
      }
      override(scope, values) {
          return set(overrides, scope, values);
      }
   route(scope, name, targetScope, targetName) {
          const scopeObject = getScope$1(this, scope);
          const targetScopeObject = getScope$1(this, targetScope);
          const privateName = '_' + name;
          Object.defineProperties(scopeObject, {
              [privateName]: {
                  value: scopeObject[name],
                  writable: true
              },
              [name]: {
                  enumerable: true,
                  get () {
                      const local = this[privateName];
                      const target = targetScopeObject[targetName];
                      if (isObject(local)) {
                          return Object.assign({}, target, local);
                      }
                      return valueOrDefault(local, target);
                  },
                  set (value) {
                      this[privateName] = value;
                  }
              }
          });
      }
      apply(appliers) {
          appliers.forEach((apply)=>apply(this));
      }
  }
  var defaults = /* #__PURE__ */ new Defaults({
      _scriptable: (name)=>!name.startsWith('on'),
      _indexable: (name)=>name !== 'events',
      hover: {
          _fallback: 'interaction'
      },
      interaction: {
          _scriptable: false,
          _indexable: false
      }
  }, [
      applyAnimationsDefaults,
      applyLayoutsDefaults,
      applyScaleDefaults
  ]);

  function toFontString(font) {
      if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
          return null;
      }
      return (font.style ? font.style + ' ' : '') + (font.weight ? font.weight + ' ' : '') + font.size + 'px ' + font.family;
  }
   function _measureText(ctx, data, gc, longest, string) {
      let textWidth = data[string];
      if (!textWidth) {
          textWidth = data[string] = ctx.measureText(string).width;
          gc.push(string);
      }
      if (textWidth > longest) {
          longest = textWidth;
      }
      return longest;
  }
   function _longestText(ctx, font, arrayOfThings, cache) {
      cache = cache || {};
      let data = cache.data = cache.data || {};
      let gc = cache.garbageCollect = cache.garbageCollect || [];
      if (cache.font !== font) {
          data = cache.data = {};
          gc = cache.garbageCollect = [];
          cache.font = font;
      }
      ctx.save();
      ctx.font = font;
      let longest = 0;
      const ilen = arrayOfThings.length;
      let i, j, jlen, thing, nestedThing;
      for(i = 0; i < ilen; i++){
          thing = arrayOfThings[i];
          if (thing !== undefined && thing !== null && isArray(thing) !== true) {
              longest = _measureText(ctx, data, gc, longest, thing);
          } else if (isArray(thing)) {
              for(j = 0, jlen = thing.length; j < jlen; j++){
                  nestedThing = thing[j];
                  if (nestedThing !== undefined && nestedThing !== null && !isArray(nestedThing)) {
                      longest = _measureText(ctx, data, gc, longest, nestedThing);
                  }
              }
          }
      }
      ctx.restore();
      const gcLen = gc.length / 2;
      if (gcLen > arrayOfThings.length) {
          for(i = 0; i < gcLen; i++){
              delete data[gc[i]];
          }
          gc.splice(0, gcLen);
      }
      return longest;
  }
   function _alignPixel(chart, pixel, width) {
      const devicePixelRatio = chart.currentDevicePixelRatio;
      const halfWidth = width !== 0 ? Math.max(width / 2, 0.5) : 0;
      return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
  }
   function clearCanvas(canvas, ctx) {
      ctx = ctx || canvas.getContext('2d');
      ctx.save();
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
  }
  function drawPoint(ctx, options, x, y) {
      drawPointLegend(ctx, options, x, y, null);
  }
  function drawPointLegend(ctx, options, x, y, w) {
      let type, xOffset, yOffset, size, cornerRadius, width, xOffsetW, yOffsetW;
      const style = options.pointStyle;
      const rotation = options.rotation;
      const radius = options.radius;
      let rad = (rotation || 0) * RAD_PER_DEG;
      if (style && typeof style === 'object') {
          type = style.toString();
          if (type === '[object HTMLImageElement]' || type === '[object HTMLCanvasElement]') {
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(rad);
              ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
              ctx.restore();
              return;
          }
      }
      if (isNaN(radius) || radius <= 0) {
          return;
      }
      ctx.beginPath();
      switch(style){
          default:
              if (w) {
                  ctx.ellipse(x, y, w / 2, radius, 0, 0, TAU);
              } else {
                  ctx.arc(x, y, radius, 0, TAU);
              }
              ctx.closePath();
              break;
          case 'triangle':
              width = w ? w / 2 : radius;
              ctx.moveTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
              rad += TWO_THIRDS_PI;
              ctx.lineTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
              rad += TWO_THIRDS_PI;
              ctx.lineTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
              ctx.closePath();
              break;
          case 'rectRounded':
              cornerRadius = radius * 0.516;
              size = radius - cornerRadius;
              xOffset = Math.cos(rad + QUARTER_PI) * size;
              xOffsetW = Math.cos(rad + QUARTER_PI) * (w ? w / 2 - cornerRadius : size);
              yOffset = Math.sin(rad + QUARTER_PI) * size;
              yOffsetW = Math.sin(rad + QUARTER_PI) * (w ? w / 2 - cornerRadius : size);
              ctx.arc(x - xOffsetW, y - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
              ctx.arc(x + yOffsetW, y - xOffset, cornerRadius, rad - HALF_PI, rad);
              ctx.arc(x + xOffsetW, y + yOffset, cornerRadius, rad, rad + HALF_PI);
              ctx.arc(x - yOffsetW, y + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
              ctx.closePath();
              break;
          case 'rect':
              if (!rotation) {
                  size = Math.SQRT1_2 * radius;
                  width = w ? w / 2 : size;
                  ctx.rect(x - width, y - size, 2 * width, 2 * size);
                  break;
              }
              rad += QUARTER_PI;
           case 'rectRot':
              xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
              xOffset = Math.cos(rad) * radius;
              yOffset = Math.sin(rad) * radius;
              yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
              ctx.moveTo(x - xOffsetW, y - yOffset);
              ctx.lineTo(x + yOffsetW, y - xOffset);
              ctx.lineTo(x + xOffsetW, y + yOffset);
              ctx.lineTo(x - yOffsetW, y + xOffset);
              ctx.closePath();
              break;
          case 'crossRot':
              rad += QUARTER_PI;
           case 'cross':
              xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
              xOffset = Math.cos(rad) * radius;
              yOffset = Math.sin(rad) * radius;
              yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
              ctx.moveTo(x - xOffsetW, y - yOffset);
              ctx.lineTo(x + xOffsetW, y + yOffset);
              ctx.moveTo(x + yOffsetW, y - xOffset);
              ctx.lineTo(x - yOffsetW, y + xOffset);
              break;
          case 'star':
              xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
              xOffset = Math.cos(rad) * radius;
              yOffset = Math.sin(rad) * radius;
              yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
              ctx.moveTo(x - xOffsetW, y - yOffset);
              ctx.lineTo(x + xOffsetW, y + yOffset);
              ctx.moveTo(x + yOffsetW, y - xOffset);
              ctx.lineTo(x - yOffsetW, y + xOffset);
              rad += QUARTER_PI;
              xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
              xOffset = Math.cos(rad) * radius;
              yOffset = Math.sin(rad) * radius;
              yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
              ctx.moveTo(x - xOffsetW, y - yOffset);
              ctx.lineTo(x + xOffsetW, y + yOffset);
              ctx.moveTo(x + yOffsetW, y - xOffset);
              ctx.lineTo(x - yOffsetW, y + xOffset);
              break;
          case 'line':
              xOffset = w ? w / 2 : Math.cos(rad) * radius;
              yOffset = Math.sin(rad) * radius;
              ctx.moveTo(x - xOffset, y - yOffset);
              ctx.lineTo(x + xOffset, y + yOffset);
              break;
          case 'dash':
              ctx.moveTo(x, y);
              ctx.lineTo(x + Math.cos(rad) * (w ? w / 2 : radius), y + Math.sin(rad) * radius);
              break;
          case false:
              ctx.closePath();
              break;
      }
      ctx.fill();
      if (options.borderWidth > 0) {
          ctx.stroke();
      }
  }
   function _isPointInArea(point, area, margin) {
      margin = margin || 0.5;
      return !area || point && point.x > area.left - margin && point.x < area.right + margin && point.y > area.top - margin && point.y < area.bottom + margin;
  }
  function clipArea(ctx, area) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
      ctx.clip();
  }
  function unclipArea(ctx) {
      ctx.restore();
  }
   function _steppedLineTo(ctx, previous, target, flip, mode) {
      if (!previous) {
          return ctx.lineTo(target.x, target.y);
      }
      if (mode === 'middle') {
          const midpoint = (previous.x + target.x) / 2.0;
          ctx.lineTo(midpoint, previous.y);
          ctx.lineTo(midpoint, target.y);
      } else if (mode === 'after' !== !!flip) {
          ctx.lineTo(previous.x, target.y);
      } else {
          ctx.lineTo(target.x, previous.y);
      }
      ctx.lineTo(target.x, target.y);
  }
   function _bezierCurveTo(ctx, previous, target, flip) {
      if (!previous) {
          return ctx.lineTo(target.x, target.y);
      }
      ctx.bezierCurveTo(flip ? previous.cp1x : previous.cp2x, flip ? previous.cp1y : previous.cp2y, flip ? target.cp2x : target.cp1x, flip ? target.cp2y : target.cp1y, target.x, target.y);
  }
   function renderText(ctx, text, x, y, font, opts = {}) {
      const lines = isArray(text) ? text : [
          text
      ];
      const stroke = opts.strokeWidth > 0 && opts.strokeColor !== '';
      let i, line;
      ctx.save();
      ctx.font = font.string;
      setRenderOpts(ctx, opts);
      for(i = 0; i < lines.length; ++i){
          line = lines[i];
          if (opts.backdrop) {
              drawBackdrop(ctx, opts.backdrop);
          }
          if (stroke) {
              if (opts.strokeColor) {
                  ctx.strokeStyle = opts.strokeColor;
              }
              if (!isNullOrUndef(opts.strokeWidth)) {
                  ctx.lineWidth = opts.strokeWidth;
              }
              ctx.strokeText(line, x, y, opts.maxWidth);
          }
          ctx.fillText(line, x, y, opts.maxWidth);
          decorateText(ctx, x, y, line, opts);
          y += font.lineHeight;
      }
      ctx.restore();
  }
  function setRenderOpts(ctx, opts) {
      if (opts.translation) {
          ctx.translate(opts.translation[0], opts.translation[1]);
      }
      if (!isNullOrUndef(opts.rotation)) {
          ctx.rotate(opts.rotation);
      }
      if (opts.color) {
          ctx.fillStyle = opts.color;
      }
      if (opts.textAlign) {
          ctx.textAlign = opts.textAlign;
      }
      if (opts.textBaseline) {
          ctx.textBaseline = opts.textBaseline;
      }
  }
  function decorateText(ctx, x, y, line, opts) {
      if (opts.strikethrough || opts.underline) {
   const metrics = ctx.measureText(line);
          const left = x - metrics.actualBoundingBoxLeft;
          const right = x + metrics.actualBoundingBoxRight;
          const top = y - metrics.actualBoundingBoxAscent;
          const bottom = y + metrics.actualBoundingBoxDescent;
          const yDecoration = opts.strikethrough ? (top + bottom) / 2 : bottom;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.beginPath();
          ctx.lineWidth = opts.decorationWidth || 2;
          ctx.moveTo(left, yDecoration);
          ctx.lineTo(right, yDecoration);
          ctx.stroke();
      }
  }
  function drawBackdrop(ctx, opts) {
      const oldColor = ctx.fillStyle;
      ctx.fillStyle = opts.color;
      ctx.fillRect(opts.left, opts.top, opts.width, opts.height);
      ctx.fillStyle = oldColor;
  }
   function addRoundedRectPath(ctx, rect) {
      const { x , y , w , h , radius  } = rect;
      ctx.arc(x + radius.topLeft, y + radius.topLeft, radius.topLeft, -HALF_PI, PI, true);
      ctx.lineTo(x, y + h - radius.bottomLeft);
      ctx.arc(x + radius.bottomLeft, y + h - radius.bottomLeft, radius.bottomLeft, PI, HALF_PI, true);
      ctx.lineTo(x + w - radius.bottomRight, y + h);
      ctx.arc(x + w - radius.bottomRight, y + h - radius.bottomRight, radius.bottomRight, HALF_PI, 0, true);
      ctx.lineTo(x + w, y + radius.topRight);
      ctx.arc(x + w - radius.topRight, y + radius.topRight, radius.topRight, 0, -HALF_PI, true);
      ctx.lineTo(x + radius.topLeft, y);
  }

  const LINE_HEIGHT = /^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/;
  const FONT_STYLE = /^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;
  /**
   * @alias Chart.helpers.options
   * @namespace
   */ /**
   * Converts the given line height `value` in pixels for a specific font `size`.
   * @param value - The lineHeight to parse (eg. 1.6, '14px', '75%', '1.6em').
   * @param size - The font size (in pixels) used to resolve relative `value`.
   * @returns The effective line height in pixels (size * 1.2 if value is invalid).
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/line-height
   * @since 2.7.0
   */ function toLineHeight(value, size) {
      const matches = ('' + value).match(LINE_HEIGHT);
      if (!matches || matches[1] === 'normal') {
          return size * 1.2;
      }
      value = +matches[2];
      switch(matches[3]){
          case 'px':
              return value;
          case '%':
              value /= 100;
              break;
      }
      return size * value;
  }
  const numberOrZero = (v)=>+v || 0;
  function _readValueToProps(value, props) {
      const ret = {};
      const objProps = isObject(props);
      const keys = objProps ? Object.keys(props) : props;
      const read = isObject(value) ? objProps ? (prop)=>valueOrDefault(value[prop], value[props[prop]]) : (prop)=>value[prop] : ()=>value;
      for (const prop of keys){
          ret[prop] = numberOrZero(read(prop));
      }
      return ret;
  }
  /**
   * Converts the given value into a TRBL object.
   * @param value - If a number, set the value to all TRBL component,
   *  else, if an object, use defined properties and sets undefined ones to 0.
   *  x / y are shorthands for same value for left/right and top/bottom.
   * @returns The padding values (top, right, bottom, left)
   * @since 3.0.0
   */ function toTRBL(value) {
      return _readValueToProps(value, {
          top: 'y',
          right: 'x',
          bottom: 'y',
          left: 'x'
      });
  }
  /**
   * Converts the given value into a TRBL corners object (similar with css border-radius).
   * @param value - If a number, set the value to all TRBL corner components,
   *  else, if an object, use defined properties and sets undefined ones to 0.
   * @returns The TRBL corner values (topLeft, topRight, bottomLeft, bottomRight)
   * @since 3.0.0
   */ function toTRBLCorners(value) {
      return _readValueToProps(value, [
          'topLeft',
          'topRight',
          'bottomLeft',
          'bottomRight'
      ]);
  }
  /**
   * Converts the given value into a padding object with pre-computed width/height.
   * @param value - If a number, set the value to all TRBL component,
   *  else, if an object, use defined properties and sets undefined ones to 0.
   *  x / y are shorthands for same value for left/right and top/bottom.
   * @returns The padding values (top, right, bottom, left, width, height)
   * @since 2.7.0
   */ function toPadding(value) {
      const obj = toTRBL(value);
      obj.width = obj.left + obj.right;
      obj.height = obj.top + obj.bottom;
      return obj;
  }
  /**
   * Parses font options and returns the font object.
   * @param options - A object that contains font options to be parsed.
   * @param fallback - A object that contains fallback font options.
   * @return The font object.
   * @private
   */ function toFont(options, fallback) {
      options = options || {};
      fallback = fallback || defaults.font;
      let size = valueOrDefault(options.size, fallback.size);
      if (typeof size === 'string') {
          size = parseInt(size, 10);
      }
      let style = valueOrDefault(options.style, fallback.style);
      if (style && !('' + style).match(FONT_STYLE)) {
          console.warn('Invalid font style specified: "' + style + '"');
          style = undefined;
      }
      const font = {
          family: valueOrDefault(options.family, fallback.family),
          lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
          size,
          style,
          weight: valueOrDefault(options.weight, fallback.weight),
          string: ''
      };
      font.string = toFontString(font);
      return font;
  }
  /**
   * Evaluates the given `inputs` sequentially and returns the first defined value.
   * @param inputs - An array of values, falling back to the last value.
   * @param context - If defined and the current value is a function, the value
   * is called with `context` as first argument and the result becomes the new input.
   * @param index - If defined and the current value is an array, the value
   * at `index` become the new input.
   * @param info - object to return information about resolution in
   * @param info.cacheable - Will be set to `false` if option is not cacheable.
   * @since 2.7.0
   */ function resolve(inputs, context, index, info) {
      let cacheable = true;
      let i, ilen, value;
      for(i = 0, ilen = inputs.length; i < ilen; ++i){
          value = inputs[i];
          if (value === undefined) {
              continue;
          }
          if (context !== undefined && typeof value === 'function') {
              value = value(context);
              cacheable = false;
          }
          if (index !== undefined && isArray(value)) {
              value = value[index % value.length];
              cacheable = false;
          }
          if (value !== undefined) {
              if (info && !cacheable) {
                  info.cacheable = false;
              }
              return value;
          }
      }
  }
  /**
   * @param minmax
   * @param grace
   * @param beginAtZero
   * @private
   */ function _addGrace(minmax, grace, beginAtZero) {
      const { min , max  } = minmax;
      const change = toDimension(grace, (max - min) / 2);
      const keepZero = (value, add)=>beginAtZero && value === 0 ? 0 : value + add;
      return {
          min: keepZero(min, -Math.abs(change)),
          max: keepZero(max, change)
      };
  }
  function createContext(parentContext, context) {
      return Object.assign(Object.create(parentContext), context);
  }

  function _createResolver(scopes, prefixes = [
      ''
  ], rootScopes = scopes, fallback, getTarget = ()=>scopes[0]) {
      if (!defined(fallback)) {
          fallback = _resolve('_fallback', scopes);
      }
      const cache = {
          [Symbol.toStringTag]: 'Object',
          _cacheable: true,
          _scopes: scopes,
          _rootScopes: rootScopes,
          _fallback: fallback,
          _getTarget: getTarget,
          override: (scope)=>_createResolver([
                  scope,
                  ...scopes
              ], prefixes, rootScopes, fallback)
      };
      return new Proxy(cache, {
   deleteProperty (target, prop) {
              delete target[prop];
              delete target._keys;
              delete scopes[0][prop];
              return true;
          },
   get (target, prop) {
              return _cached(target, prop, ()=>_resolveWithPrefixes(prop, prefixes, scopes, target));
          },
   getOwnPropertyDescriptor (target, prop) {
              return Reflect.getOwnPropertyDescriptor(target._scopes[0], prop);
          },
   getPrototypeOf () {
              return Reflect.getPrototypeOf(scopes[0]);
          },
   has (target, prop) {
              return getKeysFromAllScopes(target).includes(prop);
          },
   ownKeys (target) {
              return getKeysFromAllScopes(target);
          },
   set (target, prop, value) {
              const storage = target._storage || (target._storage = getTarget());
              target[prop] = storage[prop] = value;
              delete target._keys;
              return true;
          }
      });
  }
   function _attachContext(proxy, context, subProxy, descriptorDefaults) {
      const cache = {
          _cacheable: false,
          _proxy: proxy,
          _context: context,
          _subProxy: subProxy,
          _stack: new Set(),
          _descriptors: _descriptors(proxy, descriptorDefaults),
          setContext: (ctx)=>_attachContext(proxy, ctx, subProxy, descriptorDefaults),
          override: (scope)=>_attachContext(proxy.override(scope), context, subProxy, descriptorDefaults)
      };
      return new Proxy(cache, {
   deleteProperty (target, prop) {
              delete target[prop];
              delete proxy[prop];
              return true;
          },
   get (target, prop, receiver) {
              return _cached(target, prop, ()=>_resolveWithContext(target, prop, receiver));
          },
   getOwnPropertyDescriptor (target, prop) {
              return target._descriptors.allKeys ? Reflect.has(proxy, prop) ? {
                  enumerable: true,
                  configurable: true
              } : undefined : Reflect.getOwnPropertyDescriptor(proxy, prop);
          },
   getPrototypeOf () {
              return Reflect.getPrototypeOf(proxy);
          },
   has (target, prop) {
              return Reflect.has(proxy, prop);
          },
   ownKeys () {
              return Reflect.ownKeys(proxy);
          },
   set (target, prop, value) {
              proxy[prop] = value;
              delete target[prop];
              return true;
          }
      });
  }
   function _descriptors(proxy, defaults = {
      scriptable: true,
      indexable: true
  }) {
      const { _scriptable =defaults.scriptable , _indexable =defaults.indexable , _allKeys =defaults.allKeys  } = proxy;
      return {
          allKeys: _allKeys,
          scriptable: _scriptable,
          indexable: _indexable,
          isScriptable: isFunction(_scriptable) ? _scriptable : ()=>_scriptable,
          isIndexable: isFunction(_indexable) ? _indexable : ()=>_indexable
      };
  }
  const readKey = (prefix, name)=>prefix ? prefix + _capitalize(name) : name;
  const needsSubResolver = (prop, value)=>isObject(value) && prop !== 'adapters' && (Object.getPrototypeOf(value) === null || value.constructor === Object);
  function _cached(target, prop, resolve) {
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
          return target[prop];
      }
      const value = resolve();
      target[prop] = value;
      return value;
  }
  function _resolveWithContext(target, prop, receiver) {
      const { _proxy , _context , _subProxy , _descriptors: descriptors  } = target;
      let value = _proxy[prop];
      if (isFunction(value) && descriptors.isScriptable(prop)) {
          value = _resolveScriptable(prop, value, target, receiver);
      }
      if (isArray(value) && value.length) {
          value = _resolveArray(prop, value, target, descriptors.isIndexable);
      }
      if (needsSubResolver(prop, value)) {
          value = _attachContext(value, _context, _subProxy && _subProxy[prop], descriptors);
      }
      return value;
  }
  function _resolveScriptable(prop, value, target, receiver) {
      const { _proxy , _context , _subProxy , _stack  } = target;
      if (_stack.has(prop)) {
          throw new Error('Recursion detected: ' + Array.from(_stack).join('->') + '->' + prop);
      }
      _stack.add(prop);
      value = value(_context, _subProxy || receiver);
      _stack.delete(prop);
      if (needsSubResolver(prop, value)) {
          value = createSubResolver(_proxy._scopes, _proxy, prop, value);
      }
      return value;
  }
  function _resolveArray(prop, value, target, isIndexable) {
      const { _proxy , _context , _subProxy , _descriptors: descriptors  } = target;
      if (defined(_context.index) && isIndexable(prop)) {
          value = value[_context.index % value.length];
      } else if (isObject(value[0])) {
          const arr = value;
          const scopes = _proxy._scopes.filter((s)=>s !== arr);
          value = [];
          for (const item of arr){
              const resolver = createSubResolver(scopes, _proxy, prop, item);
              value.push(_attachContext(resolver, _context, _subProxy && _subProxy[prop], descriptors));
          }
      }
      return value;
  }
  function resolveFallback(fallback, prop, value) {
      return isFunction(fallback) ? fallback(prop, value) : fallback;
  }
  const getScope = (key, parent)=>key === true ? parent : typeof key === 'string' ? resolveObjectKey(parent, key) : undefined;
  function addScopes(set, parentScopes, key, parentFallback, value) {
      for (const parent of parentScopes){
          const scope = getScope(key, parent);
          if (scope) {
              set.add(scope);
              const fallback = resolveFallback(scope._fallback, key, value);
              if (defined(fallback) && fallback !== key && fallback !== parentFallback) {
                  return fallback;
              }
          } else if (scope === false && defined(parentFallback) && key !== parentFallback) {
              return null;
          }
      }
      return false;
  }
  function createSubResolver(parentScopes, resolver, prop, value) {
      const rootScopes = resolver._rootScopes;
      const fallback = resolveFallback(resolver._fallback, prop, value);
      const allScopes = [
          ...parentScopes,
          ...rootScopes
      ];
      const set = new Set();
      set.add(value);
      let key = addScopesFromKey(set, allScopes, prop, fallback || prop, value);
      if (key === null) {
          return false;
      }
      if (defined(fallback) && fallback !== prop) {
          key = addScopesFromKey(set, allScopes, fallback, key, value);
          if (key === null) {
              return false;
          }
      }
      return _createResolver(Array.from(set), [
          ''
      ], rootScopes, fallback, ()=>subGetTarget(resolver, prop, value));
  }
  function addScopesFromKey(set, allScopes, key, fallback, item) {
      while(key){
          key = addScopes(set, allScopes, key, fallback, item);
      }
      return key;
  }
  function subGetTarget(resolver, prop, value) {
      const parent = resolver._getTarget();
      if (!(prop in parent)) {
          parent[prop] = {};
      }
      const target = parent[prop];
      if (isArray(target) && isObject(value)) {
          return value;
      }
      return target || {};
  }
  function _resolveWithPrefixes(prop, prefixes, scopes, proxy) {
      let value;
      for (const prefix of prefixes){
          value = _resolve(readKey(prefix, prop), scopes);
          if (defined(value)) {
              return needsSubResolver(prop, value) ? createSubResolver(scopes, proxy, prop, value) : value;
          }
      }
  }
  function _resolve(key, scopes) {
      for (const scope of scopes){
          if (!scope) {
              continue;
          }
          const value = scope[key];
          if (defined(value)) {
              return value;
          }
      }
  }
  function getKeysFromAllScopes(target) {
      let keys = target._keys;
      if (!keys) {
          keys = target._keys = resolveKeysFromAllScopes(target._scopes);
      }
      return keys;
  }
  function resolveKeysFromAllScopes(scopes) {
      const set = new Set();
      for (const scope of scopes){
          for (const key of Object.keys(scope).filter((k)=>!k.startsWith('_'))){
              set.add(key);
          }
      }
      return Array.from(set);
  }
  function _parseObjectDataRadialScale(meta, data, start, count) {
      const { iScale  } = meta;
      const { key ='r'  } = this._parsing;
      const parsed = new Array(count);
      let i, ilen, index, item;
      for(i = 0, ilen = count; i < ilen; ++i){
          index = i + start;
          item = data[index];
          parsed[i] = {
              r: iScale.parse(resolveObjectKey(item, key), index)
          };
      }
      return parsed;
  }

  const EPSILON = Number.EPSILON || 1e-14;
  const getPoint = (points, i)=>i < points.length && !points[i].skip && points[i];
  const getValueAxis = (indexAxis)=>indexAxis === 'x' ? 'y' : 'x';
  function splineCurve(firstPoint, middlePoint, afterPoint, t) {
      // Props to Rob Spencer at scaled innovation for his post on splining between points
      // http://scaledinnovation.com/analytics/splines/aboutSplines.html
      // This function must also respect "skipped" points
      const previous = firstPoint.skip ? middlePoint : firstPoint;
      const current = middlePoint;
      const next = afterPoint.skip ? middlePoint : afterPoint;
      const d01 = distanceBetweenPoints(current, previous);
      const d12 = distanceBetweenPoints(next, current);
      let s01 = d01 / (d01 + d12);
      let s12 = d12 / (d01 + d12);
      // If all points are the same, s01 & s02 will be inf
      s01 = isNaN(s01) ? 0 : s01;
      s12 = isNaN(s12) ? 0 : s12;
      const fa = t * s01; // scaling factor for triangle Ta
      const fb = t * s12;
      return {
          previous: {
              x: current.x - fa * (next.x - previous.x),
              y: current.y - fa * (next.y - previous.y)
          },
          next: {
              x: current.x + fb * (next.x - previous.x),
              y: current.y + fb * (next.y - previous.y)
          }
      };
  }
  /**
   * Adjust tangents to ensure monotonic properties
   */ function monotoneAdjust(points, deltaK, mK) {
      const pointsLen = points.length;
      let alphaK, betaK, tauK, squaredMagnitude, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for(let i = 0; i < pointsLen - 1; ++i){
          pointCurrent = pointAfter;
          pointAfter = getPoint(points, i + 1);
          if (!pointCurrent || !pointAfter) {
              continue;
          }
          if (almostEquals(deltaK[i], 0, EPSILON)) {
              mK[i] = mK[i + 1] = 0;
              continue;
          }
          alphaK = mK[i] / deltaK[i];
          betaK = mK[i + 1] / deltaK[i];
          squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
          if (squaredMagnitude <= 9) {
              continue;
          }
          tauK = 3 / Math.sqrt(squaredMagnitude);
          mK[i] = alphaK * tauK * deltaK[i];
          mK[i + 1] = betaK * tauK * deltaK[i];
      }
  }
  function monotoneCompute(points, mK, indexAxis = 'x') {
      const valueAxis = getValueAxis(indexAxis);
      const pointsLen = points.length;
      let delta, pointBefore, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for(let i = 0; i < pointsLen; ++i){
          pointBefore = pointCurrent;
          pointCurrent = pointAfter;
          pointAfter = getPoint(points, i + 1);
          if (!pointCurrent) {
              continue;
          }
          const iPixel = pointCurrent[indexAxis];
          const vPixel = pointCurrent[valueAxis];
          if (pointBefore) {
              delta = (iPixel - pointBefore[indexAxis]) / 3;
              pointCurrent[`cp1${indexAxis}`] = iPixel - delta;
              pointCurrent[`cp1${valueAxis}`] = vPixel - delta * mK[i];
          }
          if (pointAfter) {
              delta = (pointAfter[indexAxis] - iPixel) / 3;
              pointCurrent[`cp2${indexAxis}`] = iPixel + delta;
              pointCurrent[`cp2${valueAxis}`] = vPixel + delta * mK[i];
          }
      }
  }
  /**
   * This function calculates Bézier control points in a similar way than |splineCurve|,
   * but preserves monotonicity of the provided data and ensures no local extremums are added
   * between the dataset discrete points due to the interpolation.
   * See : https://en.wikipedia.org/wiki/Monotone_cubic_interpolation
   */ function splineCurveMonotone(points, indexAxis = 'x') {
      const valueAxis = getValueAxis(indexAxis);
      const pointsLen = points.length;
      const deltaK = Array(pointsLen).fill(0);
      const mK = Array(pointsLen);
      // Calculate slopes (deltaK) and initialize tangents (mK)
      let i, pointBefore, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for(i = 0; i < pointsLen; ++i){
          pointBefore = pointCurrent;
          pointCurrent = pointAfter;
          pointAfter = getPoint(points, i + 1);
          if (!pointCurrent) {
              continue;
          }
          if (pointAfter) {
              const slopeDelta = pointAfter[indexAxis] - pointCurrent[indexAxis];
              // In the case of two points that appear at the same x pixel, slopeDeltaX is 0
              deltaK[i] = slopeDelta !== 0 ? (pointAfter[valueAxis] - pointCurrent[valueAxis]) / slopeDelta : 0;
          }
          mK[i] = !pointBefore ? deltaK[i] : !pointAfter ? deltaK[i - 1] : sign(deltaK[i - 1]) !== sign(deltaK[i]) ? 0 : (deltaK[i - 1] + deltaK[i]) / 2;
      }
      monotoneAdjust(points, deltaK, mK);
      monotoneCompute(points, mK, indexAxis);
  }
  function capControlPoint(pt, min, max) {
      return Math.max(Math.min(pt, max), min);
  }
  function capBezierPoints(points, area) {
      let i, ilen, point, inArea, inAreaPrev;
      let inAreaNext = _isPointInArea(points[0], area);
      for(i = 0, ilen = points.length; i < ilen; ++i){
          inAreaPrev = inArea;
          inArea = inAreaNext;
          inAreaNext = i < ilen - 1 && _isPointInArea(points[i + 1], area);
          if (!inArea) {
              continue;
          }
          point = points[i];
          if (inAreaPrev) {
              point.cp1x = capControlPoint(point.cp1x, area.left, area.right);
              point.cp1y = capControlPoint(point.cp1y, area.top, area.bottom);
          }
          if (inAreaNext) {
              point.cp2x = capControlPoint(point.cp2x, area.left, area.right);
              point.cp2y = capControlPoint(point.cp2y, area.top, area.bottom);
          }
      }
  }
  /**
   * @private
   */ function _updateBezierControlPoints(points, options, area, loop, indexAxis) {
      let i, ilen, point, controlPoints;
      // Only consider points that are drawn in case the spanGaps option is used
      if (options.spanGaps) {
          points = points.filter((pt)=>!pt.skip);
      }
      if (options.cubicInterpolationMode === 'monotone') {
          splineCurveMonotone(points, indexAxis);
      } else {
          let prev = loop ? points[points.length - 1] : points[0];
          for(i = 0, ilen = points.length; i < ilen; ++i){
              point = points[i];
              controlPoints = splineCurve(prev, point, points[Math.min(i + 1, ilen - (loop ? 0 : 1)) % ilen], options.tension);
              point.cp1x = controlPoints.previous.x;
              point.cp1y = controlPoints.previous.y;
              point.cp2x = controlPoints.next.x;
              point.cp2y = controlPoints.next.y;
              prev = point;
          }
      }
      if (options.capBezierPoints) {
          capBezierPoints(points, area);
      }
  }

  /**
   * Note: typedefs are auto-exported, so use a made-up `dom` namespace where
   * necessary to avoid duplicates with `export * from './helpers`; see
   * https://github.com/microsoft/TypeScript/issues/46011
   * @typedef { import('../core/core.controller.js').default } dom.Chart
   * @typedef { import('../../types').ChartEvent } ChartEvent
   */ /**
   * @private
   */ function _isDomSupported() {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
  /**
   * @private
   */ function _getParentNode(domNode) {
      let parent = domNode.parentNode;
      if (parent && parent.toString() === '[object ShadowRoot]') {
          parent = parent.host;
      }
      return parent;
  }
  /**
   * convert max-width/max-height values that may be percentages into a number
   * @private
   */ function parseMaxStyle(styleValue, node, parentProperty) {
      let valueInPixels;
      if (typeof styleValue === 'string') {
          valueInPixels = parseInt(styleValue, 10);
          if (styleValue.indexOf('%') !== -1) {
              // percentage * size in dimension
              valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
          }
      } else {
          valueInPixels = styleValue;
      }
      return valueInPixels;
  }
  const getComputedStyle = (element)=>element.ownerDocument.defaultView.getComputedStyle(element, null);
  function getStyle(el, property) {
      return getComputedStyle(el).getPropertyValue(property);
  }
  const positions = [
      'top',
      'right',
      'bottom',
      'left'
  ];
  function getPositionedStyle(styles, style, suffix) {
      const result = {};
      suffix = suffix ? '-' + suffix : '';
      for(let i = 0; i < 4; i++){
          const pos = positions[i];
          result[pos] = parseFloat(styles[style + '-' + pos + suffix]) || 0;
      }
      result.width = result.left + result.right;
      result.height = result.top + result.bottom;
      return result;
  }
  const useOffsetPos = (x, y, target)=>(x > 0 || y > 0) && (!target || !target.shadowRoot);
  /**
   * @param e
   * @param canvas
   * @returns Canvas position
   */ function getCanvasPosition(e, canvas) {
      const touches = e.touches;
      const source = touches && touches.length ? touches[0] : e;
      const { offsetX , offsetY  } = source;
      let box = false;
      let x, y;
      if (useOffsetPos(offsetX, offsetY, e.target)) {
          x = offsetX;
          y = offsetY;
      } else {
          const rect = canvas.getBoundingClientRect();
          x = source.clientX - rect.left;
          y = source.clientY - rect.top;
          box = true;
      }
      return {
          x,
          y,
          box
      };
  }
  /**
   * Gets an event's x, y coordinates, relative to the chart area
   * @param event
   * @param chart
   * @returns x and y coordinates of the event
   */ function getRelativePosition(event, chart) {
      if ('native' in event) {
          return event;
      }
      const { canvas , currentDevicePixelRatio  } = chart;
      const style = getComputedStyle(canvas);
      const borderBox = style.boxSizing === 'border-box';
      const paddings = getPositionedStyle(style, 'padding');
      const borders = getPositionedStyle(style, 'border', 'width');
      const { x , y , box  } = getCanvasPosition(event, canvas);
      const xOffset = paddings.left + (box && borders.left);
      const yOffset = paddings.top + (box && borders.top);
      let { width , height  } = chart;
      if (borderBox) {
          width -= paddings.width + borders.width;
          height -= paddings.height + borders.height;
      }
      return {
          x: Math.round((x - xOffset) / width * canvas.width / currentDevicePixelRatio),
          y: Math.round((y - yOffset) / height * canvas.height / currentDevicePixelRatio)
      };
  }
  function getContainerSize(canvas, width, height) {
      let maxWidth, maxHeight;
      if (width === undefined || height === undefined) {
          const container = _getParentNode(canvas);
          if (!container) {
              width = canvas.clientWidth;
              height = canvas.clientHeight;
          } else {
              const rect = container.getBoundingClientRect(); // this is the border box of the container
              const containerStyle = getComputedStyle(container);
              const containerBorder = getPositionedStyle(containerStyle, 'border', 'width');
              const containerPadding = getPositionedStyle(containerStyle, 'padding');
              width = rect.width - containerPadding.width - containerBorder.width;
              height = rect.height - containerPadding.height - containerBorder.height;
              maxWidth = parseMaxStyle(containerStyle.maxWidth, container, 'clientWidth');
              maxHeight = parseMaxStyle(containerStyle.maxHeight, container, 'clientHeight');
          }
      }
      return {
          width,
          height,
          maxWidth: maxWidth || INFINITY,
          maxHeight: maxHeight || INFINITY
      };
  }
  const round1 = (v)=>Math.round(v * 10) / 10;
  // eslint-disable-next-line complexity
  function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
      const style = getComputedStyle(canvas);
      const margins = getPositionedStyle(style, 'margin');
      const maxWidth = parseMaxStyle(style.maxWidth, canvas, 'clientWidth') || INFINITY;
      const maxHeight = parseMaxStyle(style.maxHeight, canvas, 'clientHeight') || INFINITY;
      const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
      let { width , height  } = containerSize;
      if (style.boxSizing === 'content-box') {
          const borders = getPositionedStyle(style, 'border', 'width');
          const paddings = getPositionedStyle(style, 'padding');
          width -= paddings.width + borders.width;
          height -= paddings.height + borders.height;
      }
      width = Math.max(0, width - margins.width);
      height = Math.max(0, aspectRatio ? width / aspectRatio : height - margins.height);
      width = round1(Math.min(width, maxWidth, containerSize.maxWidth));
      height = round1(Math.min(height, maxHeight, containerSize.maxHeight));
      if (width && !height) {
          // https://github.com/chartjs/Chart.js/issues/4659
          // If the canvas has width, but no height, default to aspectRatio of 2 (canvas default)
          height = round1(width / 2);
      }
      const maintainHeight = bbWidth !== undefined || bbHeight !== undefined;
      if (maintainHeight && aspectRatio && containerSize.height && height > containerSize.height) {
          height = containerSize.height;
          width = round1(Math.floor(height * aspectRatio));
      }
      return {
          width,
          height
      };
  }
  /**
   * @param chart
   * @param forceRatio
   * @param forceStyle
   * @returns True if the canvas context size or transformation has changed.
   */ function retinaScale(chart, forceRatio, forceStyle) {
      const pixelRatio = forceRatio || 1;
      const deviceHeight = Math.floor(chart.height * pixelRatio);
      const deviceWidth = Math.floor(chart.width * pixelRatio);
      chart.height = Math.floor(chart.height);
      chart.width = Math.floor(chart.width);
      const canvas = chart.canvas;
      // If no style has been set on the canvas, the render size is used as display size,
      // making the chart visually bigger, so let's enforce it to the "correct" values.
      // See https://github.com/chartjs/Chart.js/issues/3575
      if (canvas.style && (forceStyle || !canvas.style.height && !canvas.style.width)) {
          canvas.style.height = `${chart.height}px`;
          canvas.style.width = `${chart.width}px`;
      }
      if (chart.currentDevicePixelRatio !== pixelRatio || canvas.height !== deviceHeight || canvas.width !== deviceWidth) {
          chart.currentDevicePixelRatio = pixelRatio;
          canvas.height = deviceHeight;
          canvas.width = deviceWidth;
          chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          return true;
      }
      return false;
  }
  /**
   * Detects support for options object argument in addEventListener.
   * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
   * @private
   */ const supportsEventListenerOptions = function() {
      let passiveSupported = false;
      try {
          const options = {
              get passive () {
                  passiveSupported = true;
                  return false;
              }
          };
          window.addEventListener('test', null, options);
          window.removeEventListener('test', null, options);
      } catch (e) {
      // continue regardless of error
      }
      return passiveSupported;
  }();
  /**
   * The "used" size is the final value of a dimension property after all calculations have
   * been performed. This method uses the computed style of `element` but returns undefined
   * if the computed style is not expressed in pixels. That can happen in some cases where
   * `element` has a size relative to its parent and this last one is not yet displayed,
   * for example because of `display: none` on a parent node.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/used_value
   * @returns Size in pixels or undefined if unknown.
   */ function readUsedSize(element, property) {
      const value = getStyle(element, property);
      const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
      return matches ? +matches[1] : undefined;
  }

  /**
   * @private
   */ function _pointInLine(p1, p2, t, mode) {
      return {
          x: p1.x + t * (p2.x - p1.x),
          y: p1.y + t * (p2.y - p1.y)
      };
  }
  /**
   * @private
   */ function _steppedInterpolation(p1, p2, t, mode) {
      return {
          x: p1.x + t * (p2.x - p1.x),
          y: mode === 'middle' ? t < 0.5 ? p1.y : p2.y : mode === 'after' ? t < 1 ? p1.y : p2.y : t > 0 ? p2.y : p1.y
      };
  }
  /**
   * @private
   */ function _bezierInterpolation(p1, p2, t, mode) {
      const cp1 = {
          x: p1.cp2x,
          y: p1.cp2y
      };
      const cp2 = {
          x: p2.cp1x,
          y: p2.cp1y
      };
      const a = _pointInLine(p1, cp1, t);
      const b = _pointInLine(cp1, cp2, t);
      const c = _pointInLine(cp2, p2, t);
      const d = _pointInLine(a, b, t);
      const e = _pointInLine(b, c, t);
      return _pointInLine(d, e, t);
  }

  const getRightToLeftAdapter = function(rectX, width) {
      return {
          x (x) {
              return rectX + rectX + width - x;
          },
          setWidth (w) {
              width = w;
          },
          textAlign (align) {
              if (align === 'center') {
                  return align;
              }
              return align === 'right' ? 'left' : 'right';
          },
          xPlus (x, value) {
              return x - value;
          },
          leftForLtr (x, itemWidth) {
              return x - itemWidth;
          }
      };
  };
  const getLeftToRightAdapter = function() {
      return {
          x (x) {
              return x;
          },
          setWidth (w) {},
          textAlign (align) {
              return align;
          },
          xPlus (x, value) {
              return x + value;
          },
          leftForLtr (x, _itemWidth) {
              return x;
          }
      };
  };
  function getRtlAdapter(rtl, rectX, width) {
      return rtl ? getRightToLeftAdapter(rectX, width) : getLeftToRightAdapter();
  }
  function overrideTextDirection(ctx, direction) {
      let style, original;
      if (direction === 'ltr' || direction === 'rtl') {
          style = ctx.canvas.style;
          original = [
              style.getPropertyValue('direction'),
              style.getPropertyPriority('direction')
          ];
          style.setProperty('direction', direction, 'important');
          ctx.prevTextDirection = original;
      }
  }
  function restoreTextDirection(ctx, original) {
      if (original !== undefined) {
          delete ctx.prevTextDirection;
          ctx.canvas.style.setProperty('direction', original[0], original[1]);
      }
  }

  function propertyFn(property) {
      if (property === 'angle') {
          return {
              between: _angleBetween,
              compare: _angleDiff,
              normalize: _normalizeAngle
          };
      }
      return {
          between: _isBetween,
          compare: (a, b)=>a - b,
          normalize: (x)=>x
      };
  }
  function normalizeSegment({ start , end , count , loop , style  }) {
      return {
          start: start % count,
          end: end % count,
          loop: loop && (end - start + 1) % count === 0,
          style
      };
  }
  function getSegment(segment, points, bounds) {
      const { property , start: startBound , end: endBound  } = bounds;
      const { between , normalize  } = propertyFn(property);
      const count = points.length;
      let { start , end , loop  } = segment;
      let i, ilen;
      if (loop) {
          start += count;
          end += count;
          for(i = 0, ilen = count; i < ilen; ++i){
              if (!between(normalize(points[start % count][property]), startBound, endBound)) {
                  break;
              }
              start--;
              end--;
          }
          start %= count;
          end %= count;
      }
      if (end < start) {
          end += count;
      }
      return {
          start,
          end,
          loop,
          style: segment.style
      };
  }
   function _boundSegment(segment, points, bounds) {
      if (!bounds) {
          return [
              segment
          ];
      }
      const { property , start: startBound , end: endBound  } = bounds;
      const count = points.length;
      const { compare , between , normalize  } = propertyFn(property);
      const { start , end , loop , style  } = getSegment(segment, points, bounds);
      const result = [];
      let inside = false;
      let subStart = null;
      let value, point, prevValue;
      const startIsBefore = ()=>between(startBound, prevValue, value) && compare(startBound, prevValue) !== 0;
      const endIsBefore = ()=>compare(endBound, value) === 0 || between(endBound, prevValue, value);
      const shouldStart = ()=>inside || startIsBefore();
      const shouldStop = ()=>!inside || endIsBefore();
      for(let i = start, prev = start; i <= end; ++i){
          point = points[i % count];
          if (point.skip) {
              continue;
          }
          value = normalize(point[property]);
          if (value === prevValue) {
              continue;
          }
          inside = between(value, startBound, endBound);
          if (subStart === null && shouldStart()) {
              subStart = compare(value, startBound) === 0 ? i : prev;
          }
          if (subStart !== null && shouldStop()) {
              result.push(normalizeSegment({
                  start: subStart,
                  end: i,
                  loop,
                  count,
                  style
              }));
              subStart = null;
          }
          prev = i;
          prevValue = value;
      }
      if (subStart !== null) {
          result.push(normalizeSegment({
              start: subStart,
              end,
              loop,
              count,
              style
          }));
      }
      return result;
  }
   function _boundSegments(line, bounds) {
      const result = [];
      const segments = line.segments;
      for(let i = 0; i < segments.length; i++){
          const sub = _boundSegment(segments[i], line.points, bounds);
          if (sub.length) {
              result.push(...sub);
          }
      }
      return result;
  }
   function findStartAndEnd(points, count, loop, spanGaps) {
      let start = 0;
      let end = count - 1;
      if (loop && !spanGaps) {
          while(start < count && !points[start].skip){
              start++;
          }
      }
      while(start < count && points[start].skip){
          start++;
      }
      start %= count;
      if (loop) {
          end += start;
      }
      while(end > start && points[end % count].skip){
          end--;
      }
      end %= count;
      return {
          start,
          end
      };
  }
   function solidSegments(points, start, max, loop) {
      const count = points.length;
      const result = [];
      let last = start;
      let prev = points[start];
      let end;
      for(end = start + 1; end <= max; ++end){
          const cur = points[end % count];
          if (cur.skip || cur.stop) {
              if (!prev.skip) {
                  loop = false;
                  result.push({
                      start: start % count,
                      end: (end - 1) % count,
                      loop
                  });
                  start = last = cur.stop ? end : null;
              }
          } else {
              last = end;
              if (prev.skip) {
                  start = end;
              }
          }
          prev = cur;
      }
      if (last !== null) {
          result.push({
              start: start % count,
              end: last % count,
              loop
          });
      }
      return result;
  }
   function _computeSegments(line, segmentOptions) {
      const points = line.points;
      const spanGaps = line.options.spanGaps;
      const count = points.length;
      if (!count) {
          return [];
      }
      const loop = !!line._loop;
      const { start , end  } = findStartAndEnd(points, count, loop, spanGaps);
      if (spanGaps === true) {
          return splitByStyles(line, [
              {
                  start,
                  end,
                  loop
              }
          ], points, segmentOptions);
      }
      const max = end < start ? end + count : end;
      const completeLoop = !!line._fullLoop && start === 0 && end === count - 1;
      return splitByStyles(line, solidSegments(points, start, max, completeLoop), points, segmentOptions);
  }
   function splitByStyles(line, segments, points, segmentOptions) {
      if (!segmentOptions || !segmentOptions.setContext || !points) {
          return segments;
      }
      return doSplitByStyles(line, segments, points, segmentOptions);
  }
   function doSplitByStyles(line, segments, points, segmentOptions) {
      const chartContext = line._chart.getContext();
      const baseStyle = readStyle(line.options);
      const { _datasetIndex: datasetIndex , options: { spanGaps  }  } = line;
      const count = points.length;
      const result = [];
      let prevStyle = baseStyle;
      let start = segments[0].start;
      let i = start;
      function addStyle(s, e, l, st) {
          const dir = spanGaps ? -1 : 1;
          if (s === e) {
              return;
          }
          s += count;
          while(points[s % count].skip){
              s -= dir;
          }
          while(points[e % count].skip){
              e += dir;
          }
          if (s % count !== e % count) {
              result.push({
                  start: s % count,
                  end: e % count,
                  loop: l,
                  style: st
              });
              prevStyle = st;
              start = e % count;
          }
      }
      for (const segment of segments){
          start = spanGaps ? start : segment.start;
          let prev = points[start % count];
          let style;
          for(i = start + 1; i <= segment.end; i++){
              const pt = points[i % count];
              style = readStyle(segmentOptions.setContext(createContext(chartContext, {
                  type: 'segment',
                  p0: prev,
                  p1: pt,
                  p0DataIndex: (i - 1) % count,
                  p1DataIndex: i % count,
                  datasetIndex
              })));
              if (styleChanged(style, prevStyle)) {
                  addStyle(start, i - 1, segment.loop, prevStyle);
              }
              prev = pt;
              prevStyle = style;
          }
          if (start < i - 1) {
              addStyle(start, i - 1, segment.loop, prevStyle);
          }
      }
      return result;
  }
  function readStyle(options) {
      return {
          backgroundColor: options.backgroundColor,
          borderCapStyle: options.borderCapStyle,
          borderDash: options.borderDash,
          borderDashOffset: options.borderDashOffset,
          borderJoinStyle: options.borderJoinStyle,
          borderWidth: options.borderWidth,
          borderColor: options.borderColor
      };
  }
  function styleChanged(style, prevStyle) {
      return prevStyle && JSON.stringify(style) !== JSON.stringify(prevStyle);
  }

  /*!
   * Chart.js v4.2.0
   * https://www.chartjs.org
   * (c) 2023 Chart.js Contributors
   * Released under the MIT License
   */

  class Animator {
      constructor(){
          this._request = null;
          this._charts = new Map();
          this._running = false;
          this._lastDate = undefined;
      }
   _notify(chart, anims, date, type) {
          const callbacks = anims.listeners[type];
          const numSteps = anims.duration;
          callbacks.forEach((fn)=>fn({
                  chart,
                  initial: anims.initial,
                  numSteps,
                  currentStep: Math.min(date - anims.start, numSteps)
              }));
      }
   _refresh() {
          if (this._request) {
              return;
          }
          this._running = true;
          this._request = requestAnimFrame.call(window, ()=>{
              this._update();
              this._request = null;
              if (this._running) {
                  this._refresh();
              }
          });
      }
   _update(date = Date.now()) {
          let remaining = 0;
          this._charts.forEach((anims, chart)=>{
              if (!anims.running || !anims.items.length) {
                  return;
              }
              const items = anims.items;
              let i = items.length - 1;
              let draw = false;
              let item;
              for(; i >= 0; --i){
                  item = items[i];
                  if (item._active) {
                      if (item._total > anims.duration) {
                          anims.duration = item._total;
                      }
                      item.tick(date);
                      draw = true;
                  } else {
                      items[i] = items[items.length - 1];
                      items.pop();
                  }
              }
              if (draw) {
                  chart.draw();
                  this._notify(chart, anims, date, 'progress');
              }
              if (!items.length) {
                  anims.running = false;
                  this._notify(chart, anims, date, 'complete');
                  anims.initial = false;
              }
              remaining += items.length;
          });
          this._lastDate = date;
          if (remaining === 0) {
              this._running = false;
          }
      }
   _getAnims(chart) {
          const charts = this._charts;
          let anims = charts.get(chart);
          if (!anims) {
              anims = {
                  running: false,
                  initial: true,
                  items: [],
                  listeners: {
                      complete: [],
                      progress: []
                  }
              };
              charts.set(chart, anims);
          }
          return anims;
      }
   listen(chart, event, cb) {
          this._getAnims(chart).listeners[event].push(cb);
      }
   add(chart, items) {
          if (!items || !items.length) {
              return;
          }
          this._getAnims(chart).items.push(...items);
      }
   has(chart) {
          return this._getAnims(chart).items.length > 0;
      }
   start(chart) {
          const anims = this._charts.get(chart);
          if (!anims) {
              return;
          }
          anims.running = true;
          anims.start = Date.now();
          anims.duration = anims.items.reduce((acc, cur)=>Math.max(acc, cur._duration), 0);
          this._refresh();
      }
      running(chart) {
          if (!this._running) {
              return false;
          }
          const anims = this._charts.get(chart);
          if (!anims || !anims.running || !anims.items.length) {
              return false;
          }
          return true;
      }
   stop(chart) {
          const anims = this._charts.get(chart);
          if (!anims || !anims.items.length) {
              return;
          }
          const items = anims.items;
          let i = items.length - 1;
          for(; i >= 0; --i){
              items[i].cancel();
          }
          anims.items = [];
          this._notify(chart, anims, Date.now(), 'complete');
      }
   remove(chart) {
          return this._charts.delete(chart);
      }
  }
  var animator = /* #__PURE__ */ new Animator();

  const transparent = 'transparent';
  const interpolators = {
      boolean (from, to, factor) {
          return factor > 0.5 ? to : from;
      },
   color (from, to, factor) {
          const c0 = color(from || transparent);
          const c1 = c0.valid && color(to || transparent);
          return c1 && c1.valid ? c1.mix(c0, factor).hexString() : to;
      },
      number (from, to, factor) {
          return from + (to - from) * factor;
      }
  };
  class Animation {
      constructor(cfg, target, prop, to){
          const currentValue = target[prop];
          to = resolve([
              cfg.to,
              to,
              currentValue,
              cfg.from
          ]);
          const from = resolve([
              cfg.from,
              currentValue,
              to
          ]);
          this._active = true;
          this._fn = cfg.fn || interpolators[cfg.type || typeof from];
          this._easing = effects[cfg.easing] || effects.linear;
          this._start = Math.floor(Date.now() + (cfg.delay || 0));
          this._duration = this._total = Math.floor(cfg.duration);
          this._loop = !!cfg.loop;
          this._target = target;
          this._prop = prop;
          this._from = from;
          this._to = to;
          this._promises = undefined;
      }
      active() {
          return this._active;
      }
      update(cfg, to, date) {
          if (this._active) {
              this._notify(false);
              const currentValue = this._target[this._prop];
              const elapsed = date - this._start;
              const remain = this._duration - elapsed;
              this._start = date;
              this._duration = Math.floor(Math.max(remain, cfg.duration));
              this._total += elapsed;
              this._loop = !!cfg.loop;
              this._to = resolve([
                  cfg.to,
                  to,
                  currentValue,
                  cfg.from
              ]);
              this._from = resolve([
                  cfg.from,
                  currentValue,
                  to
              ]);
          }
      }
      cancel() {
          if (this._active) {
              this.tick(Date.now());
              this._active = false;
              this._notify(false);
          }
      }
      tick(date) {
          const elapsed = date - this._start;
          const duration = this._duration;
          const prop = this._prop;
          const from = this._from;
          const loop = this._loop;
          const to = this._to;
          let factor;
          this._active = from !== to && (loop || elapsed < duration);
          if (!this._active) {
              this._target[prop] = to;
              this._notify(true);
              return;
          }
          if (elapsed < 0) {
              this._target[prop] = from;
              return;
          }
          factor = elapsed / duration % 2;
          factor = loop && factor > 1 ? 2 - factor : factor;
          factor = this._easing(Math.min(1, Math.max(0, factor)));
          this._target[prop] = this._fn(from, to, factor);
      }
      wait() {
          const promises = this._promises || (this._promises = []);
          return new Promise((res, rej)=>{
              promises.push({
                  res,
                  rej
              });
          });
      }
      _notify(resolved) {
          const method = resolved ? 'res' : 'rej';
          const promises = this._promises || [];
          for(let i = 0; i < promises.length; i++){
              promises[i][method]();
          }
      }
  }

  class Animations {
      constructor(chart, config){
          this._chart = chart;
          this._properties = new Map();
          this.configure(config);
      }
      configure(config) {
          if (!isObject(config)) {
              return;
          }
          const animationOptions = Object.keys(defaults.animation);
          const animatedProps = this._properties;
          Object.getOwnPropertyNames(config).forEach((key)=>{
              const cfg = config[key];
              if (!isObject(cfg)) {
                  return;
              }
              const resolved = {};
              for (const option of animationOptions){
                  resolved[option] = cfg[option];
              }
              (isArray(cfg.properties) && cfg.properties || [
                  key
              ]).forEach((prop)=>{
                  if (prop === key || !animatedProps.has(prop)) {
                      animatedProps.set(prop, resolved);
                  }
              });
          });
      }
   _animateOptions(target, values) {
          const newOptions = values.options;
          const options = resolveTargetOptions(target, newOptions);
          if (!options) {
              return [];
          }
          const animations = this._createAnimations(options, newOptions);
          if (newOptions.$shared) {
              awaitAll(target.options.$animations, newOptions).then(()=>{
                  target.options = newOptions;
              }, ()=>{
              });
          }
          return animations;
      }
   _createAnimations(target, values) {
          const animatedProps = this._properties;
          const animations = [];
          const running = target.$animations || (target.$animations = {});
          const props = Object.keys(values);
          const date = Date.now();
          let i;
          for(i = props.length - 1; i >= 0; --i){
              const prop = props[i];
              if (prop.charAt(0) === '$') {
                  continue;
              }
              if (prop === 'options') {
                  animations.push(...this._animateOptions(target, values));
                  continue;
              }
              const value = values[prop];
              let animation = running[prop];
              const cfg = animatedProps.get(prop);
              if (animation) {
                  if (cfg && animation.active()) {
                      animation.update(cfg, value, date);
                      continue;
                  } else {
                      animation.cancel();
                  }
              }
              if (!cfg || !cfg.duration) {
                  target[prop] = value;
                  continue;
              }
              running[prop] = animation = new Animation(cfg, target, prop, value);
              animations.push(animation);
          }
          return animations;
      }
   update(target, values) {
          if (this._properties.size === 0) {
              Object.assign(target, values);
              return;
          }
          const animations = this._createAnimations(target, values);
          if (animations.length) {
              animator.add(this._chart, animations);
              return true;
          }
      }
  }
  function awaitAll(animations, properties) {
      const running = [];
      const keys = Object.keys(properties);
      for(let i = 0; i < keys.length; i++){
          const anim = animations[keys[i]];
          if (anim && anim.active()) {
              running.push(anim.wait());
          }
      }
      return Promise.all(running);
  }
  function resolveTargetOptions(target, newOptions) {
      if (!newOptions) {
          return;
      }
      let options = target.options;
      if (!options) {
          target.options = newOptions;
          return;
      }
      if (options.$shared) {
          target.options = options = Object.assign({}, options, {
              $shared: false,
              $animations: {}
          });
      }
      return options;
  }

  function scaleClip(scale, allowedOverflow) {
      const opts = scale && scale.options || {};
      const reverse = opts.reverse;
      const min = opts.min === undefined ? allowedOverflow : 0;
      const max = opts.max === undefined ? allowedOverflow : 0;
      return {
          start: reverse ? max : min,
          end: reverse ? min : max
      };
  }
  function defaultClip(xScale, yScale, allowedOverflow) {
      if (allowedOverflow === false) {
          return false;
      }
      const x = scaleClip(xScale, allowedOverflow);
      const y = scaleClip(yScale, allowedOverflow);
      return {
          top: y.end,
          right: x.end,
          bottom: y.start,
          left: x.start
      };
  }
  function toClip(value) {
      let t, r, b, l;
      if (isObject(value)) {
          t = value.top;
          r = value.right;
          b = value.bottom;
          l = value.left;
      } else {
          t = r = b = l = value;
      }
      return {
          top: t,
          right: r,
          bottom: b,
          left: l,
          disabled: value === false
      };
  }
  function getSortedDatasetIndices(chart, filterVisible) {
      const keys = [];
      const metasets = chart._getSortedDatasetMetas(filterVisible);
      let i, ilen;
      for(i = 0, ilen = metasets.length; i < ilen; ++i){
          keys.push(metasets[i].index);
      }
      return keys;
  }
  function applyStack(stack, value, dsIndex, options = {}) {
      const keys = stack.keys;
      const singleMode = options.mode === 'single';
      let i, ilen, datasetIndex, otherValue;
      if (value === null) {
          return;
      }
      for(i = 0, ilen = keys.length; i < ilen; ++i){
          datasetIndex = +keys[i];
          if (datasetIndex === dsIndex) {
              if (options.all) {
                  continue;
              }
              break;
          }
          otherValue = stack.values[datasetIndex];
          if (isNumberFinite(otherValue) && (singleMode || value === 0 || sign(value) === sign(otherValue))) {
              value += otherValue;
          }
      }
      return value;
  }
  function convertObjectDataToArray(data) {
      const keys = Object.keys(data);
      const adata = new Array(keys.length);
      let i, ilen, key;
      for(i = 0, ilen = keys.length; i < ilen; ++i){
          key = keys[i];
          adata[i] = {
              x: key,
              y: data[key]
          };
      }
      return adata;
  }
  function isStacked(scale, meta) {
      const stacked = scale && scale.options.stacked;
      return stacked || stacked === undefined && meta.stack !== undefined;
  }
  function getStackKey(indexScale, valueScale, meta) {
      return `${indexScale.id}.${valueScale.id}.${meta.stack || meta.type}`;
  }
  function getUserBounds(scale) {
      const { min , max , minDefined , maxDefined  } = scale.getUserBounds();
      return {
          min: minDefined ? min : Number.NEGATIVE_INFINITY,
          max: maxDefined ? max : Number.POSITIVE_INFINITY
      };
  }
  function getOrCreateStack(stacks, stackKey, indexValue) {
      const subStack = stacks[stackKey] || (stacks[stackKey] = {});
      return subStack[indexValue] || (subStack[indexValue] = {});
  }
  function getLastIndexInStack(stack, vScale, positive, type) {
      for (const meta of vScale.getMatchingVisibleMetas(type).reverse()){
          const value = stack[meta.index];
          if (positive && value > 0 || !positive && value < 0) {
              return meta.index;
          }
      }
      return null;
  }
  function updateStacks(controller, parsed) {
      const { chart , _cachedMeta: meta  } = controller;
      const stacks = chart._stacks || (chart._stacks = {});
      const { iScale , vScale , index: datasetIndex  } = meta;
      const iAxis = iScale.axis;
      const vAxis = vScale.axis;
      const key = getStackKey(iScale, vScale, meta);
      const ilen = parsed.length;
      let stack;
      for(let i = 0; i < ilen; ++i){
          const item = parsed[i];
          const { [iAxis]: index , [vAxis]: value  } = item;
          const itemStacks = item._stacks || (item._stacks = {});
          stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index);
          stack[datasetIndex] = value;
          stack._top = getLastIndexInStack(stack, vScale, true, meta.type);
          stack._bottom = getLastIndexInStack(stack, vScale, false, meta.type);
          const visualValues = stack._visualValues || (stack._visualValues = {});
          visualValues[datasetIndex] = value;
      }
  }
  function getFirstScaleId(chart, axis) {
      const scales = chart.scales;
      return Object.keys(scales).filter((key)=>scales[key].axis === axis).shift();
  }
  function createDatasetContext(parent, index) {
      return createContext(parent, {
          active: false,
          dataset: undefined,
          datasetIndex: index,
          index,
          mode: 'default',
          type: 'dataset'
      });
  }
  function createDataContext(parent, index, element) {
      return createContext(parent, {
          active: false,
          dataIndex: index,
          parsed: undefined,
          raw: undefined,
          element,
          index,
          mode: 'default',
          type: 'data'
      });
  }
  function clearStacks(meta, items) {
      const datasetIndex = meta.controller.index;
      const axis = meta.vScale && meta.vScale.axis;
      if (!axis) {
          return;
      }
      items = items || meta._parsed;
      for (const parsed of items){
          const stacks = parsed._stacks;
          if (!stacks || stacks[axis] === undefined || stacks[axis][datasetIndex] === undefined) {
              return;
          }
          delete stacks[axis][datasetIndex];
          if (stacks[axis]._visualValues !== undefined && stacks[axis]._visualValues[datasetIndex] !== undefined) {
              delete stacks[axis]._visualValues[datasetIndex];
          }
      }
  }
  const isDirectUpdateMode = (mode)=>mode === 'reset' || mode === 'none';
  const cloneIfNotShared = (cached, shared)=>shared ? cached : Object.assign({}, cached);
  const createStack = (canStack, meta, chart)=>canStack && !meta.hidden && meta._stacked && {
          keys: getSortedDatasetIndices(chart, true),
          values: null
      };
  class DatasetController {
   static defaults = {};
   static datasetElementType = null;
   static dataElementType = null;
   constructor(chart, datasetIndex){
          this.chart = chart;
          this._ctx = chart.ctx;
          this.index = datasetIndex;
          this._cachedDataOpts = {};
          this._cachedMeta = this.getMeta();
          this._type = this._cachedMeta.type;
          this.options = undefined;
           this._parsing = false;
          this._data = undefined;
          this._objectData = undefined;
          this._sharedOptions = undefined;
          this._drawStart = undefined;
          this._drawCount = undefined;
          this.enableOptionSharing = false;
          this.supportsDecimation = false;
          this.$context = undefined;
          this._syncList = [];
          this.datasetElementType = new.target.datasetElementType;
          this.dataElementType = new.target.dataElementType;
          this.initialize();
      }
      initialize() {
          const meta = this._cachedMeta;
          this.configure();
          this.linkScales();
          meta._stacked = isStacked(meta.vScale, meta);
          this.addElements();
          if (this.options.fill && !this.chart.isPluginEnabled('filler')) {
              console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options");
          }
      }
      updateIndex(datasetIndex) {
          if (this.index !== datasetIndex) {
              clearStacks(this._cachedMeta);
          }
          this.index = datasetIndex;
      }
      linkScales() {
          const chart = this.chart;
          const meta = this._cachedMeta;
          const dataset = this.getDataset();
          const chooseId = (axis, x, y, r)=>axis === 'x' ? x : axis === 'r' ? r : y;
          const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, 'x'));
          const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, 'y'));
          const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, 'r'));
          const indexAxis = meta.indexAxis;
          const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
          const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
          meta.xScale = this.getScaleForId(xid);
          meta.yScale = this.getScaleForId(yid);
          meta.rScale = this.getScaleForId(rid);
          meta.iScale = this.getScaleForId(iid);
          meta.vScale = this.getScaleForId(vid);
      }
      getDataset() {
          return this.chart.data.datasets[this.index];
      }
      getMeta() {
          return this.chart.getDatasetMeta(this.index);
      }
   getScaleForId(scaleID) {
          return this.chart.scales[scaleID];
      }
   _getOtherScale(scale) {
          const meta = this._cachedMeta;
          return scale === meta.iScale ? meta.vScale : meta.iScale;
      }
      reset() {
          this._update('reset');
      }
   _destroy() {
          const meta = this._cachedMeta;
          if (this._data) {
              unlistenArrayEvents(this._data, this);
          }
          if (meta._stacked) {
              clearStacks(meta);
          }
      }
   _dataCheck() {
          const dataset = this.getDataset();
          const data = dataset.data || (dataset.data = []);
          const _data = this._data;
          if (isObject(data)) {
              this._data = convertObjectDataToArray(data);
          } else if (_data !== data) {
              if (_data) {
                  unlistenArrayEvents(_data, this);
                  const meta = this._cachedMeta;
                  clearStacks(meta);
                  meta._parsed = [];
              }
              if (data && Object.isExtensible(data)) {
                  listenArrayEvents(data, this);
              }
              this._syncList = [];
              this._data = data;
          }
      }
      addElements() {
          const meta = this._cachedMeta;
          this._dataCheck();
          if (this.datasetElementType) {
              meta.dataset = new this.datasetElementType();
          }
      }
      buildOrUpdateElements(resetNewElements) {
          const meta = this._cachedMeta;
          const dataset = this.getDataset();
          let stackChanged = false;
          this._dataCheck();
          const oldStacked = meta._stacked;
          meta._stacked = isStacked(meta.vScale, meta);
          if (meta.stack !== dataset.stack) {
              stackChanged = true;
              clearStacks(meta);
              meta.stack = dataset.stack;
          }
          this._resyncElements(resetNewElements);
          if (stackChanged || oldStacked !== meta._stacked) {
              updateStacks(this, meta._parsed);
          }
      }
   configure() {
          const config = this.chart.config;
          const scopeKeys = config.datasetScopeKeys(this._type);
          const scopes = config.getOptionScopes(this.getDataset(), scopeKeys, true);
          this.options = config.createResolver(scopes, this.getContext());
          this._parsing = this.options.parsing;
          this._cachedDataOpts = {};
      }
   parse(start, count) {
          const { _cachedMeta: meta , _data: data  } = this;
          const { iScale , _stacked  } = meta;
          const iAxis = iScale.axis;
          let sorted = start === 0 && count === data.length ? true : meta._sorted;
          let prev = start > 0 && meta._parsed[start - 1];
          let i, cur, parsed;
          if (this._parsing === false) {
              meta._parsed = data;
              meta._sorted = true;
              parsed = data;
          } else {
              if (isArray(data[start])) {
                  parsed = this.parseArrayData(meta, data, start, count);
              } else if (isObject(data[start])) {
                  parsed = this.parseObjectData(meta, data, start, count);
              } else {
                  parsed = this.parsePrimitiveData(meta, data, start, count);
              }
              const isNotInOrderComparedToPrev = ()=>cur[iAxis] === null || prev && cur[iAxis] < prev[iAxis];
              for(i = 0; i < count; ++i){
                  meta._parsed[i + start] = cur = parsed[i];
                  if (sorted) {
                      if (isNotInOrderComparedToPrev()) {
                          sorted = false;
                      }
                      prev = cur;
                  }
              }
              meta._sorted = sorted;
          }
          if (_stacked) {
              updateStacks(this, parsed);
          }
      }
   parsePrimitiveData(meta, data, start, count) {
          const { iScale , vScale  } = meta;
          const iAxis = iScale.axis;
          const vAxis = vScale.axis;
          const labels = iScale.getLabels();
          const singleScale = iScale === vScale;
          const parsed = new Array(count);
          let i, ilen, index;
          for(i = 0, ilen = count; i < ilen; ++i){
              index = i + start;
              parsed[i] = {
                  [iAxis]: singleScale || iScale.parse(labels[index], index),
                  [vAxis]: vScale.parse(data[index], index)
              };
          }
          return parsed;
      }
   parseArrayData(meta, data, start, count) {
          const { xScale , yScale  } = meta;
          const parsed = new Array(count);
          let i, ilen, index, item;
          for(i = 0, ilen = count; i < ilen; ++i){
              index = i + start;
              item = data[index];
              parsed[i] = {
                  x: xScale.parse(item[0], index),
                  y: yScale.parse(item[1], index)
              };
          }
          return parsed;
      }
   parseObjectData(meta, data, start, count) {
          const { xScale , yScale  } = meta;
          const { xAxisKey ='x' , yAxisKey ='y'  } = this._parsing;
          const parsed = new Array(count);
          let i, ilen, index, item;
          for(i = 0, ilen = count; i < ilen; ++i){
              index = i + start;
              item = data[index];
              parsed[i] = {
                  x: xScale.parse(resolveObjectKey(item, xAxisKey), index),
                  y: yScale.parse(resolveObjectKey(item, yAxisKey), index)
              };
          }
          return parsed;
      }
   getParsed(index) {
          return this._cachedMeta._parsed[index];
      }
   getDataElement(index) {
          return this._cachedMeta.data[index];
      }
   applyStack(scale, parsed, mode) {
          const chart = this.chart;
          const meta = this._cachedMeta;
          const value = parsed[scale.axis];
          const stack = {
              keys: getSortedDatasetIndices(chart, true),
              values: parsed._stacks[scale.axis]._visualValues
          };
          return applyStack(stack, value, meta.index, {
              mode
          });
      }
   updateRangeFromParsed(range, scale, parsed, stack) {
          const parsedValue = parsed[scale.axis];
          let value = parsedValue === null ? NaN : parsedValue;
          const values = stack && parsed._stacks[scale.axis];
          if (stack && values) {
              stack.values = values;
              value = applyStack(stack, parsedValue, this._cachedMeta.index);
          }
          range.min = Math.min(range.min, value);
          range.max = Math.max(range.max, value);
      }
   getMinMax(scale, canStack) {
          const meta = this._cachedMeta;
          const _parsed = meta._parsed;
          const sorted = meta._sorted && scale === meta.iScale;
          const ilen = _parsed.length;
          const otherScale = this._getOtherScale(scale);
          const stack = createStack(canStack, meta, this.chart);
          const range = {
              min: Number.POSITIVE_INFINITY,
              max: Number.NEGATIVE_INFINITY
          };
          const { min: otherMin , max: otherMax  } = getUserBounds(otherScale);
          let i, parsed;
          function _skip() {
              parsed = _parsed[i];
              const otherValue = parsed[otherScale.axis];
              return !isNumberFinite(parsed[scale.axis]) || otherMin > otherValue || otherMax < otherValue;
          }
          for(i = 0; i < ilen; ++i){
              if (_skip()) {
                  continue;
              }
              this.updateRangeFromParsed(range, scale, parsed, stack);
              if (sorted) {
                  break;
              }
          }
          if (sorted) {
              for(i = ilen - 1; i >= 0; --i){
                  if (_skip()) {
                      continue;
                  }
                  this.updateRangeFromParsed(range, scale, parsed, stack);
                  break;
              }
          }
          return range;
      }
      getAllParsedValues(scale) {
          const parsed = this._cachedMeta._parsed;
          const values = [];
          let i, ilen, value;
          for(i = 0, ilen = parsed.length; i < ilen; ++i){
              value = parsed[i][scale.axis];
              if (isNumberFinite(value)) {
                  values.push(value);
              }
          }
          return values;
      }
   getMaxOverflow() {
          return false;
      }
   getLabelAndValue(index) {
          const meta = this._cachedMeta;
          const iScale = meta.iScale;
          const vScale = meta.vScale;
          const parsed = this.getParsed(index);
          return {
              label: iScale ? '' + iScale.getLabelForValue(parsed[iScale.axis]) : '',
              value: vScale ? '' + vScale.getLabelForValue(parsed[vScale.axis]) : ''
          };
      }
   _update(mode) {
          const meta = this._cachedMeta;
          this.update(mode || 'default');
          meta._clip = toClip(valueOrDefault(this.options.clip, defaultClip(meta.xScale, meta.yScale, this.getMaxOverflow())));
      }
   update(mode) {}
      draw() {
          const ctx = this._ctx;
          const chart = this.chart;
          const meta = this._cachedMeta;
          const elements = meta.data || [];
          const area = chart.chartArea;
          const active = [];
          const start = this._drawStart || 0;
          const count = this._drawCount || elements.length - start;
          const drawActiveElementsOnTop = this.options.drawActiveElementsOnTop;
          let i;
          if (meta.dataset) {
              meta.dataset.draw(ctx, area, start, count);
          }
          for(i = start; i < start + count; ++i){
              const element = elements[i];
              if (element.hidden) {
                  continue;
              }
              if (element.active && drawActiveElementsOnTop) {
                  active.push(element);
              } else {
                  element.draw(ctx, area);
              }
          }
          for(i = 0; i < active.length; ++i){
              active[i].draw(ctx, area);
          }
      }
   getStyle(index, active) {
          const mode = active ? 'active' : 'default';
          return index === undefined && this._cachedMeta.dataset ? this.resolveDatasetElementOptions(mode) : this.resolveDataElementOptions(index || 0, mode);
      }
   getContext(index, active, mode) {
          const dataset = this.getDataset();
          let context;
          if (index >= 0 && index < this._cachedMeta.data.length) {
              const element = this._cachedMeta.data[index];
              context = element.$context || (element.$context = createDataContext(this.getContext(), index, element));
              context.parsed = this.getParsed(index);
              context.raw = dataset.data[index];
              context.index = context.dataIndex = index;
          } else {
              context = this.$context || (this.$context = createDatasetContext(this.chart.getContext(), this.index));
              context.dataset = dataset;
              context.index = context.datasetIndex = this.index;
          }
          context.active = !!active;
          context.mode = mode;
          return context;
      }
   resolveDatasetElementOptions(mode) {
          return this._resolveElementOptions(this.datasetElementType.id, mode);
      }
   resolveDataElementOptions(index, mode) {
          return this._resolveElementOptions(this.dataElementType.id, mode, index);
      }
   _resolveElementOptions(elementType, mode = 'default', index) {
          const active = mode === 'active';
          const cache = this._cachedDataOpts;
          const cacheKey = elementType + '-' + mode;
          const cached = cache[cacheKey];
          const sharing = this.enableOptionSharing && defined(index);
          if (cached) {
              return cloneIfNotShared(cached, sharing);
          }
          const config = this.chart.config;
          const scopeKeys = config.datasetElementScopeKeys(this._type, elementType);
          const prefixes = active ? [
              `${elementType}Hover`,
              'hover',
              elementType,
              ''
          ] : [
              elementType,
              ''
          ];
          const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
          const names = Object.keys(defaults.elements[elementType]);
          const context = ()=>this.getContext(index, active, mode);
          const values = config.resolveNamedOptions(scopes, names, context, prefixes);
          if (values.$shared) {
              values.$shared = sharing;
              cache[cacheKey] = Object.freeze(cloneIfNotShared(values, sharing));
          }
          return values;
      }
   _resolveAnimations(index, transition, active) {
          const chart = this.chart;
          const cache = this._cachedDataOpts;
          const cacheKey = `animation-${transition}`;
          const cached = cache[cacheKey];
          if (cached) {
              return cached;
          }
          let options;
          if (chart.options.animation !== false) {
              const config = this.chart.config;
              const scopeKeys = config.datasetAnimationScopeKeys(this._type, transition);
              const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
              options = config.createResolver(scopes, this.getContext(index, active, transition));
          }
          const animations = new Animations(chart, options && options.animations);
          if (options && options._cacheable) {
              cache[cacheKey] = Object.freeze(animations);
          }
          return animations;
      }
   getSharedOptions(options) {
          if (!options.$shared) {
              return;
          }
          return this._sharedOptions || (this._sharedOptions = Object.assign({}, options));
      }
   includeOptions(mode, sharedOptions) {
          return !sharedOptions || isDirectUpdateMode(mode) || this.chart._animationsDisabled;
      }
   _getSharedOptions(start, mode) {
          const firstOpts = this.resolveDataElementOptions(start, mode);
          const previouslySharedOptions = this._sharedOptions;
          const sharedOptions = this.getSharedOptions(firstOpts);
          const includeOptions = this.includeOptions(mode, sharedOptions) || sharedOptions !== previouslySharedOptions;
          this.updateSharedOptions(sharedOptions, mode, firstOpts);
          return {
              sharedOptions,
              includeOptions
          };
      }
   updateElement(element, index, properties, mode) {
          if (isDirectUpdateMode(mode)) {
              Object.assign(element, properties);
          } else {
              this._resolveAnimations(index, mode).update(element, properties);
          }
      }
   updateSharedOptions(sharedOptions, mode, newOptions) {
          if (sharedOptions && !isDirectUpdateMode(mode)) {
              this._resolveAnimations(undefined, mode).update(sharedOptions, newOptions);
          }
      }
   _setStyle(element, index, mode, active) {
          element.active = active;
          const options = this.getStyle(index, active);
          this._resolveAnimations(index, mode, active).update(element, {
              options: !active && this.getSharedOptions(options) || options
          });
      }
      removeHoverStyle(element, datasetIndex, index) {
          this._setStyle(element, index, 'active', false);
      }
      setHoverStyle(element, datasetIndex, index) {
          this._setStyle(element, index, 'active', true);
      }
   _removeDatasetHoverStyle() {
          const element = this._cachedMeta.dataset;
          if (element) {
              this._setStyle(element, undefined, 'active', false);
          }
      }
   _setDatasetHoverStyle() {
          const element = this._cachedMeta.dataset;
          if (element) {
              this._setStyle(element, undefined, 'active', true);
          }
      }
   _resyncElements(resetNewElements) {
          const data = this._data;
          const elements = this._cachedMeta.data;
          for (const [method, arg1, arg2] of this._syncList){
              this[method](arg1, arg2);
          }
          this._syncList = [];
          const numMeta = elements.length;
          const numData = data.length;
          const count = Math.min(numData, numMeta);
          if (count) {
              this.parse(0, count);
          }
          if (numData > numMeta) {
              this._insertElements(numMeta, numData - numMeta, resetNewElements);
          } else if (numData < numMeta) {
              this._removeElements(numData, numMeta - numData);
          }
      }
   _insertElements(start, count, resetNewElements = true) {
          const meta = this._cachedMeta;
          const data = meta.data;
          const end = start + count;
          let i;
          const move = (arr)=>{
              arr.length += count;
              for(i = arr.length - 1; i >= end; i--){
                  arr[i] = arr[i - count];
              }
          };
          move(data);
          for(i = start; i < end; ++i){
              data[i] = new this.dataElementType();
          }
          if (this._parsing) {
              move(meta._parsed);
          }
          this.parse(start, count);
          if (resetNewElements) {
              this.updateElements(data, start, count, 'reset');
          }
      }
      updateElements(element, start, count, mode) {}
   _removeElements(start, count) {
          const meta = this._cachedMeta;
          if (this._parsing) {
              const removed = meta._parsed.splice(start, count);
              if (meta._stacked) {
                  clearStacks(meta, removed);
              }
          }
          meta.data.splice(start, count);
      }
   _sync(args) {
          if (this._parsing) {
              this._syncList.push(args);
          } else {
              const [method, arg1, arg2] = args;
              this[method](arg1, arg2);
          }
          this.chart._dataChanges.push([
              this.index,
              ...args
          ]);
      }
      _onDataPush() {
          const count = arguments.length;
          this._sync([
              '_insertElements',
              this.getDataset().data.length - count,
              count
          ]);
      }
      _onDataPop() {
          this._sync([
              '_removeElements',
              this._cachedMeta.data.length - 1,
              1
          ]);
      }
      _onDataShift() {
          this._sync([
              '_removeElements',
              0,
              1
          ]);
      }
      _onDataSplice(start, count) {
          if (count) {
              this._sync([
                  '_removeElements',
                  start,
                  count
              ]);
          }
          const newCount = arguments.length - 2;
          if (newCount) {
              this._sync([
                  '_insertElements',
                  start,
                  newCount
              ]);
          }
      }
      _onDataUnshift() {
          this._sync([
              '_insertElements',
              0,
              arguments.length
          ]);
      }
  }

  function getAllScaleValues(scale, type) {
      if (!scale._cache.$bar) {
          const visibleMetas = scale.getMatchingVisibleMetas(type);
          let values = [];
          for(let i = 0, ilen = visibleMetas.length; i < ilen; i++){
              values = values.concat(visibleMetas[i].controller.getAllParsedValues(scale));
          }
          scale._cache.$bar = _arrayUnique(values.sort((a, b)=>a - b));
      }
      return scale._cache.$bar;
  }
   function computeMinSampleSize(meta) {
      const scale = meta.iScale;
      const values = getAllScaleValues(scale, meta.type);
      let min = scale._length;
      let i, ilen, curr, prev;
      const updateMinAndPrev = ()=>{
          if (curr === 32767 || curr === -32768) {
              return;
          }
          if (defined(prev)) {
              min = Math.min(min, Math.abs(curr - prev) || min);
          }
          prev = curr;
      };
      for(i = 0, ilen = values.length; i < ilen; ++i){
          curr = scale.getPixelForValue(values[i]);
          updateMinAndPrev();
      }
      prev = undefined;
      for(i = 0, ilen = scale.ticks.length; i < ilen; ++i){
          curr = scale.getPixelForTick(i);
          updateMinAndPrev();
      }
      return min;
  }
   function computeFitCategoryTraits(index, ruler, options, stackCount) {
      const thickness = options.barThickness;
      let size, ratio;
      if (isNullOrUndef(thickness)) {
          size = ruler.min * options.categoryPercentage;
          ratio = options.barPercentage;
      } else {
          size = thickness * stackCount;
          ratio = 1;
      }
      return {
          chunk: size / stackCount,
          ratio,
          start: ruler.pixels[index] - size / 2
      };
  }
   function computeFlexCategoryTraits(index, ruler, options, stackCount) {
      const pixels = ruler.pixels;
      const curr = pixels[index];
      let prev = index > 0 ? pixels[index - 1] : null;
      let next = index < pixels.length - 1 ? pixels[index + 1] : null;
      const percent = options.categoryPercentage;
      if (prev === null) {
          prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
      }
      if (next === null) {
          next = curr + curr - prev;
      }
      const start = curr - (curr - Math.min(prev, next)) / 2 * percent;
      const size = Math.abs(next - prev) / 2 * percent;
      return {
          chunk: size / stackCount,
          ratio: options.barPercentage,
          start
      };
  }
  function parseFloatBar(entry, item, vScale, i) {
      const startValue = vScale.parse(entry[0], i);
      const endValue = vScale.parse(entry[1], i);
      const min = Math.min(startValue, endValue);
      const max = Math.max(startValue, endValue);
      let barStart = min;
      let barEnd = max;
      if (Math.abs(min) > Math.abs(max)) {
          barStart = max;
          barEnd = min;
      }
      item[vScale.axis] = barEnd;
      item._custom = {
          barStart,
          barEnd,
          start: startValue,
          end: endValue,
          min,
          max
      };
  }
  function parseValue(entry, item, vScale, i) {
      if (isArray(entry)) {
          parseFloatBar(entry, item, vScale, i);
      } else {
          item[vScale.axis] = vScale.parse(entry, i);
      }
      return item;
  }
  function parseArrayOrPrimitive(meta, data, start, count) {
      const iScale = meta.iScale;
      const vScale = meta.vScale;
      const labels = iScale.getLabels();
      const singleScale = iScale === vScale;
      const parsed = [];
      let i, ilen, item, entry;
      for(i = start, ilen = start + count; i < ilen; ++i){
          entry = data[i];
          item = {};
          item[iScale.axis] = singleScale || iScale.parse(labels[i], i);
          parsed.push(parseValue(entry, item, vScale, i));
      }
      return parsed;
  }
  function isFloatBar(custom) {
      return custom && custom.barStart !== undefined && custom.barEnd !== undefined;
  }
  function barSign(size, vScale, actualBase) {
      if (size !== 0) {
          return sign(size);
      }
      return (vScale.isHorizontal() ? 1 : -1) * (vScale.min >= actualBase ? 1 : -1);
  }
  function borderProps(properties) {
      let reverse, start, end, top, bottom;
      if (properties.horizontal) {
          reverse = properties.base > properties.x;
          start = 'left';
          end = 'right';
      } else {
          reverse = properties.base < properties.y;
          start = 'bottom';
          end = 'top';
      }
      if (reverse) {
          top = 'end';
          bottom = 'start';
      } else {
          top = 'start';
          bottom = 'end';
      }
      return {
          start,
          end,
          reverse,
          top,
          bottom
      };
  }
  function setBorderSkipped(properties, options, stack, index) {
      let edge = options.borderSkipped;
      const res = {};
      if (!edge) {
          properties.borderSkipped = res;
          return;
      }
      if (edge === true) {
          properties.borderSkipped = {
              top: true,
              right: true,
              bottom: true,
              left: true
          };
          return;
      }
      const { start , end , reverse , top , bottom  } = borderProps(properties);
      if (edge === 'middle' && stack) {
          properties.enableBorderRadius = true;
          if ((stack._top || 0) === index) {
              edge = top;
          } else if ((stack._bottom || 0) === index) {
              edge = bottom;
          } else {
              res[parseEdge(bottom, start, end, reverse)] = true;
              edge = top;
          }
      }
      res[parseEdge(edge, start, end, reverse)] = true;
      properties.borderSkipped = res;
  }
  function parseEdge(edge, a, b, reverse) {
      if (reverse) {
          edge = swap(edge, a, b);
          edge = startEnd(edge, b, a);
      } else {
          edge = startEnd(edge, a, b);
      }
      return edge;
  }
  function swap(orig, v1, v2) {
      return orig === v1 ? v2 : orig === v2 ? v1 : orig;
  }
  function startEnd(v, start, end) {
      return v === 'start' ? start : v === 'end' ? end : v;
  }
  function setInflateAmount(properties, { inflateAmount  }, ratio) {
      properties.inflateAmount = inflateAmount === 'auto' ? ratio === 1 ? 0.33 : 0 : inflateAmount;
  }
  class BarController extends DatasetController {
      static id = 'bar';
   static defaults = {
          datasetElementType: false,
          dataElementType: 'bar',
          categoryPercentage: 0.8,
          barPercentage: 0.9,
          grouped: true,
          animations: {
              numbers: {
                  type: 'number',
                  properties: [
                      'x',
                      'y',
                      'base',
                      'width',
                      'height'
                  ]
              }
          }
      };
   static overrides = {
          scales: {
              _index_: {
                  type: 'category',
                  offset: true,
                  grid: {
                      offset: true
                  }
              },
              _value_: {
                  type: 'linear',
                  beginAtZero: true
              }
          }
      };
   parsePrimitiveData(meta, data, start, count) {
          return parseArrayOrPrimitive(meta, data, start, count);
      }
   parseArrayData(meta, data, start, count) {
          return parseArrayOrPrimitive(meta, data, start, count);
      }
   parseObjectData(meta, data, start, count) {
          const { iScale , vScale  } = meta;
          const { xAxisKey ='x' , yAxisKey ='y'  } = this._parsing;
          const iAxisKey = iScale.axis === 'x' ? xAxisKey : yAxisKey;
          const vAxisKey = vScale.axis === 'x' ? xAxisKey : yAxisKey;
          const parsed = [];
          let i, ilen, item, obj;
          for(i = start, ilen = start + count; i < ilen; ++i){
              obj = data[i];
              item = {};
              item[iScale.axis] = iScale.parse(resolveObjectKey(obj, iAxisKey), i);
              parsed.push(parseValue(resolveObjectKey(obj, vAxisKey), item, vScale, i));
          }
          return parsed;
      }
   updateRangeFromParsed(range, scale, parsed, stack) {
          super.updateRangeFromParsed(range, scale, parsed, stack);
          const custom = parsed._custom;
          if (custom && scale === this._cachedMeta.vScale) {
              range.min = Math.min(range.min, custom.min);
              range.max = Math.max(range.max, custom.max);
          }
      }
   getMaxOverflow() {
          return 0;
      }
   getLabelAndValue(index) {
          const meta = this._cachedMeta;
          const { iScale , vScale  } = meta;
          const parsed = this.getParsed(index);
          const custom = parsed._custom;
          const value = isFloatBar(custom) ? '[' + custom.start + ', ' + custom.end + ']' : '' + vScale.getLabelForValue(parsed[vScale.axis]);
          return {
              label: '' + iScale.getLabelForValue(parsed[iScale.axis]),
              value
          };
      }
      initialize() {
          this.enableOptionSharing = true;
          super.initialize();
          const meta = this._cachedMeta;
          meta.stack = this.getDataset().stack;
      }
      update(mode) {
          const meta = this._cachedMeta;
          this.updateElements(meta.data, 0, meta.data.length, mode);
      }
      updateElements(bars, start, count, mode) {
          const reset = mode === 'reset';
          const { index , _cachedMeta: { vScale  }  } = this;
          const base = vScale.getBasePixel();
          const horizontal = vScale.isHorizontal();
          const ruler = this._getRuler();
          const { sharedOptions , includeOptions  } = this._getSharedOptions(start, mode);
          for(let i = start; i < start + count; i++){
              const parsed = this.getParsed(i);
              const vpixels = reset || isNullOrUndef(parsed[vScale.axis]) ? {
                  base,
                  head: base
              } : this._calculateBarValuePixels(i);
              const ipixels = this._calculateBarIndexPixels(i, ruler);
              const stack = (parsed._stacks || {})[vScale.axis];
              const properties = {
                  horizontal,
                  base: vpixels.base,
                  enableBorderRadius: !stack || isFloatBar(parsed._custom) || index === stack._top || index === stack._bottom,
                  x: horizontal ? vpixels.head : ipixels.center,
                  y: horizontal ? ipixels.center : vpixels.head,
                  height: horizontal ? ipixels.size : Math.abs(vpixels.size),
                  width: horizontal ? Math.abs(vpixels.size) : ipixels.size
              };
              if (includeOptions) {
                  properties.options = sharedOptions || this.resolveDataElementOptions(i, bars[i].active ? 'active' : mode);
              }
              const options = properties.options || bars[i].options;
              setBorderSkipped(properties, options, stack, index);
              setInflateAmount(properties, options, ruler.ratio);
              this.updateElement(bars[i], i, properties, mode);
          }
      }
   _getStacks(last, dataIndex) {
          const { iScale  } = this._cachedMeta;
          const metasets = iScale.getMatchingVisibleMetas(this._type).filter((meta)=>meta.controller.options.grouped);
          const stacked = iScale.options.stacked;
          const stacks = [];
          const skipNull = (meta)=>{
              const parsed = meta.controller.getParsed(dataIndex);
              const val = parsed && parsed[meta.vScale.axis];
              if (isNullOrUndef(val) || isNaN(val)) {
                  return true;
              }
          };
          for (const meta of metasets){
              if (dataIndex !== undefined && skipNull(meta)) {
                  continue;
              }
              if (stacked === false || stacks.indexOf(meta.stack) === -1 || stacked === undefined && meta.stack === undefined) {
                  stacks.push(meta.stack);
              }
              if (meta.index === last) {
                  break;
              }
          }
          if (!stacks.length) {
              stacks.push(undefined);
          }
          return stacks;
      }
   _getStackCount(index) {
          return this._getStacks(undefined, index).length;
      }
   _getStackIndex(datasetIndex, name, dataIndex) {
          const stacks = this._getStacks(datasetIndex, dataIndex);
          const index = name !== undefined ? stacks.indexOf(name) : -1;
          return index === -1 ? stacks.length - 1 : index;
      }
   _getRuler() {
          const opts = this.options;
          const meta = this._cachedMeta;
          const iScale = meta.iScale;
          const pixels = [];
          let i, ilen;
          for(i = 0, ilen = meta.data.length; i < ilen; ++i){
              pixels.push(iScale.getPixelForValue(this.getParsed(i)[iScale.axis], i));
          }
          const barThickness = opts.barThickness;
          const min = barThickness || computeMinSampleSize(meta);
          return {
              min,
              pixels,
              start: iScale._startPixel,
              end: iScale._endPixel,
              stackCount: this._getStackCount(),
              scale: iScale,
              grouped: opts.grouped,
              ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
          };
      }
   _calculateBarValuePixels(index) {
          const { _cachedMeta: { vScale , _stacked , index: datasetIndex  } , options: { base: baseValue , minBarLength  }  } = this;
          const actualBase = baseValue || 0;
          const parsed = this.getParsed(index);
          const custom = parsed._custom;
          const floating = isFloatBar(custom);
          let value = parsed[vScale.axis];
          let start = 0;
          let length = _stacked ? this.applyStack(vScale, parsed, _stacked) : value;
          let head, size;
          if (length !== value) {
              start = length - value;
              length = value;
          }
          if (floating) {
              value = custom.barStart;
              length = custom.barEnd - custom.barStart;
              if (value !== 0 && sign(value) !== sign(custom.barEnd)) {
                  start = 0;
              }
              start += value;
          }
          const startValue = !isNullOrUndef(baseValue) && !floating ? baseValue : start;
          let base = vScale.getPixelForValue(startValue);
          if (this.chart.getDataVisibility(index)) {
              head = vScale.getPixelForValue(start + length);
          } else {
              head = base;
          }
          size = head - base;
          if (Math.abs(size) < minBarLength) {
              size = barSign(size, vScale, actualBase) * minBarLength;
              if (value === actualBase) {
                  base -= size / 2;
              }
              const startPixel = vScale.getPixelForDecimal(0);
              const endPixel = vScale.getPixelForDecimal(1);
              const min = Math.min(startPixel, endPixel);
              const max = Math.max(startPixel, endPixel);
              base = Math.max(Math.min(base, max), min);
              head = base + size;
              if (_stacked && !floating) {
                  parsed._stacks[vScale.axis]._visualValues[datasetIndex] = vScale.getValueForPixel(head) - vScale.getValueForPixel(base);
              }
          }
          if (base === vScale.getPixelForValue(actualBase)) {
              const halfGrid = sign(size) * vScale.getLineWidthForValue(actualBase) / 2;
              base += halfGrid;
              size -= halfGrid;
          }
          return {
              size,
              base,
              head,
              center: head + size / 2
          };
      }
   _calculateBarIndexPixels(index, ruler) {
          const scale = ruler.scale;
          const options = this.options;
          const skipNull = options.skipNull;
          const maxBarThickness = valueOrDefault(options.maxBarThickness, Infinity);
          let center, size;
          if (ruler.grouped) {
              const stackCount = skipNull ? this._getStackCount(index) : ruler.stackCount;
              const range = options.barThickness === 'flex' ? computeFlexCategoryTraits(index, ruler, options, stackCount) : computeFitCategoryTraits(index, ruler, options, stackCount);
              const stackIndex = this._getStackIndex(this.index, this._cachedMeta.stack, skipNull ? index : undefined);
              center = range.start + range.chunk * stackIndex + range.chunk / 2;
              size = Math.min(maxBarThickness, range.chunk * range.ratio);
          } else {
              center = scale.getPixelForValue(this.getParsed(index)[scale.axis], index);
              size = Math.min(maxBarThickness, ruler.min * ruler.ratio);
          }
          return {
              base: center - size / 2,
              head: center + size / 2,
              center,
              size
          };
      }
      draw() {
          const meta = this._cachedMeta;
          const vScale = meta.vScale;
          const rects = meta.data;
          const ilen = rects.length;
          let i = 0;
          for(; i < ilen; ++i){
              if (this.getParsed(i)[vScale.axis] !== null) {
                  rects[i].draw(this._ctx);
              }
          }
      }
  }

  class BubbleController extends DatasetController {
      static id = 'bubble';
   static defaults = {
          datasetElementType: false,
          dataElementType: 'point',
          animations: {
              numbers: {
                  type: 'number',
                  properties: [
                      'x',
                      'y',
                      'borderWidth',
                      'radius'
                  ]
              }
          }
      };
   static overrides = {
          scales: {
              x: {
                  type: 'linear'
              },
              y: {
                  type: 'linear'
              }
          }
      };
      initialize() {
          this.enableOptionSharing = true;
          super.initialize();
      }
   parsePrimitiveData(meta, data, start, count) {
          const parsed = super.parsePrimitiveData(meta, data, start, count);
          for(let i = 0; i < parsed.length; i++){
              parsed[i]._custom = this.resolveDataElementOptions(i + start).radius;
          }
          return parsed;
      }
   parseArrayData(meta, data, start, count) {
          const parsed = super.parseArrayData(meta, data, start, count);
          for(let i = 0; i < parsed.length; i++){
              const item = data[start + i];
              parsed[i]._custom = valueOrDefault(item[2], this.resolveDataElementOptions(i + start).radius);
          }
          return parsed;
      }
   parseObjectData(meta, data, start, count) {
          const parsed = super.parseObjectData(meta, data, start, count);
          for(let i = 0; i < parsed.length; i++){
              const item = data[start + i];
              parsed[i]._custom = valueOrDefault(item && item.r && +item.r, this.resolveDataElementOptions(i + start).radius);
          }
          return parsed;
      }
   getMaxOverflow() {
          const data = this._cachedMeta.data;
          let max = 0;
          for(let i = data.length - 1; i >= 0; --i){
              max = Math.max(max, data[i].size(this.resolveDataElementOptions(i)) / 2);
          }
          return max > 0 && max;
      }
   getLabelAndValue(index) {
          const meta = this._cachedMeta;
          const labels = this.chart.data.labels || [];
          const { xScale , yScale  } = meta;
          const parsed = this.getParsed(index);
          const x = xScale.getLabelForValue(parsed.x);
          const y = yScale.getLabelForValue(parsed.y);
          const r = parsed._custom;
          return {
              label: labels[index] || '',
              value: '(' + x + ', ' + y + (r ? ', ' + r : '') + ')'
          };
      }
      update(mode) {
          const points = this._cachedMeta.data;
          this.updateElements(points, 0, points.length, mode);
      }
      updateElements(points, start, count, mode) {
          const reset = mode === 'reset';
          const { iScale , vScale  } = this._cachedMeta;
          const { sharedOptions , includeOptions  } = this._getSharedOptions(start, mode);
          const iAxis = iScale.axis;
          const vAxis = vScale.axis;
          for(let i = start; i < start + count; i++){
              const point = points[i];
              const parsed = !reset && this.getParsed(i);
              const properties = {};
              const iPixel = properties[iAxis] = reset ? iScale.getPixelForDecimal(0.5) : iScale.getPixelForValue(parsed[iAxis]);
              const vPixel = properties[vAxis] = reset ? vScale.getBasePixel() : vScale.getPixelForValue(parsed[vAxis]);
              properties.skip = isNaN(iPixel) || isNaN(vPixel);
              if (includeOptions) {
                  properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? 'active' : mode);
                  if (reset) {
                      properties.options.radius = 0;
                  }
              }
              this.updateElement(point, i, properties, mode);
          }
      }
   resolveDataElementOptions(index, mode) {
          const parsed = this.getParsed(index);
          let values = super.resolveDataElementOptions(index, mode);
          if (values.$shared) {
              values = Object.assign({}, values, {
                  $shared: false
              });
          }
          const radius = values.radius;
          if (mode !== 'active') {
              values.radius = 0;
          }
          values.radius += valueOrDefault(parsed && parsed._custom, radius);
          return values;
      }
  }

  function getRatioAndOffset(rotation, circumference, cutout) {
      let ratioX = 1;
      let ratioY = 1;
      let offsetX = 0;
      let offsetY = 0;
      if (circumference < TAU) {
          const startAngle = rotation;
          const endAngle = startAngle + circumference;
          const startX = Math.cos(startAngle);
          const startY = Math.sin(startAngle);
          const endX = Math.cos(endAngle);
          const endY = Math.sin(endAngle);
          const calcMax = (angle, a, b)=>_angleBetween(angle, startAngle, endAngle, true) ? 1 : Math.max(a, a * cutout, b, b * cutout);
          const calcMin = (angle, a, b)=>_angleBetween(angle, startAngle, endAngle, true) ? -1 : Math.min(a, a * cutout, b, b * cutout);
          const maxX = calcMax(0, startX, endX);
          const maxY = calcMax(HALF_PI, startY, endY);
          const minX = calcMin(PI, startX, endX);
          const minY = calcMin(PI + HALF_PI, startY, endY);
          ratioX = (maxX - minX) / 2;
          ratioY = (maxY - minY) / 2;
          offsetX = -(maxX + minX) / 2;
          offsetY = -(maxY + minY) / 2;
      }
      return {
          ratioX,
          ratioY,
          offsetX,
          offsetY
      };
  }
  class DoughnutController extends DatasetController {
      static id = 'doughnut';
   static defaults = {
          datasetElementType: false,
          dataElementType: 'arc',
          animation: {
              animateRotate: true,
              animateScale: false
          },
          animations: {
              numbers: {
                  type: 'number',
                  properties: [
                      'circumference',
                      'endAngle',
                      'innerRadius',
                      'outerRadius',
                      'startAngle',
                      'x',
                      'y',
                      'offset',
                      'borderWidth',
                      'spacing'
                  ]
              }
          },
          cutout: '50%',
          rotation: 0,
          circumference: 360,
          radius: '100%',
          spacing: 0,
          indexAxis: 'r'
      };
      static descriptors = {
          _scriptable: (name)=>name !== 'spacing',
          _indexable: (name)=>name !== 'spacing'
      };
   static overrides = {
          aspectRatio: 1,
          plugins: {
              legend: {
                  labels: {
                      generateLabels (chart) {
                          const data = chart.data;
                          if (data.labels.length && data.datasets.length) {
                              const { labels: { pointStyle , color  }  } = chart.legend.options;
                              return data.labels.map((label, i)=>{
                                  const meta = chart.getDatasetMeta(0);
                                  const style = meta.controller.getStyle(i);
                                  return {
                                      text: label,
                                      fillStyle: style.backgroundColor,
                                      strokeStyle: style.borderColor,
                                      fontColor: color,
                                      lineWidth: style.borderWidth,
                                      pointStyle: pointStyle,
                                      hidden: !chart.getDataVisibility(i),
                                      index: i
                                  };
                              });
                          }
                          return [];
                      }
                  },
                  onClick (e, legendItem, legend) {
                      legend.chart.toggleDataVisibility(legendItem.index);
                      legend.chart.update();
                  }
              }
          }
      };
      constructor(chart, datasetIndex){
          super(chart, datasetIndex);
          this.enableOptionSharing = true;
          this.innerRadius = undefined;
          this.outerRadius = undefined;
          this.offsetX = undefined;
          this.offsetY = undefined;
      }
      linkScales() {}
   parse(start, count) {
          const data = this.getDataset().data;
          const meta = this._cachedMeta;
          if (this._parsing === false) {
              meta._parsed = data;
          } else {
              let getter = (i)=>+data[i];
              if (isObject(data[start])) {
                  const { key ='value'  } = this._parsing;
                  getter = (i)=>+resolveObjectKey(data[i], key);
              }
              let i, ilen;
              for(i = start, ilen = start + count; i < ilen; ++i){
                  meta._parsed[i] = getter(i);
              }
          }
      }
   _getRotation() {
          return toRadians(this.options.rotation - 90);
      }
   _getCircumference() {
          return toRadians(this.options.circumference);
      }
   _getRotationExtents() {
          let min = TAU;
          let max = -TAU;
          for(let i = 0; i < this.chart.data.datasets.length; ++i){
              if (this.chart.isDatasetVisible(i) && this.chart.getDatasetMeta(i).type === this._type) {
                  const controller = this.chart.getDatasetMeta(i).controller;
                  const rotation = controller._getRotation();
                  const circumference = controller._getCircumference();
                  min = Math.min(min, rotation);
                  max = Math.max(max, rotation + circumference);
              }
          }
          return {
              rotation: min,
              circumference: max - min
          };
      }
   update(mode) {
          const chart = this.chart;
          const { chartArea  } = chart;
          const meta = this._cachedMeta;
          const arcs = meta.data;
          const spacing = this.getMaxBorderWidth() + this.getMaxOffset(arcs) + this.options.spacing;
          const maxSize = Math.max((Math.min(chartArea.width, chartArea.height) - spacing) / 2, 0);
          const cutout = Math.min(toPercentage(this.options.cutout, maxSize), 1);
          const chartWeight = this._getRingWeight(this.index);
          const { circumference , rotation  } = this._getRotationExtents();
          const { ratioX , ratioY , offsetX , offsetY  } = getRatioAndOffset(rotation, circumference, cutout);
          const maxWidth = (chartArea.width - spacing) / ratioX;
          const maxHeight = (chartArea.height - spacing) / ratioY;
          const maxRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
          const outerRadius = toDimension(this.options.radius, maxRadius);
          const innerRadius = Math.max(outerRadius * cutout, 0);
          const radiusLength = (outerRadius - innerRadius) / this._getVisibleDatasetWeightTotal();
          this.offsetX = offsetX * outerRadius;
          this.offsetY = offsetY * outerRadius;
          meta.total = this.calculateTotal();
          this.outerRadius = outerRadius - radiusLength * this._getRingWeightOffset(this.index);
          this.innerRadius = Math.max(this.outerRadius - radiusLength * chartWeight, 0);
          this.updateElements(arcs, 0, arcs.length, mode);
      }
   _circumference(i, reset) {
          const opts = this.options;
          const meta = this._cachedMeta;
          const circumference = this._getCircumference();
          if (reset && opts.animation.animateRotate || !this.chart.getDataVisibility(i) || meta._parsed[i] === null || meta.data[i].hidden) {
              return 0;
          }
          return this.calculateCircumference(meta._parsed[i] * circumference / TAU);
      }
      updateElements(arcs, start, count, mode) {
          const reset = mode === 'reset';
          const chart = this.chart;
          const chartArea = chart.chartArea;
          const opts = chart.options;
          const animationOpts = opts.animation;
          const centerX = (chartArea.left + chartArea.right) / 2;
          const centerY = (chartArea.top + chartArea.bottom) / 2;
          const animateScale = reset && animationOpts.animateScale;
          const innerRadius = animateScale ? 0 : this.innerRadius;
          const outerRadius = animateScale ? 0 : this.outerRadius;
          const { sharedOptions , includeOptions  } = this._getSharedOptions(start, mode);
          let startAngle = this._getRotation();
          let i;
          for(i = 0; i < start; ++i){
              startAngle += this._circumference(i, reset);
          }
          for(i = start; i < start + count; ++i){
              const circumference = this._circumference(i, reset);
              const arc = arcs[i];
              const properties = {
                  x: centerX + this.offsetX,
                  y: centerY + this.offsetY,
                  startAngle,
                  endAngle: startAngle + circumference,
                  circumference,
                  outerRadius,
                  innerRadius
              };
              if (includeOptions) {
                  properties.options = sharedOptions || this.resolveDataElementOptions(i, arc.active ? 'active' : mode);
              }
              startAngle += circumference;
              this.updateElement(arc, i, properties, mode);
          }
      }
      calculateTotal() {
          const meta = this._cachedMeta;
          const metaData = meta.data;
          let total = 0;
          let i;
          for(i = 0; i < metaData.length; i++){
              const value = meta._parsed[i];
              if (value !== null && !isNaN(value) && this.chart.getDataVisibility(i) && !metaData[i].hidden) {
                  total += Math.abs(value);
              }
          }
          return total;
      }
      calculateCircumference(value) {
          const total = this._cachedMeta.total;
          if (total > 0 && !isNaN(value)) {
              return TAU * (Math.abs(value) / total);
          }
          return 0;
      }
      getLabelAndValue(index) {
          const meta = this._cachedMeta;
          const chart = this.chart;
          const labels = chart.data.labels || [];
          const value = formatNumber(meta._parsed[index], chart.options.locale);
          return {
              label: labels[index] || '',
              value
          };
      }
      getMaxBorderWidth(arcs) {
          let max = 0;
          const chart = this.chart;
          let i, ilen, meta, controller, options;
          if (!arcs) {
              for(i = 0, ilen = chart.data.datasets.length; i < ilen; ++i){
                  if (chart.isDatasetVisible(i)) {
                      meta = chart.getDatasetMeta(i);
                      arcs = meta.data;
                      controller = meta.controller;
                      break;
                  }
              }
          }
          if (!arcs) {
              return 0;
          }
          for(i = 0, ilen = arcs.length; i < ilen; ++i){
              options = controller.resolveDataElementOptions(i);
              if (options.borderAlign !== 'inner') {
                  max = Math.max(max, options.borderWidth || 0, options.hoverBorderWidth || 0);
              }
          }
          return max;
      }
      getMaxOffset(arcs) {
          let max = 0;
          for(let i = 0, ilen = arcs.length; i < ilen; ++i){
              const options = this.resolveDataElementOptions(i);
              max = Math.max(max, options.offset || 0, options.hoverOffset || 0);
          }
          return max;
      }
   _getRingWeightOffset(datasetIndex) {
          let ringWeightOffset = 0;
          for(let i = 0; i < datasetIndex; ++i){
              if (this.chart.isDatasetVisible(i)) {
                  ringWeightOffset += this._getRingWeight(i);
              }
          }
          return ringWeightOffset;
      }
   _getRingWeight(datasetIndex) {
          return Math.max(valueOrDefault(this.chart.data.datasets[datasetIndex].weight, 1), 0);
      }
   _getVisibleDatasetWeightTotal() {
          return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
      }
  }

  class LineController extends DatasetController {
      static id = 'line';
   static defaults = {
          datasetElementType: 'line',
          dataElementType: 'point',
          showLine: true,
          spanGaps: false
      };
   static overrides = {
          scales: {
              _index_: {
                  type: 'category'
              },
              _value_: {
                  type: 'linear'
              }
          }
      };
      initialize() {
          this.enableOptionSharing = true;
          this.supportsDecimation = true;
          super.initialize();
      }
      update(mode) {
          const meta = this._cachedMeta;
          const { dataset: line , data: points = [] , _dataset  } = meta;
          const animationsDisabled = this.chart._animationsDisabled;
          let { start , count  } = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
          this._drawStart = start;
          this._drawCount = count;
          if (_scaleRangesChanged(meta)) {
              start = 0;
              count = points.length;
          }
          line._chart = this.chart;
          line._datasetIndex = this.index;
          line._decimated = !!_dataset._decimated;
          line.points = points;
          const options = this.resolveDatasetElementOptions(mode);
          if (!this.options.showLine) {
              options.borderWidth = 0;
          }
          options.segment = this.options.segment;
          this.updateElement(line, undefined, {
              animated: !animationsDisabled,
              options
          }, mode);
          this.updateElements(points, start, count, mode);
      }
      updateElements(points, start, count, mode) {
          const reset = mode === 'reset';
          const { iScale , vScale , _stacked , _dataset  } = this._cachedMeta;
          const { sharedOptions , includeOptions  } = this._getSharedOptions(start, mode);
          const iAxis = iScale.axis;
          const vAxis = vScale.axis;
          const { spanGaps , segment  } = this.options;
          const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
          const directUpdate = this.chart._animationsDisabled || reset || mode === 'none';
          const end = start + count;
          const pointsCount = points.length;
          let prevParsed = start > 0 && this.getParsed(start - 1);
          for(let i = 0; i < pointsCount; ++i){
              const point = points[i];
              const properties = directUpdate ? point : {};
              if (i < start || i >= end) {
                  properties.skip = true;
                  continue;
              }
              const parsed = this.getParsed(i);
              const nullData = isNullOrUndef(parsed[vAxis]);
              const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
              const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);
              properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
              properties.stop = i > 0 && Math.abs(parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
              if (segment) {
                  properties.parsed = parsed;
                  properties.raw = _dataset.data[i];
              }
              if (includeOptions) {
                  properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? 'active' : mode);
              }
              if (!directUpdate) {
                  this.updateElement(point, i, properties, mode);
              }
              prevParsed = parsed;
          }
      }
   getMaxOverflow() {
          const meta = this._cachedMeta;
          const dataset = meta.dataset;
          const border = dataset.options && dataset.options.borderWidth || 0;
          const data = meta.data || [];
          if (!data.length) {
              return border;
          }
          const firstPoint = data[0].size(this.resolveDataElementOptions(0));
          const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
          return Math.max(border, firstPoint, lastPoint) / 2;
      }
      draw() {
          const meta = this._cachedMeta;
          meta.dataset.updateControlPoints(this.chart.chartArea, meta.iScale.axis);
          super.draw();
      }
  }

  class PolarAreaController extends DatasetController {
      static id = 'polarArea';
   static defaults = {
          dataElementType: 'arc',
          animation: {
              animateRotate: true,
              animateScale: true
          },
          animations: {
              numbers: {
                  type: 'number',
                  properties: [
                      'x',
                      'y',
                      'startAngle',
                      'endAngle',
                      'innerRadius',
                      'outerRadius'
                  ]
              }
          },
          indexAxis: 'r',
          startAngle: 0
      };
   static overrides = {
          aspectRatio: 1,
          plugins: {
              legend: {
                  labels: {
                      generateLabels (chart) {
                          const data = chart.data;
                          if (data.labels.length && data.datasets.length) {
                              const { labels: { pointStyle , color  }  } = chart.legend.options;
                              return data.labels.map((label, i)=>{
                                  const meta = chart.getDatasetMeta(0);
                                  const style = meta.controller.getStyle(i);
                                  return {
                                      text: label,
                                      fillStyle: style.backgroundColor,
                                      strokeStyle: style.borderColor,
                                      fontColor: color,
                                      lineWidth: style.borderWidth,
                                      pointStyle: pointStyle,
                                      hidden: !chart.getDataVisibility(i),
                                      index: i
                                  };
                              });
                          }
                          return [];
                      }
                  },
                  onClick (e, legendItem, legend) {
                      legend.chart.toggleDataVisibility(legendItem.index);
                      legend.chart.update();
                  }
              }
          },
          scales: {
              r: {
                  type: 'radialLinear',
                  angleLines: {
                      display: false
                  },
                  beginAtZero: true,
                  grid: {
                      circular: true
                  },
                  pointLabels: {
                      display: false
                  },
                  startAngle: 0
              }
          }
      };
      constructor(chart, datasetIndex){
          super(chart, datasetIndex);
          this.innerRadius = undefined;
          this.outerRadius = undefined;
      }
      getLabelAndValue(index) {
          const meta = this._cachedMeta;
          const chart = this.chart;
          const labels = chart.data.labels || [];
          const value = formatNumber(meta._parsed[index].r, chart.options.locale);
          return {
              label: labels[index] || '',
              value
          };
      }
      parseObjectData(meta, data, start, count) {
          return _parseObjectDataRadialScale.bind(this)(meta, data, start, count);
      }
      update(mode) {
          const arcs = this._cachedMeta.data;
          this._updateRadius();
          this.updateElements(arcs, 0, arcs.length, mode);
      }
   getMinMax() {
          const meta = this._cachedMeta;
          const range = {
              min: Number.POSITIVE_INFINITY,
              max: Number.NEGATIVE_INFINITY
          };
          meta.data.forEach((element, index)=>{
              const parsed = this.getParsed(index).r;
              if (!isNaN(parsed) && this.chart.getDataVisibility(index)) {
                  if (parsed < range.min) {
                      range.min = parsed;
                  }
                  if (parsed > range.max) {
                      range.max = parsed;
                  }
              }
          });
          return range;
      }
   _updateRadius() {
          const chart = this.chart;
          const chartArea = chart.chartArea;
          const opts = chart.options;
          const minSize = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
          const outerRadius = Math.max(minSize / 2, 0);
          const innerRadius = Math.max(opts.cutoutPercentage ? outerRadius / 100 * opts.cutoutPercentage : 1, 0);
          const radiusLength = (outerRadius - innerRadius) / chart.getVisibleDatasetCount();
          this.outerRadius = outerRadius - radiusLength * this.index;
          this.innerRadius = this.outerRadius - radiusLength;
      }
      updateElements(arcs, start, count, mode) {
          const reset = mode === 'reset';
          const chart = this.chart;
          const opts = chart.options;
          const animationOpts = opts.animation;
          const scale = this._cachedMeta.rScale;
          const centerX = scale.xCenter;
          const centerY = scale.yCenter;
          const datasetStartAngle = scale.getIndexAngle(0) - 0.5 * PI;
          let angle = datasetStartAngle;
          let i;
          const defaultAngle = 360 / this.countVisibleElements();
          for(i = 0; i < start; ++i){
              angle += this._computeAngle(i, mode, defaultAngle);
          }
          for(i = start; i < start + count; i++){
              const arc = arcs[i];
              let startAngle = angle;
              let endAngle = angle + this._computeAngle(i, mode, defaultAngle);
              let outerRadius = chart.getDataVisibility(i) ? scale.getDistanceFromCenterForValue(this.getParsed(i).r) : 0;
              angle = endAngle;
              if (reset) {
                  if (animationOpts.animateScale) {
                      outerRadius = 0;
                  }
                  if (animationOpts.animateRotate) {
                      startAngle = endAngle = datasetStartAngle;
                  }
              }
              const properties = {
                  x: centerX,
                  y: centerY,
                  innerRadius: 0,
                  outerRadius,
                  startAngle,
                  endAngle,
                  options: this.resolveDataElementOptions(i, arc.active ? 'active' : mode)
              };
              this.updateElement(arc, i, properties, mode);
          }
      }
      countVisibleElements() {
          const meta = this._cachedMeta;
          let count = 0;
          meta.data.forEach((element, index)=>{
              if (!isNaN(this.getParsed(index).r) && this.chart.getDataVisibility(index)) {
                  count++;
              }
          });
          return count;
      }
   _computeAngle(index, mode, defaultAngle) {
          return this.chart.getDataVisibility(index) ? toRadians(this.resolveDataElementOptions(index, mode).angle || defaultAngle) : 0;
      }
  }

  class PieController extends DoughnutController {
      static id = 'pie';
   static defaults = {
          cutout: 0,
          rotation: 0,
          circumference: 360,
          radius: '100%'
      };
  }

  class RadarController extends DatasetController {
      static id = 'radar';
   static defaults = {
          datasetElementType: 'line',
          dataElementType: 'point',
          indexAxis: 'r',
          showLine: true,
          elements: {
              line: {
                  fill: 'start'
              }
          }
      };
   static overrides = {
          aspectRatio: 1,
          scales: {
              r: {
                  type: 'radialLinear'
              }
          }
      };
   getLabelAndValue(index) {
          const vScale = this._cachedMeta.vScale;
          const parsed = this.getParsed(index);
          return {
              label: vScale.getLabels()[index],
              value: '' + vScale.getLabelForValue(parsed[vScale.axis])
          };
      }
      parseObjectData(meta, data, start, count) {
          return _parseObjectDataRadialScale.bind(this)(meta, data, start, count);
      }
      update(mode) {
          const meta = this._cachedMeta;
          const line = meta.dataset;
          const points = meta.data || [];
          const labels = meta.iScale.getLabels();
          line.points = points;
          if (mode !== 'resize') {
              const options = this.resolveDatasetElementOptions(mode);
              if (!this.options.showLine) {
                  options.borderWidth = 0;
              }
              const properties = {
                  _loop: true,
                  _fullLoop: labels.length === points.length,
                  options
              };
              this.updateElement(line, undefined, properties, mode);
          }
          this.updateElements(points, 0, points.length, mode);
      }
      updateElements(points, start, count, mode) {
          const scale = this._cachedMeta.rScale;
          const reset = mode === 'reset';
          for(let i = start; i < start + count; i++){
              const point = points[i];
              const options = this.resolveDataElementOptions(i, point.active ? 'active' : mode);
              const pointPosition = scale.getPointPositionForValue(i, this.getParsed(i).r);
              const x = reset ? scale.xCenter : pointPosition.x;
              const y = reset ? scale.yCenter : pointPosition.y;
              const properties = {
                  x,
                  y,
                  angle: pointPosition.angle,
                  skip: isNaN(x) || isNaN(y),
                  options
              };
              this.updateElement(point, i, properties, mode);
          }
      }
  }

  class ScatterController extends DatasetController {
      static id = 'scatter';
   static defaults = {
          datasetElementType: false,
          dataElementType: 'point',
          showLine: false,
          fill: false
      };
   static overrides = {
          interaction: {
              mode: 'point'
          },
          scales: {
              x: {
                  type: 'linear'
              },
              y: {
                  type: 'linear'
              }
          }
      };
   getLabelAndValue(index) {
          const meta = this._cachedMeta;
          const labels = this.chart.data.labels || [];
          const { xScale , yScale  } = meta;
          const parsed = this.getParsed(index);
          const x = xScale.getLabelForValue(parsed.x);
          const y = yScale.getLabelForValue(parsed.y);
          return {
              label: labels[index] || '',
              value: '(' + x + ', ' + y + ')'
          };
      }
      update(mode) {
          const meta = this._cachedMeta;
          const { data: points = []  } = meta;
          const animationsDisabled = this.chart._animationsDisabled;
          let { start , count  } = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
          this._drawStart = start;
          this._drawCount = count;
          if (_scaleRangesChanged(meta)) {
              start = 0;
              count = points.length;
          }
          if (this.options.showLine) {
              const { dataset: line , _dataset  } = meta;
              line._chart = this.chart;
              line._datasetIndex = this.index;
              line._decimated = !!_dataset._decimated;
              line.points = points;
              const options = this.resolveDatasetElementOptions(mode);
              options.segment = this.options.segment;
              this.updateElement(line, undefined, {
                  animated: !animationsDisabled,
                  options
              }, mode);
          }
          this.updateElements(points, start, count, mode);
      }
      addElements() {
          const { showLine  } = this.options;
          if (!this.datasetElementType && showLine) {
              this.datasetElementType = this.chart.registry.getElement('line');
          }
          super.addElements();
      }
      updateElements(points, start, count, mode) {
          const reset = mode === 'reset';
          const { iScale , vScale , _stacked , _dataset  } = this._cachedMeta;
          const firstOpts = this.resolveDataElementOptions(start, mode);
          const sharedOptions = this.getSharedOptions(firstOpts);
          const includeOptions = this.includeOptions(mode, sharedOptions);
          const iAxis = iScale.axis;
          const vAxis = vScale.axis;
          const { spanGaps , segment  } = this.options;
          const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
          const directUpdate = this.chart._animationsDisabled || reset || mode === 'none';
          let prevParsed = start > 0 && this.getParsed(start - 1);
          for(let i = start; i < start + count; ++i){
              const point = points[i];
              const parsed = this.getParsed(i);
              const properties = directUpdate ? point : {};
              const nullData = isNullOrUndef(parsed[vAxis]);
              const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
              const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);
              properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
              properties.stop = i > 0 && Math.abs(parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
              if (segment) {
                  properties.parsed = parsed;
                  properties.raw = _dataset.data[i];
              }
              if (includeOptions) {
                  properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? 'active' : mode);
              }
              if (!directUpdate) {
                  this.updateElement(point, i, properties, mode);
              }
              prevParsed = parsed;
          }
          this.updateSharedOptions(sharedOptions, mode, firstOpts);
      }
   getMaxOverflow() {
          const meta = this._cachedMeta;
          const data = meta.data || [];
          if (!this.options.showLine) {
              let max = 0;
              for(let i = data.length - 1; i >= 0; --i){
                  max = Math.max(max, data[i].size(this.resolveDataElementOptions(i)) / 2);
              }
              return max > 0 && max;
          }
          const dataset = meta.dataset;
          const border = dataset.options && dataset.options.borderWidth || 0;
          if (!data.length) {
              return border;
          }
          const firstPoint = data[0].size(this.resolveDataElementOptions(0));
          const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
          return Math.max(border, firstPoint, lastPoint) / 2;
      }
  }

  var controllers = /*#__PURE__*/Object.freeze({
  __proto__: null,
  BarController: BarController,
  BubbleController: BubbleController,
  DoughnutController: DoughnutController,
  LineController: LineController,
  PolarAreaController: PolarAreaController,
  PieController: PieController,
  RadarController: RadarController,
  ScatterController: ScatterController
  });

  /**
   * @namespace Chart._adapters
   * @since 2.8.0
   * @private
   */ function abstract() {
      throw new Error('This method is not implemented: Check that a complete date adapter is provided.');
  }
  /**
   * Date adapter (current used by the time scale)
   * @namespace Chart._adapters._date
   * @memberof Chart._adapters
   * @private
   */ class DateAdapterBase {
      /**
     * Override default date adapter methods.
     * Accepts type parameter to define options type.
     * @example
     * Chart._adapters._date.override<{myAdapterOption: string}>({
     *   init() {
     *     console.log(this.options.myAdapterOption);
     *   }
     * })
     */ static override(members) {
          Object.assign(DateAdapterBase.prototype, members);
      }
      constructor(options){
          this.options = options || {};
      }
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      init() {}
      formats() {
          return abstract();
      }
      parse() {
          return abstract();
      }
      format() {
          return abstract();
      }
      add() {
          return abstract();
      }
      diff() {
          return abstract();
      }
      startOf() {
          return abstract();
      }
      endOf() {
          return abstract();
      }
  }
  var adapters = {
      _date: DateAdapterBase
  };

  function binarySearch(metaset, axis, value, intersect) {
      const { controller , data , _sorted  } = metaset;
      const iScale = controller._cachedMeta.iScale;
      if (iScale && axis === iScale.axis && axis !== 'r' && _sorted && data.length) {
          const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
          if (!intersect) {
              return lookupMethod(data, axis, value);
          } else if (controller._sharedOptions) {
              const el = data[0];
              const range = typeof el.getRange === 'function' && el.getRange(axis);
              if (range) {
                  const start = lookupMethod(data, axis, value - range);
                  const end = lookupMethod(data, axis, value + range);
                  return {
                      lo: start.lo,
                      hi: end.hi
                  };
              }
          }
      }
      return {
          lo: 0,
          hi: data.length - 1
      };
  }
   function evaluateInteractionItems(chart, axis, position, handler, intersect) {
      const metasets = chart.getSortedVisibleDatasetMetas();
      const value = position[axis];
      for(let i = 0, ilen = metasets.length; i < ilen; ++i){
          const { index , data  } = metasets[i];
          const { lo , hi  } = binarySearch(metasets[i], axis, value, intersect);
          for(let j = lo; j <= hi; ++j){
              const element = data[j];
              if (!element.skip) {
                  handler(element, index, j);
              }
          }
      }
  }
   function getDistanceMetricForAxis(axis) {
      const useX = axis.indexOf('x') !== -1;
      const useY = axis.indexOf('y') !== -1;
      return function(pt1, pt2) {
          const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
          const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
          return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
      };
  }
   function getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) {
      const items = [];
      if (!includeInvisible && !chart.isPointInArea(position)) {
          return items;
      }
      const evaluationFunc = function(element, datasetIndex, index) {
          if (!includeInvisible && !_isPointInArea(element, chart.chartArea, 0)) {
              return;
          }
          if (element.inRange(position.x, position.y, useFinalPosition)) {
              items.push({
                  element,
                  datasetIndex,
                  index
              });
          }
      };
      evaluateInteractionItems(chart, axis, position, evaluationFunc, true);
      return items;
  }
   function getNearestRadialItems(chart, position, axis, useFinalPosition) {
      let items = [];
      function evaluationFunc(element, datasetIndex, index) {
          const { startAngle , endAngle  } = element.getProps([
              'startAngle',
              'endAngle'
          ], useFinalPosition);
          const { angle  } = getAngleFromPoint(element, {
              x: position.x,
              y: position.y
          });
          if (_angleBetween(angle, startAngle, endAngle)) {
              items.push({
                  element,
                  datasetIndex,
                  index
              });
          }
      }
      evaluateInteractionItems(chart, axis, position, evaluationFunc);
      return items;
  }
   function getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
      let items = [];
      const distanceMetric = getDistanceMetricForAxis(axis);
      let minDistance = Number.POSITIVE_INFINITY;
      function evaluationFunc(element, datasetIndex, index) {
          const inRange = element.inRange(position.x, position.y, useFinalPosition);
          if (intersect && !inRange) {
              return;
          }
          const center = element.getCenterPoint(useFinalPosition);
          const pointInArea = !!includeInvisible || chart.isPointInArea(center);
          if (!pointInArea && !inRange) {
              return;
          }
          const distance = distanceMetric(position, center);
          if (distance < minDistance) {
              items = [
                  {
                      element,
                      datasetIndex,
                      index
                  }
              ];
              minDistance = distance;
          } else if (distance === minDistance) {
              items.push({
                  element,
                  datasetIndex,
                  index
              });
          }
      }
      evaluateInteractionItems(chart, axis, position, evaluationFunc);
      return items;
  }
   function getNearestItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
      if (!includeInvisible && !chart.isPointInArea(position)) {
          return [];
      }
      return axis === 'r' && !intersect ? getNearestRadialItems(chart, position, axis, useFinalPosition) : getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible);
  }
   function getAxisItems(chart, position, axis, intersect, useFinalPosition) {
      const items = [];
      const rangeMethod = axis === 'x' ? 'inXRange' : 'inYRange';
      let intersectsItem = false;
      evaluateInteractionItems(chart, axis, position, (element, datasetIndex, index)=>{
          if (element[rangeMethod](position[axis], useFinalPosition)) {
              items.push({
                  element,
                  datasetIndex,
                  index
              });
              intersectsItem = intersectsItem || element.inRange(position.x, position.y, useFinalPosition);
          }
      });
      if (intersect && !intersectsItem) {
          return [];
      }
      return items;
  }
   var Interaction = {
      evaluateInteractionItems,
      modes: {
   index (chart, e, options, useFinalPosition) {
              const position = getRelativePosition(e, chart);
              const axis = options.axis || 'x';
              const includeInvisible = options.includeInvisible || false;
              const items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
              const elements = [];
              if (!items.length) {
                  return [];
              }
              chart.getSortedVisibleDatasetMetas().forEach((meta)=>{
                  const index = items[0].index;
                  const element = meta.data[index];
                  if (element && !element.skip) {
                      elements.push({
                          element,
                          datasetIndex: meta.index,
                          index
                      });
                  }
              });
              return elements;
          },
   dataset (chart, e, options, useFinalPosition) {
              const position = getRelativePosition(e, chart);
              const axis = options.axis || 'xy';
              const includeInvisible = options.includeInvisible || false;
              let items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
              if (items.length > 0) {
                  const datasetIndex = items[0].datasetIndex;
                  const data = chart.getDatasetMeta(datasetIndex).data;
                  items = [];
                  for(let i = 0; i < data.length; ++i){
                      items.push({
                          element: data[i],
                          datasetIndex,
                          index: i
                      });
                  }
              }
              return items;
          },
   point (chart, e, options, useFinalPosition) {
              const position = getRelativePosition(e, chart);
              const axis = options.axis || 'xy';
              const includeInvisible = options.includeInvisible || false;
              return getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible);
          },
   nearest (chart, e, options, useFinalPosition) {
              const position = getRelativePosition(e, chart);
              const axis = options.axis || 'xy';
              const includeInvisible = options.includeInvisible || false;
              return getNearestItems(chart, position, axis, options.intersect, useFinalPosition, includeInvisible);
          },
   x (chart, e, options, useFinalPosition) {
              const position = getRelativePosition(e, chart);
              return getAxisItems(chart, position, 'x', options.intersect, useFinalPosition);
          },
   y (chart, e, options, useFinalPosition) {
              const position = getRelativePosition(e, chart);
              return getAxisItems(chart, position, 'y', options.intersect, useFinalPosition);
          }
      }
  };

  const STATIC_POSITIONS = [
      'left',
      'top',
      'right',
      'bottom'
  ];
  function filterByPosition(array, position) {
      return array.filter((v)=>v.pos === position);
  }
  function filterDynamicPositionByAxis(array, axis) {
      return array.filter((v)=>STATIC_POSITIONS.indexOf(v.pos) === -1 && v.box.axis === axis);
  }
  function sortByWeight(array, reverse) {
      return array.sort((a, b)=>{
          const v0 = reverse ? b : a;
          const v1 = reverse ? a : b;
          return v0.weight === v1.weight ? v0.index - v1.index : v0.weight - v1.weight;
      });
  }
  function wrapBoxes(boxes) {
      const layoutBoxes = [];
      let i, ilen, box, pos, stack, stackWeight;
      for(i = 0, ilen = (boxes || []).length; i < ilen; ++i){
          box = boxes[i];
          ({ position: pos , options: { stack , stackWeight =1  }  } = box);
          layoutBoxes.push({
              index: i,
              box,
              pos,
              horizontal: box.isHorizontal(),
              weight: box.weight,
              stack: stack && pos + stack,
              stackWeight
          });
      }
      return layoutBoxes;
  }
  function buildStacks(layouts) {
      const stacks = {};
      for (const wrap of layouts){
          const { stack , pos , stackWeight  } = wrap;
          if (!stack || !STATIC_POSITIONS.includes(pos)) {
              continue;
          }
          const _stack = stacks[stack] || (stacks[stack] = {
              count: 0,
              placed: 0,
              weight: 0,
              size: 0
          });
          _stack.count++;
          _stack.weight += stackWeight;
      }
      return stacks;
  }
   function setLayoutDims(layouts, params) {
      const stacks = buildStacks(layouts);
      const { vBoxMaxWidth , hBoxMaxHeight  } = params;
      let i, ilen, layout;
      for(i = 0, ilen = layouts.length; i < ilen; ++i){
          layout = layouts[i];
          const { fullSize  } = layout.box;
          const stack = stacks[layout.stack];
          const factor = stack && layout.stackWeight / stack.weight;
          if (layout.horizontal) {
              layout.width = factor ? factor * vBoxMaxWidth : fullSize && params.availableWidth;
              layout.height = hBoxMaxHeight;
          } else {
              layout.width = vBoxMaxWidth;
              layout.height = factor ? factor * hBoxMaxHeight : fullSize && params.availableHeight;
          }
      }
      return stacks;
  }
  function buildLayoutBoxes(boxes) {
      const layoutBoxes = wrapBoxes(boxes);
      const fullSize = sortByWeight(layoutBoxes.filter((wrap)=>wrap.box.fullSize), true);
      const left = sortByWeight(filterByPosition(layoutBoxes, 'left'), true);
      const right = sortByWeight(filterByPosition(layoutBoxes, 'right'));
      const top = sortByWeight(filterByPosition(layoutBoxes, 'top'), true);
      const bottom = sortByWeight(filterByPosition(layoutBoxes, 'bottom'));
      const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, 'x');
      const centerVertical = filterDynamicPositionByAxis(layoutBoxes, 'y');
      return {
          fullSize,
          leftAndTop: left.concat(top),
          rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
          chartArea: filterByPosition(layoutBoxes, 'chartArea'),
          vertical: left.concat(right).concat(centerVertical),
          horizontal: top.concat(bottom).concat(centerHorizontal)
      };
  }
  function getCombinedMax(maxPadding, chartArea, a, b) {
      return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
  }
  function updateMaxPadding(maxPadding, boxPadding) {
      maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
      maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
      maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
      maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
  }
  function updateDims(chartArea, params, layout, stacks) {
      const { pos , box  } = layout;
      const maxPadding = chartArea.maxPadding;
      if (!isObject(pos)) {
          if (layout.size) {
              chartArea[pos] -= layout.size;
          }
          const stack = stacks[layout.stack] || {
              size: 0,
              count: 1
          };
          stack.size = Math.max(stack.size, layout.horizontal ? box.height : box.width);
          layout.size = stack.size / stack.count;
          chartArea[pos] += layout.size;
      }
      if (box.getPadding) {
          updateMaxPadding(maxPadding, box.getPadding());
      }
      const newWidth = Math.max(0, params.outerWidth - getCombinedMax(maxPadding, chartArea, 'left', 'right'));
      const newHeight = Math.max(0, params.outerHeight - getCombinedMax(maxPadding, chartArea, 'top', 'bottom'));
      const widthChanged = newWidth !== chartArea.w;
      const heightChanged = newHeight !== chartArea.h;
      chartArea.w = newWidth;
      chartArea.h = newHeight;
      return layout.horizontal ? {
          same: widthChanged,
          other: heightChanged
      } : {
          same: heightChanged,
          other: widthChanged
      };
  }
  function handleMaxPadding(chartArea) {
      const maxPadding = chartArea.maxPadding;
      function updatePos(pos) {
          const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
          chartArea[pos] += change;
          return change;
      }
      chartArea.y += updatePos('top');
      chartArea.x += updatePos('left');
      updatePos('right');
      updatePos('bottom');
  }
  function getMargins(horizontal, chartArea) {
      const maxPadding = chartArea.maxPadding;
      function marginForPositions(positions) {
          const margin = {
              left: 0,
              top: 0,
              right: 0,
              bottom: 0
          };
          positions.forEach((pos)=>{
              margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
          });
          return margin;
      }
      return horizontal ? marginForPositions([
          'left',
          'right'
      ]) : marginForPositions([
          'top',
          'bottom'
      ]);
  }
  function fitBoxes(boxes, chartArea, params, stacks) {
      const refitBoxes = [];
      let i, ilen, layout, box, refit, changed;
      for(i = 0, ilen = boxes.length, refit = 0; i < ilen; ++i){
          layout = boxes[i];
          box = layout.box;
          box.update(layout.width || chartArea.w, layout.height || chartArea.h, getMargins(layout.horizontal, chartArea));
          const { same , other  } = updateDims(chartArea, params, layout, stacks);
          refit |= same && refitBoxes.length;
          changed = changed || other;
          if (!box.fullSize) {
              refitBoxes.push(layout);
          }
      }
      return refit && fitBoxes(refitBoxes, chartArea, params, stacks) || changed;
  }
  function setBoxDims(box, left, top, width, height) {
      box.top = top;
      box.left = left;
      box.right = left + width;
      box.bottom = top + height;
      box.width = width;
      box.height = height;
  }
  function placeBoxes(boxes, chartArea, params, stacks) {
      const userPadding = params.padding;
      let { x , y  } = chartArea;
      for (const layout of boxes){
          const box = layout.box;
          const stack = stacks[layout.stack] || {
              count: 1,
              placed: 0,
              weight: 1
          };
          const weight = layout.stackWeight / stack.weight || 1;
          if (layout.horizontal) {
              const width = chartArea.w * weight;
              const height = stack.size || box.height;
              if (defined(stack.start)) {
                  y = stack.start;
              }
              if (box.fullSize) {
                  setBoxDims(box, userPadding.left, y, params.outerWidth - userPadding.right - userPadding.left, height);
              } else {
                  setBoxDims(box, chartArea.left + stack.placed, y, width, height);
              }
              stack.start = y;
              stack.placed += width;
              y = box.bottom;
          } else {
              const height1 = chartArea.h * weight;
              const width1 = stack.size || box.width;
              if (defined(stack.start)) {
                  x = stack.start;
              }
              if (box.fullSize) {
                  setBoxDims(box, x, userPadding.top, width1, params.outerHeight - userPadding.bottom - userPadding.top);
              } else {
                  setBoxDims(box, x, chartArea.top + stack.placed, width1, height1);
              }
              stack.start = x;
              stack.placed += height1;
              x = box.right;
          }
      }
      chartArea.x = x;
      chartArea.y = y;
  }
  var layouts = {
   addBox (chart, item) {
          if (!chart.boxes) {
              chart.boxes = [];
          }
          item.fullSize = item.fullSize || false;
          item.position = item.position || 'top';
          item.weight = item.weight || 0;
          item._layers = item._layers || function() {
              return [
                  {
                      z: 0,
                      draw (chartArea) {
                          item.draw(chartArea);
                      }
                  }
              ];
          };
          chart.boxes.push(item);
      },
   removeBox (chart, layoutItem) {
          const index = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
          if (index !== -1) {
              chart.boxes.splice(index, 1);
          }
      },
   configure (chart, item, options) {
          item.fullSize = options.fullSize;
          item.position = options.position;
          item.weight = options.weight;
      },
   update (chart, width, height, minPadding) {
          if (!chart) {
              return;
          }
          const padding = toPadding(chart.options.layout.padding);
          const availableWidth = Math.max(width - padding.width, 0);
          const availableHeight = Math.max(height - padding.height, 0);
          const boxes = buildLayoutBoxes(chart.boxes);
          const verticalBoxes = boxes.vertical;
          const horizontalBoxes = boxes.horizontal;
          each(chart.boxes, (box)=>{
              if (typeof box.beforeLayout === 'function') {
                  box.beforeLayout();
              }
          });
          const visibleVerticalBoxCount = verticalBoxes.reduce((total, wrap)=>wrap.box.options && wrap.box.options.display === false ? total : total + 1, 0) || 1;
          const params = Object.freeze({
              outerWidth: width,
              outerHeight: height,
              padding,
              availableWidth,
              availableHeight,
              vBoxMaxWidth: availableWidth / 2 / visibleVerticalBoxCount,
              hBoxMaxHeight: availableHeight / 2
          });
          const maxPadding = Object.assign({}, padding);
          updateMaxPadding(maxPadding, toPadding(minPadding));
          const chartArea = Object.assign({
              maxPadding,
              w: availableWidth,
              h: availableHeight,
              x: padding.left,
              y: padding.top
          }, padding);
          const stacks = setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
          fitBoxes(boxes.fullSize, chartArea, params, stacks);
          fitBoxes(verticalBoxes, chartArea, params, stacks);
          if (fitBoxes(horizontalBoxes, chartArea, params, stacks)) {
              fitBoxes(verticalBoxes, chartArea, params, stacks);
          }
          handleMaxPadding(chartArea);
          placeBoxes(boxes.leftAndTop, chartArea, params, stacks);
          chartArea.x += chartArea.w;
          chartArea.y += chartArea.h;
          placeBoxes(boxes.rightAndBottom, chartArea, params, stacks);
          chart.chartArea = {
              left: chartArea.left,
              top: chartArea.top,
              right: chartArea.left + chartArea.w,
              bottom: chartArea.top + chartArea.h,
              height: chartArea.h,
              width: chartArea.w
          };
          each(boxes.chartArea, (layout)=>{
              const box = layout.box;
              Object.assign(box, chart.chartArea);
              box.update(chartArea.w, chartArea.h, {
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0
              });
          });
      }
  };

  class BasePlatform {
   acquireContext(canvas, aspectRatio) {}
   releaseContext(context) {
          return false;
      }
   addEventListener(chart, type, listener) {}
   removeEventListener(chart, type, listener) {}
   getDevicePixelRatio() {
          return 1;
      }
   getMaximumSize(element, width, height, aspectRatio) {
          width = Math.max(0, width || element.width);
          height = height || element.height;
          return {
              width,
              height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
          };
      }
   isAttached(canvas) {
          return true;
      }
   updateConfig(config) {
      }
  }

  class BasicPlatform extends BasePlatform {
      acquireContext(item) {
          return item && item.getContext && item.getContext('2d') || null;
      }
      updateConfig(config) {
          config.options.animation = false;
      }
  }

  const EXPANDO_KEY = '$chartjs';
   const EVENT_TYPES = {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup',
      pointerenter: 'mouseenter',
      pointerdown: 'mousedown',
      pointermove: 'mousemove',
      pointerup: 'mouseup',
      pointerleave: 'mouseout',
      pointerout: 'mouseout'
  };
  const isNullOrEmpty = (value)=>value === null || value === '';
   function initCanvas(canvas, aspectRatio) {
      const style = canvas.style;
      const renderHeight = canvas.getAttribute('height');
      const renderWidth = canvas.getAttribute('width');
      canvas[EXPANDO_KEY] = {
          initial: {
              height: renderHeight,
              width: renderWidth,
              style: {
                  display: style.display,
                  height: style.height,
                  width: style.width
              }
          }
      };
      style.display = style.display || 'block';
      style.boxSizing = style.boxSizing || 'border-box';
      if (isNullOrEmpty(renderWidth)) {
          const displayWidth = readUsedSize(canvas, 'width');
          if (displayWidth !== undefined) {
              canvas.width = displayWidth;
          }
      }
      if (isNullOrEmpty(renderHeight)) {
          if (canvas.style.height === '') {
              canvas.height = canvas.width / (aspectRatio || 2);
          } else {
              const displayHeight = readUsedSize(canvas, 'height');
              if (displayHeight !== undefined) {
                  canvas.height = displayHeight;
              }
          }
      }
      return canvas;
  }
  const eventListenerOptions = supportsEventListenerOptions ? {
      passive: true
  } : false;
  function addListener(node, type, listener) {
      node.addEventListener(type, listener, eventListenerOptions);
  }
  function removeListener(chart, type, listener) {
      chart.canvas.removeEventListener(type, listener, eventListenerOptions);
  }
  function fromNativeEvent(event, chart) {
      const type = EVENT_TYPES[event.type] || event.type;
      const { x , y  } = getRelativePosition(event, chart);
      return {
          type,
          chart,
          native: event,
          x: x !== undefined ? x : null,
          y: y !== undefined ? y : null
      };
  }
  function nodeListContains(nodeList, canvas) {
      for (const node of nodeList){
          if (node === canvas || node.contains(canvas)) {
              return true;
          }
      }
  }
  function createAttachObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const observer = new MutationObserver((entries)=>{
          let trigger = false;
          for (const entry of entries){
              trigger = trigger || nodeListContains(entry.addedNodes, canvas);
              trigger = trigger && !nodeListContains(entry.removedNodes, canvas);
          }
          if (trigger) {
              listener();
          }
      });
      observer.observe(document, {
          childList: true,
          subtree: true
      });
      return observer;
  }
  function createDetachObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const observer = new MutationObserver((entries)=>{
          let trigger = false;
          for (const entry of entries){
              trigger = trigger || nodeListContains(entry.removedNodes, canvas);
              trigger = trigger && !nodeListContains(entry.addedNodes, canvas);
          }
          if (trigger) {
              listener();
          }
      });
      observer.observe(document, {
          childList: true,
          subtree: true
      });
      return observer;
  }
  const drpListeningCharts = new Map();
  let oldDevicePixelRatio = 0;
  function onWindowResize() {
      const dpr = window.devicePixelRatio;
      if (dpr === oldDevicePixelRatio) {
          return;
      }
      oldDevicePixelRatio = dpr;
      drpListeningCharts.forEach((resize, chart)=>{
          if (chart.currentDevicePixelRatio !== dpr) {
              resize();
          }
      });
  }
  function listenDevicePixelRatioChanges(chart, resize) {
      if (!drpListeningCharts.size) {
          window.addEventListener('resize', onWindowResize);
      }
      drpListeningCharts.set(chart, resize);
  }
  function unlistenDevicePixelRatioChanges(chart) {
      drpListeningCharts.delete(chart);
      if (!drpListeningCharts.size) {
          window.removeEventListener('resize', onWindowResize);
      }
  }
  function createResizeObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const container = canvas && _getParentNode(canvas);
      if (!container) {
          return;
      }
      const resize = throttled((width, height)=>{
          const w = container.clientWidth;
          listener(width, height);
          if (w < container.clientWidth) {
              listener();
          }
      }, window);
      const observer = new ResizeObserver((entries)=>{
          const entry = entries[0];
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;
          if (width === 0 && height === 0) {
              return;
          }
          resize(width, height);
      });
      observer.observe(container);
      listenDevicePixelRatioChanges(chart, resize);
      return observer;
  }
  function releaseObserver(chart, type, observer) {
      if (observer) {
          observer.disconnect();
      }
      if (type === 'resize') {
          unlistenDevicePixelRatioChanges(chart);
      }
  }
  function createProxyAndListen(chart, type, listener) {
      const canvas = chart.canvas;
      const proxy = throttled((event)=>{
          if (chart.ctx !== null) {
              listener(fromNativeEvent(event, chart));
          }
      }, chart);
      addListener(canvas, type, proxy);
      return proxy;
  }
   class DomPlatform extends BasePlatform {
   acquireContext(canvas, aspectRatio) {
          const context = canvas && canvas.getContext && canvas.getContext('2d');
          if (context && context.canvas === canvas) {
              initCanvas(canvas, aspectRatio);
              return context;
          }
          return null;
      }
   releaseContext(context) {
          const canvas = context.canvas;
          if (!canvas[EXPANDO_KEY]) {
              return false;
          }
          const initial = canvas[EXPANDO_KEY].initial;
          [
              'height',
              'width'
          ].forEach((prop)=>{
              const value = initial[prop];
              if (isNullOrUndef(value)) {
                  canvas.removeAttribute(prop);
              } else {
                  canvas.setAttribute(prop, value);
              }
          });
          const style = initial.style || {};
          Object.keys(style).forEach((key)=>{
              canvas.style[key] = style[key];
          });
          canvas.width = canvas.width;
          delete canvas[EXPANDO_KEY];
          return true;
      }
   addEventListener(chart, type, listener) {
          this.removeEventListener(chart, type);
          const proxies = chart.$proxies || (chart.$proxies = {});
          const handlers = {
              attach: createAttachObserver,
              detach: createDetachObserver,
              resize: createResizeObserver
          };
          const handler = handlers[type] || createProxyAndListen;
          proxies[type] = handler(chart, type, listener);
      }
   removeEventListener(chart, type) {
          const proxies = chart.$proxies || (chart.$proxies = {});
          const proxy = proxies[type];
          if (!proxy) {
              return;
          }
          const handlers = {
              attach: releaseObserver,
              detach: releaseObserver,
              resize: releaseObserver
          };
          const handler = handlers[type] || removeListener;
          handler(chart, type, proxy);
          proxies[type] = undefined;
      }
      getDevicePixelRatio() {
          return window.devicePixelRatio;
      }
   getMaximumSize(canvas, width, height, aspectRatio) {
          return getMaximumSize(canvas, width, height, aspectRatio);
      }
   isAttached(canvas) {
          const container = _getParentNode(canvas);
          return !!(container && container.isConnected);
      }
  }

  function _detectPlatform(canvas) {
      if (!_isDomSupported() || typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
          return BasicPlatform;
      }
      return DomPlatform;
  }

  class Element {
      static defaults = {};
      static defaultRoutes = undefined;
      active = false;
      tooltipPosition(useFinalPosition) {
          const { x , y  } = this.getProps([
              'x',
              'y'
          ], useFinalPosition);
          return {
              x,
              y
          };
      }
      hasValue() {
          return isNumber(this.x) && isNumber(this.y);
      }
      getProps(props, final) {
          const anims = this.$animations;
          if (!final || !anims) {
              // let's not create an object, if not needed
              return this;
          }
          const ret = {};
          props.forEach((prop)=>{
              ret[prop] = anims[prop] && anims[prop].active() ? anims[prop]._to : this[prop];
          });
          return ret;
      }
  }

  function autoSkip(scale, ticks) {
      const tickOpts = scale.options.ticks;
      const determinedMaxTicks = determineMaxTicks(scale);
      const ticksLimit = Math.min(tickOpts.maxTicksLimit || determinedMaxTicks, determinedMaxTicks);
      const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
      const numMajorIndices = majorIndices.length;
      const first = majorIndices[0];
      const last = majorIndices[numMajorIndices - 1];
      const newTicks = [];
      if (numMajorIndices > ticksLimit) {
          skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
          return newTicks;
      }
      const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
      if (numMajorIndices > 0) {
          let i, ilen;
          const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
          skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
          for(i = 0, ilen = numMajorIndices - 1; i < ilen; i++){
              skip(ticks, newTicks, spacing, majorIndices[i], majorIndices[i + 1]);
          }
          skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
          return newTicks;
      }
      skip(ticks, newTicks, spacing);
      return newTicks;
  }
  function determineMaxTicks(scale) {
      const offset = scale.options.offset;
      const tickLength = scale._tickSize();
      const maxScale = scale._length / tickLength + (offset ? 0 : 1);
      const maxChart = scale._maxLength / tickLength;
      return Math.floor(Math.min(maxScale, maxChart));
  }
   function calculateSpacing(majorIndices, ticks, ticksLimit) {
      const evenMajorSpacing = getEvenSpacing(majorIndices);
      const spacing = ticks.length / ticksLimit;
      if (!evenMajorSpacing) {
          return Math.max(spacing, 1);
      }
      const factors = _factorize(evenMajorSpacing);
      for(let i = 0, ilen = factors.length - 1; i < ilen; i++){
          const factor = factors[i];
          if (factor > spacing) {
              return factor;
          }
      }
      return Math.max(spacing, 1);
  }
   function getMajorIndices(ticks) {
      const result = [];
      let i, ilen;
      for(i = 0, ilen = ticks.length; i < ilen; i++){
          if (ticks[i].major) {
              result.push(i);
          }
      }
      return result;
  }
   function skipMajors(ticks, newTicks, majorIndices, spacing) {
      let count = 0;
      let next = majorIndices[0];
      let i;
      spacing = Math.ceil(spacing);
      for(i = 0; i < ticks.length; i++){
          if (i === next) {
              newTicks.push(ticks[i]);
              count++;
              next = majorIndices[count * spacing];
          }
      }
  }
   function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
      const start = valueOrDefault(majorStart, 0);
      const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
      let count = 0;
      let length, i, next;
      spacing = Math.ceil(spacing);
      if (majorEnd) {
          length = majorEnd - majorStart;
          spacing = length / Math.floor(length / spacing);
      }
      next = start;
      while(next < 0){
          count++;
          next = Math.round(start + count * spacing);
      }
      for(i = Math.max(start, 0); i < end; i++){
          if (i === next) {
              newTicks.push(ticks[i]);
              count++;
              next = Math.round(start + count * spacing);
          }
      }
  }
   function getEvenSpacing(arr) {
      const len = arr.length;
      let i, diff;
      if (len < 2) {
          return false;
      }
      for(diff = arr[0], i = 1; i < len; ++i){
          if (arr[i] - arr[i - 1] !== diff) {
              return false;
          }
      }
      return diff;
  }

  const reverseAlign = (align)=>align === 'left' ? 'right' : align === 'right' ? 'left' : align;
  const offsetFromEdge = (scale, edge, offset)=>edge === 'top' || edge === 'left' ? scale[edge] + offset : scale[edge] - offset;
   function sample(arr, numItems) {
      const result = [];
      const increment = arr.length / numItems;
      const len = arr.length;
      let i = 0;
      for(; i < len; i += increment){
          result.push(arr[Math.floor(i)]);
      }
      return result;
  }
   function getPixelForGridLine(scale, index, offsetGridLines) {
      const length = scale.ticks.length;
      const validIndex = Math.min(index, length - 1);
      const start = scale._startPixel;
      const end = scale._endPixel;
      const epsilon = 1e-6;
      let lineValue = scale.getPixelForTick(validIndex);
      let offset;
      if (offsetGridLines) {
          if (length === 1) {
              offset = Math.max(lineValue - start, end - lineValue);
          } else if (index === 0) {
              offset = (scale.getPixelForTick(1) - lineValue) / 2;
          } else {
              offset = (lineValue - scale.getPixelForTick(validIndex - 1)) / 2;
          }
          lineValue += validIndex < index ? offset : -offset;
          if (lineValue < start - epsilon || lineValue > end + epsilon) {
              return;
          }
      }
      return lineValue;
  }
   function garbageCollect(caches, length) {
      each(caches, (cache)=>{
          const gc = cache.gc;
          const gcLen = gc.length / 2;
          let i;
          if (gcLen > length) {
              for(i = 0; i < gcLen; ++i){
                  delete cache.data[gc[i]];
              }
              gc.splice(0, gcLen);
          }
      });
  }
   function getTickMarkLength(options) {
      return options.drawTicks ? options.tickLength : 0;
  }
   function getTitleHeight(options, fallback) {
      if (!options.display) {
          return 0;
      }
      const font = toFont(options.font, fallback);
      const padding = toPadding(options.padding);
      const lines = isArray(options.text) ? options.text.length : 1;
      return lines * font.lineHeight + padding.height;
  }
  function createScaleContext(parent, scale) {
      return createContext(parent, {
          scale,
          type: 'scale'
      });
  }
  function createTickContext(parent, index, tick) {
      return createContext(parent, {
          tick,
          index,
          type: 'tick'
      });
  }
  function titleAlign(align, position, reverse) {
      let ret = _toLeftRightCenter(align);
      if (reverse && position !== 'right' || !reverse && position === 'right') {
          ret = reverseAlign(ret);
      }
      return ret;
  }
  function titleArgs(scale, offset, position, align) {
      const { top , left , bottom , right , chart  } = scale;
      const { chartArea , scales  } = chart;
      let rotation = 0;
      let maxWidth, titleX, titleY;
      const height = bottom - top;
      const width = right - left;
      if (scale.isHorizontal()) {
          titleX = _alignStartEnd(align, left, right);
          if (isObject(position)) {
              const positionAxisID = Object.keys(position)[0];
              const value = position[positionAxisID];
              titleY = scales[positionAxisID].getPixelForValue(value) + height - offset;
          } else if (position === 'center') {
              titleY = (chartArea.bottom + chartArea.top) / 2 + height - offset;
          } else {
              titleY = offsetFromEdge(scale, position, offset);
          }
          maxWidth = right - left;
      } else {
          if (isObject(position)) {
              const positionAxisID1 = Object.keys(position)[0];
              const value1 = position[positionAxisID1];
              titleX = scales[positionAxisID1].getPixelForValue(value1) - width + offset;
          } else if (position === 'center') {
              titleX = (chartArea.left + chartArea.right) / 2 - width + offset;
          } else {
              titleX = offsetFromEdge(scale, position, offset);
          }
          titleY = _alignStartEnd(align, bottom, top);
          rotation = position === 'left' ? -HALF_PI : HALF_PI;
      }
      return {
          titleX,
          titleY,
          maxWidth,
          rotation
      };
  }
  class Scale extends Element {
      constructor(cfg){
          super();
           this.id = cfg.id;
           this.type = cfg.type;
           this.options = undefined;
           this.ctx = cfg.ctx;
           this.chart = cfg.chart;
           this.top = undefined;
           this.bottom = undefined;
           this.left = undefined;
           this.right = undefined;
           this.width = undefined;
           this.height = undefined;
          this._margins = {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
          };
           this.maxWidth = undefined;
           this.maxHeight = undefined;
           this.paddingTop = undefined;
           this.paddingBottom = undefined;
           this.paddingLeft = undefined;
           this.paddingRight = undefined;
           this.axis = undefined;
           this.labelRotation = undefined;
          this.min = undefined;
          this.max = undefined;
          this._range = undefined;
           this.ticks = [];
           this._gridLineItems = null;
           this._labelItems = null;
           this._labelSizes = null;
          this._length = 0;
          this._maxLength = 0;
          this._longestTextCache = {};
           this._startPixel = undefined;
           this._endPixel = undefined;
          this._reversePixels = false;
          this._userMax = undefined;
          this._userMin = undefined;
          this._suggestedMax = undefined;
          this._suggestedMin = undefined;
          this._ticksLength = 0;
          this._borderValue = 0;
          this._cache = {};
          this._dataLimitsCached = false;
          this.$context = undefined;
      }
   init(options) {
          this.options = options.setContext(this.getContext());
          this.axis = options.axis;
          this._userMin = this.parse(options.min);
          this._userMax = this.parse(options.max);
          this._suggestedMin = this.parse(options.suggestedMin);
          this._suggestedMax = this.parse(options.suggestedMax);
      }
   parse(raw, index) {
          return raw;
      }
   getUserBounds() {
          let { _userMin , _userMax , _suggestedMin , _suggestedMax  } = this;
          _userMin = finiteOrDefault(_userMin, Number.POSITIVE_INFINITY);
          _userMax = finiteOrDefault(_userMax, Number.NEGATIVE_INFINITY);
          _suggestedMin = finiteOrDefault(_suggestedMin, Number.POSITIVE_INFINITY);
          _suggestedMax = finiteOrDefault(_suggestedMax, Number.NEGATIVE_INFINITY);
          return {
              min: finiteOrDefault(_userMin, _suggestedMin),
              max: finiteOrDefault(_userMax, _suggestedMax),
              minDefined: isNumberFinite(_userMin),
              maxDefined: isNumberFinite(_userMax)
          };
      }
   getMinMax(canStack) {
          let { min , max , minDefined , maxDefined  } = this.getUserBounds();
          let range;
          if (minDefined && maxDefined) {
              return {
                  min,
                  max
              };
          }
          const metas = this.getMatchingVisibleMetas();
          for(let i = 0, ilen = metas.length; i < ilen; ++i){
              range = metas[i].controller.getMinMax(this, canStack);
              if (!minDefined) {
                  min = Math.min(min, range.min);
              }
              if (!maxDefined) {
                  max = Math.max(max, range.max);
              }
          }
          min = maxDefined && min > max ? max : min;
          max = minDefined && min > max ? min : max;
          return {
              min: finiteOrDefault(min, finiteOrDefault(max, min)),
              max: finiteOrDefault(max, finiteOrDefault(min, max))
          };
      }
   getPadding() {
          return {
              left: this.paddingLeft || 0,
              top: this.paddingTop || 0,
              right: this.paddingRight || 0,
              bottom: this.paddingBottom || 0
          };
      }
   getTicks() {
          return this.ticks;
      }
   getLabels() {
          const data = this.chart.data;
          return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
      }
   getLabelItems(chartArea = this.chart.chartArea) {
          const items = this._labelItems || (this._labelItems = this._computeLabelItems(chartArea));
          return items;
      }
      beforeLayout() {
          this._cache = {};
          this._dataLimitsCached = false;
      }
      beforeUpdate() {
          callback(this.options.beforeUpdate, [
              this
          ]);
      }
   update(maxWidth, maxHeight, margins) {
          const { beginAtZero , grace , ticks: tickOpts  } = this.options;
          const sampleSize = tickOpts.sampleSize;
          this.beforeUpdate();
          this.maxWidth = maxWidth;
          this.maxHeight = maxHeight;
          this._margins = margins = Object.assign({
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
          }, margins);
          this.ticks = null;
          this._labelSizes = null;
          this._gridLineItems = null;
          this._labelItems = null;
          this.beforeSetDimensions();
          this.setDimensions();
          this.afterSetDimensions();
          this._maxLength = this.isHorizontal() ? this.width + margins.left + margins.right : this.height + margins.top + margins.bottom;
          if (!this._dataLimitsCached) {
              this.beforeDataLimits();
              this.determineDataLimits();
              this.afterDataLimits();
              this._range = _addGrace(this, grace, beginAtZero);
              this._dataLimitsCached = true;
          }
          this.beforeBuildTicks();
          this.ticks = this.buildTicks() || [];
          this.afterBuildTicks();
          const samplingEnabled = sampleSize < this.ticks.length;
          this._convertTicksToLabels(samplingEnabled ? sample(this.ticks, sampleSize) : this.ticks);
          this.configure();
          this.beforeCalculateLabelRotation();
          this.calculateLabelRotation();
          this.afterCalculateLabelRotation();
          if (tickOpts.display && (tickOpts.autoSkip || tickOpts.source === 'auto')) {
              this.ticks = autoSkip(this, this.ticks);
              this._labelSizes = null;
              this.afterAutoSkip();
          }
          if (samplingEnabled) {
              this._convertTicksToLabels(this.ticks);
          }
          this.beforeFit();
          this.fit();
          this.afterFit();
          this.afterUpdate();
      }
   configure() {
          let reversePixels = this.options.reverse;
          let startPixel, endPixel;
          if (this.isHorizontal()) {
              startPixel = this.left;
              endPixel = this.right;
          } else {
              startPixel = this.top;
              endPixel = this.bottom;
              reversePixels = !reversePixels;
          }
          this._startPixel = startPixel;
          this._endPixel = endPixel;
          this._reversePixels = reversePixels;
          this._length = endPixel - startPixel;
          this._alignToPixels = this.options.alignToPixels;
      }
      afterUpdate() {
          callback(this.options.afterUpdate, [
              this
          ]);
      }
      beforeSetDimensions() {
          callback(this.options.beforeSetDimensions, [
              this
          ]);
      }
      setDimensions() {
          if (this.isHorizontal()) {
              this.width = this.maxWidth;
              this.left = 0;
              this.right = this.width;
          } else {
              this.height = this.maxHeight;
              this.top = 0;
              this.bottom = this.height;
          }
          this.paddingLeft = 0;
          this.paddingTop = 0;
          this.paddingRight = 0;
          this.paddingBottom = 0;
      }
      afterSetDimensions() {
          callback(this.options.afterSetDimensions, [
              this
          ]);
      }
      _callHooks(name) {
          this.chart.notifyPlugins(name, this.getContext());
          callback(this.options[name], [
              this
          ]);
      }
      beforeDataLimits() {
          this._callHooks('beforeDataLimits');
      }
      determineDataLimits() {}
      afterDataLimits() {
          this._callHooks('afterDataLimits');
      }
      beforeBuildTicks() {
          this._callHooks('beforeBuildTicks');
      }
   buildTicks() {
          return [];
      }
      afterBuildTicks() {
          this._callHooks('afterBuildTicks');
      }
      beforeTickToLabelConversion() {
          callback(this.options.beforeTickToLabelConversion, [
              this
          ]);
      }
   generateTickLabels(ticks) {
          const tickOpts = this.options.ticks;
          let i, ilen, tick;
          for(i = 0, ilen = ticks.length; i < ilen; i++){
              tick = ticks[i];
              tick.label = callback(tickOpts.callback, [
                  tick.value,
                  i,
                  ticks
              ], this);
          }
      }
      afterTickToLabelConversion() {
          callback(this.options.afterTickToLabelConversion, [
              this
          ]);
      }
      beforeCalculateLabelRotation() {
          callback(this.options.beforeCalculateLabelRotation, [
              this
          ]);
      }
      calculateLabelRotation() {
          const options = this.options;
          const tickOpts = options.ticks;
          const numTicks = this.ticks.length;
          const minRotation = tickOpts.minRotation || 0;
          const maxRotation = tickOpts.maxRotation;
          let labelRotation = minRotation;
          let tickWidth, maxHeight, maxLabelDiagonal;
          if (!this._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !this.isHorizontal()) {
              this.labelRotation = minRotation;
              return;
          }
          const labelSizes = this._getLabelSizes();
          const maxLabelWidth = labelSizes.widest.width;
          const maxLabelHeight = labelSizes.highest.height;
          const maxWidth = _limitValue(this.chart.width - maxLabelWidth, 0, this.maxWidth);
          tickWidth = options.offset ? this.maxWidth / numTicks : maxWidth / (numTicks - 1);
          if (maxLabelWidth + 6 > tickWidth) {
              tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
              maxHeight = this.maxHeight - getTickMarkLength(options.grid) - tickOpts.padding - getTitleHeight(options.title, this.chart.options.font);
              maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
              labelRotation = toDegrees(Math.min(Math.asin(_limitValue((labelSizes.highest.height + 6) / tickWidth, -1, 1)), Math.asin(_limitValue(maxHeight / maxLabelDiagonal, -1, 1)) - Math.asin(_limitValue(maxLabelHeight / maxLabelDiagonal, -1, 1))));
              labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
          }
          this.labelRotation = labelRotation;
      }
      afterCalculateLabelRotation() {
          callback(this.options.afterCalculateLabelRotation, [
              this
          ]);
      }
      afterAutoSkip() {}
      beforeFit() {
          callback(this.options.beforeFit, [
              this
          ]);
      }
      fit() {
          const minSize = {
              width: 0,
              height: 0
          };
          const { chart , options: { ticks: tickOpts , title: titleOpts , grid: gridOpts  }  } = this;
          const display = this._isVisible();
          const isHorizontal = this.isHorizontal();
          if (display) {
              const titleHeight = getTitleHeight(titleOpts, chart.options.font);
              if (isHorizontal) {
                  minSize.width = this.maxWidth;
                  minSize.height = getTickMarkLength(gridOpts) + titleHeight;
              } else {
                  minSize.height = this.maxHeight;
                  minSize.width = getTickMarkLength(gridOpts) + titleHeight;
              }
              if (tickOpts.display && this.ticks.length) {
                  const { first , last , widest , highest  } = this._getLabelSizes();
                  const tickPadding = tickOpts.padding * 2;
                  const angleRadians = toRadians(this.labelRotation);
                  const cos = Math.cos(angleRadians);
                  const sin = Math.sin(angleRadians);
                  if (isHorizontal) {
                      const labelHeight = tickOpts.mirror ? 0 : sin * widest.width + cos * highest.height;
                      minSize.height = Math.min(this.maxHeight, minSize.height + labelHeight + tickPadding);
                  } else {
                      const labelWidth = tickOpts.mirror ? 0 : cos * widest.width + sin * highest.height;
                      minSize.width = Math.min(this.maxWidth, minSize.width + labelWidth + tickPadding);
                  }
                  this._calculatePadding(first, last, sin, cos);
              }
          }
          this._handleMargins();
          if (isHorizontal) {
              this.width = this._length = chart.width - this._margins.left - this._margins.right;
              this.height = minSize.height;
          } else {
              this.width = minSize.width;
              this.height = this._length = chart.height - this._margins.top - this._margins.bottom;
          }
      }
      _calculatePadding(first, last, sin, cos) {
          const { ticks: { align , padding  } , position  } = this.options;
          const isRotated = this.labelRotation !== 0;
          const labelsBelowTicks = position !== 'top' && this.axis === 'x';
          if (this.isHorizontal()) {
              const offsetLeft = this.getPixelForTick(0) - this.left;
              const offsetRight = this.right - this.getPixelForTick(this.ticks.length - 1);
              let paddingLeft = 0;
              let paddingRight = 0;
              if (isRotated) {
                  if (labelsBelowTicks) {
                      paddingLeft = cos * first.width;
                      paddingRight = sin * last.height;
                  } else {
                      paddingLeft = sin * first.height;
                      paddingRight = cos * last.width;
                  }
              } else if (align === 'start') {
                  paddingRight = last.width;
              } else if (align === 'end') {
                  paddingLeft = first.width;
              } else if (align !== 'inner') {
                  paddingLeft = first.width / 2;
                  paddingRight = last.width / 2;
              }
              this.paddingLeft = Math.max((paddingLeft - offsetLeft + padding) * this.width / (this.width - offsetLeft), 0);
              this.paddingRight = Math.max((paddingRight - offsetRight + padding) * this.width / (this.width - offsetRight), 0);
          } else {
              let paddingTop = last.height / 2;
              let paddingBottom = first.height / 2;
              if (align === 'start') {
                  paddingTop = 0;
                  paddingBottom = first.height;
              } else if (align === 'end') {
                  paddingTop = last.height;
                  paddingBottom = 0;
              }
              this.paddingTop = paddingTop + padding;
              this.paddingBottom = paddingBottom + padding;
          }
      }
   _handleMargins() {
          if (this._margins) {
              this._margins.left = Math.max(this.paddingLeft, this._margins.left);
              this._margins.top = Math.max(this.paddingTop, this._margins.top);
              this._margins.right = Math.max(this.paddingRight, this._margins.right);
              this._margins.bottom = Math.max(this.paddingBottom, this._margins.bottom);
          }
      }
      afterFit() {
          callback(this.options.afterFit, [
              this
          ]);
      }
   isHorizontal() {
          const { axis , position  } = this.options;
          return position === 'top' || position === 'bottom' || axis === 'x';
      }
   isFullSize() {
          return this.options.fullSize;
      }
   _convertTicksToLabels(ticks) {
          this.beforeTickToLabelConversion();
          this.generateTickLabels(ticks);
          let i, ilen;
          for(i = 0, ilen = ticks.length; i < ilen; i++){
              if (isNullOrUndef(ticks[i].label)) {
                  ticks.splice(i, 1);
                  ilen--;
                  i--;
              }
          }
          this.afterTickToLabelConversion();
      }
   _getLabelSizes() {
          let labelSizes = this._labelSizes;
          if (!labelSizes) {
              const sampleSize = this.options.ticks.sampleSize;
              let ticks = this.ticks;
              if (sampleSize < ticks.length) {
                  ticks = sample(ticks, sampleSize);
              }
              this._labelSizes = labelSizes = this._computeLabelSizes(ticks, ticks.length);
          }
          return labelSizes;
      }
   _computeLabelSizes(ticks, length) {
          const { ctx , _longestTextCache: caches  } = this;
          const widths = [];
          const heights = [];
          let widestLabelSize = 0;
          let highestLabelSize = 0;
          let i, j, jlen, label, tickFont, fontString, cache, lineHeight, width, height, nestedLabel;
          for(i = 0; i < length; ++i){
              label = ticks[i].label;
              tickFont = this._resolveTickFontOptions(i);
              ctx.font = fontString = tickFont.string;
              cache = caches[fontString] = caches[fontString] || {
                  data: {},
                  gc: []
              };
              lineHeight = tickFont.lineHeight;
              width = height = 0;
              if (!isNullOrUndef(label) && !isArray(label)) {
                  width = _measureText(ctx, cache.data, cache.gc, width, label);
                  height = lineHeight;
              } else if (isArray(label)) {
                  for(j = 0, jlen = label.length; j < jlen; ++j){
                      nestedLabel = label[j];
                      if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
                          width = _measureText(ctx, cache.data, cache.gc, width, nestedLabel);
                          height += lineHeight;
                      }
                  }
              }
              widths.push(width);
              heights.push(height);
              widestLabelSize = Math.max(width, widestLabelSize);
              highestLabelSize = Math.max(height, highestLabelSize);
          }
          garbageCollect(caches, length);
          const widest = widths.indexOf(widestLabelSize);
          const highest = heights.indexOf(highestLabelSize);
          const valueAt = (idx)=>({
                  width: widths[idx] || 0,
                  height: heights[idx] || 0
              });
          return {
              first: valueAt(0),
              last: valueAt(length - 1),
              widest: valueAt(widest),
              highest: valueAt(highest),
              widths,
              heights
          };
      }
   getLabelForValue(value) {
          return value;
      }
   getPixelForValue(value, index) {
          return NaN;
      }
   getValueForPixel(pixel) {}
   getPixelForTick(index) {
          const ticks = this.ticks;
          if (index < 0 || index > ticks.length - 1) {
              return null;
          }
          return this.getPixelForValue(ticks[index].value);
      }
   getPixelForDecimal(decimal) {
          if (this._reversePixels) {
              decimal = 1 - decimal;
          }
          const pixel = this._startPixel + decimal * this._length;
          return _int16Range(this._alignToPixels ? _alignPixel(this.chart, pixel, 0) : pixel);
      }
   getDecimalForPixel(pixel) {
          const decimal = (pixel - this._startPixel) / this._length;
          return this._reversePixels ? 1 - decimal : decimal;
      }
   getBasePixel() {
          return this.getPixelForValue(this.getBaseValue());
      }
   getBaseValue() {
          const { min , max  } = this;
          return min < 0 && max < 0 ? max : min > 0 && max > 0 ? min : 0;
      }
   getContext(index) {
          const ticks = this.ticks || [];
          if (index >= 0 && index < ticks.length) {
              const tick = ticks[index];
              return tick.$context || (tick.$context = createTickContext(this.getContext(), index, tick));
          }
          return this.$context || (this.$context = createScaleContext(this.chart.getContext(), this));
      }
   _tickSize() {
          const optionTicks = this.options.ticks;
          const rot = toRadians(this.labelRotation);
          const cos = Math.abs(Math.cos(rot));
          const sin = Math.abs(Math.sin(rot));
          const labelSizes = this._getLabelSizes();
          const padding = optionTicks.autoSkipPadding || 0;
          const w = labelSizes ? labelSizes.widest.width + padding : 0;
          const h = labelSizes ? labelSizes.highest.height + padding : 0;
          return this.isHorizontal() ? h * cos > w * sin ? w / cos : h / sin : h * sin < w * cos ? h / cos : w / sin;
      }
   _isVisible() {
          const display = this.options.display;
          if (display !== 'auto') {
              return !!display;
          }
          return this.getMatchingVisibleMetas().length > 0;
      }
   _computeGridLineItems(chartArea) {
          const axis = this.axis;
          const chart = this.chart;
          const options = this.options;
          const { grid , position , border  } = options;
          const offset = grid.offset;
          const isHorizontal = this.isHorizontal();
          const ticks = this.ticks;
          const ticksLength = ticks.length + (offset ? 1 : 0);
          const tl = getTickMarkLength(grid);
          const items = [];
          const borderOpts = border.setContext(this.getContext());
          const axisWidth = borderOpts.display ? borderOpts.width : 0;
          const axisHalfWidth = axisWidth / 2;
          const alignBorderValue = function(pixel) {
              return _alignPixel(chart, pixel, axisWidth);
          };
          let borderValue, i, lineValue, alignedLineValue;
          let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
          if (position === 'top') {
              borderValue = alignBorderValue(this.bottom);
              ty1 = this.bottom - tl;
              ty2 = borderValue - axisHalfWidth;
              y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
              y2 = chartArea.bottom;
          } else if (position === 'bottom') {
              borderValue = alignBorderValue(this.top);
              y1 = chartArea.top;
              y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
              ty1 = borderValue + axisHalfWidth;
              ty2 = this.top + tl;
          } else if (position === 'left') {
              borderValue = alignBorderValue(this.right);
              tx1 = this.right - tl;
              tx2 = borderValue - axisHalfWidth;
              x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
              x2 = chartArea.right;
          } else if (position === 'right') {
              borderValue = alignBorderValue(this.left);
              x1 = chartArea.left;
              x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
              tx1 = borderValue + axisHalfWidth;
              tx2 = this.left + tl;
          } else if (axis === 'x') {
              if (position === 'center') {
                  borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
              } else if (isObject(position)) {
                  const positionAxisID = Object.keys(position)[0];
                  const value = position[positionAxisID];
                  borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
              }
              y1 = chartArea.top;
              y2 = chartArea.bottom;
              ty1 = borderValue + axisHalfWidth;
              ty2 = ty1 + tl;
          } else if (axis === 'y') {
              if (position === 'center') {
                  borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
              } else if (isObject(position)) {
                  const positionAxisID1 = Object.keys(position)[0];
                  const value1 = position[positionAxisID1];
                  borderValue = alignBorderValue(this.chart.scales[positionAxisID1].getPixelForValue(value1));
              }
              tx1 = borderValue - axisHalfWidth;
              tx2 = tx1 - tl;
              x1 = chartArea.left;
              x2 = chartArea.right;
          }
          const limit = valueOrDefault(options.ticks.maxTicksLimit, ticksLength);
          const step = Math.max(1, Math.ceil(ticksLength / limit));
          for(i = 0; i < ticksLength; i += step){
              const context = this.getContext(i);
              const optsAtIndex = grid.setContext(context);
              const optsAtIndexBorder = border.setContext(context);
              const lineWidth = optsAtIndex.lineWidth;
              const lineColor = optsAtIndex.color;
              const borderDash = optsAtIndexBorder.dash || [];
              const borderDashOffset = optsAtIndexBorder.dashOffset;
              const tickWidth = optsAtIndex.tickWidth;
              const tickColor = optsAtIndex.tickColor;
              const tickBorderDash = optsAtIndex.tickBorderDash || [];
              const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;
              lineValue = getPixelForGridLine(this, i, offset);
              if (lineValue === undefined) {
                  continue;
              }
              alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
              if (isHorizontal) {
                  tx1 = tx2 = x1 = x2 = alignedLineValue;
              } else {
                  ty1 = ty2 = y1 = y2 = alignedLineValue;
              }
              items.push({
                  tx1,
                  ty1,
                  tx2,
                  ty2,
                  x1,
                  y1,
                  x2,
                  y2,
                  width: lineWidth,
                  color: lineColor,
                  borderDash,
                  borderDashOffset,
                  tickWidth,
                  tickColor,
                  tickBorderDash,
                  tickBorderDashOffset
              });
          }
          this._ticksLength = ticksLength;
          this._borderValue = borderValue;
          return items;
      }
   _computeLabelItems(chartArea) {
          const axis = this.axis;
          const options = this.options;
          const { position , ticks: optionTicks  } = options;
          const isHorizontal = this.isHorizontal();
          const ticks = this.ticks;
          const { align , crossAlign , padding , mirror  } = optionTicks;
          const tl = getTickMarkLength(options.grid);
          const tickAndPadding = tl + padding;
          const hTickAndPadding = mirror ? -padding : tickAndPadding;
          const rotation = -toRadians(this.labelRotation);
          const items = [];
          let i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
          let textBaseline = 'middle';
          if (position === 'top') {
              y = this.bottom - hTickAndPadding;
              textAlign = this._getXAxisLabelAlignment();
          } else if (position === 'bottom') {
              y = this.top + hTickAndPadding;
              textAlign = this._getXAxisLabelAlignment();
          } else if (position === 'left') {
              const ret = this._getYAxisLabelAlignment(tl);
              textAlign = ret.textAlign;
              x = ret.x;
          } else if (position === 'right') {
              const ret1 = this._getYAxisLabelAlignment(tl);
              textAlign = ret1.textAlign;
              x = ret1.x;
          } else if (axis === 'x') {
              if (position === 'center') {
                  y = (chartArea.top + chartArea.bottom) / 2 + tickAndPadding;
              } else if (isObject(position)) {
                  const positionAxisID = Object.keys(position)[0];
                  const value = position[positionAxisID];
                  y = this.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
              }
              textAlign = this._getXAxisLabelAlignment();
          } else if (axis === 'y') {
              if (position === 'center') {
                  x = (chartArea.left + chartArea.right) / 2 - tickAndPadding;
              } else if (isObject(position)) {
                  const positionAxisID1 = Object.keys(position)[0];
                  const value1 = position[positionAxisID1];
                  x = this.chart.scales[positionAxisID1].getPixelForValue(value1);
              }
              textAlign = this._getYAxisLabelAlignment(tl).textAlign;
          }
          if (axis === 'y') {
              if (align === 'start') {
                  textBaseline = 'top';
              } else if (align === 'end') {
                  textBaseline = 'bottom';
              }
          }
          const labelSizes = this._getLabelSizes();
          for(i = 0, ilen = ticks.length; i < ilen; ++i){
              tick = ticks[i];
              label = tick.label;
              const optsAtIndex = optionTicks.setContext(this.getContext(i));
              pixel = this.getPixelForTick(i) + optionTicks.labelOffset;
              font = this._resolveTickFontOptions(i);
              lineHeight = font.lineHeight;
              lineCount = isArray(label) ? label.length : 1;
              const halfCount = lineCount / 2;
              const color = optsAtIndex.color;
              const strokeColor = optsAtIndex.textStrokeColor;
              const strokeWidth = optsAtIndex.textStrokeWidth;
              let tickTextAlign = textAlign;
              if (isHorizontal) {
                  x = pixel;
                  if (textAlign === 'inner') {
                      if (i === ilen - 1) {
                          tickTextAlign = !this.options.reverse ? 'right' : 'left';
                      } else if (i === 0) {
                          tickTextAlign = !this.options.reverse ? 'left' : 'right';
                      } else {
                          tickTextAlign = 'center';
                      }
                  }
                  if (position === 'top') {
                      if (crossAlign === 'near' || rotation !== 0) {
                          textOffset = -lineCount * lineHeight + lineHeight / 2;
                      } else if (crossAlign === 'center') {
                          textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
                      } else {
                          textOffset = -labelSizes.highest.height + lineHeight / 2;
                      }
                  } else {
                      if (crossAlign === 'near' || rotation !== 0) {
                          textOffset = lineHeight / 2;
                      } else if (crossAlign === 'center') {
                          textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
                      } else {
                          textOffset = labelSizes.highest.height - lineCount * lineHeight;
                      }
                  }
                  if (mirror) {
                      textOffset *= -1;
                  }
                  if (rotation !== 0 && !optsAtIndex.showLabelBackdrop) {
                      x += lineHeight / 2 * Math.sin(rotation);
                  }
              } else {
                  y = pixel;
                  textOffset = (1 - lineCount) * lineHeight / 2;
              }
              let backdrop;
              if (optsAtIndex.showLabelBackdrop) {
                  const labelPadding = toPadding(optsAtIndex.backdropPadding);
                  const height = labelSizes.heights[i];
                  const width = labelSizes.widths[i];
                  let top = textOffset - labelPadding.top;
                  let left = 0 - labelPadding.left;
                  switch(textBaseline){
                      case 'middle':
                          top -= height / 2;
                          break;
                      case 'bottom':
                          top -= height;
                          break;
                  }
                  switch(textAlign){
                      case 'center':
                          left -= width / 2;
                          break;
                      case 'right':
                          left -= width;
                          break;
                  }
                  backdrop = {
                      left,
                      top,
                      width: width + labelPadding.width,
                      height: height + labelPadding.height,
                      color: optsAtIndex.backdropColor
                  };
              }
              items.push({
                  label,
                  font,
                  textOffset,
                  options: {
                      rotation,
                      color,
                      strokeColor,
                      strokeWidth,
                      textAlign: tickTextAlign,
                      textBaseline,
                      translation: [
                          x,
                          y
                      ],
                      backdrop
                  }
              });
          }
          return items;
      }
      _getXAxisLabelAlignment() {
          const { position , ticks  } = this.options;
          const rotation = -toRadians(this.labelRotation);
          if (rotation) {
              return position === 'top' ? 'left' : 'right';
          }
          let align = 'center';
          if (ticks.align === 'start') {
              align = 'left';
          } else if (ticks.align === 'end') {
              align = 'right';
          } else if (ticks.align === 'inner') {
              align = 'inner';
          }
          return align;
      }
      _getYAxisLabelAlignment(tl) {
          const { position , ticks: { crossAlign , mirror , padding  }  } = this.options;
          const labelSizes = this._getLabelSizes();
          const tickAndPadding = tl + padding;
          const widest = labelSizes.widest.width;
          let textAlign;
          let x;
          if (position === 'left') {
              if (mirror) {
                  x = this.right + padding;
                  if (crossAlign === 'near') {
                      textAlign = 'left';
                  } else if (crossAlign === 'center') {
                      textAlign = 'center';
                      x += widest / 2;
                  } else {
                      textAlign = 'right';
                      x += widest;
                  }
              } else {
                  x = this.right - tickAndPadding;
                  if (crossAlign === 'near') {
                      textAlign = 'right';
                  } else if (crossAlign === 'center') {
                      textAlign = 'center';
                      x -= widest / 2;
                  } else {
                      textAlign = 'left';
                      x = this.left;
                  }
              }
          } else if (position === 'right') {
              if (mirror) {
                  x = this.left + padding;
                  if (crossAlign === 'near') {
                      textAlign = 'right';
                  } else if (crossAlign === 'center') {
                      textAlign = 'center';
                      x -= widest / 2;
                  } else {
                      textAlign = 'left';
                      x -= widest;
                  }
              } else {
                  x = this.left + tickAndPadding;
                  if (crossAlign === 'near') {
                      textAlign = 'left';
                  } else if (crossAlign === 'center') {
                      textAlign = 'center';
                      x += widest / 2;
                  } else {
                      textAlign = 'right';
                      x = this.right;
                  }
              }
          } else {
              textAlign = 'right';
          }
          return {
              textAlign,
              x
          };
      }
   _computeLabelArea() {
          if (this.options.ticks.mirror) {
              return;
          }
          const chart = this.chart;
          const position = this.options.position;
          if (position === 'left' || position === 'right') {
              return {
                  top: 0,
                  left: this.left,
                  bottom: chart.height,
                  right: this.right
              };
          }
          if (position === 'top' || position === 'bottom') {
              return {
                  top: this.top,
                  left: 0,
                  bottom: this.bottom,
                  right: chart.width
              };
          }
      }
   drawBackground() {
          const { ctx , options: { backgroundColor  } , left , top , width , height  } = this;
          if (backgroundColor) {
              ctx.save();
              ctx.fillStyle = backgroundColor;
              ctx.fillRect(left, top, width, height);
              ctx.restore();
          }
      }
      getLineWidthForValue(value) {
          const grid = this.options.grid;
          if (!this._isVisible() || !grid.display) {
              return 0;
          }
          const ticks = this.ticks;
          const index = ticks.findIndex((t)=>t.value === value);
          if (index >= 0) {
              const opts = grid.setContext(this.getContext(index));
              return opts.lineWidth;
          }
          return 0;
      }
   drawGrid(chartArea) {
          const grid = this.options.grid;
          const ctx = this.ctx;
          const items = this._gridLineItems || (this._gridLineItems = this._computeGridLineItems(chartArea));
          let i, ilen;
          const drawLine = (p1, p2, style)=>{
              if (!style.width || !style.color) {
                  return;
              }
              ctx.save();
              ctx.lineWidth = style.width;
              ctx.strokeStyle = style.color;
              ctx.setLineDash(style.borderDash || []);
              ctx.lineDashOffset = style.borderDashOffset;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
              ctx.restore();
          };
          if (grid.display) {
              for(i = 0, ilen = items.length; i < ilen; ++i){
                  const item = items[i];
                  if (grid.drawOnChartArea) {
                      drawLine({
                          x: item.x1,
                          y: item.y1
                      }, {
                          x: item.x2,
                          y: item.y2
                      }, item);
                  }
                  if (grid.drawTicks) {
                      drawLine({
                          x: item.tx1,
                          y: item.ty1
                      }, {
                          x: item.tx2,
                          y: item.ty2
                      }, {
                          color: item.tickColor,
                          width: item.tickWidth,
                          borderDash: item.tickBorderDash,
                          borderDashOffset: item.tickBorderDashOffset
                      });
                  }
              }
          }
      }
   drawBorder() {
          const { chart , ctx , options: { border , grid  }  } = this;
          const borderOpts = border.setContext(this.getContext());
          const axisWidth = border.display ? borderOpts.width : 0;
          if (!axisWidth) {
              return;
          }
          const lastLineWidth = grid.setContext(this.getContext(0)).lineWidth;
          const borderValue = this._borderValue;
          let x1, x2, y1, y2;
          if (this.isHorizontal()) {
              x1 = _alignPixel(chart, this.left, axisWidth) - axisWidth / 2;
              x2 = _alignPixel(chart, this.right, lastLineWidth) + lastLineWidth / 2;
              y1 = y2 = borderValue;
          } else {
              y1 = _alignPixel(chart, this.top, axisWidth) - axisWidth / 2;
              y2 = _alignPixel(chart, this.bottom, lastLineWidth) + lastLineWidth / 2;
              x1 = x2 = borderValue;
          }
          ctx.save();
          ctx.lineWidth = borderOpts.width;
          ctx.strokeStyle = borderOpts.color;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.restore();
      }
   drawLabels(chartArea) {
          const optionTicks = this.options.ticks;
          if (!optionTicks.display) {
              return;
          }
          const ctx = this.ctx;
          const area = this._computeLabelArea();
          if (area) {
              clipArea(ctx, area);
          }
          const items = this.getLabelItems(chartArea);
          for (const item of items){
              const renderTextOptions = item.options;
              const tickFont = item.font;
              const label = item.label;
              const y = item.textOffset;
              renderText(ctx, label, 0, y, tickFont, renderTextOptions);
          }
          if (area) {
              unclipArea(ctx);
          }
      }
   drawTitle() {
          const { ctx , options: { position , title , reverse  }  } = this;
          if (!title.display) {
              return;
          }
          const font = toFont(title.font);
          const padding = toPadding(title.padding);
          const align = title.align;
          let offset = font.lineHeight / 2;
          if (position === 'bottom' || position === 'center' || isObject(position)) {
              offset += padding.bottom;
              if (isArray(title.text)) {
                  offset += font.lineHeight * (title.text.length - 1);
              }
          } else {
              offset += padding.top;
          }
          const { titleX , titleY , maxWidth , rotation  } = titleArgs(this, offset, position, align);
          renderText(ctx, title.text, 0, 0, font, {
              color: title.color,
              maxWidth,
              rotation,
              textAlign: titleAlign(align, position, reverse),
              textBaseline: 'middle',
              translation: [
                  titleX,
                  titleY
              ]
          });
      }
      draw(chartArea) {
          if (!this._isVisible()) {
              return;
          }
          this.drawBackground();
          this.drawGrid(chartArea);
          this.drawBorder();
          this.drawTitle();
          this.drawLabels(chartArea);
      }
   _layers() {
          const opts = this.options;
          const tz = opts.ticks && opts.ticks.z || 0;
          const gz = valueOrDefault(opts.grid && opts.grid.z, -1);
          const bz = valueOrDefault(opts.border && opts.border.z, 0);
          if (!this._isVisible() || this.draw !== Scale.prototype.draw) {
              return [
                  {
                      z: tz,
                      draw: (chartArea)=>{
                          this.draw(chartArea);
                      }
                  }
              ];
          }
          return [
              {
                  z: gz,
                  draw: (chartArea)=>{
                      this.drawBackground();
                      this.drawGrid(chartArea);
                      this.drawTitle();
                  }
              },
              {
                  z: bz,
                  draw: ()=>{
                      this.drawBorder();
                  }
              },
              {
                  z: tz,
                  draw: (chartArea)=>{
                      this.drawLabels(chartArea);
                  }
              }
          ];
      }
   getMatchingVisibleMetas(type) {
          const metas = this.chart.getSortedVisibleDatasetMetas();
          const axisID = this.axis + 'AxisID';
          const result = [];
          let i, ilen;
          for(i = 0, ilen = metas.length; i < ilen; ++i){
              const meta = metas[i];
              if (meta[axisID] === this.id && (!type || meta.type === type)) {
                  result.push(meta);
              }
          }
          return result;
      }
   _resolveTickFontOptions(index) {
          const opts = this.options.ticks.setContext(this.getContext(index));
          return toFont(opts.font);
      }
   _maxDigits() {
          const fontSize = this._resolveTickFontOptions(0).lineHeight;
          return (this.isHorizontal() ? this.width : this.height) / fontSize;
      }
  }

  class TypedRegistry {
      constructor(type, scope, override){
          this.type = type;
          this.scope = scope;
          this.override = override;
          this.items = Object.create(null);
      }
      isForType(type) {
          return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
      }
   register(item) {
          const proto = Object.getPrototypeOf(item);
          let parentScope;
          if (isIChartComponent(proto)) {
              parentScope = this.register(proto);
          }
          const items = this.items;
          const id = item.id;
          const scope = this.scope + '.' + id;
          if (!id) {
              throw new Error('class does not have id: ' + item);
          }
          if (id in items) {
              return scope;
          }
          items[id] = item;
          registerDefaults(item, scope, parentScope);
          if (this.override) {
              defaults.override(item.id, item.overrides);
          }
          return scope;
      }
   get(id) {
          return this.items[id];
      }
   unregister(item) {
          const items = this.items;
          const id = item.id;
          const scope = this.scope;
          if (id in items) {
              delete items[id];
          }
          if (scope && id in defaults[scope]) {
              delete defaults[scope][id];
              if (this.override) {
                  delete overrides[id];
              }
          }
      }
  }
  function registerDefaults(item, scope, parentScope) {
      const itemDefaults = merge(Object.create(null), [
          parentScope ? defaults.get(parentScope) : {},
          defaults.get(scope),
          item.defaults
      ]);
      defaults.set(scope, itemDefaults);
      if (item.defaultRoutes) {
          routeDefaults(scope, item.defaultRoutes);
      }
      if (item.descriptors) {
          defaults.describe(scope, item.descriptors);
      }
  }
  function routeDefaults(scope, routes) {
      Object.keys(routes).forEach((property)=>{
          const propertyParts = property.split('.');
          const sourceName = propertyParts.pop();
          const sourceScope = [
              scope
          ].concat(propertyParts).join('.');
          const parts = routes[property].split('.');
          const targetName = parts.pop();
          const targetScope = parts.join('.');
          defaults.route(sourceScope, sourceName, targetScope, targetName);
      });
  }
  function isIChartComponent(proto) {
      return 'id' in proto && 'defaults' in proto;
  }

  class Registry {
      constructor(){
          this.controllers = new TypedRegistry(DatasetController, 'datasets', true);
          this.elements = new TypedRegistry(Element, 'elements');
          this.plugins = new TypedRegistry(Object, 'plugins');
          this.scales = new TypedRegistry(Scale, 'scales');
          this._typedRegistries = [
              this.controllers,
              this.scales,
              this.elements
          ];
      }
   add(...args) {
          this._each('register', args);
      }
      remove(...args) {
          this._each('unregister', args);
      }
   addControllers(...args) {
          this._each('register', args, this.controllers);
      }
   addElements(...args) {
          this._each('register', args, this.elements);
      }
   addPlugins(...args) {
          this._each('register', args, this.plugins);
      }
   addScales(...args) {
          this._each('register', args, this.scales);
      }
   getController(id) {
          return this._get(id, this.controllers, 'controller');
      }
   getElement(id) {
          return this._get(id, this.elements, 'element');
      }
   getPlugin(id) {
          return this._get(id, this.plugins, 'plugin');
      }
   getScale(id) {
          return this._get(id, this.scales, 'scale');
      }
   removeControllers(...args) {
          this._each('unregister', args, this.controllers);
      }
   removeElements(...args) {
          this._each('unregister', args, this.elements);
      }
   removePlugins(...args) {
          this._each('unregister', args, this.plugins);
      }
   removeScales(...args) {
          this._each('unregister', args, this.scales);
      }
   _each(method, args, typedRegistry) {
          [
              ...args
          ].forEach((arg)=>{
              const reg = typedRegistry || this._getRegistryForType(arg);
              if (typedRegistry || reg.isForType(arg) || reg === this.plugins && arg.id) {
                  this._exec(method, reg, arg);
              } else {
                  each(arg, (item)=>{
                      const itemReg = typedRegistry || this._getRegistryForType(item);
                      this._exec(method, itemReg, item);
                  });
              }
          });
      }
   _exec(method, registry, component) {
          const camelMethod = _capitalize(method);
          callback(component['before' + camelMethod], [], component);
          registry[method](component);
          callback(component['after' + camelMethod], [], component);
      }
   _getRegistryForType(type) {
          for(let i = 0; i < this._typedRegistries.length; i++){
              const reg = this._typedRegistries[i];
              if (reg.isForType(type)) {
                  return reg;
              }
          }
          return this.plugins;
      }
   _get(id, typedRegistry, type) {
          const item = typedRegistry.get(id);
          if (item === undefined) {
              throw new Error('"' + id + '" is not a registered ' + type + '.');
          }
          return item;
      }
  }
  var registry = /* #__PURE__ */ new Registry();

  class PluginService {
      constructor(){
          this._init = [];
      }
   notify(chart, hook, args, filter) {
          if (hook === 'beforeInit') {
              this._init = this._createDescriptors(chart, true);
              this._notify(this._init, chart, 'install');
          }
          const descriptors = filter ? this._descriptors(chart).filter(filter) : this._descriptors(chart);
          const result = this._notify(descriptors, chart, hook, args);
          if (hook === 'afterDestroy') {
              this._notify(descriptors, chart, 'stop');
              this._notify(this._init, chart, 'uninstall');
          }
          return result;
      }
   _notify(descriptors, chart, hook, args) {
          args = args || {};
          for (const descriptor of descriptors){
              const plugin = descriptor.plugin;
              const method = plugin[hook];
              const params = [
                  chart,
                  args,
                  descriptor.options
              ];
              if (callback(method, params, plugin) === false && args.cancelable) {
                  return false;
              }
          }
          return true;
      }
      invalidate() {
          if (!isNullOrUndef(this._cache)) {
              this._oldCache = this._cache;
              this._cache = undefined;
          }
      }
   _descriptors(chart) {
          if (this._cache) {
              return this._cache;
          }
          const descriptors = this._cache = this._createDescriptors(chart);
          this._notifyStateChanges(chart);
          return descriptors;
      }
      _createDescriptors(chart, all) {
          const config = chart && chart.config;
          const options = valueOrDefault(config.options && config.options.plugins, {});
          const plugins = allPlugins(config);
          return options === false && !all ? [] : createDescriptors(chart, plugins, options, all);
      }
   _notifyStateChanges(chart) {
          const previousDescriptors = this._oldCache || [];
          const descriptors = this._cache;
          const diff = (a, b)=>a.filter((x)=>!b.some((y)=>x.plugin.id === y.plugin.id));
          this._notify(diff(previousDescriptors, descriptors), chart, 'stop');
          this._notify(diff(descriptors, previousDescriptors), chart, 'start');
      }
  }
   function allPlugins(config) {
      const localIds = {};
      const plugins = [];
      const keys = Object.keys(registry.plugins.items);
      for(let i = 0; i < keys.length; i++){
          plugins.push(registry.getPlugin(keys[i]));
      }
      const local = config.plugins || [];
      for(let i1 = 0; i1 < local.length; i1++){
          const plugin = local[i1];
          if (plugins.indexOf(plugin) === -1) {
              plugins.push(plugin);
              localIds[plugin.id] = true;
          }
      }
      return {
          plugins,
          localIds
      };
  }
  function getOpts(options, all) {
      if (!all && options === false) {
          return null;
      }
      if (options === true) {
          return {};
      }
      return options;
  }
  function createDescriptors(chart, { plugins , localIds  }, options, all) {
      const result = [];
      const context = chart.getContext();
      for (const plugin of plugins){
          const id = plugin.id;
          const opts = getOpts(options[id], all);
          if (opts === null) {
              continue;
          }
          result.push({
              plugin,
              options: pluginOpts(chart.config, {
                  plugin,
                  local: localIds[id]
              }, opts, context)
          });
      }
      return result;
  }
  function pluginOpts(config, { plugin , local  }, opts, context) {
      const keys = config.pluginScopeKeys(plugin);
      const scopes = config.getOptionScopes(opts, keys);
      if (local && plugin.defaults) {
          scopes.push(plugin.defaults);
      }
      return config.createResolver(scopes, context, [
          ''
      ], {
          scriptable: false,
          indexable: false,
          allKeys: true
      });
  }

  function getIndexAxis(type, options) {
      const datasetDefaults = defaults.datasets[type] || {};
      const datasetOptions = (options.datasets || {})[type] || {};
      return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || 'x';
  }
  function getAxisFromDefaultScaleID(id, indexAxis) {
      let axis = id;
      if (id === '_index_') {
          axis = indexAxis;
      } else if (id === '_value_') {
          axis = indexAxis === 'x' ? 'y' : 'x';
      }
      return axis;
  }
  function getDefaultScaleIDFromAxis(axis, indexAxis) {
      return axis === indexAxis ? '_index_' : '_value_';
  }
  function axisFromPosition(position) {
      if (position === 'top' || position === 'bottom') {
          return 'x';
      }
      if (position === 'left' || position === 'right') {
          return 'y';
      }
  }
  function determineAxis(id, scaleOptions) {
      if (id === 'x' || id === 'y' || id === 'r') {
          return id;
      }
      id = scaleOptions.axis || axisFromPosition(scaleOptions.position) || id.length > 1 && determineAxis(id[0].toLowerCase(), scaleOptions);
      if (id) {
          return id;
      }
      throw new Error(`Cannot determine type of '${name}' axis. Please provide 'axis' or 'position' option.`);
  }
  function mergeScaleConfig(config, options) {
      const chartDefaults = overrides[config.type] || {
          scales: {}
      };
      const configScales = options.scales || {};
      const chartIndexAxis = getIndexAxis(config.type, options);
      const scales = Object.create(null);
      Object.keys(configScales).forEach((id)=>{
          const scaleConf = configScales[id];
          if (!isObject(scaleConf)) {
              return console.error(`Invalid scale configuration for scale: ${id}`);
          }
          if (scaleConf._proxy) {
              return console.warn(`Ignoring resolver passed as options for scale: ${id}`);
          }
          const axis = determineAxis(id, scaleConf);
          const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
          const defaultScaleOptions = chartDefaults.scales || {};
          scales[id] = mergeIf(Object.create(null), [
              {
                  axis
              },
              scaleConf,
              defaultScaleOptions[axis],
              defaultScaleOptions[defaultId]
          ]);
      });
      config.data.datasets.forEach((dataset)=>{
          const type = dataset.type || config.type;
          const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
          const datasetDefaults = overrides[type] || {};
          const defaultScaleOptions = datasetDefaults.scales || {};
          Object.keys(defaultScaleOptions).forEach((defaultID)=>{
              const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
              const id = dataset[axis + 'AxisID'] || axis;
              scales[id] = scales[id] || Object.create(null);
              mergeIf(scales[id], [
                  {
                      axis
                  },
                  configScales[id],
                  defaultScaleOptions[defaultID]
              ]);
          });
      });
      Object.keys(scales).forEach((key)=>{
          const scale = scales[key];
          mergeIf(scale, [
              defaults.scales[scale.type],
              defaults.scale
          ]);
      });
      return scales;
  }
  function initOptions(config) {
      const options = config.options || (config.options = {});
      options.plugins = valueOrDefault(options.plugins, {});
      options.scales = mergeScaleConfig(config, options);
  }
  function initData(data) {
      data = data || {};
      data.datasets = data.datasets || [];
      data.labels = data.labels || [];
      return data;
  }
  function initConfig(config) {
      config = config || {};
      config.data = initData(config.data);
      initOptions(config);
      return config;
  }
  const keyCache = new Map();
  const keysCached = new Set();
  function cachedKeys(cacheKey, generate) {
      let keys = keyCache.get(cacheKey);
      if (!keys) {
          keys = generate();
          keyCache.set(cacheKey, keys);
          keysCached.add(keys);
      }
      return keys;
  }
  const addIfFound = (set, obj, key)=>{
      const opts = resolveObjectKey(obj, key);
      if (opts !== undefined) {
          set.add(opts);
      }
  };
  class Config {
      constructor(config){
          this._config = initConfig(config);
          this._scopeCache = new Map();
          this._resolverCache = new Map();
      }
      get platform() {
          return this._config.platform;
      }
      get type() {
          return this._config.type;
      }
      set type(type) {
          this._config.type = type;
      }
      get data() {
          return this._config.data;
      }
      set data(data) {
          this._config.data = initData(data);
      }
      get options() {
          return this._config.options;
      }
      set options(options) {
          this._config.options = options;
      }
      get plugins() {
          return this._config.plugins;
      }
      update() {
          const config = this._config;
          this.clearCache();
          initOptions(config);
      }
      clearCache() {
          this._scopeCache.clear();
          this._resolverCache.clear();
      }
   datasetScopeKeys(datasetType) {
          return cachedKeys(datasetType, ()=>[
                  [
                      `datasets.${datasetType}`,
                      ''
                  ]
              ]);
      }
   datasetAnimationScopeKeys(datasetType, transition) {
          return cachedKeys(`${datasetType}.transition.${transition}`, ()=>[
                  [
                      `datasets.${datasetType}.transitions.${transition}`,
                      `transitions.${transition}`
                  ],
                  [
                      `datasets.${datasetType}`,
                      ''
                  ]
              ]);
      }
   datasetElementScopeKeys(datasetType, elementType) {
          return cachedKeys(`${datasetType}-${elementType}`, ()=>[
                  [
                      `datasets.${datasetType}.elements.${elementType}`,
                      `datasets.${datasetType}`,
                      `elements.${elementType}`,
                      ''
                  ]
              ]);
      }
   pluginScopeKeys(plugin) {
          const id = plugin.id;
          const type = this.type;
          return cachedKeys(`${type}-plugin-${id}`, ()=>[
                  [
                      `plugins.${id}`,
                      ...plugin.additionalOptionScopes || []
                  ]
              ]);
      }
   _cachedScopes(mainScope, resetCache) {
          const _scopeCache = this._scopeCache;
          let cache = _scopeCache.get(mainScope);
          if (!cache || resetCache) {
              cache = new Map();
              _scopeCache.set(mainScope, cache);
          }
          return cache;
      }
   getOptionScopes(mainScope, keyLists, resetCache) {
          const { options , type  } = this;
          const cache = this._cachedScopes(mainScope, resetCache);
          const cached = cache.get(keyLists);
          if (cached) {
              return cached;
          }
          const scopes = new Set();
          keyLists.forEach((keys)=>{
              if (mainScope) {
                  scopes.add(mainScope);
                  keys.forEach((key)=>addIfFound(scopes, mainScope, key));
              }
              keys.forEach((key)=>addIfFound(scopes, options, key));
              keys.forEach((key)=>addIfFound(scopes, overrides[type] || {}, key));
              keys.forEach((key)=>addIfFound(scopes, defaults, key));
              keys.forEach((key)=>addIfFound(scopes, descriptors, key));
          });
          const array = Array.from(scopes);
          if (array.length === 0) {
              array.push(Object.create(null));
          }
          if (keysCached.has(keyLists)) {
              cache.set(keyLists, array);
          }
          return array;
      }
   chartOptionScopes() {
          const { options , type  } = this;
          return [
              options,
              overrides[type] || {},
              defaults.datasets[type] || {},
              {
                  type
              },
              defaults,
              descriptors
          ];
      }
   resolveNamedOptions(scopes, names, context, prefixes = [
          ''
      ]) {
          const result = {
              $shared: true
          };
          const { resolver , subPrefixes  } = getResolver(this._resolverCache, scopes, prefixes);
          let options = resolver;
          if (needContext(resolver, names)) {
              result.$shared = false;
              context = isFunction(context) ? context() : context;
              const subResolver = this.createResolver(scopes, context, subPrefixes);
              options = _attachContext(resolver, context, subResolver);
          }
          for (const prop of names){
              result[prop] = options[prop];
          }
          return result;
      }
   createResolver(scopes, context, prefixes = [
          ''
      ], descriptorDefaults) {
          const { resolver  } = getResolver(this._resolverCache, scopes, prefixes);
          return isObject(context) ? _attachContext(resolver, context, undefined, descriptorDefaults) : resolver;
      }
  }
  function getResolver(resolverCache, scopes, prefixes) {
      let cache = resolverCache.get(scopes);
      if (!cache) {
          cache = new Map();
          resolverCache.set(scopes, cache);
      }
      const cacheKey = prefixes.join();
      let cached = cache.get(cacheKey);
      if (!cached) {
          const resolver = _createResolver(scopes, prefixes);
          cached = {
              resolver,
              subPrefixes: prefixes.filter((p)=>!p.toLowerCase().includes('hover'))
          };
          cache.set(cacheKey, cached);
      }
      return cached;
  }
  const hasFunction = (value)=>isObject(value) && Object.getOwnPropertyNames(value).reduce((acc, key)=>acc || isFunction(value[key]), false);
  function needContext(proxy, names) {
      const { isScriptable , isIndexable  } = _descriptors(proxy);
      for (const prop of names){
          const scriptable = isScriptable(prop);
          const indexable = isIndexable(prop);
          const value = (indexable || scriptable) && proxy[prop];
          if (scriptable && (isFunction(value) || hasFunction(value)) || indexable && isArray(value)) {
              return true;
          }
      }
      return false;
  }

  var version = "4.2.0";

  const KNOWN_POSITIONS = [
      'top',
      'bottom',
      'left',
      'right',
      'chartArea'
  ];
  function positionIsHorizontal(position, axis) {
      return position === 'top' || position === 'bottom' || KNOWN_POSITIONS.indexOf(position) === -1 && axis === 'x';
  }
  function compare2Level(l1, l2) {
      return function(a, b) {
          return a[l1] === b[l1] ? a[l2] - b[l2] : a[l1] - b[l1];
      };
  }
  function onAnimationsComplete(context) {
      const chart = context.chart;
      const animationOptions = chart.options.animation;
      chart.notifyPlugins('afterRender');
      callback(animationOptions && animationOptions.onComplete, [
          context
      ], chart);
  }
  function onAnimationProgress(context) {
      const chart = context.chart;
      const animationOptions = chart.options.animation;
      callback(animationOptions && animationOptions.onProgress, [
          context
      ], chart);
  }
   function getCanvas(item) {
      if (_isDomSupported() && typeof item === 'string') {
          item = document.getElementById(item);
      } else if (item && item.length) {
          item = item[0];
      }
      if (item && item.canvas) {
          item = item.canvas;
      }
      return item;
  }
  const instances = {};
  const getChart = (key)=>{
      const canvas = getCanvas(key);
      return Object.values(instances).filter((c)=>c.canvas === canvas).pop();
  };
  function moveNumericKeys(obj, start, move) {
      const keys = Object.keys(obj);
      for (const key of keys){
          const intKey = +key;
          if (intKey >= start) {
              const value = obj[key];
              delete obj[key];
              if (move > 0 || intKey > start) {
                  obj[intKey + move] = value;
              }
          }
      }
  }
   function determineLastEvent(e, lastEvent, inChartArea, isClick) {
      if (!inChartArea || e.type === 'mouseout') {
          return null;
      }
      if (isClick) {
          return lastEvent;
      }
      return e;
  }
  function getDatasetArea(meta) {
      const { xScale , yScale  } = meta;
      if (xScale && yScale) {
          return {
              left: xScale.left,
              right: xScale.right,
              top: yScale.top,
              bottom: yScale.bottom
          };
      }
  }
  let Chart$1 = class Chart {
      static defaults = defaults;
      static instances = instances;
      static overrides = overrides;
      static registry = registry;
      static version = version;
      static getChart = getChart;
      static register(...items) {
          registry.add(...items);
          invalidatePlugins();
      }
      static unregister(...items) {
          registry.remove(...items);
          invalidatePlugins();
      }
      constructor(item, userConfig){
          const config = this.config = new Config(userConfig);
          const initialCanvas = getCanvas(item);
          const existingChart = getChart(initialCanvas);
          if (existingChart) {
              throw new Error('Canvas is already in use. Chart with ID \'' + existingChart.id + '\'' + ' must be destroyed before the canvas with ID \'' + existingChart.canvas.id + '\' can be reused.');
          }
          const options = config.createResolver(config.chartOptionScopes(), this.getContext());
          this.platform = new (config.platform || _detectPlatform(initialCanvas))();
          this.platform.updateConfig(config);
          const context = this.platform.acquireContext(initialCanvas, options.aspectRatio);
          const canvas = context && context.canvas;
          const height = canvas && canvas.height;
          const width = canvas && canvas.width;
          this.id = uid();
          this.ctx = context;
          this.canvas = canvas;
          this.width = width;
          this.height = height;
          this._options = options;
          this._aspectRatio = this.aspectRatio;
          this._layers = [];
          this._metasets = [];
          this._stacks = undefined;
          this.boxes = [];
          this.currentDevicePixelRatio = undefined;
          this.chartArea = undefined;
          this._active = [];
          this._lastEvent = undefined;
          this._listeners = {};
           this._responsiveListeners = undefined;
          this._sortedMetasets = [];
          this.scales = {};
          this._plugins = new PluginService();
          this.$proxies = {};
          this._hiddenIndices = {};
          this.attached = false;
          this._animationsDisabled = undefined;
          this.$context = undefined;
          this._doResize = debounce((mode)=>this.update(mode), options.resizeDelay || 0);
          this._dataChanges = [];
          instances[this.id] = this;
          if (!context || !canvas) {
              console.error("Failed to create chart: can't acquire context from the given item");
              return;
          }
          animator.listen(this, 'complete', onAnimationsComplete);
          animator.listen(this, 'progress', onAnimationProgress);
          this._initialize();
          if (this.attached) {
              this.update();
          }
      }
      get aspectRatio() {
          const { options: { aspectRatio , maintainAspectRatio  } , width , height , _aspectRatio  } = this;
          if (!isNullOrUndef(aspectRatio)) {
              return aspectRatio;
          }
          if (maintainAspectRatio && _aspectRatio) {
              return _aspectRatio;
          }
          return height ? width / height : null;
      }
      get data() {
          return this.config.data;
      }
      set data(data) {
          this.config.data = data;
      }
      get options() {
          return this._options;
      }
      set options(options) {
          this.config.options = options;
      }
      get registry() {
          return registry;
      }
   _initialize() {
          this.notifyPlugins('beforeInit');
          if (this.options.responsive) {
              this.resize();
          } else {
              retinaScale(this, this.options.devicePixelRatio);
          }
          this.bindEvents();
          this.notifyPlugins('afterInit');
          return this;
      }
      clear() {
          clearCanvas(this.canvas, this.ctx);
          return this;
      }
      stop() {
          animator.stop(this);
          return this;
      }
   resize(width, height) {
          if (!animator.running(this)) {
              this._resize(width, height);
          } else {
              this._resizeBeforeDraw = {
                  width,
                  height
              };
          }
      }
      _resize(width, height) {
          const options = this.options;
          const canvas = this.canvas;
          const aspectRatio = options.maintainAspectRatio && this.aspectRatio;
          const newSize = this.platform.getMaximumSize(canvas, width, height, aspectRatio);
          const newRatio = options.devicePixelRatio || this.platform.getDevicePixelRatio();
          const mode = this.width ? 'resize' : 'attach';
          this.width = newSize.width;
          this.height = newSize.height;
          this._aspectRatio = this.aspectRatio;
          if (!retinaScale(this, newRatio, true)) {
              return;
          }
          this.notifyPlugins('resize', {
              size: newSize
          });
          callback(options.onResize, [
              this,
              newSize
          ], this);
          if (this.attached) {
              if (this._doResize(mode)) {
                  this.render();
              }
          }
      }
      ensureScalesHaveIDs() {
          const options = this.options;
          const scalesOptions = options.scales || {};
          each(scalesOptions, (axisOptions, axisID)=>{
              axisOptions.id = axisID;
          });
      }
   buildOrUpdateScales() {
          const options = this.options;
          const scaleOpts = options.scales;
          const scales = this.scales;
          const updated = Object.keys(scales).reduce((obj, id)=>{
              obj[id] = false;
              return obj;
          }, {});
          let items = [];
          if (scaleOpts) {
              items = items.concat(Object.keys(scaleOpts).map((id)=>{
                  const scaleOptions = scaleOpts[id];
                  const axis = determineAxis(id, scaleOptions);
                  const isRadial = axis === 'r';
                  const isHorizontal = axis === 'x';
                  return {
                      options: scaleOptions,
                      dposition: isRadial ? 'chartArea' : isHorizontal ? 'bottom' : 'left',
                      dtype: isRadial ? 'radialLinear' : isHorizontal ? 'category' : 'linear'
                  };
              }));
          }
          each(items, (item)=>{
              const scaleOptions = item.options;
              const id = scaleOptions.id;
              const axis = determineAxis(id, scaleOptions);
              const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
              if (scaleOptions.position === undefined || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
                  scaleOptions.position = item.dposition;
              }
              updated[id] = true;
              let scale = null;
              if (id in scales && scales[id].type === scaleType) {
                  scale = scales[id];
              } else {
                  const scaleClass = registry.getScale(scaleType);
                  scale = new scaleClass({
                      id,
                      type: scaleType,
                      ctx: this.ctx,
                      chart: this
                  });
                  scales[scale.id] = scale;
              }
              scale.init(scaleOptions, options);
          });
          each(updated, (hasUpdated, id)=>{
              if (!hasUpdated) {
                  delete scales[id];
              }
          });
          each(scales, (scale)=>{
              layouts.configure(this, scale, scale.options);
              layouts.addBox(this, scale);
          });
      }
   _updateMetasets() {
          const metasets = this._metasets;
          const numData = this.data.datasets.length;
          const numMeta = metasets.length;
          metasets.sort((a, b)=>a.index - b.index);
          if (numMeta > numData) {
              for(let i = numData; i < numMeta; ++i){
                  this._destroyDatasetMeta(i);
              }
              metasets.splice(numData, numMeta - numData);
          }
          this._sortedMetasets = metasets.slice(0).sort(compare2Level('order', 'index'));
      }
   _removeUnreferencedMetasets() {
          const { _metasets: metasets , data: { datasets  }  } = this;
          if (metasets.length > datasets.length) {
              delete this._stacks;
          }
          metasets.forEach((meta, index)=>{
              if (datasets.filter((x)=>x === meta._dataset).length === 0) {
                  this._destroyDatasetMeta(index);
              }
          });
      }
      buildOrUpdateControllers() {
          const newControllers = [];
          const datasets = this.data.datasets;
          let i, ilen;
          this._removeUnreferencedMetasets();
          for(i = 0, ilen = datasets.length; i < ilen; i++){
              const dataset = datasets[i];
              let meta = this.getDatasetMeta(i);
              const type = dataset.type || this.config.type;
              if (meta.type && meta.type !== type) {
                  this._destroyDatasetMeta(i);
                  meta = this.getDatasetMeta(i);
              }
              meta.type = type;
              meta.indexAxis = dataset.indexAxis || getIndexAxis(type, this.options);
              meta.order = dataset.order || 0;
              meta.index = i;
              meta.label = '' + dataset.label;
              meta.visible = this.isDatasetVisible(i);
              if (meta.controller) {
                  meta.controller.updateIndex(i);
                  meta.controller.linkScales();
              } else {
                  const ControllerClass = registry.getController(type);
                  const { datasetElementType , dataElementType  } = defaults.datasets[type];
                  Object.assign(ControllerClass, {
                      dataElementType: registry.getElement(dataElementType),
                      datasetElementType: datasetElementType && registry.getElement(datasetElementType)
                  });
                  meta.controller = new ControllerClass(this, i);
                  newControllers.push(meta.controller);
              }
          }
          this._updateMetasets();
          return newControllers;
      }
   _resetElements() {
          each(this.data.datasets, (dataset, datasetIndex)=>{
              this.getDatasetMeta(datasetIndex).controller.reset();
          }, this);
      }
   reset() {
          this._resetElements();
          this.notifyPlugins('reset');
      }
      update(mode) {
          const config = this.config;
          config.update();
          const options = this._options = config.createResolver(config.chartOptionScopes(), this.getContext());
          const animsDisabled = this._animationsDisabled = !options.animation;
          this._updateScales();
          this._checkEventBindings();
          this._updateHiddenIndices();
          this._plugins.invalidate();
          if (this.notifyPlugins('beforeUpdate', {
              mode,
              cancelable: true
          }) === false) {
              return;
          }
          const newControllers = this.buildOrUpdateControllers();
          this.notifyPlugins('beforeElementsUpdate');
          let minPadding = 0;
          for(let i = 0, ilen = this.data.datasets.length; i < ilen; i++){
              const { controller  } = this.getDatasetMeta(i);
              const reset = !animsDisabled && newControllers.indexOf(controller) === -1;
              controller.buildOrUpdateElements(reset);
              minPadding = Math.max(+controller.getMaxOverflow(), minPadding);
          }
          minPadding = this._minPadding = options.layout.autoPadding ? minPadding : 0;
          this._updateLayout(minPadding);
          if (!animsDisabled) {
              each(newControllers, (controller)=>{
                  controller.reset();
              });
          }
          this._updateDatasets(mode);
          this.notifyPlugins('afterUpdate', {
              mode
          });
          this._layers.sort(compare2Level('z', '_idx'));
          const { _active , _lastEvent  } = this;
          if (_lastEvent) {
              this._eventHandler(_lastEvent, true);
          } else if (_active.length) {
              this._updateHoverStyles(_active, _active, true);
          }
          this.render();
      }
   _updateScales() {
          each(this.scales, (scale)=>{
              layouts.removeBox(this, scale);
          });
          this.ensureScalesHaveIDs();
          this.buildOrUpdateScales();
      }
   _checkEventBindings() {
          const options = this.options;
          const existingEvents = new Set(Object.keys(this._listeners));
          const newEvents = new Set(options.events);
          if (!setsEqual(existingEvents, newEvents) || !!this._responsiveListeners !== options.responsive) {
              this.unbindEvents();
              this.bindEvents();
          }
      }
   _updateHiddenIndices() {
          const { _hiddenIndices  } = this;
          const changes = this._getUniformDataChanges() || [];
          for (const { method , start , count  } of changes){
              const move = method === '_removeElements' ? -count : count;
              moveNumericKeys(_hiddenIndices, start, move);
          }
      }
   _getUniformDataChanges() {
          const _dataChanges = this._dataChanges;
          if (!_dataChanges || !_dataChanges.length) {
              return;
          }
          this._dataChanges = [];
          const datasetCount = this.data.datasets.length;
          const makeSet = (idx)=>new Set(_dataChanges.filter((c)=>c[0] === idx).map((c, i)=>i + ',' + c.splice(1).join(',')));
          const changeSet = makeSet(0);
          for(let i = 1; i < datasetCount; i++){
              if (!setsEqual(changeSet, makeSet(i))) {
                  return;
              }
          }
          return Array.from(changeSet).map((c)=>c.split(',')).map((a)=>({
                  method: a[1],
                  start: +a[2],
                  count: +a[3]
              }));
      }
   _updateLayout(minPadding) {
          if (this.notifyPlugins('beforeLayout', {
              cancelable: true
          }) === false) {
              return;
          }
          layouts.update(this, this.width, this.height, minPadding);
          const area = this.chartArea;
          const noArea = area.width <= 0 || area.height <= 0;
          this._layers = [];
          each(this.boxes, (box)=>{
              if (noArea && box.position === 'chartArea') {
                  return;
              }
              if (box.configure) {
                  box.configure();
              }
              this._layers.push(...box._layers());
          }, this);
          this._layers.forEach((item, index)=>{
              item._idx = index;
          });
          this.notifyPlugins('afterLayout');
      }
   _updateDatasets(mode) {
          if (this.notifyPlugins('beforeDatasetsUpdate', {
              mode,
              cancelable: true
          }) === false) {
              return;
          }
          for(let i = 0, ilen = this.data.datasets.length; i < ilen; ++i){
              this.getDatasetMeta(i).controller.configure();
          }
          for(let i1 = 0, ilen1 = this.data.datasets.length; i1 < ilen1; ++i1){
              this._updateDataset(i1, isFunction(mode) ? mode({
                  datasetIndex: i1
              }) : mode);
          }
          this.notifyPlugins('afterDatasetsUpdate', {
              mode
          });
      }
   _updateDataset(index, mode) {
          const meta = this.getDatasetMeta(index);
          const args = {
              meta,
              index,
              mode,
              cancelable: true
          };
          if (this.notifyPlugins('beforeDatasetUpdate', args) === false) {
              return;
          }
          meta.controller._update(mode);
          args.cancelable = false;
          this.notifyPlugins('afterDatasetUpdate', args);
      }
      render() {
          if (this.notifyPlugins('beforeRender', {
              cancelable: true
          }) === false) {
              return;
          }
          if (animator.has(this)) {
              if (this.attached && !animator.running(this)) {
                  animator.start(this);
              }
          } else {
              this.draw();
              onAnimationsComplete({
                  chart: this
              });
          }
      }
      draw() {
          let i;
          if (this._resizeBeforeDraw) {
              const { width , height  } = this._resizeBeforeDraw;
              this._resize(width, height);
              this._resizeBeforeDraw = null;
          }
          this.clear();
          if (this.width <= 0 || this.height <= 0) {
              return;
          }
          if (this.notifyPlugins('beforeDraw', {
              cancelable: true
          }) === false) {
              return;
          }
          const layers = this._layers;
          for(i = 0; i < layers.length && layers[i].z <= 0; ++i){
              layers[i].draw(this.chartArea);
          }
          this._drawDatasets();
          for(; i < layers.length; ++i){
              layers[i].draw(this.chartArea);
          }
          this.notifyPlugins('afterDraw');
      }
   _getSortedDatasetMetas(filterVisible) {
          const metasets = this._sortedMetasets;
          const result = [];
          let i, ilen;
          for(i = 0, ilen = metasets.length; i < ilen; ++i){
              const meta = metasets[i];
              if (!filterVisible || meta.visible) {
                  result.push(meta);
              }
          }
          return result;
      }
   getSortedVisibleDatasetMetas() {
          return this._getSortedDatasetMetas(true);
      }
   _drawDatasets() {
          if (this.notifyPlugins('beforeDatasetsDraw', {
              cancelable: true
          }) === false) {
              return;
          }
          const metasets = this.getSortedVisibleDatasetMetas();
          for(let i = metasets.length - 1; i >= 0; --i){
              this._drawDataset(metasets[i]);
          }
          this.notifyPlugins('afterDatasetsDraw');
      }
   _drawDataset(meta) {
          const ctx = this.ctx;
          const clip = meta._clip;
          const useClip = !clip.disabled;
          const area = getDatasetArea(meta) || this.chartArea;
          const args = {
              meta,
              index: meta.index,
              cancelable: true
          };
          if (this.notifyPlugins('beforeDatasetDraw', args) === false) {
              return;
          }
          if (useClip) {
              clipArea(ctx, {
                  left: clip.left === false ? 0 : area.left - clip.left,
                  right: clip.right === false ? this.width : area.right + clip.right,
                  top: clip.top === false ? 0 : area.top - clip.top,
                  bottom: clip.bottom === false ? this.height : area.bottom + clip.bottom
              });
          }
          meta.controller.draw();
          if (useClip) {
              unclipArea(ctx);
          }
          args.cancelable = false;
          this.notifyPlugins('afterDatasetDraw', args);
      }
   isPointInArea(point) {
          return _isPointInArea(point, this.chartArea, this._minPadding);
      }
      getElementsAtEventForMode(e, mode, options, useFinalPosition) {
          const method = Interaction.modes[mode];
          if (typeof method === 'function') {
              return method(this, e, options, useFinalPosition);
          }
          return [];
      }
      getDatasetMeta(datasetIndex) {
          const dataset = this.data.datasets[datasetIndex];
          const metasets = this._metasets;
          let meta = metasets.filter((x)=>x && x._dataset === dataset).pop();
          if (!meta) {
              meta = {
                  type: null,
                  data: [],
                  dataset: null,
                  controller: null,
                  hidden: null,
                  xAxisID: null,
                  yAxisID: null,
                  order: dataset && dataset.order || 0,
                  index: datasetIndex,
                  _dataset: dataset,
                  _parsed: [],
                  _sorted: false
              };
              metasets.push(meta);
          }
          return meta;
      }
      getContext() {
          return this.$context || (this.$context = createContext(null, {
              chart: this,
              type: 'chart'
          }));
      }
      getVisibleDatasetCount() {
          return this.getSortedVisibleDatasetMetas().length;
      }
      isDatasetVisible(datasetIndex) {
          const dataset = this.data.datasets[datasetIndex];
          if (!dataset) {
              return false;
          }
          const meta = this.getDatasetMeta(datasetIndex);
          return typeof meta.hidden === 'boolean' ? !meta.hidden : !dataset.hidden;
      }
      setDatasetVisibility(datasetIndex, visible) {
          const meta = this.getDatasetMeta(datasetIndex);
          meta.hidden = !visible;
      }
      toggleDataVisibility(index) {
          this._hiddenIndices[index] = !this._hiddenIndices[index];
      }
      getDataVisibility(index) {
          return !this._hiddenIndices[index];
      }
   _updateVisibility(datasetIndex, dataIndex, visible) {
          const mode = visible ? 'show' : 'hide';
          const meta = this.getDatasetMeta(datasetIndex);
          const anims = meta.controller._resolveAnimations(undefined, mode);
          if (defined(dataIndex)) {
              meta.data[dataIndex].hidden = !visible;
              this.update();
          } else {
              this.setDatasetVisibility(datasetIndex, visible);
              anims.update(meta, {
                  visible
              });
              this.update((ctx)=>ctx.datasetIndex === datasetIndex ? mode : undefined);
          }
      }
      hide(datasetIndex, dataIndex) {
          this._updateVisibility(datasetIndex, dataIndex, false);
      }
      show(datasetIndex, dataIndex) {
          this._updateVisibility(datasetIndex, dataIndex, true);
      }
   _destroyDatasetMeta(datasetIndex) {
          const meta = this._metasets[datasetIndex];
          if (meta && meta.controller) {
              meta.controller._destroy();
          }
          delete this._metasets[datasetIndex];
      }
      _stop() {
          let i, ilen;
          this.stop();
          animator.remove(this);
          for(i = 0, ilen = this.data.datasets.length; i < ilen; ++i){
              this._destroyDatasetMeta(i);
          }
      }
      destroy() {
          this.notifyPlugins('beforeDestroy');
          const { canvas , ctx  } = this;
          this._stop();
          this.config.clearCache();
          if (canvas) {
              this.unbindEvents();
              clearCanvas(canvas, ctx);
              this.platform.releaseContext(ctx);
              this.canvas = null;
              this.ctx = null;
          }
          delete instances[this.id];
          this.notifyPlugins('afterDestroy');
      }
      toBase64Image(...args) {
          return this.canvas.toDataURL(...args);
      }
   bindEvents() {
          this.bindUserEvents();
          if (this.options.responsive) {
              this.bindResponsiveEvents();
          } else {
              this.attached = true;
          }
      }
   bindUserEvents() {
          const listeners = this._listeners;
          const platform = this.platform;
          const _add = (type, listener)=>{
              platform.addEventListener(this, type, listener);
              listeners[type] = listener;
          };
          const listener = (e, x, y)=>{
              e.offsetX = x;
              e.offsetY = y;
              this._eventHandler(e);
          };
          each(this.options.events, (type)=>_add(type, listener));
      }
   bindResponsiveEvents() {
          if (!this._responsiveListeners) {
              this._responsiveListeners = {};
          }
          const listeners = this._responsiveListeners;
          const platform = this.platform;
          const _add = (type, listener)=>{
              platform.addEventListener(this, type, listener);
              listeners[type] = listener;
          };
          const _remove = (type, listener)=>{
              if (listeners[type]) {
                  platform.removeEventListener(this, type, listener);
                  delete listeners[type];
              }
          };
          const listener = (width, height)=>{
              if (this.canvas) {
                  this.resize(width, height);
              }
          };
          let detached;
          const attached = ()=>{
              _remove('attach', attached);
              this.attached = true;
              this.resize();
              _add('resize', listener);
              _add('detach', detached);
          };
          detached = ()=>{
              this.attached = false;
              _remove('resize', listener);
              this._stop();
              this._resize(0, 0);
              _add('attach', attached);
          };
          if (platform.isAttached(this.canvas)) {
              attached();
          } else {
              detached();
          }
      }
   unbindEvents() {
          each(this._listeners, (listener, type)=>{
              this.platform.removeEventListener(this, type, listener);
          });
          this._listeners = {};
          each(this._responsiveListeners, (listener, type)=>{
              this.platform.removeEventListener(this, type, listener);
          });
          this._responsiveListeners = undefined;
      }
      updateHoverStyle(items, mode, enabled) {
          const prefix = enabled ? 'set' : 'remove';
          let meta, item, i, ilen;
          if (mode === 'dataset') {
              meta = this.getDatasetMeta(items[0].datasetIndex);
              meta.controller['_' + prefix + 'DatasetHoverStyle']();
          }
          for(i = 0, ilen = items.length; i < ilen; ++i){
              item = items[i];
              const controller = item && this.getDatasetMeta(item.datasetIndex).controller;
              if (controller) {
                  controller[prefix + 'HoverStyle'](item.element, item.datasetIndex, item.index);
              }
          }
      }
   getActiveElements() {
          return this._active || [];
      }
   setActiveElements(activeElements) {
          const lastActive = this._active || [];
          const active = activeElements.map(({ datasetIndex , index  })=>{
              const meta = this.getDatasetMeta(datasetIndex);
              if (!meta) {
                  throw new Error('No dataset found at index ' + datasetIndex);
              }
              return {
                  datasetIndex,
                  element: meta.data[index],
                  index
              };
          });
          const changed = !_elementsEqual(active, lastActive);
          if (changed) {
              this._active = active;
              this._lastEvent = null;
              this._updateHoverStyles(active, lastActive);
          }
      }
   notifyPlugins(hook, args, filter) {
          return this._plugins.notify(this, hook, args, filter);
      }
   isPluginEnabled(pluginId) {
          return this._plugins._cache.filter((p)=>p.plugin.id === pluginId).length === 1;
      }
   _updateHoverStyles(active, lastActive, replay) {
          const hoverOptions = this.options.hover;
          const diff = (a, b)=>a.filter((x)=>!b.some((y)=>x.datasetIndex === y.datasetIndex && x.index === y.index));
          const deactivated = diff(lastActive, active);
          const activated = replay ? active : diff(active, lastActive);
          if (deactivated.length) {
              this.updateHoverStyle(deactivated, hoverOptions.mode, false);
          }
          if (activated.length && hoverOptions.mode) {
              this.updateHoverStyle(activated, hoverOptions.mode, true);
          }
      }
   _eventHandler(e, replay) {
          const args = {
              event: e,
              replay,
              cancelable: true,
              inChartArea: this.isPointInArea(e)
          };
          const eventFilter = (plugin)=>(plugin.options.events || this.options.events).includes(e.native.type);
          if (this.notifyPlugins('beforeEvent', args, eventFilter) === false) {
              return;
          }
          const changed = this._handleEvent(e, replay, args.inChartArea);
          args.cancelable = false;
          this.notifyPlugins('afterEvent', args, eventFilter);
          if (changed || args.changed) {
              this.render();
          }
          return this;
      }
   _handleEvent(e, replay, inChartArea) {
          const { _active: lastActive = [] , options  } = this;
          const useFinalPosition = replay;
          const active = this._getActiveElements(e, lastActive, inChartArea, useFinalPosition);
          const isClick = _isClickEvent(e);
          const lastEvent = determineLastEvent(e, this._lastEvent, inChartArea, isClick);
          if (inChartArea) {
              this._lastEvent = null;
              callback(options.onHover, [
                  e,
                  active,
                  this
              ], this);
              if (isClick) {
                  callback(options.onClick, [
                      e,
                      active,
                      this
                  ], this);
              }
          }
          const changed = !_elementsEqual(active, lastActive);
          if (changed || replay) {
              this._active = active;
              this._updateHoverStyles(active, lastActive, replay);
          }
          this._lastEvent = lastEvent;
          return changed;
      }
   _getActiveElements(e, lastActive, inChartArea, useFinalPosition) {
          if (e.type === 'mouseout') {
              return [];
          }
          if (!inChartArea) {
              return lastActive;
          }
          const hoverOptions = this.options.hover;
          return this.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions, useFinalPosition);
      }
  };
  function invalidatePlugins() {
      return each(Chart$1.instances, (chart)=>chart._plugins.invalidate());
  }

  function clipArc(ctx, element, endAngle) {
      const { startAngle , pixelMargin , x , y , outerRadius , innerRadius  } = element;
      let angleMargin = pixelMargin / outerRadius;
      // Draw an inner border by clipping the arc and drawing a double-width border
      // Enlarge the clipping arc by 0.33 pixels to eliminate glitches between borders
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, startAngle - angleMargin, endAngle + angleMargin);
      if (innerRadius > pixelMargin) {
          angleMargin = pixelMargin / innerRadius;
          ctx.arc(x, y, innerRadius, endAngle + angleMargin, startAngle - angleMargin, true);
      } else {
          ctx.arc(x, y, pixelMargin, endAngle + HALF_PI, startAngle - HALF_PI);
      }
      ctx.closePath();
      ctx.clip();
  }
  function toRadiusCorners(value) {
      return _readValueToProps(value, [
          'outerStart',
          'outerEnd',
          'innerStart',
          'innerEnd'
      ]);
  }
  /**
   * Parse border radius from the provided options
   */ function parseBorderRadius$1(arc, innerRadius, outerRadius, angleDelta) {
      const o = toRadiusCorners(arc.options.borderRadius);
      const halfThickness = (outerRadius - innerRadius) / 2;
      const innerLimit = Math.min(halfThickness, angleDelta * innerRadius / 2);
      // Outer limits are complicated. We want to compute the available angular distance at
      // a radius of outerRadius - borderRadius because for small angular distances, this term limits.
      // We compute at r = outerRadius - borderRadius because this circle defines the center of the border corners.
      //
      // If the borderRadius is large, that value can become negative.
      // This causes the outer borders to lose their radius entirely, which is rather unexpected. To solve that, if borderRadius > outerRadius
      // we know that the thickness term will dominate and compute the limits at that point
      const computeOuterLimit = (val)=>{
          const outerArcLimit = (outerRadius - Math.min(halfThickness, val)) * angleDelta / 2;
          return _limitValue(val, 0, Math.min(halfThickness, outerArcLimit));
      };
      return {
          outerStart: computeOuterLimit(o.outerStart),
          outerEnd: computeOuterLimit(o.outerEnd),
          innerStart: _limitValue(o.innerStart, 0, innerLimit),
          innerEnd: _limitValue(o.innerEnd, 0, innerLimit)
      };
  }
  /**
   * Convert (r, 𝜃) to (x, y)
   */ function rThetaToXY(r, theta, x, y) {
      return {
          x: x + r * Math.cos(theta),
          y: y + r * Math.sin(theta)
      };
  }
  /**
   * Path the arc, respecting border radius by separating into left and right halves.
   *
   *   Start      End
   *
   *    1--->a--->2    Outer
   *   /           \
   *   8           3
   *   |           |
   *   |           |
   *   7           4
   *   \           /
   *    6<---b<---5    Inner
   */ function pathArc(ctx, element, offset, spacing, end, circular) {
      const { x , y , startAngle: start , pixelMargin , innerRadius: innerR  } = element;
      const outerRadius = Math.max(element.outerRadius + spacing + offset - pixelMargin, 0);
      const innerRadius = innerR > 0 ? innerR + spacing + offset + pixelMargin : 0;
      let spacingOffset = 0;
      const alpha = end - start;
      if (spacing) {
          // When spacing is present, it is the same for all items
          // So we adjust the start and end angle of the arc such that
          // the distance is the same as it would be without the spacing
          const noSpacingInnerRadius = innerR > 0 ? innerR - spacing : 0;
          const noSpacingOuterRadius = outerRadius > 0 ? outerRadius - spacing : 0;
          const avNogSpacingRadius = (noSpacingInnerRadius + noSpacingOuterRadius) / 2;
          const adjustedAngle = avNogSpacingRadius !== 0 ? alpha * avNogSpacingRadius / (avNogSpacingRadius + spacing) : alpha;
          spacingOffset = (alpha - adjustedAngle) / 2;
      }
      const beta = Math.max(0.001, alpha * outerRadius - offset / PI) / outerRadius;
      const angleOffset = (alpha - beta) / 2;
      const startAngle = start + angleOffset + spacingOffset;
      const endAngle = end - angleOffset - spacingOffset;
      const { outerStart , outerEnd , innerStart , innerEnd  } = parseBorderRadius$1(element, innerRadius, outerRadius, endAngle - startAngle);
      const outerStartAdjustedRadius = outerRadius - outerStart;
      const outerEndAdjustedRadius = outerRadius - outerEnd;
      const outerStartAdjustedAngle = startAngle + outerStart / outerStartAdjustedRadius;
      const outerEndAdjustedAngle = endAngle - outerEnd / outerEndAdjustedRadius;
      const innerStartAdjustedRadius = innerRadius + innerStart;
      const innerEndAdjustedRadius = innerRadius + innerEnd;
      const innerStartAdjustedAngle = startAngle + innerStart / innerStartAdjustedRadius;
      const innerEndAdjustedAngle = endAngle - innerEnd / innerEndAdjustedRadius;
      ctx.beginPath();
      if (circular) {
          // The first arc segments from point 1 to point a to point 2
          const outerMidAdjustedAngle = (outerStartAdjustedAngle + outerEndAdjustedAngle) / 2;
          ctx.arc(x, y, outerRadius, outerStartAdjustedAngle, outerMidAdjustedAngle);
          ctx.arc(x, y, outerRadius, outerMidAdjustedAngle, outerEndAdjustedAngle);
          // The corner segment from point 2 to point 3
          if (outerEnd > 0) {
              const pCenter = rThetaToXY(outerEndAdjustedRadius, outerEndAdjustedAngle, x, y);
              ctx.arc(pCenter.x, pCenter.y, outerEnd, outerEndAdjustedAngle, endAngle + HALF_PI);
          }
          // The line from point 3 to point 4
          const p4 = rThetaToXY(innerEndAdjustedRadius, endAngle, x, y);
          ctx.lineTo(p4.x, p4.y);
          // The corner segment from point 4 to point 5
          if (innerEnd > 0) {
              const pCenter1 = rThetaToXY(innerEndAdjustedRadius, innerEndAdjustedAngle, x, y);
              ctx.arc(pCenter1.x, pCenter1.y, innerEnd, endAngle + HALF_PI, innerEndAdjustedAngle + Math.PI);
          }
          // The inner arc from point 5 to point b to point 6
          const innerMidAdjustedAngle = (endAngle - innerEnd / innerRadius + (startAngle + innerStart / innerRadius)) / 2;
          ctx.arc(x, y, innerRadius, endAngle - innerEnd / innerRadius, innerMidAdjustedAngle, true);
          ctx.arc(x, y, innerRadius, innerMidAdjustedAngle, startAngle + innerStart / innerRadius, true);
          // The corner segment from point 6 to point 7
          if (innerStart > 0) {
              const pCenter2 = rThetaToXY(innerStartAdjustedRadius, innerStartAdjustedAngle, x, y);
              ctx.arc(pCenter2.x, pCenter2.y, innerStart, innerStartAdjustedAngle + Math.PI, startAngle - HALF_PI);
          }
          // The line from point 7 to point 8
          const p8 = rThetaToXY(outerStartAdjustedRadius, startAngle, x, y);
          ctx.lineTo(p8.x, p8.y);
          // The corner segment from point 8 to point 1
          if (outerStart > 0) {
              const pCenter3 = rThetaToXY(outerStartAdjustedRadius, outerStartAdjustedAngle, x, y);
              ctx.arc(pCenter3.x, pCenter3.y, outerStart, startAngle - HALF_PI, outerStartAdjustedAngle);
          }
      } else {
          ctx.moveTo(x, y);
          const outerStartX = Math.cos(outerStartAdjustedAngle) * outerRadius + x;
          const outerStartY = Math.sin(outerStartAdjustedAngle) * outerRadius + y;
          ctx.lineTo(outerStartX, outerStartY);
          const outerEndX = Math.cos(outerEndAdjustedAngle) * outerRadius + x;
          const outerEndY = Math.sin(outerEndAdjustedAngle) * outerRadius + y;
          ctx.lineTo(outerEndX, outerEndY);
      }
      ctx.closePath();
  }
  function drawArc(ctx, element, offset, spacing, circular) {
      const { fullCircles , startAngle , circumference  } = element;
      let endAngle = element.endAngle;
      if (fullCircles) {
          pathArc(ctx, element, offset, spacing, endAngle, circular);
          for(let i = 0; i < fullCircles; ++i){
              ctx.fill();
          }
          if (!isNaN(circumference)) {
              endAngle = startAngle + (circumference % TAU || TAU);
          }
      }
      pathArc(ctx, element, offset, spacing, endAngle, circular);
      ctx.fill();
      return endAngle;
  }
  function drawBorder(ctx, element, offset, spacing, circular) {
      const { fullCircles , startAngle , circumference , options  } = element;
      const { borderWidth , borderJoinStyle  } = options;
      const inner = options.borderAlign === 'inner';
      if (!borderWidth) {
          return;
      }
      if (inner) {
          ctx.lineWidth = borderWidth * 2;
          ctx.lineJoin = borderJoinStyle || 'round';
      } else {
          ctx.lineWidth = borderWidth;
          ctx.lineJoin = borderJoinStyle || 'bevel';
      }
      let endAngle = element.endAngle;
      if (fullCircles) {
          pathArc(ctx, element, offset, spacing, endAngle, circular);
          for(let i = 0; i < fullCircles; ++i){
              ctx.stroke();
          }
          if (!isNaN(circumference)) {
              endAngle = startAngle + (circumference % TAU || TAU);
          }
      }
      if (inner) {
          clipArc(ctx, element, endAngle);
      }
      if (!fullCircles) {
          pathArc(ctx, element, offset, spacing, endAngle, circular);
          ctx.stroke();
      }
  }
  class ArcElement extends Element {
      static id = 'arc';
      static defaults = {
          borderAlign: 'center',
          borderColor: '#fff',
          borderJoinStyle: undefined,
          borderRadius: 0,
          borderWidth: 2,
          offset: 0,
          spacing: 0,
          angle: undefined,
          circular: true
      };
      static defaultRoutes = {
          backgroundColor: 'backgroundColor'
      };
      constructor(cfg){
          super();
          this.options = undefined;
          this.circumference = undefined;
          this.startAngle = undefined;
          this.endAngle = undefined;
          this.innerRadius = undefined;
          this.outerRadius = undefined;
          this.pixelMargin = 0;
          this.fullCircles = 0;
          if (cfg) {
              Object.assign(this, cfg);
          }
      }
      inRange(chartX, chartY, useFinalPosition) {
          const point = this.getProps([
              'x',
              'y'
          ], useFinalPosition);
          const { angle , distance  } = getAngleFromPoint(point, {
              x: chartX,
              y: chartY
          });
          const { startAngle , endAngle , innerRadius , outerRadius , circumference  } = this.getProps([
              'startAngle',
              'endAngle',
              'innerRadius',
              'outerRadius',
              'circumference'
          ], useFinalPosition);
          const rAdjust = this.options.spacing / 2;
          const _circumference = valueOrDefault(circumference, endAngle - startAngle);
          const betweenAngles = _circumference >= TAU || _angleBetween(angle, startAngle, endAngle);
          const withinRadius = _isBetween(distance, innerRadius + rAdjust, outerRadius + rAdjust);
          return betweenAngles && withinRadius;
      }
      getCenterPoint(useFinalPosition) {
          const { x , y , startAngle , endAngle , innerRadius , outerRadius  } = this.getProps([
              'x',
              'y',
              'startAngle',
              'endAngle',
              'innerRadius',
              'outerRadius',
              'circumference'
          ], useFinalPosition);
          const { offset , spacing  } = this.options;
          const halfAngle = (startAngle + endAngle) / 2;
          const halfRadius = (innerRadius + outerRadius + spacing + offset) / 2;
          return {
              x: x + Math.cos(halfAngle) * halfRadius,
              y: y + Math.sin(halfAngle) * halfRadius
          };
      }
      tooltipPosition(useFinalPosition) {
          return this.getCenterPoint(useFinalPosition);
      }
      draw(ctx) {
          const { options , circumference  } = this;
          const offset = (options.offset || 0) / 4;
          const spacing = (options.spacing || 0) / 2;
          const circular = options.circular;
          this.pixelMargin = options.borderAlign === 'inner' ? 0.33 : 0;
          this.fullCircles = circumference > TAU ? Math.floor(circumference / TAU) : 0;
          if (circumference === 0 || this.innerRadius < 0 || this.outerRadius < 0) {
              return;
          }
          ctx.save();
          const halfAngle = (this.startAngle + this.endAngle) / 2;
          ctx.translate(Math.cos(halfAngle) * offset, Math.sin(halfAngle) * offset);
          const fix = 1 - Math.sin(Math.min(PI, circumference || 0));
          const radiusOffset = offset * fix;
          ctx.fillStyle = options.backgroundColor;
          ctx.strokeStyle = options.borderColor;
          drawArc(ctx, this, radiusOffset, spacing, circular);
          drawBorder(ctx, this, radiusOffset, spacing, circular);
          ctx.restore();
      }
  }

  function setStyle(ctx, options, style = options) {
      ctx.lineCap = valueOrDefault(style.borderCapStyle, options.borderCapStyle);
      ctx.setLineDash(valueOrDefault(style.borderDash, options.borderDash));
      ctx.lineDashOffset = valueOrDefault(style.borderDashOffset, options.borderDashOffset);
      ctx.lineJoin = valueOrDefault(style.borderJoinStyle, options.borderJoinStyle);
      ctx.lineWidth = valueOrDefault(style.borderWidth, options.borderWidth);
      ctx.strokeStyle = valueOrDefault(style.borderColor, options.borderColor);
  }
  function lineTo(ctx, previous, target) {
      ctx.lineTo(target.x, target.y);
  }
  function getLineMethod(options) {
      if (options.stepped) {
          return _steppedLineTo;
      }
      if (options.tension || options.cubicInterpolationMode === 'monotone') {
          return _bezierCurveTo;
      }
      return lineTo;
  }
  function pathVars(points, segment, params = {}) {
      const count = points.length;
      const { start: paramsStart = 0 , end: paramsEnd = count - 1  } = params;
      const { start: segmentStart , end: segmentEnd  } = segment;
      const start = Math.max(paramsStart, segmentStart);
      const end = Math.min(paramsEnd, segmentEnd);
      const outside = paramsStart < segmentStart && paramsEnd < segmentStart || paramsStart > segmentEnd && paramsEnd > segmentEnd;
      return {
          count,
          start,
          loop: segment.loop,
          ilen: end < start && !outside ? count + end - start : end - start
      };
  }
   function pathSegment(ctx, line, segment, params) {
      const { points , options  } = line;
      const { count , start , loop , ilen  } = pathVars(points, segment, params);
      const lineMethod = getLineMethod(options);
      let { move =true , reverse  } = params || {};
      let i, point, prev;
      for(i = 0; i <= ilen; ++i){
          point = points[(start + (reverse ? ilen - i : i)) % count];
          if (point.skip) {
              continue;
          } else if (move) {
              ctx.moveTo(point.x, point.y);
              move = false;
          } else {
              lineMethod(ctx, prev, point, reverse, options.stepped);
          }
          prev = point;
      }
      if (loop) {
          point = points[(start + (reverse ? ilen : 0)) % count];
          lineMethod(ctx, prev, point, reverse, options.stepped);
      }
      return !!loop;
  }
   function fastPathSegment(ctx, line, segment, params) {
      const points = line.points;
      const { count , start , ilen  } = pathVars(points, segment, params);
      const { move =true , reverse  } = params || {};
      let avgX = 0;
      let countX = 0;
      let i, point, prevX, minY, maxY, lastY;
      const pointIndex = (index)=>(start + (reverse ? ilen - index : index)) % count;
      const drawX = ()=>{
          if (minY !== maxY) {
              ctx.lineTo(avgX, maxY);
              ctx.lineTo(avgX, minY);
              ctx.lineTo(avgX, lastY);
          }
      };
      if (move) {
          point = points[pointIndex(0)];
          ctx.moveTo(point.x, point.y);
      }
      for(i = 0; i <= ilen; ++i){
          point = points[pointIndex(i)];
          if (point.skip) {
              continue;
          }
          const x = point.x;
          const y = point.y;
          const truncX = x | 0;
          if (truncX === prevX) {
              if (y < minY) {
                  minY = y;
              } else if (y > maxY) {
                  maxY = y;
              }
              avgX = (countX * avgX + x) / ++countX;
          } else {
              drawX();
              ctx.lineTo(x, y);
              prevX = truncX;
              countX = 0;
              minY = maxY = y;
          }
          lastY = y;
      }
      drawX();
  }
   function _getSegmentMethod(line) {
      const opts = line.options;
      const borderDash = opts.borderDash && opts.borderDash.length;
      const useFastPath = !line._decimated && !line._loop && !opts.tension && opts.cubicInterpolationMode !== 'monotone' && !opts.stepped && !borderDash;
      return useFastPath ? fastPathSegment : pathSegment;
  }
   function _getInterpolationMethod(options) {
      if (options.stepped) {
          return _steppedInterpolation;
      }
      if (options.tension || options.cubicInterpolationMode === 'monotone') {
          return _bezierInterpolation;
      }
      return _pointInLine;
  }
  function strokePathWithCache(ctx, line, start, count) {
      let path = line._path;
      if (!path) {
          path = line._path = new Path2D();
          if (line.path(path, start, count)) {
              path.closePath();
          }
      }
      setStyle(ctx, line.options);
      ctx.stroke(path);
  }
  function strokePathDirect(ctx, line, start, count) {
      const { segments , options  } = line;
      const segmentMethod = _getSegmentMethod(line);
      for (const segment of segments){
          setStyle(ctx, options, segment.style);
          ctx.beginPath();
          if (segmentMethod(ctx, line, segment, {
              start,
              end: start + count - 1
          })) {
              ctx.closePath();
          }
          ctx.stroke();
      }
  }
  const usePath2D = typeof Path2D === 'function';
  function draw(ctx, line, start, count) {
      if (usePath2D && !line.options.segment) {
          strokePathWithCache(ctx, line, start, count);
      } else {
          strokePathDirect(ctx, line, start, count);
      }
  }
  class LineElement extends Element {
      static id = 'line';
   static defaults = {
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0,
          borderJoinStyle: 'miter',
          borderWidth: 3,
          capBezierPoints: true,
          cubicInterpolationMode: 'default',
          fill: false,
          spanGaps: false,
          stepped: false,
          tension: 0
      };
   static defaultRoutes = {
          backgroundColor: 'backgroundColor',
          borderColor: 'borderColor'
      };
      static descriptors = {
          _scriptable: true,
          _indexable: (name)=>name !== 'borderDash' && name !== 'fill'
      };
      constructor(cfg){
          super();
          this.animated = true;
          this.options = undefined;
          this._chart = undefined;
          this._loop = undefined;
          this._fullLoop = undefined;
          this._path = undefined;
          this._points = undefined;
          this._segments = undefined;
          this._decimated = false;
          this._pointsUpdated = false;
          this._datasetIndex = undefined;
          if (cfg) {
              Object.assign(this, cfg);
          }
      }
      updateControlPoints(chartArea, indexAxis) {
          const options = this.options;
          if ((options.tension || options.cubicInterpolationMode === 'monotone') && !options.stepped && !this._pointsUpdated) {
              const loop = options.spanGaps ? this._loop : this._fullLoop;
              _updateBezierControlPoints(this._points, options, chartArea, loop, indexAxis);
              this._pointsUpdated = true;
          }
      }
      set points(points) {
          this._points = points;
          delete this._segments;
          delete this._path;
          this._pointsUpdated = false;
      }
      get points() {
          return this._points;
      }
      get segments() {
          return this._segments || (this._segments = _computeSegments(this, this.options.segment));
      }
   first() {
          const segments = this.segments;
          const points = this.points;
          return segments.length && points[segments[0].start];
      }
   last() {
          const segments = this.segments;
          const points = this.points;
          const count = segments.length;
          return count && points[segments[count - 1].end];
      }
   interpolate(point, property) {
          const options = this.options;
          const value = point[property];
          const points = this.points;
          const segments = _boundSegments(this, {
              property,
              start: value,
              end: value
          });
          if (!segments.length) {
              return;
          }
          const result = [];
          const _interpolate = _getInterpolationMethod(options);
          let i, ilen;
          for(i = 0, ilen = segments.length; i < ilen; ++i){
              const { start , end  } = segments[i];
              const p1 = points[start];
              const p2 = points[end];
              if (p1 === p2) {
                  result.push(p1);
                  continue;
              }
              const t = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
              const interpolated = _interpolate(p1, p2, t, options.stepped);
              interpolated[property] = point[property];
              result.push(interpolated);
          }
          return result.length === 1 ? result[0] : result;
      }
   pathSegment(ctx, segment, params) {
          const segmentMethod = _getSegmentMethod(this);
          return segmentMethod(ctx, this, segment, params);
      }
   path(ctx, start, count) {
          const segments = this.segments;
          const segmentMethod = _getSegmentMethod(this);
          let loop = this._loop;
          start = start || 0;
          count = count || this.points.length - start;
          for (const segment of segments){
              loop &= segmentMethod(ctx, this, segment, {
                  start,
                  end: start + count - 1
              });
          }
          return !!loop;
      }
   draw(ctx, chartArea, start, count) {
          const options = this.options || {};
          const points = this.points || [];
          if (points.length && options.borderWidth) {
              ctx.save();
              draw(ctx, this, start, count);
              ctx.restore();
          }
          if (this.animated) {
              this._pointsUpdated = false;
              this._path = undefined;
          }
      }
  }

  function inRange$1(el, pos, axis, useFinalPosition) {
      const options = el.options;
      const { [axis]: value  } = el.getProps([
          axis
      ], useFinalPosition);
      return Math.abs(pos - value) < options.radius + options.hitRadius;
  }
  class PointElement extends Element {
      static id = 'point';
      /**
     * @type {any}
     */ static defaults = {
          borderWidth: 1,
          hitRadius: 1,
          hoverBorderWidth: 1,
          hoverRadius: 4,
          pointStyle: 'circle',
          radius: 3,
          rotation: 0
      };
      /**
     * @type {any}
     */ static defaultRoutes = {
          backgroundColor: 'backgroundColor',
          borderColor: 'borderColor'
      };
      constructor(cfg){
          super();
          this.options = undefined;
          this.parsed = undefined;
          this.skip = undefined;
          this.stop = undefined;
          if (cfg) {
              Object.assign(this, cfg);
          }
      }
      inRange(mouseX, mouseY, useFinalPosition) {
          const options = this.options;
          const { x , y  } = this.getProps([
              'x',
              'y'
          ], useFinalPosition);
          return Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2) < Math.pow(options.hitRadius + options.radius, 2);
      }
      inXRange(mouseX, useFinalPosition) {
          return inRange$1(this, mouseX, 'x', useFinalPosition);
      }
      inYRange(mouseY, useFinalPosition) {
          return inRange$1(this, mouseY, 'y', useFinalPosition);
      }
      getCenterPoint(useFinalPosition) {
          const { x , y  } = this.getProps([
              'x',
              'y'
          ], useFinalPosition);
          return {
              x,
              y
          };
      }
      size(options) {
          options = options || this.options || {};
          let radius = options.radius || 0;
          radius = Math.max(radius, radius && options.hoverRadius || 0);
          const borderWidth = radius && options.borderWidth || 0;
          return (radius + borderWidth) * 2;
      }
      draw(ctx, area) {
          const options = this.options;
          if (this.skip || options.radius < 0.1 || !_isPointInArea(this, area, this.size(options) / 2)) {
              return;
          }
          ctx.strokeStyle = options.borderColor;
          ctx.lineWidth = options.borderWidth;
          ctx.fillStyle = options.backgroundColor;
          drawPoint(ctx, options, this.x, this.y);
      }
      getRange() {
          const options = this.options || {};
          // @ts-expect-error Fallbacks should never be hit in practice
          return options.radius + options.hitRadius;
      }
  }

  function getBarBounds(bar, useFinalPosition) {
      const { x , y , base , width , height  } =  bar.getProps([
          'x',
          'y',
          'base',
          'width',
          'height'
      ], useFinalPosition);
      let left, right, top, bottom, half;
      if (bar.horizontal) {
          half = height / 2;
          left = Math.min(x, base);
          right = Math.max(x, base);
          top = y - half;
          bottom = y + half;
      } else {
          half = width / 2;
          left = x - half;
          right = x + half;
          top = Math.min(y, base);
          bottom = Math.max(y, base);
      }
      return {
          left,
          top,
          right,
          bottom
      };
  }
  function skipOrLimit(skip, value, min, max) {
      return skip ? 0 : _limitValue(value, min, max);
  }
  function parseBorderWidth(bar, maxW, maxH) {
      const value = bar.options.borderWidth;
      const skip = bar.borderSkipped;
      const o = toTRBL(value);
      return {
          t: skipOrLimit(skip.top, o.top, 0, maxH),
          r: skipOrLimit(skip.right, o.right, 0, maxW),
          b: skipOrLimit(skip.bottom, o.bottom, 0, maxH),
          l: skipOrLimit(skip.left, o.left, 0, maxW)
      };
  }
  function parseBorderRadius(bar, maxW, maxH) {
      const { enableBorderRadius  } = bar.getProps([
          'enableBorderRadius'
      ]);
      const value = bar.options.borderRadius;
      const o = toTRBLCorners(value);
      const maxR = Math.min(maxW, maxH);
      const skip = bar.borderSkipped;
      const enableBorder = enableBorderRadius || isObject(value);
      return {
          topLeft: skipOrLimit(!enableBorder || skip.top || skip.left, o.topLeft, 0, maxR),
          topRight: skipOrLimit(!enableBorder || skip.top || skip.right, o.topRight, 0, maxR),
          bottomLeft: skipOrLimit(!enableBorder || skip.bottom || skip.left, o.bottomLeft, 0, maxR),
          bottomRight: skipOrLimit(!enableBorder || skip.bottom || skip.right, o.bottomRight, 0, maxR)
      };
  }
  function boundingRects(bar) {
      const bounds = getBarBounds(bar);
      const width = bounds.right - bounds.left;
      const height = bounds.bottom - bounds.top;
      const border = parseBorderWidth(bar, width / 2, height / 2);
      const radius = parseBorderRadius(bar, width / 2, height / 2);
      return {
          outer: {
              x: bounds.left,
              y: bounds.top,
              w: width,
              h: height,
              radius
          },
          inner: {
              x: bounds.left + border.l,
              y: bounds.top + border.t,
              w: width - border.l - border.r,
              h: height - border.t - border.b,
              radius: {
                  topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
                  topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
                  bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
                  bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r))
              }
          }
      };
  }
  function inRange(bar, x, y, useFinalPosition) {
      const skipX = x === null;
      const skipY = y === null;
      const skipBoth = skipX && skipY;
      const bounds = bar && !skipBoth && getBarBounds(bar, useFinalPosition);
      return bounds && (skipX || _isBetween(x, bounds.left, bounds.right)) && (skipY || _isBetween(y, bounds.top, bounds.bottom));
  }
  function hasRadius(radius) {
      return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
  }
   function addNormalRectPath(ctx, rect) {
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  function inflateRect(rect, amount, refRect = {}) {
      const x = rect.x !== refRect.x ? -amount : 0;
      const y = rect.y !== refRect.y ? -amount : 0;
      const w = (rect.x + rect.w !== refRect.x + refRect.w ? amount : 0) - x;
      const h = (rect.y + rect.h !== refRect.y + refRect.h ? amount : 0) - y;
      return {
          x: rect.x + x,
          y: rect.y + y,
          w: rect.w + w,
          h: rect.h + h,
          radius: rect.radius
      };
  }
  class BarElement extends Element {
      static id = 'bar';
   static defaults = {
          borderSkipped: 'start',
          borderWidth: 0,
          borderRadius: 0,
          inflateAmount: 'auto',
          pointStyle: undefined
      };
   static defaultRoutes = {
          backgroundColor: 'backgroundColor',
          borderColor: 'borderColor'
      };
      constructor(cfg){
          super();
          this.options = undefined;
          this.horizontal = undefined;
          this.base = undefined;
          this.width = undefined;
          this.height = undefined;
          this.inflateAmount = undefined;
          if (cfg) {
              Object.assign(this, cfg);
          }
      }
      draw(ctx) {
          const { inflateAmount , options: { borderColor , backgroundColor  }  } = this;
          const { inner , outer  } = boundingRects(this);
          const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;
          ctx.save();
          if (outer.w !== inner.w || outer.h !== inner.h) {
              ctx.beginPath();
              addRectPath(ctx, inflateRect(outer, inflateAmount, inner));
              ctx.clip();
              addRectPath(ctx, inflateRect(inner, -inflateAmount, outer));
              ctx.fillStyle = borderColor;
              ctx.fill('evenodd');
          }
          ctx.beginPath();
          addRectPath(ctx, inflateRect(inner, inflateAmount));
          ctx.fillStyle = backgroundColor;
          ctx.fill();
          ctx.restore();
      }
      inRange(mouseX, mouseY, useFinalPosition) {
          return inRange(this, mouseX, mouseY, useFinalPosition);
      }
      inXRange(mouseX, useFinalPosition) {
          return inRange(this, mouseX, null, useFinalPosition);
      }
      inYRange(mouseY, useFinalPosition) {
          return inRange(this, null, mouseY, useFinalPosition);
      }
      getCenterPoint(useFinalPosition) {
          const { x , y , base , horizontal  } =  this.getProps([
              'x',
              'y',
              'base',
              'horizontal'
          ], useFinalPosition);
          return {
              x: horizontal ? (x + base) / 2 : x,
              y: horizontal ? y : (y + base) / 2
          };
      }
      getRange(axis) {
          return axis === 'x' ? this.width / 2 : this.height / 2;
      }
  }

  var elements = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ArcElement: ArcElement,
  LineElement: LineElement,
  PointElement: PointElement,
  BarElement: BarElement
  });

  const BORDER_COLORS = [
      'rgb(54, 162, 235)',
      'rgb(255, 99, 132)',
      'rgb(255, 159, 64)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(201, 203, 207)' // grey
  ];
  // Border colors with 50% transparency
  const BACKGROUND_COLORS = /* #__PURE__ */ BORDER_COLORS.map((color)=>color.replace('rgb(', 'rgba(').replace(')', ', 0.5)'));
  function getBorderColor(i) {
      return BORDER_COLORS[i % BORDER_COLORS.length];
  }
  function getBackgroundColor(i) {
      return BACKGROUND_COLORS[i % BACKGROUND_COLORS.length];
  }
  function colorizeDefaultDataset(dataset, i) {
      dataset.borderColor = getBorderColor(i);
      dataset.backgroundColor = getBackgroundColor(i);
      return ++i;
  }
  function colorizeDoughnutDataset(dataset, i) {
      dataset.backgroundColor = dataset.data.map(()=>getBorderColor(i++));
      return i;
  }
  function colorizePolarAreaDataset(dataset, i) {
      dataset.backgroundColor = dataset.data.map(()=>getBackgroundColor(i++));
      return i;
  }
  function getColorizer(chart) {
      let i = 0;
      return (dataset, datasetIndex)=>{
          const controller = chart.getDatasetMeta(datasetIndex).controller;
          if (controller instanceof DoughnutController) {
              i = colorizeDoughnutDataset(dataset, i);
          } else if (controller instanceof PolarAreaController) {
              i = colorizePolarAreaDataset(dataset, i);
          } else if (controller) {
              i = colorizeDefaultDataset(dataset, i);
          }
      };
  }
  function containsColorsDefinitions(descriptors) {
      let k;
      for(k in descriptors){
          if (descriptors[k].borderColor || descriptors[k].backgroundColor) {
              return true;
          }
      }
      return false;
  }
  function containsColorsDefinition(descriptor) {
      return descriptor && (descriptor.borderColor || descriptor.backgroundColor);
  }
  var plugin_colors = {
      id: 'colors',
      defaults: {
          enabled: true,
          forceOverride: false
      },
      beforeLayout (chart, _args, options) {
          if (!options.enabled) {
              return;
          }
          const { data: { datasets  } , options: chartOptions  } = chart.config;
          const { elements  } = chartOptions;
          if (!options.forceOverride && (containsColorsDefinitions(datasets) || containsColorsDefinition(chartOptions) || elements && containsColorsDefinitions(elements))) {
              return;
          }
          const colorizer = getColorizer(chart);
          datasets.forEach(colorizer);
      }
  };

  function lttbDecimation(data, start, count, availableWidth, options) {
   const samples = options.samples || availableWidth;
      if (samples >= count) {
          return data.slice(start, start + count);
      }
      const decimated = [];
      const bucketWidth = (count - 2) / (samples - 2);
      let sampledIndex = 0;
      const endIndex = start + count - 1;
      let a = start;
      let i, maxAreaPoint, maxArea, area, nextA;
      decimated[sampledIndex++] = data[a];
      for(i = 0; i < samples - 2; i++){
          let avgX = 0;
          let avgY = 0;
          let j;
          const avgRangeStart = Math.floor((i + 1) * bucketWidth) + 1 + start;
          const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketWidth) + 1, count) + start;
          const avgRangeLength = avgRangeEnd - avgRangeStart;
          for(j = avgRangeStart; j < avgRangeEnd; j++){
              avgX += data[j].x;
              avgY += data[j].y;
          }
          avgX /= avgRangeLength;
          avgY /= avgRangeLength;
          const rangeOffs = Math.floor(i * bucketWidth) + 1 + start;
          const rangeTo = Math.min(Math.floor((i + 1) * bucketWidth) + 1, count) + start;
          const { x: pointAx , y: pointAy  } = data[a];
          maxArea = area = -1;
          for(j = rangeOffs; j < rangeTo; j++){
              area = 0.5 * Math.abs((pointAx - avgX) * (data[j].y - pointAy) - (pointAx - data[j].x) * (avgY - pointAy));
              if (area > maxArea) {
                  maxArea = area;
                  maxAreaPoint = data[j];
                  nextA = j;
              }
          }
          decimated[sampledIndex++] = maxAreaPoint;
          a = nextA;
      }
      decimated[sampledIndex++] = data[endIndex];
      return decimated;
  }
  function minMaxDecimation(data, start, count, availableWidth) {
      let avgX = 0;
      let countX = 0;
      let i, point, x, y, prevX, minIndex, maxIndex, startIndex, minY, maxY;
      const decimated = [];
      const endIndex = start + count - 1;
      const xMin = data[start].x;
      const xMax = data[endIndex].x;
      const dx = xMax - xMin;
      for(i = start; i < start + count; ++i){
          point = data[i];
          x = (point.x - xMin) / dx * availableWidth;
          y = point.y;
          const truncX = x | 0;
          if (truncX === prevX) {
              if (y < minY) {
                  minY = y;
                  minIndex = i;
              } else if (y > maxY) {
                  maxY = y;
                  maxIndex = i;
              }
              avgX = (countX * avgX + point.x) / ++countX;
          } else {
              const lastIndex = i - 1;
              if (!isNullOrUndef(minIndex) && !isNullOrUndef(maxIndex)) {
                  const intermediateIndex1 = Math.min(minIndex, maxIndex);
                  const intermediateIndex2 = Math.max(minIndex, maxIndex);
                  if (intermediateIndex1 !== startIndex && intermediateIndex1 !== lastIndex) {
                      decimated.push({
                          ...data[intermediateIndex1],
                          x: avgX
                      });
                  }
                  if (intermediateIndex2 !== startIndex && intermediateIndex2 !== lastIndex) {
                      decimated.push({
                          ...data[intermediateIndex2],
                          x: avgX
                      });
                  }
              }
              if (i > 0 && lastIndex !== startIndex) {
                  decimated.push(data[lastIndex]);
              }
              decimated.push(point);
              prevX = truncX;
              countX = 0;
              minY = maxY = y;
              minIndex = maxIndex = startIndex = i;
          }
      }
      return decimated;
  }
  function cleanDecimatedDataset(dataset) {
      if (dataset._decimated) {
          const data = dataset._data;
          delete dataset._decimated;
          delete dataset._data;
          Object.defineProperty(dataset, 'data', {
              value: data
          });
      }
  }
  function cleanDecimatedData(chart) {
      chart.data.datasets.forEach((dataset)=>{
          cleanDecimatedDataset(dataset);
      });
  }
  function getStartAndCountOfVisiblePointsSimplified(meta, points) {
      const pointCount = points.length;
      let start = 0;
      let count;
      const { iScale  } = meta;
      const { min , max , minDefined , maxDefined  } = iScale.getUserBounds();
      if (minDefined) {
          start = _limitValue(_lookupByKey(points, iScale.axis, min).lo, 0, pointCount - 1);
      }
      if (maxDefined) {
          count = _limitValue(_lookupByKey(points, iScale.axis, max).hi + 1, start, pointCount) - start;
      } else {
          count = pointCount - start;
      }
      return {
          start,
          count
      };
  }
  var plugin_decimation = {
      id: 'decimation',
      defaults: {
          algorithm: 'min-max',
          enabled: false
      },
      beforeElementsUpdate: (chart, args, options)=>{
          if (!options.enabled) {
              cleanDecimatedData(chart);
              return;
          }
          const availableWidth = chart.width;
          chart.data.datasets.forEach((dataset, datasetIndex)=>{
              const { _data , indexAxis  } = dataset;
              const meta = chart.getDatasetMeta(datasetIndex);
              const data = _data || dataset.data;
              if (resolve([
                  indexAxis,
                  chart.options.indexAxis
              ]) === 'y') {
                  return;
              }
              if (!meta.controller.supportsDecimation) {
                  return;
              }
              const xAxis = chart.scales[meta.xAxisID];
              if (xAxis.type !== 'linear' && xAxis.type !== 'time') {
                  return;
              }
              if (chart.options.parsing) {
                  return;
              }
              let { start , count  } = getStartAndCountOfVisiblePointsSimplified(meta, data);
              const threshold = options.threshold || 4 * availableWidth;
              if (count <= threshold) {
                  cleanDecimatedDataset(dataset);
                  return;
              }
              if (isNullOrUndef(_data)) {
                  dataset._data = data;
                  delete dataset.data;
                  Object.defineProperty(dataset, 'data', {
                      configurable: true,
                      enumerable: true,
                      get: function() {
                          return this._decimated;
                      },
                      set: function(d) {
                          this._data = d;
                      }
                  });
              }
              let decimated;
              switch(options.algorithm){
                  case 'lttb':
                      decimated = lttbDecimation(data, start, count, availableWidth, options);
                      break;
                  case 'min-max':
                      decimated = minMaxDecimation(data, start, count, availableWidth);
                      break;
                  default:
                      throw new Error(`Unsupported decimation algorithm '${options.algorithm}'`);
              }
              dataset._decimated = decimated;
          });
      },
      destroy (chart) {
          cleanDecimatedData(chart);
      }
  };

  function _segments(line, target, property) {
      const segments = line.segments;
      const points = line.points;
      const tpoints = target.points;
      const parts = [];
      for (const segment of segments){
          let { start , end  } = segment;
          end = _findSegmentEnd(start, end, points);
          const bounds = _getBounds(property, points[start], points[end], segment.loop);
          if (!target.segments) {
              parts.push({
                  source: segment,
                  target: bounds,
                  start: points[start],
                  end: points[end]
              });
              continue;
          }
          const targetSegments = _boundSegments(target, bounds);
          for (const tgt of targetSegments){
              const subBounds = _getBounds(property, tpoints[tgt.start], tpoints[tgt.end], tgt.loop);
              const fillSources = _boundSegment(segment, points, subBounds);
              for (const fillSource of fillSources){
                  parts.push({
                      source: fillSource,
                      target: tgt,
                      start: {
                          [property]: _getEdge(bounds, subBounds, 'start', Math.max)
                      },
                      end: {
                          [property]: _getEdge(bounds, subBounds, 'end', Math.min)
                      }
                  });
              }
          }
      }
      return parts;
  }
  function _getBounds(property, first, last, loop) {
      if (loop) {
          return;
      }
      let start = first[property];
      let end = last[property];
      if (property === 'angle') {
          start = _normalizeAngle(start);
          end = _normalizeAngle(end);
      }
      return {
          property,
          start,
          end
      };
  }
  function _pointsFromSegments(boundary, line) {
      const { x =null , y =null  } = boundary || {};
      const linePoints = line.points;
      const points = [];
      line.segments.forEach(({ start , end  })=>{
          end = _findSegmentEnd(start, end, linePoints);
          const first = linePoints[start];
          const last = linePoints[end];
          if (y !== null) {
              points.push({
                  x: first.x,
                  y
              });
              points.push({
                  x: last.x,
                  y
              });
          } else if (x !== null) {
              points.push({
                  x,
                  y: first.y
              });
              points.push({
                  x,
                  y: last.y
              });
          }
      });
      return points;
  }
  function _findSegmentEnd(start, end, points) {
      for(; end > start; end--){
          const point = points[end];
          if (!isNaN(point.x) && !isNaN(point.y)) {
              break;
          }
      }
      return end;
  }
  function _getEdge(a, b, prop, fn) {
      if (a && b) {
          return fn(a[prop], b[prop]);
      }
      return a ? a[prop] : b ? b[prop] : 0;
  }

  function _createBoundaryLine(boundary, line) {
      let points = [];
      let _loop = false;
      if (isArray(boundary)) {
          _loop = true;
          points = boundary;
      } else {
          points = _pointsFromSegments(boundary, line);
      }
      return points.length ? new LineElement({
          points,
          options: {
              tension: 0
          },
          _loop,
          _fullLoop: _loop
      }) : null;
  }
  function _shouldApplyFill(source) {
      return source && source.fill !== false;
  }

  function _resolveTarget(sources, index, propagate) {
      const source = sources[index];
      let fill = source.fill;
      const visited = [
          index
      ];
      let target;
      if (!propagate) {
          return fill;
      }
      while(fill !== false && visited.indexOf(fill) === -1){
          if (!isNumberFinite(fill)) {
              return fill;
          }
          target = sources[fill];
          if (!target) {
              return false;
          }
          if (target.visible) {
              return fill;
          }
          visited.push(fill);
          fill = target.fill;
      }
      return false;
  }
   function _decodeFill(line, index, count) {
       const fill = parseFillOption(line);
      if (isObject(fill)) {
          return isNaN(fill.value) ? false : fill;
      }
      let target = parseFloat(fill);
      if (isNumberFinite(target) && Math.floor(target) === target) {
          return decodeTargetIndex(fill[0], index, target, count);
      }
      return [
          'origin',
          'start',
          'end',
          'stack',
          'shape'
      ].indexOf(fill) >= 0 && fill;
  }
  function decodeTargetIndex(firstCh, index, target, count) {
      if (firstCh === '-' || firstCh === '+') {
          target = index + target;
      }
      if (target === index || target < 0 || target >= count) {
          return false;
      }
      return target;
  }
   function _getTargetPixel(fill, scale) {
      let pixel = null;
      if (fill === 'start') {
          pixel = scale.bottom;
      } else if (fill === 'end') {
          pixel = scale.top;
      } else if (isObject(fill)) {
          pixel = scale.getPixelForValue(fill.value);
      } else if (scale.getBasePixel) {
          pixel = scale.getBasePixel();
      }
      return pixel;
  }
   function _getTargetValue(fill, scale, startValue) {
      let value;
      if (fill === 'start') {
          value = startValue;
      } else if (fill === 'end') {
          value = scale.options.reverse ? scale.min : scale.max;
      } else if (isObject(fill)) {
          value = fill.value;
      } else {
          value = scale.getBaseValue();
      }
      return value;
  }
   function parseFillOption(line) {
      const options = line.options;
      const fillOption = options.fill;
      let fill = valueOrDefault(fillOption && fillOption.target, fillOption);
      if (fill === undefined) {
          fill = !!options.backgroundColor;
      }
      if (fill === false || fill === null) {
          return false;
      }
      if (fill === true) {
          return 'origin';
      }
      return fill;
  }

  function _buildStackLine(source) {
      const { scale , index , line  } = source;
      const points = [];
      const segments = line.segments;
      const sourcePoints = line.points;
      const linesBelow = getLinesBelow(scale, index);
      linesBelow.push(_createBoundaryLine({
          x: null,
          y: scale.bottom
      }, line));
      for(let i = 0; i < segments.length; i++){
          const segment = segments[i];
          for(let j = segment.start; j <= segment.end; j++){
              addPointsBelow(points, sourcePoints[j], linesBelow);
          }
      }
      return new LineElement({
          points,
          options: {}
      });
  }
   function getLinesBelow(scale, index) {
      const below = [];
      const metas = scale.getMatchingVisibleMetas('line');
      for(let i = 0; i < metas.length; i++){
          const meta = metas[i];
          if (meta.index === index) {
              break;
          }
          if (!meta.hidden) {
              below.unshift(meta.dataset);
          }
      }
      return below;
  }
   function addPointsBelow(points, sourcePoint, linesBelow) {
      const postponed = [];
      for(let j = 0; j < linesBelow.length; j++){
          const line = linesBelow[j];
          const { first , last , point  } = findPoint(line, sourcePoint, 'x');
          if (!point || first && last) {
              continue;
          }
          if (first) {
              postponed.unshift(point);
          } else {
              points.push(point);
              if (!last) {
                  break;
              }
          }
      }
      points.push(...postponed);
  }
   function findPoint(line, sourcePoint, property) {
      const point = line.interpolate(sourcePoint, property);
      if (!point) {
          return {};
      }
      const pointValue = point[property];
      const segments = line.segments;
      const linePoints = line.points;
      let first = false;
      let last = false;
      for(let i = 0; i < segments.length; i++){
          const segment = segments[i];
          const firstValue = linePoints[segment.start][property];
          const lastValue = linePoints[segment.end][property];
          if (_isBetween(pointValue, firstValue, lastValue)) {
              first = pointValue === firstValue;
              last = pointValue === lastValue;
              break;
          }
      }
      return {
          first,
          last,
          point
      };
  }

  class simpleArc {
      constructor(opts){
          this.x = opts.x;
          this.y = opts.y;
          this.radius = opts.radius;
      }
      pathSegment(ctx, bounds, opts) {
          const { x , y , radius  } = this;
          bounds = bounds || {
              start: 0,
              end: TAU
          };
          ctx.arc(x, y, radius, bounds.end, bounds.start, true);
          return !opts.bounds;
      }
      interpolate(point) {
          const { x , y , radius  } = this;
          const angle = point.angle;
          return {
              x: x + Math.cos(angle) * radius,
              y: y + Math.sin(angle) * radius,
              angle
          };
      }
  }

  function _getTarget(source) {
      const { chart , fill , line  } = source;
      if (isNumberFinite(fill)) {
          return getLineByIndex(chart, fill);
      }
      if (fill === 'stack') {
          return _buildStackLine(source);
      }
      if (fill === 'shape') {
          return true;
      }
      const boundary = computeBoundary(source);
      if (boundary instanceof simpleArc) {
          return boundary;
      }
      return _createBoundaryLine(boundary, line);
  }
   function getLineByIndex(chart, index) {
      const meta = chart.getDatasetMeta(index);
      const visible = meta && chart.isDatasetVisible(index);
      return visible ? meta.dataset : null;
  }
  function computeBoundary(source) {
      const scale = source.scale || {};
      if (scale.getPointPositionForValue) {
          return computeCircularBoundary(source);
      }
      return computeLinearBoundary(source);
  }
  function computeLinearBoundary(source) {
      const { scale ={} , fill  } = source;
      const pixel = _getTargetPixel(fill, scale);
      if (isNumberFinite(pixel)) {
          const horizontal = scale.isHorizontal();
          return {
              x: horizontal ? pixel : null,
              y: horizontal ? null : pixel
          };
      }
      return null;
  }
  function computeCircularBoundary(source) {
      const { scale , fill  } = source;
      const options = scale.options;
      const length = scale.getLabels().length;
      const start = options.reverse ? scale.max : scale.min;
      const value = _getTargetValue(fill, scale, start);
      const target = [];
      if (options.grid.circular) {
          const center = scale.getPointPositionForValue(0, start);
          return new simpleArc({
              x: center.x,
              y: center.y,
              radius: scale.getDistanceFromCenterForValue(value)
          });
      }
      for(let i = 0; i < length; ++i){
          target.push(scale.getPointPositionForValue(i, value));
      }
      return target;
  }

  function _drawfill(ctx, source, area) {
      const target = _getTarget(source);
      const { line , scale , axis  } = source;
      const lineOpts = line.options;
      const fillOption = lineOpts.fill;
      const color = lineOpts.backgroundColor;
      const { above =color , below =color  } = fillOption || {};
      if (target && line.points.length) {
          clipArea(ctx, area);
          doFill(ctx, {
              line,
              target,
              above,
              below,
              area,
              scale,
              axis
          });
          unclipArea(ctx);
      }
  }
  function doFill(ctx, cfg) {
      const { line , target , above , below , area , scale  } = cfg;
      const property = line._loop ? 'angle' : cfg.axis;
      ctx.save();
      if (property === 'x' && below !== above) {
          clipVertical(ctx, target, area.top);
          fill(ctx, {
              line,
              target,
              color: above,
              scale,
              property
          });
          ctx.restore();
          ctx.save();
          clipVertical(ctx, target, area.bottom);
      }
      fill(ctx, {
          line,
          target,
          color: below,
          scale,
          property
      });
      ctx.restore();
  }
  function clipVertical(ctx, target, clipY) {
      const { segments , points  } = target;
      let first = true;
      let lineLoop = false;
      ctx.beginPath();
      for (const segment of segments){
          const { start , end  } = segment;
          const firstPoint = points[start];
          const lastPoint = points[_findSegmentEnd(start, end, points)];
          if (first) {
              ctx.moveTo(firstPoint.x, firstPoint.y);
              first = false;
          } else {
              ctx.lineTo(firstPoint.x, clipY);
              ctx.lineTo(firstPoint.x, firstPoint.y);
          }
          lineLoop = !!target.pathSegment(ctx, segment, {
              move: lineLoop
          });
          if (lineLoop) {
              ctx.closePath();
          } else {
              ctx.lineTo(lastPoint.x, clipY);
          }
      }
      ctx.lineTo(target.first().x, clipY);
      ctx.closePath();
      ctx.clip();
  }
  function fill(ctx, cfg) {
      const { line , target , property , color , scale  } = cfg;
      const segments = _segments(line, target, property);
      for (const { source: src , target: tgt , start , end  } of segments){
          const { style: { backgroundColor =color  } = {}  } = src;
          const notShape = target !== true;
          ctx.save();
          ctx.fillStyle = backgroundColor;
          clipBounds(ctx, scale, notShape && _getBounds(property, start, end));
          ctx.beginPath();
          const lineLoop = !!line.pathSegment(ctx, src);
          let loop;
          if (notShape) {
              if (lineLoop) {
                  ctx.closePath();
              } else {
                  interpolatedLineTo(ctx, target, end, property);
              }
              const targetLoop = !!target.pathSegment(ctx, tgt, {
                  move: lineLoop,
                  reverse: true
              });
              loop = lineLoop && targetLoop;
              if (!loop) {
                  interpolatedLineTo(ctx, target, start, property);
              }
          }
          ctx.closePath();
          ctx.fill(loop ? 'evenodd' : 'nonzero');
          ctx.restore();
      }
  }
  function clipBounds(ctx, scale, bounds) {
      const { top , bottom  } = scale.chart.chartArea;
      const { property , start , end  } = bounds || {};
      if (property === 'x') {
          ctx.beginPath();
          ctx.rect(start, top, end - start, bottom - top);
          ctx.clip();
      }
  }
  function interpolatedLineTo(ctx, target, point, property) {
      const interpolatedPoint = target.interpolate(point, property);
      if (interpolatedPoint) {
          ctx.lineTo(interpolatedPoint.x, interpolatedPoint.y);
      }
  }

  var index = {
      id: 'filler',
      afterDatasetsUpdate (chart, _args, options) {
          const count = (chart.data.datasets || []).length;
          const sources = [];
          let meta, i, line, source;
          for(i = 0; i < count; ++i){
              meta = chart.getDatasetMeta(i);
              line = meta.dataset;
              source = null;
              if (line && line.options && line instanceof LineElement) {
                  source = {
                      visible: chart.isDatasetVisible(i),
                      index: i,
                      fill: _decodeFill(line, i, count),
                      chart,
                      axis: meta.controller.options.indexAxis,
                      scale: meta.vScale,
                      line
                  };
              }
              meta.$filler = source;
              sources.push(source);
          }
          for(i = 0; i < count; ++i){
              source = sources[i];
              if (!source || source.fill === false) {
                  continue;
              }
              source.fill = _resolveTarget(sources, i, options.propagate);
          }
      },
      beforeDraw (chart, _args, options) {
          const draw = options.drawTime === 'beforeDraw';
          const metasets = chart.getSortedVisibleDatasetMetas();
          const area = chart.chartArea;
          for(let i = metasets.length - 1; i >= 0; --i){
              const source = metasets[i].$filler;
              if (!source) {
                  continue;
              }
              source.line.updateControlPoints(area, source.axis);
              if (draw && source.fill) {
                  _drawfill(chart.ctx, source, area);
              }
          }
      },
      beforeDatasetsDraw (chart, _args, options) {
          if (options.drawTime !== 'beforeDatasetsDraw') {
              return;
          }
          const metasets = chart.getSortedVisibleDatasetMetas();
          for(let i = metasets.length - 1; i >= 0; --i){
              const source = metasets[i].$filler;
              if (_shouldApplyFill(source)) {
                  _drawfill(chart.ctx, source, chart.chartArea);
              }
          }
      },
      beforeDatasetDraw (chart, args, options) {
          const source = args.meta.$filler;
          if (!_shouldApplyFill(source) || options.drawTime !== 'beforeDatasetDraw') {
              return;
          }
          _drawfill(chart.ctx, source, chart.chartArea);
      },
      defaults: {
          propagate: true,
          drawTime: 'beforeDatasetDraw'
      }
  };

  const getBoxSize = (labelOpts, fontSize)=>{
      let { boxHeight =fontSize , boxWidth =fontSize  } = labelOpts;
      if (labelOpts.usePointStyle) {
          boxHeight = Math.min(boxHeight, fontSize);
          boxWidth = labelOpts.pointStyleWidth || Math.min(boxWidth, fontSize);
      }
      return {
          boxWidth,
          boxHeight,
          itemHeight: Math.max(fontSize, boxHeight)
      };
  };
  const itemsEqual = (a, b)=>a !== null && b !== null && a.datasetIndex === b.datasetIndex && a.index === b.index;
  class Legend extends Element {
   constructor(config){
          super();
          this._added = false;
          this.legendHitBoxes = [];
   this._hoveredItem = null;
          this.doughnutMode = false;
          this.chart = config.chart;
          this.options = config.options;
          this.ctx = config.ctx;
          this.legendItems = undefined;
          this.columnSizes = undefined;
          this.lineWidths = undefined;
          this.maxHeight = undefined;
          this.maxWidth = undefined;
          this.top = undefined;
          this.bottom = undefined;
          this.left = undefined;
          this.right = undefined;
          this.height = undefined;
          this.width = undefined;
          this._margins = undefined;
          this.position = undefined;
          this.weight = undefined;
          this.fullSize = undefined;
      }
      update(maxWidth, maxHeight, margins) {
          this.maxWidth = maxWidth;
          this.maxHeight = maxHeight;
          this._margins = margins;
          this.setDimensions();
          this.buildLabels();
          this.fit();
      }
      setDimensions() {
          if (this.isHorizontal()) {
              this.width = this.maxWidth;
              this.left = this._margins.left;
              this.right = this.width;
          } else {
              this.height = this.maxHeight;
              this.top = this._margins.top;
              this.bottom = this.height;
          }
      }
      buildLabels() {
          const labelOpts = this.options.labels || {};
          let legendItems = callback(labelOpts.generateLabels, [
              this.chart
          ], this) || [];
          if (labelOpts.filter) {
              legendItems = legendItems.filter((item)=>labelOpts.filter(item, this.chart.data));
          }
          if (labelOpts.sort) {
              legendItems = legendItems.sort((a, b)=>labelOpts.sort(a, b, this.chart.data));
          }
          if (this.options.reverse) {
              legendItems.reverse();
          }
          this.legendItems = legendItems;
      }
      fit() {
          const { options , ctx  } = this;
          if (!options.display) {
              this.width = this.height = 0;
              return;
          }
          const labelOpts = options.labels;
          const labelFont = toFont(labelOpts.font);
          const fontSize = labelFont.size;
          const titleHeight = this._computeTitleHeight();
          const { boxWidth , itemHeight  } = getBoxSize(labelOpts, fontSize);
          let width, height;
          ctx.font = labelFont.string;
          if (this.isHorizontal()) {
              width = this.maxWidth;
              height = this._fitRows(titleHeight, fontSize, boxWidth, itemHeight) + 10;
          } else {
              height = this.maxHeight;
              width = this._fitCols(titleHeight, labelFont, boxWidth, itemHeight) + 10;
          }
          this.width = Math.min(width, options.maxWidth || this.maxWidth);
          this.height = Math.min(height, options.maxHeight || this.maxHeight);
      }
   _fitRows(titleHeight, fontSize, boxWidth, itemHeight) {
          const { ctx , maxWidth , options: { labels: { padding  }  }  } = this;
          const hitboxes = this.legendHitBoxes = [];
          const lineWidths = this.lineWidths = [
              0
          ];
          const lineHeight = itemHeight + padding;
          let totalHeight = titleHeight;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          let row = -1;
          let top = -lineHeight;
          this.legendItems.forEach((legendItem, i)=>{
              const itemWidth = boxWidth + fontSize / 2 + ctx.measureText(legendItem.text).width;
              if (i === 0 || lineWidths[lineWidths.length - 1] + itemWidth + 2 * padding > maxWidth) {
                  totalHeight += lineHeight;
                  lineWidths[lineWidths.length - (i > 0 ? 0 : 1)] = 0;
                  top += lineHeight;
                  row++;
              }
              hitboxes[i] = {
                  left: 0,
                  top,
                  row,
                  width: itemWidth,
                  height: itemHeight
              };
              lineWidths[lineWidths.length - 1] += itemWidth + padding;
          });
          return totalHeight;
      }
      _fitCols(titleHeight, labelFont, boxWidth, _itemHeight) {
          const { ctx , maxHeight , options: { labels: { padding  }  }  } = this;
          const hitboxes = this.legendHitBoxes = [];
          const columnSizes = this.columnSizes = [];
          const heightLimit = maxHeight - titleHeight;
          let totalWidth = padding;
          let currentColWidth = 0;
          let currentColHeight = 0;
          let left = 0;
          let col = 0;
          this.legendItems.forEach((legendItem, i)=>{
              const { itemWidth , itemHeight  } = calculateItemSize(boxWidth, labelFont, ctx, legendItem, _itemHeight);
              if (i > 0 && currentColHeight + itemHeight + 2 * padding > heightLimit) {
                  totalWidth += currentColWidth + padding;
                  columnSizes.push({
                      width: currentColWidth,
                      height: currentColHeight
                  });
                  left += currentColWidth + padding;
                  col++;
                  currentColWidth = currentColHeight = 0;
              }
              hitboxes[i] = {
                  left,
                  top: currentColHeight,
                  col,
                  width: itemWidth,
                  height: itemHeight
              };
              currentColWidth = Math.max(currentColWidth, itemWidth);
              currentColHeight += itemHeight + padding;
          });
          totalWidth += currentColWidth;
          columnSizes.push({
              width: currentColWidth,
              height: currentColHeight
          });
          return totalWidth;
      }
      adjustHitBoxes() {
          if (!this.options.display) {
              return;
          }
          const titleHeight = this._computeTitleHeight();
          const { legendHitBoxes: hitboxes , options: { align , labels: { padding  } , rtl  }  } = this;
          const rtlHelper = getRtlAdapter(rtl, this.left, this.width);
          if (this.isHorizontal()) {
              let row = 0;
              let left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
              for (const hitbox of hitboxes){
                  if (row !== hitbox.row) {
                      row = hitbox.row;
                      left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
                  }
                  hitbox.top += this.top + titleHeight + padding;
                  hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(left), hitbox.width);
                  left += hitbox.width + padding;
              }
          } else {
              let col = 0;
              let top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
              for (const hitbox1 of hitboxes){
                  if (hitbox1.col !== col) {
                      col = hitbox1.col;
                      top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
                  }
                  hitbox1.top = top;
                  hitbox1.left += this.left + padding;
                  hitbox1.left = rtlHelper.leftForLtr(rtlHelper.x(hitbox1.left), hitbox1.width);
                  top += hitbox1.height + padding;
              }
          }
      }
      isHorizontal() {
          return this.options.position === 'top' || this.options.position === 'bottom';
      }
      draw() {
          if (this.options.display) {
              const ctx = this.ctx;
              clipArea(ctx, this);
              this._draw();
              unclipArea(ctx);
          }
      }
   _draw() {
          const { options: opts , columnSizes , lineWidths , ctx  } = this;
          const { align , labels: labelOpts  } = opts;
          const defaultColor = defaults.color;
          const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
          const labelFont = toFont(labelOpts.font);
          const { padding  } = labelOpts;
          const fontSize = labelFont.size;
          const halfFontSize = fontSize / 2;
          let cursor;
          this.drawTitle();
          ctx.textAlign = rtlHelper.textAlign('left');
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 0.5;
          ctx.font = labelFont.string;
          const { boxWidth , boxHeight , itemHeight  } = getBoxSize(labelOpts, fontSize);
          const drawLegendBox = function(x, y, legendItem) {
              if (isNaN(boxWidth) || boxWidth <= 0 || isNaN(boxHeight) || boxHeight < 0) {
                  return;
              }
              ctx.save();
              const lineWidth = valueOrDefault(legendItem.lineWidth, 1);
              ctx.fillStyle = valueOrDefault(legendItem.fillStyle, defaultColor);
              ctx.lineCap = valueOrDefault(legendItem.lineCap, 'butt');
              ctx.lineDashOffset = valueOrDefault(legendItem.lineDashOffset, 0);
              ctx.lineJoin = valueOrDefault(legendItem.lineJoin, 'miter');
              ctx.lineWidth = lineWidth;
              ctx.strokeStyle = valueOrDefault(legendItem.strokeStyle, defaultColor);
              ctx.setLineDash(valueOrDefault(legendItem.lineDash, []));
              if (labelOpts.usePointStyle) {
                  const drawOptions = {
                      radius: boxHeight * Math.SQRT2 / 2,
                      pointStyle: legendItem.pointStyle,
                      rotation: legendItem.rotation,
                      borderWidth: lineWidth
                  };
                  const centerX = rtlHelper.xPlus(x, boxWidth / 2);
                  const centerY = y + halfFontSize;
                  drawPointLegend(ctx, drawOptions, centerX, centerY, labelOpts.pointStyleWidth && boxWidth);
              } else {
                  const yBoxTop = y + Math.max((fontSize - boxHeight) / 2, 0);
                  const xBoxLeft = rtlHelper.leftForLtr(x, boxWidth);
                  const borderRadius = toTRBLCorners(legendItem.borderRadius);
                  ctx.beginPath();
                  if (Object.values(borderRadius).some((v)=>v !== 0)) {
                      addRoundedRectPath(ctx, {
                          x: xBoxLeft,
                          y: yBoxTop,
                          w: boxWidth,
                          h: boxHeight,
                          radius: borderRadius
                      });
                  } else {
                      ctx.rect(xBoxLeft, yBoxTop, boxWidth, boxHeight);
                  }
                  ctx.fill();
                  if (lineWidth !== 0) {
                      ctx.stroke();
                  }
              }
              ctx.restore();
          };
          const fillText = function(x, y, legendItem) {
              renderText(ctx, legendItem.text, x, y + itemHeight / 2, labelFont, {
                  strikethrough: legendItem.hidden,
                  textAlign: rtlHelper.textAlign(legendItem.textAlign)
              });
          };
          const isHorizontal = this.isHorizontal();
          const titleHeight = this._computeTitleHeight();
          if (isHorizontal) {
              cursor = {
                  x: _alignStartEnd(align, this.left + padding, this.right - lineWidths[0]),
                  y: this.top + padding + titleHeight,
                  line: 0
              };
          } else {
              cursor = {
                  x: this.left + padding,
                  y: _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - columnSizes[0].height),
                  line: 0
              };
          }
          overrideTextDirection(this.ctx, opts.textDirection);
          const lineHeight = itemHeight + padding;
          this.legendItems.forEach((legendItem, i)=>{
              ctx.strokeStyle = legendItem.fontColor;
              ctx.fillStyle = legendItem.fontColor;
              const textWidth = ctx.measureText(legendItem.text).width;
              const textAlign = rtlHelper.textAlign(legendItem.textAlign || (legendItem.textAlign = labelOpts.textAlign));
              const width = boxWidth + halfFontSize + textWidth;
              let x = cursor.x;
              let y = cursor.y;
              rtlHelper.setWidth(this.width);
              if (isHorizontal) {
                  if (i > 0 && x + width + padding > this.right) {
                      y = cursor.y += lineHeight;
                      cursor.line++;
                      x = cursor.x = _alignStartEnd(align, this.left + padding, this.right - lineWidths[cursor.line]);
                  }
              } else if (i > 0 && y + lineHeight > this.bottom) {
                  x = cursor.x = x + columnSizes[cursor.line].width + padding;
                  cursor.line++;
                  y = cursor.y = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - columnSizes[cursor.line].height);
              }
              const realX = rtlHelper.x(x);
              drawLegendBox(realX, y, legendItem);
              x = _textX(textAlign, x + boxWidth + halfFontSize, isHorizontal ? x + width : this.right, opts.rtl);
              fillText(rtlHelper.x(x), y, legendItem);
              if (isHorizontal) {
                  cursor.x += width + padding;
              } else if (typeof legendItem.text !== 'string') {
                  const fontLineHeight = labelFont.lineHeight;
                  cursor.y += calculateLegendItemHeight(legendItem, fontLineHeight);
              } else {
                  cursor.y += lineHeight;
              }
          });
          restoreTextDirection(this.ctx, opts.textDirection);
      }
   drawTitle() {
          const opts = this.options;
          const titleOpts = opts.title;
          const titleFont = toFont(titleOpts.font);
          const titlePadding = toPadding(titleOpts.padding);
          if (!titleOpts.display) {
              return;
          }
          const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
          const ctx = this.ctx;
          const position = titleOpts.position;
          const halfFontSize = titleFont.size / 2;
          const topPaddingPlusHalfFontSize = titlePadding.top + halfFontSize;
          let y;
          let left = this.left;
          let maxWidth = this.width;
          if (this.isHorizontal()) {
              maxWidth = Math.max(...this.lineWidths);
              y = this.top + topPaddingPlusHalfFontSize;
              left = _alignStartEnd(opts.align, left, this.right - maxWidth);
          } else {
              const maxHeight = this.columnSizes.reduce((acc, size)=>Math.max(acc, size.height), 0);
              y = topPaddingPlusHalfFontSize + _alignStartEnd(opts.align, this.top, this.bottom - maxHeight - opts.labels.padding - this._computeTitleHeight());
          }
          const x = _alignStartEnd(position, left, left + maxWidth);
          ctx.textAlign = rtlHelper.textAlign(_toLeftRightCenter(position));
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = titleOpts.color;
          ctx.fillStyle = titleOpts.color;
          ctx.font = titleFont.string;
          renderText(ctx, titleOpts.text, x, y, titleFont);
      }
   _computeTitleHeight() {
          const titleOpts = this.options.title;
          const titleFont = toFont(titleOpts.font);
          const titlePadding = toPadding(titleOpts.padding);
          return titleOpts.display ? titleFont.lineHeight + titlePadding.height : 0;
      }
   _getLegendItemAt(x, y) {
          let i, hitBox, lh;
          if (_isBetween(x, this.left, this.right) && _isBetween(y, this.top, this.bottom)) {
              lh = this.legendHitBoxes;
              for(i = 0; i < lh.length; ++i){
                  hitBox = lh[i];
                  if (_isBetween(x, hitBox.left, hitBox.left + hitBox.width) && _isBetween(y, hitBox.top, hitBox.top + hitBox.height)) {
                      return this.legendItems[i];
                  }
              }
          }
          return null;
      }
   handleEvent(e) {
          const opts = this.options;
          if (!isListened(e.type, opts)) {
              return;
          }
          const hoveredItem = this._getLegendItemAt(e.x, e.y);
          if (e.type === 'mousemove' || e.type === 'mouseout') {
              const previous = this._hoveredItem;
              const sameItem = itemsEqual(previous, hoveredItem);
              if (previous && !sameItem) {
                  callback(opts.onLeave, [
                      e,
                      previous,
                      this
                  ], this);
              }
              this._hoveredItem = hoveredItem;
              if (hoveredItem && !sameItem) {
                  callback(opts.onHover, [
                      e,
                      hoveredItem,
                      this
                  ], this);
              }
          } else if (hoveredItem) {
              callback(opts.onClick, [
                  e,
                  hoveredItem,
                  this
              ], this);
          }
      }
  }
  function calculateItemSize(boxWidth, labelFont, ctx, legendItem, _itemHeight) {
      const itemWidth = calculateItemWidth(legendItem, boxWidth, labelFont, ctx);
      const itemHeight = calculateItemHeight(_itemHeight, legendItem, labelFont.lineHeight);
      return {
          itemWidth,
          itemHeight
      };
  }
  function calculateItemWidth(legendItem, boxWidth, labelFont, ctx) {
      let legendItemText = legendItem.text;
      if (legendItemText && typeof legendItemText !== 'string') {
          legendItemText = legendItemText.reduce((a, b)=>a.length > b.length ? a : b);
      }
      return boxWidth + labelFont.size / 2 + ctx.measureText(legendItemText).width;
  }
  function calculateItemHeight(_itemHeight, legendItem, fontLineHeight) {
      let itemHeight = _itemHeight;
      if (typeof legendItem.text !== 'string') {
          itemHeight = calculateLegendItemHeight(legendItem, fontLineHeight);
      }
      return itemHeight;
  }
  function calculateLegendItemHeight(legendItem, fontLineHeight) {
      const labelHeight = legendItem.text ? legendItem.text.length + 0.5 : 0;
      return fontLineHeight * labelHeight;
  }
  function isListened(type, opts) {
      if ((type === 'mousemove' || type === 'mouseout') && (opts.onHover || opts.onLeave)) {
          return true;
      }
      if (opts.onClick && (type === 'click' || type === 'mouseup')) {
          return true;
      }
      return false;
  }
  var plugin_legend = {
      id: 'legend',
   _element: Legend,
      start (chart, _args, options) {
          const legend = chart.legend = new Legend({
              ctx: chart.ctx,
              options,
              chart
          });
          layouts.configure(chart, legend, options);
          layouts.addBox(chart, legend);
      },
      stop (chart) {
          layouts.removeBox(chart, chart.legend);
          delete chart.legend;
      },
      beforeUpdate (chart, _args, options) {
          const legend = chart.legend;
          layouts.configure(chart, legend, options);
          legend.options = options;
      },
      afterUpdate (chart) {
          const legend = chart.legend;
          legend.buildLabels();
          legend.adjustHitBoxes();
      },
      afterEvent (chart, args) {
          if (!args.replay) {
              chart.legend.handleEvent(args.event);
          }
      },
      defaults: {
          display: true,
          position: 'top',
          align: 'center',
          fullSize: true,
          reverse: false,
          weight: 1000,
          onClick (e, legendItem, legend) {
              const index = legendItem.datasetIndex;
              const ci = legend.chart;
              if (ci.isDatasetVisible(index)) {
                  ci.hide(index);
                  legendItem.hidden = true;
              } else {
                  ci.show(index);
                  legendItem.hidden = false;
              }
          },
          onHover: null,
          onLeave: null,
          labels: {
              color: (ctx)=>ctx.chart.options.color,
              boxWidth: 40,
              padding: 10,
              generateLabels (chart) {
                  const datasets = chart.data.datasets;
                  const { labels: { usePointStyle , pointStyle , textAlign , color , useBorderRadius , borderRadius  }  } = chart.legend.options;
                  return chart._getSortedDatasetMetas().map((meta)=>{
                      const style = meta.controller.getStyle(usePointStyle ? 0 : undefined);
                      const borderWidth = toPadding(style.borderWidth);
                      return {
                          text: datasets[meta.index].label,
                          fillStyle: style.backgroundColor,
                          fontColor: color,
                          hidden: !meta.visible,
                          lineCap: style.borderCapStyle,
                          lineDash: style.borderDash,
                          lineDashOffset: style.borderDashOffset,
                          lineJoin: style.borderJoinStyle,
                          lineWidth: (borderWidth.width + borderWidth.height) / 4,
                          strokeStyle: style.borderColor,
                          pointStyle: pointStyle || style.pointStyle,
                          rotation: style.rotation,
                          textAlign: textAlign || style.textAlign,
                          borderRadius: useBorderRadius && (borderRadius || style.borderRadius),
                          datasetIndex: meta.index
                      };
                  }, this);
              }
          },
          title: {
              color: (ctx)=>ctx.chart.options.color,
              display: false,
              position: 'center',
              text: ''
          }
      },
      descriptors: {
          _scriptable: (name)=>!name.startsWith('on'),
          labels: {
              _scriptable: (name)=>![
                      'generateLabels',
                      'filter',
                      'sort'
                  ].includes(name)
          }
      }
  };

  class Title extends Element {
   constructor(config){
          super();
          this.chart = config.chart;
          this.options = config.options;
          this.ctx = config.ctx;
          this._padding = undefined;
          this.top = undefined;
          this.bottom = undefined;
          this.left = undefined;
          this.right = undefined;
          this.width = undefined;
          this.height = undefined;
          this.position = undefined;
          this.weight = undefined;
          this.fullSize = undefined;
      }
      update(maxWidth, maxHeight) {
          const opts = this.options;
          this.left = 0;
          this.top = 0;
          if (!opts.display) {
              this.width = this.height = this.right = this.bottom = 0;
              return;
          }
          this.width = this.right = maxWidth;
          this.height = this.bottom = maxHeight;
          const lineCount = isArray(opts.text) ? opts.text.length : 1;
          this._padding = toPadding(opts.padding);
          const textSize = lineCount * toFont(opts.font).lineHeight + this._padding.height;
          if (this.isHorizontal()) {
              this.height = textSize;
          } else {
              this.width = textSize;
          }
      }
      isHorizontal() {
          const pos = this.options.position;
          return pos === 'top' || pos === 'bottom';
      }
      _drawArgs(offset) {
          const { top , left , bottom , right , options  } = this;
          const align = options.align;
          let rotation = 0;
          let maxWidth, titleX, titleY;
          if (this.isHorizontal()) {
              titleX = _alignStartEnd(align, left, right);
              titleY = top + offset;
              maxWidth = right - left;
          } else {
              if (options.position === 'left') {
                  titleX = left + offset;
                  titleY = _alignStartEnd(align, bottom, top);
                  rotation = PI * -0.5;
              } else {
                  titleX = right - offset;
                  titleY = _alignStartEnd(align, top, bottom);
                  rotation = PI * 0.5;
              }
              maxWidth = bottom - top;
          }
          return {
              titleX,
              titleY,
              maxWidth,
              rotation
          };
      }
      draw() {
          const ctx = this.ctx;
          const opts = this.options;
          if (!opts.display) {
              return;
          }
          const fontOpts = toFont(opts.font);
          const lineHeight = fontOpts.lineHeight;
          const offset = lineHeight / 2 + this._padding.top;
          const { titleX , titleY , maxWidth , rotation  } = this._drawArgs(offset);
          renderText(ctx, opts.text, 0, 0, fontOpts, {
              color: opts.color,
              maxWidth,
              rotation,
              textAlign: _toLeftRightCenter(opts.align),
              textBaseline: 'middle',
              translation: [
                  titleX,
                  titleY
              ]
          });
      }
  }
  function createTitle(chart, titleOpts) {
      const title = new Title({
          ctx: chart.ctx,
          options: titleOpts,
          chart
      });
      layouts.configure(chart, title, titleOpts);
      layouts.addBox(chart, title);
      chart.titleBlock = title;
  }
  var plugin_title = {
      id: 'title',
   _element: Title,
      start (chart, _args, options) {
          createTitle(chart, options);
      },
      stop (chart) {
          const titleBlock = chart.titleBlock;
          layouts.removeBox(chart, titleBlock);
          delete chart.titleBlock;
      },
      beforeUpdate (chart, _args, options) {
          const title = chart.titleBlock;
          layouts.configure(chart, title, options);
          title.options = options;
      },
      defaults: {
          align: 'center',
          display: false,
          font: {
              weight: 'bold'
          },
          fullSize: true,
          padding: 10,
          position: 'top',
          text: '',
          weight: 2000
      },
      defaultRoutes: {
          color: 'color'
      },
      descriptors: {
          _scriptable: true,
          _indexable: false
      }
  };

  const map = new WeakMap();
  var plugin_subtitle = {
      id: 'subtitle',
      start (chart, _args, options) {
          const title = new Title({
              ctx: chart.ctx,
              options,
              chart
          });
          layouts.configure(chart, title, options);
          layouts.addBox(chart, title);
          map.set(chart, title);
      },
      stop (chart) {
          layouts.removeBox(chart, map.get(chart));
          map.delete(chart);
      },
      beforeUpdate (chart, _args, options) {
          const title = map.get(chart);
          layouts.configure(chart, title, options);
          title.options = options;
      },
      defaults: {
          align: 'center',
          display: false,
          font: {
              weight: 'normal'
          },
          fullSize: true,
          padding: 0,
          position: 'top',
          text: '',
          weight: 1500
      },
      defaultRoutes: {
          color: 'color'
      },
      descriptors: {
          _scriptable: true,
          _indexable: false
      }
  };

  const positioners = {
   average (items) {
          if (!items.length) {
              return false;
          }
          let i, len;
          let x = 0;
          let y = 0;
          let count = 0;
          for(i = 0, len = items.length; i < len; ++i){
              const el = items[i].element;
              if (el && el.hasValue()) {
                  const pos = el.tooltipPosition();
                  x += pos.x;
                  y += pos.y;
                  ++count;
              }
          }
          return {
              x: x / count,
              y: y / count
          };
      },
   nearest (items, eventPosition) {
          if (!items.length) {
              return false;
          }
          let x = eventPosition.x;
          let y = eventPosition.y;
          let minDistance = Number.POSITIVE_INFINITY;
          let i, len, nearestElement;
          for(i = 0, len = items.length; i < len; ++i){
              const el = items[i].element;
              if (el && el.hasValue()) {
                  const center = el.getCenterPoint();
                  const d = distanceBetweenPoints(eventPosition, center);
                  if (d < minDistance) {
                      minDistance = d;
                      nearestElement = el;
                  }
              }
          }
          if (nearestElement) {
              const tp = nearestElement.tooltipPosition();
              x = tp.x;
              y = tp.y;
          }
          return {
              x,
              y
          };
      }
  };
  function pushOrConcat(base, toPush) {
      if (toPush) {
          if (isArray(toPush)) {
              Array.prototype.push.apply(base, toPush);
          } else {
              base.push(toPush);
          }
      }
      return base;
  }
   function splitNewlines(str) {
      if ((typeof str === 'string' || str instanceof String) && str.indexOf('\n') > -1) {
          return str.split('\n');
      }
      return str;
  }
   function createTooltipItem(chart, item) {
      const { element , datasetIndex , index  } = item;
      const controller = chart.getDatasetMeta(datasetIndex).controller;
      const { label , value  } = controller.getLabelAndValue(index);
      return {
          chart,
          label,
          parsed: controller.getParsed(index),
          raw: chart.data.datasets[datasetIndex].data[index],
          formattedValue: value,
          dataset: controller.getDataset(),
          dataIndex: index,
          datasetIndex,
          element
      };
  }
   function getTooltipSize(tooltip, options) {
      const ctx = tooltip.chart.ctx;
      const { body , footer , title  } = tooltip;
      const { boxWidth , boxHeight  } = options;
      const bodyFont = toFont(options.bodyFont);
      const titleFont = toFont(options.titleFont);
      const footerFont = toFont(options.footerFont);
      const titleLineCount = title.length;
      const footerLineCount = footer.length;
      const bodyLineItemCount = body.length;
      const padding = toPadding(options.padding);
      let height = padding.height;
      let width = 0;
      let combinedBodyLength = body.reduce((count, bodyItem)=>count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length, 0);
      combinedBodyLength += tooltip.beforeBody.length + tooltip.afterBody.length;
      if (titleLineCount) {
          height += titleLineCount * titleFont.lineHeight + (titleLineCount - 1) * options.titleSpacing + options.titleMarginBottom;
      }
      if (combinedBodyLength) {
          const bodyLineHeight = options.displayColors ? Math.max(boxHeight, bodyFont.lineHeight) : bodyFont.lineHeight;
          height += bodyLineItemCount * bodyLineHeight + (combinedBodyLength - bodyLineItemCount) * bodyFont.lineHeight + (combinedBodyLength - 1) * options.bodySpacing;
      }
      if (footerLineCount) {
          height += options.footerMarginTop + footerLineCount * footerFont.lineHeight + (footerLineCount - 1) * options.footerSpacing;
      }
      let widthPadding = 0;
      const maxLineWidth = function(line) {
          width = Math.max(width, ctx.measureText(line).width + widthPadding);
      };
      ctx.save();
      ctx.font = titleFont.string;
      each(tooltip.title, maxLineWidth);
      ctx.font = bodyFont.string;
      each(tooltip.beforeBody.concat(tooltip.afterBody), maxLineWidth);
      widthPadding = options.displayColors ? boxWidth + 2 + options.boxPadding : 0;
      each(body, (bodyItem)=>{
          each(bodyItem.before, maxLineWidth);
          each(bodyItem.lines, maxLineWidth);
          each(bodyItem.after, maxLineWidth);
      });
      widthPadding = 0;
      ctx.font = footerFont.string;
      each(tooltip.footer, maxLineWidth);
      ctx.restore();
      width += padding.width;
      return {
          width,
          height
      };
  }
  function determineYAlign(chart, size) {
      const { y , height  } = size;
      if (y < height / 2) {
          return 'top';
      } else if (y > chart.height - height / 2) {
          return 'bottom';
      }
      return 'center';
  }
  function doesNotFitWithAlign(xAlign, chart, options, size) {
      const { x , width  } = size;
      const caret = options.caretSize + options.caretPadding;
      if (xAlign === 'left' && x + width + caret > chart.width) {
          return true;
      }
      if (xAlign === 'right' && x - width - caret < 0) {
          return true;
      }
  }
  function determineXAlign(chart, options, size, yAlign) {
      const { x , width  } = size;
      const { width: chartWidth , chartArea: { left , right  }  } = chart;
      let xAlign = 'center';
      if (yAlign === 'center') {
          xAlign = x <= (left + right) / 2 ? 'left' : 'right';
      } else if (x <= width / 2) {
          xAlign = 'left';
      } else if (x >= chartWidth - width / 2) {
          xAlign = 'right';
      }
      if (doesNotFitWithAlign(xAlign, chart, options, size)) {
          xAlign = 'center';
      }
      return xAlign;
  }
   function determineAlignment(chart, options, size) {
      const yAlign = size.yAlign || options.yAlign || determineYAlign(chart, size);
      return {
          xAlign: size.xAlign || options.xAlign || determineXAlign(chart, options, size, yAlign),
          yAlign
      };
  }
  function alignX(size, xAlign) {
      let { x , width  } = size;
      if (xAlign === 'right') {
          x -= width;
      } else if (xAlign === 'center') {
          x -= width / 2;
      }
      return x;
  }
  function alignY(size, yAlign, paddingAndSize) {
      let { y , height  } = size;
      if (yAlign === 'top') {
          y += paddingAndSize;
      } else if (yAlign === 'bottom') {
          y -= height + paddingAndSize;
      } else {
          y -= height / 2;
      }
      return y;
  }
   function getBackgroundPoint(options, size, alignment, chart) {
      const { caretSize , caretPadding , cornerRadius  } = options;
      const { xAlign , yAlign  } = alignment;
      const paddingAndSize = caretSize + caretPadding;
      const { topLeft , topRight , bottomLeft , bottomRight  } = toTRBLCorners(cornerRadius);
      let x = alignX(size, xAlign);
      const y = alignY(size, yAlign, paddingAndSize);
      if (yAlign === 'center') {
          if (xAlign === 'left') {
              x += paddingAndSize;
          } else if (xAlign === 'right') {
              x -= paddingAndSize;
          }
      } else if (xAlign === 'left') {
          x -= Math.max(topLeft, bottomLeft) + caretSize;
      } else if (xAlign === 'right') {
          x += Math.max(topRight, bottomRight) + caretSize;
      }
      return {
          x: _limitValue(x, 0, chart.width - size.width),
          y: _limitValue(y, 0, chart.height - size.height)
      };
  }
  function getAlignedX(tooltip, align, options) {
      const padding = toPadding(options.padding);
      return align === 'center' ? tooltip.x + tooltip.width / 2 : align === 'right' ? tooltip.x + tooltip.width - padding.right : tooltip.x + padding.left;
  }
   function getBeforeAfterBodyLines(callback) {
      return pushOrConcat([], splitNewlines(callback));
  }
  function createTooltipContext(parent, tooltip, tooltipItems) {
      return createContext(parent, {
          tooltip,
          tooltipItems,
          type: 'tooltip'
      });
  }
  function overrideCallbacks(callbacks, context) {
      const override = context && context.dataset && context.dataset.tooltip && context.dataset.tooltip.callbacks;
      return override ? callbacks.override(override) : callbacks;
  }
  const defaultCallbacks = {
      beforeTitle: noop,
      title (tooltipItems) {
          if (tooltipItems.length > 0) {
              const item = tooltipItems[0];
              const labels = item.chart.data.labels;
              const labelCount = labels ? labels.length : 0;
              if (this && this.options && this.options.mode === 'dataset') {
                  return item.dataset.label || '';
              } else if (item.label) {
                  return item.label;
              } else if (labelCount > 0 && item.dataIndex < labelCount) {
                  return labels[item.dataIndex];
              }
          }
          return '';
      },
      afterTitle: noop,
      beforeBody: noop,
      beforeLabel: noop,
      label (tooltipItem) {
          if (this && this.options && this.options.mode === 'dataset') {
              return tooltipItem.label + ': ' + tooltipItem.formattedValue || tooltipItem.formattedValue;
          }
          let label = tooltipItem.dataset.label || '';
          if (label) {
              label += ': ';
          }
          const value = tooltipItem.formattedValue;
          if (!isNullOrUndef(value)) {
              label += value;
          }
          return label;
      },
      labelColor (tooltipItem) {
          const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
          const options = meta.controller.getStyle(tooltipItem.dataIndex);
          return {
              borderColor: options.borderColor,
              backgroundColor: options.backgroundColor,
              borderWidth: options.borderWidth,
              borderDash: options.borderDash,
              borderDashOffset: options.borderDashOffset,
              borderRadius: 0
          };
      },
      labelTextColor () {
          return this.options.bodyColor;
      },
      labelPointStyle (tooltipItem) {
          const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
          const options = meta.controller.getStyle(tooltipItem.dataIndex);
          return {
              pointStyle: options.pointStyle,
              rotation: options.rotation
          };
      },
      afterLabel: noop,
      afterBody: noop,
      beforeFooter: noop,
      footer: noop,
      afterFooter: noop
  };
   function invokeCallbackWithFallback(callbacks, name, ctx, arg) {
      const result = callbacks[name].call(ctx, arg);
      if (typeof result === 'undefined') {
          return defaultCallbacks[name].call(ctx, arg);
      }
      return result;
  }
  class Tooltip extends Element {
   static positioners = positioners;
      constructor(config){
          super();
          this.opacity = 0;
          this._active = [];
          this._eventPosition = undefined;
          this._size = undefined;
          this._cachedAnimations = undefined;
          this._tooltipItems = [];
          this.$animations = undefined;
          this.$context = undefined;
          this.chart = config.chart;
          this.options = config.options;
          this.dataPoints = undefined;
          this.title = undefined;
          this.beforeBody = undefined;
          this.body = undefined;
          this.afterBody = undefined;
          this.footer = undefined;
          this.xAlign = undefined;
          this.yAlign = undefined;
          this.x = undefined;
          this.y = undefined;
          this.height = undefined;
          this.width = undefined;
          this.caretX = undefined;
          this.caretY = undefined;
          this.labelColors = undefined;
          this.labelPointStyles = undefined;
          this.labelTextColors = undefined;
      }
      initialize(options) {
          this.options = options;
          this._cachedAnimations = undefined;
          this.$context = undefined;
      }
   _resolveAnimations() {
          const cached = this._cachedAnimations;
          if (cached) {
              return cached;
          }
          const chart = this.chart;
          const options = this.options.setContext(this.getContext());
          const opts = options.enabled && chart.options.animation && options.animations;
          const animations = new Animations(this.chart, opts);
          if (opts._cacheable) {
              this._cachedAnimations = Object.freeze(animations);
          }
          return animations;
      }
   getContext() {
          return this.$context || (this.$context = createTooltipContext(this.chart.getContext(), this, this._tooltipItems));
      }
      getTitle(context, options) {
          const { callbacks  } = options;
          const beforeTitle = invokeCallbackWithFallback(callbacks, 'beforeTitle', this, context);
          const title = invokeCallbackWithFallback(callbacks, 'title', this, context);
          const afterTitle = invokeCallbackWithFallback(callbacks, 'afterTitle', this, context);
          let lines = [];
          lines = pushOrConcat(lines, splitNewlines(beforeTitle));
          lines = pushOrConcat(lines, splitNewlines(title));
          lines = pushOrConcat(lines, splitNewlines(afterTitle));
          return lines;
      }
      getBeforeBody(tooltipItems, options) {
          return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, 'beforeBody', this, tooltipItems));
      }
      getBody(tooltipItems, options) {
          const { callbacks  } = options;
          const bodyItems = [];
          each(tooltipItems, (context)=>{
              const bodyItem = {
                  before: [],
                  lines: [],
                  after: []
              };
              const scoped = overrideCallbacks(callbacks, context);
              pushOrConcat(bodyItem.before, splitNewlines(invokeCallbackWithFallback(scoped, 'beforeLabel', this, context)));
              pushOrConcat(bodyItem.lines, invokeCallbackWithFallback(scoped, 'label', this, context));
              pushOrConcat(bodyItem.after, splitNewlines(invokeCallbackWithFallback(scoped, 'afterLabel', this, context)));
              bodyItems.push(bodyItem);
          });
          return bodyItems;
      }
      getAfterBody(tooltipItems, options) {
          return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, 'afterBody', this, tooltipItems));
      }
      getFooter(tooltipItems, options) {
          const { callbacks  } = options;
          const beforeFooter = invokeCallbackWithFallback(callbacks, 'beforeFooter', this, tooltipItems);
          const footer = invokeCallbackWithFallback(callbacks, 'footer', this, tooltipItems);
          const afterFooter = invokeCallbackWithFallback(callbacks, 'afterFooter', this, tooltipItems);
          let lines = [];
          lines = pushOrConcat(lines, splitNewlines(beforeFooter));
          lines = pushOrConcat(lines, splitNewlines(footer));
          lines = pushOrConcat(lines, splitNewlines(afterFooter));
          return lines;
      }
   _createItems(options) {
          const active = this._active;
          const data = this.chart.data;
          const labelColors = [];
          const labelPointStyles = [];
          const labelTextColors = [];
          let tooltipItems = [];
          let i, len;
          for(i = 0, len = active.length; i < len; ++i){
              tooltipItems.push(createTooltipItem(this.chart, active[i]));
          }
          if (options.filter) {
              tooltipItems = tooltipItems.filter((element, index, array)=>options.filter(element, index, array, data));
          }
          if (options.itemSort) {
              tooltipItems = tooltipItems.sort((a, b)=>options.itemSort(a, b, data));
          }
          each(tooltipItems, (context)=>{
              const scoped = overrideCallbacks(options.callbacks, context);
              labelColors.push(invokeCallbackWithFallback(scoped, 'labelColor', this, context));
              labelPointStyles.push(invokeCallbackWithFallback(scoped, 'labelPointStyle', this, context));
              labelTextColors.push(invokeCallbackWithFallback(scoped, 'labelTextColor', this, context));
          });
          this.labelColors = labelColors;
          this.labelPointStyles = labelPointStyles;
          this.labelTextColors = labelTextColors;
          this.dataPoints = tooltipItems;
          return tooltipItems;
      }
      update(changed, replay) {
          const options = this.options.setContext(this.getContext());
          const active = this._active;
          let properties;
          let tooltipItems = [];
          if (!active.length) {
              if (this.opacity !== 0) {
                  properties = {
                      opacity: 0
                  };
              }
          } else {
              const position = positioners[options.position].call(this, active, this._eventPosition);
              tooltipItems = this._createItems(options);
              this.title = this.getTitle(tooltipItems, options);
              this.beforeBody = this.getBeforeBody(tooltipItems, options);
              this.body = this.getBody(tooltipItems, options);
              this.afterBody = this.getAfterBody(tooltipItems, options);
              this.footer = this.getFooter(tooltipItems, options);
              const size = this._size = getTooltipSize(this, options);
              const positionAndSize = Object.assign({}, position, size);
              const alignment = determineAlignment(this.chart, options, positionAndSize);
              const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, this.chart);
              this.xAlign = alignment.xAlign;
              this.yAlign = alignment.yAlign;
              properties = {
                  opacity: 1,
                  x: backgroundPoint.x,
                  y: backgroundPoint.y,
                  width: size.width,
                  height: size.height,
                  caretX: position.x,
                  caretY: position.y
              };
          }
          this._tooltipItems = tooltipItems;
          this.$context = undefined;
          if (properties) {
              this._resolveAnimations().update(this, properties);
          }
          if (changed && options.external) {
              options.external.call(this, {
                  chart: this.chart,
                  tooltip: this,
                  replay
              });
          }
      }
      drawCaret(tooltipPoint, ctx, size, options) {
          const caretPosition = this.getCaretPosition(tooltipPoint, size, options);
          ctx.lineTo(caretPosition.x1, caretPosition.y1);
          ctx.lineTo(caretPosition.x2, caretPosition.y2);
          ctx.lineTo(caretPosition.x3, caretPosition.y3);
      }
      getCaretPosition(tooltipPoint, size, options) {
          const { xAlign , yAlign  } = this;
          const { caretSize , cornerRadius  } = options;
          const { topLeft , topRight , bottomLeft , bottomRight  } = toTRBLCorners(cornerRadius);
          const { x: ptX , y: ptY  } = tooltipPoint;
          const { width , height  } = size;
          let x1, x2, x3, y1, y2, y3;
          if (yAlign === 'center') {
              y2 = ptY + height / 2;
              if (xAlign === 'left') {
                  x1 = ptX;
                  x2 = x1 - caretSize;
                  y1 = y2 + caretSize;
                  y3 = y2 - caretSize;
              } else {
                  x1 = ptX + width;
                  x2 = x1 + caretSize;
                  y1 = y2 - caretSize;
                  y3 = y2 + caretSize;
              }
              x3 = x1;
          } else {
              if (xAlign === 'left') {
                  x2 = ptX + Math.max(topLeft, bottomLeft) + caretSize;
              } else if (xAlign === 'right') {
                  x2 = ptX + width - Math.max(topRight, bottomRight) - caretSize;
              } else {
                  x2 = this.caretX;
              }
              if (yAlign === 'top') {
                  y1 = ptY;
                  y2 = y1 - caretSize;
                  x1 = x2 - caretSize;
                  x3 = x2 + caretSize;
              } else {
                  y1 = ptY + height;
                  y2 = y1 + caretSize;
                  x1 = x2 + caretSize;
                  x3 = x2 - caretSize;
              }
              y3 = y1;
          }
          return {
              x1,
              x2,
              x3,
              y1,
              y2,
              y3
          };
      }
      drawTitle(pt, ctx, options) {
          const title = this.title;
          const length = title.length;
          let titleFont, titleSpacing, i;
          if (length) {
              const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
              pt.x = getAlignedX(this, options.titleAlign, options);
              ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
              ctx.textBaseline = 'middle';
              titleFont = toFont(options.titleFont);
              titleSpacing = options.titleSpacing;
              ctx.fillStyle = options.titleColor;
              ctx.font = titleFont.string;
              for(i = 0; i < length; ++i){
                  ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFont.lineHeight / 2);
                  pt.y += titleFont.lineHeight + titleSpacing;
                  if (i + 1 === length) {
                      pt.y += options.titleMarginBottom - titleSpacing;
                  }
              }
          }
      }
   _drawColorBox(ctx, pt, i, rtlHelper, options) {
          const labelColors = this.labelColors[i];
          const labelPointStyle = this.labelPointStyles[i];
          const { boxHeight , boxWidth , boxPadding  } = options;
          const bodyFont = toFont(options.bodyFont);
          const colorX = getAlignedX(this, 'left', options);
          const rtlColorX = rtlHelper.x(colorX);
          const yOffSet = boxHeight < bodyFont.lineHeight ? (bodyFont.lineHeight - boxHeight) / 2 : 0;
          const colorY = pt.y + yOffSet;
          if (options.usePointStyle) {
              const drawOptions = {
                  radius: Math.min(boxWidth, boxHeight) / 2,
                  pointStyle: labelPointStyle.pointStyle,
                  rotation: labelPointStyle.rotation,
                  borderWidth: 1
              };
              const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
              const centerY = colorY + boxHeight / 2;
              ctx.strokeStyle = options.multiKeyBackground;
              ctx.fillStyle = options.multiKeyBackground;
              drawPoint(ctx, drawOptions, centerX, centerY);
              ctx.strokeStyle = labelColors.borderColor;
              ctx.fillStyle = labelColors.backgroundColor;
              drawPoint(ctx, drawOptions, centerX, centerY);
          } else {
              ctx.lineWidth = isObject(labelColors.borderWidth) ? Math.max(...Object.values(labelColors.borderWidth)) : labelColors.borderWidth || 1;
              ctx.strokeStyle = labelColors.borderColor;
              ctx.setLineDash(labelColors.borderDash || []);
              ctx.lineDashOffset = labelColors.borderDashOffset || 0;
              const outerX = rtlHelper.leftForLtr(rtlColorX, boxWidth - boxPadding);
              const innerX = rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - boxPadding - 2);
              const borderRadius = toTRBLCorners(labelColors.borderRadius);
              if (Object.values(borderRadius).some((v)=>v !== 0)) {
                  ctx.beginPath();
                  ctx.fillStyle = options.multiKeyBackground;
                  addRoundedRectPath(ctx, {
                      x: outerX,
                      y: colorY,
                      w: boxWidth,
                      h: boxHeight,
                      radius: borderRadius
                  });
                  ctx.fill();
                  ctx.stroke();
                  ctx.fillStyle = labelColors.backgroundColor;
                  ctx.beginPath();
                  addRoundedRectPath(ctx, {
                      x: innerX,
                      y: colorY + 1,
                      w: boxWidth - 2,
                      h: boxHeight - 2,
                      radius: borderRadius
                  });
                  ctx.fill();
              } else {
                  ctx.fillStyle = options.multiKeyBackground;
                  ctx.fillRect(outerX, colorY, boxWidth, boxHeight);
                  ctx.strokeRect(outerX, colorY, boxWidth, boxHeight);
                  ctx.fillStyle = labelColors.backgroundColor;
                  ctx.fillRect(innerX, colorY + 1, boxWidth - 2, boxHeight - 2);
              }
          }
          ctx.fillStyle = this.labelTextColors[i];
      }
      drawBody(pt, ctx, options) {
          const { body  } = this;
          const { bodySpacing , bodyAlign , displayColors , boxHeight , boxWidth , boxPadding  } = options;
          const bodyFont = toFont(options.bodyFont);
          let bodyLineHeight = bodyFont.lineHeight;
          let xLinePadding = 0;
          const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
          const fillLineOfText = function(line) {
              ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
              pt.y += bodyLineHeight + bodySpacing;
          };
          const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
          let bodyItem, textColor, lines, i, j, ilen, jlen;
          ctx.textAlign = bodyAlign;
          ctx.textBaseline = 'middle';
          ctx.font = bodyFont.string;
          pt.x = getAlignedX(this, bodyAlignForCalculation, options);
          ctx.fillStyle = options.bodyColor;
          each(this.beforeBody, fillLineOfText);
          xLinePadding = displayColors && bodyAlignForCalculation !== 'right' ? bodyAlign === 'center' ? boxWidth / 2 + boxPadding : boxWidth + 2 + boxPadding : 0;
          for(i = 0, ilen = body.length; i < ilen; ++i){
              bodyItem = body[i];
              textColor = this.labelTextColors[i];
              ctx.fillStyle = textColor;
              each(bodyItem.before, fillLineOfText);
              lines = bodyItem.lines;
              if (displayColors && lines.length) {
                  this._drawColorBox(ctx, pt, i, rtlHelper, options);
                  bodyLineHeight = Math.max(bodyFont.lineHeight, boxHeight);
              }
              for(j = 0, jlen = lines.length; j < jlen; ++j){
                  fillLineOfText(lines[j]);
                  bodyLineHeight = bodyFont.lineHeight;
              }
              each(bodyItem.after, fillLineOfText);
          }
          xLinePadding = 0;
          bodyLineHeight = bodyFont.lineHeight;
          each(this.afterBody, fillLineOfText);
          pt.y -= bodySpacing;
      }
      drawFooter(pt, ctx, options) {
          const footer = this.footer;
          const length = footer.length;
          let footerFont, i;
          if (length) {
              const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
              pt.x = getAlignedX(this, options.footerAlign, options);
              pt.y += options.footerMarginTop;
              ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
              ctx.textBaseline = 'middle';
              footerFont = toFont(options.footerFont);
              ctx.fillStyle = options.footerColor;
              ctx.font = footerFont.string;
              for(i = 0; i < length; ++i){
                  ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
                  pt.y += footerFont.lineHeight + options.footerSpacing;
              }
          }
      }
      drawBackground(pt, ctx, tooltipSize, options) {
          const { xAlign , yAlign  } = this;
          const { x , y  } = pt;
          const { width , height  } = tooltipSize;
          const { topLeft , topRight , bottomLeft , bottomRight  } = toTRBLCorners(options.cornerRadius);
          ctx.fillStyle = options.backgroundColor;
          ctx.strokeStyle = options.borderColor;
          ctx.lineWidth = options.borderWidth;
          ctx.beginPath();
          ctx.moveTo(x + topLeft, y);
          if (yAlign === 'top') {
              this.drawCaret(pt, ctx, tooltipSize, options);
          }
          ctx.lineTo(x + width - topRight, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
          if (yAlign === 'center' && xAlign === 'right') {
              this.drawCaret(pt, ctx, tooltipSize, options);
          }
          ctx.lineTo(x + width, y + height - bottomRight);
          ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
          if (yAlign === 'bottom') {
              this.drawCaret(pt, ctx, tooltipSize, options);
          }
          ctx.lineTo(x + bottomLeft, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
          if (yAlign === 'center' && xAlign === 'left') {
              this.drawCaret(pt, ctx, tooltipSize, options);
          }
          ctx.lineTo(x, y + topLeft);
          ctx.quadraticCurveTo(x, y, x + topLeft, y);
          ctx.closePath();
          ctx.fill();
          if (options.borderWidth > 0) {
              ctx.stroke();
          }
      }
   _updateAnimationTarget(options) {
          const chart = this.chart;
          const anims = this.$animations;
          const animX = anims && anims.x;
          const animY = anims && anims.y;
          if (animX || animY) {
              const position = positioners[options.position].call(this, this._active, this._eventPosition);
              if (!position) {
                  return;
              }
              const size = this._size = getTooltipSize(this, options);
              const positionAndSize = Object.assign({}, position, this._size);
              const alignment = determineAlignment(chart, options, positionAndSize);
              const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
              if (animX._to !== point.x || animY._to !== point.y) {
                  this.xAlign = alignment.xAlign;
                  this.yAlign = alignment.yAlign;
                  this.width = size.width;
                  this.height = size.height;
                  this.caretX = position.x;
                  this.caretY = position.y;
                  this._resolveAnimations().update(this, point);
              }
          }
      }
   _willRender() {
          return !!this.opacity;
      }
      draw(ctx) {
          const options = this.options.setContext(this.getContext());
          let opacity = this.opacity;
          if (!opacity) {
              return;
          }
          this._updateAnimationTarget(options);
          const tooltipSize = {
              width: this.width,
              height: this.height
          };
          const pt = {
              x: this.x,
              y: this.y
          };
          opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;
          const padding = toPadding(options.padding);
          const hasTooltipContent = this.title.length || this.beforeBody.length || this.body.length || this.afterBody.length || this.footer.length;
          if (options.enabled && hasTooltipContent) {
              ctx.save();
              ctx.globalAlpha = opacity;
              this.drawBackground(pt, ctx, tooltipSize, options);
              overrideTextDirection(ctx, options.textDirection);
              pt.y += padding.top;
              this.drawTitle(pt, ctx, options);
              this.drawBody(pt, ctx, options);
              this.drawFooter(pt, ctx, options);
              restoreTextDirection(ctx, options.textDirection);
              ctx.restore();
          }
      }
   getActiveElements() {
          return this._active || [];
      }
   setActiveElements(activeElements, eventPosition) {
          const lastActive = this._active;
          const active = activeElements.map(({ datasetIndex , index  })=>{
              const meta = this.chart.getDatasetMeta(datasetIndex);
              if (!meta) {
                  throw new Error('Cannot find a dataset at index ' + datasetIndex);
              }
              return {
                  datasetIndex,
                  element: meta.data[index],
                  index
              };
          });
          const changed = !_elementsEqual(lastActive, active);
          const positionChanged = this._positionChanged(active, eventPosition);
          if (changed || positionChanged) {
              this._active = active;
              this._eventPosition = eventPosition;
              this._ignoreReplayEvents = true;
              this.update(true);
          }
      }
   handleEvent(e, replay, inChartArea = true) {
          if (replay && this._ignoreReplayEvents) {
              return false;
          }
          this._ignoreReplayEvents = false;
          const options = this.options;
          const lastActive = this._active || [];
          const active = this._getActiveElements(e, lastActive, replay, inChartArea);
          const positionChanged = this._positionChanged(active, e);
          const changed = replay || !_elementsEqual(active, lastActive) || positionChanged;
          if (changed) {
              this._active = active;
              if (options.enabled || options.external) {
                  this._eventPosition = {
                      x: e.x,
                      y: e.y
                  };
                  this.update(true, replay);
              }
          }
          return changed;
      }
   _getActiveElements(e, lastActive, replay, inChartArea) {
          const options = this.options;
          if (e.type === 'mouseout') {
              return [];
          }
          if (!inChartArea) {
              return lastActive;
          }
          const active = this.chart.getElementsAtEventForMode(e, options.mode, options, replay);
          if (options.reverse) {
              active.reverse();
          }
          return active;
      }
   _positionChanged(active, e) {
          const { caretX , caretY , options  } = this;
          const position = positioners[options.position].call(this, active, e);
          return position !== false && (caretX !== position.x || caretY !== position.y);
      }
  }
  var plugin_tooltip = {
      id: 'tooltip',
      _element: Tooltip,
      positioners,
      afterInit (chart, _args, options) {
          if (options) {
              chart.tooltip = new Tooltip({
                  chart,
                  options
              });
          }
      },
      beforeUpdate (chart, _args, options) {
          if (chart.tooltip) {
              chart.tooltip.initialize(options);
          }
      },
      reset (chart, _args, options) {
          if (chart.tooltip) {
              chart.tooltip.initialize(options);
          }
      },
      afterDraw (chart) {
          const tooltip = chart.tooltip;
          if (tooltip && tooltip._willRender()) {
              const args = {
                  tooltip
              };
              if (chart.notifyPlugins('beforeTooltipDraw', {
                  ...args,
                  cancelable: true
              }) === false) {
                  return;
              }
              tooltip.draw(chart.ctx);
              chart.notifyPlugins('afterTooltipDraw', args);
          }
      },
      afterEvent (chart, args) {
          if (chart.tooltip) {
              const useFinalPosition = args.replay;
              if (chart.tooltip.handleEvent(args.event, useFinalPosition, args.inChartArea)) {
                  args.changed = true;
              }
          }
      },
      defaults: {
          enabled: true,
          external: null,
          position: 'average',
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          titleFont: {
              weight: 'bold'
          },
          titleSpacing: 2,
          titleMarginBottom: 6,
          titleAlign: 'left',
          bodyColor: '#fff',
          bodySpacing: 2,
          bodyFont: {},
          bodyAlign: 'left',
          footerColor: '#fff',
          footerSpacing: 2,
          footerMarginTop: 6,
          footerFont: {
              weight: 'bold'
          },
          footerAlign: 'left',
          padding: 6,
          caretPadding: 2,
          caretSize: 5,
          cornerRadius: 6,
          boxHeight: (ctx, opts)=>opts.bodyFont.size,
          boxWidth: (ctx, opts)=>opts.bodyFont.size,
          multiKeyBackground: '#fff',
          displayColors: true,
          boxPadding: 0,
          borderColor: 'rgba(0,0,0,0)',
          borderWidth: 0,
          animation: {
              duration: 400,
              easing: 'easeOutQuart'
          },
          animations: {
              numbers: {
                  type: 'number',
                  properties: [
                      'x',
                      'y',
                      'width',
                      'height',
                      'caretX',
                      'caretY'
                  ]
              },
              opacity: {
                  easing: 'linear',
                  duration: 200
              }
          },
          callbacks: defaultCallbacks
      },
      defaultRoutes: {
          bodyFont: 'font',
          footerFont: 'font',
          titleFont: 'font'
      },
      descriptors: {
          _scriptable: (name)=>name !== 'filter' && name !== 'itemSort' && name !== 'external',
          _indexable: false,
          callbacks: {
              _scriptable: false,
              _indexable: false
          },
          animation: {
              _fallback: false
          },
          animations: {
              _fallback: 'animation'
          }
      },
      additionalOptionScopes: [
          'interaction'
      ]
  };

  var plugins = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Colors: plugin_colors,
  Decimation: plugin_decimation,
  Filler: index,
  Legend: plugin_legend,
  SubTitle: plugin_subtitle,
  Title: plugin_title,
  Tooltip: plugin_tooltip
  });

  const addIfString = (labels, raw, index, addedLabels)=>{
      if (typeof raw === 'string') {
          index = labels.push(raw) - 1;
          addedLabels.unshift({
              index,
              label: raw
          });
      } else if (isNaN(raw)) {
          index = null;
      }
      return index;
  };
  function findOrAddLabel(labels, raw, index, addedLabels) {
      const first = labels.indexOf(raw);
      if (first === -1) {
          return addIfString(labels, raw, index, addedLabels);
      }
      const last = labels.lastIndexOf(raw);
      return first !== last ? index : first;
  }
  const validIndex = (index, max)=>index === null ? null : _limitValue(Math.round(index), 0, max);
  function _getLabelForValue(value) {
      const labels = this.getLabels();
      if (value >= 0 && value < labels.length) {
          return labels[value];
      }
      return value;
  }
  class CategoryScale extends Scale {
      static id = 'category';
   static defaults = {
          ticks: {
              callback: _getLabelForValue
          }
      };
      constructor(cfg){
          super(cfg);
           this._startValue = undefined;
          this._valueRange = 0;
          this._addedLabels = [];
      }
      init(scaleOptions) {
          const added = this._addedLabels;
          if (added.length) {
              const labels = this.getLabels();
              for (const { index , label  } of added){
                  if (labels[index] === label) {
                      labels.splice(index, 1);
                  }
              }
              this._addedLabels = [];
          }
          super.init(scaleOptions);
      }
      parse(raw, index) {
          if (isNullOrUndef(raw)) {
              return null;
          }
          const labels = this.getLabels();
          index = isFinite(index) && labels[index] === raw ? index : findOrAddLabel(labels, raw, valueOrDefault(index, raw), this._addedLabels);
          return validIndex(index, labels.length - 1);
      }
      determineDataLimits() {
          const { minDefined , maxDefined  } = this.getUserBounds();
          let { min , max  } = this.getMinMax(true);
          if (this.options.bounds === 'ticks') {
              if (!minDefined) {
                  min = 0;
              }
              if (!maxDefined) {
                  max = this.getLabels().length - 1;
              }
          }
          this.min = min;
          this.max = max;
      }
      buildTicks() {
          const min = this.min;
          const max = this.max;
          const offset = this.options.offset;
          const ticks = [];
          let labels = this.getLabels();
          labels = min === 0 && max === labels.length - 1 ? labels : labels.slice(min, max + 1);
          this._valueRange = Math.max(labels.length - (offset ? 0 : 1), 1);
          this._startValue = this.min - (offset ? 0.5 : 0);
          for(let value = min; value <= max; value++){
              ticks.push({
                  value
              });
          }
          return ticks;
      }
      getLabelForValue(value) {
          return _getLabelForValue.call(this, value);
      }
   configure() {
          super.configure();
          if (!this.isHorizontal()) {
              this._reversePixels = !this._reversePixels;
          }
      }
      getPixelForValue(value) {
          if (typeof value !== 'number') {
              value = this.parse(value);
          }
          return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
      }
      getPixelForTick(index) {
          const ticks = this.ticks;
          if (index < 0 || index > ticks.length - 1) {
              return null;
          }
          return this.getPixelForValue(ticks[index].value);
      }
      getValueForPixel(pixel) {
          return Math.round(this._startValue + this.getDecimalForPixel(pixel) * this._valueRange);
      }
      getBasePixel() {
          return this.bottom;
      }
  }

  function generateTicks$1(generationOptions, dataRange) {
      const ticks = [];
      const MIN_SPACING = 1e-14;
      const { bounds , step , min , max , precision , count , maxTicks , maxDigits , includeBounds  } = generationOptions;
      const unit = step || 1;
      const maxSpaces = maxTicks - 1;
      const { min: rmin , max: rmax  } = dataRange;
      const minDefined = !isNullOrUndef(min);
      const maxDefined = !isNullOrUndef(max);
      const countDefined = !isNullOrUndef(count);
      const minSpacing = (rmax - rmin) / (maxDigits + 1);
      let spacing = niceNum((rmax - rmin) / maxSpaces / unit) * unit;
      let factor, niceMin, niceMax, numSpaces;
      if (spacing < MIN_SPACING && !minDefined && !maxDefined) {
          return [
              {
                  value: rmin
              },
              {
                  value: rmax
              }
          ];
      }
      numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
      if (numSpaces > maxSpaces) {
          spacing = niceNum(numSpaces * spacing / maxSpaces / unit) * unit;
      }
      if (!isNullOrUndef(precision)) {
          factor = Math.pow(10, precision);
          spacing = Math.ceil(spacing * factor) / factor;
      }
      if (bounds === 'ticks') {
          niceMin = Math.floor(rmin / spacing) * spacing;
          niceMax = Math.ceil(rmax / spacing) * spacing;
      } else {
          niceMin = rmin;
          niceMax = rmax;
      }
      if (minDefined && maxDefined && step && almostWhole((max - min) / step, spacing / 1000)) {
          numSpaces = Math.round(Math.min((max - min) / spacing, maxTicks));
          spacing = (max - min) / numSpaces;
          niceMin = min;
          niceMax = max;
      } else if (countDefined) {
          niceMin = minDefined ? min : niceMin;
          niceMax = maxDefined ? max : niceMax;
          numSpaces = count - 1;
          spacing = (niceMax - niceMin) / numSpaces;
      } else {
          numSpaces = (niceMax - niceMin) / spacing;
          if (almostEquals(numSpaces, Math.round(numSpaces), spacing / 1000)) {
              numSpaces = Math.round(numSpaces);
          } else {
              numSpaces = Math.ceil(numSpaces);
          }
      }
      const decimalPlaces = Math.max(_decimalPlaces(spacing), _decimalPlaces(niceMin));
      factor = Math.pow(10, isNullOrUndef(precision) ? decimalPlaces : precision);
      niceMin = Math.round(niceMin * factor) / factor;
      niceMax = Math.round(niceMax * factor) / factor;
      let j = 0;
      if (minDefined) {
          if (includeBounds && niceMin !== min) {
              ticks.push({
                  value: min
              });
              if (niceMin < min) {
                  j++;
              }
              if (almostEquals(Math.round((niceMin + j * spacing) * factor) / factor, min, relativeLabelSize(min, minSpacing, generationOptions))) {
                  j++;
              }
          } else if (niceMin < min) {
              j++;
          }
      }
      for(; j < numSpaces; ++j){
          ticks.push({
              value: Math.round((niceMin + j * spacing) * factor) / factor
          });
      }
      if (maxDefined && includeBounds && niceMax !== max) {
          if (ticks.length && almostEquals(ticks[ticks.length - 1].value, max, relativeLabelSize(max, minSpacing, generationOptions))) {
              ticks[ticks.length - 1].value = max;
          } else {
              ticks.push({
                  value: max
              });
          }
      } else if (!maxDefined || niceMax === max) {
          ticks.push({
              value: niceMax
          });
      }
      return ticks;
  }
  function relativeLabelSize(value, minSpacing, { horizontal , minRotation  }) {
      const rad = toRadians(minRotation);
      const ratio = (horizontal ? Math.sin(rad) : Math.cos(rad)) || 0.001;
      const length = 0.75 * minSpacing * ('' + value).length;
      return Math.min(minSpacing / ratio, length);
  }
  class LinearScaleBase extends Scale {
      constructor(cfg){
          super(cfg);
           this.start = undefined;
           this.end = undefined;
           this._startValue = undefined;
           this._endValue = undefined;
          this._valueRange = 0;
      }
      parse(raw, index) {
          if (isNullOrUndef(raw)) {
              return null;
          }
          if ((typeof raw === 'number' || raw instanceof Number) && !isFinite(+raw)) {
              return null;
          }
          return +raw;
      }
      handleTickRangeOptions() {
          const { beginAtZero  } = this.options;
          const { minDefined , maxDefined  } = this.getUserBounds();
          let { min , max  } = this;
          const setMin = (v)=>min = minDefined ? min : v;
          const setMax = (v)=>max = maxDefined ? max : v;
          if (beginAtZero) {
              const minSign = sign(min);
              const maxSign = sign(max);
              if (minSign < 0 && maxSign < 0) {
                  setMax(0);
              } else if (minSign > 0 && maxSign > 0) {
                  setMin(0);
              }
          }
          if (min === max) {
              let offset = max === 0 ? 1 : Math.abs(max * 0.05);
              setMax(max + offset);
              if (!beginAtZero) {
                  setMin(min - offset);
              }
          }
          this.min = min;
          this.max = max;
      }
      getTickLimit() {
          const tickOpts = this.options.ticks;
          let { maxTicksLimit , stepSize  } = tickOpts;
          let maxTicks;
          if (stepSize) {
              maxTicks = Math.ceil(this.max / stepSize) - Math.floor(this.min / stepSize) + 1;
              if (maxTicks > 1000) {
                  console.warn(`scales.${this.id}.ticks.stepSize: ${stepSize} would result generating up to ${maxTicks} ticks. Limiting to 1000.`);
                  maxTicks = 1000;
              }
          } else {
              maxTicks = this.computeTickLimit();
              maxTicksLimit = maxTicksLimit || 11;
          }
          if (maxTicksLimit) {
              maxTicks = Math.min(maxTicksLimit, maxTicks);
          }
          return maxTicks;
      }
   computeTickLimit() {
          return Number.POSITIVE_INFINITY;
      }
      buildTicks() {
          const opts = this.options;
          const tickOpts = opts.ticks;
          let maxTicks = this.getTickLimit();
          maxTicks = Math.max(2, maxTicks);
          const numericGeneratorOptions = {
              maxTicks,
              bounds: opts.bounds,
              min: opts.min,
              max: opts.max,
              precision: tickOpts.precision,
              step: tickOpts.stepSize,
              count: tickOpts.count,
              maxDigits: this._maxDigits(),
              horizontal: this.isHorizontal(),
              minRotation: tickOpts.minRotation || 0,
              includeBounds: tickOpts.includeBounds !== false
          };
          const dataRange = this._range || this;
          const ticks = generateTicks$1(numericGeneratorOptions, dataRange);
          if (opts.bounds === 'ticks') {
              _setMinAndMaxByKey(ticks, this, 'value');
          }
          if (opts.reverse) {
              ticks.reverse();
              this.start = this.max;
              this.end = this.min;
          } else {
              this.start = this.min;
              this.end = this.max;
          }
          return ticks;
      }
   configure() {
          const ticks = this.ticks;
          let start = this.min;
          let end = this.max;
          super.configure();
          if (this.options.offset && ticks.length) {
              const offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
              start -= offset;
              end += offset;
          }
          this._startValue = start;
          this._endValue = end;
          this._valueRange = end - start;
      }
      getLabelForValue(value) {
          return formatNumber(value, this.chart.options.locale, this.options.ticks.format);
      }
  }

  class LinearScale extends LinearScaleBase {
      static id = 'linear';
   static defaults = {
          ticks: {
              callback: Ticks.formatters.numeric
          }
      };
      determineDataLimits() {
          const { min , max  } = this.getMinMax(true);
          this.min = isNumberFinite(min) ? min : 0;
          this.max = isNumberFinite(max) ? max : 1;
          this.handleTickRangeOptions();
      }
   computeTickLimit() {
          const horizontal = this.isHorizontal();
          const length = horizontal ? this.width : this.height;
          const minRotation = toRadians(this.options.ticks.minRotation);
          const ratio = (horizontal ? Math.sin(minRotation) : Math.cos(minRotation)) || 0.001;
          const tickFont = this._resolveTickFontOptions(0);
          return Math.ceil(length / Math.min(40, tickFont.lineHeight / ratio));
      }
      getPixelForValue(value) {
          return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
      }
      getValueForPixel(pixel) {
          return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
      }
  }

  const log10Floor = (v)=>Math.floor(log10(v));
  const changeExponent = (v, m)=>Math.pow(10, log10Floor(v) + m);
  function isMajor(tickVal) {
      const remain = tickVal / Math.pow(10, log10Floor(tickVal));
      return remain === 1;
  }
  function steps(min, max, rangeExp) {
      const rangeStep = Math.pow(10, rangeExp);
      const start = Math.floor(min / rangeStep);
      const end = Math.ceil(max / rangeStep);
      return end - start;
  }
  function startExp(min, max) {
      const range = max - min;
      let rangeExp = log10Floor(range);
      while(steps(min, max, rangeExp) > 10){
          rangeExp++;
      }
      while(steps(min, max, rangeExp) < 10){
          rangeExp--;
      }
      return Math.min(rangeExp, log10Floor(min));
  }
   function generateTicks(generationOptions, { min , max  }) {
      min = finiteOrDefault(generationOptions.min, min);
      const ticks = [];
      const minExp = log10Floor(min);
      let exp = startExp(min, max);
      let precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
      const stepSize = Math.pow(10, exp);
      const base = minExp > exp ? Math.pow(10, minExp) : 0;
      const start = Math.round((min - base) * precision) / precision;
      const offset = Math.floor((min - base) / stepSize / 10) * stepSize * 10;
      let significand = Math.floor((start - offset) / Math.pow(10, exp));
      let value = finiteOrDefault(generationOptions.min, Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision);
      while(value < max){
          ticks.push({
              value,
              major: isMajor(value),
              significand
          });
          if (significand >= 10) {
              significand = significand < 15 ? 15 : 20;
          } else {
              significand++;
          }
          if (significand >= 20) {
              exp++;
              significand = 2;
              precision = exp >= 0 ? 1 : precision;
          }
          value = Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision;
      }
      const lastTick = finiteOrDefault(generationOptions.max, value);
      ticks.push({
          value: lastTick,
          major: isMajor(lastTick),
          significand
      });
      return ticks;
  }
  class LogarithmicScale extends Scale {
      static id = 'logarithmic';
   static defaults = {
          ticks: {
              callback: Ticks.formatters.logarithmic,
              major: {
                  enabled: true
              }
          }
      };
      constructor(cfg){
          super(cfg);
           this.start = undefined;
           this.end = undefined;
           this._startValue = undefined;
          this._valueRange = 0;
      }
      parse(raw, index) {
          const value = LinearScaleBase.prototype.parse.apply(this, [
              raw,
              index
          ]);
          if (value === 0) {
              this._zero = true;
              return undefined;
          }
          return isNumberFinite(value) && value > 0 ? value : null;
      }
      determineDataLimits() {
          const { min , max  } = this.getMinMax(true);
          this.min = isNumberFinite(min) ? Math.max(0, min) : null;
          this.max = isNumberFinite(max) ? Math.max(0, max) : null;
          if (this.options.beginAtZero) {
              this._zero = true;
          }
          if (this._zero && this.min !== this._suggestedMin && !isNumberFinite(this._userMin)) {
              this.min = min === changeExponent(this.min, 0) ? changeExponent(this.min, -1) : changeExponent(this.min, 0);
          }
          this.handleTickRangeOptions();
      }
      handleTickRangeOptions() {
          const { minDefined , maxDefined  } = this.getUserBounds();
          let min = this.min;
          let max = this.max;
          const setMin = (v)=>min = minDefined ? min : v;
          const setMax = (v)=>max = maxDefined ? max : v;
          if (min === max) {
              if (min <= 0) {
                  setMin(1);
                  setMax(10);
              } else {
                  setMin(changeExponent(min, -1));
                  setMax(changeExponent(max, +1));
              }
          }
          if (min <= 0) {
              setMin(changeExponent(max, -1));
          }
          if (max <= 0) {
              setMax(changeExponent(min, +1));
          }
          this.min = min;
          this.max = max;
      }
      buildTicks() {
          const opts = this.options;
          const generationOptions = {
              min: this._userMin,
              max: this._userMax
          };
          const ticks = generateTicks(generationOptions, this);
          if (opts.bounds === 'ticks') {
              _setMinAndMaxByKey(ticks, this, 'value');
          }
          if (opts.reverse) {
              ticks.reverse();
              this.start = this.max;
              this.end = this.min;
          } else {
              this.start = this.min;
              this.end = this.max;
          }
          return ticks;
      }
   getLabelForValue(value) {
          return value === undefined ? '0' : formatNumber(value, this.chart.options.locale, this.options.ticks.format);
      }
   configure() {
          const start = this.min;
          super.configure();
          this._startValue = log10(start);
          this._valueRange = log10(this.max) - log10(start);
      }
      getPixelForValue(value) {
          if (value === undefined || value === 0) {
              value = this.min;
          }
          if (value === null || isNaN(value)) {
              return NaN;
          }
          return this.getPixelForDecimal(value === this.min ? 0 : (log10(value) - this._startValue) / this._valueRange);
      }
      getValueForPixel(pixel) {
          const decimal = this.getDecimalForPixel(pixel);
          return Math.pow(10, this._startValue + decimal * this._valueRange);
      }
  }

  function getTickBackdropHeight(opts) {
      const tickOpts = opts.ticks;
      if (tickOpts.display && opts.display) {
          const padding = toPadding(tickOpts.backdropPadding);
          return valueOrDefault(tickOpts.font && tickOpts.font.size, defaults.font.size) + padding.height;
      }
      return 0;
  }
  function measureLabelSize(ctx, font, label) {
      label = isArray(label) ? label : [
          label
      ];
      return {
          w: _longestText(ctx, font.string, label),
          h: label.length * font.lineHeight
      };
  }
  function determineLimits(angle, pos, size, min, max) {
      if (angle === min || angle === max) {
          return {
              start: pos - size / 2,
              end: pos + size / 2
          };
      } else if (angle < min || angle > max) {
          return {
              start: pos - size,
              end: pos
          };
      }
      return {
          start: pos,
          end: pos + size
      };
  }
   function fitWithPointLabels(scale) {
      const orig = {
          l: scale.left + scale._padding.left,
          r: scale.right - scale._padding.right,
          t: scale.top + scale._padding.top,
          b: scale.bottom - scale._padding.bottom
      };
      const limits = Object.assign({}, orig);
      const labelSizes = [];
      const padding = [];
      const valueCount = scale._pointLabels.length;
      const pointLabelOpts = scale.options.pointLabels;
      const additionalAngle = pointLabelOpts.centerPointLabels ? PI / valueCount : 0;
      for(let i = 0; i < valueCount; i++){
          const opts = pointLabelOpts.setContext(scale.getPointLabelContext(i));
          padding[i] = opts.padding;
          const pointPosition = scale.getPointPosition(i, scale.drawingArea + padding[i], additionalAngle);
          const plFont = toFont(opts.font);
          const textSize = measureLabelSize(scale.ctx, plFont, scale._pointLabels[i]);
          labelSizes[i] = textSize;
          const angleRadians = _normalizeAngle(scale.getIndexAngle(i) + additionalAngle);
          const angle = Math.round(toDegrees(angleRadians));
          const hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
          const vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
          updateLimits(limits, orig, angleRadians, hLimits, vLimits);
      }
      scale.setCenterPoint(orig.l - limits.l, limits.r - orig.r, orig.t - limits.t, limits.b - orig.b);
      scale._pointLabelItems = buildPointLabelItems(scale, labelSizes, padding);
  }
  function updateLimits(limits, orig, angle, hLimits, vLimits) {
      const sin = Math.abs(Math.sin(angle));
      const cos = Math.abs(Math.cos(angle));
      let x = 0;
      let y = 0;
      if (hLimits.start < orig.l) {
          x = (orig.l - hLimits.start) / sin;
          limits.l = Math.min(limits.l, orig.l - x);
      } else if (hLimits.end > orig.r) {
          x = (hLimits.end - orig.r) / sin;
          limits.r = Math.max(limits.r, orig.r + x);
      }
      if (vLimits.start < orig.t) {
          y = (orig.t - vLimits.start) / cos;
          limits.t = Math.min(limits.t, orig.t - y);
      } else if (vLimits.end > orig.b) {
          y = (vLimits.end - orig.b) / cos;
          limits.b = Math.max(limits.b, orig.b + y);
      }
  }
  function buildPointLabelItems(scale, labelSizes, padding) {
      const items = [];
      const valueCount = scale._pointLabels.length;
      const opts = scale.options;
      const extra = getTickBackdropHeight(opts) / 2;
      const outerDistance = scale.drawingArea;
      const additionalAngle = opts.pointLabels.centerPointLabels ? PI / valueCount : 0;
      for(let i = 0; i < valueCount; i++){
          const pointLabelPosition = scale.getPointPosition(i, outerDistance + extra + padding[i], additionalAngle);
          const angle = Math.round(toDegrees(_normalizeAngle(pointLabelPosition.angle + HALF_PI)));
          const size = labelSizes[i];
          const y = yForAngle(pointLabelPosition.y, size.h, angle);
          const textAlign = getTextAlignForAngle(angle);
          const left = leftForTextAlign(pointLabelPosition.x, size.w, textAlign);
          items.push({
              x: pointLabelPosition.x,
              y,
              textAlign,
              left,
              top: y,
              right: left + size.w,
              bottom: y + size.h
          });
      }
      return items;
  }
  function getTextAlignForAngle(angle) {
      if (angle === 0 || angle === 180) {
          return 'center';
      } else if (angle < 180) {
          return 'left';
      }
      return 'right';
  }
  function leftForTextAlign(x, w, align) {
      if (align === 'right') {
          x -= w;
      } else if (align === 'center') {
          x -= w / 2;
      }
      return x;
  }
  function yForAngle(y, h, angle) {
      if (angle === 90 || angle === 270) {
          y -= h / 2;
      } else if (angle > 270 || angle < 90) {
          y -= h;
      }
      return y;
  }
  function drawPointLabels(scale, labelCount) {
      const { ctx , options: { pointLabels  }  } = scale;
      for(let i = labelCount - 1; i >= 0; i--){
          const optsAtIndex = pointLabels.setContext(scale.getPointLabelContext(i));
          const plFont = toFont(optsAtIndex.font);
          const { x , y , textAlign , left , top , right , bottom  } = scale._pointLabelItems[i];
          const { backdropColor  } = optsAtIndex;
          if (!isNullOrUndef(backdropColor)) {
              const borderRadius = toTRBLCorners(optsAtIndex.borderRadius);
              const padding = toPadding(optsAtIndex.backdropPadding);
              ctx.fillStyle = backdropColor;
              const backdropLeft = left - padding.left;
              const backdropTop = top - padding.top;
              const backdropWidth = right - left + padding.width;
              const backdropHeight = bottom - top + padding.height;
              if (Object.values(borderRadius).some((v)=>v !== 0)) {
                  ctx.beginPath();
                  addRoundedRectPath(ctx, {
                      x: backdropLeft,
                      y: backdropTop,
                      w: backdropWidth,
                      h: backdropHeight,
                      radius: borderRadius
                  });
                  ctx.fill();
              } else {
                  ctx.fillRect(backdropLeft, backdropTop, backdropWidth, backdropHeight);
              }
          }
          renderText(ctx, scale._pointLabels[i], x, y + plFont.lineHeight / 2, plFont, {
              color: optsAtIndex.color,
              textAlign: textAlign,
              textBaseline: 'middle'
          });
      }
  }
  function pathRadiusLine(scale, radius, circular, labelCount) {
      const { ctx  } = scale;
      if (circular) {
          ctx.arc(scale.xCenter, scale.yCenter, radius, 0, TAU);
      } else {
          let pointPosition = scale.getPointPosition(0, radius);
          ctx.moveTo(pointPosition.x, pointPosition.y);
          for(let i = 1; i < labelCount; i++){
              pointPosition = scale.getPointPosition(i, radius);
              ctx.lineTo(pointPosition.x, pointPosition.y);
          }
      }
  }
  function drawRadiusLine(scale, gridLineOpts, radius, labelCount, borderOpts) {
      const ctx = scale.ctx;
      const circular = gridLineOpts.circular;
      const { color , lineWidth  } = gridLineOpts;
      if (!circular && !labelCount || !color || !lineWidth || radius < 0) {
          return;
      }
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(borderOpts.dash);
      ctx.lineDashOffset = borderOpts.dashOffset;
      ctx.beginPath();
      pathRadiusLine(scale, radius, circular, labelCount);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
  }
  function createPointLabelContext(parent, index, label) {
      return createContext(parent, {
          label,
          index,
          type: 'pointLabel'
      });
  }
  class RadialLinearScale extends LinearScaleBase {
      static id = 'radialLinear';
   static defaults = {
          display: true,
          animate: true,
          position: 'chartArea',
          angleLines: {
              display: true,
              lineWidth: 1,
              borderDash: [],
              borderDashOffset: 0.0
          },
          grid: {
              circular: false
          },
          startAngle: 0,
          ticks: {
              showLabelBackdrop: true,
              callback: Ticks.formatters.numeric
          },
          pointLabels: {
              backdropColor: undefined,
              backdropPadding: 2,
              display: true,
              font: {
                  size: 10
              },
              callback (label) {
                  return label;
              },
              padding: 5,
              centerPointLabels: false
          }
      };
      static defaultRoutes = {
          'angleLines.color': 'borderColor',
          'pointLabels.color': 'color',
          'ticks.color': 'color'
      };
      static descriptors = {
          angleLines: {
              _fallback: 'grid'
          }
      };
      constructor(cfg){
          super(cfg);
           this.xCenter = undefined;
           this.yCenter = undefined;
           this.drawingArea = undefined;
           this._pointLabels = [];
          this._pointLabelItems = [];
      }
      setDimensions() {
          const padding = this._padding = toPadding(getTickBackdropHeight(this.options) / 2);
          const w = this.width = this.maxWidth - padding.width;
          const h = this.height = this.maxHeight - padding.height;
          this.xCenter = Math.floor(this.left + w / 2 + padding.left);
          this.yCenter = Math.floor(this.top + h / 2 + padding.top);
          this.drawingArea = Math.floor(Math.min(w, h) / 2);
      }
      determineDataLimits() {
          const { min , max  } = this.getMinMax(false);
          this.min = isNumberFinite(min) && !isNaN(min) ? min : 0;
          this.max = isNumberFinite(max) && !isNaN(max) ? max : 0;
          this.handleTickRangeOptions();
      }
   computeTickLimit() {
          return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
      }
      generateTickLabels(ticks) {
          LinearScaleBase.prototype.generateTickLabels.call(this, ticks);
          this._pointLabels = this.getLabels().map((value, index)=>{
              const label = callback(this.options.pointLabels.callback, [
                  value,
                  index
              ], this);
              return label || label === 0 ? label : '';
          }).filter((v, i)=>this.chart.getDataVisibility(i));
      }
      fit() {
          const opts = this.options;
          if (opts.display && opts.pointLabels.display) {
              fitWithPointLabels(this);
          } else {
              this.setCenterPoint(0, 0, 0, 0);
          }
      }
      setCenterPoint(leftMovement, rightMovement, topMovement, bottomMovement) {
          this.xCenter += Math.floor((leftMovement - rightMovement) / 2);
          this.yCenter += Math.floor((topMovement - bottomMovement) / 2);
          this.drawingArea -= Math.min(this.drawingArea / 2, Math.max(leftMovement, rightMovement, topMovement, bottomMovement));
      }
      getIndexAngle(index) {
          const angleMultiplier = TAU / (this._pointLabels.length || 1);
          const startAngle = this.options.startAngle || 0;
          return _normalizeAngle(index * angleMultiplier + toRadians(startAngle));
      }
      getDistanceFromCenterForValue(value) {
          if (isNullOrUndef(value)) {
              return NaN;
          }
          const scalingFactor = this.drawingArea / (this.max - this.min);
          if (this.options.reverse) {
              return (this.max - value) * scalingFactor;
          }
          return (value - this.min) * scalingFactor;
      }
      getValueForDistanceFromCenter(distance) {
          if (isNullOrUndef(distance)) {
              return NaN;
          }
          const scaledDistance = distance / (this.drawingArea / (this.max - this.min));
          return this.options.reverse ? this.max - scaledDistance : this.min + scaledDistance;
      }
      getPointLabelContext(index) {
          const pointLabels = this._pointLabels || [];
          if (index >= 0 && index < pointLabels.length) {
              const pointLabel = pointLabels[index];
              return createPointLabelContext(this.getContext(), index, pointLabel);
          }
      }
      getPointPosition(index, distanceFromCenter, additionalAngle = 0) {
          const angle = this.getIndexAngle(index) - HALF_PI + additionalAngle;
          return {
              x: Math.cos(angle) * distanceFromCenter + this.xCenter,
              y: Math.sin(angle) * distanceFromCenter + this.yCenter,
              angle
          };
      }
      getPointPositionForValue(index, value) {
          return this.getPointPosition(index, this.getDistanceFromCenterForValue(value));
      }
      getBasePosition(index) {
          return this.getPointPositionForValue(index || 0, this.getBaseValue());
      }
      getPointLabelPosition(index) {
          const { left , top , right , bottom  } = this._pointLabelItems[index];
          return {
              left,
              top,
              right,
              bottom
          };
      }
   drawBackground() {
          const { backgroundColor , grid: { circular  }  } = this.options;
          if (backgroundColor) {
              const ctx = this.ctx;
              ctx.save();
              ctx.beginPath();
              pathRadiusLine(this, this.getDistanceFromCenterForValue(this._endValue), circular, this._pointLabels.length);
              ctx.closePath();
              ctx.fillStyle = backgroundColor;
              ctx.fill();
              ctx.restore();
          }
      }
   drawGrid() {
          const ctx = this.ctx;
          const opts = this.options;
          const { angleLines , grid , border  } = opts;
          const labelCount = this._pointLabels.length;
          let i, offset, position;
          if (opts.pointLabels.display) {
              drawPointLabels(this, labelCount);
          }
          if (grid.display) {
              this.ticks.forEach((tick, index)=>{
                  if (index !== 0) {
                      offset = this.getDistanceFromCenterForValue(tick.value);
                      const context = this.getContext(index);
                      const optsAtIndex = grid.setContext(context);
                      const optsAtIndexBorder = border.setContext(context);
                      drawRadiusLine(this, optsAtIndex, offset, labelCount, optsAtIndexBorder);
                  }
              });
          }
          if (angleLines.display) {
              ctx.save();
              for(i = labelCount - 1; i >= 0; i--){
                  const optsAtIndex = angleLines.setContext(this.getPointLabelContext(i));
                  const { color , lineWidth  } = optsAtIndex;
                  if (!lineWidth || !color) {
                      continue;
                  }
                  ctx.lineWidth = lineWidth;
                  ctx.strokeStyle = color;
                  ctx.setLineDash(optsAtIndex.borderDash);
                  ctx.lineDashOffset = optsAtIndex.borderDashOffset;
                  offset = this.getDistanceFromCenterForValue(opts.ticks.reverse ? this.min : this.max);
                  position = this.getPointPosition(i, offset);
                  ctx.beginPath();
                  ctx.moveTo(this.xCenter, this.yCenter);
                  ctx.lineTo(position.x, position.y);
                  ctx.stroke();
              }
              ctx.restore();
          }
      }
   drawBorder() {}
   drawLabels() {
          const ctx = this.ctx;
          const opts = this.options;
          const tickOpts = opts.ticks;
          if (!tickOpts.display) {
              return;
          }
          const startAngle = this.getIndexAngle(0);
          let offset, width;
          ctx.save();
          ctx.translate(this.xCenter, this.yCenter);
          ctx.rotate(startAngle);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          this.ticks.forEach((tick, index)=>{
              if (index === 0 && !opts.reverse) {
                  return;
              }
              const optsAtIndex = tickOpts.setContext(this.getContext(index));
              const tickFont = toFont(optsAtIndex.font);
              offset = this.getDistanceFromCenterForValue(this.ticks[index].value);
              if (optsAtIndex.showLabelBackdrop) {
                  ctx.font = tickFont.string;
                  width = ctx.measureText(tick.label).width;
                  ctx.fillStyle = optsAtIndex.backdropColor;
                  const padding = toPadding(optsAtIndex.backdropPadding);
                  ctx.fillRect(-width / 2 - padding.left, -offset - tickFont.size / 2 - padding.top, width + padding.width, tickFont.size + padding.height);
              }
              renderText(ctx, tick.label, 0, -offset, tickFont, {
                  color: optsAtIndex.color
              });
          });
          ctx.restore();
      }
   drawTitle() {}
  }

  const INTERVALS = {
      millisecond: {
          common: true,
          size: 1,
          steps: 1000
      },
      second: {
          common: true,
          size: 1000,
          steps: 60
      },
      minute: {
          common: true,
          size: 60000,
          steps: 60
      },
      hour: {
          common: true,
          size: 3600000,
          steps: 24
      },
      day: {
          common: true,
          size: 86400000,
          steps: 30
      },
      week: {
          common: false,
          size: 604800000,
          steps: 4
      },
      month: {
          common: true,
          size: 2.628e9,
          steps: 12
      },
      quarter: {
          common: false,
          size: 7.884e9,
          steps: 4
      },
      year: {
          common: true,
          size: 3.154e10
      }
  };
   const UNITS =  /* #__PURE__ */ Object.keys(INTERVALS);
   function sorter(a, b) {
      return a - b;
  }
   function parse(scale, input) {
      if (isNullOrUndef(input)) {
          return null;
      }
      const adapter = scale._adapter;
      const { parser , round , isoWeekday  } = scale._parseOpts;
      let value = input;
      if (typeof parser === 'function') {
          value = parser(value);
      }
      if (!isNumberFinite(value)) {
          value = typeof parser === 'string' ? adapter.parse(value,  parser) : adapter.parse(value);
      }
      if (value === null) {
          return null;
      }
      if (round) {
          value = round === 'week' && (isNumber(isoWeekday) || isoWeekday === true) ? adapter.startOf(value, 'isoWeek', isoWeekday) : adapter.startOf(value, round);
      }
      return +value;
  }
   function determineUnitForAutoTicks(minUnit, min, max, capacity) {
      const ilen = UNITS.length;
      for(let i = UNITS.indexOf(minUnit); i < ilen - 1; ++i){
          const interval = INTERVALS[UNITS[i]];
          const factor = interval.steps ? interval.steps : Number.MAX_SAFE_INTEGER;
          if (interval.common && Math.ceil((max - min) / (factor * interval.size)) <= capacity) {
              return UNITS[i];
          }
      }
      return UNITS[ilen - 1];
  }
   function determineUnitForFormatting(scale, numTicks, minUnit, min, max) {
      for(let i = UNITS.length - 1; i >= UNITS.indexOf(minUnit); i--){
          const unit = UNITS[i];
          if (INTERVALS[unit].common && scale._adapter.diff(max, min, unit) >= numTicks - 1) {
              return unit;
          }
      }
      return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
  }
   function determineMajorUnit(unit) {
      for(let i = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i < ilen; ++i){
          if (INTERVALS[UNITS[i]].common) {
              return UNITS[i];
          }
      }
  }
   function addTick(ticks, time, timestamps) {
      if (!timestamps) {
          ticks[time] = true;
      } else if (timestamps.length) {
          const { lo , hi  } = _lookup(timestamps, time);
          const timestamp = timestamps[lo] >= time ? timestamps[lo] : timestamps[hi];
          ticks[timestamp] = true;
      }
  }
   function setMajorTicks(scale, ticks, map, majorUnit) {
      const adapter = scale._adapter;
      const first = +adapter.startOf(ticks[0].value, majorUnit);
      const last = ticks[ticks.length - 1].value;
      let major, index;
      for(major = first; major <= last; major = +adapter.add(major, 1, majorUnit)){
          index = map[major];
          if (index >= 0) {
              ticks[index].major = true;
          }
      }
      return ticks;
  }
   function ticksFromTimestamps(scale, values, majorUnit) {
      const ticks = [];
       const map = {};
      const ilen = values.length;
      let i, value;
      for(i = 0; i < ilen; ++i){
          value = values[i];
          map[value] = i;
          ticks.push({
              value,
              major: false
          });
      }
      return ilen === 0 || !majorUnit ? ticks : setMajorTicks(scale, ticks, map, majorUnit);
  }
  class TimeScale extends Scale {
      static id = 'time';
   static defaults = {
   bounds: 'data',
          adapters: {},
          time: {
              parser: false,
              unit: false,
              round: false,
              isoWeekday: false,
              minUnit: 'millisecond',
              displayFormats: {}
          },
          ticks: {
   source: 'auto',
              callback: false,
              major: {
                  enabled: false
              }
          }
      };
   constructor(props){
          super(props);
           this._cache = {
              data: [],
              labels: [],
              all: []
          };
           this._unit = 'day';
           this._majorUnit = undefined;
          this._offsets = {};
          this._normalized = false;
          this._parseOpts = undefined;
      }
      init(scaleOpts, opts = {}) {
          const time = scaleOpts.time || (scaleOpts.time = {});
           const adapter = this._adapter = new adapters._date(scaleOpts.adapters.date);
          adapter.init(opts);
          mergeIf(time.displayFormats, adapter.formats());
          this._parseOpts = {
              parser: time.parser,
              round: time.round,
              isoWeekday: time.isoWeekday
          };
          super.init(scaleOpts);
          this._normalized = opts.normalized;
      }
   parse(raw, index) {
          if (raw === undefined) {
              return null;
          }
          return parse(this, raw);
      }
      beforeLayout() {
          super.beforeLayout();
          this._cache = {
              data: [],
              labels: [],
              all: []
          };
      }
      determineDataLimits() {
          const options = this.options;
          const adapter = this._adapter;
          const unit = options.time.unit || 'day';
          let { min , max , minDefined , maxDefined  } = this.getUserBounds();
   function _applyBounds(bounds) {
              if (!minDefined && !isNaN(bounds.min)) {
                  min = Math.min(min, bounds.min);
              }
              if (!maxDefined && !isNaN(bounds.max)) {
                  max = Math.max(max, bounds.max);
              }
          }
          if (!minDefined || !maxDefined) {
              _applyBounds(this._getLabelBounds());
              if (options.bounds !== 'ticks' || options.ticks.source !== 'labels') {
                  _applyBounds(this.getMinMax(false));
              }
          }
          min = isNumberFinite(min) && !isNaN(min) ? min : +adapter.startOf(Date.now(), unit);
          max = isNumberFinite(max) && !isNaN(max) ? max : +adapter.endOf(Date.now(), unit) + 1;
          this.min = Math.min(min, max - 1);
          this.max = Math.max(min + 1, max);
      }
   _getLabelBounds() {
          const arr = this.getLabelTimestamps();
          let min = Number.POSITIVE_INFINITY;
          let max = Number.NEGATIVE_INFINITY;
          if (arr.length) {
              min = arr[0];
              max = arr[arr.length - 1];
          }
          return {
              min,
              max
          };
      }
   buildTicks() {
          const options = this.options;
          const timeOpts = options.time;
          const tickOpts = options.ticks;
          const timestamps = tickOpts.source === 'labels' ? this.getLabelTimestamps() : this._generate();
          if (options.bounds === 'ticks' && timestamps.length) {
              this.min = this._userMin || timestamps[0];
              this.max = this._userMax || timestamps[timestamps.length - 1];
          }
          const min = this.min;
          const max = this.max;
          const ticks = _filterBetween(timestamps, min, max);
          this._unit = timeOpts.unit || (tickOpts.autoSkip ? determineUnitForAutoTicks(timeOpts.minUnit, this.min, this.max, this._getLabelCapacity(min)) : determineUnitForFormatting(this, ticks.length, timeOpts.minUnit, this.min, this.max));
          this._majorUnit = !tickOpts.major.enabled || this._unit === 'year' ? undefined : determineMajorUnit(this._unit);
          this.initOffsets(timestamps);
          if (options.reverse) {
              ticks.reverse();
          }
          return ticksFromTimestamps(this, ticks, this._majorUnit);
      }
      afterAutoSkip() {
          if (this.options.offsetAfterAutoskip) {
              this.initOffsets(this.ticks.map((tick)=>+tick.value));
          }
      }
   initOffsets(timestamps = []) {
          let start = 0;
          let end = 0;
          let first, last;
          if (this.options.offset && timestamps.length) {
              first = this.getDecimalForValue(timestamps[0]);
              if (timestamps.length === 1) {
                  start = 1 - first;
              } else {
                  start = (this.getDecimalForValue(timestamps[1]) - first) / 2;
              }
              last = this.getDecimalForValue(timestamps[timestamps.length - 1]);
              if (timestamps.length === 1) {
                  end = last;
              } else {
                  end = (last - this.getDecimalForValue(timestamps[timestamps.length - 2])) / 2;
              }
          }
          const limit = timestamps.length < 3 ? 0.5 : 0.25;
          start = _limitValue(start, 0, limit);
          end = _limitValue(end, 0, limit);
          this._offsets = {
              start,
              end,
              factor: 1 / (start + 1 + end)
          };
      }
   _generate() {
          const adapter = this._adapter;
          const min = this.min;
          const max = this.max;
          const options = this.options;
          const timeOpts = options.time;
          const minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min, max, this._getLabelCapacity(min));
          const stepSize = valueOrDefault(options.ticks.stepSize, 1);
          const weekday = minor === 'week' ? timeOpts.isoWeekday : false;
          const hasWeekday = isNumber(weekday) || weekday === true;
          const ticks = {};
          let first = min;
          let time, count;
          if (hasWeekday) {
              first = +adapter.startOf(first, 'isoWeek', weekday);
          }
          first = +adapter.startOf(first, hasWeekday ? 'day' : minor);
          if (adapter.diff(max, min, minor) > 100000 * stepSize) {
              throw new Error(min + ' and ' + max + ' are too far apart with stepSize of ' + stepSize + ' ' + minor);
          }
          const timestamps = options.ticks.source === 'data' && this.getDataTimestamps();
          for(time = first, count = 0; time < max; time = +adapter.add(time, stepSize, minor), count++){
              addTick(ticks, time, timestamps);
          }
          if (time === max || options.bounds === 'ticks' || count === 1) {
              addTick(ticks, time, timestamps);
          }
          return Object.keys(ticks).sort((a, b)=>a - b).map((x)=>+x);
      }
   getLabelForValue(value) {
          const adapter = this._adapter;
          const timeOpts = this.options.time;
          if (timeOpts.tooltipFormat) {
              return adapter.format(value, timeOpts.tooltipFormat);
          }
          return adapter.format(value, timeOpts.displayFormats.datetime);
      }
   format(value, format) {
          const options = this.options;
          const formats = options.time.displayFormats;
          const unit = this._unit;
          const fmt = format || formats[unit];
          return this._adapter.format(value, fmt);
      }
   _tickFormatFunction(time, index, ticks, format) {
          const options = this.options;
          const formatter = options.ticks.callback;
          if (formatter) {
              return callback(formatter, [
                  time,
                  index,
                  ticks
              ], this);
          }
          const formats = options.time.displayFormats;
          const unit = this._unit;
          const majorUnit = this._majorUnit;
          const minorFormat = unit && formats[unit];
          const majorFormat = majorUnit && formats[majorUnit];
          const tick = ticks[index];
          const major = majorUnit && majorFormat && tick && tick.major;
          return this._adapter.format(time, format || (major ? majorFormat : minorFormat));
      }
   generateTickLabels(ticks) {
          let i, ilen, tick;
          for(i = 0, ilen = ticks.length; i < ilen; ++i){
              tick = ticks[i];
              tick.label = this._tickFormatFunction(tick.value, i, ticks);
          }
      }
   getDecimalForValue(value) {
          return value === null ? NaN : (value - this.min) / (this.max - this.min);
      }
   getPixelForValue(value) {
          const offsets = this._offsets;
          const pos = this.getDecimalForValue(value);
          return this.getPixelForDecimal((offsets.start + pos) * offsets.factor);
      }
   getValueForPixel(pixel) {
          const offsets = this._offsets;
          const pos = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
          return this.min + pos * (this.max - this.min);
      }
   _getLabelSize(label) {
          const ticksOpts = this.options.ticks;
          const tickLabelWidth = this.ctx.measureText(label).width;
          const angle = toRadians(this.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
          const cosRotation = Math.cos(angle);
          const sinRotation = Math.sin(angle);
          const tickFontSize = this._resolveTickFontOptions(0).size;
          return {
              w: tickLabelWidth * cosRotation + tickFontSize * sinRotation,
              h: tickLabelWidth * sinRotation + tickFontSize * cosRotation
          };
      }
   _getLabelCapacity(exampleTime) {
          const timeOpts = this.options.time;
          const displayFormats = timeOpts.displayFormats;
          const format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
          const exampleLabel = this._tickFormatFunction(exampleTime, 0, ticksFromTimestamps(this, [
              exampleTime
          ], this._majorUnit), format);
          const size = this._getLabelSize(exampleLabel);
          const capacity = Math.floor(this.isHorizontal() ? this.width / size.w : this.height / size.h) - 1;
          return capacity > 0 ? capacity : 1;
      }
   getDataTimestamps() {
          let timestamps = this._cache.data || [];
          let i, ilen;
          if (timestamps.length) {
              return timestamps;
          }
          const metas = this.getMatchingVisibleMetas();
          if (this._normalized && metas.length) {
              return this._cache.data = metas[0].controller.getAllParsedValues(this);
          }
          for(i = 0, ilen = metas.length; i < ilen; ++i){
              timestamps = timestamps.concat(metas[i].controller.getAllParsedValues(this));
          }
          return this._cache.data = this.normalize(timestamps);
      }
   getLabelTimestamps() {
          const timestamps = this._cache.labels || [];
          let i, ilen;
          if (timestamps.length) {
              return timestamps;
          }
          const labels = this.getLabels();
          for(i = 0, ilen = labels.length; i < ilen; ++i){
              timestamps.push(parse(this, labels[i]));
          }
          return this._cache.labels = this._normalized ? timestamps : this.normalize(timestamps);
      }
   normalize(values) {
          return _arrayUnique(values.sort(sorter));
      }
  }

  function interpolate(table, val, reverse) {
      let lo = 0;
      let hi = table.length - 1;
      let prevSource, nextSource, prevTarget, nextTarget;
      if (reverse) {
          if (val >= table[lo].pos && val <= table[hi].pos) {
              ({ lo , hi  } = _lookupByKey(table, 'pos', val));
          }
          ({ pos: prevSource , time: prevTarget  } = table[lo]);
          ({ pos: nextSource , time: nextTarget  } = table[hi]);
      } else {
          if (val >= table[lo].time && val <= table[hi].time) {
              ({ lo , hi  } = _lookupByKey(table, 'time', val));
          }
          ({ time: prevSource , pos: prevTarget  } = table[lo]);
          ({ time: nextSource , pos: nextTarget  } = table[hi]);
      }
      const span = nextSource - prevSource;
      return span ? prevTarget + (nextTarget - prevTarget) * (val - prevSource) / span : prevTarget;
  }
  class TimeSeriesScale extends TimeScale {
      static id = 'timeseries';
   static defaults = TimeScale.defaults;
   constructor(props){
          super(props);
           this._table = [];
           this._minPos = undefined;
           this._tableRange = undefined;
      }
   initOffsets() {
          const timestamps = this._getTimestampsForTable();
          const table = this._table = this.buildLookupTable(timestamps);
          this._minPos = interpolate(table, this.min);
          this._tableRange = interpolate(table, this.max) - this._minPos;
          super.initOffsets(timestamps);
      }
   buildLookupTable(timestamps) {
          const { min , max  } = this;
          const items = [];
          const table = [];
          let i, ilen, prev, curr, next;
          for(i = 0, ilen = timestamps.length; i < ilen; ++i){
              curr = timestamps[i];
              if (curr >= min && curr <= max) {
                  items.push(curr);
              }
          }
          if (items.length < 2) {
              return [
                  {
                      time: min,
                      pos: 0
                  },
                  {
                      time: max,
                      pos: 1
                  }
              ];
          }
          for(i = 0, ilen = items.length; i < ilen; ++i){
              next = items[i + 1];
              prev = items[i - 1];
              curr = items[i];
              if (Math.round((next + prev) / 2) !== curr) {
                  table.push({
                      time: curr,
                      pos: i / (ilen - 1)
                  });
              }
          }
          return table;
      }
   _getTimestampsForTable() {
          let timestamps = this._cache.all || [];
          if (timestamps.length) {
              return timestamps;
          }
          const data = this.getDataTimestamps();
          const label = this.getLabelTimestamps();
          if (data.length && label.length) {
              timestamps = this.normalize(data.concat(label));
          } else {
              timestamps = data.length ? data : label;
          }
          timestamps = this._cache.all = timestamps;
          return timestamps;
      }
   getDecimalForValue(value) {
          return (interpolate(this._table, value) - this._minPos) / this._tableRange;
      }
   getValueForPixel(pixel) {
          const offsets = this._offsets;
          const decimal = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
          return interpolate(this._table, decimal * this._tableRange + this._minPos, true);
      }
  }

  var scales = /*#__PURE__*/Object.freeze({
  __proto__: null,
  CategoryScale: CategoryScale,
  LinearScale: LinearScale,
  LogarithmicScale: LogarithmicScale,
  RadialLinearScale: RadialLinearScale,
  TimeScale: TimeScale,
  TimeSeriesScale: TimeSeriesScale
  });

  const registerables = [
      controllers,
      elements,
      plugins,
      scales
  ];

  Chart$1.register(...registerables);
  var Chart = Chart$1;

  const colours = ["A", "B", "C", "D", "E", "F"];

  /**
   * Returns a random bright line colour.
   *
   * @return {string} a random bright line colour.
   */
  function getLineColour() {
      let color = '#';
      for (let i = 0; i < 6; i++) {
          color += colours[Math.floor(Math.random() * colours.length)];
      }
      return color;
  }

  /**
   * Returns a range from a (inclusive) to b (exclusive)
   * @param a the lower bound
   * @param b the upper bound
   * @return {*[]} an array with all numbers between a (inclusive) and b (exclusive)
   */
  function range(a, b) {
      assertNotNull(a);
      assertNotNull(b);
      assert(Number.isInteger(a), "Lower bound is not an integer");
      assert(Number.isInteger(b), "Upper bound is not an integer");
      assert(a <= b, "Lower bound cannot be higher than upper bound");

      let arr = [];
      for (let i = a; i < b; i++) {
          arr[arr.length] = i;
      }

      return arr;
  }

  function assert(predicate, error) {
      if (!predicate) {
          throw new Error(error);
      }
  }

  function assertNotNull(x) {
      if (x === null || x === undefined) {
          throw new Error("Value is undefined");
      }
  }

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
      },
      plot_function: async (a, b, fn) => {
          assertNotNull(a);
          assertNotNull(b);
          assertNotNull(fn);
          assert(fn instanceof AFn, "Values is not an anonymous function");

          const xs = range(a.evaluate(), b.evaluate() + 1);
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
      },
      plot_functions: async (a, b, ...fns) => {
          assertNotNull(a);
          assertNotNull(b);
          assertNotNull(fns);

          const xs = range(a.evaluate(), b.evaluate() + 1);

          let datasets = [];
          for (const fn of fns) {
              assert(fn instanceof AFn, "Values is not an anonymous function");

              const ys = xs.map(x => fn.invoke(new Fraction(x)).evaluate());

              datasets[datasets.length] = {
                  label: `${fn.block.sourceString.trim()}`,
                  data: ys,
                  borderColor: `${getLineColour()}`,
                  backgroundColor: bg
              };
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
      }
  };

  registerNativeFns(graphFuns);

  let trigFuncs = {
      cos: (angle, radian = true) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * 0.0174533));
          return new Fraction(Math.cos(radAngle));
      },
      sin: (angle, radian = true) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * 0.0174533));
          return new Fraction(Math.sin(radAngle));
      },
      tan: (angle, radian = true) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * 0.0174533));
          return new Fraction(Math.tan(radAngle));
      },
      cot: (angle, radian = true) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * 0.0174533));
          return new Fraction(1 / Math.tan(radAngle));
      },
      arccos: (angle, radian = true) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = Math.acos(angle.evaluate());
          return new Fraction((radian ? radAngle : radAngle / 0.0174533));
      },
      arcsin: (angle, radian = true) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = Math.asin(angle.evaluate());
          return new Fraction((radian ? radAngle : radAngle / 0.0174533));
      },
      arctan: (angle, radian = true) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = Math.atan(angle.evaluate());
          return new Fraction((radian ? radAngle : radAngle / 0.0174533));
      },
      arccot: (angle, radian = true) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = Math.atan(1 / angle.evaluate());
          return new Fraction((radian ? radAngle : radAngle / 0.0174533));
      },
      rad: (angle) => {
          if (!(angle instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          return new Fraction((angle.evaluate()) * 0.0174533);
      },
      sinh: (num, radians = true) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = (radians ? num.evaluate : (num.evaluate() * 0.0174533));
          return new Fraction(Math.sinh(radAngle))
      },
      cosh: (num, radians = true) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = (radians ? num.evaluate : (num.evaluate() * 0.0174533));
          return new Fraction(Math.cosh(radAngle))
      },
      tanh: (num, radians = true) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          let radAngle = (radians ? num.evaluate : (num.evaluate() * 0.0174533));
          return new Fraction(Math.tanh(radAngle))
      },
      deg: (num) => {
          if (!(num instanceof Fraction)) {
              throw new TypeError('Function only supports numeric type (Fraction)');
          }
          return new Fraction((num.evaluate()) / 0.0174533);
      }
  };

  registerNativeFns(trigFuncs);

  console.log("Loading grammar");

  const g = ohm.grammar(`
Reject { 
    
    // =============

    // note that all elements in this grammar are lexical rules.
    // this is to avoid incorrect indentation, etc.

    Program = Element*

    Element = Var | Cond | For | Return | Fn | Expression
    
    // =============
    
    // todo fix
    Var = identifier "=" Expression
    
    // =============
    
    // improve naming
    Expression = Assignment
    
    // assignment first since it uses exprs
    Assignment = Ternary assignmentOp Expression -- assignment
        | Ternary
    
    // ternary doesn't allow for assignment, so go down
    Ternary = Ternary "?" Expression ":" Expression -- ternary
        | Comparator
        
    Comparator = Comparator compareOp Expression -- compare
        | Addition
        
    Addition = Addition addOp Multiplication -- add
        | Multiplication
        
    Multiplication 
        = Multiplication mulOp Exponentiation -- mul
        | Exponentiation 
        
    Exponentiation
        = Exponentiation "^" Logical -- exp
        | Exponentiation ~spaces "!" -- fac // adding a space causes x! to be confused with x !=, so for now this'll have to do
        | Logical
        
    Logical = Logical logicOp Expression -- logic
        | LogicalNot
        
    LogicalNot = "!" ~spaces LogicalNot -- not
        | AFn

    AFn = ":(" ListOf<identifier, ","> "): " Expression -- afn
        | Pipe
        
    Pipe = "|" Expression "|" -- pipe
        | Invocation
        
    Invocation = identifier "(" listOf<Expression, ","> ")" -- invoke
        | Default
        
    // the last resort
    Default
        = Literal 
        | identifier
        | "(" Expression ")" -- par
    
    // =============
    
    Cond = CondWhen
    
    CondWhen = "when " Expression Block
    
    For = "for " ListOf<identifier, ","> "in" Expression Block
    
    Fn = "fun " identifier "(" ListOf<FnArg, ","> ")" Block
    
    FnArg = Var | identifier
    
    Return = "return" Expression
    
    // =============
    
    Literal = boolean | char | string | number | Array | Matrix
    
    boolean = "true" | "false"
    
    string = "\\"" (~("\\"" | nl) any)* "\\""

    char = "'" (~nl any) "'"
    
    integer = "-"? digit+
    
    float = "-"? digit* "." integer+
    
    number = float | integer
    
    Array = "[" ListOf<Expression, ","> "]"

    Matrix = "{" ListOf<Expression, ","> "}"
    
    // =============
    
    addOp = "+" | "-"
    
    mulOp = "*" | "/" | "%"
    
    assignmentOp = "=" | "+=" | "-=" | "*=" | "/=" | "^=" | "%="
    
    compareOp = "==" | "!=" | "<=" | ">=" | "<" | ">" 
    
    logicOp = "and" | "or"
    
    comment (a comment) = "#" (~nl any)*
    
    nl = "\\r\\n" | "\\r" | "\\n"
    
    space := ... | comment
    
    identifier = ~(digit+) #(alnum | "_")+
    
    Block = "{" Element+ "}"

}`);

  console.log("Created grammar");

  const semantics = g.createSemantics();

  console.log("Created semantics");

  semantics.addOperation("parse", {

      // =============

      Var(ident, _, value) {
          ident = ident.sourceString.trim();
          value = value.parse();

          VARS.set(ident, new Var(ident, value));
      },

      // =============

      Assignment_assignment(name, op, expr) {
          name = name.sourceString.trim();
          op = op.sourceString.trim();
          expr = expr.parse();

          let updated;
          if (VARS.has(name)) {
              updated = VARS.get(name);

              switch (op) {
                  case "=":
                      updated.value = expr;
                      break;
                  case "+=":
                      updated.value = updated.value.add(expr);
                      break;
                  case "-=":
                      updated.value = updated.value.subtract(expr);
                      break;
                  case "*=":
                      updated.value = updated.value.multiply(expr);
                      break;
                  case "/=":
                      updated.value = updated.value.divide(expr);
                      break;
                  case "^=":
                      updated.value = updated.value.pow(expr);
                      break;
                  case "%=":
                      updated.value = updated.value.mod(expr);
                      break;
              }
          } else {
              updated = expr;
          }

          VARS.set(name, updated);
      },

      Ternary_ternary(cond, _, pass, __, dontPass) {
          return cond.parse() ? pass.parse() : dontPass.parse();
      },

      Comparator_compare(x, op, y) {
          x = x.parse();
          op = op.sourceString.trim();
          y = y.parse();

          switch (op) {
              case "==":
                  if (x instanceof Fraction && y instanceof Fraction) {
                      return x.evaluate() === y.evaluate();
                  } else if (x instanceof Complex && y instanceof Complex) {
                      return x.real === y.real && x.imag === y.imag;
                  } else if (x instanceof Collection && y instanceof Collection) {
                      if (x === y) return true;
                      if (x.length() === y.length()) return true;

                      return x.toString() === y.toString(); // probably not the most efficient, but who cares! :D
                  } else {
                      return x === y;
                  }
              case "!=":
                  if (x instanceof Fraction && y instanceof Fraction) {
                      console.log(x.evaluate(), y.evaluate());
                      return x.evaluate() !== y.evaluate();
                  } else if (x instanceof Complex && y instanceof Complex) {
                      return x.real !== y.real && x.imag !== y.imag;
                  } else if (x instanceof Collection && y instanceof Collection) {
                      if (x === y || x.length() !== y.length()) return false;

                      return x.toString() !== y.toString();
                  } else {
                      return x !== y;
                  }
              case ">":
                  if (x instanceof Fraction && y instanceof Fraction) {
                      return x.evaluate() > y.evaluate();
                  }

                  throw new TypeError(`Operator '>' cannot be applied to '${typeof x}' and '${typeof y}'`);
              case "<":
                  if (x instanceof Fraction && y instanceof Fraction) {
                      return x.evaluate() < y.evaluate();
                  }

                  throw new TypeError(`Operator '<' cannot be applied to '${typeof x}' and '${typeof y}'`);
              case ">=":
                  if (x instanceof Fraction && y instanceof Fraction) {
                      return x.evaluate() >= y.evaluate();
                  }

                  throw new TypeError(`Operator '>=' cannot be applied to '${typeof x}' and '${typeof y}'`);
              case "<=":
                  if (x instanceof Fraction && y instanceof Fraction) {
                      return x.evaluate() <= y.evaluate();
                  }

                  throw new TypeError(`Operator '<=' cannot be applied to '${typeof x}' and '${typeof y}'`);
          }
      },

      Addition_add(x, op, y) {
          x = x.parse();
          y = y.parse();
          op = op.sourceString.trim();

          switch (op) {
              case "+":
                  return x.add(y);
              case "-":
                  return x.subtract(y);
          }
      },

      Multiplication_mul(x, op, y) {
          x = x.parse();
          y = y.parse();
          op = op.sourceString.trim();

          switch (op) {
              case "*":
                  return x.multiply(y);
              case "/":
                  return x.divide(y);
              case "%":
                  return x.evaluate() % y.evaluate();
          }
      },

      Exponentiation_exp(x, _, y) {
          return x.parse().pow(y.parse());
      },
      Exponentiation_fac(x, _) {
          return x.parse().factorial();
      },

      Logical_logic(x, op, y) {
          x = x.parse();
          y = y.parse();
          op = op.sourceString.trim();

          switch (op) {
              case "and":
                  return x && y;
              case "or":
                  return x || y;
          }
      },

      LogicalNot_not(_, x) {
          return !x.parse();
      },

      AFn_afn(_, args, __, expr) {
          return new AFn(
              args.asIteration()
                  .children
                  .map(variable => new Var(variable.sourceString.trim(), null)),
              expr);
      },

      Pipe_pipe(_, x, __) {
          x = x.parse();

          if (x instanceof Fraction) {
              return x.abs();
          } else if (x instanceof Collection) {
              return x.length();
          }

          // return x when there is no value to be changed
          return x;
      },

      Invocation_invoke(ident, _, xs, __) {
          ident = ident.sourceString.trim();
          let fun = FUNS.get(ident);

          if (fun === null || fun === undefined) {
              throw new Error(`Unknown function: ${ident}`);
          }

          return fun.invoke(xs.asIteration()
              .children
              .map(x => x.parse()));
      },

      Default_par(_, x, __) {
          return x.parse();
      },

      // =============

      CondWhen(_, arg, block) {
          if (arg.parse() === true) {
              block.parse();
          }
      },

      Fn(_, ident, __, args, ___, block) {
          ident = ident.sourceString.trim();

          FUNS.set(ident, new Fn(ident,
              args.asIteration()
                  .children
                  .map(variable => {
                      let string = variable.sourceString.trim();
                      let ident = string.split("=")[0].trim();

                      return string.includes("=") ? new Var(ident, variable.children[1].children[2].parse()) : new Var(ident, null);
                  }), block));
      },

      // =============

      boolean(x) {
          return x.sourceString === "true";
      },

      string(_, x, __) {
          return new Str(x.sourceString);
      },

      char(_, x, __) {
          return new Str(x.sourceString);
      },

      integer(sgn, x) {
          return new Fraction(parseInt(sgn.sourceString + x.sourceString));
      },

      float(sgn, x, _, y) {
          return new Fraction(parseFloat(sgn.sourceString + x.sourceString + "." + y.sourceString));
      },

      Array(_, xs, __) {
          return new Collection(xs
              .asIteration()
              .children
              .map(x => x.parse()));
      },

      Matrix(_, xs, __) {
          return new Matrix(xs
              .asIteration()
              .children
              .map(x => x.parse()));
      },

      // =============

      identifier(x) {
          let str = x.sourceString.trim();

          if (VARS.has(str)) {
              return VARS.get(str).value;
          }

          throw new Error("Unknown variable: " + str);
      },

      Block(_, xs, __) {
          return xs.parse();
      },

      // a program contains multiple elements, so call eval on all of them
      _iter(...children) {
          return children.map(c => c.parse());
      },
  });

  console.log("Defined semantics");

  function parseInput(input) {
      const result = g.match(input);

      if (result.succeeded()) {
          return semantics(result).parse();
      } else {
          log(result.message);
          throw new Error(result.message);
      }
  }

  return parseInput;

})();
