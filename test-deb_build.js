var assert = require('assert');
var $dw = require('./deb_build.js');
var raw = [
  {name: "server", needs:["power"]}
  ,{name: "power", needs:[]}
]
var o = $dw.fromArray(raw);
o.updateLinks();
assert.equal(o.nodes[0].nid, o.nodesByName['server'].nid);
assert.equal(o.nodes[0].name, o.nodesByName['server'].name);
assert.equal(o.nodes[0].needs[0], "power");
//console.log(o.nodes[0]);
//console.log(o.nodes[0].parent);
//console.log(o.nodesByName["server"].needsById);
console.log(o.nodesByName["server"].dependencies)
console.log(o.nodesByName["server"].dependents)