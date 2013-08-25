define([
  'd3'
], function(d3) {

  // Attempt to ajdust position of nodes to avoid overlap
  function adjustForCollisions(nodes, nodeData){
    var q = d3.geom.quadtree(nodes),
      i = 0,
      n = nodeData.length;

    while (++i < n) {
      q.visit(collide(nodeData[i]));
    }
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

  return { adjustForCollisions : adjustForCollisions };

});
