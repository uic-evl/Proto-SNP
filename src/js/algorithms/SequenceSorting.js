"use strict";

// global application variable
var App = App || {};

// Sequence Sorting "Class"
var SequenceSorting = function(family){

  /* Internal private variable*/
  let self = {};
  /* Promise */
  self.frequencies_computed = null;

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
        let column_residues = _.map(family, function(o) { return _.nth(o.sequence, i); });

        /* Get the residue counts for each column*/
        self.frequencies[i] = _.countBy(column_residues);
      }
      /* resolve the promise with the column frequencies*/
      resolve(self.frequencies)
    });
  }

  function sortByFrequencyWith(protein){

  }

  return {
    calculateFrequency : calculate_fragment_frequency
  }

};