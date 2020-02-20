@{%
const moo = require("moo");
const lexer = moo.compile({
  ws: {match: /\s+/, lineBreaks: true},
  word: {match: /[^\{\{\}\}\|\s\n\t=]+/, lineBreaks: true},
  open: /\{\{/,
  close:/\}\}/,
  delim: /\|/,
  eq: /=/
});
%}
@lexer lexer
main -> (template external):+ {% function(d) {return d[0].map(val => val[0])}%}
external -> (word ws:* %eq:* %delim:* ws:?):* {% function(d) {return null;} %}
template -> %open ws:* templateName templateValues ws:* %close ws:* {%
  function(d) {
    let template = {...d[2], ...d[3]}
    return template
  }
%}
templateName -> word {%
     function(d) {
         return {
            templateName: d[0].value
         }
     }
%}
templateValues -> (ws:* %delim  ws:* templateValue):+ {%
  function(d) {
    vals = d[0].map(val => val[3]).reduce(function(obj,item){
      obj = {...obj, ...item}
      return obj;
    });
    return {templateValues: vals}
  }
%}
templateValue -> word ws %eq (sws word):+ {%
function(d) {
  d = d.filter(val => val !== null);
  head = d[0];              // drop leading spaces
  tail = d[2].map((val,i) => i === 0 ? val[1].value : val[0].value + val[1].value).join('');
  return {[head]:tail};
}
%}
word -> %word {% id %}
sws -> %ws {% id %}
ws -> %ws {% function(d) {return null} %}