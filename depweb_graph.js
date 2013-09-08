var $depweb_graph = function(node, width, height, dataObj) {
  var self = this;
  this.data = dataObj || new $dwcore();
  this.color = d3.scale.category20();

  this.graph = d3.layout.force()
    .charge(-300)
    .linkDistance(function(l) {
      self.data.nodesByGuid[l.source.guid];
      return 150;
    })
    .size([width, height])
    .gravity(0.03);
  this.svg = d3.select(node).append('svg')
    .attr("width", width)
    .attr("height", height);

  this.graph
      .nodes(this.data.nodes)
      .links(this.data.links);

  this.elements = {
    nodes: null
    ,cnodes: null
    ,link: null
    ,tnodes: null
  }

  this.graph.on("tick", (function() {
    var self = this;

    try {
      if(self.elements.nodes == null || typeof this.svg == 'undefined') return;
      self.elements.links.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      self.svg.selectAll('.node').attr("x", function(d) { return d.x; })
          .attr("y", function(d) { return d.y; });
      self.svg.selectAll('.node circle').attr("cx", function(d) { return d.x || 0; })
          .attr("cy", function(d) { return d.y || 0; });
      self.svg.selectAll('.node text').attr("x", function(d) { return d.x+5; })
          .attr("y", function(d) { return d.y; });
    } catch(e) {
      console.log(e.stack);
      console.log(e.message);
    }
  }).bind(this));
  
  this.redraw();
}
$depweb_graph.prototype.addData = function(newNode) {
  this.data.addNode(newNode);
  this.data.updateLinks();
  setTimeout(this.redraw.bind(this), 1);
  return this;
};

$depweb_graph.prototype.updateData = function(mnode) {
  var self = this;
  return this;
  this.data.updateNode(mnode, (function(err, dn, ndata) {
    console.log("args", arguments);
    dn = dn || [];
    var l = self.graph.links();
    var ol = l.length;
    var d = [];
    var off = 0;
    for(var i in l) {
      for(var j in dn) {
        if(l[i].source_nid == dn[j].source
           && l[i].target_nid == dn[j].target_nid) {
          l.splice(i-off,1);
        }
      }
    }
    if(ol != l.length) {
      setTimeout(arguments.callee.bind(this ,err, dn, ndata), 1);
      return;
    }
    dn.forEach(function(d) {
    })
    setTimeout(self.redraw.bind(self), 10);
  }));
  
  return this;
}
$depweb_graph.prototype.redraw = function() {
  var self = this;
  if(typeof self.data == 'undefined') return;
  self.graph.stop();

  var links = this.svg.selectAll(".link")
                .data(this.graph.links());

  var nodes = this.svg.selectAll('.node')
                .data(self.graph.nodes());

  self.graph.start();
  links.exit().remove();
  links.enter().append("line")
      .attr("class", "link")
      .attr("dw_dependency", function(d) { return d.source.guid; })
      .attr("dw_dependent",  function(d) {return d.target.guid;  })
      .style("stroke-width", '2px');//function(d) { return Math.sqrt(d.value); });

  nodes.exit().remove();
  nodes.enter().append("g")
    .attr('dw_guid', function(d) { return d.guid; })
    .attr("class", "node")
    .attr('dw_dependencies', function(d) { return d.dependencies.join(" "); })
    .attr('dw_dependents', function(d) { return d.dependents.join(" "); })
    .call(self.graph.drag)
    .on('mouseover', function() {
      var guid = d3.select(this).attr('dw_guid').toString();

      self.data.recDependencies(guid, function(e, n, p ,d) {
        if(d == 0) return;
        d3.select('.link[dw_dependent="'+ n.guid +'"][dw_dependency="'+ p.guid +'"]')
          .transition(500)
          .style('stroke', '#FF1493');
      });

      d3.selectAll('G[dw_dependents~="'+guid+'"] circle')
        .transition(500)
        .attr('r', 10)
        .style("fill", "cyan");
      d3.selectAll('.link[dw_dependent="'+guid+'"]')
        .transition(500)
        .style('stroke', 'green')
        .style('stroke-width', '6px');

      d3.selectAll('G[dw_dependencies~="'+guid+'"] circle')
        .transition(500)
        .attr('r', 10)
        .style("fill", "green");  
      d3.selectAll('.link[dw_dependency="'+guid+'"]')
        .transition(500)
        .style('stroke', 'cyan')
        .style('stroke-width', '6px');

      self.data.recDependents(guid, function(e, n, p ,d) {
        if(!n.isTreeDead) return;
        d3.select('G[dw_guid="'+ n.guid +'"] circle')
          .transition(500)
          .style('fill', 'red');
      });

    })
    .on('mouseout', function() {
      var nid = d3.select(this).attr('dw_nid');
      d3.selectAll('G[dw_dependents] circle')
        .transition(500)
        .attr('r', 5)
        .style("fill", function(d) { return self.color(d.group); });
      d3.selectAll('.link[dw_dependent]')
        .transition(500)
        .style('stroke', '#999')
        .style("stroke-width", '2px');

      d3.selectAll('G[dw_dependencies] circle')
        .transition(500)
        .attr('r', 5)
        .style("fill", function(d) { return self.color(d.group); });
      d3.selectAll('.link[dw_dependency]')
        .transition(500)
        .style('stroke', '#999')
        .style("stroke-width", '2px');
    });
  var enodes = this.svg.selectAll('.node:empty')
  enodes.append("circle")
        .attr("r", function(d) {
          if(d.isTreeDead) return 7;
          return 5;
        })
        .attr("class", "dcircle")
        .style("fill", function(d) { 
          if(d.isTreeDead) return 'red';
          return self.color(d.group); 
        })
        .append("title")
          .text(function(d) { return d.name; });
  enodes.append("text")
        .attr('class', 'textnode')
        .text(function(d) { return d.name || d.desc; });

  self.elements.links = this.svg.selectAll('.link');
  self.elements.nodes = this.svg.selectAll('.node');
  self.elements.tnodes = this.svg.selectAll('.node circle');
  self.elements.cnodes = this.svg.selectAll('.node text');

  return;

  var mnode = this.svg.selectAll(".node")
      .data(self.data.nodes);

    mnode.append("circle")
        .attr("r", 5)
        .attr("class", "dcircle")
        .style("fill", function(d) { return self.color(d.group); })
        .append("title")
          .text(function(d) { return d.name; });
    mnode.append("text")
        .attr('class', 'textnode')
        .text(function(d) { return d.name || d.desc; });

  var link = this.elements.link = this.svg.selectAll('.link');
  var nodes = this.elements.nodes = this.svg.selectAll(".node");
  var cnodes  = this.elements.cnodes = this.svg.selectAll(".node circle");
  var tnodes = this.elements.tnodes = this.svg.selectAll(".node text");

    self.elements.link
      .attr("dw_dependency", function(d) {try { return d.source.nid || d.source } catch (e) { return -1 } })
      .attr("dw_dependent",  function(d) {try { return d.target.nid || d.target } catch (e) { return -1 } });
    this.svg.selectAll(".node text")
      .attr('dw_dependencies', function(d) { return d.dependencies.join(" "); })
      .attr('dw_dependents', function(d) { return d.dependents.join(" "); });
  this.graph.start();
}; // end redraw;
