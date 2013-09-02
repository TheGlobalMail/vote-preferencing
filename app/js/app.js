define([
  'jquery',
  './vent',
  './force-layout',
  './controls',
  './responsive',
  './router',
  './loading',
  './tracking',
  'bootstrapmodal'
], function($, vent, layout, controls, responsive, router) {
  'use strict';

  return {
    init: function(){
      responsive.init();
      layout.init();
      controls.init();
      router.init();
    }
  };

});
