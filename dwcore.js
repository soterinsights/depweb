"use strict";
///CORE
var $dwcore = function () {
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
  var needlista = node.needs.list();
  for(var i in needlista) {
    if(typeof this.nodeByName[needlista[i].name] == 'undefined') {
      //console.log("addnode adding cqueue item %s to node %s", needlista[i].name, node.name);
      this._h.cqueue.push(needlista[i].name);
    }
  }

  //console.log("$dwcore.addnode: ", node.name, needlist);
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
      this.addNode(new $dwcore.node(this._h.cqueue[i]), {parent: this});
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
      self._removeNode(d.name, d.callback);
      //if(typeof d.callback == 'function') d.callback(null, d.name);
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
        var target = self.nodesByName[dn.name];
        var id = source.guid + ":" + target.guid;
        //console.log("deleteing ", id)
        delete self._h.links[id];
        var dlist = [];
        self.links.forEach(function(l, i) {
          if(l.source.guid == source.guid && l.target.guid == target.guid) dlist.push(i);
        });
        var offset = 0;
        dlist.forEach(function(d) {
          //console.log("deleting link", self.links[d-(offset)]);
          self.links.splice(d-(offset++), 1);
        });
      });
      source.needs._h.deleted = [];
    });
    return this;
  }
});
$dwcore.prototype.updateLinks = function() {
  this.procDLQueue();
  this.procDQueue();
  this.procCQueue();
  if(typeof this._h.links == 'undefined') this._h.links = {};
  for(var i in this.nodesByGuid) {
    //var needs = this.nodes[i].needsByIndex;
    var needs = this.nodesByGuid[i].needs.list('direct');
    for(var j in needs) {
      try {
        var source = this.nodesByGuid[i];
        var target = this.nodesByName[needs[j].name];
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
$dwcore.prototype.recDependencies = function(guid, callback, cdepth, mdepth, tree) {
  cdepth = cdepth+1 || 0;
  mdepth = mdepth || 10;
  tree = tree || {};
  tree[guid] = true;
  var nextlevel = [];
  //if(cdepth > mdepth) return;
  var needs = this.nodesByGuid[guid].dependencies;
  var self = this;
  for(var i in needs) {
    try {
      if(typeof tree[needs[i]] != 'undefined') return;
      tree[needs[i]] = true;
      if(typeof this.nodesByGuid[needs[i]] == 'undefined') {
        callback({msg: "[dependency does not exist]", dependency: need[i]});
      } else if(typeof callback == 'function') {
        nextlevel.push(needs[i]);
        callback(null, this.nodesByGuid[needs[i]], this.nodesByGuid[guid], cdepth);
        //this.recDependencies(needs[i], callback, cdepth, mdepth, tree);
      } else {
        throw {msg: "[Something unknown has happened]"};
      }
    } catch(err) {
      if(typeof callback == 'function') callback(err);
    }
  }

  nextlevel.forEach(function(nli) {
    self.recDependencies(nli, callback, cdepth, mdepth, tree);
  });
};
$dwcore.prototype.recDependents = function(guid, callback, cdepth, mdepth, tree) {
  cdepth = cdepth+1 || 0;
  mdepth = mdepth || 10;
  tree = tree || {};
  tree[guid] = true;
  var nextlevel = [];
  //if(cdepth > mdepth) return;
  var needs = this.nodesByGuid[guid].dependents;
  var self = this;
  for(var i in needs) {
    try {
      if(typeof this.nodesByGuid[needs[i]] == 'undefined') {
        callback({msg: "[dependent does not exist]", dependent: need[i]});
      } else if(typeof callback == 'function') {
        callback(null, this.nodesByGuid[needs[i]], this.nodesByGuid[guid], cdepth);
        nextlevel.push(needs[i]);
        //this.recDependents(needs[i], callback, cdepth, mdepth, tree);
      }
    } catch(err) {
      if(typeof callback == 'function') callback(err);
    }
  }
  nextlevel.forEach(function(nli) {
    self.recDependents(nli, callback, cdepth, mdepth, tree);
  });
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
    //console.log("raw away", rawArray[i]);
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

  //opts.needs = (opts.needs instanceof Array) ? opts.needs : null || [];
  opts.group = (typeof opts.group == 'number') ? opts.group : null || 1;
  opts.parent = (opts.parent instanceof $dwcore) ? opts.parent : null;
  opts.guid = (typeof opts.guid != 'undefined') ? opts.guid : $dwcore.genguid();
  opts = JSON.parse(JSON.stringify(opts));
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
  //old way is the bad way!
  //this.needs = new $dwcore.needs(opts.needs.filter(function(){ return true; }), {parent: this});
  this.needs = $dwcore.needlist.fromJS(opts, {parent: this});
  //console.log("new node opts", this.needs);
  this.group = opts.group;
  //console.log("new node", this);
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

//find if node is dead if tree is dead.
Object.defineProperty($dwcore.node.prototype, "isTreeDead", {
  enumerable: false,
  get: function() {
    //todo hook in needlist
    if(this.isDead) return true;
    var self = this;
    var treedead = false;
    var checked = {};
    var peergroupdown = {};
    this.needs.list(['failover', 'peers']).forEach(function(n) {
      if(typeof checked[n.flag] == 'undefined') checked[n.flag] = {};
      if(typeof checked[n.flag][n.name] != 'undefined') return;
      var dnode = self.parent.nodesByName[n.name]
      if(typeof peergroupdown[n.service] == 'undefined') peergroupdown[n.service] = false;
      peergroupdown[n.service] = peergroupdown[n.service] || dnode.isTreeDead;
    });
    var isdown = false;
    for(var i in peergroupdown) {
      if(peergroupdown[i]) return true;
    }
    return false;
  }
});
$dwcore.node.fromJS = function(obj) {
  return new $dwcore.node(obj.name, obj);
};
$dwcore.node.fromJSON = function(str) {
  return $dwcode.node.fromJS(JSON.parse(str));
};
$dwcore.node.fromObj = $dwcore.node.fromJS;

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
        //console.log("need.set adding cqueue item %s to node %s", value, this.parent.name);
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

///needitem
$dwcore.needitem = function(name, flags, opts) {
  opts = opts || {};
  opts.parent = opts.parent || null;
  flags = flags || {};
  flags.direct = (typeof flags.peer == 'undefined') && (typeof flags.failover == 'undefined'); //flags.direct || true;
  flags.peer = flags.peer || false;
  flags.failover = flags.failover || false;
  flags.service = flags.service || '';
  this.name = name;
  this.flag = (function() {
    if(flags.direct) return 'direct';
    if(flags.failover) return 'failover';
    if(flags.peer) return 'peer';
    return 'direct';
  })();
  this.parent = opts.parent;
  this.service = flags.service;
};
///end needitem

///needlist
$dwcore.needlist = function(opts) {
  "use strict";
  Object.defineProperty(this, "_h", { enumerable: false, writable: true, 
    value: {
      needs: {direct: {}, failover: {}, peer: {}}
      ,deleted: []
    }
  });
  opts = opts || {}
  this.parent = opts.parent || null;
  //console.log("needlist constructor", this);
};
$dwcore.needlist.fromJSON = function(str, opts) {
  var obj;
  opts = opts || {}
  opts.parent = opts.parent || null;
  try {
    if(typeof str != 'string') throw "[$dwcore.needlist.fromJSON: str must be a string.]";
    obj = JSON.parse(str)
  } catch(err) {
    throw "[$dwcore.needlist.fromJSON: str must be valid JSON string.]";
  }
  return $dwcode.needlist.fromJS(obj, opts);
};
$dwcore.needlist.fromJS = function(obj, opts) {
  //needs, pneeds, fneeds
  //console.log("needlist.fromJS", obj);
  opts = opts || {}
  opts.parent = opts.parent || null;
  var keys = {pneeds: true, fneeds: true};
  //debugger;
  try {
    var nl = new $dwcore.needlist(opts);
    //console.log("needlist.fromJS nl", new $dwcore.needlist());
    for(var k in obj) {
      if(typeof keys[k] != 'undefined') {
        for(var sn in obj[k]) {
          obj[k][sn].forEach(function(i) {
            var ni = new $dwcore.needitem(i, {
              service: sn,
              failover: k=='fneeds',
              peer: k=='pneeds'
            });
            nl.add(ni);
          });
        }
      } else if(k == 'needs') {
        obj[k].forEach(function(i) {
          var ni = new $dwcore.needitem(i, {parent: opts.parent});
          nl.add(ni);
        });
      }
    }
    //console.log("needlist.fromjs nl", nl);
    return nl;
  } catch(err) {
    //todo err
    throw err;
  }
};
$dwcore.needlist.init = function(needs) {
  if(needs instanceof Array) {
    var nl = new $dwcore.needlist();
    needs.forEach(function(d) {
      nl.add(d);
    });
    return nl;
  }
  return;
};

$dwcore.needlist.prototype.add = function(need, callback) {
  if(!(need instanceof $dwcore.needitem) && typeof callback == 'function') {
    callback({msg: "[needlist.add: need is not an instance of needitem]"});
    return this;
  }
  if(this.parent != null && this.parent.parent != null) {
    try {
      //console.log("need.set adding cqueue item %s to node %s", value, this.parent.name);
      this.parent.parent._h.cqueue.push(need.name);
    } catch (e) { console.log(e.stack); debugger;}
  }
  this._h.needs[need.flag][need.name] = need;
  return this;
};

$dwcore.needlist.prototype.remove = function(need, callback) {
  var self = this;
  if(typeof need == 'string') need = self.list().filter(function(v) { return v.name == need; }).map(function(v) { return v; })[0];
  try {
    var tmp = need;
    delete self._h.needs[need.flag][need.name];
    self._h.deleted.push(tmp);
    if(typeof callback == 'function') callback(null, need);
  } catch(e) {
    if(typeof callback == 'function') callback({
      msg: "[needlist.remove: need does not exist.]"
      ,need: need
      ,exception: e
    });
  }
  return this;
};

$dwcore.needlist.prototype.list = function(filter) {
  var self = this;
  filter = (function() {
    if(filter instanceof Array) return filter;
    if(typeof filter == 'string') return [filter];
    return null;
  })() || ["direct", "failover", "peer"];
  var r = {};
  filter.forEach(function(d) {
    if(typeof self._h.needs[d] == 'undefined') return;
    for(var k in self._h.needs[d]) {
      if(typeof r[self._h.needs[d][k]] != 'undefined') return;
      r[self._h.needs[d][k].name] = self._h.needs[d][k];
    }
  });
  var rl = [];
  for(var k in r) {
    rl.push(r[k]);
  }
  return rl;
};
///end needlist
