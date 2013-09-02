define([
  'jquery',
  'lodash',
  './preferences-data',
  './vent',
  'backbone'
], function($, _, preferences, vent, Backbone) {

  var Router = Backbone.Router.extend({

    routes: {
      '': 'loadDefault',
      ':state': 'loadState',
      ':state/:party': 'loadParty'
    },

    loadDefault: function(){
      this.loadState('nsw');
    },

    loadState: function(state) {
      vent.trigger('router:selected:state', state);
      return preferences.loadState(state);
    },

    loadParty: function(state, cleanParty) {
      this.loadState(state).then(function(){
        // hack to simulate click once loaded
        var node = $('g.node[data-cleaned=' + cleanParty + ']');
        if (node && node[0] && node[0].__onclick){
          node[0].__onclick();
        }
      });
    },

    init: function(){
      Backbone.history.start({pushState: true});
    }
  });

  var router = new Router();

  vent.on('selected:party', function(cleanParty){
    router.navigate(preferences.selectedState + '/' + cleanParty, { trigger: false });
  });

  return router;

});
