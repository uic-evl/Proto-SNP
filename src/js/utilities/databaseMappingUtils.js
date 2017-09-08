"use strict";

// global application variable
var App = App || {};

// Utilities class for mapping protein names
const DatabaseMappingUtils = function(){

  /* Global Class Variable*/
  let mappingUtils = {};

  /* A dictionary for all the mapped proteins that were previously queried */
  mappingUtils.mappedProteins = {};

  /* Map from uniprot 'mneumonic' to PDB code*/
  function map_mneumonic_to_PDB(mneumonic){
    return new Promise(function(resolve, reject) {
      /* Use d3 to query UniProt for the tab-separated name conversion*/
      d3.tsv("http://www.uniprot.org/uniprot/?query=" + mneumonic +
          "&format=tab&compress=no&columns=entry name,database(PDB)", function(data) {

        /* No model exists */
        if(!data[0]){
          /* reject and exit  */
          reject(null);
          return;
        }

        let parsedData = [];

        /* Add the retrieved names to the dictionary */
        data.forEach(function(d){
          parsedData.push( {
            "PDB" : _.dropRight(d["Cross-reference (PDB)"].split(";")),
            "mnemonic" : d["Entry name"]
          });
        });

        // mappingUtils.mappedProteins[mneumonic] = mappedName;

        /* Resolve the promise with the converted name*/
        resolve(parsedData)
      });
    });
  }

  return {
    mneumonicToPDB : map_mneumonic_to_PDB
  };

};