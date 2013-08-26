define([
  'jquery',
  './preferences-data',
  './force-layout'
], function($, preferences, layout) {

  return {
    init: function(){
      // Reset the party
      $('#state').on('change', function(){
        preferences.selectedParty = null;
        layout.start();
      });
    }
  };

});

