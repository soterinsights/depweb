var $depweb = function() {
  this.nodes = [];
  Object.defineProperty(this, "links", {enumerable:false, writable:true, value: []});
  Object.defineProperty(this, "nodesByName", {enumerable:false, writable:true, value: {}});
  Object.defineProperty(this, "nodesByGuid", {enumerable:false, writable:true, value: {}});
  Object.defineProperty(this, "_hidden", {
    enumerable: false
    ,writable: true
    ,value: {}
  });
};
$depweb.genguid = function() {
  //http://note19.com/2007/05/27/javascript-guid-generator/
  var S4 = function () {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
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
  Object.defineProperty(this, "needsByIndex", {
    enumerable: false
    ,get: (function() {
      if(this.parent == null || this.parent == "") return [];
      if(typeof this._hidden.needsByIndex != 'undefined') return this._hidden.needsByIndex;
      var ta = this._hidden.needsByIndex = [];
      for(var i in this.needs) {
        try { ta.push(this.parent.nodesByName[this.needs[i]].index || i); } catch (err) { }
      }
      return ta;
    }).bind(self)
  });
  Object.defineProperty(this, "needsByGuid", {
    enumerable: false
    ,get: (function() {
      if(this.parent == null || this.parent == "") return [];
      if(typeof this._hidden.needsByGuid != 'undefined') return this._hidden.needsByGuid;
      var ta = this._hidden.needsByGuid = [];
      for(var i in this.needs) {
        try { ta.push(this.parent.nodesByName[this.needs[i]].guid); } catch (err) { }
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
  //this.__defineGetter__("group", (function() { return this._hidden.group || 1;}).bind(this));
  //this.__defineSetter__("group", (function(val) { this._hidden.group = parseInt((/^[0-9]+$/.test(val)) ? val.toString() : null || 1); }).bind(this));
  Object.defineProperty(this, 'group', {
    enumerable: false
    ,get: (function() { return this._hidden.group || 1;}).bind(this)
    ,set: (function(val) { this._hidden.group = parseInt((/^[0-9]+$/.test(val)) ? val.toString() : null || 1); }).bind(this)
  });
  this.name = name;
  this.group = (typeof group != 'undefined' && typeof group != '[]') ? parseInt(group) : 1;
  this.needs = ((typeof group != 'undefined' && typeof group == '[]') ? group : needs) || [];
}
$depweb.node.fromObj = function(obj) {
  return new $depweb.node(obj.name, obj.group, obj.needs)
}
$depweb.link = function(source, target) {
  this.source = source.index;
  this.target = target.index;
  this.source_guid = source.guid;
  this.target_nid = target.guid;
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
  var nodelist = this.nodesByGuid;
  for(var i in nodelist) {
    //var needs = this.nodes[i].needsByIndex;
    var needs = this.nodesBy[i].needsByGuid;
    for(var j in needs) {
      var id = this.nodesByGuid[i].guid + ":" + needs[j];
      var tlink = (new $depweb.link(this.nodesByGuid[i], this.nodesByGuid[needs[j]]));
      if(typeof this._hidden.links[id] == 'undefined') {
        this.links.push(tlink)
      }
      this._hidden.links[id] = tlink;
    }
  }
  return this;
};
/*$depweb.prototype.findPaths = function(nodeId, paths, cdepth, maxdepth) {
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
};*/
$depweb.prototype.addNode = function(n, callback) {
  if(!(n instanceof $depweb.node)) {
    if(typeof callback == 'function') callback("error! given node is not a node", n);
    return this; //throw "error! given node is not a node";
  }
  if(typeof this.nodesByName[n.name] != 'undefined') {
    if(typeof callback == 'function') callback("error! This node already exists", n);
    //this.updateNode(n, callback);
    return this; //throw "error! This node already exists!";
  }
  var self = this;
  //n.nid = this.nodes.length;
  n.guid = n.guid || $depweb.genguid();
  n.parent = n.parent || this;
  this.nodes.push(n);
  this.nodesByName[n.name] = n;
  this.nodesByGuid[n.guid] = n;
  n.needs.forEach(function(d) {
    try {
      if(typeof self.nodesByName[d] == 'undefined') {
        //self.addNode(new $depweb.node(d));
      }
    } catch(e) {
      //self.addNode(new $depweb.node(d));
    }
  });
  return this;
}

$depweb.prototype.removeNode = function(n, callback) {
  if(!(n instanceof $depweb.node)) {
    if(typeof callback == 'function') callback("error! given node is not a node", n);
    return this; //throw "error! given node is not a node";
  }
  if(typeof this.nodesByName[n.name] != 'undefined') {
    if(typeof callback == 'function') callback("error! This node already exists", n);
    //this.updateNode(n, callback);
    return this; //throw "error! This node already exists!";
  }
  for(var i in this.data.links) {
    //if(this.data.links[i].target_nid == n)
  }
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
  self.updateLinks();
  if(typeof callback == 'function') callback(null, deletedlinks, self);
  return self;
}
$depweb.prototype.dep2array = function(nid, list, cur_depth, max_depth) {
  //get the dependencies of a given node 
  list = list || [];
  cur_depth = cur_depth+1 || 0;
  max_depth = max_depth || 10;
  if(cur_depth > max_depth) return; //stop the madness

  for(var i in this.links) {
    if(this.links[i].source_nid == nid) {
      list.push(this.links[i]);
      this.dep2array(this.links[i].target_nid, list, cur_depth, max_depth);
    }
  }

  return list;
}
$depweb.prototype.traverseDepTree = function(nid, callback, cur_depth, max_depth) {
  cur_depth = cur_depth+1 || 0;
  max_depth = max_depth || 10;
  if(typeof callback != 'function') throw "[traverseDepTree needs to have a callback]";
  var needs = this.nodes[nid].needsByIndex;

  for(var i in needs) {
    callback(this.nodes[needs[i]], this.nodes[nid], cur_depth);
    this.traverseDepTree(needs[i], callback, cur_depth, max_depth, this.nodes[nid]);
  }
};
$depweb.prototype.traverseChildTree = function(nid, callback, cur_depth, max_depth) {
  cur_depth = cur_depth+1 || 0;
  max_depth = max_depth || 10;
  if(typeof callback != 'function') throw "[traverseChildTree needs to have a callback]";

  for(var i in this.links) {
    if(this.links[i].target_nid == nid) {
      var cid = this.links[i].source_nid;
      callback(this.nodes[cid], this.nodes[nid], cur_depth);
      this.traverseDepTree(cid, callback, cur_depth, max_depth, this.nodes[nid]);
    }
  }
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
