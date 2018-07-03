"use strict";

// global application variable
var App = App || {};

// Utilities class generic operations and conversions
const FileUtilities = function(){

  function loadIfExists(url, cb) {
    $.ajax({
      type:"HEAD", //Not get
      url: url
    })
      .done(function() {
        cb(url)
    })
  }

  function split_sequence(family){
    /* Convert the family object to an array */
    family = _.values(family);
    family.forEach((protein) => { protein.sequence = protein.sequence.split(''); });
    return family;
  }

  /* Parse the MSF File */
  function parse_MSF(file_data) {
    /* Parse the lines of the file */
    let lines = file_data.split('\n'),
        family = {},
        max_length = 0,
        length_changed = false;

    /* Iterate over each line*/
    lines.forEach(function(line, idx){
      // If an empty line, continue
      if(!line.length) return;
      /* Create a regex pattern to check for the header lines */
      //Name:\s*(\w+)\|?(\w?)\/(\d+)-(\d+)\s*Len:\s*(\d+)\s*Check:\s*(\d+)\s*Weight:\s*(\d*\.?\d*)/
      let regex_dict = /Name:\s*(\w+\|?\w*?)\/(\d+)-(\d+)\s*Len:\s*(\d+)\s*Check:\s*(\d+)\s*Weight:\s*(\d*\.?\d*)/,
          regex_data = /(\w+\|?\w*?)\/(\d*)-(\d*)\s*([~.\w\s]*)/,
        /* Perform the regex matching on the line */
        parsedLine = line.match(regex_dict);

      /* If parsed, create the dictionary for the entry  */
      if(parsedLine){
        /* Create the dictionary entry */
        family[parsedLine[1]] = {
          name                   : parsedLine[1],
          firstResiduePosition   : parseInt(parsedLine[2]),
          lastResiduePosition    : parseInt(parsedLine[3]),
          length                 : parseInt(parsedLine[4]),
          check                  : parseInt(parsedLine[5]),
          weight                 : parseInt(parsedLine[6]),
          sequence               : "",
          scores                 : {initial: lines.length - idx}
        };
        /* Check the max length against the previous max*/
        if(max_length === 0) max_length = family[parsedLine[1]].length;
        else if(family[parsedLine[1]].length > max_length || family[parsedLine[1]].length < max_length) {
          length_changed = true;
          max_length = Math.max(max_length, family[parsedLine[1]].length);
        }
      }
      /* If not in the dictionary pattern, check the for the data pattern */
      else if(regex_data.test(line)){
        /* Get the data */
        parsedLine = line.match(regex_data);
        /* Append the sequence to the dictionary entry*/
        family[parsedLine[1]].sequence += _.toUpper(parsedLine[4].split(' ').join(''));
      }
    });
    /* The max length changed. Pad the protein sequences to the longest length*/
    if(length_changed) {
        Object.keys(family).forEach(function(key){
          family[key].sequence = _.padEnd(family[key].sequence, max_length, '.');
          family[key].length = max_length;
        })
    }
    return split_sequence(family);
  }

  /* Parse a FASTA File */
  function parse_FASTA(file_data) {
    /* Parse the lines of the file */
    let family = {},
        max_length = 0,
        length_changed = false;

    let fasta = require("biojs-io-fasta"),
        sequences = fasta.parse(file_data);

    sequences.forEach(function(seq){
      family[seq.id] = {
        name: seq.name,
        id: seq.id,
        length: seq.seq.length,
        sequence: _.toUpper(seq.seq),
        scores: {initial: sequences.length - seq.id}
      };

      /* Check the max length against the previous max*/
      if(max_length === 0) max_length = family[seq.id].length;
      else if(family[seq.id].length > max_length || family[seq.id].length < max_length) {
        length_changed = true;
        max_length = Math.max(max_length, family[seq.id].length);
      }

      /* The max length changed. Pad the protein sequences to the longest length*/
      if(length_changed) {
        Object.keys(family).forEach(function(key){
          family[key].sequence = _.padEnd(family[key].sequence, max_length, '.');
          family[key].length = max_length;
        })
      }

    });

    return split_sequence(family);
  }

  /* Entry into selecting which family file has been uploaded*/
  function parse(file_data, type){
    switch(type){
      case "fa":
        return parse_FASTA(file_data);
      case "msf":
        return parse_MSF(file_data);
    }
  }

  function initial_file_upload_setup(viewer, cb){
    let files = viewer.find("#files");

    /* Setup the file-upload callback */
    return $(viewer).find("#fileUploadInput").fileupload({
      url: "",
      dataType: 'json',
      autoUpload: false
    })
    /* Handle the upload callbacks */
      .on('fileuploadadd', function (e, data) {
        // The select button
        let select = $(this).prop('disabled', true);
        // uploaded file
        let file = data.files.pop();
        /* Create a div and attach it beneath the Choose File button */
        data.context = $('<div/>').appendTo(files);
        let node = $('<p/>')
          .append($('<span/>').text(file.name));

          viewer.find("#next").prop("disabled", false);

          /*Upload Button - loads the file into the viewer*/
        viewer.find("#next")
          .on('click', function () {
            // JS File reader to parse the uploaded file
            let reader = new FileReader(),
              /* Save the file name in the closure scope */
              fileName = file.name.split('.')[0],
              extension = file.name.split('.').pop().toLowerCase();

            /* Event to fire once the file loads*/
            reader.addEventListener("load", function () {
              /* Pass the file to be processed by the model */
              cb({protein_name: fileName, extension: extension, name: fileName}, this.result);
            }, false);

            // parse the file as text
            reader.readAsText(file);

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

            viewer.find("#next").prop("disabled", true);

            /* Clear the previous data and reinitialize the menu */
            viewer.find("#fileUploadInput").fileupload('destroy');
            viewer.find("#fileUploadInput").unbind( "fileuploadadd" );
            viewer.find("#next").unbind( "click" );
            initial_file_upload_setup(viewer, cb);

            $this.parent().remove();
            data.abort();
            select.prop('disabled', false);
          });

        /* Append the Upload and Cancel Buttons */
        node.appendTo(data.context)
          //.append(uploadButton.clone(true).data(data))
          .append(cancelButton.clone(true).data(data));
      })
      .prop('disabled', !$.support.fileInput)
      .parent().addClass($.support.fileInput ? undefined : 'disabled')
      .promise();
  }

  function file_upload_setup(viewer, files, cb){
    /* Setup the file-upload callback */
    return $(viewer).fileupload({
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
          /* Create a div and attach it beneath the Choose File button */
          data.context = $('<div/>').appendTo(files);
          let node = $('<p/>')
              .append($('<span/>').text(file.name));

            viewer.find("#next").prop("disabled", false);

            /* Hide the 'Choose file' button */
          let splash = $(this).parent();
          splash.hide();

          /*Upload Button - loads the file into the viewer*/
          let uploadButton = $('<button/>')
              .addClass('btn btn-primary uploadPDB')
              .text('Upload')
              .on('click', function () {
                // JS File reader to parse the uploaded file
                let reader = new FileReader(),
                    /* Save the file name in the closure scope */
                    fileName = file.name.split('.')[0],
                    extension = file.name.split('.').pop().toLowerCase();

                /* Event to fire once the file loads*/
                reader.addEventListener("load", function () {
                  /* Pass the file to be processed by the model */
                  cb({protein_name: fileName, extension: extension}, this.result);
                }, false);

                // parse the file as text
                reader.readAsText(file);

                // Remove the div and buttons
                $(this).parent().remove();
                // abort the upload (we aren't passing it to a server)
                data.abort();

                // re-enable the select protein button
                select.prop('disabled', false);
                /* reshow the 'choose a file' */
                splash.show();
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
                viewer.find("#next").prop("disabled", true);

                  /* reshow the 'choose a file' */
                splash.show()
              });

          /* Append the Upload and Cancel Buttons */
          node.appendTo(data.context)
              .append(uploadButton.clone(true).data(data))
              .append(cancelButton.clone(true).data(data));
        })
        .prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled')
      .promise();
  }

  // initialize the family file uploader
  function family_upload_setup(viewer, cb) {
    /* Setup the fileupload callback */
    return $(viewer).fileupload({
        url: "",
        dataType: 'json',
        autoUpload: false
      })
      /* Handle the upload callbacks */
          .on('fileuploadadd', function (e, data) {
            // uploaded file
            let file = data.files[0],
                name_parts = file.name.split('.'),
                extension = name_parts.pop().toLowerCase(),
                name = name_parts.pop().toLowerCase();
            // JS File reader to parse the uploaded file
            let reader = new FileReader();
            /* Callback to loading the file */
            reader.addEventListener("load", function () {
              /* Pass the file to be processed by the model */
              cb(this.result, extension, name);
            }, false);
            // parse the file as text
            reader.readAsText(file);
            // abort the upload (we aren't passing it to a server)
            data.abort();
          })
          .prop('disabled', !$.support.fileInput)
          .parent().addClass($.support.fileInput ? undefined : 'disabled')
        .promise();
  }

  /* Load the protein from RCMB through ajax*/
  function load_PDB_From_RCMB_ajax(proteinName,cb) {

    let get_protein = function(url) {
      let xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function(){
        if (xhr.readyState === 4 && xhr.status === 200){
          cb(this.response);
        }
      };
      xhr.responseType = 'blob';

      xhr.open('GET', 'https://files.rcsb.org/download/' + proteinName + '.pdb');
      xhr.send();
    };

    loadIfExists('https://files.rcsb.org/download/' + proteinName + '.pdb', get_protein)
  }

  /* Load the protein from RCMB through pv.io*/
  function load_PDB_From_RCMB(proteinName, pointer){
    /* perform an async download from RCMB to fetch the requested PDB File */
    return new Promise(function(resolve, reject){
      pv.io.fetchPdb('https://files.rcsb.org/download/' + proteinName + '.pdb', function(structure) {
        /*Save the protein structure*/
        pointer.structure = structure;
        /* Resolve the promise */
        resolve(pointer.structure);
      });
    });
  }

  /* Load the protein from the uploaded file */
  function load_from_uploaded_PDB(file, pointer){
    /* perform an async loading of the uploaded file */
    return new Promise(function(resolve, reject){
      /*Save the protein structure*/
      pointer.structure = pv.io.pdb(file, {loadAllModels:true})[0];
      /* Resolve the promise */
      resolve(pointer.structure);
    });
  }

  return {
   parseAlignmentFile   : parse,
   uploadPDB            : load_from_uploaded_PDB,
   ajaxFromRCMB         : load_PDB_From_RCMB_ajax,
   downloadFromRCMB     : load_PDB_From_RCMB,
   uploadSetup          : file_upload_setup,
   familyUploadSetup    : family_upload_setup,
   initialUploadSetup   : initial_file_upload_setup
  }
};

App.fileUtilities = new FileUtilities();