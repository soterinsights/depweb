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
  /*jsondata.forEach(function(d) {
    d.toString = function nodeToString() {
      return this.name + ':' + this.needs.join(','); // + ':' + Date.now();
    }
  })*/
  var n = new $dwui();

  var graph = n.graph = this.graph = new $depweb_graph(opts.element, opts.width, opts.height, $dwcore.fromArray(jsondata));
  n.ko.nodes = ko.mapping.fromJS(graph.data.nodes); //ko.observableArray(jsondata);
  //n.ko.nodes = ;
  //n.ko.links = ko.mapping.fromJS(graph.data.links);
  return n;
};

$dwui.addNodePrompt = function(n, e) {
  var self = this;
  var nf = $('#res .addNodePrompt').clone().appendTo(e.srcElement);
  $('.btn', nf).click(function() {
    var newneed = $('.needname', nf).val();
    nf.remove();
    self.graph.data.nodesByGuid[n.guid()].needs.set(newneed);
    self.graph.data.updateLinks();
    ko.mapping.fromJS(self.graph.data.nodes, self.ko.nodes);
    self.graph.redraw();
  });
}


$dwui.prototype.ko = {};
$dwui.prototype.form = null;
$dwui.prototype.removeNeed = function(node, need) {
  this.graph.data.nodesByGuid[node.guid()].needs.remove(need);
  this.graph.data.updateLinks();
  ko.mapping.fromJS(this.graph.data.nodes, this.ko.nodes);
  this.graph.redraw();
};
$dwui.prototype.addNeed = function(n, d, e) {

  var el = $(e.target);
  if(e.keyCode == 13) {
    var newneed =  el.val();
    this.graph.data.nodesByGuid[n.guid()].needs.set(newneed);
    this.graph.data.updateLinks();
    ko.mapping.fromJS(this.graph.data.nodes, this.ko.nodes);
    this.graph.redraw();
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
    ko.mapping.fromJS(this.graph.data.nodes, this.ko.nodes);
    this.graph.redraw();
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
  return ko.mapping.toJSON(self.ko.nodes, map);
};
$dwui.prototype.refresh = function() {
  ko.applyBindings(this.ko);
};
