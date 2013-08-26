require.config({
  paths: {
    jquery: '../components/jquery/jquery',
    backbone: '../components/backbone/backbone',
    lodash: '../components/lodash/lodash',
    d3: '../components/d3/d3',
    bootstrapmodal: '../components/bootstrap/js/bootstrap-modal'
  },
  shim: {
    d3: {
      exports: 'd3'
    },
    backbone: {
      exports: 'Backbone'
    }
  }
});

require([
  'jquery',
  './app'
],
function($, app) {
  $(app.init);
});
