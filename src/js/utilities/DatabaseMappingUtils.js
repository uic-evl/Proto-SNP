"use strict";

// global application variable
var App = App || {};

// Utilities class for mapping protein names
var DatabaseMappingUtils = function(){

  /* Global Class Variable*/
  var mappingUtils = {};

  /* A dictionary for all the mapped proteins that were previously queried */
  mappingUtils.mappedProteins = {};

  /* Map from uniprot 'mneumonic' to PDB code*/
  function map_mneumonic_to_PDB(mneumonic){

    return new Promise(function(resolve, reject) {
      /* Use d3 to query UniProt for the tab-separated name conversion*/
      d3.tsv("http://www.uniprot.org/uniprot/?query=mneumonic:" + mneumonic +
          "+AND+database:pdb&format=tab&compress=no&columns=id,database(PDB)", function(data) {

        /* Add the retrieved names to the dictionary */
        let mappedName = {
          "PDB" : data[0]["Cross-reference (PDB)"].split(";")[0],
          "Uniprot" : data[0]["Entry"]
        };
        mappingUtils.mappedProteins[mneumonic] = mappedName;

        /* Resolve the promise with the converted name*/
        resolve(mappedName.PDB)
      });
    });

  }

  return {
    mneumonicToPDB : map_mneumonic_to_PDB
  };

};