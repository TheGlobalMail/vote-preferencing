define([
  'jquery',
  'lodash',
  './preferences-data',
  './vent',
  'backbone'
], function($, _, preferences, vent, Backbone) {

  var failed = false;

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
      var router = this;
      return preferences.loadState(state).fail(function(){
        // Retry loading default once in case it was loaded with shit url
        if (!failed){
          failed = true;
          router.navigate('', { trigger: true });
        }
      });
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

  vent.on('reset', function(){
    router.navigate(preferences.selectedState, { trigger: true });
  });


  return router;

});
