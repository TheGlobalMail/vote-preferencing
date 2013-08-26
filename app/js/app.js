define([
  'jquery',
  './force-layout',
  './controls',
  './responsive',
  'bootstrapmodal'
], function($, layout, controls, responsive) {
  'use strict';

  return {
    init: function(){
      responsive.init();
      layout.init();
      controls.init();
    }
  };

});
