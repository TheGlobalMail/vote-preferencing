define([
  'jquery',
  './preferences-data',
  './force-layout'
], function($, preferences, layout) {

  function loadState(){
    preferences.selectedParty = null;
    var state = $('#state').val().toLowerCase();
    var $loading = $('#loading');
    $loading.show();
    preferences.loadState(state)
      .always(function(){
        $loading.hide();
        layout.changeState();
      });
  }

  return {
    init: function(){
      $('#state').on('change', loadState);
      loadState();
    }
  };

});

