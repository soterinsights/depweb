var $depweb = function() {
  this.nodes = [];
  //this.links = [];
  Object.defineProperty(this, "links", {enumerable:false, writable:true, value: []});
  Object.defineProperty(this, "nodesByName", {enumerable:false, writable:true, value: {}});
  Object.defineProperty(this, "_hidden", {
    enumerable: false
    ,writable: true
    ,value: {}
  })
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
        var source = this.parent.links[i].source; //.nid || this.parent.links[i].source;
        var target = this.parent.links[i].target; //.nid || this.parent.links[i].target;
        if(typeof target != 'number') continue;
        if(source == this.nid) ta.push(target);
      }
      return ta;
    }
  });
  Object.defineProperty(this, "dependents", {
    enumerable: false
    ,get: function() {
      if(this.nid === null || this.parent === null || this.parent.links === null) return [];
      var ta = [];
      for(var i in this.parent.links) {
        var source = this.parent.links[i].source; //.nid || this.parent.links[i].source.toString();
        var target = this.parent.links[i].target; //.nid || this.parent.links[i].target.toString();
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
  this.source_nid = source;
  this.target_nid = target;
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
  //this.links = [];
  if(typeof this._hidden.links == 'undefined') this._hidden.links = {};
  for(var i in this.nodes) {
    var needs = this.nodes[i].needsById;
    for(var j in needs) {
      var id = this.nodes[i].nid + ":" + this.nodes[needs[j]].nid;
      var tlink = (new $depweb.link(this.nodes[i].nid, needs[j]));
      if(typeof this._hidden.links[id] == 'undefined') {
        this.links.push(tlink)
      }
      this._hidden.links[id] = tlink;
    }
  }
  return this;
};
$depweb.prototype.findPaths = function(nodeId, paths, cdepth, maxdepth) {
  paths = paths || [];
  // {id: NodeId, needs: []}
  cdepth = cdepth || 0;
  maxdepth = maxdepth || 100;
  if(cdepth >= maxdepth) return;

  try {
    for(var i in this.nodes[nodeId].needs) {
      paths.push({
        source: nodeId
        ,target: this.nodesByName[this.nodes[nodeId].needs[i]].nid
      });
      try { 
        var t = this.findPaths(this.nodesByName[this.nodes[nodeId].needs[i]].nid, paths, cdepth++, maxdepth);
      } catch(e) {}
    }
    return paths;
  } catch(e) {
    throw e;
  }
};
$depweb.prototype.addNode = function(n) {
  if(!(n instanceof $depweb.node)) throw "error! given node is not a node";
  if(typeof this.nodesByName[n.name] != 'undefined') throw "error! This node already exists!";  
  n.nid = this.nodes.length;
  n.parent = n.parent || this;
  this.nodes.push(n);
  this.nodesByName[n.name] = n;
  return this;
}

$depweb.prototype.updateNode = function(n, callback) {
  var self = this;
  if(!(n instanceof $depweb.node)) throw "error! given node is not a node";
  if(typeof n.nid == 'undefined' && typeof this.nodesByName[n.name] == 'undefined') { return this.addNode(n); }
  n.nid = n.nid || this.nodesByName[n.name].nid;

  var r = new RegExp("({source}:[0-9]+|[0-9]+:{source})".replace("{source}", n.nid), "i");
  var deletedlinks = [];
  var previousneeds = {};
  this.links.forEach(function(d) {
    if(d.source_nid == n.nid) previousneeds[self.nodes[d.target_nid].name] = 0;
  });
  n.needs.forEach(function(d) { 
    if(typeof previousneeds[d] != 'undefined') previousneeds[d]++;
  });
  for(var i in previousneeds) {
    try {
      if(previousneeds[i] == 0) deletedlinks.push({source: n.nid, target: self.nodesByName[i].nid});
    } catch(e) {
      console.log("i, e", i, e);
    }
  }

  var tf = function(sid, aro, dl) {
    //console.log("tf", sid, aro, dl);
    for(var i in aro) {
      //console.log("i in aro", i);
      dl.forEach(function(d) {
        //console.log("aro[i], d", aro[i], d);
        if((aro[i].source_nid) == d.source &&
           (aro[i].target_nid) == d.target) {
          console.log("deleting", i, aro[i]);
          //delete aro[i];
          if(aro instanceof Array) {
            aro.splice(i, 1);
          } else {
            delete aro[i];
          }
        }
      });
    }

    if(aro instanceof Array) {
      //aro = aro.filter(function(d) { return typeof d != 'undefined'; });
    } 

    return aro;
  }
  console.log(previousneeds);
  console.log(deletedlinks);
  console.log("pre delete links", self.links.length);
  self._hidden.links = tf(n.nid, self._hidden.links, deletedlinks);
  self.links = tf(n.nid, self.links, deletedlinks);
  console.log("post delete links", self.links.filter(function(d) {return typeof d != 'undefined';}).length);

  self.nodesByName[n.name] = n;
  /*for(var i in self._hidden.links) {
    var l = self._hidden.links[i];
    deletedlinks.forEach(function(d) {
      if(l.source.nid == n.nid && l.target.nid == d) {
        delete l;
      }
    });
  }*/
  /*for(var i in this._hidden.links) {
    console.log(i.match(r));
    continue;
    if(!r.test(i)) {
      var l = this._hidden.links[i];
      deletednode.push({source: l.source.nid.toString(), target: l.target.nid.toString()});
      delete this._hidden.links[i];
    }
  }
  console.log("deletednode.length", deletednode.length);
  if(deletednode.length > 0) {
    var offset = 0;
    for(var i in self.links) {
      for(var j in deletednode) {
        if(self.links[i].source.nid == deletednode[j].source
            && self.links[i].target.nid == deletednode[j].target) {
          var tmp = self.links.splice(i - offset, 1);
          console.log("tmp, dn", tmp, deletednode[j]);
          //offset++;
        }
      }
    }
  }*/
  self.updateLinks();
  //if(typeof callback == 'function') setTimeout(callback.bind({}, null, deletednode), 0);
  if(typeof callback == 'function') callback(null, deletedlinks, self);
  return self;
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
