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

    // http://www.uniprot.org/uniprot/?query=mneumonic:SHRM_DROME+AND+database:pdb&format=tab&compress=no&columns=id,database(PDB)

  }

  return {
    mneumonicToPDB : map_mneumonic_to_PDB
  };

};