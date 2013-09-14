var $dwui = function(opts) {
  opts = opts || {};

  if(typeof opts.graph == 'undefined') throw "[no depweb_graph defined for opts.graph]";

  this.element = opts.element; // || '#dw_graph';
  //opts.width = opts.width || $(opts.element)[0].clientWidth;
  //opts.height = opts.height || $(opts.element)[0].clientHeight;

  this.ko = {}
  this.ko.self = this;
  this.ko.list = ko.observableArray();
  this.graph = opts.graph;
  var dwself = this;
  var dwgraph = this.graph;


  /*var nodestyles = {
    'isAlive': {
      circle: {
        true: {'stroke': , }
      }
    }
  };*/


  this.graph.registerCallback("ontick", function() {
    var self = this;
    try {
      if(dwgraph.elements.nodes == null || typeof dwgraph.svg == 'undefined') return;
      dwgraph.elements.links.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      dwgraph.svg.selectAll('.node').attr("x", function(d) { return d.x; })
          .attr("y", function(d) { return d.y; });
      dwgraph.svg.selectAll('.node circle').attr("cx", function(d) { return d.x || 0; })
          .attr("cy", function(d) { return d.y || 0; });
      dwgraph.svg.selectAll('.node text').attr("x", function(d) { return d.x+5; })
          .attr("y", function(d) { return d.y; });
    } catch(e) {
      console.log(e.stack);
      console.log(e.message);
    }
  });

  this.graph.registerCallback('nodes_mouseover', function() {
    var self = this;
    var guid = d3.select(this).attr('dw_guid').toString();

    dwgraph.data.recDependencies(guid, function(e, n, p ,d) {
      if(d == 0) return;
      d3.select('.link[dw_dependent="'+ n.guid +'"][dw_dependency="'+ p.guid +'"]')
        .transition(500)
        .style('stroke', '#FF1493');
    });

    d3.selectAll('G[dw_dependents~="'+guid+'"] circle')
      .transition(500)
      .attr('r', 10)
      .style("fill", function(d) {
        if(d.isTreeDead) return 'red';
        return "cyan";
      });
    d3.selectAll('.link[dw_dependent="'+guid+'"]')
      .transition(500)
      .style('stroke', 'green')
      .style('stroke-width', '6px');

    d3.selectAll('G[dw_dependencies~="'+guid+'"] circle')
      .transition(500)
      .attr('r', 10)
      .style("fill", function(d) {
        if(d.isTreeDead) return 'red';
        return "green";
      });
    d3.selectAll('.link[dw_dependency="'+guid+'"]')
      .transition(500)
      .style('stroke', 'cyan')
      .style('stroke-width', '6px');

    dwgraph.data.recDependents(guid, function(e, n, p ,d) {
      if(!n.isTreeDead) return;
      d3.select('G[dw_guid="'+ n.guid +'"] circle')
        .transition(500)
        .style('fill', 'red');
    });

  });

  this.graph.registerCallback('nodes_mouseout', function() {
    var nid = d3.select(this).attr('dw_nid');
    d3.selectAll('G[dw_dependents] circle')
      .transition(500)
      .attr('r', 5)
      .style("fill", function(d) {
        if(d.isTreeDead) return 'red';
        return dwgraph.color(d.group);
      });
    d3.selectAll('.link[dw_dependent]')
      .transition(500)
      .style('stroke', '#999')
      .style("stroke-width", '2px');

    d3.selectAll('G[dw_dependencies] circle')
      .transition(500)
      .attr('r', 5)
      .style("fill", function(d) {
        if(d.isTreeDead) return 'red';
        return dwgraph.color(d.group);
      });
    d3.selectAll('.link[dw_dependency]')
      .transition(500)
      .style('stroke', '#999')
      .style("stroke-width", '2px');
  });
  //.bind(this.graph));

};

$dwui.preloadForm = function(jsondata, opts) {
  opts = opts || {};
  opts.element = opts.element || '#dw_graph';
  opts.width = opts.width || $(opts.element)[0].clientWidth;
  opts.height = opts.height || $(opts.element)[0].clientHeight;
  if(typeof jsondata == 'string' && jsondata.length > 0) { jsondata = JSON.parse(jsondata); }
  if(typeof jsondata == 'string' && jsondata.length == 0) { jsondata = []; }
  if(!(jsondata instanceof Array)) return;

  var graph = opts.graph = new $depweb_graph(opts.element, opts.width, opts.height, $dwcore.fromArray(jsondata));
  var n = new $dwui(opts);
  //n.element = opts.element;


  var mapping = {
    'needs': {
      create: function(needlist) {
          var l = ko.observableArray()
          return ko.mapping.fromJS(needlist.data.list());
          return l;
      }
    }
  };
  n.ko.nodes = ko.mapping.fromJS(graph.data.nodes, mapping);
  n.bind();
  return n;
};

