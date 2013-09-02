define([
  './vent'
], function(vent) {

  vent.on('selected:state', function(state){
    window._gaq && _gaq.push(['_trackEvent', 'State Selected', 'State', state]);
  });

  vent.on('selected:party', function(party){
    window._gaq && _gaq.push(['_trackEvent', 'Party Selected', 'Party', party]);
  });

});
