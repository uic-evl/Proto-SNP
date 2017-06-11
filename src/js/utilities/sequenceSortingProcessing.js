/* A simple web-working wrapper to execute processing */

importScripts("../../../lib/js/lodash.min.js", "../../../lib/js/levenshtein.js",
              "../algorithms/LevenshteinDistance.js",  "../algorithms/SequenceSorting.js");

onmessage = function(options) {

  let algorithm = options.data.algorithm,
      family = options.data.family,
      protein = options.data.protein,
      sequenceSorting = new SequenceSorting(family);

  switch(algorithm){
    case "editDistance":
      /* Calculate the edit distance scores with the first protein and enable the menu option */
      sequenceSorting.calculateEditDistanceScores(protein)
          .then(function(scores){
            postMessage({algorithm:"edit_distance", score:scores})
          });
      break;
    case "weightedEditDistance":
      /* Calculate the weighted edit distance scores with the first protein and enable the menu option */
      sequenceSorting.calculateEditDistanceScores(protein,
          {insertion: 3, deletion: 3, substitution: 5})
          .then(function(scores){
            postMessage({algorithm:"weighted_edit_distance", score: scores})
          });
      break;
    case "commonality":
      /* Calculate the residue commonality scores with the first protein and enable the menu option */
      sequenceSorting.calculateCommonalityScores(protein)
          .then(function(scores){
            postMessage({algorithm:"commonality_scores", score: scores})
          });
      break;
    case "normalizedCommonality":
      /* Calculate the weighted residue commonality scores with the first protein and enable the menu option */
      sequenceSorting.calculateCommonalityScores(protein, 1)
          .then(function(scores){
            postMessage({algorithm:"normalized_commonality_scores", score: scores})
          });
      break;
  }
};