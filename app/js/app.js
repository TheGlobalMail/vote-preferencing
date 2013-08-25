define([
  'jquery',
  './force-layout',
  './controls'
], function($, layout, controls) {
  'use strict';

  return {
    init: function(){
      controls.init();
      layout.start();
    }
  };

});
