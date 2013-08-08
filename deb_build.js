var $depweb = function() {
  this.nodes = [];
  //this.links = [];
  Object.defineProperty(this, "links", {enumerable:false, writable:true, value: []});
  Object.defineProperty(this, "nodesByName", {enumerable:false, writable:true, value: {}});
};
$depweb.node = function node(name, group, needs) {
  var self = this;
  Object.defineProperty(this, "_hidden", {
    enumerable: false
    ,writable: true
    ,value: {}
  })
  Object.defineProperty(this, "parent", {
    enumerable: false
    ,writable: true
    ,value: null
  });
  Object.defineProperty(this, "needsById", {
    enumerable: false
    ,get: (function() {
      if(this.parent == null || this.parent == "") return [];

      var ta = [];
      for(var i in this.needs) {
        try { ta.push(this.parent.nodesByName[this.needs[i]].nid); } catch (err) { }
      }
      return ta;
    }).bind(self)
  });
  Object.defineProperty(this, "dependencies", {
    enumerable: false
    ,get: function() {
      if(this.nid === null || this.parent === null || this.parent.links === null) return [];
      var ta = [];
      for(var i in this.parent.links) {
        var source = this.parent.links[i].source.nid.toString() || this.parent.links[i].source;
        var target = this.parent.links[i].target.nid.toString() || this.parent.links[i].target;
        if(source == this.nid) ta.push(target);
      }
      return ta;
    }
  });Object.defineProperty(this, "dependents", {
    enumerable: false
    ,get: function() {
      if(this.nid === null || this.parent === null || this.parent.links === null) return [];
      var ta = [];
      for(var i in this.parent.links) {
        var source = this.parent.links[i].source.nid.toString() || this.parent.links[i].source.toString();
        var target = this.parent.links[i].target.nid.toString() || this.parent.links[i].target.toString();
        if(target == this.nid) ta.push(source);
      }
      return ta;
    }
  });
  this.__defineGetter__("group", (function() { return this._hidden.group || 1;}).bind(this));
  this.__defineSetter__("group", (function(val) { this._hidden.group = parseInt((/^[0-9]+$/.test(val)) ? val.toString() : null || 1); }).bind(this));
  this.name = name;
  this.group = (typeof group != 'undefined' && typeof group != '[]') ? parseInt(group) : 1;
  this.needs = ((typeof group != 'undefined' && typeof group == '[]') ? group : needs) || [];
}
$depweb.node.fromObj = function(obj) {
  return new $depweb.node(obj.name, obj.group, obj.needs)
}
$depweb.link = function(source, target) {
  this.source = source;
  this.target = target;
}
$depweb.fromArray = function(rawArray) {
  var newObj = new $depweb();
  var newNodes = JSON.parse(JSON.stringify(rawArray));
  //newObj.__proto__ == $depweb.prototype;
  for(var i in newNodes) {
    //newObj.nodes[i].__proto__ = $depweb.node.prototype;
    var ni = $depweb.node.fromObj(newNodes[i]);
    ni.nid = i;
    ni.parent = newObj;
    newObj.addNode(ni);
    //newObj.nodesByName[newObj.nodes[i].name] = newObj.nodes[i];
  }
  newObj.updateLinks();
  return newObj;
};
$depweb.prototype.updateLinks = function() {
  this.links = [];
  for(var i in this.nodes) {
    var needs = this.nodes[i].needsById;
    for(var j in needs) {
      this.links.push(new $depweb.link(this.nodes[i].nid, needs[j]));
    }
  }
  return this;
};
$depweb.prototype.addNode = function(n) {
  if(!(n instanceof $depweb.node)) throw "error! given node is not a node";
  n.nid = this.nodes.length;
  n.parent = n.parent || this;
  this.nodes.push(n);
  this.nodesByName[n.name] = n;
  return this;
}
$depweb.prototype.getNode = function(id) {
  if((/^[0-9]+$/).test(id)) {
    return this.node[id];
  } else {
    return this.nodesByName[id];
  }
};

if(typeof module != 'undefined') {
  module.exports = $depweb;
}