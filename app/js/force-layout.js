define([
  'jquery',
  'lodash',
  'd3',
  './vent',
  './collision-detection',
  './preferences-data'
], function($, _, d3, vent, collision, preferences) {

  // Restart the layout after resize
  var resizeTimer;
  $(window).resize(function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 1000);
  });

  // method to pull things to front of stage
  d3.selection.prototype.moveToFront = function() {
    return this.each(function() { this.parentNode.appendChild(this);});
  };

  function start(){

    // Clear the svg to start with
    $('#visualisation svg').remove();

    // Scale the svg to the size of viewport
    var width = $(window).width()- 20,
        height = $(window).height() - 160,
        nodeRad = 10,
        minDimension = _.min([width, height]),
        svg = d3.select('#visualisation').append('svg')
          .attr('width', width)
          .attr('height', height),
        link =  svg.selectAll('.link'),
        node = svg.selectAll('.node');


    // Start the force layout. Scale the distance and charge based on whether
    // a party is selected or not and the preferences between the parties
    var force = d3.layout.force()
        .gravity(0.02)
        .friction(0.95)
        .distance(function(d){
          return (preferences.selectedParty ? d.individualValue  : d.mutualValue) * scaleFactor();
        })
        .charge(function(d){
          return -3 * Math.pow(2, preferences.selectedParty ? d.individualValue : d.mutualValue);
        })
        .size([width, height])
        .on('tick', tick);

    // Current node and link data in the force layout
    var linkData, nodeData;


    // Returns a scale factor based on the dimensions and the current state
    function scaleFactor(){

      // scale by the minimum dimension
      var scale = minDimension / 90;

      // Scale by state XXX refactor to scale based on number of parties
      var state = preferences.selectedState;
      if (_(['wa', 'sa']).contains(state)){
        scale *=  1.5;
      }else if (_(['act', 'nt']).contains(state)){
        scale *=  3.5;
      }else if (_(['tas']).contains(state)){
        scale *=  1.8;
      }else if (_(['qld']).contains(state)){
        scale *=  1.3;
      }

      return scale;
    }

    // Loads the state data based the state control
    function loadState(){
      var state = $('#state').val().toLowerCase();
      var $loading = $('#loading');
      $loading.show();
      preferences.loadState(state)
        .always(function(){
          force.stop();
          $loading.hide();
          node.remove();
          link.remove();
          startMutualLayout();
        });
    }

    // Start the layout with forces based on mutual preferences
    function startMutualLayout(){
      nodeData = preferences.parties;
      linkData = preferences.preferences;

      var labels = d3.selectAll('.labels');

      if (labels[0].length > 0) {
        d3.selectAll('.labels').transition()
          .text(function(d) { return d.name.replace(/ Party.*/, ''); });
      }

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

      link = link.data(preferences.selectedParty ? linkData : []);

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
        .on('mouseover', function() {
          d3.select(this).moveToFront();
        })
        .on("click", click)
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
            return displayName(d).length * 0.6 + 'em';
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
              .style('fill-opacity', 0.8)
            })
          .text(displayName);
    }

    function labelRollover() {
      var selected = this;
      d3.selectAll('.labels').transition().style('fill-opacity',function () {
        return (this === selected) ? 1.0 : 0.8;
      });
    }

    function displayName(node){
      var label = preferences.selectedParty ? '1. ' : '';
      label += node.name.replace(/ Party.*/, '');
      return label;
    }

    function partyList(){
      var source = preferences.parties[preferences.selectedParty];
      source.rank = null;
      linkData.forEach(function (l) {
        l.target.rank = l.individualValue;
      });

      force
          .nodes(nodeData)
          .links(linkData)
          .start();

      d3.selectAll('.labels')
        .transition().text(function(d) {
          return (d.rank ? d.rank + '. ' : '') + d.name.replace(/ Party.*/, '');
        });
    }

    function click(d){
      if (d3.event.defaultPrevented) return; // ignore drag
      if (preferences.selectedParty === d.index){
        preferences.selectedParty = null;
        return startMutualLayout();
      }
      preferences.selectedParty = d.index;

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
      _.each(preferences.preferences, function(link){
        if (link.source.index === d.index){
          partyLinks.push(link);
        }
      });
      linkData = partyLinks;
      partyList();

      vent.trigger('selected:party', d.name);
    }

    function tick(){

      collision.adjustForCollisions(node, nodeData);

      node.attr("transform", function(d) { return "translate(" + Math.max(nodeRad, Math.min(width - nodeRad, d.x)) + "," + Math.max(nodeRad, Math.min(height - nodeRad, d.y)) + ")";  });
    }

    loadState();
  }

  return {
    start: start
  };

});
