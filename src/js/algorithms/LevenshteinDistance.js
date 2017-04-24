"use strict";
// Global Application variable
var App = App || {};

(function(){

  /* Class private variable */
  let self = {
    insertion    : 1,
    deletion     : 1,
    substitution : 1
  };
  function levenshteinDistance (s, t) {
    if (s.length === 0) return t.length;
    if (t.length === 0) return s.length;

    let matrix = [], i, j;

    // increment along the first column of each row
    for (i = 0; i <= t.length; i++) {
      matrix[i] = [i];
    }

    // increment each column in the first row
    for (j = 0; j <= s.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= t.length; i++) {
      for (j = 1; j <= s.length; j++) {
        if (t.charAt(i-1) === s.charAt(j-1)) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(matrix[i-1][j-1] + self.substitution, // substitution
              Math.min(matrix[i][j-1] + self.insertion, // insertion
                  matrix[i-1][j] + self.deletion)); // deletion
        }
      }
    }
    return matrix[t.length][s.length];
  }
  
  /* Public API*/
  App.editDistance = function(s, t, w){
    /* Check to see if weighted */
    if(w){
      self.insertion = w.insertion;
      self.deletion = w.deletion;
      self.substitution = w.substitution;
    }
      /* Perform and return the distance measure */
      return levenshteinDistance(s,t);

  }
})();
