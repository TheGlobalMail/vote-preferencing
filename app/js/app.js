define([
  'jquery',
  './force-layout',
  './controls',
  './responsive',
  './router',
  './loading',
  './tracking',
  'bootstrapmodal'
], function($, layout, controls, responsive, router) {
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
