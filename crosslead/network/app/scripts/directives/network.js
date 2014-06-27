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



  /**
   * This function creates nodes and links for the D3 graph out of member data.
   */
  function membersToNetworkModel(nodes) {
    var nlen = nodes.length,
        maxId = 0,
        nodesById = {},
        node;

    var nextGroup = 1;
    for ( var ni=0; ni<nlen; ni++ ) {
      node = nodes[ ni ];

      nodesById[ node.id ] = node;

      if ( node.id > maxId ) {
        maxId = node.id;
      }

      if ( node.root ) {
        node.group = nextGroup++;
      }
    }

    var links = new Array( nlen - 1 );
    for ( var li=1; li<nlen; li++ ) {
      node = nodes[ li ];

      var parent = nodesById[ node.parent ];

      var link = {
        source: node,
        target: parent,
        value: 1 // TODO
      };

      if ( node.type === 'cluster' ) {
        link.cluster = true;
      }

      links[ li-1 ] = link;

      if ( !node.group ) {
        node.group = parent.group;
      }
    }

    return {
      nodes: nodes,
      links: links,
      nextId: maxId + 1
    };
  }

  function buildGraph(nodeTypes, networkEl, width, height, pixelWidth, members, scope) {

    /**
     * This updates the DOM SVG "g" node with the DOM elements for the given data object node (member).
     */
    function addNode( g, member ) {
      var type = nodeTypes.byName[ member.type ];

      if ( type ) {
        var imgHref = type.img || member.img;

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
            img.setAttribute('x',-27);
            img.setAttribute('y',-27);
            img.setAttribute('width',54);
            img.setAttribute('height',54);
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
      if ( !type ) {
        y = 0;
      } else if ( type.container === 'square' ) {
        y = 36;
      } else if ( type.container === 'circle' ) {
        y = ( member.img || type.img ) ? 36 : 22;
      } else {
        y = 24;
      }
      text.setAttribute('y', y);
      text.setAttribute('class', member.type === 'cluster' ? 'cluster' : null );
      text.setAttribute('text-anchor', 'middle');
      text.appendChild(document.createTextNode(member.name));
      g.appendChild(text);
    }

    function buildNode( member ) {
      var g = createSvg('g');
      addNode(g, member);
      return g;
    }

    var baseSvg = d3.select(networkEl)
      .append('svg')
        .attr('width', width )
        .attr('height', height);

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

    var svg = baseSvg
      .call(
        d3.behavior.zoom()
          .scaleExtent([0.25, 8])
          .on('zoom', function() {
            svg.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
          }))
      .append('g');

    var graph = membersToNetworkModel( members );

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

    var drag = force.drag()
      .on('dragstart', function(d) {
        d3.event.sourceEvent.stopPropagation(); // prevent zoom/pan

        d.fixed = true;
      });

    var links = svg.selectAll('.link');
    var nodes = svg.selectAll('.node');

    function sync() {
      links = links.data(force.links().filter(function(d) { return !d.cluster; }), function(d) { return d.source.id + '-' + d.target.id; });
      links.enter()
        .insert('line', '.node') // insert lines before nodes so that they are beneath the nodes
          .attr('class', 'link');
      links.exit()
        .remove();

      nodes = nodes.data(force.nodes(), function(d) { return d.id; });
      nodes.enter()
        .append(buildNode)
        .call(drag);
      nodes.exit()
        .remove();

      if (scope.onClickNode) {
        nodes.on('click', function(member, i) {
          if (d3.event.defaultPrevented) {
            return;
          }

          scope.$apply(function() {
            scope.onClickNode({
              member: member,
              i: i
            });
          });
        }); 
      }

      force.start();
    }

    sync();

    force.on('tick', function() {
      links
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

      nodes
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')' + ( d.scale ? 'scale(' + d.scale + ')' : '' ); });
    });

    if (scope.onLoad) {
      scope.onLoad({

        /**
         * This object is the API external clients can use to manipulate the network graph.
         */
        api: {
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
              while (g.firstChild) {
                g.removeChild(g.firstChild);
              }
              addNode(g, node);
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
              type: source.type
            };

            force.nodes().push(node);
            force.links().push({
              source: source,
              target: node,
              weight: 1
            });
            sync();

            return node;
          }
        }
      });
    }
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
            name: 'black-square',
            container: 'square',
          },
          {
            name: 'blue-square',
            container: 'square'
          },
          {
            name: 'blue-circle',
            container: 'circle'
          },
          {
            name: 'red-circle',
            container: 'circle'
          },
          {
            name: 'yellow-circle',
            container: 'circle'
          },
          {
            name: 'person',
            img: 'http://png-4.findicons.com/files/icons/61/dragon_soft/128/user.png'
          },
          {
            name: 'blue-person',
            img: 'http://png-4.findicons.com/files/icons/61/dragon_soft/128/user.png',
            container: 'square'
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
            nodes: '='
          },
          link: function(scope, element) {
            var width = scope.width;
            if ( width.substring(width.length-1) === '%' ) {
              width = $(element[0]).parent().width() * parseInt(width, 10) / 100;
            }

            buildGraph( nodeTypes, element[0], scope.width, scope.height, width, scope.nodes, scope );
          }
        };
      }
    ]);
})();

