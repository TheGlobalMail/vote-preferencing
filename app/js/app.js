(function() {
  'use strict';

  function visualise(){

    var width = $(window).width(),
        height = $(window).height() - 150;

    var nodeRad = 10;

    var data;

    $('#visualisation svg').remove();
    var svg = d3.select("#visualisation").append("svg")
        .attr("width", width)
        .attr("height", height);

    var activeLink;

    var state;

    var scaleFactor = _.min([height, width]) / 90;

    // method to pull things to front of stage
    d3.selection.prototype.moveToFront = function() {
        return this.each(function() { this.parentNode.appendChild(this);});
    };

    var force = d3.layout.force()
        .gravity(0.02)
        .friction(0.95)
        .distance(function(d){
          var distance = activeLink ? d.individualValue * scaleFactor : d.mutualValue * (scaleFactor * 0.9);
          distance = distance * scaleFactorForState(state);
          return distance;
        })
        .charge(function(d){
          return -3 * Math.pow(2, activeLink ? d.individualValue : d.mutualValue);
        })
        .size([width, height])
        .on("tick", tick);

    var link =  svg.selectAll(".link");
    var node = svg.selectAll(".node");

    var mutualLinkData, linkData, nodeData;

    function scaleFactorForState(state){
      if (_(['wa', 'sa']).contains(state)){
        return 1.5;
      }else if (_(['act', 'nt']).contains(state)){
        return 3.5;
      }else if (_(['tas']).contains(state)){
        return 1.8;
      }else if (_(['qld']).contains(state)){
        return 1.3;
      }else{
        return 1;
      }
    }

    function loadState(){
      state = $('#state').val().toLowerCase();
      var $loading = $('#loading');
      $loading.show();
      d3.json("/data/" + state + ".json", function(error, json) {
        force.stop();
        $loading.hide();
        data = {};
        data.nodes = [];
        data.links = [];
        data.nodeIndex = {};
        // Extract parties
        _.each(json, function(row, index){
          data.nodes.push({ name: row.Party });
          data.nodeIndex[row.Party] = index;
        });
        // Build links
        data.names = _.pluck(data.nodes, 'name');
        _.each(data.names, function(name, index){
          var preferences = json[index];
          delete preferences.Party;
          delete preferences[name];
          _.each(preferences, function(score, target){
            var scoreF = parseFloat(score)
            data.links.push({
              source: index,
              target: data.nodeIndex[target],
              value: scoreF,
              individualValue: scoreF
            });
          });
        });
        // let's calculate mutual.. TODO could be so much more efficient
        _.each(data.links, function(link){
          var coLink = _.detect(data.links, function(l){
            return l.target === link.source &&
              l.source == link.target;
          });
          link.mutualValue = (link.individualValue + coLink.individualValue) / 2
        });
        window.data = data;
        node.remove();
        link.remove();
        mutual();
      });
    }

    function mutual(){
      nodeData = data.nodes;
      linkData = data.links;

      var labels = d3.selectAll('.labels');

      if (labels[0].length > 0) {
        labels.transition()
          .text(function(d) { return d.name.replace(/ Party.*/, '')});
      };

      var nodes = d3.selectAll('.node');
      nodes.selectAll('circle').attr('r', nodeRad);
      nodes.selectAll('text').style('font-size', '10px').attr('dx', '12');

      init();
    }

    function init(){
      force
          .nodes(nodeData)
          .links(linkData)
          .start();

      link =  svg.selectAll(".link");
      node = svg.selectAll(".node");

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
        .on('mouseover', function() {
            d3.select(this).moveToFront();
        })
        .call(force.drag);

      inside.append("svg:circle")
        .attr('class', function(d){
          if (d.name.match(/^the greens/i)){
            return 'greens';
          }else if (d.name.match(/australian labor/i)){
            return 'alp';
          }else if (d.name.match(/coalition/i)){
            return 'coalition';
          }
        })
        .attr("r", nodeRad);

      var rect = inside.append('rect')
          .attr('class', 'text-background')
          .attr('y', '-0.6em')
          .attr('x', '10')
          .attr('width', function(d){
            return displayName(d).length * 0.55 + 'em';
          })
          .attr('height', '1.2em');

      inside.append("text")
          .attr('class', 'labels')
          .attr('dx', '12')
          .attr('text-anchor', 'start')
          .attr("dy", ".35em")
          .on('mouseover', labelRollover)
          .on('mouseout', function() {
            d3.selectAll('.labels').transition()
              .style('fill-opacity', 0.8)})
          .text(displayName);
          // .attr("pointer-events", "none")
    }

    function labelRollover() {
      var selected = this;
      d3.selectAll('.labels').transition().style('fill-opacity',function () {
        return (this === selected) ? 1.0 : 0.8;
      });
    }

    function displayName(node){
      var label = activeLink ? '1. ' : '';
      label += node.name.replace(/ Party.*/, '');
      return label;
    }

    function partyList(clicked){
      // var sorted = linkData.sort(function (a, b) { return a.individualValue - b.individualValue; });
      var source = data.nodes[activeLink];
      source.rank = null;
      linkData.forEach(function (l) {
        l.target.rank = l.individualValue;
      });

      force
          .nodes(nodeData)
          .links(linkData)
          .start();

      link = link.data(activeLink ? linkData : []);

      // remove anything not in the data anymore
      link.exit().remove();

      d3.selectAll('.labels')
        .transition().text(function(d) {
          return (d.rank ? d.rank + '. ' : '') + d.name.replace(/ Party.*/, '');
        });

      // clicked.transition()
      //   .attr('transform', 'translate(' + width / 2 + ',' + 20 + ')')
    }

    function click(d){
      if (d3.event.defaultPrevented) return; // ignore drag
      if (activeLink === d.index){
        activeLink = null;
        return mutual();
      }
      activeLink = d.index;

      var selected = this;

      d3.selectAll('.node')
        .each(function () {
          var group = d3.select(this);
          if (this === selected) {
            group.select('circle').transition()
              .delay(800).duration(600)
              .attr('r', nodeRad + 6);
          } else {
            group.select('circle').attr('r', nodeRad / 2);
          }
        });

      d3.selectAll('.node')
        .each(function () {
          var group = d3.select(this);
          if (this === selected) {
            group.select('text').transition()
              .delay(800).duration(600)
              .attr('dx', '15')
              .style('font-size', '14px');
          } else {
            group.select('text')
              .attr('dx', '12')
              .style('font-size', '10px');
          }
        });

      var partyLinks = [];
      data.links.forEach(function(link){
        var targetName;
        if (link.source.index === d.index){
          partyLinks.push(link);
        }
      });
      linkData = partyLinks;
      partyList(d3.select(this));
    }

    function tick(){

      var q = d3.geom.quadtree(node),
        i = 0,
        n = nodeData.length;

      while (++i < n) {
        q.visit(collide(nodeData[i]));
      };

      // link.attr("x1", function(d) { return d.source.x;  })
      //   .attr("y1", function(d) { return d.source.y;  })
      //   .attr("x2", function(d) { return d.target.x;  })
      //   .attr("y2", function(d) { return d.target.y;  });

      //node.attr("cx", function(d) { return d.x;  })
      //  .attr("cy", function(d) { return d.y;  });

      node.attr("transform", function(d) { return "translate(" + Math.max(nodeRad, Math.min(width - nodeRad, d.x)) + "," + Math.max(nodeRad, Math.min(height - nodeRad, d.y)) + ")";  });

      // node.each(function(d, i) {
      //     var b = this.childNodes[1].getBBox();

      //     var diffX = d.x - d.node.x;
      //     var diffY = d.y - d.node.y;

      //     var dist = Math.sqrt(diffX * diffX + diffY * diffY);

      //     var shiftX = b.width * (diffX - dist) / (dist * 2);
      //     shiftX = Math.max(-b.width, Math.min(0, shiftX));
      //     var shiftY = 5;
      //     this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
      //   }
      //   });
    }


    function collide(node) {
      var r,
      nx1 = node.x - r,
      nx2 = node.x + r,
      ny1 = node.y - 100,
      ny2 = node.y + 100;
      return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
          var x = node.x - quad.point.x,
          y = node.y - quad.point.y,
          l = Math.sqrt(x * x + y * y),
          r = nodeRad; //node.radius + quad.point.radius;
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


    $('#state').on('change', loadState);

    loadState();
  }

  visualise();

  function resizeEnded(){
    visualise();
  }

  var resizeTimer;
  $(window).resize(function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeEnded, 1000);
  });

}());
