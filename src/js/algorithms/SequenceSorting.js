"use strict";

// global application variable
var App = App || {};

// Sequence Sorting "Class"
var SequenceSorting = function(family){

  /* Internal private variable*/
  let self = {};
  /* Promise */
  self.frequencies_computed = null;

  /* Get the fragment frequency */
  function get_most_frequent_fragment(column_index) {
    /* return the fragment that occurs the most often in the column */
    return self.frequencies[column_index];
  }

  /* Get the residue frequency from range */
  function get_most_frequent_fragment_from_range(column_index_start, column_index_end) {
    /* return the fragment that occurs the most often in the column */
    return self.frequencies.slice(column_index_start, column_index_end);
  }

  /* Accessor for the fragment frequency promise */
  function get_frequency_promise () { return self.frequencies_computed; }

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

  function sortByFrequencyWithProtein(protein){

  }

  return {
    calculateFrequency               : calculate_fragment_frequency,
    getMostFrequentFragment          : get_most_frequent_fragment,
    getMostFrequentFragmentFromRange : get_most_frequent_fragment_from_range,
    getPromise                       : get_frequency_promise
  }

};