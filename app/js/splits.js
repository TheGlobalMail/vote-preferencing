define([
  'lodash'
], function(_){

  var csv = [{"party": "Stable Population Party", "state": "act", "split": "3"}, {"party": "Socialist Equality Party", "state": "nsw", "split": "3"}, {"party": "Australian Democrats", "state": "nsw", "split": "2"}, {"party": "Stable Population Party", "state": "nsw", "split": "3"}, {"party": "One Nation", "state": "nsw", "split": "2"}, {"party": "Help End Marijuana Prohibition", "state": "nsw", "split": "3"}, {"party": "Stable Population Party", "state": "nt", "split": "3"}, {"party": "Citizens Electoral Council", "state": "nt", "split": "2"}, {"party": "Australian Motoring Enthusiast Party", "state": "qld", "split": "2"}, {"party": "One Nation", "state": "qld", "split": "2"}, {"party": "Socialist Equality Party", "state": "qld", "split": "3"}, {"party": "Stable Population Party", "state": "qld", "split": "3"}, {"party": "Australian Democrats", "state": "qld", "split": "2"}, {"party": "Socialist Equality Party", "state": "sa", "split": "3"}, {"party": "Australian Motoring Enthusiast Party", "state": "sa", "split": "2"}, {"party": "Nick Xenophon Group", "state": "sa", "split": "2"}, {"party": "Stable Population Party", "state": "sa", "split": "3"}, {"party": "Stable Population Party", "state": "tas", "split": "3"}, {"party": "Australian Democrats", "state": "vic", "split": "2"}, {"party": "Drug Law Reform", "state": "vic", "split": "2"}, {"party": "Citizens Electoral Council", "state": "vic", "split": "2"}, {"party": "Socialist Equality Party", "state": "vic", "split": "3"}, {"party": "Coalition (Lib/Nat)", "state": "vic", "split": "2"}, {"party": "Help End Marijuana Prohibition", "state": "vic", "split": "3"}, {"party": "Stable Population Party", "state": "vic", "split": "3"}, {"party": "Australian Motoring Enthusiast Party", "state": "vic", "split": "2"}, {"party": "Socialist Equality Party", "state": "wa", "split": "3"}, {"party": "Stable Population Party", "state": "wa", "split": "3"}, {"party": "Australian Democrats", "state": "wa", "split": "2"}, {"party": "Australian Motoring Enthusiast Party", "state": "wa", "split": "2"}];

  var data = {};

  function key(state, party){
    return state + '-' + party;
  }
  
  _.each(csv, function(row){
    data[key(row['state'], row['party'])] = row['split'];
  });

  return {
    hasSplit: function(state, party){
      return data[key(state, party)];
    }
  };
  
});
