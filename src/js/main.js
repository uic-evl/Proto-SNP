"use strict";

// Global Application variable
var App = App || {};

(function(){

    /* Until PDB converts to https, we must make sure our site is launched with http */
    let loc = window.location.href;
    if(loc.split(':')[0] === "https"){
        window.location.href = "http" + loc.slice(4);
    }


    /* File utility setup */
    App.fileUtilities = new FileUtilities();
    App.dataUtilities = new DatabaseMappingUtils();
    App.residueMappingUtility = new ResidueMappingUtility();

    /* List of views */
    let views = [], warning_fired = false;

    function checkResolution(cb) {
        let w = window.innerWidth,
            h = window.innerHeight;

        /* check the resolution of the resize*/
        if(!warning_fired && (w < 1024 || h < 768)) {
            warning_fired = true;
            utils.warning_resolution(cb);
        }
        else { cb(); }
    }

    function resize() {
        let r = ()=> {
            views.forEach(function (v) {
                v.resize();
            });
            /* Toggle the overlay */
            $('body').chardinJs().stop();
            $('#helpButton').find("span").attr('class', "fa fa-question");
        };
        /* Check the resolution */
        checkResolution(r);
    }

    function setupInfo() {
        /* Register the about modal and help popup */
        $('#aboutModalDiv').load("./src/html/modals/aboutModal.html");

        $('#helpButton').on("click", function(){
            let span = $(this).find("span"),
                icon_class = span.attr('class');

            /* Open the menu */
            $("#familySettingsDropdown").find(".dropdown-menu:first").addClass("show",true);

            /* Toggle the help icon */
            if(icon_class === "fa fa-question") {
                span.attr('class', "fa fa-times");
            }
            else {
                span.attr('class', "fa fa-question");
                $("#familySettingsDropdown").find(".dropdown-menu:first").removeClass("show");
            }
            /* Toggle the overlay */
            $('body').chardinJs().toggle( ()=>{
                /* Hide the menu */
                $("#familySettingsDropdown").find(".dropdown-menu:first").removeClass("show");
            });

            /* Alternate exit */
            $(".svgOverlay").mouseup(function() {
                span.attr('class', "fa fa-question")
            });
            $(".chardinjs-overlay").mouseup(function() {
                span.attr('class', "fa fa-question")
            });
        });
    }

    /* Starting point of the program. Initializes the application */
    function init() {
        let proteinFamilyModel = new ProteinFamilyModel(),
            proteinFamilyView = new ProteinFamilyView(proteinFamilyModel, {id: "trendImageViewer"}),
            proteinFamilyController = new ProteinFamilyController(proteinFamilyModel, proteinFamilyView);

        let leftProteinModel = new ProteinModel(), rightProteinModel = new ProteinModel(),
            leftTertiaryStructureView = new TertiaryStructureView(leftProteinModel, {id: "molecularViewerA", position:"left"}),
            rightTertiaryStructureView = new TertiaryStructureView(rightProteinModel, {id: "molecularViewerB", position:"right"}),
            tertiaryStructuresController = new TertiaryStructureController(
                [leftProteinModel, rightProteinModel], [leftTertiaryStructureView, rightTertiaryStructureView], proteinFamilyController);

        let leftPrimaryStructureView  = new PrimaryStructureView(leftProteinModel, {id: "leftMolecularViewer-Sequence", position:"left"}),
            rightPrimaryStructureView = new PrimaryStructureView(rightProteinModel, {id: "rightMolecularViewer-Sequence", position:"right"}),
            primaryStructuresController = new PrimaryStructureController({}, [leftPrimaryStructureView, rightPrimaryStructureView]);

        /* Save the views in an array*/
        views = [proteinFamilyController, rightTertiaryStructureView, leftTertiaryStructureView, rightPrimaryStructureView, leftPrimaryStructureView];

        let launchModal = function() {
            $('#startupModalDiv').load("./src/html/modals/startupModal.html", function(){

                /* Launch the initial data modal */
                $("#initialModal").modal().on('shown.bs.modal', function (e) {

                    let modal = $(this);

                    /* Setup the file upload plugin */
                    App.fileUtilities.initialUploadSetup(modal,
                        function (metadata, result) {
                            /* Initialize the viewer based on the input data */
                            switch(metadata.extension){
                                case "pdb":
                                    leftTertiaryStructureView.file_loaded(metadata, result);
                                    break;
                                case "msf":
                                case "fa":
                                    proteinFamilyView.file_loaded(result, metadata.extension, metadata.name);
                                    break;
                            }

                            /* destroy the file upload */
                            modal.find("#fileUploadInput").fileupload('destroy');
                            /* Close the modal */
                            $("#initialModal").modal('hide');
                        });

                    /* Link the protein form to the model utilities */
                    modal.find("#initialDataForm").on("submit", function(){
                        let name = $(this).serialize().split('=')[1];
                        App.fileUtilities.ajaxFromRCMB(name, function(blob){
                            if(blob){
                                blob.name = name + ".pdb";
                                modal.find("#fileUploadInput").fileupload('add', {files: blob });
                            }
                            modal.find("#protein-name").val('');
                        });
                        return false;
                    });
                });
            });
        };

        checkResolution(launchModal);

        /* Show the tertiary viewers */
        leftTertiaryStructureView.show();
        rightTertiaryStructureView.show();
        proteinFamilyView.show();

        /* Show the sequence viewers */
        leftPrimaryStructureView.show();
        rightPrimaryStructureView.show();

        /* Register the resize callbacks */
        $(window).resize(function(){
            utils.waitForFinalEvent(resize, 400, "Resize complete");
        });

        /* Setup the info and help buttons */
        setupInfo();
    }

    /* start the application once the DOM is ready */
    document.addEventListener('DOMContentLoaded', init);
})();