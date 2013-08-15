var assert = require('assert');
var $dw = require('./deb_build.js');
var raw = require('./data.json');
var o = $dw.fromArray(raw);
o.updateLinks();
assert.equal(o.nodes[3].nid, o.nodesByName['Dragon'].nid);
assert.equal(o.nodes[3].name, o.nodesByName['Dragon'].name);
assert.equal(o.nodes[3].needs[0], "Power");
//console.log(o.nodes[0]);
//console.log(o.nodes[0].parent);
//console.log(o.nodesByName["server"].needsById);
console.log(o.nodesByName["Dragon"].dependencies)
console.log(o.nodesByName["Dragon"].dependents)
console.log(o.findPaths(5));
