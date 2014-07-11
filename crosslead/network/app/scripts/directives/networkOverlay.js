'use strict';

(function() {
  angular.module('clNetwork')

    /**
     * This service provides overlays for the network-map.
     */
    .service('overlays', [
      function() {

        /*
         * Node Types
         *
         * These node type names are also the CSS classes that are applied to each node, so update the sass if
         * new node types are added.
         */

        var overlays = [
          {
            name: 'communication',
            activate: function(api) {
              var max = 0;
              api.nodes()
                .filter(function(d) {
                  var c = d.communications;
                  if ( c > max ) {
                    max = c;
                  }
                  return c;
                })
                .transition()
                .duration(1000)
                .select('circle')
                  .attr('stroke', function(d) { return d3.interpolateLab('#ffff00','#ff0000')(d.communications/max); })
                  .attr('fill', function(d) { return d3.interpolateLab('#ffff00','#ff0000')(d.communications/max*0.7); });

              api.nodes()
                .filter(function(d) { return !d.communications; })
                .attr('opacity',1)
                .transition()
                .duration(1000)
                .attr('opacity',0.5);

              api.svg.selectAll('.link')
                .attr('opacity',1)
                .transition()
                .duration(1000)
                .attr('opacity',0.2);
            },
            deactivate: function(api) {
              api.nodes()
                .transition()
                .duration(1000)
                .attr('opacity', 1)
                .select('circle')
                  .attr('stroke', function(d) { return '#000'; })
                  .attr('fill', function(d) { return '#fff'; });

              api.svg.selectAll('.link')
                .transition()
                .duration(1000)
                .attr('opacity',1);
            }
          },
        ];

        var overlaysByName = {};
        for ( var ni=0, nlen=overlays.length; ni<nlen; ni++ ) {
          var overlay = overlays[ni];
          overlaysByName[overlay.name] = overlay;
        }

        return {
          all: overlays,
          byName: overlaysByName
        };
      }
    ])
})();

