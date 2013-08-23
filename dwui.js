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

$dwui.prototype.ko = {};
$dwui.prototype.form = null;
$dwui.prototype.removeNeed = function(node, need) {
  var ind = node.needs.indexOf(need);
  if(ind != -1) {
    node.needs.splice(ind, 1);
    this.ko.nodes.valueHasMutated();
    this.graph.data.nodesByName[node.name()].needs.splice(ind, 1);
    this.graph.updateData(this.graph.data.nodesByName[node.name()]);
  }
};
$dwui.prototype.addNeed = function(n, d, e) {

  var el = $(e.target);
  if(e.keyCode == 13) {
    var newneed =  el.val();
    //n.name(); .needs.set(newneed);
    this.graph.data.nodesByGuid[n.guid()].needs.set(newneed);
    //this.graph.data.nodesByName[n.name()].needs.push(newneed);
    //this.graph.updateData(this.graph.data.nodesByName[n.name()]);
    this.graph.data.updateLinks();
    //ko.mapping.fromJS(this.graph.data.nodes, this.ko);
    //ko.mapping.fromJS({nodes: this.graph.data.nodes}, this.ko);
    ko.mapping.fromJS(this.graph.data.nodes, this.ko.nodes);
    //n.needs.list.push(ko.observable(newneed));
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
    this.ko.nodes.push(ko.mapping.fromJS(newnode));
    this.graph.redraw();
    el.val('');
    el.val('');
    return;
  }
  if(!(/.+/).test(String.fromCharCode(e.keyCode))) { return; }

  var c = el.val();
  el.val(c + String.fromCharCode(e.charCode));
}
$dwui.prototype.exportform = function() {
  ko.mapping.toJSON(this.ko.dw_gdata);
};
$dwui.prototype.refresh = function() {
  ko.applyBindings(this.ko);
};
