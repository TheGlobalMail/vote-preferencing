define([
  'jquery',
  './force-layout',
  './controls',
  './responsive'
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
