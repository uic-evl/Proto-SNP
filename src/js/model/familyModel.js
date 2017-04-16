"use strict";

// Global Application variable
var App = App || {};

function ProteinFamily(file) {

  // self reference
  let self = {};

  // Store the members of the family
  self.family = {};

  /* Parse the MSF File*/
  function parseMSF(file) {

    /* Parse the lines of the file */
    let lines = file.split('\n');

    /* Iterate over each line*/
    lines.forEach(function(line){

      // If an empty line, continue
      if(!line.length) return;

      /* Create a regex pattern to check for the header lines */
      //Name:\s*(\w+)\|?(\w?)\/(\d+)-(\d+)\s*Len:\s*(\d+)\s*Check:\s*(\d+)\s*Weight:\s*(\d*\.?\d*)/
      let regex_dict = /Name:\s*(\w+)\/(\d+)-(\d+)\s*Len:\s*(\d+)\s*Check:\s*(\d+)\s*Weight:\s*(\d*\.?\d*)/,
          regex_data = /(\w+)\/(\d*)-(\d*)\s*([~.\w\s]*)/;

      /* perform the regex matching on the line */
      let parsedLine =line.match(regex_dict);

      /* If parsed, create the dictionary for the entry  */
      if(parsedLine){

        /* Create the dictionary entry */
        self.family[parsedLine[1]] = {
          name                   : parsedLine[1],
          firstResiduePosition   : parseInt(parsedLine[2]),
          lastResiduePosition    : parseInt(parsedLine[3]),
          length                 : parseInt(parsedLine[4]),
          check                  : parseInt(parsedLine[5]),
          weight                 : parseInt(parsedLine[6]),
          sequence               : "",
          scores                 : []
        };
      }
      /* If not in the dictionary pattern, check the for the data pattern */
      else if(regex_data.test(line)){
        /* Get the data */
        parsedLine = line.match(regex_data);

        /* Append the sequence to the dictionary entry*/
        self.family[parsedLine[1]].sequence += parsedLine[4].split(' ').join('');
      }
    });

    /* Convert the family object to an array */
    self.family = _.values(self.family);
    self.family.forEach(function(protein) {
      protein.sequence = protein.sequence.split('');
    })
  }

  /*Accessor to return the family */
  function getFamily() { return self.family }

  /* Parse the family file */
  parseMSF(file);

  /* Return the publicly accessible functions*/
  return {
    getFamily: getFamily
  };

}