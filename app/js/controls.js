define([
  'jquery',
  './force-layout'
], function($, layout) {

  return {
    init: function(){
      $('#state').on('change', function(e) {
        e.preventDefault();
        layout.start();
    });
    }
  };

});

