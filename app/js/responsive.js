define([
  'jquery',
  'lodash',
  './force-layout'
], function($, _, layout) {

  return {
    // Restart the layout after resize
    init: function(){
      var resizeTimer;
      $(window).resize(function(){
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function(){
          layout.init();
          layout.changeState();
        }, 1000);
      });
    }
  };


});

