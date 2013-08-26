define([
  'jquery',
  './force-layout',
  './controls',
  'bootstrapmodal'
], function($, layout, controls) {
  'use strict';

  return {
    init: function(){
      controls.init();
      layout.start();
    }
  };

});
