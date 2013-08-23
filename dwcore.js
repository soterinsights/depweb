///CORE
$dwcore = function () {
  this.nodes = [];
  this.nodeByName = {};
  this.nodesByGuid = {};
  Object.defineProperty(this, "links", {enumerable:false, writable:true, value: []});
  Object.defineProperty(this, "nodesByName", {enumerable:false, writable:true, value: {}});
  Object.defineProperty(this, "nodesByGuid", {enumerable:false, writable:true, value: {}});
  Object.defineProperty(this, "_h", {
    enumerable: false
    ,writable: true
    ,value: {cqueue: [], dqueue: []}
  });
};
$dwcore.prototype.addNode = function(node, callback) {
  if(!(node instanceof $dwcore.node)) {
    if(typeof callback == 'function') callback("[$dwcore.addNode: node is not an instance of $dwcore.node]");
    return this;
  }
  if(typeof this.nodesByName[node.name] != 'undefined') {
    if(typeof callback == 'function') callback("[$dwcore.addNode: node already exists.");
    return this;
  }

  var self = this;
  node.guid = node.guid || $dwcore.genguid();
  node.parent = node.parent || this;
  this.nodes.push(node);
  this.nodesByName[node.name] = node;
  this.nodesByGuid[node.guid] = node;
  var needlist = node.needs.list;
  for(var i in needlist) {
    if(typeof this.nodeByName[needlist[i]] == 'undefined') this._h.cqueue.push(needlist[i]);
  }

  return this;
};
$dwcore.prototype.removeNode = function(n, callback) {
  this._h.dqueue.push({name: n, callback: callback});
};
$dwcore.prototype._removeNode = function(n, callback) {
  /*if(!(n instanceof $dwcore.node)) {
    //if(typeof callback == 'function') callback("error! given node is not a node", n);
    //return this; //throw "error! given node is not a node";
  }*/
  if(typeof this.nodesByName[n] == 'undefined') {
    if(typeof callback == 'function') callback("error! This node already exists", n);
    //this.updateNode(n, callback);
    return this; //throw "error! This node already exists!";
  }
  var tnode = this.nodesByName[n];
  var dlist = [];
  for(var i in this.links) {
    //if(this.data.links[i].target_nid == n)
    var source = this.links[i].source;
    var target = this.links[i].target;
    var id = source.guid + ":" + target.guid;
    var id_rev = target.guid + ":" + source.guid;
    if(source.guid == tnode.guid || target.guid == tnode.guid) {
      /*console.log("deleteing S:%s > T:%s", 
        ((typeof this._h.links[id] != 'undefined') ? source.name : target.name),
        ((typeof this._h.links[id] != 'undefined') ? target.name : source.name))*/
      if(typeof this._h.links[id] != 'undefined') delete this._h.links[id];
      if(typeof this._h.links[id_rev] != 'undefined') delete this._h.links[id_rev];


      
      //try { delete this._h.links[id]; } catch(e) {}
      //try { delete this._h.links[id_rev]; } catch(e) {}
      //this.links.splice(i, 1);
      dlist.push(i);
    }
  }
  var offset = 0;
  for(var i in dlist) {
    this.links.splice(dlist[i]-(offset++),1);
  }
  //TODO: remove node from list
  for(var i in this.nodes) {
    var ni = this.nodes[i];
    if(ni.name == n) {
      delete this.nodesByGuid[ni.guid];
      delete this.nodesByName[ni.name];
      this.nodes.splice(i, 1);
      break;
    }
  }
  return this;
};
Object.defineProperty($dwcore.prototype, "procCQueue", {
  enumerable: false
  ,value: function() {
    for(var i in this._h.cqueue) {
      this.addNode(new $dwcore.node(this._h.cqueue[i]));
    }
    this._h.cqueue = [];
    return this;
  }
});
Object.defineProperty($dwcore.prototype, "procDQueue", {
  enumerable: false
  ,value: function() {
    var self = this;
    this._h.dqueue.forEach(function(d) {
      self._removeNode(d.name);
      if(typeof d.callback == 'function') d.callback(null, d.name);
    });
    this._h.dqueue = [];
    return;
  }
});
Object.defineProperty($dwcore.prototype, "procDLQueue", {
  enumerable: false
  ,value: function() {
    var self = this;
    this.nodes.forEach(function(source, i) {
      source.needs._h.deleted.forEach(function(dn, i) {
        var target = self.nodesByName[dn];
        var id = source.guid + ":" + target.guid;
        console.log("deleteing ", id)
        delete self._h.links[id];
        var dlist = [];
        self.links.forEach(function(l, i) {
          if(l.source.guid == source.guid && l.target.guid == target.guid) dlist.push(i);
        });
        var offset = 0;
        dlist.forEach(function(d) {
          console.log("deleting link", self.links[d-(offset)]);
          self.links.splice(d-(offset++), 1);
        });
      });
      source.needs._h.deleted = [];
    });
    return this;
  }
});
$dwcore.prototype.updateLinks = function() {
  this.procCQueue();
  this.procDLQueue();
  this.procDQueue();
  if(typeof this._h.links == 'undefined') this._h.links = {};
  for(var i in this.nodesByGuid) {
    //var needs = this.nodes[i].needsByIndex;
    var needs = this.nodesByGuid[i].needs.list;
    for(var j in needs) {
      try {
        var source = this.nodesByGuid[i];
        var target = this.nodesByName[needs[j]];
        var id = source.guid + ":" + target.guid;
        var tlink = (new $dwcore.link(source, target));
        if(typeof this._h.links[id] == 'undefined') {
          this.links.push(tlink);
        }
        this._h.links[id] = tlink;
      } catch(e) {
        //console.log(e.stack);
      }
    }
  }
  return this;
};
$dwcore.prototype.recDependencies = function(guid, callback, cdepth, mdepth) {
  cdepth = cdepth+1 || 0;
  mdepth = mdepth || 10;
  if(cdepth > mdepth) return;
  var needs = this.nodesByGuid[guid].dependencies;
  for(var i in needs) {
    try {
      if(typeof this.nodesByGuid[needs[i]] == 'undefined') {
        callback({msg: "[dependency does not exist]", dependency: need[i]});
      } else if(typeof callback == 'function') {
        callback(null, this.nodesByGuid[needs[i]], this.nodesByGuid[guid], cdepth);
        this.recDependencies(needs[i], callback, cdepth, mdepth);
      } else {
        throw {msg: "[Something unknown has happened]"};
      }
    } catch(err) {
      if(typeof callback == 'function') callback(err);
    }
  }
};
$dwcore.prototype.recDependents = function(guid, callback, cdepth, mdepth) {
  cdepth = cdepth+1 || 0;
  mdepth = mdepth || 10;
  if(cdepth > mdepth) return;
  var needs = this.nodesByGuid[guid].dependents;
  for(var i in needs) {
    try {
      if(typeof this.nodesByGuid[needs[i]] == 'undefined') {
        callback({msg: "[dependent does not exist]", dependent: need[i]});
      } else if(typeof callback == 'function') {
        callback(null, this.nodesByGuid[needs[i]], this.nodesByGuid[guid], cdepth);
        this.recDependents(needs[i], callback, cdepth, mdepth);
      }
    } catch(err) {
      if(typeof callback == 'function') callback(err);
    }
  }
};
///End CORE

