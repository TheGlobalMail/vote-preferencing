define([
  'jquery',
  'lodash',
  'd3',
  './vent',
  './collision-detection',
  './preferences-data',
  './splits',
], function($, _, d3, vent, collision, preferences, splits) {
  // method to pull things to front of stage
  d3.selection.prototype.moveToFront = function() {
    return this.each(function() { this.parentNode.appendChild(this);});
  };

  var changeState;

  function init(){

    // Clear the svg to start with
    $('#visualisation svg').remove();

    // Scale the svg to the size of viewport
    var width = $(window).innerWidth(),
        height = $(window).innerHeight() - 60,
        nodeRad = 15,
        minDimension = _.min([width, height]),
        svg = d3.select('#visualisation').append('svg')
          .attr('width', width)
          .attr('height', height),
        link =  svg.selectAll('.link'),
        node = svg.selectAll('.node');

    // svg definitions for pattern
    var defs = svg.append('svg:defs');
    defs.append('svg:pattern')
      .attr({
        id: 'diagonal',
        width: 5,
        height: 5,
        patternUnits: 'userSpaceOnUse'
      })
      .append('svg:image')
        .attr('width', 5)
        .attr('height', 5)
        .attr('xlink:href', '../images/pattern.png')

    // Start the force layout. Scale the distance and charge based on whether
    // a party is selected or not and the preferences between the parties
    var force = d3.layout.force()
        .gravity(0.5)
        .distance(function(d, i){
          return (preferences.selectedParty ? i * 3 : d.mutualValue) * scaleFactor();
        })
        .charge(function(d){
          return -2 * Math.pow(2, preferences.selectedParty ? d.individualValue : d.mutualValue);
        })
        .size([width, height])
        .on('tick', tick);

    // Current node and link data in the force layout
    var linkData, nodeData;

    // Loads the state data based the state control
    changeState = function(){
      startMutualLayout();
    };

    $('#reset-link').click(function(e) {
        changeState();
        e.preventDefault();
    });

    $('#planet').click(function(e) {
        $('body').toggleClass('celestial');
        e.preventDefault();
    });

    // Returns a scale factor based on the dimensions and the current state
    function scaleFactor(){
      // scale by the minimum dimension
      var scale = minDimension / 100;
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

    // Start the layout with forces based on mutual preferences
    function startMutualLayout(){
      force.stop();

      node.remove();
      link.remove();

      $('#reset-link').css('display', 'none');
      preferences.selectedParty = null;

      nodeData = preferences.parties;
      linkData = preferences.preferences;

      // Set the labels to just the party names
      var labels = d3.selectAll('.labels');
      if (labels[0].length > 0) {
        d3.selectAll('.labels').transition()
          .text(function(d) { return d.name.replace(/ Party.*/, ''); });
      }

      // Set the circles to the default size
      var nodes = d3.selectAll('.node');
      nodes.selectAll('circle').attr('r', nodeRad);
      nodes.selectAll('text').attr('dx', nodeRad * 1.2);

      startForceLayout();
    }

    function startForceLayout(){
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
        // .attr("class", function(d){
        //   var classes = ['node'];
        //   if (splits.hasSplit(preferences.selectedState, d.name)){
        //     classes.push('split');
        //   }
        //   return classes.join('  ');
        // })
        .attr('class', 'node')
        .attr("pointer-events", "all")
        .on('mouseover', function() {
            if (!$('html').hasClass('ie')) {
                d3.select(this).moveToFront();
            };
        })
        .on("click", click)
        .call(force.drag);

      inside.append("svg:circle")
        .attr('class', function(d){
          if (d.name.match(/^the greens/i)){
            return 'greens';
          }else if (d.name.match(/australian labor/i)){
            return 'alp';
          }else if (d.name.match(/coalition|liberal national/i)){
            return 'coalition';
          }
        })
        // use pattern fill if it is split vote
        .style('fill', function (d){
          if (splits.hasSplit(preferences.selectedState, d.name)){
            return 'url(/#diagonal)';
          }
        })
        .attr("r", nodeRad);

      var rect = inside.append('rect')
          .attr('class', 'text-background')
          .attr('y', '-0.6em')
          .attr('x', nodeRad * 1.2)
          .attr('width', function(d){
            var length = displayName(d).length;
            if (splits.hasSplit(preferences.selectedState, d.name)){
              length += 4;
            }
            return length * 0.6 + 'em';
          })
          .attr('height', '1.2em');

      inside.append("text")
          .attr('class', 'labels')
          .attr('dx', nodeRad * 1.2)
          .attr('text-anchor', 'start')
          .attr("dy", ".35em")
          .on('mouseover', labelRollover)
          .on('mouseout', function() {
            d3.selectAll('.labels').transition()
              .style('fill-opacity', 0.8)
            })
          .text(function(d){
            var label = displayName(d);
            label += splits.hasSplit(preferences.selectedState, d.name) ? ' (1st split)' : '';
            return label;
          });
    }

    function labelRollover() {
      var selected = this;
      d3.selectAll('.labels').transition().style('fill-opacity',function () {
        return (this === selected) ? 1.0 : 0.8;
      });
    }

    function displayName(node){
      return node.name.replace(/ Party.*/, '');
    }

    function partyList(){
      var source = preferences.parties[preferences.selectedParty];
      source.rank = null;

      linkData.forEach(function (l) {
        l.target.rank = l.individualValue;
      });

      linkData.sort(function(a, b) { return a.individualValue - b.individualValue; });

      force
          .nodes(nodeData)
          .links(linkData)
          .start();

      d3.selectAll('.labels')
        .transition().text(function(d) {
          var label = displayName(d);
          if (d === source && splits.hasSplit(preferences.selectedState, d.name)){
            label += ' (using 1st split ticket)';
          }
          return label;
        });
    }

    function click(d){
      if (d3.event.defaultPrevented) return; // ignore drag
      if (preferences.selectedParty === d.index){
        preferences.selectedParty = null;
        return startMutualLayout();
      }
      preferences.selectedParty = d.index;

      $('#reset-link').css('display', 'inline-block');
      // update some visuals on click
      var selected = this;
      d3.selectAll('.node')
        .each(function () {
          var group = d3.select(this);
          if (this === selected) {
            group.select('circle').transition().delay(800).duration(600).attr('r', nodeRad + 6);
            group.select('text').attr('dx', nodeRad * 1.5);
            group.select('rect').attr('x', nodeRad * 1.5);
            group.classed('selectedNode', true);

          } else {
            group.select('circle').attr('r', nodeRad / 2);
            group.select('text').attr('dx', nodeRad * 1.2);
            group.select('rect').attr('x', nodeRad * 1.2);
            group.classed('selectedNode', false);
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

    // Adjust positions to keep on screen and minimise collisions
    function tick(e){
      collision.adjustForCollisions(node, nodeData);

      node.attr('transform', function(d) {
        // hard Y val for selected party node
        var topNodeY = 40;

        // change center of gravity if in party state
        if (preferences.selectedParty) {
          d3.select('.selectedNode')[0][0].__data__.y = topNodeY;
          var onscreenX = Math.max(nodeRad, Math.min(width - nodeRad - 150, d.x));
          var onscreenY = Math.max(nodeRad * 2, Math.min(height - nodeRad, (topNodeY + d.y - (height / 6))));
          return 'translate(' + onscreenX + ',' + onscreenY + ')';
        } else {
          var onscreenX = Math.max(nodeRad, Math.min(width - nodeRad - 150, d.x));
          var onscreenY = Math.max(nodeRad, Math.min(height - nodeRad, d.y));
          return 'translate(' + onscreenX + ',' + onscreenY + ')';
        };
      });
    }
  }

  return {
    init: init,
    changeState: function(){
      changeState();
    }
  };

});
