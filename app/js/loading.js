define([
  'jquery',
  './vent'
], function($, vent){

  var $loading = $('#loading');

  vent.on('selected:state', function(){
    $loading.show();
  });

  vent.on('loaded:state', function(){
    $loading.hide();
  });
});
