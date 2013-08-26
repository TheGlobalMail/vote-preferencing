define([
  'jquery',
  './force-layout'
], function($, layout) {

  return {
    // Restart the layout after resize
    init: function(){
      var resizeTimer;
      $(window).resize(function(){
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layout.start, 1000);
      });
    }
  };


});

