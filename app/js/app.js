(function() {
  'use strict';

  var width = 960,
      height = 960;

  var json;

  var svg = d3.select("#visualisation").append("svg")
      .attr("width", width)
      .attr("height", height);

  var activeLink;

  var force = d3.layout.force()
      .gravity(0.05)
      .distance(function(d){
        var distance = activeLink ? d.individualValue * 9 : d.mutualValue * 5;
        return distance;
      })
      .charge(function(d){
        return -1 * Math.pow(2, activeLink ? d.individualValue : d.mutualValue);
      })
      .size([width, height])
      .on("tick", tick);

  var link =  svg.selectAll(".link");
  var node = svg.selectAll(".node");

  var mutualLinkData, linkData, nodeData;

  function tick(){

    var q = d3.geom.quadtree(node),
      i = 0,
      n = node.length;

    while (++i < n) {
      q.visit(collide(node[i]));
    };

    link.attr("x1", function(d) { return d.source.x;  })
      .attr("y1", function(d) { return d.source.y;  })
      .attr("x2", function(d) { return d.target.x;  })
      .attr("y2", function(d) { return d.target.y;  });

    //node.attr("cx", function(d) { return d.x;  })
    //  .attr("cy", function(d) { return d.y;  });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";  });
  }

  function collide(node) {
    var r,
    nx1 = node.x - r,
    nx2 = node.x + r,
    ny1 = node.y - r,
    ny2 = node.y + r;
    node.radius = 5;
    return function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== node)) {
        var x = node.x - quad.point.x,
        y = node.y - quad.point.y,
        l = Math.sqrt(x * x + y * y),
        r = 50; //node.radius + quad.point.radius;
        if (l < r) {
          l = (l - r) / l * .5;
          node.x -= x *= l;
          node.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;


        }
        return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
      }
    };
  }

  d3.json("/data/nsw.json", function(error, data) {
    json = {};
    json.nodes = [];
    json.links = [];
    json.nodeIndex = {};
    // Extract parties
    _.each(data, function(row, index){
      json.nodes.push({ name: row.Party });
      json.nodeIndex[row.Party] = index;
    });
    // Build links
    json.names = _.pluck(json.nodes, 'name');
    _.each(json.names, function(name, index){
      var preferences = data[index];
      delete preferences.Party;
      delete preferences[name];
      _.each(preferences, function(score, target){
        var scoreF = parseFloat(score)
        json.links.push({
          source: index,
          target: json.nodeIndex[target],
          value: scoreF,
          individualValue: scoreF
        });
      });
    });
    // let's calculate mutual.. TODO could be so much more efficient
    _.each(json.links, function(link){
      var coLink = _.detect(json.links, function(l){
        return l.target === link.source &&
          l.source == link.target;
      });
      link.mutualValue = (link.individualValue + coLink.individualValue) / 2 
    });
    mutual();
  });

  function mutual(){
    nodeData = json.nodes;
    linkData = json.links;
    update();
  }

  function update(){
    force
        .nodes(nodeData)
        .links(linkData)
        .start();

    link = link.data(activeLink ? linkData : []);

    // remove anything not in the data anymore
    link.exit().remove();

    // Add a line
    link.enter().insert("line", ".node")
          .attr("class", "link");

    node = node.data(nodeData);

    node.exit().remove();

    var nodeEnter = node.enter()
    
    var inside = nodeEnter.append("g")
      .attr("class", "node")
      .attr("pointer-events", "all")
      .on("click", click)
      .call(force.drag);

    inside.append("svg:circle")
      .attr("r", 10)
      .style("fill", "#555")
      .style("stroke", "#FFF")
      .style("stroke-width", 3);

    inside.append("text")
        .attr('dx', '10')
        .attr('text-anchor', 'start')
        .attr("dy", ".35em")
        .attr("pointer-events", "none")
        .text(function(d) { return d.name.replace(/ Party.*/, '')});
  }

  function click(d){
    if (d3.event.defaultPrevented) return; // ignore drag
    if (activeLink === d.index){
      activeLink = null;
      return mutual();
    }
    activeLink = d.index;
    // rearrange links to be alphabetical distance
    var partyLinks = [];
    json.links.forEach(function(link){
      var targetName;
      if (link.source.index === d.index){
        partyLinks.push(link);
      }
    });

    linkData = partyLinks;
    update();
  }

}());
