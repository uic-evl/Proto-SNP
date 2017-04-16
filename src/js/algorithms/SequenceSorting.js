"use strict";

// global application variable
var App = App || {};

// Sequence Sorting "Class"
const SequenceSorting = function(family){

  /* Internal private variable*/
  let self = {};
  /* Promise */
  self.frequencies_computed = null;

  /* Get the fragment frequency */
  function get_fragment_counts_at(column_index) {
    /* return the fragment that occurs the most often in the column */
    return self.frequencies[column_index];
  }

  function get_most_frequent_fragment_at(column_index) {
    /* Get the max of the current column position*/
    let column_residue_counts = _.toPairs(get_fragment_counts_at(column_index)),
    /* The the residue (s) that occur the most frequently */
        localMax = _.maxBy( column_residue_counts, (o)=> { return o[1]; }),
        dupes = _.filter(column_residue_counts, (pair) => { return pair[1] === localMax[1]} );
    /* Reset localMax to an object*/
    return _.fromPairs(dupes);
  }

  /* Get the residue frequency from range */
  function get_fragment_counts_from_range(column_index_start, column_index_end) {
    /* return the fragment that occurs the most often in the column */
    return self.frequencies.slice(column_index_start, column_index_end);
  }

  /* Accessor for the fragment frequency promise */
  function get_frequency_promise () { return self.frequencies_computed; }

  /* Accessor for the fragment frequency promise */
  function get_frequency_score_promise () { return self.frequency_scores_computed; }

  /* Calculates the frequency of each column's residues*/
  function calculate_fragment_frequency(){

    /* Get the length of the longest sequence*/
    let max_len = _.maxBy(family, 'length').length;

    /* Initialize the frequency collection*/
    self.frequencies = [];

    /* Store the promise for later use */
    self.frequencies_computed = new Promise(function(resolve, reject){
      /* Iterate over each column to determine the frequencies of residues*/
      for(let i = 0; i < max_len; i++){
        /* Get the residues of the ith column */
        let column_residues = _.map(family, function(member) { return _.nth(member.sequence, i); });

        /* Get the residue counts for each column*/
        self.frequencies[i] = _.countBy(column_residues);
      }

      /* resolve the promise with the column frequencies*/
      resolve(self.frequencies)
    });

    // return the promise
    return self.frequencies_computed;
  }

  /* Calculates each protein's score based on per-fragment comparison's with the max */
  function calculate_fragment_frequency_scores() {

    /* After each columns frequencies have been */
    get_frequency_promise().then(function(frequencies){

      /* Get the length of the longest sequence*/
      let max_len = _.maxBy(family, 'length').length;

      /* Store the promise for later use*/
      self.frequency_scores_computed = new Promise(function(resolve, reject) {

        /* Highest occurring residue column in the entire family  */
        let max_frequency = _.chain(frequencies)
            .maxBy(function(o) { return Math.max(_.values(o)); } )
            .toPairs().head().value()[1];

        /* Get the highest residue(s) from each column */
        let column_max_frequencies = [];
        for(let i = 0; i < max_len; i++) {
          column_max_frequencies.push(get_most_frequent_fragment_at(i));
        }

        let scores = [];
        /* Iterate over each protein in the family */
        family.forEach(function(protein){

          /* Iterate over each residue of the sequence, and increase the score depending on
             if the residue matches the most frequently occurring residue */
          let frequency_score = 0.0;
          protein.sequence.forEach(function(residue, i){
            if(_.has(column_max_frequencies[i], residue)){
              frequency_score += parseFloat(column_max_frequencies[i][residue] / max_frequency);
            }
          });
          /* Add the final score to the list of scores */
          scores.push({ name: protein.name, score : frequency_score });
        });

        /* Resolve the promise */
        resolve(scores);
      });
    });

  }

  function sortByFrequencyWithProtein(protein){

  }

  return {
    calculateFrequency               : calculate_fragment_frequency,
    calculateFrequencyScores         : calculate_fragment_frequency_scores,
    getFragmentCountsAt              : get_fragment_counts_at,
    getFragmentCountsFromRange       : get_fragment_counts_from_range,
    getPromise                       : get_frequency_promise
  }

};