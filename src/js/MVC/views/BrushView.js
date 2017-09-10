"use strict";

var App = App || {};

const BrushView = (function() {

  function BrushView(model, options) {
    /* Save a reference to this */
    let self = this;

    self._model = model;
    self._scale = options.scale || null;
    self._orientation = options.orientation;
    self._tooltip = null;
    self._orientation = options.orientation;
    self._class = "";

    self.overlays = [];

    let block_size = options.block_size;

    /* set the initial selections */
    if(self._orientation === App.OVERVIEW_PADDLE){
      self._selection = options.position;
    }
    else {
      self._selection = [0,0];
    }

    /* Initialize the d3 brush */
    self.initialize(options);
    /* Brush event handlers */
    self.brushMoved = new EventNotification(this);

    /* Bind the event listens */
    self._model.selectedProteinChanged.attach(function(sender, msg) {
      self.redraw(App.HORIZONTAL_PADDLE, msg);
    });
    self._model.selectedResiduesChanged.attach(function(sender, msg){
      self.redraw(App.VERTICAL_PADDLE, msg);
    });

    /* Utility to clamp the brush sizes */
    function clamp_brush_sizes(selection, previousSelection) {
      let brush_size = Math.abs(selection[1] - selection[0]),
          maxPaddleSize = options.maxPaddleSize * block_size,
          minPaddleSize = options.paddleSize * block_size;

      if( brush_size > maxPaddleSize){
        /* Check which side was brushed */
        if(selection[0] === previousSelection[0]){
          selection[1] = selection[0] + maxPaddleSize;
        }
        else {
          selection[0] = selection[1] - maxPaddleSize;
        }
      }
      else if (brush_size < minPaddleSize) {
        /* Check which side was brushed */
        if (selection[0] === previousSelection[0]) {
          selection[1] = selection[0] + minPaddleSize;
        }
        else {
          selection[0] = selection[1] - minPaddleSize;
        }
      }
      return selection;
    }

    /* onBrushEnd Callback */
    self.onBrush = function() {
      /* We only want to capture user events. */
      if (!d3.event.sourceEvent) return;
      if (!d3.event.selection) return; // Ignore empty selections.
      if (d3.event.sourceEvent.type === "brush") return; // if the event isn't associated with a mouse move

      if(options.orientation === App.HORIZONTAL_PADDLE) {
        // Round the two event extents to the nearest row
        d3.event.selection[0] = Math.floor(d3.event.selection[0] / block_size) * block_size;
        d3.event.selection[1] = Math.floor(d3.event.selection[1] / block_size) * block_size;
        // Snap the brush onto the closest protein
        d3.select(this).call(d3.event.target.move, d3.event.selection);
      }
      else if(options.orientation === App.VERTICAL_PADDLE){
        // Round the two event extents to the nearest row
        d3.event.selection[0] = parseInt(Math.round(d3.event.selection[0]/block_size)*block_size);
        d3.event.selection[1] = parseInt(Math.round(d3.event.selection[1]/block_size)*block_size);

        // clamp the paddle to the min/max size
        clamp_brush_sizes(d3.event.selection, self._model.getSelectedResidues(options.semantic).previous);

        /* Programatically move to the clamp*/
        d3.select(this).call(d3.event.target.move, d3.event.selection)
      }
      else {
        d3.event.selection[0] = Math.round(d3.event.selection[0] / block_size) * block_size;
        d3.event.selection[1] = Math.round(d3.event.selection[1] / block_size) * block_size;
        // Snap the brush onto the closest protein
        d3.select(this).call(d3.event.target.move, d3.event.selection);
      }

      /* store the selection*/
      self._selection = d3.event.selection;

      /* Notify the listeners */
      self.brushMoved.notify({options: options, selection:d3.event.selection});
    };

    self.addBrushOverlays = function(brushObj) {
      /* 6 Masks: left/right of both vertical paddles, above/below the horizontal paddle */
      let parent = brushObj.node().parentNode,
          y = parseInt(brushObj.selectAll('rect.selection').attr('y')),
          bar_height     = parseInt(brushObj.selectAll('rect.selection').attr('height')),
          overlay_height = parseInt(brushObj.selectAll('rect.overlay').attr('height')),
          overlay_width = parseInt(brushObj.selectAll('rect.overlay').attr('width')),
          coordinates = [], class_name = "";
      /* Orientation specific settings */
      if(self._orientation === App.HORIZONTAL_PADDLE){
        /* The coordinates of opaque covers */
        coordinates = [
          /* Overlays above and below the horizontal paddle */
          {x:0, y:y, width:overlay_width, height:0, class_name:'horizontal_covers trend_covers'},
          {x:0, y:y+bar_height, width:overlay_width, height:overlay_height-(bar_height), class_name:'horizontal_covers trend_covers'},
          /* Overlays to the left of the left paddle */
          {x:0, y:y, width:0, height:y,class_name:'left_vertical_covers vertical_covers trend_covers'},
          {x:0, y:y+bar_height, width:0, height:overlay_height-(bar_height),class_name:'left_vertical_covers vertical_covers trend_covers' },
          /* Overlays to the left of the right paddle */
          {x:overlay_width, y:y, width:0, height:y,class_name:'right_vertical_covers vertical_covers trend_covers'},
          {x:overlay_width, y:y+bar_height, width:0, height:overlay_height-(bar_height),class_name:'right_vertical_covers vertical_covers trend_covers' }
        ];

        /* Append the two covers to the brush svg */
        d3.select(parent)
          .selectAll("paddle_overlays")
          .data(coordinates, function(d){return d;})
          .enter().append('rect')
          .attr("class", function(d){return d.class_name})
          .attr("x", function(d){return d.x})
          .attr("y", function(d){return d.y})
          .attr('width',  function(d){ return d.width; })
          .attr('height', function(d){ return d.height; })
          .attr('fill', '#ecf0f1');
      }
      else if(self._orientation === App.OVERVIEW_PADDLE){
        coordinates = [
          /* Overlays above and below the overview paddle */
          {x:0, y:y, width:overlay_width, height:0, class_name:'horizontal_covers trend_covers'},
          {x:0, y:y+bar_height, width:overlay_width, height:overlay_height-(bar_height), class_name:'horizontal_covers trend_covers'}
          ];
      }
    };

    self.addContextMenu = function() {
      let view = self;
      $.contextMenu({
        selector: 'g.horizontal rect.selection',
        reposition: false,
        className: 'protein_context',
        build: function($trigger, e) {
          return {
            callback: function (key, options) {
              let m = "clicked: " + key;
              window.console && console.log(m) || alert(m);
            },
            items: {
              "fold1a": {
                "name": "Load Structure",
                "items": {
                  "status": {
                    name: "Associated PDBs",
                    icon: "delete",
                    items: function () {
                      let dfd = jQuery.Deferred();
                      view._model.getProteinMappings()
                        .then(function (PDBs) {
                          /* Get the current protein name*/
                          let protein = view._model.getSelectedProtein().name,
                              menu = {};
                          /* load the pdb names into the menu */
                          PDBs[protein].forEach(function(p,i){
                            menu["sub"+i] = {name:p}
                          });
                          /* If no pdbs are found, tell the user*/
                          if(_.keys(menu).length === 0) {
                            menu['sub1'] = {name: "No assoc. proteins", disabled: true}
                          }
                          dfd.resolve(menu);
                        });
                      return dfd.promise();
                    }(),
                    className: 'pdb_names',
                  },
                  sep1: "---------",
                  name: {
                    name: "Associate a PDB:",
                    type: 'text',
                    value: "",
                    events: {
                      keyup: function (e) {
                        /* Check for the enter key and if the string is of length 4*/
                        if(e.keyCode === 13 && this.value.length === 4){
                          App.dataUtilities.checkPDBs(this.value).then(function(protein){
                            let current_protein = view._model.getSelectedProtein().name;
                            /* If the protein exists, add it to the model */
                            if(protein[0].status !== "UNKNOWN"){
                              /* update the menu if the item was added */
                              if(view._model.addProteinMapping(current_protein,protein[0])){
                                /* Add the new protein to the list */
                                $('ul.pdb_names')
                                    .append('<li class="context-menu-item"><span>'+protein[0].pdb+'</span> </li>');
                              }
                            }
                          });
                          /* Reset the value */
                          this.value = "";
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
    };
  }

  BrushView.prototype = {

    initialize: function(options) {
      let view = this;
      view.class = options.class;
      /* Construct the brush based on the orientation */
      view.brushObj =
          App.BrushFactory.createBrush(options.orientation)
              .setPaddleSize(options.paddleSize)
              .setMaxPaddleSize(options.maxPaddleSize)
              .setBrushClass(options.class)
              .setPaddleExtent(options.extent)
              .setInitialPosition(options.position)
              .onBrush(function(){ view.onBrush.call(this)} );

      /* Add a tooltip if specified */
      if(options.tooltip){
        view._tooltip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(options.tooltip);
      }
    },

    getInitialPosition : function() { return this.brushObj.getInitialPosition(); },

    getBrush: function() { return this.brushObj.brush; },

    getSelection: function() { return this._selection },

    setSelection: function(selection) { this._selection = selection; },

    getScale: function() { return this._scale },

    getBrushElement: function() { return document.getElementsByClassName(this.brushObj.getBrushClass())[0]; },

    render: function(brushObj) {
      /* Remove the pointer events from the brush overlays to prevent:
       * 1: Deleting the brush on a wrong click
       * 2: Interference between brushes
       */
      brushObj.selectAll('.overlay')
          .style("pointer-events", "none");
      /* Let d3 decide the best rendering for the brushes */
      brushObj.selectAll('.selection')
          .style("shape-rendering", "auto");

      /* Add the overlay masks */
      this.addBrushOverlays(brushObj);

      /* add the context menu for the horizontal bar*/
      if(this._orientation === App.HORIZONTAL_PADDLE) {
        /* Set the context menu of the horizontal brush */
        // brushObj.select("rect.selection")
        //     .on("contextmenu", d3.contextMenu(d3Utils.create_context_menu.bind(null,this._model)));
        this.addContextMenu();
      }
      /* Add the tooltip if one was created */
      if(this._tooltip){
        brushObj.call(this._tooltip);
        brushObj.select('rect.selection')
            .on('mouseover', this._tooltip.show)
            .on('mouseout', this._tooltip.hide);
      }
  },

    redraw: function(paddle, data) {
      let brush = null, x, y, width, height;

      if(paddle === App.HORIZONTAL_PADDLE) {
        let overview_height = parseInt(d3.select('g.horizontal rect.overlay').attr('height'));
        brush = d3.select('g.horizontal rect.selection');
        y = parseInt(brush.attr('y'));
        height = parseInt(brush.attr('height'));

        /* Resize the horizontal covers */
        d3.selectAll("rect.horizontal_covers")
           .attr("y", function(d,i){
             return ((i)?(y+height):d.y)})
           .attr("height", function(d,i) {
             return (i) ? overview_height-(y+height-d.y) : y-d.y;
           });
        /* Resize the vertical covers */
        d3.selectAll("rect.vertical_covers")
          .attr("y", function(d,i){ return ( !((i+1)%2) ?(y+height):d.y)})
          .attr("height", function(d,i) { return !((i+1)%2) ? overview_height-(y+height-d.y) : y-d.y });
      }

      else if(paddle === App.VERTICAL_PADDLE) {
        let overview_width = parseInt(d3.select('g.horizontal rect.overlay').attr('width'));

        /* Get the brush that moved */
        if(data.semantic === "left"){
          let brush_right = d3.select('g.vertical-right rect.selection');
          brush = d3.select('g.vertical-left rect.selection');

          /* Get the new positions */
          x = parseInt(brush.attr('x'));
          width = parseInt(brush.attr('width'));

          /* reposition the x of the horizontal covers */
          d3.selectAll("rect.horizontal_covers")
              .attr("x", (x+width))
              .attr('width', parseInt(brush_right.attr("x")) - (x+width));

          /* Reposition the x of the left vertical overlays */
          d3.selectAll('rect.left_vertical_covers')
            .attr('width', x);
        }
        else if(data.semantic === "right"){
          let brush_left = d3.select('g.vertical-left rect.selection'),
            width_left = parseInt(brush_left.attr('width'));

          brush = d3.select('g.vertical-right rect.selection');

          /* Get the new positions */
          x = parseInt(brush.attr('x'));
          width = parseInt(brush.attr('width'));

          /* reposition the width of the horizontal covers */
          d3.selectAll("rect.horizontal_covers")
              .attr('width', x - (parseInt(brush_left.attr("x"))+width_left) );

          /* Reposition the x of the right vertical overlays */
          d3.selectAll('rect.right_vertical_covers')
            .attr('x', x + width)
            .attr('width', overview_width - (x + width));
        }

      }
   }
  };

  return BrushView;

})();
