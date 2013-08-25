define([
  'jquery',
  'lodash',
  './vent'
], function($, _, vent) {

  return {

    // The current state the preferences are loaded for
    selectedState: null,

    // The index of the current selected party
    selectedParty: null,

    // Party data for the current state
    parties: [],

    // Preferences for the current state
    preferences: [],

    // Maps party name back to index in parties array
    partyIndex: [],

    // Cached list of party names
    names: [],

    // Load preference data for the give state. Returns a promise
    loadState: function(state){
      this.selectedState = state;
      vent.trigger('selected:state', this.selectedState);
      // TODO: add caching of state data or be lazy and rely http caching??
      return $.getJSON('/data/' + state + '.json', _.bind(this.loadFromJSON, this));
    },

    // Extract party and preference data from json
    loadFromJSON: function(json){
      var preferences = this;

      // Extract parties
      preferences.parties = [];
      preferences.partyIndex = {};
      _.each(json, function(row, index){
        preferences.parties.push({ name: row.Party });
        preferences.partyIndex[row.Party] = index;
      });
      preferences.names = _.pluck(preferences.parties, 'name');

      // Extract preferences
      preferences.preferences = [];
      _.each(preferences.names, function(name, index){
        var preferenceData = json[index];
        delete preferenceData.Party;
        delete preferenceData[name];
        _.each(preferenceData, function(score, target){
          var scoreF = parseFloat(score);
          preferences.preferences.push({
            source: index,
            target: preferences.partyIndex[target],
            value: scoreF,
            individualValue: scoreF
          });
        });
      });

      // Calculate mutual preference.. TODO could be so much more efficient
      _.each(preferences.preferences, function(preference){
        var coPref = _.detect(preferences.preferences, function(p){
          return p.target === preference.source &&
            p.source === preference.target;
        });
        preference.mutualValue = (preference.individualValue + coPref.individualValue) / 2;
      });
    }
  };
});
