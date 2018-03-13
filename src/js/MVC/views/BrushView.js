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
        self.mask = "";
        self.hasMask = false;

        self.overlays = [];

        self.brushMoved = null;
        self.proteinSelected = null;

        self.dispatch =  d3.dispatch('brushstart', 'brushend', 'brush');
        self.movementX = 0;
        self.movementY = 0;
        let block_size = options.block_size;

        /* set the initial selections */
        if (self._orientation === App.OVERVIEW_PADDLE) { self._selection = options.position; }
        else { self._selection = [0, 0]; }

        /* Brush event handlers */
        self.brushMoved = new EventNotification(this);
        self.proteinSelected = new EventNotification(this);

        /* Bind the event listens */
        self._model.selectedProteinChanged.attach(function (sender, msg) {
           self.redraw(App.HORIZONTAL_PADDLE);
        });

        self._model.selectedResiduesChanged.attach(function (sender, msg) {
            self.redraw(App.VERTICAL_PADDLE);
        });

        self._model.proteinOverviewChanged.attach(function (sender, msg) {
            self.redraw(App.OVERVIEW_PADDLE);
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

            let d3_window = d3.select(window);
            self.origin = d3.mouse(self.brush.node());
            /*Set the window move callbacks to trigger the brush movement */
            d3_window
                .on("mousemove.brush", function() { return brushMoveByHandle(self.brush.node());})
                .on("mouseup.brush", brushUpByHandle);
        }

        function brushMoveByHandle(target) {
            let mouse = d3.mouse(target);

            if(self._semantic === "horizontal" || self._semantic === "family") {
                self.movementX += self.origin[0] - mouse[0];
                self.movementY += mouse[1] - self.origin[1];
            }
            else {
                self.movementX += mouse[0] - self.origin[0];
                self.movementY += mouse[1] - self.origin[1];
            }
            self.origin = mouse;
            /* dispatch our brush event */
            return self.dispatch.call("brush", null, {mode: "move", offset: {x:self.movementX, y:self.movementY}});
        }

        function brushUpByHandle() {
            let d3_window = d3.select(window);
            /* Clear our callbacks */
            d3_window.on("mousemove.brush",null).on("mouseup.brush", null);
            /* Remove the extent on the side with the brush (because or a re-render */
            removeResizeHandle();
            return self.dispatch.call("brushend");
        }

        function addBrushHandles(brushObj, semantic) {
            let h = +brushObj.select('.selection').attr("height"),
                w = +brushObj.select('.overlay').attr("width"),
                x = +brushObj.select('.selection').attr("x"),
                y = +brushObj.select('.selection').attr("y"),
                image_width = 40, image_height = 25,
                image = "";

                switch(self._semantic) {
                case "horizontal":
                    x += w/2.0;
                    image = "src/svg/vertical.png";
                    image_width = 25;
                    image_height = 40;
                    break;
                case "family":
                    x += w;
                    y += h/2.0;
                    image = "src/svg/vertical.png";
                    image_width = 25;
                    image_height = 40;
                    break;
                case "left":
                case "right":
                    x += w/2.0 - block_size/2.0;
                    image = "src/svg/horizontal_paddle.png";
                    break;
            }

            self.handle = brushObj.selectAll(".handle--custom")
                .data([{type: semantic, height:image_height, width: image_width}])
                .enter().append("g");

            self.handle.append("rect")
                .attr("width", (d)=>{return d.width})
                .attr("height", (d)=>{return d.height})
                .classed("vertical_paddle_handle", (self._orientation === App.VERTICAL_PADDLE))
                .classed("horizontal_paddle_handle", !(self._orientation === App.VERTICAL_PADDLE));

            self.handle.append("svg:image")
                .attr("xlink:href", image)
                .attr("width", (d)=>{return d.width})
                .attr("height", (d)=>{return d.height});

            /* Center the handle */
            self.handle
                .attr("class", "handle--custom selection")
                .attr("id",semantic + "_svg")
                .attr("cursor", "move")
                .on("mousedown.brush", brushDownByHandle)
                .attr("transform",()=>{ return "translate(" + [x,y] + ")"; });
        }

        function addBrushSVGMasks(brushObj) {
            /* Mask out the area around the brush and handle */
            let brush_rect = brushObj.select("rect.selection"),
                handle = brushObj.select(".handle--custom");
            d3.select(self.mask)
                .append("rect")
                .attr("id", self._semantic)
                .attr("x", brush_rect.attr("x"))
                .attr("y", brush_rect.attr("y"))
                .attr("height", brush_rect.attr("height"))
                .attr("width", brush_rect.attr("width"));
            self.hasMask = true;
        }

        function addContextMenu(brushObj) {
            let view = self;
            /* Create the context menu */
            self.createContextMenu('g.horizontal.main rect.selection');
            self.createContextMenu('#horizontal_svg');

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

        function removeResizeHandle() {
            /* Remove the extent on the side with the brush*/
            if(self._semantic === "left"){ self.brush.selectAll('rect.handle--w').remove(); }
            else{ self.brush.selectAll('rect.handle--e').remove(); }
        }

        function setHelpText(brushObj, text) {
            self.handle//.select("rect.selection")
                .attr("data-intro", text);
        }

        function setHelpPosition(brushObj, pos) {
            self.handle//.select("rect.selection")
                .attr("data-position", pos);
        }

        self.onBrush = function (d) {
            /* We only want to capture user events. */
            if (!d3.event.sourceEvent) return;
            if (!d3.event.selection) return; // Ignore empty selections.
            if (d3.event.sourceEvent.type === "brush") return; // if the event isn't associated with a mouse move

            if (options.orientation === App.HORIZONTAL_PADDLE) {
                // Round the two event extents to the nearest row
                d3.event.selection[0] = Math.round(d3.event.selection[0] / block_size) * block_size;
                d3.event.selection[1] = Math.round(d3.event.selection[1] / block_size) * block_size;

                // Snap the brush onto the closest protein
                d3.select(this).call(d3.event.target.move, d3.event.selection);

                /* Reset the tween movement */
                if(self._selection[1] !== d3.event.selection[1]) {
                    self.movementY = 0;
                }
            }
            else if (options.orientation === App.VERTICAL_PADDLE) {
                // Round the two event extents to the nearest row
                d3.event.selection[0] = +(Math.round(d3.event.selection[0] / block_size) * block_size);
                d3.event.selection[1] = +(Math.round(d3.event.selection[1] / block_size) * block_size);

                // clamp the paddle to the min/max size
                clamp_brush_sizes(d3.event.selection, self._model.getSelectedResidues(options.semantic).previous);

                /* Programmatically move to the clamp*/
                d3.select(this).call(d3.event.target.move, d3.event.selection);

                /* Reset the tween movement */
                if(self._selection[0] !== d3.event.selection[0]) {
                    self.movementX = 0;
                }
            }
            else {
                d3.event.selection[0] = Math.round(d3.event.selection[0] / block_size) * block_size;
                d3.event.selection[1] = Math.round(d3.event.selection[1] / block_size) * block_size;
                // Snap the brush onto the closest protein
                d3.select(this).call(d3.event.target.move, d3.event.selection);

                /* Reset the tween movement */
                if(self._selection[1] !== d3.event.selection[1]) {
                    self.movementY = 0;
                }
            }

            /* store the selection*/
            self._selection = d3.event.selection;

            /* Notify the listeners */
            self.brushMoved.notify({options: options, selection: d3.event.selection});

            /* Show the tooltip on brush move */
            if(self._orientation === App.HORIZONTAL_PADDLE){
                self._tooltip.show(d, self.brush.select('rect.selection').node())
            }
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

        self.moveBrush = function(pos) {
            self.brushObj.brush(d3.select(self.brush.node()));
            self.brushObj.brush.move(d3.select(self.brush.node()), pos);
        };

        self.render = function (brushObj) {
            /* Remove the pointer events from the brush overlays to prevent:
             * 1: Deleting the brush on a wrong click
             * 2: Interference between brushes
             */
            self.brush = brushObj;
            brushObj.selectAll('.overlay').style("pointer-events", "none");
            /* Let d3 decide the best rendering for the brushes */
            brushObj.selectAll('.selection')
                .style("shape-rendering", "auto")
                .style("stroke", "none");
            /* Remove the extent on the side with the brush*/
            removeResizeHandle();

            /* Add the overlay masks and the paddles */
            addBrushHandles(brushObj, this._semantic);
            addBrushSVGMasks(brushObj);

            /* add the context menu for the horizontal bar*/
            if (this._orientation === App.HORIZONTAL_PADDLE) {
                /* Set the context menu of the horizontal brush */
                addContextMenu(brushObj);
            }
            /* Add the tooltip if one was created */
            if (this._tooltip) {
                brushObj.call(this._tooltip);
                brushObj.select('rect.selection')
                    .on('mouseover', this._tooltip.show)
                    .on('mouseout', this._tooltip.hide);
            }

            /* Add the help text */
            setHelpText(brushObj, this.helpText);
            setHelpPosition(brushObj, this.helpPosition);
        };

        self.redraw = function () {
            /* Move the brush paddle overlays */
            let brush = d3.select(document.getElementsByClassName(self.class)[0]),
                brush_sel = brush.select("rect.selection"),
                handle = brush.select(".handle--custom");
            /* Select the stencil in the mask */
            d3.select(self.mask).select("#"+self._semantic)
                .attr("x", brush_sel.attr("x"))
                .attr("y", brush_sel.attr("y"))
                .attr("width", brush_sel.attr("width"))
                .attr("height", brush_sel.attr("height"));

            if(handle.node()) {
                /* Move the brush paddle */
                let translate = d3Utils.get_translate_values(handle), x, y,
                    center_h = (+brush_sel.attr("height"))/2.0 - (+handle.select("rect").attr("height"))/2.0,
                    center_v = (+brush_sel.attr("width"))/2.0 - (+handle.select("rect").attr("width"))/2.0;
                switch(self._semantic) {
                    case "horizontal":
                        x =  +brush_sel.attr("width");
                        y = +brush_sel.attr("y") + center_h;
                        break;
                    case "family":
                        x =  +translate[0];
                        y = +brush_sel.attr("y") + center_h;
                        break;
                    case "left":
                    case "right":
                        x = +brush_sel.attr("x") + center_v;
                        y = +brush_sel.attr("y") - (+handle.select("rect").attr("height"));

                        let w = (+handle.select("rect").attr("width")),
                            end_position = x + (w),
                            total_width = +brush.select(".overlay").attr("width");

                        /* Test the text length */
                        if(end_position > total_width ){
                            x -= (end_position-total_width);
                        }
                        else if(x < 0) {
                            x = 0;
                        }
                        break;
                }
                /* Move the handle with the brush */
                handle.attr("display", null)
                    .attr("transform",()=>{ return "translate(" + [x,y] + ")"; });
            }
        };

        self.initialize = function (options) {
            let view = this,
                menuItems = d3.select("#familySettingsElements");
            view.class = options.class;
            view.helpText = options.helpText;
            view.helpPosition = options.helpPosition;
            view.mask = options.mask;

            /* Construct the brush based on the orientation */
            view.brushObj =
                App.BrushFactory.createBrush(options.orientation)
                    .setPaddleSize(options.paddleSize)
                    .setMaxPaddleSize(options.maxPaddleSize)
                    .setBrushClass(options.class)
                    .setPaddleExtent(options.extent)
                    .setInitialPosition(options.position)
                    .onBrush(function () {
                        if(options.orientation === App.VERTICAL_PADDLE) {
                            menuItems.classed("familySettingsElements_top", false)
                                .classed("familySettingsElements_bottom", true);
                        }
                        view.onBrush.call(this);
                        if(options.orientation === App.HORIZONTAL_PADDLE) {
                            utils.waitForFinalEvent(view._tooltip.hide, 1000, "Brushing complete");
                        }
                    })
                    .onEnd(function(){
                        if(options.orientation === App.VERTICAL_PADDLE) {
                            utils.waitForFinalEvent(function(){
                                menuItems.classed("familySettingsElements_bottom", false)
                                    .classed("familySettingsElements_top", true);
                            }, 500, "Brushing complete");

                        }
                    });

            /* Link the paddle updates */
            self.dispatch.on("brush", function(d) {
                let prev = d3.brushSelection(self.brush.node()), new_pos;
                if(self._semantic === "horizontal" || self._semantic === "family"){
                    new_pos = [prev[0] + d.offset.y, prev[1] + d.offset.y];
                    /* Clamp the brush movement */
                    if(new_pos[0] < options.extent[0][1] || new_pos[1] > options.extent[1][1]){
                        self.movementX = 0;
                        self.movementY = 0;
                        return;
                    }
                }
                else {
                    new_pos = [prev[0] + d.offset.x, prev[1] + d.offset.x];
                    /* Clamp the brush movement */
                    if(new_pos[0] < options.extent[0][0] || new_pos[1] > options.extent[1][0]){
                        self.movementX = 0;
                        self.movementY = 0;
                        return;
                    }
                }
                /* Brush with our new position */
                self.moveBrush(new_pos);
            });

            /* Add a tooltip if specified */
            if (options.tooltip) {
                view._tooltip = d3.tip()
                    .attr('class', 'd3-tip protein-name-tooltip')
                    .offset([-10, 0])
                    .html(options.tooltip);
            }
        };

        /* Mixin the utilities */
        _.mixin(self, new jQueryContextUtils(self));

        /* Initialize the d3 brush */
        self.initialize(options);

        return self;
    }
    return BrushView;
})();
