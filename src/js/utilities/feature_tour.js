(function(){

  // App.loadTour = function() {
    // Define the tour!
    App.tour_3D = {
      id: "introduction_tour_3D",
      steps: [
        {
          title: "Welcome to FixingTIM!",
          content: "Let me take you on a quick tour.",
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
          target: "tertiaryColorLegend",
          title: "Color legend",
          content: "This color legend corresponds to the color scheme of both molecular viewers.",
          placement: "right",
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

    // Define the tour!
    App.tour_family = {
      id: "introduction_tour_family",
      steps: [
        {
          title: "Welcome to FixingTIM!",
          content: "Let me take you on a quick tour.",
          target: "menu",
          placement: "bottom",
          xOffset: 'center',
          arrowOffset: 'center',
        },
        {
          target: "proteinFamilyRow",
          title: "Trend Image viewer",
          content: "This is a pixel-based abstraction known as a trend image. This image summarizes the loaded multiple sequence alignment" +
          "file by encoding each protein as a row in the image. Each pixel in the row corresponds to a residue in the sequence. ",
          placement: "top",
          xOffset: 'center',
          arrowOffset: 'center'
        },
        {
          target: "g.horizontal rect.selection",
          title: "Protein Selection Paddle",
          content: "This paddle selects which protein is compared to the family. By moving the paddle up and down, you are" +
            "able to control the top row of residues in both frequency viewers. Right-clicking on this paddle launches a " +
            "context menu that you can use to load the current protein into one of the 3D viewers. No proteins associated? " +
            "Specify one yourself by entering its PDB ID.",
          placement: "top",
          xOffset: 'center',
          arrowOffset: 'center'
        },
        {
          target: "g.vertical-left rect.selection",
          title: "Residue Selection Paddle(s)",
          content: "This paddle controls the range of residues currently displayed by the frequency viewers (below). " +
            "The two vertical paddles link to their corresponding frequency viewers (left and right). " +
            "The paddle can expand and shrink in size by dragging the handle.",
          placement: "right",
          // yOffset: 'center',
          arrowOffset: 'center'
        },
        {
          target: "g.overview rect.selection",
          title: "Overview Paddle",
          content: "If the trend image is too large to fit on the screen, only a small portion of it is rendered. This paddle " +
            "allows you to navigate to other parts of the image by moving the paddle vertically",
          placement: "left",
          // yOffset: 'center',
          // arrowOffset: 'center'
        },
        {
          target: "familyColorLegend",
          title: "Color legend",
          content: "This color legend corresponds to the color scheme of both trend image viewer.",
          placement: "left",
          yOffset: 'center',
          arrowOffset: 'center'
        },
        {
          target: "leftResidueSummaryViewer",
          title: "Frequency Viewer(s)",
          content: "These histograms are small multiples of the selected residues. The labels on the top of the bars " +
            "indicate the residue index in the sequence and the current proteins residue. The labels beneath the bars indicate the most " +
            "frequently occurring residue at that location.",
          placement: "top",
          xOffset: 'center',
          arrowOffset: 'center'
        },
        {
          target: "rect.freq_bars.r0",
          title: "Conservation Histogram",
          content: "This bar indicates how much of the alignment is conserved at its location. The more filled the bar, " +
            "the more conserved the residue. If the histogram is gray, the current protein matches the alignment " +
            "consensus at that location. If the bar is blue, the protein does not match the consensus. Hovering over the " +
            "histogram will display the most occurring residues at that location.",
          placement: "top",
          // xOffset: 'center',
          // arrowOffset: 'center'
        },
        {
          target: "fileupload-open",
          title: "Load a new alignment",
          content: "Selecting this icon allows you to load a new alignment into the viewer.",
          placement: "top",
          xOffset: 'center',
          arrowOffset: 'center'
        },
        {
          target: "popup-trigger-molecule",
          title: "Load a protein model",
          content: "Selecting this button allows you to select a protein model.",
          placement: "right",
          yOffset: 'center',
          arrowOffset: 'center'
        },
      ],
      showPrevButton: true
    };
  // };
})();