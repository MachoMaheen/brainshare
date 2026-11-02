var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/marked/lib/marked.esm.js
function _getDefaults() {
  return {
    async: false,
    breaks: false,
    extensions: null,
    gfm: true,
    hooks: null,
    pedantic: false,
    renderer: null,
    silent: false,
    tokenizer: null,
    walkTokens: null
  };
}
__name(_getDefaults, "_getDefaults");
var _defaults = _getDefaults();
function changeDefaults(newDefaults) {
  _defaults = newDefaults;
}
__name(changeDefaults, "changeDefaults");
var escapeTest = /[&<>"']/;
var escapeReplace = new RegExp(escapeTest.source, "g");
var escapeTestNoEncode = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
var escapeReplaceNoEncode = new RegExp(escapeTestNoEncode.source, "g");
var escapeReplacements = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
var getEscapeReplacement = /* @__PURE__ */ __name((ch) => escapeReplacements[ch], "getEscapeReplacement");
function escape$1(html3, encode) {
  if (encode) {
    if (escapeTest.test(html3)) {
      return html3.replace(escapeReplace, getEscapeReplacement);
    }
  } else {
    if (escapeTestNoEncode.test(html3)) {
      return html3.replace(escapeReplaceNoEncode, getEscapeReplacement);
    }
  }
  return html3;
}
__name(escape$1, "escape$1");
var unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function unescape(html3) {
  return html3.replace(unescapeTest, (_, n) => {
    n = n.toLowerCase();
    if (n === "colon")
      return ":";
    if (n.charAt(0) === "#") {
      return n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
    }
    return "";
  });
}
__name(unescape, "unescape");
var caret = /(^|[^\[])\^/g;
function edit(regex, opt) {
  let source = typeof regex === "string" ? regex : regex.source;
  opt = opt || "";
  const obj = {
    replace: (name, val) => {
      let valSource = typeof val === "string" ? val : val.source;
      valSource = valSource.replace(caret, "$1");
      source = source.replace(name, valSource);
      return obj;
    },
    getRegex: () => {
      return new RegExp(source, opt);
    }
  };
  return obj;
}
__name(edit, "edit");
function cleanUrl(href) {
  try {
    href = encodeURI(href).replace(/%25/g, "%");
  } catch (e) {
    return null;
  }
  return href;
}
__name(cleanUrl, "cleanUrl");
var noopTest = { exec: () => null };
function splitCells(tableRow, count) {
  const row = tableRow.replace(/\|/g, (match, offset, str) => {
    let escaped = false;
    let curr = offset;
    while (--curr >= 0 && str[curr] === "\\")
      escaped = !escaped;
    if (escaped) {
      return "|";
    } else {
      return " |";
    }
  }), cells = row.split(/ \|/);
  let i = 0;
  if (!cells[0].trim()) {
    cells.shift();
  }
  if (cells.length > 0 && !cells[cells.length - 1].trim()) {
    cells.pop();
  }
  if (count) {
    if (cells.length > count) {
      cells.splice(count);
    } else {
      while (cells.length < count)
        cells.push("");
    }
  }
  for (; i < cells.length; i++) {
    cells[i] = cells[i].trim().replace(/\\\|/g, "|");
  }
  return cells;
}
__name(splitCells, "splitCells");
function rtrim(str, c, invert) {
  const l = str.length;
  if (l === 0) {
    return "";
  }
  let suffLen = 0;
  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }
  return str.slice(0, l - suffLen);
}
__name(rtrim, "rtrim");
function findClosingBracket(str, b) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }
  let level = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\\") {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  return -1;
}
__name(findClosingBracket, "findClosingBracket");
function outputLink(cap2, link2, raw, lexer2) {
  const href = link2.href;
  const title = link2.title ? escape$1(link2.title) : null;
  const text = cap2[1].replace(/\\([\[\]])/g, "$1");
  if (cap2[0].charAt(0) !== "!") {
    lexer2.state.inLink = true;
    const token = {
      type: "link",
      raw,
      href,
      title,
      text,
      tokens: lexer2.inlineTokens(text)
    };
    lexer2.state.inLink = false;
    return token;
  }
  return {
    type: "image",
    raw,
    href,
    title,
    text: escape$1(text)
  };
}
__name(outputLink, "outputLink");
function indentCodeCompensation(raw, text) {
  const matchIndentToCode = raw.match(/^(\s+)(?:```)/);
  if (matchIndentToCode === null) {
    return text;
  }
  const indentToCode = matchIndentToCode[1];
  return text.split("\n").map((node) => {
    const matchIndentInNode = node.match(/^\s+/);
    if (matchIndentInNode === null) {
      return node;
    }
    const [indentInNode] = matchIndentInNode;
    if (indentInNode.length >= indentToCode.length) {
      return node.slice(indentToCode.length);
    }
    return node;
  }).join("\n");
}
__name(indentCodeCompensation, "indentCodeCompensation");
var _Tokenizer = class {
  options;
  rules;
  // set by the lexer
  lexer;
  // set by the lexer
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  space(src) {
    const cap2 = this.rules.block.newline.exec(src);
    if (cap2 && cap2[0].length > 0) {
      return {
        type: "space",
        raw: cap2[0]
      };
    }
  }
  code(src) {
    const cap2 = this.rules.block.code.exec(src);
    if (cap2) {
      const text = cap2[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: cap2[0],
        codeBlockStyle: "indented",
        text: !this.options.pedantic ? rtrim(text, "\n") : text
      };
    }
  }
  fences(src) {
    const cap2 = this.rules.block.fences.exec(src);
    if (cap2) {
      const raw = cap2[0];
      const text = indentCodeCompensation(raw, cap2[3] || "");
      return {
        type: "code",
        raw,
        lang: cap2[2] ? cap2[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : cap2[2],
        text
      };
    }
  }
  heading(src) {
    const cap2 = this.rules.block.heading.exec(src);
    if (cap2) {
      let text = cap2[2].trim();
      if (/#$/.test(text)) {
        const trimmed = rtrim(text, "#");
        if (this.options.pedantic) {
          text = trimmed.trim();
        } else if (!trimmed || / $/.test(trimmed)) {
          text = trimmed.trim();
        }
      }
      return {
        type: "heading",
        raw: cap2[0],
        depth: cap2[1].length,
        text,
        tokens: this.lexer.inline(text)
      };
    }
  }
  hr(src) {
    const cap2 = this.rules.block.hr.exec(src);
    if (cap2) {
      return {
        type: "hr",
        raw: cap2[0]
      };
    }
  }
  blockquote(src) {
    const cap2 = this.rules.block.blockquote.exec(src);
    if (cap2) {
      const text = rtrim(cap2[0].replace(/^ *>[ \t]?/gm, ""), "\n");
      const top = this.lexer.state.top;
      this.lexer.state.top = true;
      const tokens = this.lexer.blockTokens(text);
      this.lexer.state.top = top;
      return {
        type: "blockquote",
        raw: cap2[0],
        tokens,
        text
      };
    }
  }
  list(src) {
    let cap2 = this.rules.block.list.exec(src);
    if (cap2) {
      let bull = cap2[1].trim();
      const isordered = bull.length > 1;
      const list2 = {
        type: "list",
        raw: "",
        ordered: isordered,
        start: isordered ? +bull.slice(0, -1) : "",
        loose: false,
        items: []
      };
      bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
      if (this.options.pedantic) {
        bull = isordered ? bull : "[*+-]";
      }
      const itemRegex = new RegExp(`^( {0,3}${bull})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let raw = "";
      let itemContents = "";
      let endsWithBlankLine = false;
      while (src) {
        let endEarly = false;
        if (!(cap2 = itemRegex.exec(src))) {
          break;
        }
        if (this.rules.block.hr.test(src)) {
          break;
        }
        raw = cap2[0];
        src = src.substring(raw.length);
        let line = cap2[2].split("\n", 1)[0].replace(/^\t+/, (t) => " ".repeat(3 * t.length));
        let nextLine = src.split("\n", 1)[0];
        let indent = 0;
        if (this.options.pedantic) {
          indent = 2;
          itemContents = line.trimStart();
        } else {
          indent = cap2[2].search(/[^ ]/);
          indent = indent > 4 ? 1 : indent;
          itemContents = line.slice(indent);
          indent += cap2[1].length;
        }
        let blankLine = false;
        if (!line && /^ *$/.test(nextLine)) {
          raw += nextLine + "\n";
          src = src.substring(nextLine.length + 1);
          endEarly = true;
        }
        if (!endEarly) {
          const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`);
          const hrRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`);
          const fencesBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`);
          const headingBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`);
          while (src) {
            const rawLine = src.split("\n", 1)[0];
            nextLine = rawLine;
            if (this.options.pedantic) {
              nextLine = nextLine.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ");
            }
            if (fencesBeginRegex.test(nextLine)) {
              break;
            }
            if (headingBeginRegex.test(nextLine)) {
              break;
            }
            if (nextBulletRegex.test(nextLine)) {
              break;
            }
            if (hrRegex.test(src)) {
              break;
            }
            if (nextLine.search(/[^ ]/) >= indent || !nextLine.trim()) {
              itemContents += "\n" + nextLine.slice(indent);
            } else {
              if (blankLine) {
                break;
              }
              if (line.search(/[^ ]/) >= 4) {
                break;
              }
              if (fencesBeginRegex.test(line)) {
                break;
              }
              if (headingBeginRegex.test(line)) {
                break;
              }
              if (hrRegex.test(line)) {
                break;
              }
              itemContents += "\n" + nextLine;
            }
            if (!blankLine && !nextLine.trim()) {
              blankLine = true;
            }
            raw += rawLine + "\n";
            src = src.substring(rawLine.length + 1);
            line = nextLine.slice(indent);
          }
        }
        if (!list2.loose) {
          if (endsWithBlankLine) {
            list2.loose = true;
          } else if (/\n *\n *$/.test(raw)) {
            endsWithBlankLine = true;
          }
        }
        let istask = null;
        let ischecked;
        if (this.options.gfm) {
          istask = /^\[[ xX]\] /.exec(itemContents);
          if (istask) {
            ischecked = istask[0] !== "[ ] ";
            itemContents = itemContents.replace(/^\[[ xX]\] +/, "");
          }
        }
        list2.items.push({
          type: "list_item",
          raw,
          task: !!istask,
          checked: ischecked,
          loose: false,
          text: itemContents,
          tokens: []
        });
        list2.raw += raw;
      }
      list2.items[list2.items.length - 1].raw = raw.trimEnd();
      list2.items[list2.items.length - 1].text = itemContents.trimEnd();
      list2.raw = list2.raw.trimEnd();
      for (let i = 0; i < list2.items.length; i++) {
        this.lexer.state.top = false;
        list2.items[i].tokens = this.lexer.blockTokens(list2.items[i].text, []);
        if (!list2.loose) {
          const spacers = list2.items[i].tokens.filter((t) => t.type === "space");
          const hasMultipleLineBreaks = spacers.length > 0 && spacers.some((t) => /\n.*\n/.test(t.raw));
          list2.loose = hasMultipleLineBreaks;
        }
      }
      if (list2.loose) {
        for (let i = 0; i < list2.items.length; i++) {
          list2.items[i].loose = true;
        }
      }
      return list2;
    }
  }
  html(src) {
    const cap2 = this.rules.block.html.exec(src);
    if (cap2) {
      const token = {
        type: "html",
        block: true,
        raw: cap2[0],
        pre: cap2[1] === "pre" || cap2[1] === "script" || cap2[1] === "style",
        text: cap2[0]
      };
      return token;
    }
  }
  def(src) {
    const cap2 = this.rules.block.def.exec(src);
    if (cap2) {
      const tag2 = cap2[1].toLowerCase().replace(/\s+/g, " ");
      const href = cap2[2] ? cap2[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "";
      const title = cap2[3] ? cap2[3].substring(1, cap2[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : cap2[3];
      return {
        type: "def",
        tag: tag2,
        raw: cap2[0],
        href,
        title
      };
    }
  }
  table(src) {
    const cap2 = this.rules.block.table.exec(src);
    if (!cap2) {
      return;
    }
    if (!/[:|]/.test(cap2[2])) {
      return;
    }
    const headers = splitCells(cap2[1]);
    const aligns = cap2[2].replace(/^\||\| *$/g, "").split("|");
    const rows = cap2[3] && cap2[3].trim() ? cap2[3].replace(/\n[ \t]*$/, "").split("\n") : [];
    const item = {
      type: "table",
      raw: cap2[0],
      header: [],
      align: [],
      rows: []
    };
    if (headers.length !== aligns.length) {
      return;
    }
    for (const align of aligns) {
      if (/^ *-+: *$/.test(align)) {
        item.align.push("right");
      } else if (/^ *:-+: *$/.test(align)) {
        item.align.push("center");
      } else if (/^ *:-+ *$/.test(align)) {
        item.align.push("left");
      } else {
        item.align.push(null);
      }
    }
    for (const header of headers) {
      item.header.push({
        text: header,
        tokens: this.lexer.inline(header)
      });
    }
    for (const row of rows) {
      item.rows.push(splitCells(row, item.header.length).map((cell) => {
        return {
          text: cell,
          tokens: this.lexer.inline(cell)
        };
      }));
    }
    return item;
  }
  lheading(src) {
    const cap2 = this.rules.block.lheading.exec(src);
    if (cap2) {
      return {
        type: "heading",
        raw: cap2[0],
        depth: cap2[2].charAt(0) === "=" ? 1 : 2,
        text: cap2[1],
        tokens: this.lexer.inline(cap2[1])
      };
    }
  }
  paragraph(src) {
    const cap2 = this.rules.block.paragraph.exec(src);
    if (cap2) {
      const text = cap2[1].charAt(cap2[1].length - 1) === "\n" ? cap2[1].slice(0, -1) : cap2[1];
      return {
        type: "paragraph",
        raw: cap2[0],
        text,
        tokens: this.lexer.inline(text)
      };
    }
  }
  text(src) {
    const cap2 = this.rules.block.text.exec(src);
    if (cap2) {
      return {
        type: "text",
        raw: cap2[0],
        text: cap2[0],
        tokens: this.lexer.inline(cap2[0])
      };
    }
  }
  escape(src) {
    const cap2 = this.rules.inline.escape.exec(src);
    if (cap2) {
      return {
        type: "escape",
        raw: cap2[0],
        text: escape$1(cap2[1])
      };
    }
  }
  tag(src) {
    const cap2 = this.rules.inline.tag.exec(src);
    if (cap2) {
      if (!this.lexer.state.inLink && /^<a /i.test(cap2[0])) {
        this.lexer.state.inLink = true;
      } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap2[0])) {
        this.lexer.state.inLink = false;
      }
      if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap2[0])) {
        this.lexer.state.inRawBlock = true;
      } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap2[0])) {
        this.lexer.state.inRawBlock = false;
      }
      return {
        type: "html",
        raw: cap2[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: false,
        text: cap2[0]
      };
    }
  }
  link(src) {
    const cap2 = this.rules.inline.link.exec(src);
    if (cap2) {
      const trimmedUrl = cap2[2].trim();
      if (!this.options.pedantic && /^</.test(trimmedUrl)) {
        if (!/>$/.test(trimmedUrl)) {
          return;
        }
        const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
        if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
          return;
        }
      } else {
        const lastParenIndex = findClosingBracket(cap2[2], "()");
        if (lastParenIndex > -1) {
          const start = cap2[0].indexOf("!") === 0 ? 5 : 4;
          const linkLen = start + cap2[1].length + lastParenIndex;
          cap2[2] = cap2[2].substring(0, lastParenIndex);
          cap2[0] = cap2[0].substring(0, linkLen).trim();
          cap2[3] = "";
        }
      }
      let href = cap2[2];
      let title = "";
      if (this.options.pedantic) {
        const link2 = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
        if (link2) {
          href = link2[1];
          title = link2[3];
        }
      } else {
        title = cap2[3] ? cap2[3].slice(1, -1) : "";
      }
      href = href.trim();
      if (/^</.test(href)) {
        if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
          href = href.slice(1);
        } else {
          href = href.slice(1, -1);
        }
      }
      return outputLink(cap2, {
        href: href ? href.replace(this.rules.inline.anyPunctuation, "$1") : href,
        title: title ? title.replace(this.rules.inline.anyPunctuation, "$1") : title
      }, cap2[0], this.lexer);
    }
  }
  reflink(src, links) {
    let cap2;
    if ((cap2 = this.rules.inline.reflink.exec(src)) || (cap2 = this.rules.inline.nolink.exec(src))) {
      const linkString = (cap2[2] || cap2[1]).replace(/\s+/g, " ");
      const link2 = links[linkString.toLowerCase()];
      if (!link2) {
        const text = cap2[0].charAt(0);
        return {
          type: "text",
          raw: text,
          text
        };
      }
      return outputLink(cap2, link2, cap2[0], this.lexer);
    }
  }
  emStrong(src, maskedSrc, prevChar = "") {
    let match = this.rules.inline.emStrongLDelim.exec(src);
    if (!match)
      return;
    if (match[3] && prevChar.match(/[\p{L}\p{N}]/u))
      return;
    const nextChar = match[1] || match[2] || "";
    if (!nextChar || !prevChar || this.rules.inline.punctuation.exec(prevChar)) {
      const lLength = [...match[0]].length - 1;
      let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
      const endReg = match[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      endReg.lastIndex = 0;
      maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
      while ((match = endReg.exec(maskedSrc)) != null) {
        rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
        if (!rDelim)
          continue;
        rLength = [...rDelim].length;
        if (match[3] || match[4]) {
          delimTotal += rLength;
          continue;
        } else if (match[5] || match[6]) {
          if (lLength % 3 && !((lLength + rLength) % 3)) {
            midDelimTotal += rLength;
            continue;
          }
        }
        delimTotal -= rLength;
        if (delimTotal > 0)
          continue;
        rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
        const lastCharLength = [...match[0]][0].length;
        const raw = src.slice(0, lLength + match.index + lastCharLength + rLength);
        if (Math.min(lLength, rLength) % 2) {
          const text2 = raw.slice(1, -1);
          return {
            type: "em",
            raw,
            text: text2,
            tokens: this.lexer.inlineTokens(text2)
          };
        }
        const text = raw.slice(2, -2);
        return {
          type: "strong",
          raw,
          text,
          tokens: this.lexer.inlineTokens(text)
        };
      }
    }
  }
  codespan(src) {
    const cap2 = this.rules.inline.code.exec(src);
    if (cap2) {
      let text = cap2[2].replace(/\n/g, " ");
      const hasNonSpaceChars = /[^ ]/.test(text);
      const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
      if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
        text = text.substring(1, text.length - 1);
      }
      text = escape$1(text, true);
      return {
        type: "codespan",
        raw: cap2[0],
        text
      };
    }
  }
  br(src) {
    const cap2 = this.rules.inline.br.exec(src);
    if (cap2) {
      return {
        type: "br",
        raw: cap2[0]
      };
    }
  }
  del(src) {
    const cap2 = this.rules.inline.del.exec(src);
    if (cap2) {
      return {
        type: "del",
        raw: cap2[0],
        text: cap2[2],
        tokens: this.lexer.inlineTokens(cap2[2])
      };
    }
  }
  autolink(src) {
    const cap2 = this.rules.inline.autolink.exec(src);
    if (cap2) {
      let text, href;
      if (cap2[2] === "@") {
        text = escape$1(cap2[1]);
        href = "mailto:" + text;
      } else {
        text = escape$1(cap2[1]);
        href = text;
      }
      return {
        type: "link",
        raw: cap2[0],
        text,
        href,
        tokens: [
          {
            type: "text",
            raw: text,
            text
          }
        ]
      };
    }
  }
  url(src) {
    let cap2;
    if (cap2 = this.rules.inline.url.exec(src)) {
      let text, href;
      if (cap2[2] === "@") {
        text = escape$1(cap2[0]);
        href = "mailto:" + text;
      } else {
        let prevCapZero;
        do {
          prevCapZero = cap2[0];
          cap2[0] = this.rules.inline._backpedal.exec(cap2[0])?.[0] ?? "";
        } while (prevCapZero !== cap2[0]);
        text = escape$1(cap2[0]);
        if (cap2[1] === "www.") {
          href = "http://" + cap2[0];
        } else {
          href = cap2[0];
        }
      }
      return {
        type: "link",
        raw: cap2[0],
        text,
        href,
        tokens: [
          {
            type: "text",
            raw: text,
            text
          }
        ]
      };
    }
  }
  inlineText(src) {
    const cap2 = this.rules.inline.text.exec(src);
    if (cap2) {
      let text;
      if (this.lexer.state.inRawBlock) {
        text = cap2[0];
      } else {
        text = escape$1(cap2[0]);
      }
      return {
        type: "text",
        raw: cap2[0],
        text
      };
    }
  }
};
__name(_Tokenizer, "_Tokenizer");
var newline = /^(?: *(?:\n|$))+/;
var blockCode = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/;
var fences = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var hr = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var heading = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var bullet = /(?:[*+-]|\d{1,9}[.)])/;
var lheading = edit(/^(?!bull )((?:.|\n(?!\s*?\n|bull ))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, bullet).getRegex();
var _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var blockText = /^[^\n]+/;
var _blockLabel = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
var def = edit(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", _blockLabel).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var list = edit(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, bullet).getRegex();
var _tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var _comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
var html = edit("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", _comment).replace("tag", _tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var paragraph = edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
var blockquote = edit(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", paragraph).getRegex();
var blockNormal = {
  blockquote,
  code: blockCode,
  def,
  fences,
  heading,
  hr,
  html,
  lheading,
  list,
  newline,
  paragraph,
  table: noopTest,
  text: blockText
};
var gfmTable = edit("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
var blockGfm = {
  ...blockNormal,
  table: gfmTable,
  paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", gfmTable).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex()
};
var blockPedantic = {
  ...blockNormal,
  html: edit(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", _comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: noopTest,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", lheading).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
};
var escape = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var br = /^( {2,}|\\)\n(?!\s*$)/;
var inlineText = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var _punctuation = "\\p{P}$+<=>`^|~";
var punctuation = edit(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, _punctuation).getRegex();
var blockSkip = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g;
var emStrongLDelim = edit(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, _punctuation).getRegex();
var emStrongRDelimAst = edit("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, _punctuation).getRegex();
var emStrongRDelimUnd = edit("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, _punctuation).getRegex();
var anyPunctuation = edit(/\\([punct])/, "gu").replace(/punct/g, _punctuation).getRegex();
var autolink = edit(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var _inlineComment = edit(_comment).replace("(?:-->|$)", "-->").getRegex();
var tag = edit("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", _inlineComment).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var _inlineLabel = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
var link = edit(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", _inlineLabel).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var reflink = edit(/^!?\[(label)\]\[(ref)\]/).replace("label", _inlineLabel).replace("ref", _blockLabel).getRegex();
var nolink = edit(/^!?\[(ref)\](?:\[\])?/).replace("ref", _blockLabel).getRegex();
var reflinkSearch = edit("reflink|nolink(?!\\()", "g").replace("reflink", reflink).replace("nolink", nolink).getRegex();
var inlineNormal = {
  _backpedal: noopTest,
  // only used for GFM url
  anyPunctuation,
  autolink,
  blockSkip,
  br,
  code: inlineCode,
  del: noopTest,
  emStrongLDelim,
  emStrongRDelimAst,
  emStrongRDelimUnd,
  escape,
  link,
  nolink,
  punctuation,
  reflink,
  reflinkSearch,
  tag,
  text: inlineText,
  url: noopTest
};
var inlinePedantic = {
  ...inlineNormal,
  link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", _inlineLabel).getRegex(),
  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", _inlineLabel).getRegex()
};
var inlineGfm = {
  ...inlineNormal,
  escape: edit(escape).replace("])", "~|])").getRegex(),
  url: edit(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
};
var inlineBreaks = {
  ...inlineGfm,
  br: edit(br).replace("{2,}", "*").getRegex(),
  text: edit(inlineGfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
};
var block = {
  normal: blockNormal,
  gfm: blockGfm,
  pedantic: blockPedantic
};
var inline = {
  normal: inlineNormal,
  gfm: inlineGfm,
  breaks: inlineBreaks,
  pedantic: inlinePedantic
};
var _Lexer = class {
  tokens;
  options;
  state;
  tokenizer;
  inlineQueue;
  constructor(options2) {
    this.tokens = [];
    this.tokens.links = /* @__PURE__ */ Object.create(null);
    this.options = options2 || _defaults;
    this.options.tokenizer = this.options.tokenizer || new _Tokenizer();
    this.tokenizer = this.options.tokenizer;
    this.tokenizer.options = this.options;
    this.tokenizer.lexer = this;
    this.inlineQueue = [];
    this.state = {
      inLink: false,
      inRawBlock: false,
      top: true
    };
    const rules = {
      block: block.normal,
      inline: inline.normal
    };
    if (this.options.pedantic) {
      rules.block = block.pedantic;
      rules.inline = inline.pedantic;
    } else if (this.options.gfm) {
      rules.block = block.gfm;
      if (this.options.breaks) {
        rules.inline = inline.breaks;
      } else {
        rules.inline = inline.gfm;
      }
    }
    this.tokenizer.rules = rules;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block,
      inline
    };
  }
  /**
   * Static Lex Method
   */
  static lex(src, options2) {
    const lexer2 = new _Lexer(options2);
    return lexer2.lex(src);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(src, options2) {
    const lexer2 = new _Lexer(options2);
    return lexer2.inlineTokens(src);
  }
  /**
   * Preprocessing
   */
  lex(src) {
    src = src.replace(/\r\n|\r/g, "\n");
    this.blockTokens(src, this.tokens);
    for (let i = 0; i < this.inlineQueue.length; i++) {
      const next = this.inlineQueue[i];
      this.inlineTokens(next.src, next.tokens);
    }
    this.inlineQueue = [];
    return this.tokens;
  }
  blockTokens(src, tokens = []) {
    if (this.options.pedantic) {
      src = src.replace(/\t/g, "    ").replace(/^ +$/gm, "");
    } else {
      src = src.replace(/^( *)(\t+)/gm, (_, leading, tabs) => {
        return leading + "    ".repeat(tabs.length);
      });
    }
    let token;
    let lastToken;
    let cutSrc;
    let lastParagraphClipped;
    while (src) {
      if (this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((extTokenizer) => {
        if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return true;
        }
        return false;
      })) {
        continue;
      }
      if (token = this.tokenizer.space(src)) {
        src = src.substring(token.raw.length);
        if (token.raw.length === 1 && tokens.length > 0) {
          tokens[tokens.length - 1].raw += "\n";
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.code(src)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.fences(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.heading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.hr(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.blockquote(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.list(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.html(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.def(src)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.raw;
          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
        } else if (!this.tokens.links[token.tag]) {
          this.tokens.links[token.tag] = {
            href: token.href,
            title: token.title
          };
        }
        continue;
      }
      if (token = this.tokenizer.table(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.lheading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      cutSrc = src;
      if (this.options.extensions && this.options.extensions.startBlock) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startBlock.forEach((getStartIndex) => {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === "number" && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
        lastToken = tokens[tokens.length - 1];
        if (lastParagraphClipped && lastToken.type === "paragraph") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.pop();
          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
        } else {
          tokens.push(token);
        }
        lastParagraphClipped = cutSrc.length !== src.length;
        src = src.substring(token.raw.length);
        continue;
      }
      if (token = this.tokenizer.text(src)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && lastToken.type === "text") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.pop();
          this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (src) {
        const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }
    this.state.top = true;
    return tokens;
  }
  inline(src, tokens = []) {
    this.inlineQueue.push({ src, tokens });
    return tokens;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(src, tokens = []) {
    let token, lastToken, cutSrc;
    let maskedSrc = src;
    let match;
    let keepPrevChar, prevChar;
    if (this.tokens.links) {
      const links = Object.keys(this.tokens.links);
      if (links.length > 0) {
        while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
          if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
            maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
          }
        }
      }
    }
    while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
      maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    }
    while ((match = this.tokenizer.rules.inline.anyPunctuation.exec(maskedSrc)) != null) {
      maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    }
    while (src) {
      if (!keepPrevChar) {
        prevChar = "";
      }
      keepPrevChar = false;
      if (this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((extTokenizer) => {
        if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return true;
        }
        return false;
      })) {
        continue;
      }
      if (token = this.tokenizer.escape(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.tag(src)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && token.type === "text" && lastToken.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.link(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.reflink(src, this.tokens.links)) {
        src = src.substring(token.raw.length);
        lastToken = tokens[tokens.length - 1];
        if (lastToken && token.type === "text" && lastToken.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.codespan(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.br(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.del(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.autolink(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (!this.state.inLink && (token = this.tokenizer.url(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      cutSrc = src;
      if (this.options.extensions && this.options.extensions.startInline) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startInline.forEach((getStartIndex) => {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === "number" && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if (token = this.tokenizer.inlineText(cutSrc)) {
        src = src.substring(token.raw.length);
        if (token.raw.slice(-1) !== "_") {
          prevChar = token.raw.slice(-1);
        }
        keepPrevChar = true;
        lastToken = tokens[tokens.length - 1];
        if (lastToken && lastToken.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (src) {
        const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }
    return tokens;
  }
};
__name(_Lexer, "_Lexer");
var _Renderer = class {
  options;
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  code(code, infostring, escaped) {
    const lang = (infostring || "").match(/^\S*/)?.[0];
    code = code.replace(/\n$/, "") + "\n";
    if (!lang) {
      return "<pre><code>" + (escaped ? code : escape$1(code, true)) + "</code></pre>\n";
    }
    return '<pre><code class="language-' + escape$1(lang) + '">' + (escaped ? code : escape$1(code, true)) + "</code></pre>\n";
  }
  blockquote(quote) {
    return `<blockquote>
${quote}</blockquote>
`;
  }
  html(html3, block2) {
    return html3;
  }
  heading(text, level, raw) {
    return `<h${level}>${text}</h${level}>
`;
  }
  hr() {
    return "<hr>\n";
  }
  list(body, ordered, start) {
    const type = ordered ? "ol" : "ul";
    const startatt = ordered && start !== 1 ? ' start="' + start + '"' : "";
    return "<" + type + startatt + ">\n" + body + "</" + type + ">\n";
  }
  listitem(text, task, checked) {
    return `<li>${text}</li>
`;
  }
  checkbox(checked) {
    return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph(text) {
    return `<p>${text}</p>
`;
  }
  table(header, body) {
    if (body)
      body = `<tbody>${body}</tbody>`;
    return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
  }
  tablerow(content) {
    return `<tr>
${content}</tr>
`;
  }
  tablecell(content, flags) {
    const type = flags.header ? "th" : "td";
    const tag2 = flags.align ? `<${type} align="${flags.align}">` : `<${type}>`;
    return tag2 + content + `</${type}>
`;
  }
  /**
   * span level renderer
   */
  strong(text) {
    return `<strong>${text}</strong>`;
  }
  em(text) {
    return `<em>${text}</em>`;
  }
  codespan(text) {
    return `<code>${text}</code>`;
  }
  br() {
    return "<br>";
  }
  del(text) {
    return `<del>${text}</del>`;
  }
  link(href, title, text) {
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return text;
    }
    href = cleanHref;
    let out = '<a href="' + href + '"';
    if (title) {
      out += ' title="' + title + '"';
    }
    out += ">" + text + "</a>";
    return out;
  }
  image(href, title, text) {
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return text;
    }
    href = cleanHref;
    let out = `<img src="${href}" alt="${text}"`;
    if (title) {
      out += ` title="${title}"`;
    }
    out += ">";
    return out;
  }
  text(text) {
    return text;
  }
};
__name(_Renderer, "_Renderer");
var _TextRenderer = class {
  // no need for block level renderers
  strong(text) {
    return text;
  }
  em(text) {
    return text;
  }
  codespan(text) {
    return text;
  }
  del(text) {
    return text;
  }
  html(text) {
    return text;
  }
  text(text) {
    return text;
  }
  link(href, title, text) {
    return "" + text;
  }
  image(href, title, text) {
    return "" + text;
  }
  br() {
    return "";
  }
};
__name(_TextRenderer, "_TextRenderer");
var _Parser = class {
  options;
  renderer;
  textRenderer;
  constructor(options2) {
    this.options = options2 || _defaults;
    this.options.renderer = this.options.renderer || new _Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.textRenderer = new _TextRenderer();
  }
  /**
   * Static Parse Method
   */
  static parse(tokens, options2) {
    const parser2 = new _Parser(options2);
    return parser2.parse(tokens);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(tokens, options2) {
    const parser2 = new _Parser(options2);
    return parser2.parseInline(tokens);
  }
  /**
   * Parse Loop
   */
  parse(tokens, top = true) {
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
        const genericToken = token;
        const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
        if (ret !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(genericToken.type)) {
          out += ret || "";
          continue;
        }
      }
      switch (token.type) {
        case "space": {
          continue;
        }
        case "hr": {
          out += this.renderer.hr();
          continue;
        }
        case "heading": {
          const headingToken = token;
          out += this.renderer.heading(this.parseInline(headingToken.tokens), headingToken.depth, unescape(this.parseInline(headingToken.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const codeToken = token;
          out += this.renderer.code(codeToken.text, codeToken.lang, !!codeToken.escaped);
          continue;
        }
        case "table": {
          const tableToken = token;
          let header = "";
          let cell = "";
          for (let j = 0; j < tableToken.header.length; j++) {
            cell += this.renderer.tablecell(this.parseInline(tableToken.header[j].tokens), { header: true, align: tableToken.align[j] });
          }
          header += this.renderer.tablerow(cell);
          let body = "";
          for (let j = 0; j < tableToken.rows.length; j++) {
            const row = tableToken.rows[j];
            cell = "";
            for (let k = 0; k < row.length; k++) {
              cell += this.renderer.tablecell(this.parseInline(row[k].tokens), { header: false, align: tableToken.align[k] });
            }
            body += this.renderer.tablerow(cell);
          }
          out += this.renderer.table(header, body);
          continue;
        }
        case "blockquote": {
          const blockquoteToken = token;
          const body = this.parse(blockquoteToken.tokens);
          out += this.renderer.blockquote(body);
          continue;
        }
        case "list": {
          const listToken = token;
          const ordered = listToken.ordered;
          const start = listToken.start;
          const loose = listToken.loose;
          let body = "";
          for (let j = 0; j < listToken.items.length; j++) {
            const item = listToken.items[j];
            const checked = item.checked;
            const task = item.task;
            let itemBody = "";
            if (item.task) {
              const checkbox = this.renderer.checkbox(!!checked);
              if (loose) {
                if (item.tokens.length > 0 && item.tokens[0].type === "paragraph") {
                  item.tokens[0].text = checkbox + " " + item.tokens[0].text;
                  if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
                    item.tokens[0].tokens[0].text = checkbox + " " + item.tokens[0].tokens[0].text;
                  }
                } else {
                  item.tokens.unshift({
                    type: "text",
                    text: checkbox + " "
                  });
                }
              } else {
                itemBody += checkbox + " ";
              }
            }
            itemBody += this.parse(item.tokens, loose);
            body += this.renderer.listitem(itemBody, task, !!checked);
          }
          out += this.renderer.list(body, ordered, start);
          continue;
        }
        case "html": {
          const htmlToken = token;
          out += this.renderer.html(htmlToken.text, htmlToken.block);
          continue;
        }
        case "paragraph": {
          const paragraphToken = token;
          out += this.renderer.paragraph(this.parseInline(paragraphToken.tokens));
          continue;
        }
        case "text": {
          let textToken = token;
          let body = textToken.tokens ? this.parseInline(textToken.tokens) : textToken.text;
          while (i + 1 < tokens.length && tokens[i + 1].type === "text") {
            textToken = tokens[++i];
            body += "\n" + (textToken.tokens ? this.parseInline(textToken.tokens) : textToken.text);
          }
          out += top ? this.renderer.paragraph(body) : body;
          continue;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return "";
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(tokens, renderer) {
    renderer = renderer || this.renderer;
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
        const ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
        if (ret !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(token.type)) {
          out += ret || "";
          continue;
        }
      }
      switch (token.type) {
        case "escape": {
          const escapeToken = token;
          out += renderer.text(escapeToken.text);
          break;
        }
        case "html": {
          const tagToken = token;
          out += renderer.html(tagToken.text);
          break;
        }
        case "link": {
          const linkToken = token;
          out += renderer.link(linkToken.href, linkToken.title, this.parseInline(linkToken.tokens, renderer));
          break;
        }
        case "image": {
          const imageToken = token;
          out += renderer.image(imageToken.href, imageToken.title, imageToken.text);
          break;
        }
        case "strong": {
          const strongToken = token;
          out += renderer.strong(this.parseInline(strongToken.tokens, renderer));
          break;
        }
        case "em": {
          const emToken = token;
          out += renderer.em(this.parseInline(emToken.tokens, renderer));
          break;
        }
        case "codespan": {
          const codespanToken = token;
          out += renderer.codespan(codespanToken.text);
          break;
        }
        case "br": {
          out += renderer.br();
          break;
        }
        case "del": {
          const delToken = token;
          out += renderer.del(this.parseInline(delToken.tokens, renderer));
          break;
        }
        case "text": {
          const textToken = token;
          out += renderer.text(textToken.text);
          break;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return "";
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
};
__name(_Parser, "_Parser");
var _Hooks = class {
  options;
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  /**
   * Process markdown before marked
   */
  preprocess(markdown) {
    return markdown;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(html3) {
    return html3;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(tokens) {
    return tokens;
  }
};
__name(_Hooks, "_Hooks");
__publicField(_Hooks, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Marked = class {
  defaults = _getDefaults();
  options = this.setOptions;
  parse = this.#parseMarkdown(_Lexer.lex, _Parser.parse);
  parseInline = this.#parseMarkdown(_Lexer.lexInline, _Parser.parseInline);
  Parser = _Parser;
  Renderer = _Renderer;
  TextRenderer = _TextRenderer;
  Lexer = _Lexer;
  Tokenizer = _Tokenizer;
  Hooks = _Hooks;
  constructor(...args) {
    this.use(...args);
  }
  /**
   * Run callback for every token
   */
  walkTokens(tokens, callback) {
    let values = [];
    for (const token of tokens) {
      values = values.concat(callback.call(this, token));
      switch (token.type) {
        case "table": {
          const tableToken = token;
          for (const cell of tableToken.header) {
            values = values.concat(this.walkTokens(cell.tokens, callback));
          }
          for (const row of tableToken.rows) {
            for (const cell of row) {
              values = values.concat(this.walkTokens(cell.tokens, callback));
            }
          }
          break;
        }
        case "list": {
          const listToken = token;
          values = values.concat(this.walkTokens(listToken.items, callback));
          break;
        }
        default: {
          const genericToken = token;
          if (this.defaults.extensions?.childTokens?.[genericToken.type]) {
            this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
              const tokens2 = genericToken[childTokens].flat(Infinity);
              values = values.concat(this.walkTokens(tokens2, callback));
            });
          } else if (genericToken.tokens) {
            values = values.concat(this.walkTokens(genericToken.tokens, callback));
          }
        }
      }
    }
    return values;
  }
  use(...args) {
    const extensions = this.defaults.extensions || { renderers: {}, childTokens: {} };
    args.forEach((pack) => {
      const opts = { ...pack };
      opts.async = this.defaults.async || opts.async || false;
      if (pack.extensions) {
        pack.extensions.forEach((ext) => {
          if (!ext.name) {
            throw new Error("extension name required");
          }
          if ("renderer" in ext) {
            const prevRenderer = extensions.renderers[ext.name];
            if (prevRenderer) {
              extensions.renderers[ext.name] = function(...args2) {
                let ret = ext.renderer.apply(this, args2);
                if (ret === false) {
                  ret = prevRenderer.apply(this, args2);
                }
                return ret;
              };
            } else {
              extensions.renderers[ext.name] = ext.renderer;
            }
          }
          if ("tokenizer" in ext) {
            if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
              throw new Error("extension level must be 'block' or 'inline'");
            }
            const extLevel = extensions[ext.level];
            if (extLevel) {
              extLevel.unshift(ext.tokenizer);
            } else {
              extensions[ext.level] = [ext.tokenizer];
            }
            if (ext.start) {
              if (ext.level === "block") {
                if (extensions.startBlock) {
                  extensions.startBlock.push(ext.start);
                } else {
                  extensions.startBlock = [ext.start];
                }
              } else if (ext.level === "inline") {
                if (extensions.startInline) {
                  extensions.startInline.push(ext.start);
                } else {
                  extensions.startInline = [ext.start];
                }
              }
            }
          }
          if ("childTokens" in ext && ext.childTokens) {
            extensions.childTokens[ext.name] = ext.childTokens;
          }
        });
        opts.extensions = extensions;
      }
      if (pack.renderer) {
        const renderer = this.defaults.renderer || new _Renderer(this.defaults);
        for (const prop in pack.renderer) {
          if (!(prop in renderer)) {
            throw new Error(`renderer '${prop}' does not exist`);
          }
          if (prop === "options") {
            continue;
          }
          const rendererProp = prop;
          const rendererFunc = pack.renderer[rendererProp];
          const prevRenderer = renderer[rendererProp];
          renderer[rendererProp] = (...args2) => {
            let ret = rendererFunc.apply(renderer, args2);
            if (ret === false) {
              ret = prevRenderer.apply(renderer, args2);
            }
            return ret || "";
          };
        }
        opts.renderer = renderer;
      }
      if (pack.tokenizer) {
        const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
        for (const prop in pack.tokenizer) {
          if (!(prop in tokenizer)) {
            throw new Error(`tokenizer '${prop}' does not exist`);
          }
          if (["options", "rules", "lexer"].includes(prop)) {
            continue;
          }
          const tokenizerProp = prop;
          const tokenizerFunc = pack.tokenizer[tokenizerProp];
          const prevTokenizer = tokenizer[tokenizerProp];
          tokenizer[tokenizerProp] = (...args2) => {
            let ret = tokenizerFunc.apply(tokenizer, args2);
            if (ret === false) {
              ret = prevTokenizer.apply(tokenizer, args2);
            }
            return ret;
          };
        }
        opts.tokenizer = tokenizer;
      }
      if (pack.hooks) {
        const hooks = this.defaults.hooks || new _Hooks();
        for (const prop in pack.hooks) {
          if (!(prop in hooks)) {
            throw new Error(`hook '${prop}' does not exist`);
          }
          if (prop === "options") {
            continue;
          }
          const hooksProp = prop;
          const hooksFunc = pack.hooks[hooksProp];
          const prevHook = hooks[hooksProp];
          if (_Hooks.passThroughHooks.has(prop)) {
            hooks[hooksProp] = (arg) => {
              if (this.defaults.async) {
                return Promise.resolve(hooksFunc.call(hooks, arg)).then((ret2) => {
                  return prevHook.call(hooks, ret2);
                });
              }
              const ret = hooksFunc.call(hooks, arg);
              return prevHook.call(hooks, ret);
            };
          } else {
            hooks[hooksProp] = (...args2) => {
              let ret = hooksFunc.apply(hooks, args2);
              if (ret === false) {
                ret = prevHook.apply(hooks, args2);
              }
              return ret;
            };
          }
        }
        opts.hooks = hooks;
      }
      if (pack.walkTokens) {
        const walkTokens2 = this.defaults.walkTokens;
        const packWalktokens = pack.walkTokens;
        opts.walkTokens = function(token) {
          let values = [];
          values.push(packWalktokens.call(this, token));
          if (walkTokens2) {
            values = values.concat(walkTokens2.call(this, token));
          }
          return values;
        };
      }
      this.defaults = { ...this.defaults, ...opts };
    });
    return this;
  }
  setOptions(opt) {
    this.defaults = { ...this.defaults, ...opt };
    return this;
  }
  lexer(src, options2) {
    return _Lexer.lex(src, options2 ?? this.defaults);
  }
  parser(tokens, options2) {
    return _Parser.parse(tokens, options2 ?? this.defaults);
  }
  #parseMarkdown(lexer2, parser2) {
    return (src, options2) => {
      const origOpt = { ...options2 };
      const opt = { ...this.defaults, ...origOpt };
      if (this.defaults.async === true && origOpt.async === false) {
        if (!opt.silent) {
          console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored.");
        }
        opt.async = true;
      }
      const throwError = this.#onError(!!opt.silent, !!opt.async);
      if (typeof src === "undefined" || src === null) {
        return throwError(new Error("marked(): input parameter is undefined or null"));
      }
      if (typeof src !== "string") {
        return throwError(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected"));
      }
      if (opt.hooks) {
        opt.hooks.options = opt;
      }
      if (opt.async) {
        return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src).then((src2) => lexer2(src2, opt)).then((tokens) => opt.hooks ? opt.hooks.processAllTokens(tokens) : tokens).then((tokens) => opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens).then((tokens) => parser2(tokens, opt)).then((html3) => opt.hooks ? opt.hooks.postprocess(html3) : html3).catch(throwError);
      }
      try {
        if (opt.hooks) {
          src = opt.hooks.preprocess(src);
        }
        let tokens = lexer2(src, opt);
        if (opt.hooks) {
          tokens = opt.hooks.processAllTokens(tokens);
        }
        if (opt.walkTokens) {
          this.walkTokens(tokens, opt.walkTokens);
        }
        let html3 = parser2(tokens, opt);
        if (opt.hooks) {
          html3 = opt.hooks.postprocess(html3);
        }
        return html3;
      } catch (e) {
        return throwError(e);
      }
    };
  }
  #onError(silent, async) {
    return (e) => {
      e.message += "\nPlease report this to https://github.com/markedjs/marked.";
      if (silent) {
        const msg = "<p>An error occurred:</p><pre>" + escape$1(e.message + "", true) + "</pre>";
        if (async) {
          return Promise.resolve(msg);
        }
        return msg;
      }
      if (async) {
        return Promise.reject(e);
      }
      throw e;
    };
  }
};
__name(Marked, "Marked");
var markedInstance = new Marked();
function marked(src, opt) {
  return markedInstance.parse(src, opt);
}
__name(marked, "marked");
marked.options = marked.setOptions = function(options2) {
  markedInstance.setOptions(options2);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
};
marked.getDefaults = _getDefaults;
marked.defaults = _defaults;
marked.use = function(...args) {
  markedInstance.use(...args);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
};
marked.walkTokens = function(tokens, callback) {
  return markedInstance.walkTokens(tokens, callback);
};
marked.parseInline = markedInstance.parseInline;
marked.Parser = _Parser;
marked.parser = _Parser.parse;
marked.Renderer = _Renderer;
marked.TextRenderer = _TextRenderer;
marked.Lexer = _Lexer;
marked.lexer = _Lexer.lex;
marked.Tokenizer = _Tokenizer;
marked.Hooks = _Hooks;
marked.parse = marked;
var options = marked.options;
var setOptions = marked.setOptions;
var use = marked.use;
var walkTokens = marked.walkTokens;
var parseInline = marked.parseInline;
var parser = _Parser.parse;
var lexer = _Lexer.lex;

// src/render.ts
var css = `
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f6f8;
  --bg-callout: #f5f6f8;
  --bg-chip: rgba(127, 109, 242, 0.12);
  --text-normal: #1f2328;
  --text-muted: #57606a;
  --text-faint: #8b949e;
  --text-accent: #7f6df2;
  --text-link: #7f6df2;
  --border: #d0d7de;
  --border-faint: #eaeef2;
  --code-bg: #f6f8fa;
  --kbd-bg: #f6f8fa;
  color-scheme: light dark;
}
/* Dark theme \u2014 applied when the OS prefers dark AND the user hasn't picked
   "light" explicitly, OR when they've picked "dark" via the theme toggle. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #1e1e1e;
    --bg-secondary: #262626;
    --bg-callout: #2a2a2a;
    --bg-chip: rgba(168, 130, 255, 0.16);
    --text-normal: #dcddde;
    --text-muted: #959595;
    --text-faint: #6a6a6a;
    --text-accent: #a882ff;
    --text-link: #a882ff;
    --border: #363636;
    --border-faint: #2c2c2c;
    --code-bg: #2c2c2c;
    --kbd-bg: #333;
  }
}
:root[data-theme="dark"] {
  --bg-primary: #1e1e1e;
  --bg-secondary: #262626;
  --bg-callout: #2a2a2a;
  --bg-chip: rgba(168, 130, 255, 0.16);
  --text-normal: #dcddde;
  --text-muted: #959595;
  --text-faint: #6a6a6a;
  --text-accent: #a882ff;
  --text-link: #a882ff;
  --border: #363636;
  --border-faint: #2c2c2c;
  --code-bg: #2c2c2c;
  --kbd-bg: #333;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg-primary);
  color: var(--text-normal);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.6;
}
/* Skip-to-main-content link \u2014 off-screen until focused */
.skip-link {
  position: absolute;
  top: -100%;
  left: 1em;
  padding: .5em 1em;
  background: var(--text-accent);
  color: #fff;
  font-size: .9em;
  font-weight: 600;
  border-radius: 0 0 6px 6px;
  text-decoration: none;
  z-index: 9999;
  transition: top .1s;
}
.skip-link:focus { top: 0; }
.container { max-width: 760px; margin: 0 auto; padding: 2.5em 1.25em 6em; }
.wide      { max-width: 1100px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  .skip-link { transition: none; }
}

/* breadcrumb */
.breadcrumb {
  font-size: .82em;
  letter-spacing: .04em;
  color: var(--text-faint);
  margin-bottom: .25em;
  display: flex;
  gap: .5em;
  align-items: center;
  flex-wrap: wrap;
}
.breadcrumb a { color: var(--text-muted); text-decoration: none; }
.breadcrumb a:hover { color: var(--text-accent); }
.breadcrumb .sep { opacity: .5; }
.breadcrumb .scope-badge {
  margin-left: auto;
  font-size: .75em;
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--text-faint);
  border: 1px solid var(--border-faint);
}

/* properties panel \u2014 mimics Obsidian's collapsed property table */
.properties {
  background: var(--bg-secondary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  padding: .6em .9em;
  margin: 1.2em 0 1.6em;
  font-size: .92em;
}
.prop-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: .8em;
  padding: 3px 0;
  align-items: center;
  min-height: 26px;
}
.prop-key {
  font-size: .82em;
  letter-spacing: .04em;
  color: var(--text-faint);
  display: flex;
  gap: .45em;
  align-items: center;
  line-height: 1.3;
}
.prop-key svg.prop-icon {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  opacity: .65;
}
.prop-val {
  font-size: .88em;
  color: var(--text-muted);
  word-break: break-word;
  line-height: 1.4;
}
.prop-val code {
  font-size: .8em;
  padding: 1px 5px;
  background: var(--code-bg);
  border-radius: 3px;
}
.prop-val a { color: var(--text-link); text-decoration: none; }
.prop-val a:hover { text-decoration: underline; }
/* The chips inside prop-val (rendered by renderFmValue for array values like
   tags:[foo,bar]) inherited a too-large pill style. Tighten them to match
   the Notion-density we want here. */
.prop-val .chip {
  font-size: .78em;
  padding: 0 8px;
  line-height: 1.7;
  margin: 0 4px 2px 0;
}

/* \u2500\u2500\u2500 Note meta chips (inline, above the article) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   Replaces the old behaviour of dumping the entire properties table at
   the top of every note. These show only tags + status \u2014 the highest-
   signal fields \u2014 so the article shows above the fold. */
.note-meta-chips {
  display: flex; flex-wrap: wrap; gap: .35em;
  margin: -.4em 0 1.4em;
}
.meta-chip {
  display: inline-flex; align-items: center;
  font-size: .8em;
  padding: .15em .7em;
  border-radius: 999px;
  line-height: 1.5;
}
.meta-chip-tag {
  background: var(--bg-chip);
  color: var(--text-accent);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  letter-spacing: .01em;
}
.meta-chip-status {
  background: var(--bg-secondary);
  color: var(--text-muted);
  border: 1px solid var(--border-faint);
  text-transform: uppercase;
  letter-spacing: .04em;
  font-size: .72em;
  font-weight: 600;
}

/* \u2500\u2500\u2500 Page chrome \u2014 floating pill (top-right) with help + theme buttons \u2500\u2500\u2500\u2500
   Groups the ? (keyboard shortcuts) and theme-toggle into a single capsule
   so they read as intentional UI, not stray controls. */
.page-chrome {
  position: fixed;
  top: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-faint);
  border-radius: 999px;
  z-index: 1000;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.chrome-source {
  display: inline-flex; align-items: center; justify-content: center;
  height: 36px; padding: 0 12px;
  color: var(--text-muted); font-size: 12px; text-decoration: none;
  white-space: nowrap;
}
.chrome-source:hover { color: var(--text-accent); }
.chrome-source:focus-visible { outline: 2px solid var(--text-accent); outline-offset: -2px; border-radius: 999px; }
.chrome-btn {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent;
  color: var(--text-muted);
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  padding: 0;
  transition: color .15s, transform .15s;
}
.chrome-btn:hover { color: var(--text-accent); }
.chrome-btn:focus-visible { outline: 2px solid var(--text-accent); outline-offset: 2px; }
.chrome-btn .theme-icon, .chrome-btn .chrome-icon { width: 18px; height: 18px; }
.chrome-divider {
  width: 1px; height: 16px;
  background: var(--border-faint);
  flex-shrink: 0;
}
.theme-toggle[data-flash="1"] { transform: scale(1.08) rotate(15deg); }
@media (max-width: 760px) {
  .page-chrome { top: auto; bottom: 18px; right: 18px; }
  .chrome-btn { width: 44px; height: 44px; }
  .chrome-btn .theme-icon, .chrome-btn .chrome-icon { width: 20px; height: 20px; }
  .chrome-divider { height: 22px; }
}

/* \u2500\u2500\u2500 Properties panel \u2014 Notion-style: dense, open by default \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   Lives near the top of every note (after H1, before article body). Open by
   default so it mimics Notion's properties-at-top default. Reader can
   collapse it with one click if they want a totally clean view. */
details.properties {
  margin: 0 0 1.4em;
  background: transparent;
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  padding: 0;
  overflow: hidden;
}
.properties-summary {
  display: flex; align-items: center; gap: .45em;
  padding: .4em .8em;
  cursor: pointer;
  font-size: .72em;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-faint);
  user-select: none;
  list-style: none;
  font-weight: 600;
}
.properties-summary::-webkit-details-marker { display: none; }
.properties-summary::marker { content: ""; }
.properties-summary::before {
  content: "\u25B8";
  display: inline-block;
  color: var(--text-faint);
  font-size: .85em;
  transition: transform .15s ease;
  width: 9px;
}
details.properties[open] .properties-summary::before { transform: rotate(90deg); }
details.properties[open] .properties-summary {
  border-bottom: 1px solid var(--border-faint);
}
.properties-summary:hover { color: var(--text-muted); }
.properties-summary-icon { display: none; }  /* the chevron + label are enough */
.properties-summary-label { font-weight: 600; }
.properties-summary-count {
  font-size: .92em;
  color: var(--text-faint);
  background: transparent;
  padding: 0;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  text-transform: none;
}
.properties-summary-count::before { content: "\xB7 "; opacity: .6; }
.properties-body {
  padding: .35em .8em .55em;
}
@media (max-width: 760px) {
  .properties-summary { padding: .7em .9em; min-height: 38px; font-size: .78em; }
  .prop-row { grid-template-columns: 100px 1fr; gap: .55em; }
  .prop-key { font-size: 12px; }
  .prop-val { font-size: 13px; }
}
.chip {
  display: inline-block;
  background: var(--bg-chip);
  color: var(--text-accent);
  padding: 0 7px;
  border-radius: 999px;
  font-size: .82em;
  letter-spacing: .04em;
  margin-right: 4px;
  margin-bottom: 2px;
}

/* headings, body */
h1, h2, h3 { color: var(--text-normal); margin-top: 1.6em; margin-bottom: .5em; line-height: 1.25; }
h1 { font-size: 1.95em; border-bottom: 1px solid var(--border-faint); padding-bottom: .25em; margin-top: 0; }
h2 { font-size: 1.45em; }
h3 { font-size: 1.15em; }
p, ul, ol, blockquote { margin: .8em 0; }
ul, ol { padding-left: 1.4em; }
li { margin: .25em 0; }
a { color: var(--text-link); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .15s; }
a:hover { border-bottom-color: currentColor; }
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
hr { border: none; border-top: 1px solid var(--border-faint); margin: 2em 0; }

/* Reading metadata \u2014 small label under note title */
.note-reading-meta {
  display: flex;
  align-items: center;
  gap: .55em;
  font-size: .8em;
  color: var(--text-faint);
  margin: -.35em 0 1.4em;
  font-variant-numeric: tabular-nums;
}
.note-reading-meta .rmeta-sep { opacity: .5; }

/* code */
code {
  background: var(--code-bg);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: .9em;
  font-family: "SF Mono", Menlo, Consolas, monospace;
  /* Inline code with long unbroken tokens (ULIDs, file paths, URLs) would
     otherwise blow the article wider than the viewport on mobile and force
     a body-level horizontal scrollbar. Break-word lets it wrap. */
  word-break: break-word;
  overflow-wrap: anywhere;
}
pre {
  background: var(--code-bg);
  padding: 1em 1.2em;
  border-radius: 4px;
  overflow-x: auto;
  max-width: 100%;
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: .9em;
  line-height: 1.6;
}
pre code { background: none; padding: 0; word-break: normal; overflow-wrap: normal; }

/* tables \u2014 scrollable container prevents page-level overflow; min-width on
   cells prevents the browser from crushing columns below readable size. */
.prose table {
  display: block;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}
table { border-collapse: collapse; width: max-content; min-width: 100%; margin: 1em 0; font-size: .94em; }
th, td {
  border: 1px solid var(--border-faint);
  padding: .45em .7em;
  text-align: left;
  min-width: 90px;
  white-space: normal;
  word-break: normal;
  overflow-wrap: break-word;
}
th { background: var(--bg-secondary); white-space: nowrap; font-weight: 600; }

/* plain blockquotes (non-callout) */
blockquote {
  border-left: 3px solid var(--border);
  padding: 0 1em;
  color: var(--text-muted);
  margin-left: 0;
}

/* WIKILINKS */
.wikilink-internal {
  color: var(--text-accent);
  border-bottom: 1px solid var(--text-accent);
  text-decoration: none;
  cursor: pointer;
}
.wikilink-internal:hover { background: var(--bg-chip); }
.wikilink-canvas { font-size: .95em; }
.empty-note-placeholder {
  padding: 2em 1.5em;
  margin: 1em 0;
  background: var(--bg-secondary);
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  text-align: center;
}
.empty-note-placeholder p { margin: 0.4em 0; }
.empty-note-placeholder em { font-size: 1.1em; }
.embedded-image {
  display: block; max-width: 100%; height: auto;
  border-radius: 6px; margin: 1em auto;
  background: var(--bg-secondary);
}
.embed-missing {
  display: inline-block;
  padding: .15em .5em; border-radius: 4px;
  background: var(--bg-secondary); color: var(--text-faint);
  font-size: .85em; font-style: italic;
}
/* Mermaid always renders with the "default" (light) theme so the SVG colours
   never go stale when the user toggles their OS color scheme after page load.
   The container is locked to white in both light and dark mode \u2014 diagrams are
   always readable regardless of the surrounding page chrome. */
.mermaid-host {
  position: relative;
  margin: 1.2em 0;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid var(--border-faint);
  overflow: hidden;
  color-scheme: light;
}
.mermaid-host .mermaid {
  display: block;
  padding: 1em;
  overflow: auto;
  max-height: 70vh;
  cursor: zoom-in;
  background: #ffffff;
  color: #1f2328;
}
.mermaid-host .mermaid svg {
  max-width: none !important;
  height: auto !important;
}
.mermaid-host .mermaid-actions {
  position: absolute;
  top: 8px; right: 8px;
  display: flex; gap: 4px;
  opacity: 0;
  transition: opacity .15s;
  z-index: 2;
}
.mermaid-host:hover .mermaid-actions { opacity: 1; }
.mermaid-host .mermaid-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  background: var(--bg-secondary); color: var(--text-normal);
  border: 1px solid var(--border-faint); border-radius: 6px;
  cursor: pointer; font-size: 14px; line-height: 1;
  box-shadow: 0 1px 4px rgba(0,0,0,.08);
}
.mermaid-host .mermaid-btn:hover { border-color: var(--text-accent); color: var(--text-accent); }
@media (pointer: coarse) {
  .mermaid-host .mermaid-actions { opacity: 1; }
  .mermaid-host .mermaid-btn { width: 36px; height: 36px; font-size: 16px; }
}
/* Modal background matches the page so the rendered SVG (drawn in the page's
   color theme) sits on the same surface it was designed for \u2014 otherwise a dark
   backdrop swallows light-theme diagrams and a light backdrop washes out dark
   ones. */
.mermaid-modal {
  position: fixed; inset: 0;
  background: var(--bg-primary);
  color: var(--text-normal);
  display: none; z-index: 9999;
}
.mermaid-modal.open { display: flex; flex-direction: column; }
.mermaid-modal-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-secondary);
  color: var(--text-normal);
  font-size: 13px; gap: 12px;
  border-bottom: 1px solid var(--border-faint);
}
.mermaid-modal-bar .mermaid-modal-title {
  font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 1; min-width: 0;
}
.mermaid-modal-bar .mermaid-controls { display: flex; gap: 6px; flex-shrink: 0; }
.mermaid-modal-bar button {
  background: var(--bg-primary);
  color: var(--text-normal);
  border: 1px solid var(--border-faint); border-radius: 6px;
  padding: 4px 10px; font-size: 13px; cursor: pointer; min-width: 32px;
}
.mermaid-modal-bar button:hover { border-color: var(--text-accent); color: var(--text-accent); }
/* The stage holds the (light-themed) SVG, so it's locked to white in both
   light and dark mode. The chrome around it (modal bg, toolbar) stays themed. */
.mermaid-modal-stage {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: grab;
  background: #ffffff;
  color-scheme: light;
}
.mermaid-modal-stage.dragging { cursor: grabbing; }
.mermaid-modal-stage svg {
  position: absolute; top: 0; left: 0;
  transform-origin: 0 0;
  user-select: none;
  max-width: none !important; max-height: none !important;
}
.mermaid-modal-hint {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  background: rgba(0, 0, 0, .72);
  color: #ffffff;
  font-size: 12px; padding: 6px 12px; border-radius: 999px;
  pointer-events: none;
}
.canvas-title { margin-top: .25em; }
.canvas-help {
  font-size: .85em; color: var(--text-faint);
  margin: .25em 0 .8em;
}
.canvas-host {
  position: relative;
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  background: var(--bg-secondary);
  overflow: hidden;
  height: 78vh; min-height: 560px;
  margin: 0 0 2em;
}
.canvas-host:fullscreen { height: 100vh; border-radius: 0; border: 0; margin: 0; }
.canvas-host:fullscreen #canvas-svg { background-size: 30px 30px; }
/* Obsidian-style floating control rail along the right edge */
.canvas-rail {
  position: absolute;
  top: 12px; right: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  z-index: 5;
}
.canvas-rail button {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent;
  border: 0;
  border-radius: 5px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  padding: 0;
  font-family: inherit;
}
.canvas-rail button:hover {
  background: var(--bg-chip);
  color: var(--text-accent);
}
.canvas-rail button:active { transform: scale(0.95); }
.canvas-rail .rail-divider {
  height: 1px;
  background: var(--border-faint);
  margin: 2px 4px;
}
@media (pointer: coarse) {
  /* Bump touch targets to \u226540px and add space so fingers don't hit two
     buttons at once. Triggered for any device whose primary pointer is
     touch (phones, tablets), not by viewport width. */
  .canvas-rail { gap: 8px; padding: 8px; }
  .canvas-rail button { width: 40px; height: 40px; font-size: 17px; }
  .canvas-rail .rail-divider { margin: 4px 6px; }
}
.canvas-rail .rail-help {
  position: relative;
}
.canvas-rail-tip {
  position: absolute;
  top: 0; right: 100%;
  margin-right: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  display: none;
}
.canvas-rail-tip.visible { display: block; }
.canvas-rail-tip kbd {
  background: var(--kbd-bg);
  border: 1px solid var(--border-faint);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-normal);
}
.canvas-backlinks {
  position: absolute;
  bottom: 10px; right: 12px;
  font-size: 11px;
  color: var(--text-faint);
  background: var(--bg-primary);
  padding: 3px 9px;
  border-radius: 12px;
  border: 1px solid var(--border-faint);
  z-index: 4;
}
/* Stage = the inner pannable/zoomable layer. We use HTML positioning + a
   single CSS transform here instead of SVG foreignObject because Safari
   refuses to apply SVG viewBox transforms to foreignObject children, which
   meant cards rendered at native size and overflowed the host. Pure HTML
   sidesteps the bug entirely and is also what Obsidian does internally. */
.canvas-stage {
  position: absolute;
  top: 0; left: 0;
  width: 0; height: 0;             /* size doesn't matter \u2014 we use overflow:visible */
  transform-origin: 0 0;
  cursor: grab;
}
.canvas-stage.grabbing { cursor: grabbing; }
#canvas-host {
  background:
    radial-gradient(circle at 1px 1px, var(--border-faint) 1px, transparent 1px) 0 0 / 24px 24px;
}
.canvas-edges-layer {
  position: absolute;
  top: 0; left: 0;
  width: 1px; height: 1px;
  overflow: visible;
  pointer-events: none;
}
.canvas-card {
  position: absolute;
  background: var(--bg-primary);
  border: 2px solid;
  border-radius: 8px;
  color: var(--text-normal);
  overflow: hidden;
  font-size: 14px;
  line-height: 1.45;
  box-sizing: border-box;
  padding: 10px 14px;
}
.canvas-card.canvas-text { overflow: auto; }
.canvas-card > :first-child { margin-top: 0; }
.canvas-card > :last-child { margin-bottom: 0; }
.canvas-card h1, .canvas-card h2 { margin-top: .3em; margin-bottom: .25em; font-size: 1.1em; }
.canvas-card.canvas-file {
  display: flex; flex-direction: column; justify-content: center;
  text-decoration: none !important;
}
.canvas-card.canvas-file:hover { background: var(--bg-chip); }
.canvas-card.canvas-link {
  display: flex; align-items: center; gap: .4em;
  font-size: .85em;
  color: var(--text-link);
  text-decoration: none !important;
  word-break: break-all;
}
.canvas-group {
  position: absolute;
  border: 2px dashed;
  border-radius: 12px;
  box-sizing: border-box;
  background: rgba(168, 130, 255, 0.04);
  pointer-events: none;
}
.canvas-group-label {
  position: absolute;
  top: 6px; left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: inherit;
}
/* Legacy classes kept for any non-canvas users */
.canvas-text, .canvas-file, .canvas-link {
  background: var(--bg-primary);
  border: 2px solid;
  border-radius: 8px;
  color: var(--text-normal);
  overflow: auto;
  font-size: 14px;
  line-height: 1.45;
  box-sizing: border-box;
}
.canvas-text > :first-child { margin-top: 0; }
.canvas-text > :last-child { margin-bottom: 0; }
.canvas-text h1, .canvas-text h2 { margin-top: .3em; margin-bottom: .25em; font-size: 1.1em; }
.canvas-file {
  display: flex; flex-direction: column; justify-content: center;
  text-decoration: none !important;
}
.canvas-file:hover { background: var(--bg-chip); }
.canvas-file-name { font-weight: 500; }
.canvas-file-private { opacity: .6; }
.canvas-file-private-note { font-size: .75em; color: var(--text-faint); margin-top: 4px; }
.canvas-link {
  display: flex; align-items: center; gap: .4em;
  font-size: .85em;
  color: var(--text-link);
  text-decoration: none !important;
  word-break: break-all;
}
.canvas-list {
  display: grid; gap: .5em;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  list-style: none; padding: 0;
}
.canvas-list li { margin: 0; }
.canvas-list a {
  display: flex; align-items: center; gap: .6em;
  padding: .65em .85em;
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-normal);
  text-decoration: none !important;
}
.canvas-list a:hover { border-color: var(--text-accent); background: var(--bg-chip); }
.canvas-list .canvas-icon { font-size: 1.2em; }
.canvas-list .title { flex: 1; font-weight: 500; }
.canvas-list .ulid {
  font-size: .7em; color: var(--text-faint);
  font-family: "SF Mono", Menlo, monospace;
}
.canvas-edge-label {
  font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  paint-order: stroke; stroke: var(--bg-secondary); stroke-width: 4;
}
.wikilink-private {
  color: var(--text-accent);
  border-bottom: 1px dotted var(--text-accent);
  cursor: help;
  opacity: .65;
}

/* CALLOUTS \u2014 match Obsidian exact look (icon + colored title bar + body) */
.callout {
  background: var(--bg-callout);
  border-left: 3px solid var(--callout-color, var(--text-accent));
  border-radius: 6px;
  padding: .7em 1em .8em;
  margin: 1em 0;
}
.callout-title {
  display: flex;
  align-items: center;
  gap: .5em;
  font-weight: 600;
  color: var(--callout-color, var(--text-accent));
  margin-bottom: .35em;
}
.callout-title .callout-icon { display: inline-flex; }
.callout-title svg { width: 18px; height: 18px; }
.callout-content > :first-child { margin-top: 0; }
.callout-content > :last-child  { margin-bottom: 0; }
.callout-content { color: var(--text-normal); font-size: .95em; }

.callout[data-callout="abstract"], .callout[data-callout="summary"], .callout[data-callout="tldr"] { --callout-color: #00b8b8; }
.callout[data-callout="info"]                                                                     { --callout-color: #086ddd; }
.callout[data-callout="todo"]                                                                     { --callout-color: #086ddd; }
.callout[data-callout="tip"], .callout[data-callout="hint"], .callout[data-callout="important"]   { --callout-color: #00b8b8; }
.callout[data-callout="success"], .callout[data-callout="check"], .callout[data-callout="done"]   { --callout-color: #08b94e; }
.callout[data-callout="question"], .callout[data-callout="help"], .callout[data-callout="faq"]    { --callout-color: #e0ac00; }
.callout[data-callout="warning"], .callout[data-callout="caution"], .callout[data-callout="attention"] { --callout-color: #e0ac00; }
.callout[data-callout="failure"], .callout[data-callout="fail"], .callout[data-callout="missing"] { --callout-color: #e93147; }
.callout[data-callout="danger"], .callout[data-callout="error"]                                   { --callout-color: #e93147; }
.callout[data-callout="bug"]                                                                       { --callout-color: #e93147; }
.callout[data-callout="example"]                                                                   { --callout-color: #a882ff; }
.callout[data-callout="quote"], .callout[data-callout="cite"]                                      { --callout-color: #8b8b8b; }
.callout[data-callout="note"]                                                                      { --callout-color: #086ddd; }

/* wrapper landing page */
.wrap-header h1 { font-size: 2em; margin-bottom: .15em; }
.wrap-header .desc { color: var(--text-muted); margin-bottom: 1.5em; }
/* Landing hero \u2014 gives the page a proper H1 + orientation row instead of
   dropping the reader straight onto the graph viewer. */
.wrap-hero {
  padding: 3em 3em 2em;
  border-bottom: 1px solid var(--border-faint);
  margin: 0 0 1.5em;
}
.wrap-hero h1 {
  font-size: 2.6em;
  font-weight: 700;
  letter-spacing: -.02em;
  line-height: 1.1;
  margin: 0 0 .4em;
}
.wrap-hero-desc {
  font-size: 1.05em;
  color: var(--text-muted);
  margin: 0 0 .8em;
  line-height: 1.5;
  max-width: 60em;
}
.wrap-hero-meta {
  display: flex; flex-wrap: wrap; gap: .4em;
  align-items: center;
  font-size: .9em;
  color: var(--text-faint);
  margin: 0;
}
.wrap-hero-meta kbd {
  background: var(--kbd-bg);
  border: 1px solid var(--border-faint);
  border-radius: 3px;
  padding: 0 .35em;
  font-size: .85em;
  font-family: ui-monospace, monospace;
}
.wrap-hero-search {
  display: inline-flex; align-items: center; gap: .35em;
  padding: .25em .7em;
  background: var(--bg-secondary);
  color: var(--text-normal);
  border: 1px solid var(--border-faint);
  border-radius: 999px;
  cursor: pointer;
  font-size: .9em;
  margin-left: .2em;
  transition: color .15s, border-color .15s;
}
.wrap-hero-search:hover {
  color: var(--text-accent);
  border-color: var(--text-accent);
}
.wrap-meta { font-size: .85em; color: var(--text-faint); margin-top: 2em; padding-top: 1em; border-top: 1px solid var(--border-faint); }

/* Graph full-space layout ------------------------------------------------- */
.graph-wrapper {
  display: flex;
  height: calc(100vh - 220px);
  min-height: 520px;
  margin: 1.5em 36px 1.5em 0;
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}
#graph-host {
  flex: 1;
  min-width: 0;
  position: relative;
  background: var(--bg-secondary);
}
.graph-hint-bar {
  position: absolute;
  bottom: 10px; left: 12px;
  font-size: .72em;
  color: var(--text-faint);
  pointer-events: none;
  z-index: 2;
  letter-spacing: .02em;
}
/* Controls open/close ---------------------------------------------------- */
.graph-wrapper[data-controls="open"] .graph-open-btn { display: none; }
.graph-wrapper[data-controls="closed"] .graph-controls-panel { display: none; }
.graph-wrapper[data-controls="closed"] .graph-open-btn { display: flex; }
.graph-open-btn {
  position: absolute;
  top: 10px; right: 10px;
  z-index: 4;
  padding: .3em .65em;
  font-size: .78em;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  align-items: center; gap: .3em;
  transition: color .15s, border-color .15s;
}
.graph-open-btn:hover { color: var(--text-accent); border-color: var(--text-accent); }
/* Controls panel ---------------------------------------------------------- */
.graph-controls-panel {
  width: 230px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-faint);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  font-size: .82em;
}
.gcp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .8em 1em .6em;
  font-weight: 600;
  font-size: .95em;
  border-bottom: 1px solid var(--border-faint);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}
.gcp-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-faint);
  font-size: 1em;
  line-height: 1;
  padding: .2em .3em;
  border-radius: 4px;
  transition: color .12s;
}
.gcp-close-btn:hover { color: var(--text-normal); }
.gcp-section {
  padding: .75em 1em .8em;
  border-bottom: 1px solid var(--border-faint);
}
.gcp-section-title {
  font-size: .68em;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: .7em;
}
.gcp-row { margin-bottom: .65em; }
.gcp-row:last-child { margin-bottom: 0; }
.gcp-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .3em;
}
.gcp-label { color: var(--text-muted); }
.gcp-val { color: var(--text-faint); font-variant-numeric: tabular-nums; min-width: 2.5em; text-align: right; }
input[type="range"].gcp-slider {
  width: 100%;
  height: 4px;
  accent-color: var(--text-accent);
  cursor: pointer;
  margin: 0;
}
.gcp-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .55em;
}
.gcp-toggle-row:last-child { margin-bottom: 0; }
.gcp-toggle {
  width: 34px; height: 20px;
  border-radius: 10px;
  border: none;
  background: var(--border);
  position: relative;
  cursor: pointer;
  transition: background .15s;
  flex-shrink: 0;
}
.gcp-toggle::after {
  content: "";
  position: absolute;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #fff;
  top: 3px; left: 3px;
  transition: left .15s, box-shadow .15s;
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
}
.gcp-toggle.active { background: var(--text-accent); }
.gcp-toggle.active::after { left: 17px; }
.gcp-apply-btn {
  width: 100%;
  padding: .45em;
  background: var(--text-accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: .88em;
  margin-top: .55em;
  transition: opacity .12s;
}
.gcp-apply-btn:hover { opacity: .88; }
.gcp-reset-btn {
  width: 100%;
  padding: .5em;
  background: transparent;
  border: 1px solid var(--border-faint);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: .88em;
  transition: color .12s, border-color .12s;
}
.gcp-reset-btn:hover { color: var(--text-accent); border-color: var(--text-accent); }

.note-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: .65em;
  list-style: none;
  padding: 0;
}
.note-list li { margin: 0; }
.note-list a {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 62px;
  padding: .85em 1em .8em;
  border-radius: 8px;
  border: 1px solid var(--border-faint);
  border-left: 3px solid var(--border-faint);
  background: var(--bg-secondary);
  color: var(--text-normal);
  transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease, background .14s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.note-list a:hover {
  border-color: var(--text-accent);
  border-left-color: var(--text-accent);
  background: var(--bg-primary);
  box-shadow: 0 3px 10px rgba(0,0,0,.08);
  transform: translateY(-2px);
}
.note-list .folder { font-size: .75em; color: var(--text-faint); display: block; margin-bottom: 2px; }
/* Wrapper landing layout: persistent left sidebar + flexible main pane */
.wrap-shell {
  display: flex;
  min-height: 100vh;
  align-items: stretch;
}
.wrap-sidebar {
  flex: 0 0 280px;
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  transition: flex-basis .2s ease, transform .2s ease;
  z-index: 10;
}
.wrap-sidebar.collapsed { flex: 0 0 48px; }
.wrap-sidebar.collapsed .sidebar-inner { display: none; }
.sidebar-toggle {
  position: absolute;
  top: 10px; right: 10px;
  width: 28px; height: 28px;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  color: var(--text-muted);
  z-index: 1;
}
.sidebar-toggle:hover { color: var(--text-accent); border-color: var(--text-accent); }
.sidebar-inner { padding: 1.4em 1.1em; }
.sidebar-header { margin-bottom: 1em; padding-right: 32px; }
.sidebar-title { font-size: 1.15em; line-height: 1.25; margin: 0 0 .25em; color: var(--text-muted); }
.sidebar-badge { margin: .2em 0 .4em; color: var(--text-muted); }
.sidebar-desc { font-size: .82em; color: var(--text-muted); line-height: 1.4; margin: .4em 0 0;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}
.sidebar-cta {
  display: inline-flex; align-items: center; gap: .35em;
  font-size: .8em;
  text-decoration: none !important;
  padding: .25em .6em; margin: .2em 0 1em;
  background: var(--bg-chip);
  color: var(--text-accent) !important;
  border-radius: 3px;
}
.sidebar-cta:hover { opacity: .8; text-decoration: none !important; }
.sidebar-section { margin-bottom: 1em; }
.sidebar-section-title {
  color: var(--text-faint);
  font-size: .72em;
  letter-spacing: .12em;
  text-transform: uppercase;
  font-weight: 600;
  margin: 0 0 .35em;
  padding: 0 .2em;
}
/* Obsidian-style file tree */
.tree { display: flex; flex-direction: column; gap: 0; font-size: .85em; }
.tree-folder { display: block; }
.tree-folder > summary {
  display: flex; align-items: center; gap: .35em;
  padding: .25em .35em;
  cursor: pointer;
  border-radius: 4px;
  color: var(--text-normal);
  list-style: none;
  user-select: none;
}
.tree-folder > summary::-webkit-details-marker { display: none; }
.tree-folder > summary::marker { display: none; }
.tree-folder > summary:hover { background: var(--bg-chip); color: var(--text-accent); }
.tree-chevron {
  display: inline-block; width: 12px; flex: 0 0 12px;
  font-size: .7em; color: var(--text-faint);
  transition: transform .15s ease;
  transform: rotate(90deg);
}
.tree-folder:not([open]) > summary .tree-chevron { transform: rotate(0deg); }
.tree-folder-name {
  flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-weight: 500;
  color: var(--text-muted);
}
.tree-folder-count {
  font-size: .75em; color: var(--text-faint);
  padding: 0 .35em;
}
.tree-children { display: flex; flex-direction: column; gap: 0; }
.tree-file {
  display: flex; align-items: center; gap: .4em;
  padding: .22em .35em .22em 1.55em;
  border-radius: 4px;
  color: var(--text-normal) !important;
  text-decoration: none !important;
  border: 1px solid transparent !important;
}
.tree-file:hover { background: var(--bg-chip); color: var(--text-accent) !important; border-color: transparent !important; }
.tree-file.active {
  background: var(--bg-chip);
  color: var(--text-accent) !important;
  font-weight: 600;
}
.tree-file.active .tree-file-name { color: var(--text-accent); }
/* sidebar filter input \u2014 visible search bar above the tree */
.sidebar-search { margin: .2em 0 .9em; position: relative; }
.sidebar-filter-input {
  width: 100%; box-sizing: border-box;
  padding: 7px 10px 7px 28px;
  font-size: .85em;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 4px;
  color: var(--text-normal);
  font-family: inherit;
  outline: none;
  transition: border-color .12s, box-shadow .12s;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238a8a8a' stroke-width='1.5'><circle cx='7' cy='7' r='4.5'/><line x1='10.5' y1='10.5' x2='14' y2='14' stroke-linecap='round'/></svg>");
  background-repeat: no-repeat;
  background-position: 8px center;
  background-size: 14px 14px;
}
.sidebar-filter-input::placeholder { color: var(--text-faint); }
.sidebar-filter-input:focus {
  box-shadow: 0 0 0 2px rgba(127,109,242,0.2);
  border-color: var(--text-accent);
}
.sidebar-filter-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  height: 14px; width: 14px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' stroke='%238a8a8a' stroke-width='1.6' stroke-linecap='round'><line x1='4' y1='4' x2='12' y2='12'/><line x1='12' y1='4' x2='4' y2='12'/></svg>");
  background-repeat: no-repeat; background-position: center;
  cursor: pointer;
}
.sidebar-filter-hint {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  display: inline-flex; align-items: center; gap: 4px;
  font-size: .65em; color: var(--text-faint);
  background: var(--bg-secondary); padding: 2px 6px;
  border: 1px solid var(--border-faint); border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}
.sidebar-filter-hint:hover { color: var(--text-accent); border-color: var(--text-accent); }
.sidebar-filter-input:not(:placeholder-shown) ~ .sidebar-filter-hint { display: none; }
.sidebar-filter-hint-icon { display: none; font-size: 1.4em; line-height: 1; }
@media (pointer: coarse) {
  /* On touch devices the \u2318K text is meaningless \u2014 show just the magnifier
     icon and make the whole pill a comfortable tap target. */
  .sidebar-filter-hint { padding: 6px 10px; font-size: .8em; }
  .sidebar-filter-hint-text { display: none; }
  .sidebar-filter-hint-icon { display: inline; }
}
/* hide tree nodes filtered out \u2014 JS adds .filter-hidden during typing */
.tree-folder.filter-hidden, .tree-file.filter-hidden { display: none !important; }
/* highlight match within visible labels */
.tree-folder-name mark, .tree-file-name mark {
  background: var(--bg-chip);
  color: var(--text-accent);
  padding: 0 2px;
  border-radius: 2px;
}
.sidebar-filter-empty {
  font-size: .9em;
  color: var(--text-faint);
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}
.tree-file-name {
  flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: .875em;
}
.tree-file-tag {
  font-size: .62em;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--text-faint);
  background: var(--bg-callout);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--border-faint);
  flex: 0 0 auto;
}
/* nested folder/file children get extra indent */
.tree-children .tree-folder > summary { padding-left: 1.55em; }
.tree-children .tree-children .tree-folder > summary { padding-left: 2.75em; }
.tree-children .tree-children .tree-children .tree-folder > summary { padding-left: 3.95em; }
.tree-children .tree-file { padding-left: 2.75em; }
.tree-children .tree-children .tree-file { padding-left: 3.95em; }
.tree-children .tree-children .tree-children .tree-file { padding-left: 5.15em; }
.sidebar-meta {
  font-size: .72em;
  color: var(--text-faint);
  margin-top: 1em;
  padding-top: .7em;
  border-top: 1px solid var(--border-faint);
}
.wrap-main {
  flex: 1; min-width: 0;
  padding: 2em 2em 4em;
  max-width: none;
  background: var(--bg-primary);
}
/* On note pages inside the wrapper shell, constrain the prose to a
   readable line-length and centre it in the available main pane. The
   sidebar already eats 280px on the left, so the prose floats nicely. */
.wrap-main .prose {
  max-width: 760px;
  margin: 0 auto;
  /* Belt-and-suspenders: never let a child overflow the prose column. Any
     individual element that needs to be wider than the column (code blocks,
     tables, mermaid, canvas) already provides its own internal scrollbar via
     overflow-x:auto, so this just stops accidents from forcing the whole
     page to scroll horizontally on mobile. */
  min-width: 0;
}
/* Same min-width:0 protection on the main column itself \u2014 flex items default
   to min-width:auto, which means a long unbroken line inside a child can
   inflate the flex item past the viewport. Setting min-width:0 lets the
   column shrink so inner-scroll children (pre, table, mermaid) take over. */
.wrap-main { min-width: 0; }
.wrap-main-canvas { padding: 1.2em 1.2em 3em; }
.sidebar-title-link {
  color: inherit !important;
  text-decoration: none !important;
  border-bottom: none !important;
}
.sidebar-title-link:hover { color: var(--text-accent) !important; }

/* Command palette (\u2318K) */
.cmd-palette, .cmd-help {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 14vh;
}
.cmd-palette[hidden], .cmd-help[hidden] { display: none; }
.cmd-palette-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(2px);
}
.cmd-palette-modal, .cmd-help-card {
  position: relative;
  width: min(560px, 92vw);
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  overflow: hidden;
}
.cmd-input {
  width: 100%; box-sizing: border-box;
  padding: 14px 18px;
  font-size: 15px;
  background: transparent;
  color: var(--text-normal);
  border: 0;
  border-bottom: 1px solid var(--border-faint);
  outline: none;
  font-family: inherit;
}
.cmd-list {
  max-height: 50vh;
  overflow-y: auto;
  padding: 6px 0;
}
.cmd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-normal);
}
.cmd-item.selected { background: var(--bg-chip); color: var(--text-accent); }
.cmd-icon { font-size: 14px; opacity: .8; flex: 0 0 auto; width: 18px; }
.cmd-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmd-hint {
  font-size: 12px; color: var(--text-faint);
  flex: 0 0 auto; max-width: 40%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cmd-empty { padding: 24px; text-align: center; color: var(--text-faint); font-size: 13px; }
.cmd-loading { padding: 10px 16px; color: var(--text-faint); font-size: 12px; font-style: italic; }
.cmd-section {
  padding: 8px 16px 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .05em;
  font-weight: 600;
  color: var(--text-faint);
  border-top: 1px solid var(--border-faint);
  margin-top: 4px;
}
.cmd-row-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cmd-row-main > .cmd-icon  { width: 18px; flex: 0 0 auto; opacity: .8; }
.cmd-row-main > .cmd-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmd-row-main > .cmd-hint  { flex: 0 0 auto; max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmd-snippet {
  margin-top: 3px;
  padding-left: 28px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cmd-snippet mark, .cmd-label mark {
  background: var(--bg-chip);
  color: var(--text-accent);
  padding: 0 2px;
  border-radius: 2px;
}
.cmd-item { display: block; }    /* override the flex from earlier \u2014 content rows have a sub-grid now */
.cmd-footer {
  display: flex; gap: 16px; justify-content: flex-end;
  padding: 8px 14px;
  font-size: 11px; color: var(--text-faint);
  border-top: 1px solid var(--border-faint);
  background: var(--bg-secondary);
}
.cmd-footer kbd, .cmd-help kbd {
  background: var(--kbd-bg);
  border: 1px solid var(--border-faint);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-normal);
}
.cmd-help-card { padding: 18px 22px 16px; }
.cmd-help-card h3 { margin: 0 0 12px; font-size: 14px; color: var(--text-normal); }
.cmd-help-card table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cmd-help-card td { padding: 5px 8px; vertical-align: top; }
.cmd-help-card td:first-child { width: 40%; color: var(--text-muted); white-space: nowrap; }
.cmd-help-card td:last-child  { color: var(--text-normal); }
.cmd-help-foot { margin: 12px 0 0; font-size: 12px; color: var(--text-faint); border-top: 1px solid var(--border-faint); padding-top: 10px; }
@media (max-width: 760px) {
  .wrap-shell { flex-direction: column; }

  /* Sticky topbar strip \u2014 injected into DOM by JS on mobile */
  .mobile-topbar {
    display: flex; align-items: center; gap: .6em;
    position: sticky; top: 0; z-index: 50;
    height: 56px; padding: 0 1em;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-faint);
    flex-shrink: 0;
  }
  .mobile-topbar-title {
    font-size: .92em; font-weight: 600; color: var(--text-normal);
    flex: 1; min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  /* \u2630 open button in the topbar (separate from the \u2715 close button in the drawer) */
  .mobile-menu-btn {
    display: flex; align-items: center; justify-content: center;
    width: 44px; height: 44px;
    background: var(--bg-chip);
    border: 1px solid var(--border-faint);
    border-radius: 6px;
    font-size: 1.25em; cursor: pointer;
    color: var(--text-normal);
    flex-shrink: 0;
  }

  /* Sidebar: fixed overlay drawer, initially off-screen to the left */
  .wrap-sidebar {
    position: fixed !important; left: 0; top: 0;
    width: min(320px, 85vw); height: 100vh;
    flex: none !important;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform .25s cubic-bezier(.25,.46,.45,.94);
    overflow-y: auto;
    border-right: 1px solid var(--border-faint);
    border-bottom: none;
    box-shadow: none;
  }
  .wrap-sidebar.open {
    transform: translateX(0);
    box-shadow: 8px 0 40px rgba(0,0,0,.35);
  }
  /* Semi-transparent backdrop behind open drawer */
  .sidebar-backdrop {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,.45); z-index: 199;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .sidebar-backdrop.active { display: block; }
  /* \u2715 close button inside the drawer \u2014 bigger touch target on mobile */
  .sidebar-toggle {
    width: 40px; height: 40px;
    top: 8px; right: 10px;
    font-size: 1.2em;
  }

  .wrap-main { padding: 1em 1em 3em; }
  /* Touch targets \u2014 Apple HIG / Material both say \u226544px. The desktop sizes
     are 22\u201329px which is fine with a mouse and unusable on a phone. Bump
     every interactive element in the sidebar + hero on mobile. */
  .tree-file {
    padding-top: .7em; padding-bottom: .7em;
    font-size: 1em;
    min-height: 44px;
    box-sizing: border-box;
  }
  .tree-children .tree-file { padding-left: 2.2em; }
  .tree-folder > summary {
    padding-top: .7em; padding-bottom: .7em;
    min-height: 44px;
    box-sizing: border-box;
  }
  .sidebar-cta {
    padding-top: .7em; padding-bottom: .7em;
    min-height: 44px;
    align-items: center;
  }
  .sidebar-filter-input {
    min-height: 44px;
    font-size: 1em;
  }
  .sidebar-filter-hint {
    padding: .7em 1em;
    min-height: 44px;
    font-size: .92em;
  }
  .wrap-hero-search {
    padding: .55em 1em;
    min-height: 40px;
    font-size: .95em;
  }
  .wrap-hero-meta {
    gap: .55em;
    font-size: .92em;
  }
  /* Graph: on phones collapse the controls panel and give the canvas more height */
  .graph-wrapper {
    height: 72vh;
    min-height: 360px;
    flex-direction: column;
    margin-right: 0;
  }
  .graph-controls-panel {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    border-left: none;
    border-top: 1px solid var(--border-faint);
  }
  .graph-wrapper[data-controls="open"] .graph-controls-panel {
    max-height: 260px;
  }
}
.wrap-actions {
  display: flex; gap: .5em; flex-wrap: wrap;
  margin: .8em 0 .4em;
}
/* Secondary action row above each note \u2014 search, copy, theme. Subtle ghost
   buttons so they don't compete with the article. */
.note-actions {
  display: flex; gap: .35em; flex-wrap: wrap;
  margin: .25em 0 1em;
  font-size: .85em;
}
.note-action-btn {
  display: inline-flex; align-items: center; gap: .35em;
  padding: .3em .7em;
  font-size: .85em;
  letter-spacing: .04em;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  text-decoration: none !important;
  transition: color .15s, border-color .15s, background .15s;
}
.note-action-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-normal);
  border-color: var(--border);
}
.note-action-btn .action-emoji {
  font-size: 1em; line-height: 1;
}
.note-action-btn[data-flash="ok"] {
  color: var(--text-accent); border-color: var(--text-accent); background: var(--bg-chip);
}
@media (pointer: coarse) {
  .note-action-btn { padding: .45em .9em; font-size: .92em; min-height: 44px; }
}

/* "Notes that link here" panel \u2014 Obsidian-style backlinks below the body. */
.note-backlinks {
  margin: 3em 0 1em;
  padding: 1.2em 1.4em 1.4em;
  background: var(--bg-secondary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
}
.note-backlinks-heading {
  font-size: 1em;
  font-weight: 600;
  margin: 0 0 .8em;
  color: var(--text-muted);
  display: flex; align-items: center; gap: .4em;
}
.note-backlinks-heading .emoji { font-size: 1.1em; }
.backlinks-count {
  background: var(--bg-chip);
  color: var(--text-accent);
  font-size: .75em;
  padding: .1em .55em;
  border-radius: 999px;
  margin-left: .2em;
}
.note-backlinks-list {
  list-style: none;
  padding: 0; margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: .3em;
}
.note-backlinks-list a {
  display: flex; flex-direction: column; gap: .15em;
  padding: .55em .7em;
  border-radius: 6px;
  text-decoration: none !important;
  color: var(--text-normal) !important;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  transition: border-color .15s, color .15s;
}
.note-backlinks-list a:hover {
  border-color: var(--text-accent);
  color: var(--text-accent) !important;
}
.backlink-title { font-size: .95em; line-height: 1.3; }
.backlink-folder {
  font-size: .78em;
  letter-spacing: .04em;
  color: var(--text-faint);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Previous / Next within folder \u2014 two-button nav at the foot of each note. */
.folder-nav {
  margin: 2em 0 1em;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .8em;
}
.folder-nav-link {
  display: flex; flex-direction: column; gap: .2em;
  padding: .9em 1.1em;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-faint);
  text-decoration: none !important;
  color: var(--text-normal) !important;
  transition: border-color .15s, color .15s;
  min-width: 0;
}
.folder-nav-link:hover { border-color: var(--text-accent); color: var(--text-accent) !important; }
.folder-nav-next { text-align: right; }
.folder-nav-dir {
  font-size: .72em;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.folder-nav-title {
  font-size: 1em;
  line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis;
}
.folder-nav-placeholder {} /* keep the grid 2-column layout when one side is missing */
@media (max-width: 600px) {
  .folder-nav { grid-template-columns: 1fr; }
  .folder-nav-next { text-align: left; }
}

/* Auto-TOC \u2014 sticky right-rail of section anchors. Hidden under 1100px since
   the main column already shrinks; mobile readers don't lose anything because
   \u2318K search covers the same need. */
.note-toc {
  position: fixed;
  top: 90px;
  right: 1.6em;
  max-width: 220px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
  font-size: .82em;
  line-height: 1.4;
  padding: 0.4em .6em;
  border-left: 2px solid var(--border-faint);
  color: var(--text-muted);
}
.note-toc-title {
  font-size: .72em;
  text-transform: uppercase;
  letter-spacing: .06em;
  font-weight: 600;
  color: var(--text-faint);
  margin: 0 0 .35em;
}
.note-toc-list {
  list-style: none;
  padding: 0; margin: 0;
}
.note-toc-item { margin: 0; font-size: .88em; }
.note-toc-item a {
  display: block;
  padding: .15em .2em;
  border-radius: 3px;
  color: var(--text-muted) !important;
  text-decoration: none !important;
  transition: color .15s;
}
.note-toc-item a:hover { color: var(--text-accent) !important; }
.note-toc-item a.active { color: var(--text-accent) !important; font-weight: 500; }
.note-toc-l3 a { padding-left: 1em; font-size: .94em; }
@media (max-width: 1099px) {
  .note-toc { display: none; }
}
.action-btn {
  display: inline-flex; align-items: center; gap: .4em;
  padding: .45em .9em;
  font-size: .9em;
  border-radius: 6px;
  background: var(--text-accent);
  color: var(--bg-primary) !important;
  border: 1px solid transparent !important;
  text-decoration: none !important;
  transition: opacity .15s;
}
.action-btn:hover { opacity: .85; border-color: transparent !important; }
.action-icon { font-size: 1.05em; }
.folder-chips {
  display: flex; flex-wrap: wrap; gap: .4em;
  margin: .5em 0 1em;
}
.folder-chip {
  display: inline-flex; align-items: center; gap: .35em;
  padding: .25em .7em;
  font-size: .8em;
  border-radius: 999px;
  background: var(--bg-chip);
  color: var(--text-accent) !important;
  border: 1px solid transparent;
  text-decoration: none !important;
}
.folder-chip:hover { border-color: var(--text-accent); border-bottom-color: var(--text-accent); }
.folder-chip-count {
  font-size: .85em; opacity: .7; padding: 0 .35em;
  background: rgba(127,109,242,0.15); border-radius: 6px;
}
.folder-heading {
  display: flex; align-items: center; gap: .55em;
  font-size: .82em; font-weight: 600;
  color: var(--text-muted);
  letter-spacing: .04em;
  text-transform: uppercase;
  margin: 1.8em 0 .55em;
  padding-bottom: .35em;
  border-bottom: 1px solid var(--border-faint);
  scroll-margin-top: 1em;
}
.folder-heading .folder-icon { display: none; }
.folder-heading .folder-count {
  margin-left: auto;
  font-size: .9em;
  color: var(--text-faint);
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  background: var(--bg-secondary);
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--border-faint);
}
.note-list .title  { font-weight: 500; font-size: .96em; line-height: 1.35; display: block; }
.note-list .ulid   { font-size: .7em; color: var(--text-faint); display: block; margin-top: 2px; font-family: "SF Mono", Menlo, monospace; }
.note-list .missing a { opacity: .5; text-decoration: line-through; }
/* Subtle arrow hint on hover */
.note-list a::after {
  content: "\u2192";
  font-size: .75em;
  color: var(--text-faint);
  align-self: flex-end;
  margin-top: .4em;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity .14s ease, transform .14s ease;
}
.note-list a:hover::after {
  opacity: 1;
  transform: translateX(0);
  color: var(--text-accent);
}

/* gated badges + error page */
.gated-badge {
  font-size: .75em;
  letter-spacing: .08em;
  text-transform: uppercase;
  background: var(--bg-chip);
  color: var(--text-accent);
  border-radius: 2px;
  border-color: var(--text-accent);
}
.gated-pill {
  display: inline-block;
  background: var(--bg-chip);
  color: var(--text-accent);
  border: 1px solid transparent;
  font-size: .78em;
  letter-spacing: .06em;
  padding: 2px 10px;
  border-radius: 2px;
  margin-left: .5em;
  vertical-align: middle;
}
.gate-error { text-align: center; padding: 6em 0; }
.gate-error .gate-icon { font-size: 3em; opacity: .5; margin-bottom: .3em; }
.gate-error h1 { border: 0; }
.gate-error .gate-msg { color: var(--text-muted); font-size: 1.05em; margin: .8em 0 1.5em; }
.gate-error .gate-hint { font-size: .9em; color: var(--text-faint); max-width: 480px; margin: 0 auto; }

/* Wikilink hover-preview popover */
.wikilink-preview {
  position: absolute;
  z-index: 9999;
  max-width: 340px;
  min-width: 220px;
  background: var(--bg-primary);
  color: var(--text-normal);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06);
  padding: .85em 1em;
  font-size: .88em;
  line-height: 1.5;
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity .15s ease, transform .15s ease;
}
.wikilink-preview.visible {
  opacity: 1;
  transform: translateY(0);
}
.wikilink-preview-title {
  font-weight: 600;
  margin: 0 0 .35em;
  color: var(--text-normal);
  font-size: .95em;
  line-height: 1.3;
}
.wikilink-preview-body {
  color: var(--text-muted);
  font-size: .85em;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.wikilink-preview-folder {
  font-size: .7em;
  color: var(--text-faint);
  margin-top: .4em;
  padding-top: .4em;
  border-top: 1px solid var(--border-faint);
  letter-spacing: .04em;
}
@media (pointer: coarse) {
  /* Touch devices: disable hover preview to avoid sticky popovers */
  .wikilink-preview { display: none !important; }
}

/* Reading progress \u2014 thin fixed bar at top of viewport */
.read-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 0;
  background: var(--text-accent);
  z-index: 10000;
  transition: width .08s linear;
  pointer-events: none;
}

/* Read-state marker \u2014 dim notes the user has already opened */
.note-list a.is-read .title {
  color: var(--text-muted);
  opacity: .75;
}
.note-list a.is-read::before {
  content: "\u2713";
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: .72em;
  color: var(--text-faint);
  opacity: .55;
}
.note-list a { position: relative; }

/* "NEW since last visit" badge */
.note-list a.is-new::after {
  content: "NEW";
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: .58em;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--text-accent);
  background: var(--bg-chip);
  padding: 1px 5px;
  border-radius: 3px;
  opacity: 1 !important;
  transform: none !important;
}
.note-list a.is-new.is-read::before { display: none; }
.note-list a.is-new::after { opacity: 1; }

/* Recently updated -------------------------------------------------------- */
.recently-updated {
  margin: 1.2em 0 1.5em;
  padding: .9em 1em .75em;
  background: var(--bg-secondary);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
}
.recently-updated-heading {
  display: flex;
  align-items: center;
  gap: .5em;
  margin: 0 0 .8em;
  font-size: .78em;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.recently-updated-heading::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-accent);
  box-shadow: 0 0 0 3px var(--bg-chip);
}
.recently-updated-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: .55em;
  list-style: none;
  padding: 0;
  margin: 0;
}
.recently-updated-list a {
  display: block;
  padding: .55em .75em;
  border-radius: 6px;
  font-size: .92em;
  color: var(--text-normal);
  border: 1px solid transparent;
  transition: background .12s ease, border-color .12s ease;
}
.recently-updated-list a:hover {
  background: var(--bg-primary);
  border-color: var(--border-faint);
}
.recently-updated-list .ru-date {
  display: block;
  font-size: .72em;
  color: var(--text-faint);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

/* \u2500\u2500\u2500 New hero (launch-ready) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wrap-hero { padding: 2.5em 1.5em 2em; border-bottom: 1px solid var(--border-faint); }
.wrap-hero-byline {
  font-size: .82em;
  color: var(--text-faint);
  letter-spacing: .04em;
  margin-bottom: .5em;
  text-transform: uppercase;
}
.wrap-hero-author { color: var(--text-accent); font-weight: 600; letter-spacing: 0; text-transform: none; }
.wrap-hero-title {
  font-size: 2.4em;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -.02em;
  margin: 0 0 .35em;
  color: var(--text-normal);
}
.wrap-hero-desc {
  font-size: 1.05em;
  line-height: 1.55;
  color: var(--text-muted);
  margin: 0 0 1.3em;
  max-width: 70ch;
}
.wrap-hero-actions {
  display: flex; gap: .6em; flex-wrap: wrap;
  margin: 0 0 1.2em;
}
.wrap-hero-cta {
  display: inline-flex; align-items: center; gap: .45em;
  padding: .6em 1.2em;
  border-radius: 8px;
  font-size: .92em;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
}
.wrap-hero-cta-primary {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #7c3aed 100%);
  background-size: 200% 200%;
  background-position: 0% 50%;
  color: #fff;
  border-color: transparent !important;
  box-shadow: 0 1px 3px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.1);
  font-weight: 600;
}
.wrap-hero-cta-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.15) 50%, transparent 65%);
  transform: translateX(-120%);
  transition: transform .55s ease;
}
.wrap-hero-cta-primary:hover {
  background-position: 100% 50%;
  box-shadow: 0 4px 16px rgba(109,40,217,.35), inset 0 1px 0 rgba(255,255,255,.15);
  transform: translateY(-1px);
}
.wrap-hero-cta-primary:hover::after {
  transform: translateX(120%);
}
.wrap-hero-cta-primary kbd {
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.9);
}
.wrap-hero-cta-secondary {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border);
}
.wrap-hero-cta-secondary:hover {
  background: var(--bg-secondary);
  color: var(--text-normal);
  border-color: var(--text-accent);
}
.wrap-hero-cta kbd {
  background: rgba(255,255,255,.18);
  border: none;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: .85em;
  margin-left: .15em;
}
.wrap-hero-cta-secondary kbd { background: var(--kbd-bg); color: var(--text-muted); }
.wrap-hero-stats {
  display: flex; align-items: center; flex-wrap: wrap; gap: .5em;
  font-size: .85em;
  color: var(--text-faint);
}
.wrap-hero-stats .wrap-stat strong { color: var(--text-muted); font-weight: 600; font-variant-numeric: tabular-nums; }
.wrap-hero-stats .wrap-stat-sep { opacity: .5; }

/* \u2500\u2500\u2500 New "Recently updated" card design \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.recently-updated-list-v2 {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.recently-updated-list-v2 li { border-bottom: 1px solid var(--border-faint); }
.recently-updated-list-v2 li:last-child { border-bottom: none; }
.recently-updated-list-v2 a {
  display: flex;
  align-items: baseline;
  gap: .9em;
  padding: .65em .1em;
  color: var(--text-normal);
  text-decoration: none;
  transition: color .12s;
}
.recently-updated-list-v2 a:hover { color: var(--text-accent); }
.ru-card-title {
  font-size: .9em;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ru-card-folder {
  font-size: .72em;
  color: var(--text-faint);
  white-space: nowrap;
  flex-shrink: 0;
}
.ru-card-meta {
  display: flex; align-items: center; gap: .3em;
  font-size: .72em;
  color: var(--text-faint);
  white-space: nowrap;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.ru-card-meta .ru-card-dot { opacity: .4; }

@media (max-width: 760px) {
  .wrap-hero-title { font-size: 1.85em; }
  .wrap-hero { padding: 1.8em 1.1em 1.5em; }
  .wrap-hero-cta { padding: .7em 1em; font-size: .95em; min-height: 44px; }
  .recently-updated-list-v2 a { flex-wrap: wrap; gap: .4em; }
  .ru-card-folder { display: none; }
}
`;
var ICON = {
  abstract: svg("M5 6h14M5 12h14M5 18h10"),
  summary: svg("M5 6h14M5 12h14M5 18h10"),
  tldr: svg("M5 6h14M5 12h14M5 18h10"),
  info: svg("M12 8v.01M12 12v4M12 22a10 10 0 110-20 10 10 0 010 20z"),
  todo: svg("M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"),
  tip: svg("M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z"),
  hint: svg("M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z"),
  important: svg("M12 9v4M12 17v.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"),
  success: svg("M5 13l4 4L19 7"),
  check: svg("M5 13l4 4L19 7"),
  done: svg("M5 13l4 4L19 7"),
  question: svg("M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"),
  help: svg("M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"),
  faq: svg("M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"),
  warning: svg("M12 9v4M12 17v.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"),
  caution: svg("M12 9v4M12 17v.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"),
  failure: svg("M18 6L6 18M6 6l12 12"),
  fail: svg("M18 6L6 18M6 6l12 12"),
  missing: svg("M18 6L6 18M6 6l12 12"),
  danger: svg("M12 9v4M12 17v.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"),
  error: svg("M18 6L6 18M6 6l12 12"),
  bug: svg("M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3.003 3.003 0 116 0v1M12 20v-9M6 13H4M20 13h-2M6.53 9C5 11.5 4 13.5 4 16a8 8 0 0016 0c0-2.5-1-4.5-2.53-7"),
  example: svg("M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"),
  quote: svg("M3 21l3-9-3-9M21 21l-3-9 3-9"),
  cite: svg("M3 21l3-9-3-9M21 21l-3-9 3-9"),
  note: svg("M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z")
};
function svg(d) {
  return `<svg class="prop-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}
__name(svg, "svg");
var PROP_ICON = {
  title: svg("M4 6h16M4 12h16M4 18h7"),
  tags: svg("M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.83zM7 7h.01"),
  created: svg("M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"),
  updated: svg("M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"),
  date: svg("M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"),
  id: svg("M4 6h16M4 12h16M4 18h7"),
  status: svg("M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"),
  link: svg("M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"),
  default: svg("M4 6h16M4 12h16M4 18h7")
};
marked.use({
  extensions: [
    {
      name: "callout",
      level: "block",
      start(src) {
        const idx = src.search(/^>\s*\[!/m);
        return idx === -1 ? void 0 : idx;
      },
      tokenizer(src) {
        const m = /^>\s*\[!([A-Za-z]+)\][\+\-]?\s*([^\n]*)\n((?:>.*\n?)*)/.exec(src);
        if (!m)
          return void 0;
        const text = m[3].replace(/^>\s?/gm, "").trimEnd();
        return {
          type: "callout",
          raw: m[0],
          calloutType: m[1].toLowerCase(),
          calloutTitle: m[2].trim() || cap(m[1]),
          text
        };
      },
      renderer(token) {
        const t = token;
        const inner = marked.parse(t.text, { async: false });
        const icon = ICON[t.calloutType] || ICON.note;
        return `<div class="callout" data-callout="${escapeAttr(t.calloutType)}">
<div class="callout-title"><span class="callout-icon">${icon}</span><span>${escapeHtml(t.calloutTitle)}</span></div>
<div class="callout-content">${inner}</div>
</div>`;
      }
    }
  ]
});
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
__name(cap, "cap");
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m)
    return { fm: null, body: md };
  const raw = m[1];
  const fields = [];
  const byKey = /* @__PURE__ */ new Map();
  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) {
      i++;
      continue;
    }
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      const items = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      fields.push({ key, value: items });
      byKey.set(key, items);
      i++;
      continue;
    }
    if (val === "" && lines[i + 1]?.match(/^\s+-\s/)) {
      const items = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s+-\s/)) {
        items.push(lines[i].replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""));
        i++;
      }
      fields.push({ key, value: items });
      byKey.set(key, items);
      continue;
    }
    val = val.replace(/^["']|["']$/g, "");
    fields.push({ key, value: val });
    byKey.set(key, val);
    i++;
  }
  return { fm: { raw, fields, byKey }, body: md.slice(m[0].length) };
}
__name(parseFrontmatter, "parseFrontmatter");
function extractTitle(md) {
  const { fm } = parseFrontmatter(md);
  if (!fm)
    return null;
  const t = fm.byKey.get("title");
  return typeof t === "string" ? t : null;
}
__name(extractTitle, "extractTitle");
async function loadNotes(notes, ulids) {
  return Promise.all(
    ulids.map(async (u) => {
      const [md, metaRaw] = await Promise.all([
        notes.get(`note:${u}`),
        notes.get(`meta:${u}`)
      ]);
      let basename = u;
      let path = u;
      if (metaRaw) {
        try {
          const m = JSON.parse(metaRaw);
          if (m.basename)
            basename = m.basename;
          if (m.path)
            path = m.path;
        } catch {
        }
      }
      const title = (md ? extractTitle(md) : null) ?? basename;
      return { ulid: u, basename, path, title, md };
    })
  );
}
__name(loadNotes, "loadNotes");
async function loadNotesMeta(notes, ulids) {
  return Promise.all(
    ulids.map(async (u) => {
      const metaRaw = await notes.get(`meta:${u}`);
      let basename = u, path = u;
      if (metaRaw) {
        try {
          const m = JSON.parse(metaRaw);
          if (m.basename)
            basename = m.basename;
          if (m.path)
            path = m.path;
        } catch {
        }
      }
      return { ulid: u, basename, path, title: basename };
    })
  );
}
__name(loadNotesMeta, "loadNotesMeta");
async function loadCanvasMeta(notes, ulids) {
  return Promise.all(ulids.map(async (u) => {
    const raw = await notes.get(`canvasmeta:${u}`);
    let path = u, basename = u;
    if (raw) {
      try {
        const m = JSON.parse(raw);
        path = m.path;
        basename = m.basename;
      } catch {
      }
    }
    return { ulid: u, path, basename };
  }));
}
__name(loadCanvasMeta, "loadCanvasMeta");
function renderTreeSidebar(opts) {
  const tq = opts.tokenQuery;
  const root = { name: "", folders: /* @__PURE__ */ new Map(), files: [], hasActive: false };
  function ensureFolder(parts) {
    const chain = [];
    let cur = root;
    for (const seg of parts) {
      let next = cur.folders.get(seg);
      if (!next) {
        next = { name: seg, folders: /* @__PURE__ */ new Map(), files: [], hasActive: false };
        cur.folders.set(seg, next);
      }
      chain.push(next);
      cur = next;
    }
    return chain;
  }
  __name(ensureFolder, "ensureFolder");
  for (const n of opts.notes) {
    if (n.md === null)
      continue;
    const parts = n.path.split("/");
    const fileName = parts.pop().replace(/\.md$/i, "");
    const chain = ensureFolder(parts);
    const isActive = opts.activeUlid === n.ulid;
    (chain.length ? chain[chain.length - 1] : root).files.push({
      kind: "note",
      ulid: n.ulid,
      label: n.title || fileName,
      sortKey: fileName,
      isActive
    });
    if (isActive)
      for (const f of chain)
        f.hasActive = true;
  }
  for (const c of opts.canvases) {
    const parts = c.path.split("/");
    const fileName = parts.pop().replace(/\.canvas$/i, "");
    const chain = ensureFolder(parts);
    const isActive = opts.activeUlid === c.ulid;
    (chain.length ? chain[chain.length - 1] : root).files.push({
      kind: "canvas",
      ulid: c.ulid,
      label: fileName || c.basename,
      sortKey: fileName || c.basename,
      isActive
    });
    if (isActive)
      for (const f of chain)
        f.hasActive = true;
  }
  function countDescendants(node) {
    let n = node.files.length;
    for (const sub of node.folders.values())
      n += countDescendants(sub);
    return n;
  }
  __name(countDescendants, "countDescendants");
  function renderTreeFolder(node, isRoot) {
    const subs = [...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name));
    const files = [...node.files].sort((a, b) => a.sortKey.localeCompare(b.sortKey, void 0, { numeric: true }));
    const childHtml = subs.map((s) => renderTreeFolder(s, false)).join("") + files.map((f) => {
      const href = f.kind === "canvas" ? `${opts.shareBase}/c/${f.ulid}${tq}` : `${opts.shareBase}/${f.ulid}${tq}`;
      const tag2 = f.kind === "canvas" ? `<span class="tree-file-tag">canvas</span>` : "";
      const cls = f.isActive ? "tree-file active" : "tree-file";
      return `<a class="${cls}" href="${href}" data-ulid="${f.ulid}"><span class="tree-file-name">${escapeHtml(f.label)}</span>${tag2}</a>`;
    }).join("");
    if (isRoot)
      return childHtml;
    const total = countDescendants(node);
    const open = node.hasActive || !opts.activeUlid ? " open" : "";
    return `<details class="tree-folder"${open}><summary><span class="tree-chevron">\u25B6</span><span class="tree-folder-name">${escapeHtml(node.name)}</span><span class="tree-folder-count">${total}</span></summary><div class="tree-children">${childHtml}</div></details>`;
  }
  __name(renderTreeFolder, "renderTreeFolder");
  const treeHtml = renderTreeFolder(root, true);
  const noteCount = opts.notes.filter((n) => n.md !== null).length;
  const meta = `${noteCount} note${noteCount === 1 ? "" : "s"}` + (opts.canvases.length ? ` \xB7 ${opts.canvases.length} canvas${opts.canvases.length === 1 ? "" : "es"}` : "") + (opts.assetCount ? ` \xB7 ${opts.assetCount} asset${opts.assetCount === 1 ? "" : "s"}` : "");
  const gatedBadge = opts.gated ? `<div class="sidebar-badge"><span class="gated-pill" title="this share requires a token">gated</span></div>` : "";
  const desc = "";
  const downloadLink = opts.showDownload ? `<a class="sidebar-cta" href="${opts.shareBase}/download${tq}" download>Download Notes <sub>.zip</sub></a>` : `<a class="sidebar-cta" href="${opts.shareBase}${tq}">\u2190 back to overview</a>`;
  return `<aside class="wrap-sidebar" id="wrap-sidebar">
  <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle navigation">\u2630</button>
  <div class="sidebar-inner">
    <div class="sidebar-header">
      <div class="sidebar-title" role="heading" aria-level="2"><a href="${opts.shareBase}${tq}" class="sidebar-title-link">${escapeHtml(opts.title)}</a></div>
      ${gatedBadge}
      ${desc}
    </div>
    ${downloadLink}
    <div class="sidebar-search">
      <input type="search" id="sidebar-filter" class="sidebar-filter-input" placeholder="Filter files\u2026" autocomplete="off" spellcheck="false" aria-label="Filter files in sidebar">
      <button type="button" class="sidebar-filter-hint" id="sidebar-filter-hint" aria-label="Open command palette for full content search">
        <span class="sidebar-filter-hint-text">\u2318K for full search</span>
        <span class="sidebar-filter-hint-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14" stroke-linecap="round"/></svg></span>
      </button>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-section-title">Files <span class="sidebar-filter-empty" id="sidebar-filter-empty" hidden>\xB7 no matches</span></div>
      <div class="tree" id="sidebar-tree">${treeHtml}</div>
    </div>
    <div class="sidebar-meta">${meta}</div>
  </div>
</aside>`;
}
__name(renderTreeSidebar, "renderTreeSidebar");
var SIDEBAR_TOGGLE_JS = `<script>
(function(){
  var btn = document.getElementById("sidebar-toggle");
  var sb = document.getElementById("wrap-sidebar");
  var isMobile = matchMedia("(max-width: 760px)").matches;

  if (isMobile && sb) {
    // \u2500\u2500 Mobile: overlay drawer pattern \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // The existing sidebar-toggle (btn) stays INSIDE the drawer as the \u2715 close button.
    // A new \u2630 open button is created for the sticky topbar.
    if (btn) {
      btn.textContent = "\u2715";
      btn.setAttribute("aria-label", "Close navigation");
    }

    // Build sticky topbar: [\u2630 open btn] [vault title]
    var openBtn = document.createElement("button");
    openBtn.className = "mobile-menu-btn";
    openBtn.textContent = "\u2630";
    openBtn.setAttribute("aria-label", "Open navigation");
    openBtn.setAttribute("aria-expanded", "false");

    var topbar = document.createElement("div");
    topbar.className = "mobile-topbar";
    var titleEl = sb.querySelector(".sidebar-title");
    var titleText = titleEl ? titleEl.textContent || "" : "";
    var titleSpan = document.createElement("span");
    titleSpan.className = "mobile-topbar-title";
    titleSpan.textContent = titleText;
    topbar.appendChild(openBtn);
    topbar.appendChild(titleSpan);
    sb.parentNode.insertBefore(topbar, sb);

    // Backdrop
    var backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);

    function openDrawer() {
      sb.classList.add("open");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
      openBtn.setAttribute("aria-expanded", "true");
    }
    function closeDrawer() {
      sb.classList.remove("open");
      backdrop.classList.remove("active");
      document.body.style.overflow = "";
      openBtn.setAttribute("aria-expanded", "false");
    }

    openBtn.addEventListener("click", openDrawer);
    if (btn) btn.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);
    sb.querySelectorAll(".tree-file").forEach(function(a) {
      a.addEventListener("click", closeDrawer);
    });

  } else if (btn && sb) {
    // \u2500\u2500 Desktop: collapse sidebar to 48px icon rail \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    btn.setAttribute("aria-expanded", sb.classList.contains("collapsed") ? "false" : "true");
    btn.addEventListener("click", function(){
      sb.classList.toggle("collapsed");
      btn.setAttribute("aria-expanded", sb.classList.contains("collapsed") ? "false" : "true");
    });
  }

  document.querySelectorAll("[data-open-palette]").forEach(function(el){
    el.addEventListener("click", function(ev){
      ev.preventDefault();
      if (window.__brainshareOpenPalette) window.__brainshareOpenPalette();
    });
  });

  // \u2500\u2500 Sidebar filter (visible search bar above the tree) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Filters tree nodes as the user types. A folder stays visible if its name
  // matches OR any of its descendants match (and auto-expands when matches are
  // inside it). Matched substring gets <mark>-wrapped in the label.
  var input = document.getElementById("sidebar-filter");
  var tree  = document.getElementById("sidebar-tree");
  var empty = document.getElementById("sidebar-filter-empty");
  if (input && tree) {
    var fileRows = Array.prototype.slice.call(tree.querySelectorAll(".tree-file"));
    var folderRows = Array.prototype.slice.call(tree.querySelectorAll(".tree-folder"));
    // Cache the original folder open-state so we can restore it when the
    // filter is cleared \u2014 typing temporarily expands ancestors of matches.
    var originalOpen = new Map();
    folderRows.forEach(function(f){ originalOpen.set(f, f.hasAttribute("open")); });
    var labelCache = new Map();   // element \u2192 original textContent (so we can restore after un-marking)
    function cacheLabel(el) {
      if (!el) return "";
      if (labelCache.has(el)) return labelCache.get(el);
      var t = el.textContent || "";
      labelCache.set(el, t);
      return t;
    }
    function escHtml(s) { return s.replace(/[&<>"']/g, function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; }); }
    function renderLabel(el, original, q) {
      if (!q) { el.textContent = original; return; }
      var i = original.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) { el.textContent = original; return; }
      el.innerHTML = escHtml(original.slice(0,i)) + "<mark>" + escHtml(original.slice(i, i+q.length)) + "</mark>" + escHtml(original.slice(i+q.length));
    }
    function applyFilter(q) {
      q = (q || "").trim().toLowerCase();
      if (!q) {
        // restore everything
        fileRows.forEach(function(f){
          f.classList.remove("filter-hidden");
          var ln = f.querySelector(".tree-file-name");
          if (ln) renderLabel(ln, cacheLabel(ln), "");
        });
        folderRows.forEach(function(f){
          f.classList.remove("filter-hidden");
          var fn = f.querySelector(":scope > summary .tree-folder-name");
          if (fn) renderLabel(fn, cacheLabel(fn), "");
          if (originalOpen.get(f)) f.setAttribute("open", ""); else f.removeAttribute("open");
        });
        if (empty) empty.hidden = true;
        return;
      }
      // 1) mark each file as match / no-match
      var matchCount = 0;
      fileRows.forEach(function(row){
        var ln = row.querySelector(".tree-file-name");
        var label = cacheLabel(ln);
        var hit = label.toLowerCase().indexOf(q) !== -1;
        row.classList.toggle("filter-hidden", !hit);
        if (hit) { renderLabel(ln, label, q); matchCount++; }
        else if (ln) renderLabel(ln, label, "");
      });
      // 2) walk folders bottom-up: visible if any visible file/folder descendant
      //    OR own name matches. Auto-open visible folders so matches are seen.
      function folderHasVisibleDescendant(folder) {
        var descFiles = folder.querySelectorAll(":scope .tree-file");
        for (var i = 0; i < descFiles.length; i++) {
          if (!descFiles[i].classList.contains("filter-hidden")) return true;
        }
        return false;
      }
      folderRows.forEach(function(folder){
        var fn = folder.querySelector(":scope > summary .tree-folder-name");
        var name = cacheLabel(fn);
        var nameHit = name.toLowerCase().indexOf(q) !== -1;
        var anyVisible = nameHit || folderHasVisibleDescendant(folder);
        folder.classList.toggle("filter-hidden", !anyVisible);
        if (fn) renderLabel(fn, name, nameHit ? q : "");
        if (anyVisible) folder.setAttribute("open", "");
      });
      if (empty) empty.hidden = matchCount > 0;
    }
    var t = null;
    input.addEventListener("input", function(){
      clearTimeout(t);
      t = setTimeout(function(){ applyFilter(input.value); }, 60);
    });
    input.addEventListener("keydown", function(e){
      if (e.key === "Escape") { e.preventDefault(); input.value = ""; applyFilter(""); input.blur(); }
    });
  }

  // Scroll the active item into view inside the sidebar
  var active = sb && sb.querySelector(".tree-file.active");
  if (active) active.scrollIntoView({ block: "center" });
})();
<\/script>`;
function renderCommandPalette(opts) {
  const tq = opts.tokenQuery;
  const items = [];
  for (const n of opts.notes) {
    const folder = n.path.includes("/") ? n.path.split("/").slice(0, -1).join("/") : "";
    const fileName = n.path.split("/").pop()?.replace(/\.md$/i, "") ?? n.basename;
    items.push({
      kind: "note",
      id: n.ulid,
      label: n.title || fileName,
      hint: folder,
      href: `${opts.shareBase}/${n.ulid}${tq}`
    });
  }
  for (const c of opts.canvases) {
    const folder = c.path.includes("/") ? c.path.split("/").slice(0, -1).join("/") : "";
    const fileName = c.path.split("/").pop()?.replace(/\.canvas$/i, "") ?? c.basename;
    items.push({
      kind: "canvas",
      id: c.ulid,
      label: fileName,
      hint: folder,
      href: `${opts.shareBase}/c/${c.ulid}${tq}`
    });
  }
  items.unshift(
    { kind: "action", id: "back", label: "Back to overview", hint: "wrapper landing", href: `${opts.shareBase}${tq}` },
    { kind: "action", id: "download", label: "Download as .zip", hint: "full slice + assets", href: `${opts.shareBase}/download${tq}` },
    { kind: "action", id: "copy-link", label: "Copy share link", hint: "current page URL", action: "copy-link" }
  );
  if (opts.hasSidebar) {
    items.splice(2, 0, { kind: "action", id: "toggle-sidebar", label: "Toggle sidebar", hint: "show / hide files", action: "toggle-sidebar" });
  }
  return `<div class="cmd-palette" id="cmd-palette" hidden>
  <div class="cmd-palette-backdrop" id="cmd-backdrop"></div>
  <div class="cmd-palette-modal" role="dialog" aria-label="Command palette">
    <input type="text" id="cmd-input" class="cmd-input" placeholder="Search notes, canvases, actions\u2026 (\u2318K)" autocomplete="off" spellcheck="false">
    <div class="cmd-list" id="cmd-list"></div>
    <div class="cmd-footer">
      <span><kbd>\u2191\u2193</kbd> navigate</span>
      <span><kbd>\u21B5</kbd> open</span>
      <span><kbd>esc</kbd> close</span>
    </div>
  </div>
</div>
<div class="cmd-help" id="cmd-help" hidden>
  <div class="cmd-palette-backdrop" id="cmd-help-backdrop"></div>
  <div class="cmd-help-card">
    <h3>Keyboard shortcuts</h3>
    <table>
      <tr><td><kbd>\u2318K</kbd> / <kbd>Ctrl K</kbd> / <kbd>/</kbd></td><td>Open command palette</td></tr>
      <tr><td><kbd>?</kbd></td><td>Show this sheet</td></tr>
      ${opts.hasSidebar ? "<tr><td><kbd>[</kbd></td><td>Toggle sidebar</td></tr>" : ""}
      <tr><td><kbd>g</kbd> <kbd>h</kbd></td><td>Back to wrapper overview</td></tr>
      <tr><td><kbd>esc</kbd></td><td>Close any overlay</td></tr>
    </table>
    <p class="cmd-help-foot">On canvas pages: <kbd>=</kbd>/<kbd>-</kbd> zoom, <kbd>F</kbd> fit, <kbd>R</kbd> reset, <kbd>\u21E7F</kbd> fullscreen.</p>
  </div>
</div>
<script>
(function(){
  var ITEMS = ${JSON.stringify(items)};
  var SHARE_BASE = ${JSON.stringify(opts.shareBase + tq)};
  var palette = document.getElementById("cmd-palette");
  var input   = document.getElementById("cmd-input");
  var list    = document.getElementById("cmd-list");
  var help    = document.getElementById("cmd-help");
  if (!palette || !input || !list) return;

  var sel = 0;
  var filtered = ITEMS.slice();

  function open() {
    palette.hidden = false;
    input.value = "";
    sel = 0;
    filtered = ITEMS.slice();
    render();
    setTimeout(function(){ input.focus(); }, 0);
  }
  function close() { palette.hidden = true; }

  // Expose open() so non-keyboard callers (the sidebar's tap-to-search button
  // on touch devices, future toolbar items, etc.) can trigger the palette.
  window.__brainshareOpenPalette = open;
  document.getElementById("sidebar-filter-hint")?.addEventListener("click", function(e){
    e.preventDefault();
    open();
  });
  function openHelp() { if (help) help.hidden = false; }
  function closeHelp() { if (help) help.hidden = true; }

  // Expose openHelp so the page-chrome help button (rendered outside this
  // script's closure) can trigger the same sheet without a fake KeyboardEvent.
  window.__brainshareOpenHelp = openHelp;

  function score(item, q) {
    if (!q) return 0;
    var hay = (item.label + " " + (item.hint || "")).toLowerCase();
    var parts = q.toLowerCase().split(/\\s+/).filter(Boolean);
    for (var i = 0; i < parts.length; i++) if (hay.indexOf(parts[i]) === -1) return -1;
    // tiny ranking: prefer matches in label over hint, prefer prefix matches
    var label = item.label.toLowerCase();
    var s = 0;
    for (var j = 0; j < parts.length; j++) {
      if (label.indexOf(parts[j]) === 0) s += 3;
      else if (label.indexOf(parts[j]) !== -1) s += 1;
    }
    return s;
  }

  // Content-search results \u2014 populated by an async fetch to /api/search when
  // the query is 3+ chars. Held separately so the file/action match list stays
  // instant and the content section can show a "searching\u2026" affordance.
  var contentResults = [];
  var contentQuery = "";
  var contentLoading = false;
  var contentSeq = 0;     // monotonic so out-of-order responses get dropped
  var contentDebounce = null;

  function maybeFetchContent(q) {
    clearTimeout(contentDebounce);
    if (!q || q.length < 3) {
      contentResults = []; contentQuery = ""; contentLoading = false;
      return;
    }
    contentLoading = true;
    contentDebounce = setTimeout(function(){
      var seq = ++contentSeq;
      var url = SHARE_BASE.split("?")[0] + "/api/search" +
        (SHARE_BASE.indexOf("?") >= 0 ? SHARE_BASE.substring(SHARE_BASE.indexOf("?")) + "&" : "?") +
        "q=" + encodeURIComponent(q);
      fetch(url, { credentials: "same-origin" })
        .then(function(r){ return r.ok ? r.json() : { matches: [] }; })
        .then(function(data){
          if (seq !== contentSeq) return;     // stale response
          contentResults = (data && data.matches) || [];
          contentQuery = q;
          contentLoading = false;
          render();
        })
        .catch(function(){
          if (seq !== contentSeq) return;
          contentResults = []; contentLoading = false; render();
        });
    }, 250);
  }

  function render() {
    list.innerHTML = "";
    var q = input.value.trim();
    if (!q) {
      filtered = ITEMS.slice();
    } else {
      filtered = ITEMS
        .map(function(it){ return { it: it, s: score(it, q) }; })
        .filter(function(x){ return x.s >= 0; })
        .sort(function(a,b){ return b.s - a.s; })
        .map(function(x){ return x.it; });
    }
    // Content matches: anything from /api/search that isn't already a name-hit
    var nameHitIds = {};
    filtered.forEach(function(it){ if (it.id) nameHitIds[it.id] = true; });
    var contentItems = [];
    if (q && q.length >= 3 && contentQuery === q) {
      contentResults.forEach(function(m){
        if (nameHitIds[m.ulid]) return;   // don't repeat a name-hit
        contentItems.push({
          kind: "content",
          id: m.ulid,
          label: m.title,
          hint: m.path,
          snippet: m.snippet,
          href: SHARE_BASE.split("?")[0] + "/" + m.ulid +
            (SHARE_BASE.indexOf("?") >= 0 ? SHARE_BASE.substring(SHARE_BASE.indexOf("?")) : ""),
        });
      });
    }
    var combined = filtered.slice(0, 60).concat(contentItems);
    filtered = combined;
    if (sel >= filtered.length) sel = Math.max(0, filtered.length - 1);

    if (filtered.length === 0 && !contentLoading) {
      list.innerHTML = '<div class="cmd-empty">No matches.</div>';
      return;
    }

    var splitIndex = combined.length - contentItems.length;   // first content row index
    combined.forEach(function(it, i){
      // Section header before first content match
      if (i === splitIndex && contentItems.length > 0) {
        var hdr = document.createElement("div");
        hdr.className = "cmd-section";
        hdr.textContent = "Content matches \xB7 " + contentItems.length;
        list.appendChild(hdr);
      }
      var icon = it.kind === "canvas" ? "\u{1F5FA}" : it.kind === "action" ? "\u26A1" : it.kind === "content" ? "\u{1F50E}" : "\u{1F4C4}";
      var hint = it.hint ? '<span class="cmd-hint">' + escape(it.hint) + '</span>' : "";
      var snippetHtml = it.snippet
        ? '<div class="cmd-snippet">' + highlight(it.snippet, q) + '</div>'
        : "";
      var row = document.createElement("div");
      row.className = "cmd-item" + (i === sel ? " selected" : "");
      row.dataset.idx = i;
      row.innerHTML = '<div class="cmd-row-main">' +
          '<span class="cmd-icon">' + icon + '</span>' +
          '<span class="cmd-label">' + escape(it.label) + '</span>' +
          hint +
        '</div>' + snippetHtml;
      row.addEventListener("mouseenter", function(){ sel = i; updateSel(); });
      row.addEventListener("click", function(){ go(it); });
      list.appendChild(row);
    });
    if (contentLoading && contentQuery !== q) {
      var l = document.createElement("div");
      l.className = "cmd-loading";
      l.textContent = "Searching note bodies\u2026";
      list.appendChild(l);
    }
  }
  function highlight(text, q) {
    if (!q) return escape(text);
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return escape(text);
    return escape(text.slice(0,i)) + "<mark>" + escape(text.slice(i, i+q.length)) + "</mark>" + escape(text.slice(i+q.length));
  }
  function updateSel() {
    [].forEach.call(list.children, function(c, i){
      if (c.classList) c.classList.toggle("selected", i === sel);
    });
    var cur = list.children[sel];
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
    });
  }
  function go(it) {
    if (it.action === "toggle-sidebar") {
      var sb = document.getElementById("wrap-sidebar");
      if (sb) sb.classList.toggle("collapsed");
      close();
      return;
    }
    if (it.action === "copy-link") {
      navigator.clipboard?.writeText(location.href);
      close();
      return;
    }
    if (it.href) { window.location = it.href; close(); }
  }

  input.addEventListener("input", function(){
    sel = 0;
    maybeFetchContent(input.value.trim());
    render();
  });
  input.addEventListener("keydown", function(e){
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(filtered.length - 1, sel + 1); updateSel(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); updateSel(); }
    else if (e.key === "Enter")   { e.preventDefault(); var it = filtered[sel]; if (it) go(it); }
    else if (e.key === "Escape")  { e.preventDefault(); close(); }
  });
  document.getElementById("cmd-backdrop")?.addEventListener("click", close);
  document.getElementById("cmd-help-backdrop")?.addEventListener("click", closeHelp);

  // Global key bindings \u2014 guard against firing while typing in inputs/textareas.
  var lastG = 0;
  document.addEventListener("keydown", function(e){
    var t = e.target;
    var inField = t && /input|textarea|select/i.test(t.tagName);
    var isOpen = !palette.hidden;
    // \u2318K / Ctrl+K / "/" \u2014 open palette
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); isOpen ? close() : open();
      return;
    }
    if (e.key === "/" && !inField && !isOpen) { e.preventDefault(); open(); return; }
    if (inField || isOpen) return;
    if (e.key === "?") { e.preventDefault(); help && help.hidden ? openHelp() : closeHelp(); return; }
    if (e.key === "Escape") { closeHelp(); return; }
    if (e.key === "[") {
      var sb = document.getElementById("wrap-sidebar");
      if (sb) { e.preventDefault(); sb.classList.toggle("collapsed"); }
      return;
    }
    if (e.key === "g" || e.key === "G") { lastG = Date.now(); return; }
    if ((e.key === "h" || e.key === "H") && Date.now() - lastG < 800) {
      e.preventDefault(); window.location = SHARE_BASE;
    }
  });
})();
<\/script>`;
}
__name(renderCommandPalette, "renderCommandPalette");
function shareSetFromNotes(notes) {
  const m = /* @__PURE__ */ new Map();
  for (const n of notes) {
    if (n.md)
      m.set(n.basename, n.ulid);
  }
  return m;
}
__name(shareSetFromNotes, "shareSetFromNotes");
async function buildShareSet(notes, ulids) {
  return shareSetFromNotes(await loadNotes(notes, ulids));
}
__name(buildShareSet, "buildShareSet");
function buildEdges(records) {
  const setByBasename = shareSetFromNotes(records);
  const edges = [];
  const seen = /* @__PURE__ */ new Set();
  for (const r of records) {
    if (!r.md)
      continue;
    const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let m;
    while (m = re.exec(r.md)) {
      const target = m[1].trim();
      const targetUlid = setByBasename.get(target);
      if (targetUlid && targetUlid !== r.ulid) {
        const k = `${r.ulid}|${targetUlid}`;
        if (!seen.has(k)) {
          edges.push({ from: r.ulid, to: targetUlid });
          seen.add(k);
        }
      }
    }
  }
  return edges;
}
__name(buildEdges, "buildEdges");
function buildBacklinks(records) {
  const setByBasename = shareSetFromNotes(records);
  const byTarget = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const source of records) {
    if (!source.md)
      continue;
    const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let m;
    while (m = re.exec(source.md)) {
      const target = m[1].trim();
      const targetUlid = setByBasename.get(target);
      if (!targetUlid || targetUlid === source.ulid)
        continue;
      const k = `${targetUlid}|${source.ulid}`;
      if (seen.has(k))
        continue;
      seen.add(k);
      const list2 = byTarget.get(targetUlid) ?? [];
      list2.push({ ulid: source.ulid, basename: source.basename, path: source.path, title: source.title });
      byTarget.set(targetUlid, list2);
    }
  }
  return byTarget;
}
__name(buildBacklinks, "buildBacklinks");
function folderSiblings(current, all) {
  const folder = current.path.includes("/") ? current.path.split("/").slice(0, -1).join("/") : "";
  const siblings = all.filter((n) => {
    const f = n.path.includes("/") ? n.path.split("/").slice(0, -1).join("/") : "";
    return f === folder;
  }).sort((a, b) => a.basename.localeCompare(b.basename));
  const i = siblings.findIndex((n) => n.ulid === current.ulid);
  if (i < 0)
    return {};
  return {
    prev: i > 0 ? { ulid: siblings[i - 1].ulid, title: siblings[i - 1].title } : void 0,
    next: i < siblings.length - 1 ? { ulid: siblings[i + 1].ulid, title: siblings[i + 1].title } : void 0
  };
}
__name(folderSiblings, "folderSiblings");
function renderNote(md, ulid, ctx) {
  const { fm, body: rawBody } = parseFrontmatter(md);
  const bodyH1Match = rawBody.match(/^\s*#\s+(.+?)\s*$/m);
  const bodyH1 = bodyH1Match ? bodyH1Match[1].trim() : "";
  const fileTitle = ctx?.path?.split("/").pop()?.replace(/\.md$/i, "");
  const title = bodyH1 || fm?.byKey.get("title") || fileTitle || ulid;
  const tq = ctx?.tokenQuery ?? "";
  const dedupedBody = bodyH1Match ? rawBody.replace(bodyH1Match[0], "") : rawBody;
  const IMG_EXT = /\.(png|jpe?g|gif|svg|webp|avif|bmp)$/i;
  const assetUrl = /* @__PURE__ */ __name((filename) => {
    if (!ctx?.assets)
      return null;
    const direct = ctx.assets[filename] || ctx.assets[filename.split("/").pop() ?? filename];
    return direct && ctx.shareBase ? `${ctx.shareBase}/asset/${direct}` : null;
  }, "assetUrl");
  let preBody = dedupedBody.replace(
    /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_m, target, alias) => {
      const t = target.trim();
      const url = assetUrl(t);
      if (url)
        return `<img src="${escapeAttr(url)}" alt="${escapeAttr((alias ?? t).trim())}" class="embedded-image" loading="lazy">`;
      return `<span class="embed-missing" title="asset not in this share">[asset not shared]</span>`;
    }
  );
  preBody = preBody.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (m, alt, src) => {
      const s = src.trim();
      if (/^https?:\/\//i.test(s) || s.startsWith("/asset/"))
        return m;
      if (!IMG_EXT.test(s))
        return m;
      const url = assetUrl(s);
      return url ? `![${alt}](${url})` : m;
    }
  );
  const body = preBody.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_m, target, alias) => {
      const targetTrim = target.trim();
      const label = (alias ?? target).trim();
      if (ctx?.shareBase) {
        const noteUlid = ctx.shareSet?.get(targetTrim);
        if (noteUlid) {
          return `<a class="wikilink-internal" href="${ctx.shareBase}/${noteUlid}${tq}">${escapeHtml(label)}</a>`;
        }
        const canvasKey = targetTrim.replace(/\.canvas$/i, "");
        const canvasUlid = ctx.canvasSet?.get(canvasKey);
        if (canvasUlid) {
          return `<a class="wikilink-internal wikilink-canvas" href="${ctx.shareBase}/c/${canvasUlid}${tq}" title="canvas">${escapeHtml(label)}</a>`;
        }
      }
      return `<span class="wikilink-private" title="not in this published slice">[not shared]</span>`;
    }
  );
  const rawHtml = marked.parse(body, { async: false });
  const trimmedHtml = rawHtml.trim();
  const html3 = trimmedHtml.length > 0 ? rawHtml : `<div class="empty-note-placeholder">
        <p><em>This note has no content in the source vault.</em></p>
        <p class="setting-item-description">Only frontmatter (e.g. ULID, tags) is published \u2014 no body text was written. Open the source file in Obsidian to add content, then re-publish.</p>
      </div>`;
  const breadcrumb = renderBreadcrumb(ctx, title);
  const props = renderProperties(fm, ulid);
  const hasMermaid = /<code class="language-mermaid">/.test(html3);
  const tail = hasMermaid ? MERMAID_BOOTSTRAP : "";
  if (ctx?.wrapTree && ctx?.shareBase) {
    const sidebar = renderTreeSidebar({
      title: ctx.wrapTree.wrapTitle,
      description: ctx.wrapTree.wrapDesc,
      gated: ctx.gated,
      shareBase: ctx.shareBase,
      tokenQuery: ctx.tokenQuery ?? "",
      notes: ctx.wrapTree.notes.map((n) => ({ ...n, md: "" })),
      canvases: ctx.wrapTree.canvases,
      assetCount: ctx.wrapTree.assetCount,
      activeUlid: ulid,
      showDownload: false
    });
    const palette = renderCommandPalette({
      shareBase: ctx.shareBase,
      tokenQuery: ctx.tokenQuery ?? "",
      notes: ctx.wrapTree.notes,
      canvases: ctx.wrapTree.canvases,
      hasSidebar: true
    });
    const backlinksHtml = renderBacklinks(ctx);
    const folderNavHtml = renderFolderNav(ctx);
    const wrapTitle = ctx.wrapTree?.wrapTitle ?? "";
    const ogImage = `${ctx.shareBase}/${ulid}/og.svg${tq}`;
    const noteBody = md.replace(/^---[\s\S]*?\n---\s*\n/, "").replace(/^#[^\n]*\n/, "").trim();
    const noteExcerpt = noteBody.replace(/[#*_`[\]]/g, "").replace(/\s+/g, " ").slice(0, 160).trim();
    const ogDesc = noteExcerpt || (wrapTitle ? `From the "${wrapTitle}" brain share` : "Published via BrainShare");
    const pageUrl = `${ctx.shareBase}/${ulid}`;
    const fmCreated = fm?.byKey.get("created");
    const fmUpdated = fm?.byKey.get("updated");
    const fmAuthor = fm?.byKey.get("author");
    const articleLd = buildArticleLd({
      headline: title,
      datePublished: typeof fmCreated === "string" ? fmCreated : void 0,
      dateModified: typeof fmUpdated === "string" ? fmUpdated : typeof fmCreated === "string" ? fmCreated : void 0,
      author: typeof fmAuthor === "string" ? fmAuthor : void 0,
      pageUrl
    });
    const fmTags = fm?.byKey.get("tags");
    const tagList = Array.isArray(fmTags) ? fmTags : typeof fmTags === "string" ? [fmTags] : [];
    const isFaq = /\bfaq\b/i.test(title) || tagList.some((t) => /^faq$/i.test(t));
    const faqLd = isFaq ? buildFaqLd(noteBody) : "";
    const jsonLd = articleLd + faqLd;
    const bodyForCount2 = md.replace(/^---[\s\S]*?\n---\s*\n/, "").replace(/[#*_`[\]]/g, "");
    const wordCount2 = (bodyForCount2.match(/\b\w+\b/g) ?? []).length;
    const readMinutes2 = Math.max(1, Math.round(wordCount2 / 200));
    const readingMeta2 = `<div class="note-reading-meta"><span class="rmeta-time">${readMinutes2} min read</span><span class="rmeta-sep">\xB7</span><span class="rmeta-words">${wordCount2.toLocaleString()} words</span></div>`;
    return shell({ title, sidebarLayout: true, hasHelp: true, meta: { ogImage, ogTitle: title, ogDescription: ogDesc, pageUrl, jsonLd }, body: `
${sidebar}
<main class="wrap-main">
  <article class="prose">
    ${breadcrumb}
    ${renderNoteActions()}
    <h1>${escapeHtml(title)}</h1>
    ${readingMeta2}
    ${props}
    ${html3}
    ${backlinksHtml}
    ${folderNavHtml}
  </article>
  ${tail}
</main>
${SIDEBAR_TOGGLE_JS}
${NOTE_ACTIONS_JS}
${STICKINESS_JS}
${READ_PROGRESS_JS}
${WIKILINK_PREVIEW_JS}
${NOTE_TOC_JS}
${palette}
` });
  }
  const bodyForCount = md.replace(/^---[\s\S]*?\n---\s*\n/, "").replace(/[#*_`[\]]/g, "");
  const wordCount = (bodyForCount.match(/\b\w+\b/g) ?? []).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));
  const readingMeta = `<div class="note-reading-meta"><span class="rmeta-time">${readMinutes} min read</span><span class="rmeta-sep">\xB7</span><span class="rmeta-words">${wordCount.toLocaleString()} words</span></div>`;
  const fmCreatedSa = fm?.byKey.get("created");
  const fmUpdatedSa = fm?.byKey.get("updated");
  const fmAuthorSa = fm?.byKey.get("author");
  const articleLdSa = buildArticleLd({
    headline: title,
    datePublished: typeof fmCreatedSa === "string" ? fmCreatedSa : void 0,
    dateModified: typeof fmUpdatedSa === "string" ? fmUpdatedSa : typeof fmCreatedSa === "string" ? fmCreatedSa : void 0,
    author: typeof fmAuthorSa === "string" ? fmAuthorSa : void 0
  });
  return shell({ title, meta: { jsonLd: articleLdSa }, body: `
${breadcrumb}
<h1>${escapeHtml(title)}</h1>
${readingMeta}
${props}
${html3}
${tail}
${STICKINESS_JS}
` });
}
__name(renderNote, "renderNote");
var MERMAID_BOOTSTRAP = `<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
// Always use the default (light) theme. We don't switch to "dark" based on
// prefers-color-scheme because the SVG render is one-shot \u2014 if the user
// toggles their OS theme later, the SVG colours can't update, which makes
// the diagram unreadable on the new background. The .mermaid-host /
// .mermaid-modal-stage CSS pins the surrounding background to white in
// both light and dark mode to match.
mermaid.initialize({
  startOnLoad: false, theme: "default", securityLevel: "loose",
  // v11 caps diagrams at 500 edges / 50k chars and refuses to render past that;
  // lift the ceilings so large architecture flowcharts still render.
  maxEdges: 2000, maxTextSize: 200000,
  // Tighter default flowchart layout (v11 dagre) so wide graphs don't sprawl;
  // per-diagram %%{init}%% directives can still override these.
  flowchart: { useMaxWidth: true, htmlLabels: true, nodeSpacing: 45, rankSpacing: 55, curve: "basis" },
});

// Pull a human-readable label from the diagram source. Mermaid sources commonly
// open with a directive line like "sequenceDiagram" / "graph TD" / "flowchart LR";
// the most useful title is usually the first non-directive non-empty line, which
// is often the diagram's first node label or a "%% comment" header.
function diagramTitle(src) {
  const lines = src.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return "Diagram";
  const directive = /^(sequenceDiagram|graph\\b|flowchart\\b|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|xychart\\b)/i;
  for (const line of lines) {
    if (line.startsWith("%%")) {
      // Skip mermaid config/init directives like %%{init: ...}%% \u2014 they configure
      // the diagram, they're not a human title. (Without this, a leading
      // %%{init}%% directive becomes the displayed title.)
      if (line.startsWith("%%{")) continue;
      const cleaned = line.replace(/^%%\\s*/, "").slice(0, 80);
      if (cleaned) return cleaned;
    }
    if (!directive.test(line)) return line.slice(0, 80);
  }
  return lines[0].slice(0, 80);
}

// 1) Replace <pre><code class="language-mermaid"> blocks with .mermaid-host > .mermaid
document.querySelectorAll("pre > code.language-mermaid").forEach((el) => {
  const code = el.textContent;
  const host = document.createElement("div");
  host.className = "mermaid-host";
  host.dataset.title = diagramTitle(code);
  const inner = document.createElement("div");
  inner.className = "mermaid";
  inner.textContent = code;
  host.appendChild(inner);
  const actions = document.createElement("div");
  actions.className = "mermaid-actions";
  actions.innerHTML = '<button class="mermaid-btn" type="button" title="Open in viewer (or click the diagram)" aria-label="Open in viewer">\u26F6</button>';
  host.appendChild(actions);
  el.parentElement.replaceWith(host);
});

// 2) Render
await mermaid.run().catch(e => console.warn("mermaid:", e));

// 3) Wire up click-to-expand on each rendered host
const modal = (() => {
  const m = document.createElement("div");
  m.className = "mermaid-modal";
  m.innerHTML = \`
    <div class="mermaid-modal-bar">
      <div class="mermaid-modal-title"></div>
      <div class="mermaid-controls">
        <button data-act="out" title="Zoom out (\u2013)">\u2212</button>
        <button data-act="in" title="Zoom in (+)">+</button>
        <button data-act="fit" title="Fit to screen (F)">\u26F6 Fit</button>
        <button data-act="reset" title="Reset (R)">\u2316 1:1</button>
        <button data-act="close" title="Close (Esc)">\u2715</button>
      </div>
    </div>
    <div class="mermaid-modal-stage"></div>
    <div class="mermaid-modal-hint">Scroll to zoom \xB7 drag to pan \xB7 Esc to close</div>
  \`;
  document.body.appendChild(m);
  return m;
})();
const stage = modal.querySelector(".mermaid-modal-stage");

let scale = 1, tx = 0, ty = 0, currentSvg = null;
function applyTransform() {
  if (currentSvg) currentSvg.style.transform = \`translate(\${tx}px,\${ty}px) scale(\${scale})\`;
}
function fit() {
  if (!currentSvg) return;
  const bb = currentSvg.getBoundingClientRect();
  // Read intrinsic size from viewBox or width/height attributes
  const vb = currentSvg.viewBox && currentSvg.viewBox.baseVal;
  const w = (vb && vb.width) || currentSvg.getBBox().width || bb.width;
  const h = (vb && vb.height) || currentSvg.getBBox().height || bb.height;
  const sw = stage.clientWidth, sh = stage.clientHeight;
  const pad = 40;
  scale = Math.min((sw - pad) / w, (sh - pad) / h, 4);
  if (!isFinite(scale) || scale <= 0) scale = 1;
  tx = (sw - w * scale) / 2;
  ty = (sh - h * scale) / 2;
  applyTransform();
}
function open(svg, title) {
  // Clone so the inline diagram keeps its own copy
  const clone = svg.cloneNode(true);
  clone.removeAttribute("style");
  stage.replaceChildren(clone);
  currentSvg = clone;
  modal.querySelector(".mermaid-modal-title").textContent = title || "Diagram";
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(fit);
}
function close() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
  stage.replaceChildren();
  currentSvg = null;
}

document.querySelectorAll(".mermaid-host").forEach((host) => {
  const svg = host.querySelector("svg");
  if (!svg) return;
  const inner = host.querySelector(".mermaid");
  const onActivate = (ev) => { ev.preventDefault(); open(svg, host.dataset.title || ""); };
  inner.addEventListener("click", onActivate);
  host.querySelector(".mermaid-btn")?.addEventListener("click", onActivate);
});

// Modal interactions
modal.querySelector(".mermaid-controls").addEventListener("click", (e) => {
  const act = e.target?.dataset?.act;
  if (!act) return;
  if (act === "in") { scale = Math.min(scale * 1.25, 8); applyTransform(); }
  else if (act === "out") { scale = Math.max(scale / 1.25, 0.1); applyTransform(); }
  else if (act === "reset") { scale = 1; tx = 0; ty = 0; applyTransform(); }
  else if (act === "fit") { fit(); }
  else if (act === "close") { close(); }
});

stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  const cx = e.clientX - r.left, cy = e.clientY - r.top;
  const factor = Math.exp(-e.deltaY * 0.0015);
  const newScale = Math.max(0.1, Math.min(8, scale * factor));
  // cursor-anchored zoom
  tx = cx - (cx - tx) * (newScale / scale);
  ty = cy - (cy - ty) * (newScale / scale);
  scale = newScale;
  applyTransform();
}, { passive: false });

let dragStart = null;
stage.addEventListener("mousedown", (e) => {
  dragStart = { x: e.clientX - tx, y: e.clientY - ty };
  stage.classList.add("dragging");
});
window.addEventListener("mousemove", (e) => {
  if (!dragStart) return;
  tx = e.clientX - dragStart.x;
  ty = e.clientY - dragStart.y;
  applyTransform();
});
window.addEventListener("mouseup", () => {
  dragStart = null;
  stage.classList.remove("dragging");
});

// Touch pan + pinch
let touchStart = null;
stage.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    touchStart = { type: "pan", x: e.touches[0].clientX - tx, y: e.touches[0].clientY - ty };
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    touchStart = { type: "pinch", dist: Math.hypot(dx, dy), scale };
  }
}, { passive: true });
stage.addEventListener("touchmove", (e) => {
  if (!touchStart) return;
  if (touchStart.type === "pan" && e.touches.length === 1) {
    tx = e.touches[0].clientX - touchStart.x;
    ty = e.touches[0].clientY - touchStart.y;
    applyTransform();
  } else if (touchStart.type === "pinch" && e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    scale = Math.max(0.1, Math.min(8, touchStart.scale * dist / touchStart.dist));
    applyTransform();
  }
  e.preventDefault();
}, { passive: false });
stage.addEventListener("touchend", () => { touchStart = null; });

// Keyboard
window.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("open")) return;
  if (e.key === "Escape") close();
  else if (e.key === "+" || e.key === "=") { scale = Math.min(scale * 1.25, 8); applyTransform(); }
  else if (e.key === "-") { scale = Math.max(scale / 1.25, 0.1); applyTransform(); }
  else if (e.key.toLowerCase() === "f") fit();
  else if (e.key.toLowerCase() === "r") { scale = 1; tx = 0; ty = 0; applyTransform(); }
});

// Click backdrop to close
modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
<\/script>`;
function renderNoteActions() {
  return `<div class="note-actions" data-note-actions>
    <button class="note-action-btn" data-action="search" title="Search this share (\u2318K)">
      <span>Search</span>
    </button>
    <button class="note-action-btn" data-action="copy-link" title="Copy a link to this note">
      <span>Copy link</span>
    </button>
    <button class="note-action-btn" data-action="copy-md" title="Copy the note's source as Markdown">
      <span>Copy as Markdown</span>
    </button>
  </div>`;
}
__name(renderNoteActions, "renderNoteActions");
var NOTE_ACTIONS_JS = `<script>
(function(){
  var row = document.querySelector("[data-note-actions]");
  if (!row) return;
  function flash(btn, ok, msg) {
    var label = btn.querySelector("span:last-child");
    if (!label) return;
    var original = label.textContent;
    label.textContent = msg || (ok ? "Copied!" : "Failed");
    btn.dataset.flash = ok ? "ok" : "err";
    setTimeout(function(){ label.textContent = original; delete btn.dataset.flash; }, 1400);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for older browsers / non-https
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e2) {}
      document.body.removeChild(ta);
      return ok;
    }
  }
  row.addEventListener("click", async function(ev){
    var btn = ev.target.closest && ev.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.dataset.action;
    if (action === "search") {
      if (window.__brainshareOpenPalette) window.__brainshareOpenPalette();
      return;
    }
    if (action === "copy-link") {
      var ok = await copy(window.location.href);
      flash(btn, ok);
      return;
    }
    if (action === "copy-md") {
      // Use the full current URL so the scoped route handles ?raw=1 correctly.
      var rawHref = window.location.href;
      var sep = rawHref.indexOf("?") >= 0 ? "&" : "?";
      var rawUrl = rawHref + sep + "raw=1";
      // Safari requires ClipboardItem + Promise to keep the user-gesture alive
      // across an async fetch. Without this pattern, Safari rejects the write
      // after the await because it considers the gesture "consumed".
      if (navigator.clipboard && window.ClipboardItem) {
        var blobPromise = fetch(rawUrl)
          .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
          .then(function(t){ return new Blob([t], {type:"text/plain"}); });
        try {
          await navigator.clipboard.write([new ClipboardItem({"text/plain": blobPromise})]);
          flash(btn, true, "Copied!");
        } catch(e) {
          flash(btn, false, "Failed");
        }
        return;
      }
      // Fallback path for browsers without ClipboardItem support
      try {
        var resp = await fetch(rawUrl);
        if (!resp.ok) { flash(btn, false, "Fetch " + resp.status); return; }
        var text = await resp.text();
        var ok = await copy(text);
        flash(btn, ok, ok ? "Copied " + text.length + " chars" : "Failed");
      } catch (e) {
        flash(btn, false, "Network error");
      }
      return;
    }
  });
})();
<\/script>`;
var READ_PROGRESS_JS = `<script>
(function(){
  var bar = document.createElement('div');
  bar.className = 'read-progress';
  document.body.appendChild(bar);
  function update(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (max <= 0) { bar.style.width = '0'; return; }
    var pct = Math.min(100, Math.max(0, (h.scrollTop || document.body.scrollTop) / max * 100));
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
<\/script>`;
var STICKINESS_JS = `<script>
(function(){
  var STORAGE_VISITED = 'brainshare_visited_v1';
  var STORAGE_LAST_VISIT = 'brainshare_last_visit_v1';
  function safeGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function safeSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

  // Decode ULID's leading 10 chars to a unix ms timestamp.
  // Crockford base32: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
  var ULID_ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function ulidTime(ulid){
    if (!ulid || ulid.length < 10) return 0;
    var t = 0;
    for (var i = 0; i < 10; i++) {
      var c = ulid.charAt(i).toUpperCase();
      var v = ULID_ALPHA.indexOf(c);
      if (v < 0) return 0;
      t = t * 32 + v;
    }
    return t;
  }

  // Visited-set: JSON array of ULIDs (cap at 500 to bound storage)
  function getVisited(){
    try { return JSON.parse(safeGet(STORAGE_VISITED) || '[]'); }
    catch(e) { return []; }
  }
  function markVisited(ulid){
    if (!ulid) return;
    var list = getVisited();
    if (list.indexOf(ulid) >= 0) return;
    list.push(ulid);
    if (list.length > 500) list = list.slice(-500);
    safeSet(STORAGE_VISITED, JSON.stringify(list));
  }

  // Detect if we're on a note page (path has /share/:id/:ulid)
  var ulidMatch = location.pathname.match(/\\/share\\/[^/]+\\/([0-9A-HJKMNP-TV-Z]{26})$/);
  if (ulidMatch) {
    markVisited(ulidMatch[1]);
  }

  // On landing page, apply read-state + new-since-visit classes to tiles
  var noteLinks = document.querySelectorAll('.note-list a[data-ulid]');
  if (noteLinks.length > 0) {
    var visited = getVisited();
    var visitedSet = {};
    for (var i = 0; i < visited.length; i++) visitedSet[visited[i]] = true;
    var lastVisit = parseInt(safeGet(STORAGE_LAST_VISIT) || '0', 10);
    var hasNew = false;
    noteLinks.forEach(function(a){
      var ulid = a.getAttribute('data-ulid');
      if (!ulid) return;
      if (visitedSet[ulid]) a.classList.add('is-read');
      if (lastVisit > 0 && ulidTime(ulid) > lastVisit) {
        a.classList.add('is-new');
        hasNew = true;
      }
    });
    // Update last-visit AFTER applying classes (next visit will compare against now)
    safeSet(STORAGE_LAST_VISIT, String(Date.now()));
  }

  // Also apply read-state in the sidebar tree on note pages
  var treeLinks = document.querySelectorAll('.tree-file[data-ulid]');
  if (treeLinks.length > 0) {
    var visited2 = getVisited();
    var vs2 = {};
    for (var j = 0; j < visited2.length; j++) vs2[visited2[j]] = true;
    treeLinks.forEach(function(a){
      var u = a.getAttribute('data-ulid');
      if (u && vs2[u]) a.classList.add('is-read');
    });
  }
})();
<\/script>`;
var WIKILINK_PREVIEW_JS = `<script>
(function(){
  var cache = {};            // href -> { title, body }
  var pending = {};          // href -> Promise (dedupe in-flight requests)
  var popover = null;
  var showTimer = null;
  var hideTimer = null;
  var currentAnchor = null;

  function ensurePopover(){
    if (popover) return popover;
    popover = document.createElement('div');
    popover.className = 'wikilink-preview';
    document.body.appendChild(popover);
    popover.addEventListener('mouseenter', function(){
      // Keep open if mouse moves into popover
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    });
    popover.addEventListener('mouseleave', function(){ hide(); });
    return popover;
  }

  function extractTitle(md){
    // First H1 in body wins, else first non-empty line
    var stripped = md.replace(/^---[\\s\\S]*?\\n---\\s*\\n/, '');
    var h1 = stripped.match(/^\\s*#\\s+(.+?)\\s*$/m);
    if (h1) return h1[1].trim();
    var firstLine = stripped.split('\\n').find(function(l){ return l.trim().length > 0; });
    return firstLine ? firstLine.trim().slice(0, 80) : '';
  }
  function extractBody(md){
    var stripped = md.replace(/^---[\\s\\S]*?\\n---\\s*\\n/, '').replace(/^#[^\\n]*\\n/, '').trim();
    return stripped.replace(/[#*_\`\\[\\]]/g, '').replace(/\\s+/g, ' ').slice(0, 280);
  }

  function fetchExcerpt(href){
    // href like /share/:wrapId/:ulid?t=JWT \u2014 append &raw=1 (or ?raw=1)
    var sep = href.indexOf('?') >= 0 ? '&' : '?';
    var url = href + sep + 'raw=1';
    if (pending[href]) return pending[href];
    pending[href] = fetch(url).then(function(r){
      if (!r.ok) throw new Error('http ' + r.status);
      return r.text();
    }).then(function(md){
      var entry = { title: extractTitle(md), body: extractBody(md) };
      cache[href] = entry;
      delete pending[href];
      return entry;
    }).catch(function(e){
      delete pending[href];
      throw e;
    });
    return pending[href];
  }

  function position(anchor){
    var rect = anchor.getBoundingClientRect();
    var pop = ensurePopover();
    var pw = pop.offsetWidth || 280;
    var ph = pop.offsetHeight || 100;
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = (spaceBelow >= ph + 12 || rect.top < ph + 12)
      ? rect.bottom + window.scrollY + 6
      : rect.top + window.scrollY - ph - 6;
    var left = rect.left + window.scrollX;
    // Clamp horizontally to viewport
    var maxLeft = window.scrollX + window.innerWidth - pw - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  }

  function render(entry){
    var pop = ensurePopover();
    var titleHtml = entry.title ? '<div class="wikilink-preview-title">' + escape(entry.title) + '</div>' : '';
    var bodyHtml = entry.body ? '<div class="wikilink-preview-body">' + escape(entry.body) + '</div>' : '<div class="wikilink-preview-body" style="font-style:italic;opacity:.6">No content</div>';
    pop.innerHTML = titleHtml + bodyHtml;
  }

  function escape(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function show(anchor){
    var href = anchor.getAttribute('href');
    if (!href) return;
    currentAnchor = anchor;
    var pop = ensurePopover();
    if (cache[href]) {
      render(cache[href]);
      position(anchor);
      pop.classList.add('visible');
      return;
    }
    // Loading state
    pop.innerHTML = '<div class="wikilink-preview-body" style="font-style:italic;opacity:.6">Loading\u2026</div>';
    position(anchor);
    pop.classList.add('visible');
    fetchExcerpt(href).then(function(entry){
      if (currentAnchor !== anchor) return;
      render(entry);
      position(anchor);
    }).catch(function(){
      if (currentAnchor !== anchor) return;
      pop.innerHTML = '<div class="wikilink-preview-body" style="font-style:italic;opacity:.5">Preview unavailable</div>';
    });
  }

  function hide(){
    if (popover) popover.classList.remove('visible');
    currentAnchor = null;
  }

  document.addEventListener('mouseover', function(ev){
    var a = ev.target.closest && ev.target.closest('a.wikilink-internal');
    if (!a) return;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(function(){ show(a); }, 320);
  });
  document.addEventListener('mouseout', function(ev){
    var a = ev.target.closest && ev.target.closest('a.wikilink-internal');
    if (!a) return;
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    hideTimer = setTimeout(hide, 180);
  });
})();
<\/script>`;
function renderBacklinks(ctx) {
  const links = ctx?.backlinks ?? [];
  if (!links.length)
    return "";
  const shareBase = ctx?.shareBase ?? "";
  const tq = ctx?.tokenQuery ?? "";
  const items = links.sort((a, b) => a.title.localeCompare(b.title)).map((b) => {
    const folder = b.path.includes("/") ? b.path.split("/").slice(0, -1).join("/") : "";
    const folderHint = folder ? `<span class="backlink-folder">${escapeHtml(folder)}</span>` : "";
    return `<li><a href="${shareBase}/${b.ulid}${tq}"><span class="backlink-title">${escapeHtml(b.title)}</span>${folderHint}</a></li>`;
  }).join("");
  return `<aside class="note-backlinks" aria-labelledby="backlinks-heading">
    <h2 id="backlinks-heading" class="note-backlinks-heading">
      Notes that link here <span class="backlinks-count">${links.length}</span>
    </h2>
    <ul class="note-backlinks-list">${items}</ul>
  </aside>`;
}
__name(renderBacklinks, "renderBacklinks");
function renderFolderNav(ctx) {
  const nav = ctx?.folderNav;
  if (!nav || !nav.prev && !nav.next)
    return "";
  const shareBase = ctx?.shareBase ?? "";
  const tq = ctx?.tokenQuery ?? "";
  const prev = nav.prev ? `<a class="folder-nav-link folder-nav-prev" href="${shareBase}/${nav.prev.ulid}${tq}">
        <span class="folder-nav-dir">\u2190 Previous</span>
        <span class="folder-nav-title">${escapeHtml(nav.prev.title)}</span>
      </a>` : `<span class="folder-nav-placeholder"></span>`;
  const next = nav.next ? `<a class="folder-nav-link folder-nav-next" href="${shareBase}/${nav.next.ulid}${tq}">
        <span class="folder-nav-dir">Next \u2192</span>
        <span class="folder-nav-title">${escapeHtml(nav.next.title)}</span>
      </a>` : `<span class="folder-nav-placeholder"></span>`;
  return `<nav class="folder-nav" aria-label="Folder navigation">${prev}${next}</nav>`;
}
__name(renderFolderNav, "renderFolderNav");
var NOTE_TOC_JS = `<script>
(function(){
  var article = document.querySelector("article.prose");
  if (!article) return;
  var heads = article.querySelectorAll("h2, h3");
  if (heads.length < 3) return;
  // Assign stable ids
  var seen = {};
  function slug(text) {
    var s = (text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!s) s = "section";
    var base = s, i = 1;
    while (seen[s]) { s = base + "-" + (++i); }
    seen[s] = true;
    return s;
  }
  var items = [];
  heads.forEach(function(h){
    if (!h.id) h.id = slug(h.textContent);
    items.push({ id: h.id, text: h.textContent || "", level: h.tagName === "H3" ? 3 : 2 });
  });
  var toc = document.createElement("nav");
  toc.className = "note-toc";
  toc.setAttribute("aria-label", "On this page");
  var html = '<div class="note-toc-title">On this page</div><ol class="note-toc-list">';
  items.forEach(function(it){
    html += '<li class="note-toc-item note-toc-l' + it.level + '"><a href="#' + it.id + '">' + (it.text.replace(/</g, "&lt;")) + '</a></li>';
  });
  html += '</ol>';
  toc.innerHTML = html;
  article.parentElement.appendChild(toc);
  // Highlight the section currently in view
  if (typeof IntersectionObserver !== "undefined") {
    var links = {};
    toc.querySelectorAll("a").forEach(function(a){ links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var a = links[e.target.id];
        if (!a) return;
        if (e.isIntersecting) a.classList.add("active"); else a.classList.remove("active");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    heads.forEach(function(h){ io.observe(h); });
  }
})();
<\/script>`;
function renderBreadcrumb(ctx, title) {
  const scoped = !!ctx?.shareBase;
  const tq = ctx?.tokenQuery ?? "";
  const back = scoped ? `<a href="${ctx.shareBase}${tq}">\u2190 share</a><span class="sep">/</span>` : "";
  const folderSegments = [];
  if (ctx?.path) {
    const parts = ctx.path.split("/").slice(0, -1);
    for (let i = 0; i < parts.length; i++) {
      const folderPath = parts.slice(0, i + 1).join("/");
      const slug = folderPath.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const text = escapeHtml(parts[i]);
      const seg = scoped ? `<a href="${ctx.shareBase}${tq}#folder-${slug}">${text}</a>` : text;
      folderSegments.push(seg);
    }
  }
  const folderPart = folderSegments.length ? `${folderSegments.join('<span class="sep">/</span>')}<span class="sep">/</span>` : "";
  const badge = !scoped ? `<span class="scope-badge">standalone</span>` : ctx?.gated ? `<span class="scope-badge gated-badge">gated</span>` : `<span class="scope-badge">scoped to share</span>`;
  return `<div class="breadcrumb">${back}${folderPart}<span>${escapeHtml(title)}</span>${badge}</div>`;
}
__name(renderBreadcrumb, "renderBreadcrumb");
function renderProperties(fm, ulid) {
  const rows = [];
  if (fm) {
    for (const { key, value } of fm.fields) {
      const icon = PROP_ICON[key] ?? PROP_ICON.default;
      const valHtml = renderFmValue(key, value);
      rows.push(`<div class="prop-row"><span class="prop-key">${icon}${escapeHtml(key)}</span><span class="prop-val">${valHtml}</span></div>`);
    }
  }
  if (!fm || !fm.byKey.has("id")) {
    rows.push(`<div class="prop-row"><span class="prop-key">${PROP_ICON.id}id</span><span class="prop-val"><code>${ulid}</code></span></div>`);
  }
  const count = rows.length;
  return `<details class="properties" open>
    <summary class="properties-summary">
      <span class="properties-summary-label">Properties</span>
      <span class="properties-summary-count">${count}</span>
    </summary>
    <div class="properties-body">${rows.join("")}</div>
  </details>`;
}
__name(renderProperties, "renderProperties");
function renderFmValue(key, value) {
  if (Array.isArray(value)) {
    return value.map((v) => `<span class="chip">${escapeHtml(v)}</span>`).join("");
  }
  if (/^https?:\/\//.test(value)) {
    return `<a href="${escapeAttr(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
  }
  if (key === "id") {
    return `<code>${escapeHtml(value)}</code>`;
  }
  return escapeHtml(value);
}
__name(renderFmValue, "renderFmValue");
async function renderWrapper(notes, origin, wrapId, wrap, tokenQuery = "") {
  const records = await loadNotes(notes, wrap.ulids);
  const edges = buildEdges(records);
  const shareBase = `${origin}/share/${wrapId}`;
  const tq = tokenQuery;
  const canvasMetas = await Promise.all((wrap.canvases ?? []).map(async (u) => {
    const raw = await notes.get(`canvasmeta:${u}`);
    let path = u, basename = u;
    if (raw) {
      try {
        const m = JSON.parse(raw);
        path = m.path;
        basename = m.basename;
      } catch {
      }
    }
    return { ulid: u, path, basename };
  }));
  const groups = /* @__PURE__ */ new Map();
  for (const r of records) {
    const folder = r.path.includes("/") ? r.path.split("/").slice(0, -1).join("/") : "";
    if (!groups.has(folder))
      groups.set(folder, []);
    groups.get(folder).push(r);
  }
  const folderOrder = [...groups.keys()].sort((a, b) => {
    if (a === "" && b !== "")
      return 1;
    if (b === "" && a !== "")
      return -1;
    return a.localeCompare(b);
  });
  const folderSections = folderOrder.map((folder) => {
    const slug = folder ? folder.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "root";
    const heading2 = folder ? `<h3 class="folder-heading" id="folder-${slug}"><span class="folder-icon"></span>${escapeHtml(folder)}<span class="folder-count">${groups.get(folder).length}</span></h3>` : `<h3 class="folder-heading" id="folder-root"><span class="folder-icon"></span>vault root<span class="folder-count">${groups.get(folder).length}</span></h3>`;
    const lis = groups.get(folder).map((r) => {
      const cls = r.md ? "" : "missing";
      return `<li class="${cls}"><a href="${shareBase}/${r.ulid}${tq}" title="${r.ulid}" data-ulid="${r.ulid}"><span class="title">${escapeHtml(r.title)}</span></a></li>`;
    });
    return `${heading2}<ul class="note-list">${lis.join("")}</ul>`;
  });
  const recentRecords = [...records].filter((r) => r.md).sort((a, b) => b.ulid.localeCompare(a.ulid)).slice(0, 6);
  function ulidToDate(u) {
    const alpha = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let t = 0;
    for (let i = 0; i < 10; i++) {
      const v = alpha.indexOf(u.charAt(i).toUpperCase());
      if (v < 0)
        return "";
      t = t * 32 + v;
    }
    const d = new Date(t);
    return d.toISOString().slice(0, 10);
  }
  __name(ulidToDate, "ulidToDate");
  function noteExcerpt(md) {
    const body = md.replace(/^---[\s\S]*?\n---\s*\n/, "").replace(/^#[^\n]*\n/, "").trim();
    return body.replace(/[#*_`[\]>]/g, "").replace(/\s+/g, " ").slice(0, 110).trim();
  }
  __name(noteExcerpt, "noteExcerpt");
  function noteFolder(p) {
    if (!p.includes("/"))
      return "vault root";
    return p.split("/").slice(0, -1).join(" / ");
  }
  __name(noteFolder, "noteFolder");
  function noteWordCount(md) {
    const body = md.replace(/^---[\s\S]*?\n---\s*\n/, "");
    return (body.match(/\b\w+\b/g) ?? []).length;
  }
  __name(noteWordCount, "noteWordCount");
  const recentHtml = recentRecords.length > 0 ? `<section class="recently-updated"><h2 class="recently-updated-heading">Recently updated</h2><ul class="recently-updated-list-v2">${recentRecords.slice(0, 4).map((r) => {
    const folder = noteFolder(r.path);
    const wc = noteWordCount(r.md ?? "");
    const minutes = Math.max(1, Math.round(wc / 200));
    return `<li><a href="${shareBase}/${r.ulid}${tq}" data-ulid="${r.ulid}">
          <div class="ru-card-title">${escapeHtml(r.title)}</div>
          ${folder ? `<div class="ru-card-folder">${escapeHtml(folder)}</div>` : ""}
          <div class="ru-card-meta"><span>${ulidToDate(r.ulid)}</span><span class="ru-card-dot">\xB7</span><span>${minutes} min</span></div>
        </a></li>`;
  }).join("")}</ul></section>` : "";
  const folderChips = folderOrder.filter((f) => f !== "").map((folder) => {
    const slug = folder.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `<a class="folder-chip" href="#folder-${slug}">${escapeHtml(folder)}<span class="folder-chip-count">${groups.get(folder).length}</span></a>`;
  }).join("");
  const graphData = {
    wrapId,
    tokenQuery: tq,
    nodes: records.filter((r) => r.md).map((r) => ({
      id: r.ulid,
      label: r.title,
      folder: r.path.includes("/") ? r.path.split("/")[0] : ""
    })),
    edges
  };
  const assetCount = wrap.assets ? Object.keys(wrap.assets).length : 0;
  const sidebar = renderTreeSidebar({
    title: wrap.title ?? "Shared slice",
    description: wrap.description,
    gated: wrap.gated,
    shareBase,
    tokenQuery: tq,
    notes: records,
    canvases: canvasMetas,
    assetCount,
    showDownload: true
  });
  const palette = renderCommandPalette({
    shareBase,
    tokenQuery: tq,
    notes: records.map((r) => ({ ulid: r.ulid, basename: r.basename, path: r.path, title: r.title })),
    canvases: canvasMetas,
    hasSidebar: true
  });
  const authorLine = wrap.author ? `<div class="wrap-hero-byline">by <span class="wrap-hero-author">${escapeHtml(wrap.author)}</span></div>` : "";
  const hero = `<header class="wrap-hero">
    ${authorLine}
    <h1 class="wrap-hero-title">${escapeHtml(wrap.title ?? "Untitled vault")}</h1>
    ${wrap.description ? `<p class="wrap-hero-desc">${escapeHtml(wrap.description)}</p>` : ""}
    <div class="wrap-hero-actions">
      <button class="wrap-hero-cta wrap-hero-cta-primary" type="button" data-open-palette>
        Explore vault <kbd>\u2318K</kbd>
      </button>
      <a class="wrap-hero-cta wrap-hero-cta-secondary" href="${shareBase}/feed.xml${tq}" title="Subscribe via RSS/Atom for new notes">
        Follow via RSS
      </a>
    </div>
    <div class="wrap-hero-stats">
      <span class="wrap-stat"><strong>${wrap.ulids.length}</strong> notes</span>
      ${wrap.canvases?.length ? `<span class="wrap-stat-sep">\xB7</span><span class="wrap-stat"><strong>${wrap.canvases.length}</strong> canvases</span>` : ""}
      ${wrap.assets && Object.keys(wrap.assets).length ? `<span class="wrap-stat-sep">\xB7</span><span class="wrap-stat"><strong>${Object.keys(wrap.assets).length}</strong> assets</span>` : ""}
      ${wrap.gated ? `<span class="wrap-stat-sep">\xB7</span><span class="gated-badge">private share</span>` : ""}
    </div>
  </header>`;
  return shell({
    title: wrap.title ?? "Shared slice",
    wide: true,
    sidebarLayout: true,
    hasHelp: true,
    body: `
${sidebar}

<main class="wrap-main">
  ${hero}

  ${recentHtml}

  <div class="graph-wrapper" id="graph-wrapper" data-controls="open">
    <div id="graph-host">
      <div id="graph" style="width:100%;height:100%"></div>
      <div class="graph-hint-bar">drag \xB7 scroll to zoom \xB7 click to open \xB7 hover to focus \xB7 dbl-click to reset \xB7 scroll page in right margin</div>
    </div>

    <aside id="graph-controls-panel" class="graph-controls-panel" aria-label="Graph controls">
      <div class="gcp-header">
        <span>Graph</span>
        <button id="gcp-close" class="gcp-close-btn" type="button" aria-label="Close controls panel">\u2715</button>
      </div>

      <div class="gcp-section">
        <div class="gcp-section-title">Filters</div>
        <div class="gcp-toggle-row">
          <span class="gcp-label">Orphan nodes</span>
          <button class="gcp-toggle active" id="ctrl-orphans" role="switch" aria-checked="true" type="button"></button>
        </div>
      </div>

      <div class="gcp-section">
        <div class="gcp-section-title">Display</div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Node size</span><span class="gcp-val" id="ctrl-node-size-val">1\xD7</span></div>
          <input type="range" id="ctrl-node-size" class="gcp-slider" min="0.3" max="3" step="0.1" value="1">
        </div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Link thickness</span><span class="gcp-val" id="ctrl-edge-val">1\xD7</span></div>
          <input type="range" id="ctrl-edge-size" class="gcp-slider" min="0.5" max="4" step="0.5" value="1">
        </div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Label density</span></div>
          <input type="range" id="ctrl-label-density" class="gcp-slider" min="1" max="5" step="1" value="3">
        </div>
      </div>

      <div class="gcp-section">
        <div class="gcp-section-title">Forces</div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Repel</span><span class="gcp-val" id="ctrl-repel-val">260</span></div>
          <input type="range" id="ctrl-repel" class="gcp-slider" min="50" max="600" step="10" value="260">
        </div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Link distance</span><span class="gcp-val" id="ctrl-linkdist-val">80</span></div>
          <input type="range" id="ctrl-link-dist" class="gcp-slider" min="20" max="200" step="10" value="80">
        </div>
        <div class="gcp-row">
          <div class="gcp-label-row"><span class="gcp-label">Center pull</span><span class="gcp-val" id="ctrl-center-val">0.12</span></div>
          <input type="range" id="ctrl-center" class="gcp-slider" min="0.01" max="0.4" step="0.01" value="0.12">
        </div>
        <button id="ctrl-apply-forces" class="gcp-apply-btn" type="button">Apply</button>
      </div>

      <div class="gcp-section">
        <button id="graph-reset" class="gcp-reset-btn" type="button">\u2316 Reset view</button>
      </div>
    </aside>

    <button id="graph-open-controls" class="graph-open-btn" type="button" aria-label="Open graph controls">Controls</button>
  </div>
</main>

${SIDEBAR_TOGGLE_JS}
${STICKINESS_JS}
${palette}

<script src="https://cdn.jsdelivr.net/npm/graphology@0.25.4/dist/graphology.umd.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/d3-quadtree@3/dist/d3-quadtree.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/d3-dispatch@3/dist/d3-dispatch.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/d3-timer@3/dist/d3-timer.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/d3-force@3/dist/d3-force.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/sigma@2.4.0/build/sigma.min.js"><\/script>
<script>
(function(){
  var DATA = ${JSON.stringify(graphData)};
  if (!DATA.nodes.length || typeof graphology === "undefined" || typeof Sigma === "undefined") {
    var gw = document.getElementById("graph-wrapper");
    if (gw) gw.style.display = "none";
    return;
  }
  var g = new graphology.Graph();
  var styles = getComputedStyle(document.body);
  var accent     = (styles.getPropertyValue("--text-accent").trim() || "#a882ff");
  var nodeColor  = (styles.getPropertyValue("--text-muted").trim()  || "#8a8a8a");
  var edgeColor  = (styles.getPropertyValue("--border").trim()      || "#363636");
  var labelColor = (styles.getPropertyValue("--text-normal").trim() || "#dcddde");
  var bgIsDark   = matchMedia("(prefers-color-scheme: dark)").matches;
  var dimColor   = bgIsDark ? "#2a2a2a" : "#dee2e6";
  var labelBg    = (styles.getPropertyValue("--bg-primary").trim() || (bgIsDark ? "#1e1e1e" : "#ffffff"));

  // Degree map \u2014 used for base node sizing
  var degree = {};
  DATA.edges.forEach(function(e){
    if (e.from === e.to) return;
    degree[e.from] = (degree[e.from] || 0) + 1;
    degree[e.to]   = (degree[e.to]   || 0) + 1;
  });

  // Base node descriptors (no positions yet \u2014 assigned by computeLayout)
  var baseNodes = DATA.nodes.map(function(n){
    var d = degree[n.id] || 0;
    return { id: n.id, label: n.label, folder: n.folder, baseSize: 3 + Math.min(d, 10) * 0.5 };
  });
  var links = DATA.edges
    .filter(function(e){ return e.from !== e.to; })
    .map(function(e){ return { source: e.from, target: e.to }; });

  // Orphan detection
  var hasEdge = {};
  DATA.edges.forEach(function(e){ if (e.from !== e.to){ hasEdge[e.from] = true; hasEdge[e.to] = true; } });
  var orphans = baseNodes.filter(function(n){ return !hasEdge[n.id]; }).map(function(n){ return n.id; });

  // \u2500\u2500 Layout computation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function computeLayout(repel, linkDist, center) {
    var sized = baseNodes.map(function(n, i){
      var theta = (i / baseNodes.length) * 2 * Math.PI;
      return { id: n.id, size: n.baseSize, x: Math.cos(theta) * 80, y: Math.sin(theta) * 80 };
    });
    if (typeof d3 !== "undefined" && d3.forceSimulation) {
      var lnkArr = links.map(function(l){ return { source: l.source, target: l.target }; });
      var sim = d3.forceSimulation(sized)
        .force("link", d3.forceLink(lnkArr).id(function(d){ return d.id; }).distance(linkDist).strength(0.2))
        .force("charge", d3.forceManyBody().strength(-Math.abs(repel)).distanceMax(700))
        .force("center", d3.forceCenter(0, 0).strength(center))
        .force("x", d3.forceX(0).strength(0.04))
        .force("y", d3.forceY(0).strength(0.04))
        .force("collide", d3.forceCollide().radius(function(d){ return d.size + 18; }).strength(0.95))
        .stop();
      var ticks = Math.max(250, Math.min(600, Math.round(140 * Math.log2(sized.length + 2))));
      for (var t = 0; t < ticks; t++) sim.tick();
    }
    var positions = sized.filter(function(d){ return isFinite(d.x) && isFinite(d.y); });
    if (positions.length > 0) {
      var meanX = 0, meanY = 0;
      positions.forEach(function(d){ meanX += d.x; meanY += d.y; });
      meanX /= positions.length; meanY /= positions.length;
      sized.forEach(function(d){ d.x -= meanX; d.y -= meanY; });
      var TARGET = 50;
      var distances = positions.map(function(d){ return Math.sqrt(d.x*d.x + d.y*d.y); }).sort(function(a,b){ return a-b; });
      var p90 = distances[Math.floor(distances.length * 0.9)] || 1;
      var scale = TARGET / Math.max(1, p90);
      sized.forEach(function(d){ d.x *= scale; d.y *= scale; });
      var MAX_R = TARGET * 1.6;
      sized.forEach(function(d){
        var r = Math.sqrt(d.x*d.x + d.y*d.y);
        if (r > MAX_R) { d.x = d.x / r * MAX_R; d.y = d.y / r * MAX_R; }
      });
    }
    return sized;
  }

  // Initial layout + graphology population
  var positioned = computeLayout(260, 80, 0.12);
  positioned.forEach(function(d){
    g.addNode(d.id, { label: baseNodes.find(function(n){ return n.id === d.id; }).label,
      x: d.x, y: d.y, size: d.size, color: nodeColor });
  });
  DATA.edges.forEach(function(e){
    if (g.hasNode(e.from) && g.hasNode(e.to) && !g.hasEdge(e.from, e.to) && e.from !== e.to)
      g.addEdge(e.from, e.to, { size: 1, color: edgeColor });
  });

  // \u2500\u2500 Sigma renderer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function drawLabelWithBg(context, data, settings) {
    if (!data.label) return;
    var size = settings.labelSize, font = settings.labelFont, weight = settings.labelWeight;
    context.font = (weight || "400") + " " + size + "px " + font;
    var metrics = context.measureText(data.label);
    var PADX = 5, PADY = 3, RADIUS = 4;
    var textX = data.x + data.size + 4, textY = data.y + size / 3;
    context.fillStyle = labelBg;
    context.beginPath();
    var rx = textX - PADX, ry = data.y - size / 2 - PADY + 1, rw = metrics.width + PADX * 2, rh = size + PADY * 2;
    if (typeof context.roundRect === "function") context.roundRect(rx, ry, rw, rh, RADIUS);
    else context.rect(rx, ry, rw, rh);
    context.fill();
    var col = settings.labelColor && settings.labelColor.color;
    context.fillStyle = col || labelColor;
    context.fillText(data.label, textX, textY);
  }

  var n = DATA.nodes.length;
  var graphEl = document.getElementById("graph");
  var renderer = new Sigma(g, graphEl, {
    labelColor: { color: labelColor },
    labelSize: 12, labelWeight: "500",
    labelRenderer: drawLabelWithBg, hoverRenderer: drawLabelWithBg,
    labelDensity: n > 50 ? 0.1 : 0.4,
    labelGridCellSize: n > 50 ? 180 : 100,
    labelRenderedSizeThreshold: n > 50 ? 4.5 : 1,
    renderEdgeLabels: false,
    defaultEdgeColor: edgeColor,
    minCameraRatio: 0.05, maxCameraRatio: 8,
    zIndex: true, allowInvalidContainer: true,
  });

  if (typeof ResizeObserver !== "undefined" && graphEl) {
    var lastW = 0, lastH = 0;
    new ResizeObserver(function(entries){
      var r = entries[0] && entries[0].contentRect;
      if (!r || (r.width === lastW && r.height === lastH)) return;
      lastW = r.width; lastH = r.height;
      try { renderer.resize(); renderer.refresh(); } catch(e){}
    }).observe(graphEl);
  }

  // \u2500\u2500 Camera reset \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function resetView() {
    var cam = renderer.getCamera();
    if (typeof cam.animatedReset === "function" && !prefersReducedMotion) cam.animatedReset({ duration: 400 });
    else cam.setState({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });
  }
  var resetBtn = document.getElementById("graph-reset");
  if (resetBtn) resetBtn.addEventListener("click", resetView);
  renderer.on("doubleClickStage", function(e){
    if (e && e.preventSigmaDefault) e.preventSigmaDefault();
    resetView();
  });

  // \u2500\u2500 Hover-focus \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  var hoveredNode = null, hoveredNeighbors = null;
  renderer.setSetting("nodeReducer", function(node, data){
    var res = Object.assign({}, data);
    if (hoveredNode) {
      if (node === hoveredNode) { res.color = accent; res.size = data.size * 2; res.forceLabel = true; res.zIndex = 2; }
      else if (hoveredNeighbors[node]) { res.color = accent; res.forceLabel = true; res.zIndex = 1; }
      else { res.color = dimColor; res.label = ""; res.zIndex = 0; }
    }
    return res;
  });
  renderer.setSetting("edgeReducer", function(edge, data){
    var res = Object.assign({}, data);
    if (hoveredNode) {
      var src = g.source(edge), tgt = g.target(edge);
      if (src === hoveredNode || tgt === hoveredNode) { res.color = accent; res.size = (data.size||1)*2.5; res.zIndex = 1; }
      else { res.color = dimColor; res.zIndex = 0; }
    }
    return res;
  });
  renderer.on("enterNode", function(p){
    hoveredNode = p.node; hoveredNeighbors = { [p.node]: true };
    g.forEachNeighbor(p.node, function(nb){ hoveredNeighbors[nb] = true; });
    renderer.refresh(); document.body.style.cursor = "pointer";
  });
  renderer.on("leaveNode", function(){
    hoveredNode = null; hoveredNeighbors = null;
    renderer.refresh(); document.body.style.cursor = "";
  });
  var isTouch = matchMedia && matchMedia("(hover: none)").matches;
  var navigateTo = function(node){ window.location = "/share/" + DATA.wrapId + "/" + node + DATA.tokenQuery; };
  renderer.on("clickNode", function(p){
    if (!isTouch) { navigateTo(p.node); return; }
    if (hoveredNode === p.node) { navigateTo(p.node); return; }
    hoveredNode = p.node; hoveredNeighbors = { [p.node]: true };
    g.forEachNeighbor(p.node, function(nb){ hoveredNeighbors[nb] = true; });
    renderer.refresh();
  });
  renderer.on("clickStage", function(){
    if (!isTouch || !hoveredNode) return;
    hoveredNode = null; hoveredNeighbors = null; renderer.refresh();
  });

  // \u2500\u2500 Graph controls panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  var wrapper = document.getElementById("graph-wrapper");
  var nodeSizeMul = 1, edgeSizeMul = 1, showOrphans = true;

  // Panel open/close
  var closeBtn = document.getElementById("gcp-close");
  var openBtn  = document.getElementById("graph-open-controls");
  if (closeBtn) closeBtn.addEventListener("click", function(){ wrapper.setAttribute("data-controls","closed"); });
  if (openBtn)  openBtn.addEventListener("click",  function(){ wrapper.setAttribute("data-controls","open"); });

  // Orphan toggle
  var orphanBtn = document.getElementById("ctrl-orphans");
  if (orphanBtn) orphanBtn.addEventListener("click", function(){
    showOrphans = !showOrphans;
    orphanBtn.classList.toggle("active", showOrphans);
    orphanBtn.setAttribute("aria-checked", String(showOrphans));
    orphans.forEach(function(id){
      if (g.hasNode(id)) g.setNodeAttribute(id, "hidden", !showOrphans);
    });
    renderer.refresh();
  });

  // Node size slider
  var nodeSizeSlider = document.getElementById("ctrl-node-size");
  var nodeSizeVal    = document.getElementById("ctrl-node-size-val");
  if (nodeSizeSlider) nodeSizeSlider.addEventListener("input", function(){
    nodeSizeMul = parseFloat(this.value);
    if (nodeSizeVal) nodeSizeVal.textContent = nodeSizeMul.toFixed(1) + "x";
    g.forEachNode(function(id, attrs){
      var base = baseNodes.find(function(n){ return n.id === id; });
      if (base) g.setNodeAttribute(id, "size", base.baseSize * nodeSizeMul);
    });
    renderer.refresh();
  });

  // Edge thickness slider
  var edgeSizeSlider = document.getElementById("ctrl-edge-size");
  var edgeSizeVal    = document.getElementById("ctrl-edge-val");
  if (edgeSizeSlider) edgeSizeSlider.addEventListener("input", function(){
    edgeSizeMul = parseFloat(this.value);
    if (edgeSizeVal) edgeSizeVal.textContent = edgeSizeMul.toFixed(1) + "x";
    g.forEachEdge(function(id){ g.setEdgeAttribute(id, "size", edgeSizeMul); });
    renderer.refresh();
  });

  // Label density slider (1=sparse \u2026 5=dense)
  var labelSlider = document.getElementById("ctrl-label-density");
  if (labelSlider) labelSlider.addEventListener("input", function(){
    var v = parseInt(this.value);
    var densityMap  = [0,0.05,0.15,0.35,0.6,1];
    var threshMap   = [0,5,   3.5, 2,   1,  0];
    var gridMap     = [0,220, 160, 120, 80, 60];
    renderer.setSetting("labelDensity",                densityMap[v]);
    renderer.setSetting("labelRenderedSizeThreshold",  threshMap[v]);
    renderer.setSetting("labelGridCellSize",           gridMap[v]);
    renderer.refresh();
  });

  // Forces re-layout
  var repelSlider   = document.getElementById("ctrl-repel");
  var repelVal      = document.getElementById("ctrl-repel-val");
  var linkDistSlider= document.getElementById("ctrl-link-dist");
  var linkDistVal   = document.getElementById("ctrl-linkdist-val");
  var centerSlider  = document.getElementById("ctrl-center");
  var centerVal     = document.getElementById("ctrl-center-val");
  function bindVal(slider, valEl) {
    if (!slider) return;
    slider.addEventListener("input", function(){ if (valEl) valEl.textContent = this.value; });
  }
  bindVal(repelSlider, repelVal);
  bindVal(linkDistSlider, linkDistVal);
  bindVal(centerSlider, centerVal);

  var applyBtn = document.getElementById("ctrl-apply-forces");
  if (applyBtn) applyBtn.addEventListener("click", function(){
    var repel    = parseFloat(repelSlider ? repelSlider.value : "260");
    var linkDist = parseFloat(linkDistSlider ? linkDistSlider.value : "80");
    var center   = parseFloat(centerSlider  ? centerSlider.value  : "0.12");
    applyBtn.textContent = "Computing...";
    applyBtn.disabled = true;
    setTimeout(function(){
      var newPos = computeLayout(repel, linkDist, center);
      newPos.forEach(function(d){
        if (g.hasNode(d.id)) {
          g.setNodeAttribute(d.id, "x", d.x);
          g.setNodeAttribute(d.id, "y", d.y);
        }
      });
      renderer.refresh();
      resetView();
      applyBtn.textContent = "Apply";
      applyBtn.disabled = false;
    }, 30);
  });
})();
<\/script>
`
  });
}
__name(renderWrapper, "renderWrapper");
var CANVAS_COLORS = {
  "1": "#fb464c",
  // red
  "2": "#e9973f",
  // orange
  "3": "#e0de71",
  // yellow
  "4": "#44cf6e",
  // green
  "5": "#53dfdd",
  // cyan
  "6": "#a882ff"
  // purple
};
function canvasColor(c) {
  if (!c)
    return "#888";
  if (c.startsWith("#"))
    return c;
  return CANVAS_COLORS[c] ?? "#888";
}
__name(canvasColor, "canvasColor");
function nodeAnchor(n, side) {
  const cx = n.x + n.width / 2;
  const cy = n.y + n.height / 2;
  switch (side) {
    case "top":
      return { x: cx, y: n.y };
    case "right":
      return { x: n.x + n.width, y: cy };
    case "bottom":
      return { x: cx, y: n.y + n.height };
    case "left":
      return { x: n.x, y: cy };
    default:
      return { x: cx, y: cy };
  }
}
__name(nodeAnchor, "nodeAnchor");
function renderCanvas(json2, ulid, ctx) {
  let canvas;
  try {
    canvas = JSON.parse(json2);
  } catch {
    return shell({ title: "Canvas (parse error)", body: `<div class="gate-error"><h1>Could not parse canvas</h1></div>` });
  }
  if (!canvas.nodes?.length) {
    return shell({ title: "Empty canvas", body: `<div class="gate-error"><h1>This canvas is empty</h1></div>` });
  }
  const tq = ctx?.tokenQuery ?? "";
  const title = ctx?.path ? (ctx.path.split("/").pop() ?? ulid).replace(/\.canvas$/i, "") : ulid;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of canvas.nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  const pad = 80;
  const vbX = minX - pad, vbY = minY - pad;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2;
  const nodeIndex = {};
  for (const n of canvas.nodes)
    nodeIndex[n.id] = n;
  const groups = canvas.nodes.filter((n) => n.type === "group");
  const others = canvas.nodes.filter((n) => n.type !== "group");
  const posStyle = /* @__PURE__ */ __name((n) => `left:${n.x}px;top:${n.y}px;width:${n.width}px;height:${n.height}px`, "posStyle");
  const renderTextCard = /* @__PURE__ */ __name((n) => {
    const md = n.text ?? "";
    const html3 = marked.parse(md, { async: false });
    const color = canvasColor(n.color);
    return `<div class="canvas-card canvas-text" style="${posStyle(n)};border-color:${color}">${html3}</div>`;
  }, "renderTextCard");
  const renderFileCard = /* @__PURE__ */ __name((n) => {
    const file = (n.file ?? "").trim();
    const basename = file.split("/").pop()?.replace(/\.md$/i, "") ?? file;
    const color = canvasColor(n.color);
    const inner = `<div class="canvas-file-name">${escapeHtml(basename)}</div>`;
    let href = null;
    if (ctx?.shareBase) {
      const u = ctx.shareSet?.get(basename);
      if (u)
        href = `${ctx.shareBase}/${u}${tq}`;
      else {
        const cu = ctx.canvasSet?.get(basename.replace(/\.canvas$/i, ""));
        if (cu)
          href = `${ctx.shareBase}/c/${cu}${tq}`;
      }
    }
    return href ? `<a class="canvas-card canvas-file" href="${escapeAttr(href)}" style="${posStyle(n)};border-color:${color}">${inner}</a>` : `<div class="canvas-card canvas-file canvas-file-private" style="${posStyle(n)};border-color:${color}">${inner}<div class="canvas-file-private-note">not in this share</div></div>`;
  }, "renderFileCard");
  const renderLinkCard = /* @__PURE__ */ __name((n) => {
    const url = n.url ?? "";
    const color = canvasColor(n.color);
    return `<a class="canvas-card canvas-link" href="${escapeAttr(url)}" target="_blank" rel="noopener" style="${posStyle(n)};border-color:${color}">${escapeHtml(url)}</a>`;
  }, "renderLinkCard");
  const renderGroupBox = /* @__PURE__ */ __name((n) => {
    const color = canvasColor(n.color);
    const label = n.label ?? "";
    return `<div class="canvas-group" style="${posStyle(n)};color:${color};border-color:${color};background:${color}1a">${label ? `<div class="canvas-group-label">${escapeHtml(label)}</div>` : ""}</div>`;
  }, "renderGroupBox");
  const groupHtml = groups.map(renderGroupBox).join("\n");
  const cardHtml = others.map((n) => {
    if (n.type === "text")
      return renderTextCard(n);
    if (n.type === "file")
      return renderFileCard(n);
    if (n.type === "link")
      return renderLinkCard(n);
    return "";
  }).join("\n");
  const edgeSvg = canvas.edges?.map((e) => {
    const from = nodeIndex[e.fromNode];
    const to = nodeIndex[e.toNode];
    if (!from || !to)
      return "";
    const a = nodeAnchor(from, e.fromSide);
    const b = nodeAnchor(to, e.toSide);
    const offset = Math.max(40, Math.abs(b.x - a.x) / 3);
    const c1 = (() => {
      switch (e.fromSide) {
        case "right":
          return { x: a.x + offset, y: a.y };
        case "left":
          return { x: a.x - offset, y: a.y };
        case "top":
          return { x: a.x, y: a.y - offset };
        case "bottom":
          return { x: a.x, y: a.y + offset };
        default:
          return { x: (a.x + b.x) / 2, y: a.y };
      }
    })();
    const c2 = (() => {
      switch (e.toSide) {
        case "right":
          return { x: b.x + offset, y: b.y };
        case "left":
          return { x: b.x - offset, y: b.y };
        case "top":
          return { x: b.x, y: b.y - offset };
        case "bottom":
          return { x: b.x, y: b.y + offset };
        default:
          return { x: (a.x + b.x) / 2, y: b.y };
      }
    })();
    const stroke = canvasColor(e.color) ?? "#888";
    const path = `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
    const arrow = e.toEnd !== "none" ? `marker-end="url(#arrow)"` : "";
    const label = e.label ? `<text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 6}" font-size="13" fill="var(--text-normal)" text-anchor="middle" class="canvas-edge-label">${escapeHtml(e.label)}</text>` : "";
    return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="2" stroke-opacity="0.7" ${arrow}/>${label}`;
  }).join("\n") ?? "";
  const breadcrumb = renderBreadcrumb(ctx, title);
  const canvasBody = `<h1 class="canvas-title">${escapeHtml(title)}</h1>
<p class="canvas-help">${canvas.nodes.length} node(s) \xB7 ${canvas.edges?.length ?? 0} edge(s)</p>
<div class="canvas-host" id="canvas-host">
  <div class="canvas-stage" id="canvas-stage" data-vbx="${vbX}" data-vby="${vbY}" data-vbw="${vbW}" data-vbh="${vbH}">
    ${groupHtml}
    <svg class="canvas-edges-layer" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#888" />
        </marker>
      </defs>
      ${edgeSvg}
    </svg>
    ${cardHtml}
  </div>
  <div class="canvas-rail" id="canvas-rail">
    <button id="canvas-zoom-in"  type="button" title="Zoom in (=)">+</button>
    <button id="canvas-zoom-out" type="button" title="Zoom out (-)">\u2212</button>
    <div class="rail-divider"></div>
    <button id="canvas-fit"      type="button" title="Fit to screen (F)">\u26F6</button>
    <button id="canvas-reset"    type="button" title="Reset view (R or double-click)">\u2316</button>
    <div class="rail-divider"></div>
    <button id="canvas-fullscreen" type="button" title="Toggle fullscreen (Shift+F)">\u26F6</button>
    <div class="rail-divider"></div>
    <div class="rail-help">
      <button id="canvas-help" type="button" title="Keyboard shortcuts">?</button>
      <div class="canvas-rail-tip" id="canvas-tip">
        <div><kbd>scroll</kbd> \xB7 zoom at cursor</div>
        <div><kbd>drag</kbd> \xB7 pan</div>
        <div><kbd>=</kbd> / <kbd>-</kbd> \xB7 zoom in / out</div>
        <div><kbd>F</kbd> \xB7 fit to screen</div>
        <div><kbd>R</kbd> \xB7 reset view</div>
        <div><kbd>\u21E7F</kbd> \xB7 fullscreen</div>
        <div><kbd>dbl-click</kbd> \xB7 reset</div>
      </div>
    </div>
  </div>
</div>
${CANVAS_PAN_ZOOM}`;
  if (ctx?.wrapTree && ctx?.shareBase) {
    const sidebar = renderTreeSidebar({
      title: ctx.wrapTree.wrapTitle,
      description: ctx.wrapTree.wrapDesc,
      gated: ctx.gated,
      shareBase: ctx.shareBase,
      tokenQuery: ctx.tokenQuery ?? "",
      notes: ctx.wrapTree.notes.map((n) => ({ ...n, md: "" })),
      canvases: ctx.wrapTree.canvases,
      assetCount: ctx.wrapTree.assetCount,
      activeUlid: ulid,
      showDownload: false
    });
    const palette = renderCommandPalette({
      shareBase: ctx.shareBase,
      tokenQuery: ctx.tokenQuery ?? "",
      notes: ctx.wrapTree.notes,
      canvases: ctx.wrapTree.canvases,
      hasSidebar: true
    });
    return shell({ title, sidebarLayout: true, hasHelp: true, body: `
${sidebar}
<main class="wrap-main wrap-main-canvas">
  ${breadcrumb}
  ${canvasBody}
</main>
${SIDEBAR_TOGGLE_JS}
${palette}
` });
  }
  return shell({
    title,
    wide: true,
    body: `
${breadcrumb}
${canvasBody}
`
  });
}
__name(renderCanvas, "renderCanvas");
var CANVAS_PAN_ZOOM = `<script>
(function(){
  const host = document.getElementById("canvas-host");
  const stage = document.getElementById("canvas-stage");
  if (!host || !stage) return;
  const vbX = +stage.dataset.vbx, vbY = +stage.dataset.vby;
  const vbW = +stage.dataset.vbw, vbH = +stage.dataset.vbh;

  // Stage coords use raw canvas-space pixels. We translate so vbX/vbY map to
  // the host's top-left, then scale so the whole content fits the host.
  let scale = 1, tx = 0, ty = 0;

  function apply() {
    stage.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
  }

  function fit() {
    const r = host.getBoundingClientRect();
    const margin = 24;
    const sx = (r.width  - margin * 2) / vbW;
    const sy = (r.height - margin * 2) / vbH;
    scale = Math.min(sx, sy);
    tx = (r.width  - vbW * scale) / 2 - vbX * scale;
    ty = (r.height - vbH * scale) / 2 - vbY * scale;
    apply();
  }

  fit();
  window.addEventListener("resize", fit);

  // Wheel zoom anchored at cursor (works in Safari, Chrome, Firefox).
  host.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = host.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newScale = Math.max(0.05, Math.min(8, scale * factor));
    // keep the point under cursor stationary in screen space
    tx = mx - (mx - tx) * (newScale / scale);
    ty = my - (my - ty) * (newScale / scale);
    scale = newScale;
    apply();
  }, { passive: false });

  // Drag to pan \u2014 but don't hijack clicks on cards/links. Mousedown on a card
  // starts a "click candidate"; we only treat it as a pan if the user actually
  // moves the cursor more than 4px before releasing.
  let dragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0, decided = false;
  host.addEventListener("mousedown", (e) => {
    dragging = true; decided = false;
    lastX = downX = e.clientX; lastY = downY = e.clientY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    if (!decided) {
      if (Math.abs(e.clientX - downX) < 4 && Math.abs(e.clientY - downY) < 4) return;
      decided = true;
      stage.classList.add("grabbing");
    }
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    apply();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
    stage.classList.remove("grabbing");
  });
  // If the user starts on a link, swallow the click that would otherwise navigate
  // when they were really panning.
  host.addEventListener("click", (e) => {
    if (decided) e.preventDefault();
  }, true);

  // Programmatic zoom from buttons / keys \u2014 anchored at the host's centre.
  function zoomAt(factor) {
    const r = host.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const newScale = Math.max(0.05, Math.min(8, scale * factor));
    tx = cx - (cx - tx) * (newScale / scale);
    ty = cy - (cy - ty) * (newScale / scale);
    scale = newScale;
    apply();
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else host.requestFullscreen?.();
  }
  // Re-fit after entering/leaving fullscreen so the content fills the new size
  document.addEventListener("fullscreenchange", () => setTimeout(fit, 50));

  document.getElementById("canvas-reset")?.addEventListener("click", fit);
  document.getElementById("canvas-fit")?.addEventListener("click", fit);
  document.getElementById("canvas-zoom-in")?.addEventListener("click", () => zoomAt(1.2));
  document.getElementById("canvas-zoom-out")?.addEventListener("click", () => zoomAt(1 / 1.2));
  document.getElementById("canvas-fullscreen")?.addEventListener("click", toggleFullscreen);
  const tip = document.getElementById("canvas-tip");
  document.getElementById("canvas-help")?.addEventListener("click", (e) => {
    e.stopPropagation();
    tip?.classList.toggle("visible");
  });
  document.addEventListener("click", () => tip?.classList.remove("visible"));
  host.addEventListener("dblclick", fit);

  // Keyboard shortcuts \u2014 only fire when the canvas is hovered, so they don't
  // hijack typing elsewhere on the page.
  let hostHover = false;
  host.addEventListener("mouseenter", () => { hostHover = true; });
  host.addEventListener("mouseleave", () => { hostHover = false; });
  document.addEventListener("keydown", (e) => {
    if (!hostHover) return;
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    switch (e.key) {
      case "=": case "+": e.preventDefault(); zoomAt(1.2); break;
      case "-": case "_": e.preventDefault(); zoomAt(1 / 1.2); break;
      case "f": case "F":
        if (e.shiftKey) { e.preventDefault(); toggleFullscreen(); }
        else { e.preventDefault(); fit(); }
        break;
      case "r": case "R": e.preventDefault(); fit(); break;
    }
  });
})();
<\/script>`;
function renderGateError(message) {
  return shell({
    title: "Access required",
    body: `
<div class="gate-error">
  <div class="gate-icon"></div>
  <h1>Access required</h1>
  <p class="gate-msg">${escapeHtml(message)}</p>
  <p class="gate-hint">If you were given a link, make sure you used the full URL including the access token (<code>?t=\u2026</code>). Tokens can expire, be revoked, or have a view limit.</p>
</div>
`
  });
}
__name(renderGateError, "renderGateError");
function renderOgCard(opts) {
  const W = 1200, H = 630;
  const MAX_LINES = 3, CHARS_PER_LINE = 28;
  const titleWords = opts.title.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of titleWords) {
    if ((cur + " " + w).trim().length > CHARS_PER_LINE && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === MAX_LINES - 1) {
        const rest = titleWords.slice(titleWords.indexOf(w)).join(" ");
        lines.push(rest.length > CHARS_PER_LINE ? rest.slice(0, CHARS_PER_LINE - 1) + "\u2026" : rest);
        cur = "";
        break;
      }
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur)
    lines.push(cur);
  const titleSvg = lines.map(
    (line, i) => `<text x="80" y="${260 + i * 80}" font-size="64" font-weight="700" fill="#1f2328" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">${escapeHtml(line)}</text>`
  ).join("");
  const folderLine = opts.folder ? `<text x="80" y="${260 + lines.length * 80 + 60}" font-size="28" fill="#57606a" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">${escapeHtml(opts.folder)}</text>` : "";
  const wordsChip = opts.wordCount ? `<text x="80" y="${260 + lines.length * 80 + (opts.folder ? 110 : 60)}" font-size="22" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">${opts.wordCount.toLocaleString()} words</text>` : "";
  const gatedBadge = opts.gated ? `<g transform="translate(${W - 220}, 60)">
         <rect x="0" y="0" width="160" height="44" rx="22" fill="#7f6df2" opacity="0.15"/>
         <text x="80" y="29" font-size="20" font-weight="600" fill="#5b4ad6" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">GATED</text>
       </g>` : "";
  const brand = `
    <g transform="translate(${W - 80}, ${H - 60})">
      <text x="0" y="0" font-size="22" font-weight="600" fill="#7f6df2" text-anchor="end" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">BrainShare</text>
    </g>`;
  const wrap = opts.wrapTitle ? `<text x="80" y="${H - 60}" font-size="22" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">${escapeHtml(opts.wrapTitle.slice(0, 50))}${opts.wrapTitle.length > 50 ? "\u2026" : ""}</text>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f5f6f8"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7f6df2"/>
      <stop offset="100%" stop-color="#a882ff"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="8" fill="url(#accent)"/>
  <text x="80" y="120" font-size="24" font-weight="500" letter-spacing="2" fill="#7f6df2" font-family="-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif">BRAINSHARE</text>
  ${gatedBadge}
  ${titleSvg}
  ${folderLine}
  ${wordsChip}
  ${wrap}
  ${brand}
</svg>`;
}
__name(renderOgCard, "renderOgCard");
var BRAINSHARE_APP_LD = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"BrainShare","applicationCategory":"Publishing","operatingSystem":"Cross-platform","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"author":{"@type":"Person","name":"Maheen","url":"https://github.com/MachoMaheen"},"url":"https://github.com/MachoMaheen/brainshare","sameAs":["https://brainshare-publisher.machomaheen.workers.dev"],"license":"https://www.gnu.org/licenses/agpl-3.0.html"}<\/script>`;
function buildArticleLd(opts) {
  const obj = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    author: { "@type": "Person", name: opts.author || "Maheen" }
  };
  if (opts.datePublished)
    obj.datePublished = opts.datePublished;
  if (opts.dateModified)
    obj.dateModified = opts.dateModified;
  if (opts.pageUrl)
    obj.mainEntityOfPage = opts.pageUrl;
  return `<script type="application/ld+json">${JSON.stringify(obj)}<\/script>`;
}
__name(buildArticleLd, "buildArticleLd");
function extractFaqPairs(body) {
  const lines = body.split("\n");
  const pairs = [];
  let currentQ = null;
  let currentABuf = [];
  const flush = /* @__PURE__ */ __name(() => {
    if (currentQ) {
      const a = currentABuf.join(" ").replace(/\s+/g, " ").trim();
      if (a)
        pairs.push({ q: currentQ, a });
    }
    currentQ = null;
    currentABuf = [];
  }, "flush");
  for (const raw of lines) {
    const line = raw.trim();
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      flush();
      currentQ = h2[1].replace(/[*_`]/g, "").trim();
      continue;
    }
    if (line.startsWith("# ") || line.startsWith("### ")) {
      flush();
      continue;
    }
    if (currentQ && line) {
      const stripped = line.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, a) => a ?? t).replace(/[*_`]/g, "");
      currentABuf.push(stripped);
    }
  }
  flush();
  return pairs.slice(0, 30);
}
__name(extractFaqPairs, "extractFaqPairs");
function buildFaqLd(body) {
  const pairs = extractFaqPairs(body);
  if (pairs.length === 0)
    return "";
  const obj = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };
  return `<script type="application/ld+json">${JSON.stringify(obj)}<\/script>`;
}
__name(buildFaqLd, "buildFaqLd");
function shell(opts) {
  const inner = opts.sidebarLayout ? `<div id="main-content" class="wrap-shell">${opts.body}</div>` : `<main id="main-content" class="container ${opts.wide ? "wide" : ""}">${opts.body}</main>`;
  const meta = opts.meta;
  const ogTitle = escapeHtml(meta?.ogTitle ?? opts.title);
  const ogDescription = meta?.ogDescription ? `<meta property="og:description" content="${escapeAttr(meta.ogDescription)}">` : "";
  const ogUrl = meta?.pageUrl ? `<meta property="og:url" content="${escapeAttr(meta.pageUrl)}">
<link rel="canonical" href="${escapeAttr(meta.pageUrl)}">` : "";
  const ogImage = meta?.ogImage ? `
<meta property="og:image" content="${escapeAttr(meta.ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ogTitle}">
${meta?.ogDescription ? `<meta name="twitter:description" content="${escapeAttr(meta.ogDescription)}">` : ""}
<meta name="twitter:image" content="${escapeAttr(meta.ogImage)}">` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="license" href="https://www.gnu.org/licenses/agpl-3.0.html">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<meta property="og:title" content="${ogTitle}">
<meta property="og:type" content="article">
${ogDescription}
${ogUrl}
${ogImage}
<script>
/* Pre-paint theme apply \u2014 avoids flash-of-wrong-theme. Default is light;
   only overrides when the user has explicitly saved a preference. */
(function(){
  try {
    var m = localStorage.getItem("brainshare_theme") || "light";
    if (m === "light" || m === "dark") document.documentElement.setAttribute("data-theme", m);
  } catch (e) { /* private mode etc. */ }
})();
<\/script>
<style>${css}</style>
${BRAINSHARE_APP_LD}
${meta?.jsonLd ?? ""}
</head>
<body>
<a href="#main-content" class="skip-link">Skip to content</a>
${inner}
${pageChromeHtml({ hasHelp: opts.hasHelp ?? false })}
${THEME_TOGGLE_JS}
</body>
</html>`;
}
__name(shell, "shell");
function pageChromeHtml(opts) {
  const helpBtn = opts.hasHelp ? `
  <button class="chrome-btn" id="help-btn" type="button" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
    <svg class="chrome-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5"/>
      <circle cx="12" cy="17.5" r=".5" fill="currentColor"/>
    </svg>
  </button>
  <span class="chrome-divider" aria-hidden="true"></span>` : "";
  return `<div class="page-chrome" role="group" aria-label="Page controls">${helpBtn}
  <a class="chrome-source" href="https://github.com/MachoMaheen/brainshare" rel="noopener noreferrer" target="_blank" title="Upstream BrainShare source code (AGPLv3)">Source</a>
  <span class="chrome-divider" aria-hidden="true"></span>
  <button class="chrome-btn theme-toggle" id="theme-toggle" type="button" aria-label="Toggle theme (auto / light / dark)" title="Theme: auto">
    <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>
  </button>
</div>
<script>
(function(){
  try {
    var m = localStorage.getItem("brainshare_theme") || "light";
    if (m === "auto") return;
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var SUN  = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
    var MOON = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.innerHTML = m === "light" ? SUN : MOON;
    btn.setAttribute("title", "Theme: " + m + " (click to cycle)");
  } catch(e) {}
})();
<\/script>`;
}
__name(pageChromeHtml, "pageChromeHtml");
var THEME_TOGGLE_JS = `<script>
(function(){
  // Wire help button \u2014 calls window.__brainshareOpenHelp exposed by the
  // cmd-palette script (only present on pages that have a help sheet).
  var helpBtn = document.getElementById("help-btn");
  if (helpBtn) {
    helpBtn.addEventListener("click", function(){
      if (typeof window.__brainshareOpenHelp === "function") {
        window.__brainshareOpenHelp();
      }
    });
  }

  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  var iconEl = btn.querySelector(".theme-icon");
  var SUN = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  var MOON = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var AUTO = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>';
  function modeOf(){ try { return localStorage.getItem("brainshare_theme") || "light"; } catch(e){ return "light"; } }
  function apply(mode){
    var html = document.documentElement;
    if (mode === "light") html.setAttribute("data-theme", "light");
    else if (mode === "dark") html.setAttribute("data-theme", "dark");
    else html.removeAttribute("data-theme");
    btn.innerHTML = mode === "dark" ? MOON : mode === "light" ? SUN : AUTO;
    btn.setAttribute("title", "Theme: " + mode + " (click to cycle)");
  }
  apply(modeOf());
  btn.addEventListener("click", function(){
    var order = ["light", "dark", "auto"];
    var next = order[(order.indexOf(modeOf()) + 1) % order.length];
    try { localStorage.setItem("brainshare_theme", next); } catch(e){}
    apply(next);
    // Flash a tiny tooltip-like cue
    btn.dataset.flash = "1";
    setTimeout(function(){ delete btn.dataset.flash; }, 400);
  });
})();
<\/script>`;
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
__name(escapeHtml, "escapeHtml");
function escapeAttr(s) {
  return escapeHtml(s);
}
__name(escapeAttr, "escapeAttr");

// src/jwt.ts
var enc = new TextEncoder();
var dec = new TextDecoder();
function b64urlBytes(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++)
    s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64urlBytes, "b64urlBytes");
function b64urlStr(s) {
  return b64urlBytes(enc.encode(s));
}
__name(b64urlStr, "b64urlStr");
function b64urlDecode(s) {
  let pad = s.replace(/-/g, "+").replace(/_/g, "/");
  while (pad.length % 4)
    pad += "=";
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++)
    out[i] = bin.charCodeAt(i);
  return out;
}
__name(b64urlDecode, "b64urlDecode");
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(hmacKey, "hmacKey");
async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const data = `${b64urlStr(JSON.stringify(header))}.${b64urlStr(JSON.stringify(payload))}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${b64urlBytes(sig)}`;
}
__name(signJWT, "signJWT");
async function verifyJWT(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3)
    return null;
  const [encH, encP, sig] = parts;
  let valid = false;
  try {
    const key = await hmacKey(secret);
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      enc.encode(`${encH}.${encP}`)
    );
  } catch {
    return null;
  }
  if (!valid)
    return null;
  try {
    return JSON.parse(dec.decode(b64urlDecode(encP)));
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");

// node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = /* @__PURE__ */ __name(function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
}, "freb");
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = /* @__PURE__ */ __name(function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
}, "hMap");
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var shft = /* @__PURE__ */ __name(function(p) {
  return (p + 7) / 8 | 0;
}, "shft");
var slc = /* @__PURE__ */ __name(function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
}, "slc");
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = /* @__PURE__ */ __name(function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
}, "err");
var wbits = /* @__PURE__ */ __name(function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
}, "wbits");
var wbits16 = /* @__PURE__ */ __name(function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
}, "wbits16");
var hTree = /* @__PURE__ */ __name(function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
}, "hTree");
var ln = /* @__PURE__ */ __name(function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
}, "ln");
var lc = /* @__PURE__ */ __name(function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = /* @__PURE__ */ __name(function(v) {
    cl[cli++] = v;
  }, "w");
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
}, "lc");
var clen = /* @__PURE__ */ __name(function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
}, "clen");
var wfblk = /* @__PURE__ */ __name(function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
}, "wfblk");
var wblk = /* @__PURE__ */ __name(function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
}, "wblk");
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = /* @__PURE__ */ __name(function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = /* @__PURE__ */ __name(function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    }, "hsh");
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
}, "dflt");
var crct = /* @__PURE__ */ function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
}();
var crc = /* @__PURE__ */ __name(function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
}, "crc");
var dopt = /* @__PURE__ */ __name(function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
}, "dopt");
var mrg = /* @__PURE__ */ __name(function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
}, "mrg");
var wbytes = /* @__PURE__ */ __name(function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
}, "wbytes");
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
__name(deflateSync, "deflateSync");
var fltn = /* @__PURE__ */ __name(function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (val instanceof u8)
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
}, "fltn");
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = /* @__PURE__ */ __name(function(v) {
    ar[ai++] = v;
  }, "w");
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
__name(strToU8, "strToU8");
var exfl = /* @__PURE__ */ __name(function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
}, "exfl");
var wzh = /* @__PURE__ */ __name(function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
}, "wzh");
var wzf = /* @__PURE__ */ __name(function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
}, "wzf");
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}
__name(zipSync, "zipSync");

// src/index.ts
var ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
function unauthorized(env, req) {
  const auth = req.headers.get("authorization") ?? "";
  return auth !== `Bearer ${env.PUBLISHER_TOKEN}`;
}
__name(unauthorized, "unauthorized");
function forbidden() {
  return new Response("forbidden", { status: 403 });
}
__name(forbidden, "forbidden");
async function rateLimitOk(env, req, bucket, max, windowSec) {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const k = `ratelimit:${bucket}:${ip}`;
  const cur = parseInt(await env.NOTES.get(k) ?? "0", 10);
  if (cur >= max)
    return false;
  await env.NOTES.put(k, String(cur + 1), { expirationTtl: windowSec });
  return true;
}
__name(rateLimitOk, "rateLimitOk");
function rateLimited(retryAfterSec) {
  return new Response("rate limit exceeded \u2014 slow down", {
    status: 429,
    headers: { "retry-after": String(retryAfterSec), "content-type": "text/plain" }
  });
}
__name(rateLimited, "rateLimited");
function html2(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
__name(html2, "html");
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
__name(json, "json");
async function getNotePath(notes, ulid) {
  const raw = await notes.get(`meta:${ulid}`);
  if (!raw)
    return void 0;
  try {
    return JSON.parse(raw).path;
  } catch {
    return void 0;
  }
}
__name(getNotePath, "getNotePath");
async function buildCanvasSet(notes, ulids) {
  const out = /* @__PURE__ */ new Map();
  if (!ulids.length)
    return out;
  const metas = await Promise.all(ulids.map((u) => notes.get(`canvasmeta:${u}`)));
  for (let i = 0; i < ulids.length; i++) {
    const raw = metas[i];
    if (!raw) {
      out.set(ulids[i], ulids[i]);
      continue;
    }
    try {
      const meta = JSON.parse(raw);
      out.set(meta.basename, ulids[i]);
    } catch {
      out.set(ulids[i], ulids[i]);
    }
  }
  return out;
}
__name(buildCanvasSet, "buildCanvasSet");
function gateCookieName(wrapId) {
  return `brainshare_${wrapId}`;
}
__name(gateCookieName, "gateCookieName");
function readCookie(req, name) {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key !== name)
      continue;
    try {
      return decodeURIComponent(rest.join("="));
    } catch {
      return rest.join("=");
    }
  }
  return void 0;
}
__name(readCookie, "readCookie");
function gatedSessionRedirect(url, wrapId, token, exp) {
  const clean = new URL(url.toString());
  clean.searchParams.delete("t");
  const now = Math.floor(Date.now() / 1e3);
  const maxAge = Math.max(0, exp - now);
  const secure = clean.protocol === "https:" ? "; Secure" : "";
  const cookie = `${gateCookieName(wrapId)}=${encodeURIComponent(token)}; Path=/share/${wrapId}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
  return new Response(null, {
    status: 302,
    headers: {
      location: clean.toString(),
      "set-cookie": cookie,
      "cache-control": "no-store"
    }
  });
}
__name(gatedSessionRedirect, "gatedSessionRedirect");
async function checkGate(env, wrap, wrapId, url, req, exchangeQueryToken = false) {
  if (!wrap.gated)
    return { ok: true, tokenQuery: "" };
  if (!env.JWT_SECRET) {
    return { ok: false, resp: html2(renderGateError("Server misconfigured: JWT_SECRET not set."), 500) };
  }
  const queryToken = url.searchParams.get("t") ?? void 0;
  const cookieToken = readCookie(req, gateCookieName(wrapId));
  const authorization = req.headers.get("authorization") ?? "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : void 0;
  const t = queryToken ?? cookieToken ?? bearerToken;
  if (!t) {
    return {
      ok: false,
      resp: html2(renderGateError("This share is gated. A valid access token is required."), 401)
    };
  }
  const claims = await verifyJWT(t, env.JWT_SECRET);
  if (!claims) {
    return { ok: false, resp: html2(renderGateError("Invalid token signature."), 401) };
  }
  if (claims.sub !== wrapId) {
    return { ok: false, resp: html2(renderGateError("Token does not match this share."), 403) };
  }
  const now = Math.floor(Date.now() / 1e3);
  if (claims.exp < now) {
    return { ok: false, resp: html2(renderGateError("This access token has expired."), 401) };
  }
  if (await env.NOTES.get(`revoked:${claims.jti}`)) {
    return { ok: false, resp: html2(renderGateError("This access token has been revoked."), 401) };
  }
  if (queryToken && exchangeQueryToken) {
    return { ok: false, resp: gatedSessionRedirect(url, wrapId, queryToken, claims.exp) };
  }
  if (claims.max_views) {
    const c = parseInt(await env.NOTES.get(`views:${claims.jti}`) ?? "0", 10);
    if (c >= claims.max_views) {
      return { ok: false, resp: html2(renderGateError("This token has reached its view limit."), 401) };
    }
    await env.NOTES.put(`views:${claims.jti}`, String(c + 1));
  }
  return { ok: true, tokenQuery: "" };
}
__name(checkGate, "checkGate");
async function getWrapVersion(env, wrapId) {
  const v = await env.NOTES.get(`ver:${wrapId}`);
  return v ? parseInt(v, 10) : 1;
}
__name(getWrapVersion, "getWrapVersion");
async function bumpWrapVersion(env, wrapId) {
  const cur = await getWrapVersion(env, wrapId);
  await env.NOTES.put(`ver:${wrapId}`, String(cur + 1));
}
__name(bumpWrapVersion, "bumpWrapVersion");
async function addRef(env, refKey, wrapId) {
  const raw = await env.NOTES.get(refKey);
  const refs = raw ? JSON.parse(raw) : [];
  if (!refs.includes(wrapId)) {
    refs.push(wrapId);
    await env.NOTES.put(refKey, JSON.stringify(refs));
  }
}
__name(addRef, "addRef");
async function removeRef(env, refKey, wrapId) {
  const raw = await env.NOTES.get(refKey);
  if (!raw)
    return;
  const refs = JSON.parse(raw).filter((r) => r !== wrapId);
  await env.NOTES.put(refKey, JSON.stringify(refs));
}
__name(removeRef, "removeRef");
async function buildWrapIndex(env, wrapId, wrap) {
  const ver = await getWrapVersion(env, wrapId);
  const allRecords = await loadNotes(env.NOTES, wrap.ulids);
  const noteEntries = allRecords.map((r) => {
    let title = r.basename;
    if (r.md) {
      const { fm, body } = parseFrontmatter(r.md);
      const h1Match = body.match(/^\s*#\s+(.+?)\s*$/m);
      const bodyH1 = h1Match ? h1Match[1].trim() : "";
      const fmTitle = fm ? fm.byKey.get("title") : void 0;
      title = bodyH1 || fmTitle || r.basename;
    }
    return { ulid: r.ulid, basename: r.basename, path: r.path, title };
  });
  const canvasEntries = await loadCanvasMeta(env.NOTES, wrap.canvases ?? []);
  const backlinksMap = buildBacklinks(allRecords);
  const backlinks = {};
  for (const [targetUlid, sources] of backlinksMap) {
    backlinks[targetUlid] = sources.map(({ ulid, title, path }) => ({ ulid, title, path }));
  }
  const idx = {
    notes: noteEntries,
    canvases: canvasEntries,
    backlinks,
    builtAt: (/* @__PURE__ */ new Date()).toISOString(),
    builtForVersion: ver
  };
  await env.NOTES.put(`wrapindex:${wrapId}`, JSON.stringify(idx));
}
__name(buildWrapIndex, "buildWrapIndex");
var src_default = {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;
    const origin = url.origin;
    const purgeMatch = path.match(/^\/__admin\/purge\/([a-zA-Z0-9_-]{1,64})$/);
    if (purgeMatch) {
      if (unauthorized(env, req))
        return forbidden();
      if (req.method !== "POST")
        return new Response("method not allowed", { status: 405 });
      const wrapId = purgeMatch[1];
      await bumpWrapVersion(env, wrapId);
      const newVer = await getWrapVersion(env, wrapId);
      return json({ purged: wrapId, version: newVer });
    }
    const noteMatch = path.match(/^\/api\/notes\/([0-9A-HJKMNP-TV-Z]{26})$/);
    if (noteMatch) {
      if (unauthorized(env, req))
        return forbidden();
      if (req.method === "PUT" && !await rateLimitOk(env, req, "notes", 120, 60))
        return rateLimited(60);
      const ulid = noteMatch[1];
      if (req.method === "PUT") {
        const body = await req.text();
        if (body.length > 1e6) {
          return new Response("note too large (>1MB)", { status: 413 });
        }
        await env.NOTES.put(`note:${ulid}`, body);
        if (req.headers.get("x-brainshare-standalone") === "public") {
          await env.NOTES.put(`standalone:${ulid}`, "1");
        } else {
          await env.NOTES.delete(`standalone:${ulid}`);
        }
        let notePath = req.headers.get("x-note-path");
        if (notePath) {
          try {
            notePath = decodeURIComponent(notePath);
          } catch {
          }
          const basename = notePath.split("/").pop().replace(/\.md$/i, "");
          await env.NOTES.put(`meta:${ulid}`, JSON.stringify({ path: notePath, basename }));
        }
        const refsRaw = await env.NOTES.get(`noterefs:${ulid}`);
        if (refsRaw) {
          const wrapIds = JSON.parse(refsRaw);
          await Promise.all(wrapIds.map((wid) => bumpWrapVersion(env, wid)));
          ctx.waitUntil(Promise.all(wrapIds.map(async (wid) => {
            const wRaw = await env.NOTES.get(`wrap:${wid}`);
            if (wRaw)
              await buildWrapIndex(env, wid, JSON.parse(wRaw));
          })));
        }
        return json({ ulid, url: `${origin}/${ulid}` });
      }
      if (req.method === "DELETE") {
        await env.NOTES.delete(`note:${ulid}`);
        await env.NOTES.delete(`standalone:${ulid}`);
        await env.NOTES.delete(`meta:${ulid}`);
        const refsRaw = await env.NOTES.get(`noterefs:${ulid}`);
        if (refsRaw) {
          const wrapIds = JSON.parse(refsRaw);
          await Promise.all(wrapIds.map((wid) => bumpWrapVersion(env, wid)));
          ctx.waitUntil(Promise.all(wrapIds.map(async (wid) => {
            const wRaw = await env.NOTES.get(`wrap:${wid}`);
            if (wRaw)
              await buildWrapIndex(env, wid, JSON.parse(wRaw));
          })));
        }
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
    }
    const canvasMatch = path.match(/^\/api\/canvases\/([0-9A-HJKMNP-TV-Z]{26})$/);
    if (canvasMatch) {
      if (unauthorized(env, req))
        return forbidden();
      if (req.method === "PUT" && !await rateLimitOk(env, req, "notes", 120, 60))
        return rateLimited(60);
      const ulid = canvasMatch[1];
      if (req.method === "PUT") {
        const body = await req.text();
        if (body.length > 2e6)
          return new Response("canvas too large (>2MB)", { status: 413 });
        try {
          JSON.parse(body);
        } catch {
          return new Response("invalid JSON", { status: 400 });
        }
        await env.NOTES.put(`canvas:${ulid}`, body);
        let p = req.headers.get("x-note-path");
        if (p) {
          try {
            p = decodeURIComponent(p);
          } catch {
          }
          const basename = p.split("/").pop().replace(/\.canvas$/i, "");
          await env.NOTES.put(`canvasmeta:${ulid}`, JSON.stringify({ path: p, basename }));
        }
        const refsRaw = await env.NOTES.get(`canvasrefs:${ulid}`);
        if (refsRaw) {
          const wrapIds = JSON.parse(refsRaw);
          await Promise.all(wrapIds.map((wid) => bumpWrapVersion(env, wid)));
          ctx.waitUntil(Promise.all(wrapIds.map(async (wid) => {
            const wRaw = await env.NOTES.get(`wrap:${wid}`);
            if (wRaw)
              await buildWrapIndex(env, wid, JSON.parse(wRaw));
          })));
        }
        return json({ ulid, url: `${origin}/c/${ulid}` });
      }
      if (req.method === "DELETE") {
        await env.NOTES.delete(`canvas:${ulid}`);
        await env.NOTES.delete(`canvasmeta:${ulid}`);
        const refsRaw = await env.NOTES.get(`canvasrefs:${ulid}`);
        if (refsRaw) {
          const wrapIds = JSON.parse(refsRaw);
          await Promise.all(wrapIds.map((wid) => bumpWrapVersion(env, wid)));
          ctx.waitUntil(Promise.all(wrapIds.map(async (wid) => {
            const wRaw = await env.NOTES.get(`wrap:${wid}`);
            if (wRaw)
              await buildWrapIndex(env, wid, JSON.parse(wRaw));
          })));
        }
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
    }
    const assetMatch = path.match(/^\/(?:api\/)?asset(?:s)?\/([a-f0-9]{16,128})(?:\.[a-z0-9]+)?$/i);
    if (assetMatch) {
      const key = assetMatch[1].toLowerCase();
      if (req.method === "PUT") {
        if (unauthorized(env, req))
          return forbidden();
        if (!await rateLimitOk(env, req, "asset-put", 60, 60))
          return rateLimited(60);
        const ct = req.headers.get("content-type") ?? "application/octet-stream";
        const buf = await req.arrayBuffer();
        if (buf.byteLength > 5e6)
          return new Response("asset too large (>5MB)", { status: 413 });
        await env.NOTES.put(`asset:${key}`, buf, { metadata: { contentType: ct } });
        return json({ key, url: `${origin}/asset/${key}` });
      }
      if (req.method === "GET") {
        return new Response("not found", { status: 404 });
      }
      if (req.method === "DELETE" && !unauthorized(env, req)) {
        await env.NOTES.delete(`asset:${key}`);
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
    }
    const scopedAssetMatch = path.match(new RegExp("^/share/([a-zA-Z0-9_-]{1,64})/asset/([a-f0-9]{16,128})$", "i"));
    if (scopedAssetMatch && req.method === "GET") {
      const [, wrapId, rawKey] = scopedAssetMatch;
      const key = rawKey.toLowerCase();
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw)
        return new Response("not found", { status: 404 });
      const wrap = JSON.parse(wrapRaw);
      if (!Object.values(wrap.assets ?? {}).some((value2) => value2.toLowerCase() === key))
        return new Response("asset not in this share", { status: 403 });
      const gate = await checkGate(env, wrap, wrapId, url, req);
      if (!gate.ok)
        return gate.resp;
      const { value, metadata } = await env.NOTES.getWithMetadata(`asset:${key}`, "arrayBuffer");
      if (!value)
        return new Response("not found", { status: 404 });
      const ct = metadata?.contentType ?? "application/octet-stream";
      return new Response(value, { headers: {
        "content-type": ct,
        "cache-control": wrap.gated ? "private, no-store" : "public, max-age=300",
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'"
      } });
    }
    if (path === "/api/export") {
      if (unauthorized(env, req))
        return forbidden();
      if (req.method !== "GET")
        return new Response("method not allowed", { status: 405 });
      const lines = [];
      let cursor;
      let pages = 0;
      do {
        const list2 = await env.NOTES.list({ cursor, limit: 1e3 });
        for (const k of list2.keys) {
          const value = await env.NOTES.get(k.name);
          lines.push(JSON.stringify({ key: k.name, value }));
        }
        cursor = list2.list_complete ? void 0 : list2.cursor;
        pages++;
        if (pages > 20)
          break;
      } while (cursor);
      return new Response(lines.join("\n") + "\n", {
        headers: {
          "content-type": "application/x-ndjson",
          "content-disposition": `attachment; filename="brainshare-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19)}.ndjson"`
        }
      });
    }
    const mintMatch = path.match(/^\/api\/wrappers\/([a-zA-Z0-9_-]{1,64})\/tokens$/);
    if (mintMatch) {
      if (unauthorized(env, req))
        return forbidden();
      if (req.method !== "POST")
        return new Response("method not allowed", { status: 405 });
      if (!await rateLimitOk(env, req, "mint", 30, 60))
        return rateLimited(60);
      if (!env.JWT_SECRET)
        return new Response("JWT_SECRET not configured", { status: 500 });
      const id = mintMatch[1];
      const wrapRaw = await env.NOTES.get(`wrap:${id}`);
      if (!wrapRaw)
        return new Response("wrapper not found", { status: 404 });
      let body;
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      const now = Math.floor(Date.now() / 1e3);
      const expSeconds = body.exp_seconds ?? (body.exp_days ?? 7) * 86400;
      const exp = now + expSeconds;
      const jti = crypto.randomUUID();
      const claims = {
        sub: id,
        jti,
        iat: now,
        exp,
        ...body.max_views ? { max_views: body.max_views } : {},
        ...body.viewer ? { viewer: body.viewer } : {}
      };
      const jwt = await signJWT(claims, env.JWT_SECRET);
      return json({
        jti,
        jwt,
        url: `${origin}/share/${id}?t=${jwt}`,
        exp,
        viewer: body.viewer,
        max_views: body.max_views
      });
    }
    const revokeMatch = path.match(/^\/api\/wrappers\/([a-zA-Z0-9_-]{1,64})\/revoke$/);
    if (revokeMatch) {
      if (unauthorized(env, req))
        return forbidden();
      if (req.method !== "POST")
        return new Response("method not allowed", { status: 405 });
      if (!await rateLimitOk(env, req, "revoke", 30, 60))
        return rateLimited(60);
      let body;
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      if (!body.jti)
        return new Response("missing jti", { status: 400 });
      await env.NOTES.put(`revoked:${body.jti}`, "1");
      return json({ jti: body.jti, revoked: true });
    }
    const wrapMatch = path.match(/^\/api\/wrappers\/([a-zA-Z0-9_-]{1,64})$/);
    if (wrapMatch) {
      if (unauthorized(env, req))
        return forbidden();
      if (req.method === "PUT" && !await rateLimitOk(env, req, "wrap", 60, 60))
        return rateLimited(60);
      const id = wrapMatch[1];
      if (req.method === "GET") {
        const raw = await env.NOTES.get(`wrap:${id}`);
        if (!raw)
          return new Response("wrapper not found", { status: 404 });
        return new Response(raw, { headers: { "content-type": "application/json" } });
      }
      if (req.method === "PUT") {
        const body = await req.text();
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        if (!parsed.ulids || !Array.isArray(parsed.ulids)) {
          return new Response("missing ulids[]", { status: 400 });
        }
        for (const u of parsed.ulids) {
          if (!ULID_PATTERN.test(u)) {
            return new Response(`bad ulid: ${u}`, { status: 400 });
          }
        }
        if (parsed.canvases) {
          if (!Array.isArray(parsed.canvases))
            return new Response("canvases must be array", { status: 400 });
          for (const u of parsed.canvases) {
            if (!ULID_PATTERN.test(u))
              return new Response(`bad canvas ulid: ${u}`, { status: 400 });
          }
        }
        if (parsed.assets && (typeof parsed.assets !== "object" || Array.isArray(parsed.assets))) {
          return new Response("assets must be { filename: key } object", { status: 400 });
        }
        if (!parsed.created_at)
          parsed.created_at = (/* @__PURE__ */ new Date()).toISOString();
        if (parsed.gated !== true)
          parsed.gated = false;
        const oldRaw = await env.NOTES.get(`wrap:${id}`);
        const oldWrap = oldRaw ? JSON.parse(oldRaw) : null;
        const oldUlids = new Set(oldWrap?.ulids ?? []);
        const newUlids = new Set(parsed.ulids);
        const oldCanvases = new Set(oldWrap?.canvases ?? []);
        const newCanvases = new Set(parsed.canvases ?? []);
        const refOps = [];
        for (const u of newUlids) {
          if (!oldUlids.has(u))
            refOps.push(addRef(env, `noterefs:${u}`, id));
        }
        for (const u of oldUlids) {
          if (!newUlids.has(u))
            refOps.push(removeRef(env, `noterefs:${u}`, id));
        }
        for (const u of newCanvases) {
          if (!oldCanvases.has(u))
            refOps.push(addRef(env, `canvasrefs:${u}`, id));
        }
        for (const u of oldCanvases) {
          if (!newCanvases.has(u))
            refOps.push(removeRef(env, `canvasrefs:${u}`, id));
        }
        await Promise.all(refOps);
        await env.NOTES.put(`wrap:${id}`, JSON.stringify(parsed));
        await bumpWrapVersion(env, id);
        await buildWrapIndex(env, id, parsed);
        return json({ id, url: `${origin}/share/${id}`, gated: parsed.gated, canvases: parsed.canvases?.length ?? 0, assets: Object.keys(parsed.assets ?? {}).length });
      }
      if (req.method === "DELETE") {
        const delRaw = await env.NOTES.get(`wrap:${id}`);
        if (delRaw) {
          const delWrap = JSON.parse(delRaw);
          const cleanOps = [];
          for (const u of delWrap.ulids)
            cleanOps.push(removeRef(env, `noterefs:${u}`, id));
          for (const u of delWrap.canvases ?? [])
            cleanOps.push(removeRef(env, `canvasrefs:${u}`, id));
          await Promise.all(cleanOps);
        }
        await env.NOTES.delete(`wrap:${id}`);
        await env.NOTES.delete(`wrapindex:${id}`);
        return new Response(null, { status: 204 });
      }
      return new Response("method not allowed", { status: 405 });
    }
    const downloadMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})\/download$/);
    if (downloadMatch && req.method === "GET") {
      const wrapId = downloadMatch[1];
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw)
        return html2("<h1>404</h1><p>wrapper not found</p>", 404);
      const wrap = JSON.parse(wrapRaw);
      const gate = await checkGate(env, wrap, wrapId, url, req);
      if (!gate.ok)
        return gate.resp;
      const records = await loadNotes(env.NOTES, wrap.ulids);
      const files = {};
      const enc2 = new TextEncoder();
      for (const r of records) {
        if (!r.md)
          continue;
        const filePath = r.path || `${r.ulid}.md`;
        files[filePath] = enc2.encode(r.md);
      }
      files["brainshare.json"] = enc2.encode(JSON.stringify({
        wrapId,
        title: wrap.title ?? null,
        description: wrap.description ?? null,
        gated: !!wrap.gated,
        ulids: wrap.ulids,
        created_at: wrap.created_at ?? null,
        publisher: origin,
        exported_at: (/* @__PURE__ */ new Date()).toISOString()
      }, null, 2));
      const zipped = zipSync(files);
      return new Response(zipped, {
        headers: {
          "content-type": "application/zip",
          "content-disposition": `attachment; filename="${wrapId}.zip"`,
          "cache-control": "no-store"
        }
      });
    }
    const searchMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})\/api\/search$/);
    if (searchMatch && req.method === "GET") {
      const wrapId = searchMatch[1];
      const q = (url.searchParams.get("q") ?? "").trim();
      if (q.length < 2)
        return json({ matches: [] });
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw)
        return new Response("not found", { status: 404 });
      const wrap = JSON.parse(wrapRaw);
      const gate = await checkGate(env, wrap, wrapId, url, req);
      if (!gate.ok)
        return gate.resp;
      const records = await loadNotes(env.NOTES, wrap.ulids);
      const qLower = q.toLowerCase();
      const matches = [];
      for (const r of records) {
        if (!r.md)
          continue;
        const titleHit = r.title.toLowerCase().includes(qLower);
        const bodyLower = r.md.toLowerCase();
        const idx = bodyLower.indexOf(qLower);
        if (!titleHit && idx < 0)
          continue;
        const anchor = idx >= 0 ? idx : 0;
        const mdBody = r.md.replace(/^---[\s\S]*?\n---\s*\n/, "");
        const bodyLowerClean = mdBody.toLowerCase();
        const idxClean = bodyLowerClean.indexOf(qLower);
        const anchorClean = idxClean >= 0 ? idxClean : 0;
        let startClean = Math.max(0, anchorClean - 120);
        let endClean = Math.min(mdBody.length, anchorClean + q.length + 120);
        const fmMatch = r.md.match(/^---[\s\S]*?\n---\s*\n/);
        const bodyStart = fmMatch ? fmMatch[0].length : 0;
        if (startClean < bodyStart && anchorClean >= bodyStart)
          startClean = bodyStart;
        if (startClean > 0) {
          const wordStart = mdBody.slice(startClean, anchorClean).search(/\s/);
          if (wordStart >= 0 && wordStart < 30)
            startClean = startClean + wordStart + 1;
        }
        if (endClean < mdBody.length) {
          const tail = mdBody.slice(anchorClean + q.length, endClean);
          const lastSpace = tail.lastIndexOf(" ");
          if (lastSpace > tail.length - 30)
            endClean = anchorClean + q.length + lastSpace;
        }
        let snippet = mdBody.slice(startClean, endClean).replace(/\s+/g, " ").trim();
        if (startClean > 0)
          snippet = "\u2026" + snippet;
        if (endClean < mdBody.length)
          snippet = snippet + "\u2026";
        let bodyHits = 0;
        let scan = bodyLower.indexOf(qLower);
        while (scan !== -1 && bodyHits < 50) {
          bodyHits++;
          scan = bodyLower.indexOf(qLower, scan + qLower.length);
        }
        matches.push({
          ulid: r.ulid,
          title: r.title,
          path: r.path,
          snippet,
          matchOffset: anchor,
          bodyHits: titleHit ? bodyHits + 5 : bodyHits
          // title hits rank higher
        });
      }
      matches.sort((a, b) => b.bodyHits - a.bodyHits);
      return json({ matches: matches.slice(0, 30), query: q });
    }
    const ogMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})\/([0-9A-HJKMNP-TV-Z]{26})\/og\.svg$/);
    if (ogMatch && req.method === "GET") {
      const [, wrapId, ulid] = ogMatch;
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw)
        return new Response("wrapper not found", { status: 404 });
      const wrap = JSON.parse(wrapRaw);
      if (!wrap.ulids.includes(ulid))
        return new Response("note not in this share", { status: 403 });
      const gate = await checkGate(env, wrap, wrapId, url, req);
      if (!gate.ok)
        return gate.resp;
      const [md, meta] = await Promise.all([
        env.NOTES.get(`note:${ulid}`),
        env.NOTES.get(`meta:${ulid}`)
      ]);
      if (!md)
        return new Response("note not yet published", { status: 404 });
      let basename = ulid, fullPath = "";
      if (meta) {
        try {
          const m = JSON.parse(meta);
          basename = m.basename || ulid;
          fullPath = m.path || "";
        } catch {
        }
      }
      const bodyH1Match = md.match(/^---[\s\S]*?\n---\s*\n\s*#\s+(.+?)\s*$/m) ?? md.match(/^\s*#\s+(.+?)\s*$/m);
      const title = (bodyH1Match ? bodyH1Match[1].trim() : "") || basename;
      const folder = fullPath.includes("/") ? fullPath.split("/").slice(0, -1).join("/") : "";
      const body = md.replace(/^---[\s\S]*?\n---\s*\n/, "");
      const wordCount = (body.match(/\b\w+\b/g) ?? []).length;
      const svg2 = renderOgCard({
        title,
        wrapTitle: wrap.title ?? "",
        folder,
        wordCount,
        gated: wrap.gated
      });
      return new Response(svg2, {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=300, s-maxage=300"
        }
      });
    }
    function ulidToIso(ulid) {
      const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
      const ts10 = ulid.slice(0, 10).toUpperCase();
      let ms = 0;
      for (let i = 0; i < ts10.length; i++) {
        ms = ms * 32 + CROCKFORD.indexOf(ts10[i]);
      }
      return new Date(ms).toISOString();
    }
    __name(ulidToIso, "ulidToIso");
    const feedMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})\/feed\.xml$/);
    if (feedMatch && req.method === "GET") {
      const wrapId = feedMatch[1];
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw)
        return new Response("wrapper not found", { status: 404 });
      const wrap = JSON.parse(wrapRaw);
      const gate = await checkGate(env, wrap, wrapId, url, req);
      if (!gate.ok)
        return gate.resp;
      const records = await loadNotes(env.NOTES, wrap.ulids);
      const shareBase = `${origin}/share/${wrapId}`;
      const feedQueryToken = url.searchParams.get("t");
      const tq = wrap.gated && feedQueryToken ? `?t=${encodeURIComponent(feedQueryToken)}` : "";
      const sorted = [...records].sort((a, b) => b.ulid.localeCompare(a.ulid));
      const updated = wrap.created_at || (/* @__PURE__ */ new Date()).toISOString();
      const xmlEscape = /* @__PURE__ */ __name((s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"), "xmlEscape");
      const entries = sorted.slice(0, 20).map((r) => {
        if (!r.md)
          return "";
        const body = r.md.replace(/^---[\s\S]*?\n---\s*\n/, "").trim();
        const summary = body.slice(0, 400).replace(/\s+/g, " ");
        const entryUpdated = ulidToIso(r.ulid);
        return `  <entry>
    <title>${xmlEscape(r.title)}</title>
    <link href="${xmlEscape(shareBase + "/" + r.ulid + tq)}"/>
    <id>tag:brainshare,${entryUpdated.slice(0, 10)}:${r.ulid}</id>
    <updated>${xmlEscape(entryUpdated)}</updated>
    <summary>${xmlEscape(summary)}${body.length > 400 ? "\u2026" : ""}</summary>
  </entry>`;
      }).filter(Boolean).join("\n");
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xmlEscape(wrap.title ?? "BrainShare slice")}</title>
  <subtitle>${xmlEscape(wrap.description ?? "")}</subtitle>
  <author><name>${xmlEscape(wrap.title ?? "BrainShare")}</name></author>
  <link href="${xmlEscape(shareBase + tq)}" rel="alternate"/>
  <link href="${xmlEscape(shareBase + "/feed.xml" + tq)}" rel="self"/>
  <id>tag:brainshare,${updated.slice(0, 10)}:${wrapId}</id>
  <updated>${xmlEscape(updated)}</updated>
${entries}
</feed>
`;
      return new Response(xml, {
        headers: {
          "content-type": "application/atom+xml; charset=utf-8",
          "cache-control": wrap.gated ? "private, no-store" : "public, max-age=600, s-maxage=600"
        }
      });
    }
    const scopedCanvasMatch = path.match(
      /^\/share\/([a-zA-Z0-9_-]{1,64})\/c\/([0-9A-HJKMNP-TV-Z]{26})$/
    );
    if (scopedCanvasMatch && req.method === "GET") {
      const [, wrapId, ulid] = scopedCanvasMatch;
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw)
        return html2("<h1>404</h1><p>wrapper not found</p>", 404);
      const wrap = JSON.parse(wrapRaw);
      if (!wrap.canvases?.includes(ulid)) {
        return html2("<h1>403</h1><p>canvas not in this share</p>", 403);
      }
      const gate = await checkGate(env, wrap, wrapId, url, req, true);
      if (!gate.ok)
        return gate.resp;
      const [canvasJson, canvasPath, shareSet, canvasSet, treeNotes, treeCanvases] = await Promise.all([
        env.NOTES.get(`canvas:${ulid}`),
        env.NOTES.get(`canvasmeta:${ulid}`).then((r) => r ? JSON.parse(r).path : void 0),
        buildShareSet(env.NOTES, wrap.ulids),
        buildCanvasSet(env.NOTES, wrap.canvases),
        loadNotesMeta(env.NOTES, wrap.ulids),
        loadCanvasMeta(env.NOTES, wrap.canvases)
      ]);
      if (!canvasJson)
        return html2("<h1>404</h1><p>canvas not yet published</p>", 404);
      const shareBase = `${origin}/share/${wrapId}`;
      return html2(renderCanvas(canvasJson, ulid, {
        shareBase,
        shareSet,
        canvasSet,
        path: canvasPath,
        tokenQuery: "",
        gated: wrap.gated,
        wrapTree: {
          wrapTitle: wrap.title ?? "Shared slice",
          wrapDesc: wrap.description,
          notes: treeNotes,
          canvases: treeCanvases,
          assetCount: wrap.assets ? Object.keys(wrap.assets).length : 0
        }
      }));
    }
    const scopedMatch = path.match(
      /^\/share\/([a-zA-Z0-9_-]{1,64})\/([0-9A-HJKMNP-TV-Z]{26})$/
    );
    if (scopedMatch && req.method === "GET") {
      const [, wrapId, ulid] = scopedMatch;
      const wrapRaw = await env.NOTES.get(`wrap:${wrapId}`);
      if (!wrapRaw)
        return html2("<h1>404</h1><p>wrapper not found</p>", 404);
      const wrap = JSON.parse(wrapRaw);
      if (!wrap.ulids.includes(ulid)) {
        return html2("<h1>403</h1><p>note not in this share</p>", 403);
      }
      const rawRequest = url.searchParams.get("raw") === "1";
      const gate = await checkGate(env, wrap, wrapId, url, req, !rawRequest);
      if (!gate.ok)
        return gate.resp;
      if (!rawRequest) {
        const ver = await getWrapVersion(env, wrapId);
        const cacheKey = new Request(
          `${origin}/__cache/v${ver}/share/${wrapId}/${ulid}`,
          { method: "GET" }
        );
        const cache = caches.default;
        const cached = await cache.match(cacheKey);
        if (cached)
          return cached;
        const [indexRaw, currentMd, currentMetaRaw] = await Promise.all([
          env.NOTES.get(`wrapindex:${wrapId}`),
          env.NOTES.get(`note:${ulid}`),
          env.NOTES.get(`meta:${ulid}`)
        ]);
        let resp;
        if (!indexRaw) {
          const [allRecords2, canvasSet, treeCanvases] = await Promise.all([
            loadNotes(env.NOTES, wrap.ulids),
            buildCanvasSet(env.NOTES, wrap.canvases ?? []),
            loadCanvasMeta(env.NOTES, wrap.canvases ?? [])
          ]);
          const current2 = allRecords2.find((r) => r.ulid === ulid);
          if (!current2 || !current2.md)
            return html2("<h1>404</h1><p>note not yet published</p>", 404);
          const shareSet = new Map(allRecords2.map((r) => [r.basename, r.ulid]));
          const backlinksMap = buildBacklinks(allRecords2);
          const treeNotes = allRecords2.map(({ ulid: u, basename, path: path2, title }) => ({ ulid: u, basename, path: path2, title }));
          const folderNav = folderSiblings(
            { ulid: current2.ulid, path: current2.path },
            allRecords2
          );
          const shareBase = `${origin}/share/${wrapId}`;
          resp = html2(renderNote(current2.md, ulid, {
            shareBase,
            shareSet,
            canvasSet,
            assets: wrap.assets,
            path: current2.path,
            tokenQuery: "",
            gated: wrap.gated,
            wrapTree: {
              wrapTitle: wrap.title ?? "Shared slice",
              wrapDesc: wrap.description,
              notes: treeNotes,
              canvases: treeCanvases,
              assetCount: wrap.assets ? Object.keys(wrap.assets).length : 0
            },
            backlinks: (backlinksMap.get(ulid) ?? []).map((b) => ({
              ulid: b.ulid,
              title: b.title,
              path: b.path
            })),
            folderNav
          }));
          ctx.waitUntil(buildWrapIndex(env, wrapId, wrap));
        } else {
          if (!currentMd)
            return html2("<h1>404</h1><p>note not yet published</p>", 404);
          let idx;
          try {
            idx = JSON.parse(indexRaw);
          } catch {
            ctx.waitUntil(buildWrapIndex(env, wrapId, wrap));
            return html2("<h1>500</h1><p>index temporarily unavailable, please retry</p>", 500);
          }
          const currentMeta = currentMetaRaw ? (() => {
            try {
              return JSON.parse(currentMetaRaw);
            } catch {
              return { path: "", basename: ulid };
            }
          })() : { path: "", basename: ulid };
          const shareSet = new Map(idx.notes.map((n) => [n.basename, n.ulid]));
          const canvasSet = new Map(idx.canvases.map((c) => [c.basename, c.ulid]));
          const treeNotes = idx.notes.map(({ ulid: u, basename, path: path2, title }) => ({ ulid: u, basename, path: path2, title }));
          const treeCanvases = idx.canvases;
          const folderNav = folderSiblings(
            { ulid, path: currentMeta.path },
            idx.notes.map((n) => ({ ulid: n.ulid, basename: n.basename, path: n.path, title: n.title }))
          );
          const backlinks = idx.backlinks[ulid] ?? [];
          const shareBase = `${origin}/share/${wrapId}`;
          resp = html2(renderNote(currentMd, ulid, {
            shareBase,
            shareSet,
            canvasSet,
            assets: wrap.assets,
            path: currentMeta.path,
            tokenQuery: "",
            gated: wrap.gated,
            wrapTree: {
              wrapTitle: wrap.title ?? "Shared slice",
              wrapDesc: wrap.description,
              notes: treeNotes,
              canvases: treeCanvases,
              assetCount: wrap.assets ? Object.keys(wrap.assets).length : 0
            },
            backlinks,
            folderNav
          }));
        }
        resp.headers.set("cache-control", "public, max-age=86400, s-maxage=86400");
        ctx.waitUntil(cache.put(cacheKey, resp.clone()));
        return resp;
      }
      const [allRecords] = await Promise.all([
        loadNotes(env.NOTES, wrap.ulids)
      ]);
      const current = allRecords.find((r) => r.ulid === ulid);
      if (!current || !current.md)
        return html2("<h1>404</h1><p>note not yet published</p>", 404);
      return new Response(current.md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
    }
    const standaloneCanvasMatch = path.match(new RegExp("^/c/([0-9A-HJKMNP-TV-Z]{26})$"));
    if (standaloneCanvasMatch && req.method === "GET")
      return html2("<h1>404</h1><p>canvas not found</p>", 404);
    const shareMatch = path.match(/^\/share\/([a-zA-Z0-9_-]{1,64})$/);
    if (shareMatch && req.method === "GET") {
      const id = shareMatch[1];
      const raw = await env.NOTES.get(`wrap:${id}`);
      if (!raw)
        return html2("<h1>404</h1><p>wrapper not found</p>", 404);
      const wrap = JSON.parse(raw);
      const gate = await checkGate(env, wrap, id, url, req, true);
      if (!gate.ok)
        return gate.resp;
      const ver = await getWrapVersion(env, id);
      const cacheKey = new Request(
        `${origin}/__cache/v${ver}/share/${id}`,
        { method: "GET" }
      );
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached)
        return cached;
      const resp = html2(await renderWrapper(env.NOTES, origin, id, wrap, ""));
      resp.headers.set("cache-control", "public, max-age=86400, s-maxage=86400");
      ctx.waitUntil(cache.put(cacheKey, resp.clone()));
      return resp;
    }
    const getMatch = path.match(/^\/([0-9A-HJKMNP-TV-Z]{26})$/);
    if (getMatch && req.method === "GET") {
      const ulid = getMatch[1];
      const standalone = await env.NOTES.get(`standalone:${ulid}`);
      if (!standalone)
        return html2("<h1>404</h1><p>note not found</p>", 404);
      const refsRaw = await env.NOTES.get(`noterefs:${ulid}`);
      if (refsRaw) {
        let refs;
        try {
          refs = JSON.parse(refsRaw);
        } catch {
          return forbidden();
        }
        if (!Array.isArray(refs))
          return forbidden();
        for (const wrapId of refs) {
          const raw = await env.NOTES.get(`wrap:${wrapId}`);
          if (!raw)
            continue;
          let referenced;
          try {
            referenced = JSON.parse(raw);
          } catch {
            return forbidden();
          }
          if (referenced.gated)
            return forbidden();
        }
      }
      const [md, notePath] = await Promise.all([
        env.NOTES.get(`note:${ulid}`),
        getNotePath(env.NOTES, ulid)
      ]);
      if (!md)
        return html2("<h1>404</h1><p>note not found</p>", 404);
      return html2(renderNote(md, ulid, { path: notePath }));
    }
    if (path === "/llms.txt" && req.method === "GET") {
      const body = `# BrainShare

> Free, open-source Obsidian publishing plugin and Cloudflare Worker. Publish a slice of your Obsidian vault as a public or token-gated URL. Self-hostable in about 60 seconds on Cloudflare's free tier.

## About
- Name: BrainShare
- License: AGPL-3.0-only
- Author: Maheen (https://github.com/MachoMaheen)
- Repo: https://github.com/MachoMaheen/brainshare
- Install: BRAT MachoMaheen/brainshare (beta) or Obsidian community store (PR #12449, in review)
- Price: $0
- Backend: Cloudflare KV only (no Postgres, no Redis, no S3)

## Key endpoints
- /share/{wrapId} - public or token-gated rendered slice
- /share/{wrapId}/{ulid} - single note within a slice
- /share/{wrapId}/api/search?q={query} - full-text search
- /share/{wrapId}/feed.xml - Atom RSS feed for a slice
- /api/wrappers/{wrapId} - wrap metadata as JSON (auth required)
- /pricing.md - machine-readable pricing
- /robots.txt - crawler policy

## Positioning
BrainShare is an alternative to Obsidian Publish (the paid Obsidian SaaS, $96/year). Obsidian itself is the underlying note-taking app and is not what BrainShare positions against.

## Featured
- /share/letter - the launch announcement (15 May 2026)
`;
      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" }
      });
    }
    if (path === "/pricing.md" && req.method === "GET") {
      const body = `# Pricing - BrainShare

## Self-host (the only tier)
- Price: $0/month forever
- Limits: Cloudflare free tier (100,000 KV reads/day, 1,000 writes/day, 1 GB storage per namespace)
- Features: full renderer, JWT-gated sharing, full-text search, RSS, canvases, mermaid, knowledge graph, AGPL-3.0-licensed source

There is no paid tier. There is no signup. There is no sales call.

If you exceed Cloudflare's free tier, upgrade your Cloudflare plan (Workers Paid is $5/month). BrainShare itself remains $0.

## Install
- BRAT (beta channel): MachoMaheen/brainshare
- Community store: pending review (https://github.com/obsidianmd/obsidian-releases/pull/12449)
- Source: https://github.com/MachoMaheen/brainshare

## Compare
- vs Obsidian Publish: BrainShare $0, self-hostable, AGPLv3, with API and per-recipient gating. Obsidian Publish $96/year, vendor-hosted, closed source.
`;
      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=3600" }
      });
    }
    if (path === "/robots.txt" && req.method === "GET") {
      const body = `User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" }
      });
    }
    if (path === "/sitemap.xml" && req.method === "GET") {
      const urls = [];
      const push = /* @__PURE__ */ __name((loc, changefreq = "weekly", priority = "0.7") => {
        urls.push(`<url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`);
      }, "push");
      push(`${origin}/`, "daily", "1.0");
      push(`${origin}/llms.txt`, "monthly", "0.5");
      push(`${origin}/pricing.md`, "monthly", "0.5");
      const envWhitelist = env.SITEMAP_WRAPS;
      const allowedWraps = envWhitelist?.trim() ? envWhitelist.split(",").map((s) => s.trim()).filter(Boolean) : ["letter"];
      for (const wrapId of allowedWraps) {
        const raw = await env.NOTES.get(`wrap:${wrapId}`);
        if (!raw)
          continue;
        let wrap;
        try {
          wrap = JSON.parse(raw);
        } catch {
          continue;
        }
        push(`${origin}/share/${wrapId}`, "weekly", "0.9");
        if (wrap.gated)
          continue;
        for (const ulid of wrap.ulids ?? []) {
          push(`${origin}/share/${wrapId}/${ulid}`, "weekly", "0.7");
        }
        for (const culid of wrap.canvases ?? []) {
          push(`${origin}/share/${wrapId}/c/${culid}`, "monthly", "0.5");
        }
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
      return new Response(xml, {
        status: 200,
        headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" }
      });
    }
    if (path === "/" && req.method === "GET") {
      const demoUrl = env.DEMO_WRAP_URL ?? "";
      const repoUrl = "https://github.com/MachoMaheen/brainshare";
      const ctaPrimary = demoUrl ? `<a class="cta cta-primary" href="${demoUrl}">\u25B6 Try the live demo</a>` : `<a class="cta cta-primary cta-disabled" href="${repoUrl}">\u25B6 Live demo (coming soon)</a>`;
      return html2(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BrainShare \u2014 lend your brain. Anyone can read it. Anything can call it.</title>
<meta name="description" content="Lend your second brain. Pick notes and canvases from your Obsidian vault, get a URL with an interactive graph, full-text search, and per-recipient JWT access \u2014 readable by humans, queryable by agents. Free. Open source. No vendor lock-in.">
<style>
:root {
  --bg: #ffffff;
  --bg-2: #f5f6f8;
  --bg-card: #ffffff;
  --text: #1f2328;
  --text-2: #57606a;
  --muted: #8b949e;
  --accent: #7f6df2;
  --accent-2: #5b4ad6;
  --border: #e6e8eb;
  --border-faint: #eef0f2;
  --code-bg: #f6f8fa;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1014;
    --bg-2: #16181d;
    --bg-card: #1a1c22;
    --text: #e6e8ee;
    --text-2: #a8aebd;
    --muted: #6a6f80;
    --accent: #a882ff;
    --accent-2: #c2a7ff;
    --border: #2a2d35;
    --border-faint: #1f2228;
    --code-bg: #1a1c22;
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 880px; margin: 0 auto; padding: 0 1.25em; }
header.hero {
  padding: 5em 0 3em;
  text-align: center;
  background:
    radial-gradient(ellipse at top, rgba(168,130,255,.12), transparent 60%),
    var(--bg);
  border-bottom: 1px solid var(--border-faint);
}
.brand {
  display: inline-flex; align-items: center; gap: .55em;
  font-size: .85em;
  color: var(--text-2);
  letter-spacing: .04em;
  margin-bottom: 1.2em;
}
.brand-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 14px var(--accent);
}
h1 {
  margin: 0 0 .35em;
  font-size: clamp(2em, 5vw, 3.2em);
  letter-spacing: -.02em;
  font-weight: 700;
  line-height: 1.05;
}
.tagline-emphatic {
  font-size: clamp(1.15em, 2.4vw, 1.55em);
  color: var(--text);
  margin: 0 auto .9em;
  max-width: 38em;
  font-weight: 500;
  letter-spacing: -.005em;
}
.tagline-emphatic .accent { color: var(--accent); }
.tagline {
  font-size: clamp(1em, 1.9vw, 1.15em);
  color: var(--text-2);
  margin: 0 auto 2em;
  max-width: 38em;
}
.ctas { display: flex; gap: .75em; justify-content: center; flex-wrap: wrap; }
.cta {
  display: inline-flex; align-items: center; gap: .4em;
  padding: .75em 1.4em;
  font-size: 1em; font-weight: 500;
  border-radius: 8px;
  text-decoration: none;
  transition: transform .12s, box-shadow .12s, background .12s;
}
.cta-primary { background: var(--accent); color: #fff; }
.cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(127,109,242,.35); }
.cta-disabled { opacity: .55; cursor: not-allowed; }
.cta-disabled:hover { transform: none; box-shadow: none; }
.cta-secondary {
  background: var(--bg-card);
  color: var(--text);
  border: 1px solid var(--border);
}
.cta-secondary:hover { border-color: var(--accent); color: var(--accent); }

section { padding: 3.5em 0; border-bottom: 1px solid var(--border-faint); }
section h2 {
  font-size: 1.5em;
  margin: 0 0 1em;
  letter-spacing: -.01em;
}
.feature-grid {
  display: grid;
  gap: 1em;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.feature {
  background: var(--bg-card);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  padding: 1.2em 1.4em;
}
.feature-icon { font-size: 1.4em; line-height: 1; }
.feature h3 {
  font-size: 1em; margin: .5em 0 .3em;
  font-weight: 600;
}
.feature p { margin: 0; font-size: .92em; color: var(--text-2); }

.versus {
  background: var(--bg-2);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  padding: 1.2em 1.4em;
  display: grid;
  gap: .8em;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.versus-col h4 { margin: 0 0 .25em; font-size: .8em; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.versus-col p  { margin: 0; font-size: .92em; color: var(--text-2); }

pre, code {
  font-family: "SF Mono", "Menlo", ui-monospace, monospace;
}
.codeblock {
  background: var(--code-bg);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  padding: .9em 1.1em;
  overflow-x: auto;
  font-size: .88em;
  line-height: 1.55;
  margin: 0;
}
.codeblock .c { color: var(--muted); }
ol.steps { padding-left: 1.2em; margin: 0; }
ol.steps li { margin: .6em 0; color: var(--text-2); }
ol.steps li b { color: var(--text); }

footer {
  padding: 3em 0 4em;
  text-align: center;
  font-size: .88em;
  color: var(--muted);
}
footer a { color: var(--text-2); }
footer a:hover { color: var(--accent); }

details.api-ref { margin-top: 2em; }
details.api-ref summary {
  cursor: pointer;
  font-size: .9em;
  color: var(--text-2);
  padding: .6em 0;
}
details.api-ref summary:hover { color: var(--accent); }
details.api-ref ul { margin: .8em 0 0; padding-left: 1.2em; font-size: .88em; color: var(--text-2); }
details.api-ref code { background: var(--code-bg); padding: 1px 6px; border-radius: 4px; }
</style>
</head>
<body>
<header class="hero">
  <div class="wrap">
    <div class="brand"><span class="brand-dot"></span>BrainShare \xB7 open source \xB7 AGPLv3</div>
    <h1>Lend your brain.</h1>
    <p class="tagline-emphatic"><span class="accent">Anyone</span> can read it. <span class="accent">Anything</span> can call it.</p>
    <p class="tagline">Pick notes and canvases from your Obsidian vault. Get a URL with an interactive graph, full-text search, and per-recipient JWT access \u2014 readable by humans, queryable by agents. Free. No vendor lock-in.</p>
    <div class="ctas">
      ${ctaPrimary}
      <a class="cta cta-secondary" href="${repoUrl}">View on GitHub</a>
    </div>
  </div>
</header>

<section>
  <div class="wrap">
    <h2>What you get when you share a slice</h2>
    <div class="feature-grid">
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Interactive graph view</h3>
        <p>Sigma.js force-directed graph that mirrors your Obsidian graph view \u2014 hover to focus a cluster, click to open.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Full-text + filename search</h3>
        <p>\u2318K palette searches every note body in the slice. Sidebar filter narrows the file tree as you type.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Per-recipient JWT auth</h3>
        <p>Mint a token per viewer. Expirable, revocable, optional view-count cap. No login screens.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Canvases render natively</h3>
        <p>Colors, groups, bezier edges, file embeds \u2014 Obsidian's <code>.canvas</code> spec, faithfully.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Wikilinks resolve correctly</h3>
        <p>Links inside the share-set work. Targets outside become greyed-out "not in this share" labels \u2014 no leaks.</p>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <h3>Cloudflare free tier</h3>
        <p>Worker + KV. ~1000 publishes/day before you pay anything. Globally cached reads.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Why not Quartz or Obsidian Publish?</h2>
    <div class="versus">
      <div class="versus-col">
        <h4>Quartz</h4>
        <p>Great for "publish my whole vault." Static site setup, full-rebuild per change, no per-recipient gating.</p>
      </div>
      <div class="versus-col">
        <h4>Obsidian Publish</h4>
        <p>Zero-config but $8\u201310/mo per site, all-or-nothing visibility, no programmatic API.</p>
      </div>
      <div class="versus-col">
        <h4>BrainShare</h4>
        <p><b>Per-slice publishing</b> with a live graph + auth, free on Cloudflare's tier, full programmatic API.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Get it</h2>
    <ol class="steps">
      <li><b>Beta install via BRAT</b> (Obsidian community-store PR pending review): add <code>MachoMaheen/brainshare</code> as a beta plugin.</li>
      <li><b>Deploy your own publisher</b> \u2014 clone the repo, <code>wrangler deploy</code>. Two minutes on Cloudflare's free tier:
<pre class="codeblock"><span class="c"># in the publisher/ folder</span>
npm install
wrangler kv:namespace create NOTES
wrangler deploy</pre>
      </li>
      <li><b>Open the BrainShare panel in Obsidian</b>, point it at your worker URL, pick a slice, hit publish \u2014 get a URL like <code>https://your-publisher/share/&lt;slice&gt;?t=&lt;jwt&gt;</code>.</li>
    </ol>
  </div>
</section>

<footer>
  <div class="wrap">
    <a href="${repoUrl}">github.com/MachoMaheen/brainshare</a> \xB7 AGPLv3
    <details class="api-ref">
      <summary>API reference (for integrators)</summary>
      <ul>
        <li><code>PUT  /api/notes/:ulid</code> \u2014 store a note (auth)</li>
        <li><code>GET  /:ulid</code> \u2014 render a note (standalone, all wikilinks private)</li>
        <li><code>PUT  /api/wrappers/:id</code> \u2014 store a wrapper (auth, optional <code>gated:true</code>)</li>
        <li><code>POST /api/wrappers/:id/tokens</code> \u2014 mint an access token (auth)</li>
        <li><code>POST /api/wrappers/:id/revoke</code> \u2014 revoke by jti (auth)</li>
        <li><code>GET  /share/:id</code> \u2014 wrapper landing (gated wrappers need <code>?t=\u2026</code>)</li>
        <li><code>GET  /share/:id/:ulid</code> \u2014 note scoped to a share-set</li>
        <li><code>GET  /share/:id/api/search?q=\u2026</code> \u2014 full-text search across the slice's bodies</li>
      </ul>
    </details>
  </div>
</footer>
</body>
</html>`);
    }
    return html2(`
<main class="container" style="text-align:center;padding:6em 1em;">
  <div style="font-size:3em;margin-bottom:.5em"></div>
  <h1 style="font-size:1.8em;margin-bottom:.5em">Page not found</h1>
  <p style="color:var(--text-muted,#888);margin-bottom:2em">
    This note may have been renamed, moved, or removed from the slice.
  </p>
  <a href="/" style="display:inline-block;padding:.6em 1.4em;background:var(--text-accent,#7f6df2);color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
    \u2190 Back to BrainShare
  </a>
</main>`, 404);
  }
};
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
