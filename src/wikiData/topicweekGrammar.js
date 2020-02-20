// Generated automatically by nearley, version 2.15.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require("moo");
const lexer = moo.compile({
  ws: {match: /\s+/, lineBreaks: true},
  word: {match: /[^\{\{\}\}\|\s\n\t=]+/, lineBreaks: true},
  open: /\{\{/,
  close:/\}\}/,
  delim: /\|/,
  eq: /=/
});
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main$ebnf$1$subexpression$1", "symbols": ["template", "external"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1$subexpression$1"]},
    {"name": "main$ebnf$1$subexpression$2", "symbols": ["template", "external"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1", "main$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "main", "symbols": ["main$ebnf$1"], "postprocess": function(d) {return d[0].map(val => val[0])}},
    {"name": "external$ebnf$1", "symbols": []},
    {"name": "external$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "external$ebnf$1$subexpression$1$ebnf$1", "symbols": ["external$ebnf$1$subexpression$1$ebnf$1", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "external$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "external$ebnf$1$subexpression$1$ebnf$2", "symbols": ["external$ebnf$1$subexpression$1$ebnf$2", (lexer.has("eq") ? {type: "eq"} : eq)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "external$ebnf$1$subexpression$1$ebnf$3", "symbols": []},
    {"name": "external$ebnf$1$subexpression$1$ebnf$3", "symbols": ["external$ebnf$1$subexpression$1$ebnf$3", (lexer.has("delim") ? {type: "delim"} : delim)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "external$ebnf$1$subexpression$1$ebnf$4", "symbols": ["ws"], "postprocess": id},
    {"name": "external$ebnf$1$subexpression$1$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "external$ebnf$1$subexpression$1", "symbols": ["word", "external$ebnf$1$subexpression$1$ebnf$1", "external$ebnf$1$subexpression$1$ebnf$2", "external$ebnf$1$subexpression$1$ebnf$3", "external$ebnf$1$subexpression$1$ebnf$4"]},
    {"name": "external$ebnf$1", "symbols": ["external$ebnf$1", "external$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "external", "symbols": ["external$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "template$ebnf$1", "symbols": []},
    {"name": "template$ebnf$1", "symbols": ["template$ebnf$1", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template$ebnf$2", "symbols": []},
    {"name": "template$ebnf$2", "symbols": ["template$ebnf$2", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template$ebnf$3", "symbols": []},
    {"name": "template$ebnf$3", "symbols": ["template$ebnf$3", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template", "symbols": [(lexer.has("open") ? {type: "open"} : open), "template$ebnf$1", "templateName", "templateValues", "template$ebnf$2", (lexer.has("close") ? {type: "close"} : close), "template$ebnf$3"], "postprocess": 
        function(d) {
          let template = {...d[2], ...d[3]}
          return template
        }
        },
    {"name": "templateName", "symbols": ["word"], "postprocess": 
        function(d) {
            return {
               templateName: d[0].value
            }
        }
        },
    {"name": "templateValues$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "templateValues$ebnf$1$subexpression$1$ebnf$1", "symbols": ["templateValues$ebnf$1$subexpression$1$ebnf$1", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "templateValues$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "templateValues$ebnf$1$subexpression$1$ebnf$2", "symbols": ["templateValues$ebnf$1$subexpression$1$ebnf$2", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "templateValues$ebnf$1$subexpression$1", "symbols": ["templateValues$ebnf$1$subexpression$1$ebnf$1", (lexer.has("delim") ? {type: "delim"} : delim), "templateValues$ebnf$1$subexpression$1$ebnf$2", "templateValue"]},
    {"name": "templateValues$ebnf$1", "symbols": ["templateValues$ebnf$1$subexpression$1"]},
    {"name": "templateValues$ebnf$1$subexpression$2$ebnf$1", "symbols": []},
    {"name": "templateValues$ebnf$1$subexpression$2$ebnf$1", "symbols": ["templateValues$ebnf$1$subexpression$2$ebnf$1", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "templateValues$ebnf$1$subexpression$2$ebnf$2", "symbols": []},
    {"name": "templateValues$ebnf$1$subexpression$2$ebnf$2", "symbols": ["templateValues$ebnf$1$subexpression$2$ebnf$2", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "templateValues$ebnf$1$subexpression$2", "symbols": ["templateValues$ebnf$1$subexpression$2$ebnf$1", (lexer.has("delim") ? {type: "delim"} : delim), "templateValues$ebnf$1$subexpression$2$ebnf$2", "templateValue"]},
    {"name": "templateValues$ebnf$1", "symbols": ["templateValues$ebnf$1", "templateValues$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "templateValues", "symbols": ["templateValues$ebnf$1"], "postprocess": 
        function(d) {
          vals = d[0].map(val => val[3]).reduce(function(obj,item){
            obj = {...obj, ...item}
            return obj;
          });
          return {templateValues: vals}
        }
        },
    {"name": "templateValue$ebnf$1$subexpression$1", "symbols": ["sws", "word"]},
    {"name": "templateValue$ebnf$1", "symbols": ["templateValue$ebnf$1$subexpression$1"]},
    {"name": "templateValue$ebnf$1$subexpression$2", "symbols": ["sws", "word"]},
    {"name": "templateValue$ebnf$1", "symbols": ["templateValue$ebnf$1", "templateValue$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "templateValue", "symbols": ["word", "ws", (lexer.has("eq") ? {type: "eq"} : eq), "templateValue$ebnf$1"], "postprocess": 
        function(d) {
          d = d.filter(val => val !== null);
          head = d[0];              // drop leading spaces
          tail = d[2].map((val,i) => i === 0 ? val[1].value : val[0].value + val[1].value).join('');
          return {[head]:tail};
        }
        },
    {"name": "word", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": id},
    {"name": "sws", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id},
    {"name": "ws", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function(d) {return null}}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
