"use strict";

// global application variable
var App = App || {};

// Utilities class generic operations and conversions
const FileUtilities = function(){

  /* Parse the MSF File */
  function parse_MSF(file_data) {
    /* Parse the lines of the file */
    let lines = file_data.split('\n');

    /* Iterate over each line*/
    lines.forEach(function(line, idx){
      // If an empty line, continue
      if(!line.length) return;
      /* Create a regex pattern to check for the header lines */
      //Name:\s*(\w+)\|?(\w?)\/(\d+)-(\d+)\s*Len:\s*(\d+)\s*Check:\s*(\d+)\s*Weight:\s*(\d*\.?\d*)/
      let regex_dict = /Name:\s*(\w+)\/(\d+)-(\d+)\s*Len:\s*(\d+)\s*Check:\s*(\d+)\s*Weight:\s*(\d*\.?\d*)/,
        regex_data = /(\w+)\/(\d*)-(\d*)\s*([~.\w\s]*)/,

        /* Perform the regex matching on the line */
        parsedLine =line.match(regex_dict);

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
          scores                 : {initial: lines.length - idx}
        };
      }
      /* If not in the dictionary pattern, check the for the data pattern */
      else if(regex_data.test(line)){
        /* Get the data */
        parsedLine = line.match(regex_data);
        /* Append the sequence to the dictionary entry*/
        self.family[parsedLine[1]].sequence += _.toUpper(parsedLine[4].split(' ').join(''));
      }
    });
    /* Convert the family object to an array */
    self.family = _.values(self.family);
    self.family.forEach((protein) => { protein.sequence = protein.sequence.split(''); });
  }


  /* Parse a FASTA File */
  function parse_FASTA(file_data) {
    /* Parse the lines of the file */
    let lines = file_data.split('>');

    /* Iterate over each line*/
    lines.forEach(function(line, idx){
      // If an empty line, continue
      if(!line.length) return;
      /* Create a regex pattern to check for the header lines */
      let regex_data = /((\w*)\/?\d*-?\d*)\s*(\S*)/ ,
        /* Perform the regex matching on the line */
        parsedLine = line.match(regex_data);

      /* If parsed, create the dictionary for the entry  */
      if(parsedLine){
        /* Create the dictionary entry */
        self.family[parsedLine[1]] = {
          name                   : parsedLine[2],
          full_name              : parsedLine[1],
          length                 : parsedLine[3].length,
          sequence               : _.toUpper(parsedLine[3]),
          scores                 : {initial: lines.length - idx}
        };
      }
    });
    /* Convert the family object to an array */
    self.family = _.values(self.family);
    self.family.forEach((protein) => { protein.sequence = protein.sequence.split(''); });
  }


  /* Entry into selecting which family file has been uploaded*/
  function parse(file_data, type){
    switch(type){
      case "fasta":
        return parse_FASTA(file_data);
      case "msf":
        return parse_MSF(file_data);
    }

  }


  function file_upload_setup(viewer, cb){
    /* Setup the file-upload callback */
    $(viewer).fileupload({
      url: "",
      dataType: 'json',
      autoUpload: false
    })
    /* Handle the upload callbacks */
        .on('fileuploadadd', function (e, data) {
          // The select button
          let select = $(this).prop('disabled', true);
          // uploaded file
          let file = data.files[0];

          /*Upload Button - loads the file into the viewer*/
          let uploadButton = $('<button/>')
              .addClass('btn btn-primary uploadPDB')
              .text('Upload')
              .on('click', function () {

                // JS File reader to parse the uploaded file
                let reader = new FileReader(),
                    /* Save the file name in the closure scope */
                    fileName = file.name.split('.')[0];

                /* Event to fire once the file loads*/
                reader.addEventListener("load", function () {
                  /* Pass the file to be processed by the model */
                  cb({protein_name: fileName}, this.result);
                }, false);

                // parse the file as text
                reader.readAsText(file);

                // Remove the div and buttons
                $(this).parent().remove();
                // abort the upload (we aren't passing it to a server)
                data.abort();

                // re-enable the select protein button
                select.prop('disabled', false);
              });

          /* Cancel button -- removes the chosen file and removes the div items*/
          let cancelButton = $('<button/>')
              .addClass('btn btn-primary uploadPDB')
              .text('Cancel')
              .on('click', function () {
                let $this = $(this),
                    data = $this.data();
                $this.parent().remove();
                data.abort();
                select.prop('disabled', false);
              });

          /* Create a div and attach it beneath the Choose File button */
          data.context = $('<div/>').appendTo('#files');
          let node = $('<p/>')
              .append($('<span/>').text(file.name));

          /* Append the Upload and Cancel Buttons */
          node.appendTo(data.context)
              .append(uploadButton.clone(true).data(data))
              .append(cancelButton.clone(true).data(data));
        })
        .prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');
  }

  return {
   parseFile   : parse,
   uploadSetup : file_upload_setup
  }

};

App.fileUtilities = new FileUtilities();