(function() {
  'use strict';

	var w = 960, h = 960;

	var labelDistance = 0;

	var vis = d3.select("#visualisation").append("svg:svg").attr("width", w).attr("height", h);

	var nodes = [];
	var labelAnchors = [];
	var labelAnchorLinks = [];
	var links = [];

  var data = {};

  var activeLink;

  
  d3.json("/data/nsw.json", function(error, json) {
    data.nodes = [];
    data.labelAnchors = [];
    data.links = [];
    data.labelAnchorLinks = [];
    data.nodeIndex = {};
    // Extract parties
    _.each(json, function(row, index){
      var node = {name: row.Party, label: row.Party.replace(/ party.*/i, '') };
      data.nodes.push(node);
      data.labelAnchors.push({node: node });
      data.labelAnchors.push({node: node });
      data.nodeIndex[row.Party] = index;
    });
    // Build links
    data.names = _.pluck(data.nodes, 'name');
    _.each(data.names, function(name, index){
      var preferences = json[index];
      delete preferences.Party;
      delete preferences[name];
      _.each(preferences, function(score, target){
        var scoreF = parseFloat(score);
        data.links.push({
          source: index,
          target: data.nodeIndex[target],
          individualValue: scoreF
        });
      });
    });
    // let's calculate mutual.. TODO could be so much more efficient
    _.each(data.links, function(link){
      var coLink = _.detect(data.links, function(l){
        return l.target === link.source &&
          l.source === link.target;
      });
      link.mutualValue = (link.individualValue + coLink.individualValue) / 2 ;
      link.weight =  link.mutualValue;
    });
    _.each(data.nodes, function map(n, index){
      data.labelAnchorLinks.push({source: index * 2, target: index * 2 + 1, weight: 1 });
    });
    mutual();
  });
  
  function mutual(){
    nodes = data.nodes;
    labelAnchors = data.labelAnchors;
    links = data.links;
    labelAnchorLinks = data.labelAnchorLinks;
    update();
  }

  function update(){

    var force = d3.layout.force().size([w, h]).nodes(nodes)
      .links(links)
      //.gravity(1).linkDistance(50).charge(-3000)
      .gravity(0.05)
      .linkDistance(function(d){
        console.error('using ' + d.mutualValue)
        var distance = activeLink ? d.individualValue * 9 : d.mutualValue * 5;
        return distance;
      })
      .charge(function(d){
        console.error('using: ' + d.mutualValue)
        console.error(d)
        return -1 * Math.pow(2, activeLink ? d.individualValue : d.mutualValue);
      });
      /*
      .linkStrength(function(x) {
        return x.weight * 10;
      });
      */


    force.start();

		var force2 = d3.layout.force().nodes(labelAnchors).links(labelAnchorLinks).gravity(0).linkDistance(10).linkStrength(8).charge(-100).size([w, h]);
    force2.start();

    //var link = vis.selectAll("line.link").data(links).enter().append("svg:line").attr("class", "link").style("stroke", "#CCC");

    var node = vis.selectAll("g.node").data(force.nodes()).enter().append("svg:g").attr("class", "node");
    node.append("svg:circle").attr("r", 5).style("fill", "#555").style("stroke", "#FFF").style("stroke-width", 3);
    node.call(force.drag);


    var anchorLink = vis.selectAll("line.anchorLink").data(labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

    var anchorNode = vis.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode");
    anchorNode.append("svg:circle").attr("r", 0).style("fill", "#FFF");
      anchorNode.append("svg:text").text(function(d, i) {
      return i % 2 == 0 ? "" : d.node.label
    }).style("fill", "#555").style("font-family", "Arial").style("font-size", 12);

    var updateLink = function() {
      this.attr("x1", function(d) {
        return d.source.x;
      }).attr("y1", function(d) {
        return d.source.y;
      }).attr("x2", function(d) {
        return d.target.x;
      }).attr("y2", function(d) {
        return d.target.y;
      });

    }

    var updateNode = function() {
      this.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    }


    force.on("tick", function() {

      force2.start();

      node.call(updateNode);

      anchorNode.each(function(d, i) {
        if(i % 2 == 0) {
          d.x = d.node.x;
          d.y = d.node.y;
        } else {
          var b = this.childNodes[1].getBBox();

          var diffX = d.x - d.node.x;
          var diffY = d.y - d.node.y;

          var dist = Math.sqrt(diffX * diffX + diffY * diffY);

          var shiftX = b.width * (diffX - dist) / (dist * 2);
          shiftX = Math.max(-b.width, Math.min(0, shiftX));
          var shiftY = 5;
          this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
        }
      });


      anchorNode.call(updateNode);

      //link.call(updateLink);
      anchorLink.call(updateLink);

    });
  }


}());
