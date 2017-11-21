(function(){

  // Define the tour!
  App.tour_3D = {
    id: "introduction_tour",
    steps: [
      {
        title: "Welcome to FixingTIM!",
        content: "Let's take a quick tour.",
        target: "menu",
        placement: "bottom",
        xOffset: 'center',
        arrowOffset: 'center',
      },
      {
        target: "molecularViewerA",
        title: "Molecular Viewer",
        content: "This is the interactive 3D molecular viewer. Using your mouse, you can change orientation, zoom, and select residues for further investigation. " +
          "when two proteins are loaded, the molecular viewers are linked through mouse interactions.",
        placement: "right",
        yOffset: 'center',
        xOffset: -100,
        arrowOffset: 'center'
      },

      {
        target: "molecularViewerA_nav",
        title: "Molecular Viewer Settings",
        content: "These settings allow you to change the properties of the 3D viewer. ",
        placement: "bottom",
        xOffset: 'center',
        arrowOffset: 'center'
      },

      {
        target: "proteinName",
        title: "Load a new protein",
        content: "Selecting this icon allows you to load a new protein into the viewer. ",
        placement: "bottom",
        xOffset: 'right',
        arrowOffset: 'left'
      },

      {
        target: "geometry_list",
        title: "Change geometry",
        content: "This dropdown list allows you to change the geometric orientation of the protein. This is the only setting that is not linked between viewers. ",
        placement: "bottom",
        xOffset: 'center',
        arrowOffset: 'center'
      },

      {
        target: "protein_coloring_list",
        title: "Change coloring scheme",
        content: "This dropdown list allows you to change the protein's coloring scheme. This setting is linked between viewers. ",
        placement: "bottom",
        xOffset: 'center',
        arrowOffset: 'center'
      },

      {
        target: "colorLegend",
        title: "Color legend",
        content: "This color legend corresponds to the color scheme of both molecular viewers.",
        placement: "left",
        yOffset: 'center',
        arrowOffset: 'center'
      },

      {
        target: "leftMolecularViewer-Sequence",
        title: "Primary Sequence",
        content: "This is the linked primary sequence corresponding to the loaded protein. Selecting a residue in the sequence highlights the corresponding residue in it's 3D structure, and vice versa.",
        placement: "left",
        yOffset: 'center',
        arrowOffset: 'center'
      },

      {
        target: "popup-trigger-molecule",
        title: "Load a second protein",
        content: "Selecting this button allows you to select a second protein model. The two molecular viewers are linked through mouse interactions.",
        placement: "left",
        yOffset: 'center',
        arrowOffset: 'center'
      },

      {
        target: "popup-trigger-family",
        title: "Load a sequence alignment.",
        content: "Selecting this button allows you to load a multiple sequence alignment file. The supported formats include Clustalw (.msa) and FASTA (.fa),",
        placement: "top",
        xOffset: 'center',
        arrowOffset: 'center'
      },
    ],
    showPrevButton: true
  };

})();