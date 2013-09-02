define([
  'jquery',
  './vent',
  './router'
], function($, vent, router) {

  var $state = $('#state');

  function loadState(){
    var state = $state.val().toLowerCase();
    router.navigate(state, { trigger: true });
  }

  // update the control if the router changes the state
  vent.on('router:selected:state', function(state){
    $state.val(state);
  });


  return {
    init: function(){
      $('#state').on('change', loadState);
      $('#about-modal').modal();
    }
  };

});

