'use strict';

(function() {
  var svgNs = 'http://www.w3.org/2000/svg',
      xlinkNs = 'http://www.w3.org/1999/xlink';

  function createSvg( name ) {
    return document.createElementNS(svgNs, name);
  }

  function indexOf( array, memberId ) {
    for ( var i=0, len=array.length; i<len; i++ ) {
      if ( array[i].id === memberId ) {
        return i;
      }
    }

    return -1;
  }

  function addGlowFilter(to) {

    var glow = to.append('filter')
      .attr('id', 'glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('height', '140%')
      .attr('width', '140%');

    glow.append('feGaussianBlur')
      //.attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);

    //glow.append('feOffset')
      //.attr('dx', 0)
      //.attr('dy', 0)
      //.attr('result', 'offsetblur');

    //var merge = glow.append('feMerge');
    //merge.append('feMergeNode');
    //merge.append('feMergeNode')
      //.attr('in', 'SourceGraphic');

    return glow;
  }

  /**
   * This function creates nodes and links for the D3 graph out of member data.
   */
  function membersToNetworkModel(nodes) {
    var nlen = nodes.length,
        maxId = 0,
        nodesById = {},
        node,
        nextGroup = 1,
        linkCount = 0;
    for ( var ni=0; ni<nlen; ni++ ) {
      node = nodes[ ni ];

      nodesById[ node.id ] = node;

      if ( node.id > maxId ) {
        maxId = node.id;
      }

      if ( node.root || node.children ) {
        node.group = nextGroup++;
      }

      if ( node.parent ) {
        linkCount++;
      }
    }

    var links = new Array( linkCount ),
        nextLink = 0;
    for ( var ni=0; ni<nlen; ni++ ) {
      node = nodes[ ni ];

      if ( node.parent ) {
        var parent = nodesById[ node.parent ];

        var link = {
          source: node,
          target: parent,
          value: 1 // TODO
        };

        links[ nextLink++ ] = link;

        if ( !node.group ) {
          node.group = parent.group;
        }
      }
    }

    return {
      nodes: nodes,
      nodesById: nodesById,
      links: links,
      nextId: maxId + 1
    };
  }

  function buildGraph(nodeTypes, networkEl, width, height, pixelWidth, members, scope) {
    var $networkEl = $(networkEl),
        network = {
          zoomLevel: scope.zoom,
          expandLinks: function(sel, time, duration) {
            sel
              .attr('x1', function(d) { return d.target.x; })
              .attr('y1', function(d) { return d.target.y; })
              .attr('x2', function(d) { return d.target.x; })
              .attr('y2', function(d) { return d.target.y; })
              .transition()
              .delay(time)
              .duration(duration)
              .attr('x1', function(d) { return d.source.x; })
              .attr('y1', function(d) { return d.source.y; });
          },
          collapseLinks: function(sel, time, duration) {
            sel
              .attr('x1', function(d) { return d.source.x; })
              .attr('y1', function(d) { return d.source.y; })
              .attr('x2', function(d) { return d.target.x; })
              .attr('y2', function(d) { return d.target.y; })
              .transition()
              .delay(time)
              .duration(duration)
              .attr('x1', function(d) { return d.target.x; })
              .attr('y1', function(d) { return d.target.y; });
          }
        },
        overlays = [];

    /**
     * This updates the DOM SVG "g" node with the DOM elements for the given data object node (member).
     */
    function addNode( g, member ) {
      var type = nodeTypes.byName[ member.type ];

      if ( type ) {
        var imgHref = member.img || type.img;

        g.setAttribute( 'class', 'node ' + member.type + ( imgHref ? ' img' : '' ) );

        switch ( type.container ) {
        case 'square':
          var rect = createSvg('rect');
          rect.setAttribute('x', -20);
          rect.setAttribute('y', -20);
          rect.setAttribute('width', 40);
          rect.setAttribute('height', 40);
          rect.setAttribute('rx', 4);
          rect.setAttribute('ry', 4);
          g.appendChild(rect);
          break;

        case 'circle':
          var circle = createSvg('circle');
          circle.setAttribute('r', imgHref ? 20 : 10);
          circle.setAttribute('cx', 0);
          circle.setAttribute('cy', 0);
          g.appendChild(circle);
          break;

        case 'ring':
          var circle = createSvg('circle');
          circle.setAttribute('r', imgHref ? 20 : 10);
          circle.setAttribute('cx', 0);
          circle.setAttribute('cy', 0);
          g.appendChild(circle);
          break;
        }

        if ( imgHref ) {
          var img = createSvg('image');
          img.setAttributeNS(xlinkNs,'href',imgHref);

          switch ( type.container ) {
          case 'square':
            img.setAttribute('x',-27);
            img.setAttribute('y',-27);
            img.setAttribute('width',54);
            img.setAttribute('height',54);
            img.setAttribute('clip-path','url(#squareImg)');
            break;
          case 'circle':
          case 'ring':
            if ( member.img ) {
              img.setAttribute('x',-27);
              img.setAttribute('y',-27);
              img.setAttribute('width',54);
              img.setAttribute('height',54);
            } else {
              img.setAttribute('x',-18);
              img.setAttribute('y',-18);
              img.setAttribute('width',36);
              img.setAttribute('height',36);
            }
            img.setAttribute('clip-path','url(#circleImg)');
            break;
          default:
            img.setAttribute('x',-13);
            img.setAttribute('y',-13);
            img.setAttribute('width',26);
            img.setAttribute('height',26);
          }

          g.appendChild(img);
        }
      }

      var text = createSvg('text');
      text.setAttribute('x', 0);

      var y;
      if ( member.type === 'label' ) {
        y = 0;
      } else if ( type.container === 'square' ) {
        y = 36;
      } else if ( type.container === 'circle' ) {
        y = ( member.img || type.img ) ? 36 : 22;
      } else {
        y = 24;
      }
      text.setAttribute('y', y);
      text.setAttribute('class', member.type === 'label' ? 'label' : null );
      text.setAttribute('text-anchor', 'middle');
      text.appendChild(document.createTextNode(member.name));
      g.appendChild(text);
    }

    // Adds a selection outline around the node
    function addSelect(g, data) {

      var type = nodeTypes.byName[ data.type ];

      if ( data.type !== 'label' ) {
        var imgHref = type.img || data.img;

        switch ( type.container ) {
        case 'square':
          var rect = createSvg('rect');
          rect.setAttribute('x', -23);
          rect.setAttribute('y', -23);
          rect.setAttribute('width', 46);
          rect.setAttribute('height', 46);
          rect.setAttribute('rx', 4);
          rect.setAttribute('ry', 4);
          rect.setAttribute('class', 'selected');
          g.appendChild(rect);
          break;

        case 'circle':
          var circle = createSvg('circle');
          circle.setAttribute('r', imgHref ? 23 : 13);
          circle.setAttribute('cx', 0);
          circle.setAttribute('cy', 0);
          circle.setAttribute('class', 'selected');
          g.appendChild(circle);
          break;

        default:
          var rect = createSvg('rect');
          rect.setAttribute('x', -15);
          rect.setAttribute('y', -15);
          rect.setAttribute('width', 30);
          rect.setAttribute('height', 30);
          rect.setAttribute('rx', 4);
          rect.setAttribute('ry', 4);
          rect.setAttribute('class', 'selected');
          g.appendChild(rect);
        }
      } else {
        var $text = $(g).find('text'),
            width = $text.width() + 24,
            height = $text.height() + 4;

        var rect = createSvg('rect');
        rect.setAttribute('x', -width/2);
        rect.setAttribute('y', -height/2 - 5);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('rx', 4);
        rect.setAttribute('ry', 4);
        rect.setAttribute('class', 'selected');
        g.appendChild(rect);
      }
    }

    function buildNode(data) {
      var g = createSvg('g');
      addNode(g, data);
      return g;
    }

    function baseNodeScale(d) {
      return ( d.scale || 1 ) * nodeTypes.byName[ d.type ].scale;
    }

    function nodeScale(d, level) {
      return !d.level || d.level <= level ? baseNodeScale(d) : 0;
    }

    function zoomToFit(level) {
      var visibleMembers = members.filter(function(d) { return d.level <= level; }),

          // TODO:  rather than return d.x, d.y ... figure out the bounding box for the node then get rid of the +200/-100/etc. factors below
          xExtent = d3.extent(visibleMembers, function(d) { return d.x; }),
          yExtent = d3.extent(visibleMembers, function(d) { return d.y; }),

          $baseSvg = $(baseSvg[0][0]),

          graphWidth = xExtent[1] - xExtent[0] + 200,
          graphHeight = yExtent[1] - yExtent[0] + 200,

          xZoom = $baseSvg.width() / graphWidth,
          yZoom = $baseSvg.height() / graphHeight,

          compositeZoom = Math.min( xZoom, yZoom ),

          tx = -( xExtent[0] - 100 ) * compositeZoom,
          ty = -( yExtent[0] - 100 ) * compositeZoom;

      // center the graph horizontally
      tx += Math.max( 0, ( $baseSvg.width() - graphWidth * compositeZoom ) / 2 );

      zoom.scale(compositeZoom);
      zoom.translate([tx, ty]);
    }

    var baseSvg = d3.select(networkEl)
      .append('svg')
        .attr('width', width )
        .attr('height', height);

    addGlowFilter(baseSvg);

    var defs = baseSvg.append('defs');

    // clip path used for clipping profile images to a circle
    defs.append('clipPath')
      .attr('id','circleImg')
        .append('circle')
          .attr('cx',0)
          .attr('cy',0)
          .attr('r',18);

    // clip path used for clipping profile images to a square
    defs.append('clipPath')
      .attr('id','squareImg')
        .append('rect')
          .attr('x', -18)
          .attr('y', -18)
          .attr('width', 36)
          .attr('height', 36)
          .attr('rx', 4)
          .attr('ry', 4);

    var zoomTranslate = [ 0, 0 ],
        zoomScale = 1,
        zoom = d3.behavior.zoom()
          .scaleExtent([0.25, 8])
          .on('zoom', function() {
            if (!d3.event.sourceEvent.shiftKey) {
              zoomTranslate = d3.event.translate;
              zoomScale = d3.event.scale;
              svg.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
            }
          });

    var svg = baseSvg
      .call( zoom )
      .append('g');

    var graph = membersToNetworkModel( members );


    //
    // Force
    //

    var force = d3.layout.force()
      .size([pixelWidth, height])
      .nodes(graph.nodes)
      .links(graph.links)
      .gravity(0.1)
      .linkDistance(function(d) {
        return d.source.group !== d.target.group ? 120 : 50;
      })
      //.linkStrength(function(x) {
        //return x.source.group !== x.target.group ? 40 : 20;
      //})
      .charge(-1020);

    force.start();
    for ( var i = 1000; i > 0; i-- ) {
      force.tick();
    }
    force.stop();

    //setTimeout(function() {
      //for ( var i = 100; i > 0; i-- ) {
        //force.tick();
      //}
    //}, 10);


    //
    // Node dragging
    //

    var drag = force.drag()
      .on('dragstart', function(d) {
        d3.event.sourceEvent.stopPropagation(); // prevent zoom/pan

        d.fixed = true;
      })
      .on('drag', function(d, i) {
        var selection = d3.selectAll($('.selected').parent().get());

        if (selection[0].indexOf(this)==-1) {
          $networkEl.find('.selected').remove();
          selection = d3.select(this);
          addSelect(this, d);
        } 

        selection.attr('transform', function(d, i) {
          d.x += d3.event.dx;
          d.y += d3.event.dy;
          d.px += d3.event.dx;
          d.py += d3.event.dy;
          d.fixed = true;
          return 'translate(' + d.x + ',' + d.y + ')';
        })

        // reappend dragged element as last so that its stays on top 
        this.parentNode.appendChild(this);
        d3.event.sourceEvent.stopPropagation();
      });


    //
    // Rectangle Selection
    //

    function translateBaseToZoom(p) {
      p[0] = ( p[0] - zoomTranslate[0] ) / zoomScale;
      p[1] = ( p[1] - zoomTranslate[1] ) / zoomScale;
      return p;
    }

    baseSvg
      .on( 'mousedown', function() {
        if (d3.event.shiftKey) {
          d3.event.stopPropagation(); // prevent zoom/pan
          var p = translateBaseToZoom(d3.mouse(this));

          svg.append('rect')
            .attr({
              rx:     6,
              ry:     6,
              class:  'selection',
              x:      p[0],
              y:      p[1],
              width:  0,
              height: 0
          })
        }
      })
      .on('mousemove', function() {
        if (d3.event.shiftKey) {
          d3.event.stopPropagation(); // prevent zoom/pan
          var selBox = svg.select('rect.selection');

          if (!selBox.empty()) {
            var p = translateBaseToZoom(d3.mouse(this)),
                box = {
                  x:      parseInt(selBox.attr('x'), 10),
                  y:      parseInt(selBox.attr('y'), 10),
                  width:  parseInt(selBox.attr('width'), 10),
                  height: parseInt(selBox.attr('height'), 10)
                },
                move = {
                  x: p[0] - box.x,
                  y: p[1] - box.y
                };

            if (move.x < 1 || (move.x*2 < box.width)) {
              box.x = p[0];
              box.width -= move.x;
            } else {
              box.width = move.x;       
            }

            if (move.y < 1 || (move.y*2 < box.height)) {
              box.y = p[1];
              box.height -= move.y;
            } else {
              box.height = move.y;       
            }

            box.width = Math.max(box.width, 0);
            box.height = Math.max(box.height, 0);
         
            selBox.attr(box);

            d3.selectAll('g.show').each(function(node, i) {
              var g = $(this);
              if ( !g.find('.selected').length &&
                   node.x>=box.x && node.x<=box.x+box.width && 
                   node.y>=box.y && node.y<=box.y+box.height ) {
                addSelect(this, node);
              }
            });
          }
        }
      })
      .on('mouseup', function() {
        svg.selectAll('rect.selection').remove();
      })
      .on('mouseout', function() {
        if (!$(d3.event.relatedTarget).closest('svg').length) {
          svg.selectAll('rect.selection').remove();
        }
      });


    //
    // Node and Link rendering
    //

    var singleLinks = svg.selectAll('line.link'),
        doubleLinks = svg.selectAll('g.link');
    var nodes = svg.selectAll('.node');

    function sync() {
      singleLinks = singleLinks.data(force.links().filter(function(d) { return d.source.type !== 'label' && baseNodeScale(d.source) <= 1; }), function(d) { return d.source.id + '-' + d.target.id; });
      doubleLinks = doubleLinks.data(force.links().filter(function(d) { return d.source.type !== 'label' && baseNodeScale(d.source) > 1; }), function(d) { return d.source.id + '-' + d.target.id; });

      singleLinks.enter()
        // insert lines before nodes so that they are beneath the nodes
        .insert('line', '.node')
          .attr('class', 'link');

      singleLinks.exit()
        .remove();

      var lines = doubleLinks.enter()
        // insert lines before nodes so that they are beneath the nodes
        .insert('g', '.node')
          .attr('class', 'link');

      lines
        .append('line')
          .attr('class', 'outer');
      lines
        .append('line')
          .attr('class', 'inner');

      doubleLinks.exit()
        .remove();

      nodes = nodes.data(force.nodes(), function(d) { return d.id; });
      nodes.enter()
        .append(buildNode)
        .call(drag);
      nodes.exit()
        .remove();

      if (scope.onClickNode) {
        nodes.on('click', function(data, i) {
          if (d3.event.defaultPrevented) {
            return;
          }

          var g = $(this),
              selNode = g.find('.selected'),
              add = !selNode.length;

          if ( !d3.event.shiftKey ) {
            $networkEl.find('.selected').remove();

            if (add) {
              addSelect(this, data);
            }
          } else {
            if ( add ) {
              addSelect(this, data);
            } else {
              selNode.remove();
            }
          }

          $networkEl.toggleClass('selecting', $networkEl.find('.selected').length > 0);

          scope.$apply(function() {
            scope.onClickNode({
              data: data,
              i: i,
              selected: add
            });
          });
        }); 
      }

      if ( members.some(function(d) { return d.x === undefined; }) ) {
        force.start();
      } else {
        tick();
      }
    }

    sync();
    zoomToFit(network.zoomLevel);
    svg.attr('transform', 'translate(' + zoom.translate() + ')scale(' + zoom.scale() + ')');

    function tick() {
      singleLinks
        .filter(function(d) { return !d.source.level || d.source.level <= network.zoomLevel; })
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

      doubleLinks
        .filter(function(d) { return !d.source.level || d.source.level <= network.zoomLevel; })
        .selectAll('line')
          .attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });

      nodes
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')scale(' + nodeScale( d, network.zoomLevel ) + ')'; })
        .classed('show', function(d) { return !d.level || d.level <= network.zoomLevel });
    }

    force.on('tick', tick);

    /**
     * This object is the API external clients can use to manipulate the network graph.
     */
    $.extend( network, {
      data: members,
      dataById: graph.nodesById,
      svg: svg,
      nodes: function() { return nodes; },
      force: force,

      /**
       * This rebuilds and redraws the given node to reflect the current state of its data;
       * node is a data object, not a DOM node.
       */
      redraw: function(node) {
        var domNodes = nodes[0];
        // assumes force.nodes() is parallel to nodes[0]
        var i = indexOf(force.nodes(),node.id);
        if ( i !== -1 ) {
          var g = domNodes[i];
          var selected = false;
          while (g.firstChild) {
            if ( g.firstChild.getAttribute('class') === 'selected' ) {
              selected = true;
            }
            g.removeChild(g.firstChild);
          }
          addNode(g, node);
          if ( selected ) {
            addSelect(g, node);
          }
          return;
        }
      },

      /**
       * Removes the given node from the graph; node is a data object, not a DOM node.
       */
      remove: function(node) {
        var id = node.id;
        force.links( force.links().filter(function(d) { return d.source.id !== id && d.target.id !== id; }) );
        force.nodes( force.nodes().filter(function(d) { return d.id !== id; }) );
        sync();
      },

      /**
       * Adds a new node with source as its parent; node is a data object, not a DOM node.
       */
      add: function(source) {
        var node = {
          id: graph.nextId++,
          name: '',
          type: source.type,
          parent: source.id,
          level: 0 // TODO:  need to figure this out more accurately
        };

        force.nodes().push(node);
        force.links().push({
          source: source,
          target: node,
          weight: 1
        });
        sync();

        return node;
      },

      /**
       * Sets the zoom level for the graph.
       */
      zoom: function(level) {
        if ( level === network.zoomLevel ) {
          return;
        }

        var time = 0,
            duration = 500;

        zoomToFit(level);

        if ( level > network.zoomLevel ) {
          var levelNodes = nodes.filter(function(d) { return d.level === level; }),
              levelSingleLinks = singleLinks.filter(function(d) { return d.source.level === level; }),
              levelDoubleLinks = doubleLinks.filter(function(d) { return d.source.level === level; });

          for ( var levelDepth = 0; levelDepth < 3; levelDepth++ ) {
            var ns = levelNodes.filter(function(d) { return d.levelDepth === levelDepth; });
            if ( ns.empty() )
              break;

            network.expandLinks(levelSingleLinks.filter(function(d) { return d.source.levelDepth === levelDepth; }), time, duration);
            network.expandLinks(levelDoubleLinks.filter(function(d) { return d.source.levelDepth === levelDepth; }).selectAll('line'), time, duration);

            time += duration * 0.5

            ns
              .classed('show', true)
              .transition()
              .delay(time)
              .duration(duration)
              .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')scale(' + nodeScale(d, level) + ')'; });

            time += duration
          }

        } else {
          var levelNodes = nodes.filter(function(d) { return d.level === network.zoomLevel; }),
              levelSingleLinks = singleLinks.filter(function(d) { return d.source.level === network.zoomLevel; }),
              levelDoubleLinks = doubleLinks.filter(function(d) { return d.source.level === network.zoomLevel; });

          for ( var levelDepth = 3; levelDepth >= 0; levelDepth-- ) {
            var ns = levelNodes.filter(function(d) { return d.levelDepth === levelDepth; });
            if ( ns.empty() )
              continue;

            ns
              .transition()
              .delay(time)
              .duration(duration)
              .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')scale(' + nodeScale(d, level) + ')'; });

            time += duration * 0.5

            network.collapseLinks(levelSingleLinks.filter(function(d) { return d.source.levelDepth === levelDepth; }), time, duration);
            network.collapseLinks(levelDoubleLinks.filter(function(d) { return d.source.levelDepth === levelDepth; }).selectAll('line'), time, duration);

            time += duration
          }
        }

        svg
          .transition()
          .duration(time+duration)
          .attr('transform', 'translate(' + zoom.translate() + ')scale(' + zoom.scale() + ')');

        overlays.forEach(function(overlay) {
          overlay.zoom(level);
        });

        network.zoomLevel = level;
      },

      /**
       * Applies overlays to the graph.
       */
      overlays: function(overlaysArr) {
        overlays.forEach(function(overlay) {
          overlay.deactivate();
        });

        overlays = overlaysArr || [];

        for ( var i=0, len=overlays.length; i<len; i++ ) {
          overlays[i] = new overlays[i].cls(network);
        }

        overlays.forEach(function(overlay) {
          overlay.activate();
        });
      }
    });

    if (scope.onLoad) {
      scope.onLoad({
        api: network
      });
    }

    return network;
  }

  angular.module('clNetwork', [])

    /**
     * This service provides data that is useful when interacting with the network diagram.
     */
    .service('networkNodeTypes', [
      function() {

        /*
         * Node Types
         *
         * These node type names are also the CSS classes that are applied to each node, so update the sass if
         * new node types are added.
         */

        var nodeTypes = [
          {
            name: 'label',
            scale: 1
          },
          {
            name: 'black-square',
            container: 'square',
            scale: 1
          },
          {
            name: 'blue-square',
            container: 'square',
            scale: 1
          },
          {
            name: 'blue-circle',
            container: 'circle',
            scale: 1
          },
          {
            name: 'red-circle',
            container: 'circle',
            scale: 1
          },
          {
            name: 'yellow-circle',
            container: 'circle',
            scale: 1
          },
          {
            name: 'person',
            img: 'http://png-4.findicons.com/files/icons/61/dragon_soft/128/user.png',
            scale: 1
          },
          {
            name: 'blue-person',
            container: 'square',
            scale: 1
          },
          {
            name: 'level-1',
            container: 'circle',
            scale: 2.2
          },
          {
            name: 'level-2',
            container: 'circle',
            img: 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-person-32.png',
            scale: 1.8
          },
          {
            name: 'level-3',
            img: 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-person-32.png',
            container: 'circle',
            scale: 1.2
          },
          {
            name: 'level-4',
            img: 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-person-32.png',
            container: 'circle',
            scale: 1
          },
          {
            name: 'level-5',
            img: 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-person-32.png',
            container: 'circle',
            scale: 0.6
          }
        ];

        var nodeTypesByName = {};
        for ( var ni=0, nlen=nodeTypes.length; ni<nlen; ni++ ) {
          var node = nodeTypes[ni];
          nodeTypesByName[node.name] = node;
          node.index = ni;
        }

        return {
          all: nodeTypes,
          byName: nodeTypesByName
        };
      }
    ])

    /**
     * This directive draws the network diagram.
     */
    .directive('network', ['networkNodeTypes',
      function(nodeTypes) {
        return {
          restrict: 'E',
          scope: {
            height: '@',
            width: '@',
            onLoad: '&',
            onClickNode: '&',
            nodes: '=',
            zoom: '=',
            overlays: '='
          },
          link: function(scope, element) {
            var width = scope.width,
                api;
            if ( width.substring(width.length-1) === '%' ) {
              width = $(element[0]).parent().width() * parseInt(width, 10) / 100;
            }

            scope.$watch('nodes', function(nv) {
              if ( nv ) {
                api = buildGraph( nodeTypes, element[0], scope.width, scope.height, width, nv, scope );
              }
            });

            scope.$watch('zoom', function(nv) {
              api.zoom(nv);
            });

            scope.$watch('overlays', function(nv) {
              api.overlays(nv);
            });
          }
        };
      }
    ]);
})();

