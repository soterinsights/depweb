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
  this.opts = opts;
  /*jsondata.forEach(function(d) {
    d.toString = function nodeToString() {
      return this.name + ':' + this.needs.join(','); // + ':' + Date.now();
    }
  })*/
  var n = new $dwui();

  var graph = n.graph = this.graph = new $depweb_graph(opts.element, opts.width, opts.height, $dwcore.fromArray(jsondata));
  n.ko.nodes = ko.mapping.fromJS(graph.data.nodes); //ko.observableArray(jsondata);
  n.bind();
  //n.ko.nodes = ;
  //n.ko.links = ko.mapping.fromJS(graph.data.links);
  return n;
};
$dwui.prototype.fromJSON = function(json) {
  var self = this;
  var ar = JSON.parse($('#import_text').val());
  this.clear();
  console.log(ar);
  ar.forEach(function(d) {
    var n = new $dwcore.node(d.name, d);
    self.graph.data.addNode(n);
  });
  this.refresh();
  //this = new $dwui.preloadForm(json, this.opts);
};

$dwui.addNeedPrompt = function(n, e) {
  var self = this;
  var nf = $('#res .addNeedPrompt').clone().appendTo(e.srcElement);
  $('.btn', nf).click(function() {
    var newneed = $('.needname', nf).val();
    nf.remove();
    if(newneed == "") return;
    self.graph.data.nodesByGuid[n.guid()].needs.set(newneed);
    self.refresh();
  });
}

$dwui.prototype.ko = {};
$dwui.prototype.form = null;
$dwui.prototype.removeNeed = function(node, need) {
  this.graph.data.nodesByGuid[node.guid()].needs.remove(need);
  this.refresh();
};
$dwui.prototype.removeNode = function(n) {
  this.graph.data.removeNode(n.name());
  this.refresh();
};
$dwui.prototype.addNeed = function(n, d, e) {
  return;
  var el = $(e.target);
  if(e.keyCode == 13) {
    var newneed =  el.val();
    this.graph.data.nodesByGuid[n.guid()].needs.set(newneed);
    this.refresh();
    el.val('');
    return;
  }
  if(!(/.+/).test(String.fromCharCode(e.keyCode))) { return; }
  var c = el.val();
  el.val(c + String.fromCharCode(e.charCode));
}
$dwui.prototype.addNode = function(d, e) {
  var el = $(e.target);
  if(e.keyCode == 13) {
    var newnode = new $dwcore.node(el.val());
    this.graph.data.addNode(newnode);
    this.refresh();
    el.val('');
    return;
  }
  if(!(/.+/).test(String.fromCharCode(e.keyCode))) { return; }

  var c = el.val();
  el.val(c + String.fromCharCode(e.charCode));
}
$dwui.prototype.exportform = function() {
  var self = this;
  var map = {
    ignore: ["x","y","px","py","weight"]
  }
  return JSON.stringify(ko.mapping.toJS(self.ko.nodes, map), null, " ");
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
  d3.selectAll('svg *');
  this.graph.redraw();
};
$dwui.prototype.bind = function() {
  ko.applyBindings(this.ko);
}
