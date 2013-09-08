var $dwui = function() {
  this.ko.self = this;
}

$dwui.preloadForm = function(jsondata, opts) {
  opts = opts || {};
  opts.element = opts.element || '#dw_graph';
  opts.width = opts.width || $(opts.element)[0].clientWidth;
  opts.height = opts.height || $(opts.element)[0].clientHeight;
  //if(typeof this.form == 'undefined' || this.form == null) return;
  if(typeof jsondata == 'string') jsondata = JSON.parse(jsondata);
  if(!(jsondata instanceof Array)) return;
  //this.opts = opts;
  /*jsondata.forEach(function(d) {
    d.toString = function nodeToString() {
      return this.name + ':' + this.needs.join(','); // + ':' + Date.now();
    }
  })*/
  var n = new $dwui();

  var graph = n.graph = new $depweb_graph(opts.element, opts.width, opts.height, $dwcore.fromArray(jsondata));

  var mapping = {
    'needs': {
      create: function(needlist) {
          var l = ko.observableArray()
          return ko.mapping.fromJS(needlist.data.list());
          return l;
          //return new myChildModel(options.data);
      }
    }
  }
  n.ko.cneedprop = ko.observable();
  n.ko.nodes = ko.mapping.fromJS(graph.data.nodes, mapping); //ko.observableArray(jsondata);
  n.bind();
  //n.ko.nodes = ;
  //n.ko.links = ko.mapping.fromJS(graph.data.links);
  return n;
};
$dwui.prototype.fromJSON = function(json) {
  var self = this;
  //var ar = JSON.parse($('#import_text').val());
  var ar = JSON.parse(json)
  this.clear();
  console.log(ar);
  ar.forEach(function(d) {
    var n = new $dwcore.node(d.name, d);
    self.graph.data.addNode(n);
  });
  this.refresh();
  //this = new $dwui.preloadForm(json, this.opts);
};


$dwui.prototype.ko = {};
$dwui.prototype.form = null;
$dwui.prototype.showNeedPrompt = function(n, e) {
  $('form', e.srcElement.parentNode.parentNode).toggle();
};

$dwui.prototype.removeNeed = function(node, need) {
  this.graph.data.nodesByGuid[node.guid()].needs.remove(need, function() {console.log(arguments); });
  this.refresh();
};

$dwui.prototype.removeNode = function(n) {
  var self = this;
  this.graph.data.nodes.forEach(function(d) {
    try {
      d.needs.remove(n.name());
    } catch(e){}
  });
  this.graph.data.removeNode(n.name());
  this.refresh();
};

$dwui.prototype.addNeed = function(n, f) {
  //todo: multi-need, perhaps spaces?
  var el = $('input', f);
  var newneed = new $dwcore.needitem(el.val(), {direct: true});
  this.graph.data.nodesByGuid[n.guid()].needs.add(newneed)
  this.refresh();
  el.val('');
};

$dwui.prototype.addNode = function(f) {
  //todo: multi-node, perhaps spaces?
  var el = $('input', f);

  var newnodes = new $dwcore.node(el.val());
  this.graph.data.addNode(newnodes);
  this.refresh();
  el.val('');
  return;
}

$dwui.prototype.markDead = function(n, e) {
  var state = this.graph.data.nodesByGuid[n.guid()].isDead;
  this.graph.data.nodesByGuid[n.guid()].isDead = !state;
  this.refresh();
};

$dwui.prototype.exportform = function() {
  var self = this;
  var map = {
    ignore: ["x","y","px","py","weight",'index']
  }
  var tmp = ko.mapping.toJS(self.ko.nodes, map);
  //cleam
  for(var i in tmp) {
    var tmpneed = {
      direct: [],
      failover: {},
      peer: {}
    }
    var tneeds = [], tpneeds = [], tfneed = [];
    for(var j in tmp[i].needs) {
      var tn = tmp[i].needs[j];
      if(tn.flag == 'direct') {
        tmpneed['direct'].push(tn.name);
      } else {
        if(typeof tmpneed[tn.flag][tn.service] == 'undefined') tmpneed[tn.flag][tn.service] = [];
        tmpneed[tn.flag][tn.service].push(tn.name);
      }
    }

    tmp[i].fneeds = tmpneed.fneeds;
    tmp[i].pneeds = tmpneed.pneeds;
    tmp[i].needs = tmpneed.direct;
  }
  return JSON.stringify(tmp, null, " ");
};

$dwui.prototype.clear = function() {
  var self = this;
  this.graph.data.nodes.forEach(function(n) {
    console.log(n);
    self.graph.data.removeNode(n.name);
  });
  this.refresh();
};
$dwui.prototype.switch = function(t, o, e) {
  $('.input_methods').hide();
  $('#'+t).show();
};

$dwui.prototype.refresh = function() {
  this.graph.data.updateLinks();
  ko.mapping.fromJS(this.graph.data.nodes, this.ko.nodes);
  d3.selectAll('svg *').remove();
  this.graph.redraw();
};

$dwui.prototype.bind = function() {
  ko.applyBindings(this.ko);
};

$dwui.prototype.checkDead = function(n) {
  return this.graph.data.nodesByGuid[n.guid()].isDead;
};

$dwui.prototype.checkTreeDead = function(n) {
  return this.graph.data.nodesByGuid[n.guid()].isTreeDead;
};
