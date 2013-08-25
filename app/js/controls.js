define([
  'jquery',
  './force-layout'
], function($, layout) {

  return {
    init: function(){
      $('#state').on('change', layout.start);
    }
  };

});

