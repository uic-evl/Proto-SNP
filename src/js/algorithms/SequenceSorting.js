"use strict";

// global application variable
var App = App || {};

// Sequence Sorting "Class"
const SequenceSorting = function(family){

  /* Internal private variable*/
  let self = {};

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


  /* Calculates the frequency of each column's residues */
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
    /* Store the promise for later use*/
    self.frequency_scores_computed = new Promise(function(resolve, reject) {
      /* After each columns frequencies have been */
      get_frequency_promise().then(function(frequencies){
        /* Get the length of the longest sequence*/
        let max_len = _.maxBy(family, 'length').length,
            column_max_frequencies = [],
            scores = [],
          /* Highest occurring residue column in the entire family  */
            max_frequency = _.chain(frequencies)
              .maxBy(function(o) { return Math.max(_.values(o)); } )
              .toPairs().head().value()[1];
        /* Get the highest residue(s) from each column */
        for(let i = 0; i < max_len; i++) {
          column_max_frequencies.push(get_most_frequent_fragment_at(i));
        }
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
        /* Store the protein scores */
        self.fragment_frequency_scores = scores;
        /* Resolve the promise */
        resolve(scores);
      });
    });
    // return the promise
    return self.frequency_scores_computed;
  }


  /* Calculates each protein's score based on the edit distance with the protein in question */
  function calculate_edit_distance_scores(protein_a, weights) {
    /* Store the promise for later use*/
    self.edit_distance_scores_computed = new Promise(function(resolve, reject) {
      /* Extract the sequence as a string */
      let s = protein_a.sequence.join(''),
          scores = [];
      /* Iterate over the family and perform the edit distance with the protein in question*/
      family.forEach(function(protein_b){
        /* If we're comparing the same protein, it receives max score */
        if(_.eq(protein_a, protein_b)) {
          scores.push({name: protein_a.name, score : Infinity})
        }
        else{
          /* Extract the sequence as a string */
          let t = protein_b.sequence.join('');
          /* Compute the edit distance */
          let distance = App.editDistance(s,t,weights);
          scores.push({ name: protein_b.name, score : distance });
        }
      });
      /* Store the protein scores */
      if(weights){
        self.weighted_edit_distance_scores = scores;
      }
      else {
        self.edit_distance_scores = scores;
      }
      /* Resolve the promise */
      resolve(scores);
    });
    // return the promise
    return self.edit_distance_scores_computed
  }


  /* Calculates each protein's score based on the edit distance with the protein in question */
  function calculate_residue_commonality(protein_a, normalized){
    /* Store the promise for later use*/
    self.residue_commonality_computed = new Promise(function(resolve, reject) {
      /* Iterate over the family and perform the pairwise comparison*/
      let scores = [];
      family.forEach(function (protein_b) {
        /* If we're comparing the same protein, it receives max score */
        if (_.eq(protein_a, protein_b)) {
          scores.push({name: protein_a.name, score: Infinity})
        }
        /* Else, iterate over the sequences count the positional residue matches*/
        else {
          let sequenceCount = 0;
          for(let i=0; i < protein_a.sequence.length; i++){
            if(protein_a.sequence[i] === protein_b.sequence[i]){
              sequenceCount += 1;
            }
          }
          if(normalized){
            sequenceCount = sequenceCount / protein_b.sequence.length;
          }
          scores.push({name: protein_b.name, score: sequenceCount})
        }
      });
      /* Store the protein's scores */
      if(normalized){
        self.weighted_residue_commonality_scores = scores;
      }
      else {
        self.residue_commonality_scores = scores;
      }
      /* Resolve the promise */
      resolve(scores);
    });
    // return the promise
    return self.residue_commonality_computed;
  }


  /* Get the frequency of each column's residues */
  function get_fragment_frequency_scores() { return self.fragment_frequency_scores; }


  /* Get the frequency of each column's residues */
  function get_edit_distance_scores(w) { return (w) ? self.weighted_edit_distance_scores : self.edit_distance_scores; }


  /* Get the frequency of each column's residues */
  function get_common_occurance_scores(n) { return (n) ? self.weighted_residue_commonality_scores : self.residue_commonality_scores; }


  return {
    /* Setters */
    calculateFrequency               : calculate_fragment_frequency,
    calculateFrequencyScores         : calculate_fragment_frequency_scores,
    calculateEditDistanceScores      : calculate_edit_distance_scores,
    calculateCommonalityScores       : calculate_residue_commonality,
    /* Getters */
    getFragmentCountsAt              : get_fragment_counts_at,
    getMostFrequentAt                : get_most_frequent_fragment_at,
    getFragmentCountsFromRange       : get_fragment_counts_from_range,
    getFragmentFrequencyScores       : get_fragment_frequency_scores,
    getEditDistanceScores            : get_edit_distance_scores,
    getOccuranceScores               : get_common_occurance_scores,
    getFrequencyPromise              : get_frequency_promise
  }

};