///misc funcs
$dwcore.genguid = function() {
  //http://note19.com/2007/05/27/javascript-guid-generator/
  var S4 = function () {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};
$dwcore.fromArray = function(rawArray) {
  var newObj = new $dwcore();
  if(typeof rawArray == 'string') rawArray = JSON.parse(rawArray);
  else if(rawArray instanceof Array) rawArray = rawArray.filter(function() {return true;});
  
  //newObj.__proto__ == $depweb.prototype;
  for(var i in rawArray) {
    var ni = $dwcore.node.fromObj(rawArray[i]);
    ni.parent = newObj;
    newObj.addNode(ni);
  }
  newObj.updateLinks();
  return newObj;
};
///end misc funcs


///Node
$dwcore.node = function(name, opts) {
  var self = this;
  opts = opts || {};
  opts.needs = (opts.needs instanceof Array) ? opts.needs : null || [];
  opts.group = (typeof opts.group == 'number') ? opts.group : null || 1;
  opts.parent = (opts.parent instanceof $dwcore) ? opts.parent : null;
  opts.guid = (typeof opts.guid != 'undefined') ? opts.guid : $dwcore.genguid();
  Object.defineProperty(this, "_h", {
    enumerable: false
    ,writable: true
    ,value: {}
  })
  Object.defineProperty(this, "parent", {
    enumerable: false
    ,writable: true
    ,value: opts.parent
  });

  this.name = name;
  this.guid = opts.guid;
  this.needs = new $dwcore.needs(opts.needs.filter(function(){ return true; }), {parent: this});
  this.group = opts.group;
};

Object.defineProperty($dwcore.node.prototype, "dependencies", {
  get: function() {
    var self = this;
    if(this.parent == null) return [];
    return this.parent.links.filter(function(d) {
      var source = d.source;
      return source.guid == self.guid;
    }).map(function(d) {
      return d.target.guid;
    });
  }
});
Object.defineProperty($dwcore.node.prototype, "dependents", {
  get: function() {
    var self = this;
    return this.parent.links.filter(function(d) {
      var target = d.target;
      return target.guid == self.guid;
    }).map(function(d) {
      return d.source.guid;
    });
  }
});
$dwcore.node.fromJSON = function(str) {
  var o = JSON.parse(str);
  return new $dwcore.node(o.name, o);
};
$dwcore.node.fromObj = function(obj) {
  return new $dwcore.node(obj.name, obj);
}

//end Node

///Link
$dwcore.link = function(source, target) {
  if(!(source instanceof $dwcore.node)) throw "[$dwcore.link: source must be a $dwcore.node object]";
  if(!(target instanceof $dwcore.node)) throw "[$dwcore.link: target must be a $dwcore.node object]";
  this.source = source;
  this.target = target;
}
///end Link
///Needs
$dwcore.needs = function(arr, opts) {
  opts.parent = (opts.parent instanceof $dwcore.node) ? opts.parent : null;

  var self = this;
  arr = (arr instanceof Array) ? arr : null || [];
  Object.defineProperty(this, "_h", {
    enumerable: true
    ,writable: true
    ,value: {items: arr, deleted: []}
  });
  Object.defineProperty(this, "parent", {
    enumerable: false
    ,writable: true
    ,value: opts.parent
  });
}
$dwcore.needs.prototype.toJSON = function() {
  return this._h.items; //JSON.stringify(this._h.items);
}
$dwcore.needs.prototype.set = function(value) {
  if(!this.exists(value)) {
    this._h.items.push(value);
    if(this.parent != null) {
      try {
       this.parent.parent._h.cqueue.push(value);
      } catch (e) { console.log(e.stack); debugger;}
    }
  }
  return this; //chainable!
};
$dwcore.needs.prototype.get = function(id) {
  if(typeof id == 'string') {
    return this._h.items.filter(function(d) { return (d == id); })[0];
  }
  if(typeof id == 'number') {
    return this._h.items.filter(function(d, i) { return (i == id); })[0];
  }
};
$dwcore.needs.prototype.remove = function(id, callback) {
  var ind = this._h.items.indexOf(id);
  if(ind == -1) { 
    if(typeof callback == 'function') callback("[$dwcore.needs.remove: id does not exist.]");
    return this;
  }
  this._h.deleted.push(id);
  this._h.items.splice(ind, 1);
  if(typeof callback == 'function') callback(null, id);
  return this;
};
$dwcore.needs.prototype.exists = function(id) {
  return typeof this.get(id) != 'undefined';
};
/*$dwcore.needs.prototype.list = function() {
  return this._h.items.filter(function() { return true; });
};*/
Object.defineProperty($dwcore.needs.prototype, "list", {
  enumerable: true
  ,get: function() {return this._h.items.filter(function() {return true;})} 
});
///ends Needs