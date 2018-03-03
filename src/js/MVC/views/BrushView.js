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
    self._semantic = options.semantic;
    self._class = "";
    self._menuSelection = "";
    self.brush = null;

    self.overlays = [];

    self.brushMoved = null;
    self.proteinSelected = null;

    self.dispatch =  d3.dispatch('brushstart', 'brushend', 'brush');

    let block_size = options.block_size;

    /* set the initial selections */
    if (self._orientation === App.OVERVIEW_PADDLE) { self._selection = options.position; }
    else { self._selection = [0, 0]; }

    /* Brush event handlers */
    self.brushMoved = new EventNotification(this);
    self.proteinSelected = new EventNotification(this);

    /* Bind the event listens */
    self._model.selectedProteinChanged.attach(function (sender, msg) {
      self.redraw(App.HORIZONTAL_PADDLE, msg);
    });

    self._model.selectedResiduesChanged.attach(function (sender, msg) {
      self.redraw(App.VERTICAL_PADDLE, msg);
    });

    self._model.proteinOverviewChanged.attach(function (sender, msg) {
      self.redraw(App.OVERVIEW_PADDLE, msg);
    });

    /* Utility to clamp the brush sizes */
    function clamp_brush_sizes(selection, previousSelection) {

      if (self._orientation === App.OVERVIEW_PADDLE) {
        return selection;
      }

      let brush_size = Math.abs(selection[1] - selection[0]),
        maxPaddleSize = options.maxPaddleSize * block_size,
        minPaddleSize = options.paddleSize * block_size;

      if (brush_size > maxPaddleSize) {
        /* Check which side was brushed */
        if (selection[0] === previousSelection[0]) {
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

    function brushDownByHandle() {
      d3.event.stopPropagation();
      d3.event.preventDefault();

      let _this = this,
          d3_window = d3.select(window),
          mouse = d3.mouse(self.brush.node());

      d3_window.on("mousemove.brush", function() { return brushMoveByHandle(_this);})
        .on("mouseup.brush", brushUpByHandle);

      self.origin = d3.mouse(this);
    }

    function brushMoveByHandle() {
      let mouse = d3.mouse(self.brush.node());

      if(options.semantic === "right") {
        console.log(mouse);
      }
      else if(options.semantic === "left") {
        console.log(mouse);
      }

      return self.dispatch.call("brush", this, {
        mode: "move"
      });
    }

    function brushUpByHandle() {

      let d3_window = d3.select(window);
      d3_window.on("mousemove.brush",null).on("mouseup.brush", null);


      return self.dispatch.call("brushend");
    }

    function brushHandlePath(d) {
      let e = +(d.type === "right"),
        x = e ? 1 : -1,
        y = d.height;
      return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " "
        + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 "
        + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8)
        + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
    }

    function addBrushHandles(brushObj, semantic) {
          let h = +brushObj.select('.selection').attr("height"),
              x = +brushObj.select('.selection').attr("x"),
              y = h/10 + h/4;

      if(semantic === "right") {x = x + (+brushObj.select(".selection").attr("width")); }

      /* Add the handle to the brush */
      self.handle = brushObj.selectAll(".handle--custom")
        .data([{type: semantic, height: h/10}])
        .enter().append("path")
        .attr("class", "handle--custom selection")
        .attr("cursor", "move")
        .attr("stroke", "#000")
        .attr("d", brushHandlePath)
        .on("mousedown.brush", brushDownByHandle);
        // .on("mousemove.brush", brushMoveByHandle.bind(null, brushObj))
        // .on("mouseup.brush", brushUpByHandle.bind(null, brushObj));

      /* Center the handle */
      self.handle
          .attr("transform",()=>{ return "translate(" + [parseInt(x),y] + ")"; });
    }

    function addBrushOverlays(brushObj) {
      /* 6 Masks: left/right of both vertical paddles, above/below the horizontal paddle */
      let bar_height = +(brushObj.selectAll('rect.selection').attr('height')),
          overlay_height = +(brushObj.selectAll('rect.overlay').attr('height')),
          overlay_width = +(brushObj.selectAll('rect.overlay').attr('width')),
          coordinates = [];
      /* Orientation specific settings */
      if (self._orientation === App.HORIZONTAL_PADDLE) {
        /* The coordinates of opaque covers */
        coordinates = [
          /* Overlays above and below the horizontal paddle */
          {x: 0, y: 0, width: overlay_width, height: 0, class_name: 'horizontal_covers trend_covers'},
          {x: 0, y: bar_height, width: overlay_width, height: overlay_height - (bar_height),
            class_name: 'horizontal_covers trend_covers'},
        ];
      }
      else if (self._orientation === App.VERTICAL_PADDLE && self._semantic === "left") {
        /* Overlays for the left paddle */
        coordinates = [
          {x: 0, y: 0, width: 0, height: 0, class_name: 'left_vertical_covers vertical_covers trend_covers'},
          {x: 0, y: bar_height, width: 0, height: overlay_height - (bar_height),
            class_name: 'left_vertical_covers vertical_covers trend_covers'},
        ];
      }
      else if (self._orientation === App.VERTICAL_PADDLE && self._semantic === "right") {
        coordinates = [
          /* Overlays for the right paddle */
          {x: overlay_width, y: 0, width: 0, height: 0, class_name: 'right_vertical_covers vertical_covers trend_covers'
          },
          {x: overlay_width, y: bar_height, width: 0, height: overlay_height - (bar_height),
            class_name: 'right_vertical_covers vertical_covers trend_covers' }
        ];
      }
      else if (self._orientation === App.OVERVIEW_PADDLE) {
        coordinates = [
          /* Overlays above and below the overview paddle */
          {x: +(options.extent[0][0]), y: 0, width: overlay_width, height: 0,
            class_name: 'overview_covers trend_covers'},
          {x: +(options.extent[0][0]), y: bar_height, width: overlay_width, height: overlay_height - (bar_height),
            class_name: 'overview_covers trend_covers'}
        ];
      }

      /* Append the two covers to the brush svg */
      d3.select(brushObj.node())
        .selectAll("paddle_overlays")
        .data(coordinates, function (d) {return d;})
        .enter().append('rect')
        .attr("class", function (d) { return d.class_name })
        .attr("x", function (d) { return d.x })
        .attr("y", function (d) {return d.y })
        .attr('width', function (d) {return d.width;})
        .attr('height', function (d) {return d.height;})
        .attr('fill', '#ecf0f1');
    }

    function addContextMenu() {
      let view = self;

      /* Create the context menu */
      self.createContextMenu('g.horizontal.main rect.selection');

      /* Add the callbacks to the modal window */
      $('.btn-left_viewer').on('click', function (e) {
        /* Hide the context menu */
        $('.context-menu-list').trigger('contextmenu:hide');
        view.proteinSelected.notify({semantic: 'left', protein: view._menuSelection});
      });

      $('.btn-right_viewer').on('click', function (e) {
        /* Hide the context menu */
        $('.context-menu-list').trigger('contextmenu:hide');
        view.proteinSelected.notify({semantic: 'right', protein: view._menuSelection});
      });
    }

    function setHelpText(brushObj, text) {
      brushObj.select("rect.selection")
        .attr("data-intro", text);
    }

    function setHelpPosition(brushObj, pos) {
      brushObj.select("rect.selection")
        .attr("data-position", pos);
    }

    /* onBrushEnd Callback */
    self.onBrush = function () {
      /* We only want to capture user events. */
      if (!d3.event.sourceEvent) return;
      if (!d3.event.selection) return; // Ignore empty selections.
      if (d3.event.sourceEvent.type === "brush") return; // if the event isn't associated with a mouse move

      if (options.orientation === App.HORIZONTAL_PADDLE) {
        // Round the two event extents to the nearest row
        d3.event.selection[0] = Math.floor(d3.event.selection[0] / block_size) * block_size;
        d3.event.selection[1] = Math.floor(d3.event.selection[1] / block_size) * block_size;
        // Snap the brush onto the closest protein
        d3.select(this).call(d3.event.target.move, d3.event.selection);
      }
      else if (options.orientation === App.VERTICAL_PADDLE) {
        // Round the two event extents to the nearest row
        d3.event.selection[0] = +(Math.round(d3.event.selection[0] / block_size) * block_size);
        d3.event.selection[1] = +(Math.round(d3.event.selection[1] / block_size) * block_size);

        // clamp the paddle to the min/max size
        clamp_brush_sizes(d3.event.selection, self._model.getSelectedResidues(options.semantic).previous);

        /* Programatically move to the clamp*/
        d3.select(this).call(d3.event.target.move, d3.event.selection);
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
      self.brushMoved.notify({options: options, selection: d3.event.selection});
    };

    self.getInitialPosition = function () {return this.brushObj.getInitialPosition(); };

    self.getBrush = function () { return this.brushObj.brush; };

    self.getSelection = function () { return this._selection };

    self.setSelection = function (selection) { this._selection = selection; };

    self.getScale = function () { return this._scale };

    self.getBrushElement = function () { return document.getElementsByClassName(this.brushObj.getBrushClass())[0]; };

    self.removeContextMenu = function () {
      $('.btn-left_viewer').off('click');
      $('.btn-right_viewer').off('click');
    };

    self.render = function (brushObj) {
      /* Remove the pointer events from the brush overlays to prevent:
       * 1: Deleting the brush on a wrong click
       * 2: Interference between brushes
       */

      self.brush = brushObj;
      brushObj.selectAll('.overlay')
        .style("pointer-events", "none");
      /* Let d3 decide the best rendering for the brushes */
      brushObj.selectAll('.selection')
        .style("shape-rendering", "auto");

      /* add the context menu for the horizontal bar*/
      if (this._orientation === App.HORIZONTAL_PADDLE) {
        /* Set the context menu of the horizontal brush */
        addContextMenu();
      }
      /* Add the tooltip if one was created */
      if (this._tooltip) {
        brushObj.call(this._tooltip);
        brushObj.select('rect.selection')
          .on('mouseover', this._tooltip.show)
          .on('mouseout', this._tooltip.hide);
      }

      if(this._orientation === App.VERTICAL_PADDLE){ addBrushHandles(brushObj, this._semantic); }

      /* Add the overlay masks and the paddles */
      addBrushOverlays(brushObj);

      /* Add the help text */
      setHelpText(brushObj, this.helpText);
      setHelpPosition(brushObj, this.helpPosition);
    };

    self.redraw = function (paddle, data) {
        let brush, parent, x, y, width, height;

        if (paddle === App.OVERVIEW_PADDLE) {
          let overview_height = parseInt(d3.select('g.horizontal rect.overlay').attr('height'));
          brush = d3.select('g.overview rect.selection');
          y = parseInt(brush.attr('y'));
          height = parseInt(brush.attr('height'));
          d3.selectAll("rect.overview_covers")
            .attr("y", function (d, i) { return ((i) ? (y + height) : d.y) })
            .attr("height", function (d, i) {
              let h = (i) ? overview_height - (y + height - d.y) : y - d.y;
              return (h > -1) ? h : 0;
            });
        }
        else if (paddle === App.HORIZONTAL_PADDLE) {
          let overview_height = parseInt(d3.select('g.horizontal rect.overlay').attr('height'));
          brush = d3.select('g.horizontal rect.selection');
          y = parseInt(brush.attr('y'));
          height = parseInt(brush.attr('height'));

          /* Resize the vertical covers */
          d3.selectAll("rect.vertical_covers")
            .attr("y", function (d, i) {
              return ( !((i + 1) % 2) ? (y + height) : d.y)
            })
            .attr("height", function (d, i) {
              return !((i + 1) % 2) ? overview_height - (y + height) : y - d.y
            });

          /* Resize the horizontal covers */
          d3.selectAll("rect.horizontal_covers")
            .attr("y", function (d, i) {
              return ((i) ? (y + height) : d.y)
            })
            .attr("height", function (d, i) {
              return (i) ? overview_height - (y + height) : y - d.y;
            });
        }
        else if (paddle === App.VERTICAL_PADDLE) {
          let overview_width = +(d3.select('g.horizontal rect.overlay').attr('width')),
              brush_left = d3.select('g.vertical-left rect.selection'),
              brush_right = d3.select('g.vertical-right rect.selection');
          /* Get the brush that moved */
          if (data.semantic === "left") {
            brush = brush_left;
            parent = brush.node().parentNode;

            /* Get the new positions */
            x = +(brush.attr('x'));
            width = +(brush.attr('width'));

            /* Reposition the x of the left vertical overlays */
            d3.selectAll('rect.left_vertical_covers')
              .attr('width', x);
            /* reposition the x of the horizontal covers */
            d3.selectAll("rect.horizontal_covers")
              .attr("x", (x + width))
              .attr('width', () => {
                let w = +(brush_right.attr("x")) - (x + width);
                return (w > -1) ? w : 0
              });
          }
          else if (data.semantic === "right") {
            brush = brush_right;
            parent = brush.node().parentNode;

            /* Get the new positions */
            x = +(brush.attr('x'));
            width = +(brush.attr('width'));

            /* Reposition the x of the right vertical overlays */
            d3.selectAll('rect.right_vertical_covers')
              .attr('x', x + width)
              .attr('width', () => {
                let w = overview_width - (x + width);
                return (w > -1) ? w : 0
              });

            /* reposition the width of the horizontal covers */
            d3.selectAll("rect.horizontal_covers")
              .attr('width', () => {
                let width_left = +(brush_left.attr('width')),
                    w = x - (+(brush_left.attr("x")) + width_left);
                return (w > -1) ? w : 0
              });
            x = x+width;
          }
            // /* Move the brush paddle */
            height = +(brush.attr('height'));
            let y = (height/4 + height/10);

            d3.select(parent).select(".handle--custom").attr("display", null)
              .attr("transform",()=>{ return "translate(" + [x,y] + ")"; })
              .raise();
        }
      };

    /* Mixin the utilities */
    _.mixin(self, new jQueryContextUtils(self));

    self.initialize = function (options) {
      let view = this;
      view.class = options.class;
      view.helpText = options.helpText;
      view.helpPosition = options.helpPosition;

      /* Construct the brush based on the orientation */
      view.brushObj =
        App.BrushFactory.createBrush(options.orientation)
          .setPaddleSize(options.paddleSize)
          .setMaxPaddleSize(options.maxPaddleSize)
          .setBrushClass(options.class)
          .setPaddleExtent(options.extent)
          .setInitialPosition(options.position)
          .onBrush(function () {
            view.onBrush.call(this)
          });

      /* Add a tooltip if specified */
      if (options.tooltip) {
        view._tooltip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(options.tooltip);
      }

    };

    /* Initialize the d3 brush */
    self.initialize(options);

    return self;
  }
  return BrushView;
})();