$dwui.errMsg = function(msg, pel) {
  pel = pel || $('#errors');
  pel.append($('#res .dw_alert').clone());
  $('.dw_alert .msg', pel).text(msg);
};

$dwui.prototype.fromJSON = function(json) {
  var self = this;
  var ar = JSON.parse(json)
  this.clear(true);
  //console.log(ar);
  ar.forEach(function(d) {
    var n = new $dwcore.node(d.name, d);
    self.graph.data.addNode(n);
  });
  this.refresh();
};


//$dwui.prototype.ko = {};
$dwui.prototype.form = null;
$dwui.prototype.showNeedPrompt = function(n, e) {
  $('form', e.srcElement.parentNode.parentNode).toggle(500);
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
  var needname = $('input.needname', f);
  var needflags = $('input.needflags', f);
  var needserv = $('input.needserv', f);
  var a = {
    name: needname.val(),
    flag: needflags.val(),
    serv: needserv.val()
  }
  var opts = {};
  opts[a.flag] = true;
  opts.service = a.serv;
  var newneed = new $dwcore.needitem(needname.val(), opts);
  this.graph.data.nodesByGuid[n.guid()].needs.add(newneed)
  this.refresh();
  needname.val('');
};
$dwui.prototype.updateAddNeedForm = function(serv, fname, el) {
  
  var p = el;
  while(p.tagName != 'FORM') {
    p = p.parentNode;
  }
  $('button', p).text(fname);
  $('')
  var l = $('.needflags', p);
  l.val(serv);
  if(serv == 'direct') {
    $('tr.needserv', p).hide();
  } else {
    $('tr.needserv', p).show();
  }
  return;
};

$dwui.prototype.addNode = function(f) {
  //todo: multi-node, perhaps spaces?
  var el = $('input', f);

  var newnodes = new $dwcore.node(el.val());
  this.graph.data.addNode(newnodes);
  this.refresh();
  el.val('');
  this.setLocation('#/edit');
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

    tmp[i].fneeds = tmpneed.failover;
    tmp[i].pneeds = tmpneed.peer;
    tmp[i].needs = tmpneed.direct;
  }
  return JSON.stringify(tmp, null, " ");
};

$dwui.prototype.saveWeb = function(el) {
  if($('input[name="form_save_displayname"]', el).val().length) {
    //$('.error', el).hide();
  } else {
    $dwui.errMsg("Must specify a display name.", $('.error', el));
    return;
  }
  var qs = $(el).serialize();
  console.log(qs);
  $.post('./store/api.php', qs)
    .done(function(data) {
      Sammy.apps.body.setLocation('#/web/'+data.webid);
    })
    .fail(function() {})
    .always(function() {})
};
$dwui.prototype.changeWeb = function(id) {
  Sammy.apps.body.setLocation('#/web/'+id);
}
$dwui.prototype.clear = function(skip) {
  var self = this;
  this.graph.data.nodes.forEach(function(n) {
    self.graph.data.removeNode(n.name);
  });
  if((typeof skip == 'boolean' && !skip) || typeof skip != 'boolean')  Sammy.apps.body.setLocation('#');
  this.refresh();
  this.setLocation('#/edit');
};
$dwui.prototype.switch = function() {
  var t, u, o, e;
  if(arguments.length == 4) {
    t = arguments[0];
    u = arguments[1];
    o = arguments[2];
    e = arguments[3];
  } else if(arguments.length == 3) {
    t = arguments[0];
    o = arguments[2];
    e = arguments[3];
  }
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

$dwui.prototype.menuview = function() {
  if($(".wholenav").hasClass('span4')) {
    $(".wholenav").removeClass('span4').addClass('span1');
    $('.inputarea, .nav .tohide').hide();
    $('.hider a').text("Show");
  } else {
    $(".wholenav").removeClass('span1').addClass('span4');
    $('.inputarea, .nav .tohide').show();
    $('.hider a').text("Hide");
  }

  if($(".grapharea").hasClass('span8')) {
    $(".grapharea").removeClass('span8').addClass('span11');
  } else {
    $(".grapharea").removeClass('span11').addClass('span8');
  }
  var gsize = this.graph.graph.size();
  var el = $(this.element)[0]
  gsize[0] = el.clientWidth;
  this.graph.graph.size(gsize);
  this.graph.svg.attr('width', gsize[0]).attr('height', gsize[1]);
  this.refresh();
};

$dwui.prototype.setLocation = function(loc) {
  Sammy.apps.body.setLocation(loc);
};
