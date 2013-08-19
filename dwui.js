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

  var graph = n.graph = new $depweb_graph(opts.element, opts.width, opts.height, $depweb.fromArray(jsondata));
  n.ko.nodes = ko.mapping.fromJS(graph.data.nodes); //ko.observableArray(jsondata);
  //n.ko.nodes = ;
  //n.ko.links = ko.mapping.fromJS(graph.data.links);
  return n;
};

$dwui.prototype.ko = {};
$dwui.prototype.form = null;
$dwui.prototype.removeNeed = function(node, need) {
  console.log(arguments);
  console.log("index:", node.needs.indexOf(need));
  var ind = node.needs.indexOf(need);
  if(ind != -1) {
    node.needs.splice(ind, 1);
    this.ko.nodes.valueHasMutated();
    this.graph.data.nodesByName[node.name()].needs.splice(ind, 1);
    this.graph.updateData(this.graph.data.nodesByName[node.name()]);
  }
};
$dwui.prototype.exportform = function() {
  ko.mapping.toJSON(this.ko.dw_gdata);
};
$dwui.prototype.refresh = function() {
  ko.applyBindings(this.ko);
};
