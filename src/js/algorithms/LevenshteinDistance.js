"use strict";
// Global Application variable
var App = App || {};

(function(){
  /* Class private variable */
  let options = {
    insertion    : 1,
    deletion     : 1,
    substitution : 1
  };

  /* Public API*/
  App.editDistance = function(s, t, w){
    /* Check to see if weighted */
    if(w){
      options.insertion = w.insertion;
      options.deletion = w.deletion;
      options.substitution = w.substitution;
    }
      /* Perform and return the distance measure */
      return Levenshtein.get(s,t, options);
  }
})();