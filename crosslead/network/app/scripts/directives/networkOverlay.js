'use strict';

(function() {
  var duration = 1500;


  //
  // Communication Overlay
  //

  function CommunicationOverlay(network) {
    this.network = network;
  }

  CommunicationOverlay.prototype = {
    heatColors: d3.interpolateLab('#ffff00','#ff0000'),
    analyze: function() {
      var network = this.network,
          data = network.data,
          llen = d3.sum(data, function(d) {
            var mc = data.mostCommunicated;
            return mc ? mc.length : 0;
          }),
          links = new Array( llen ),
          nextLink = 0;

      for ( var di=0, dlen=data.length; di<dlen; di++ ) {
        var d = data[ di ],
            mc = d.mostCommunicated;

        if ( mc ) {
          mc.forEach(function(id) {
            var target = network.dataById[id];

            if ( target ) {
              links[ nextLink++ ] = {
                source: target,
                target: d,
                value: 1, // TODO
                level: Math.max( target.level || 0, d.level || 0 )
              };

              target.communications = ( target.communications || 0 ) + 1;
            }
          });
        }
      }

      this.links = links;
    },
    activate: function() {
      var overlay = this,
          network = overlay.network;

      if ( !this.links ) {
        this.analyze();
      }


      var max = 0;
      network.nodes()
        .filter(function(d) {
          var c = d.communications;
          if ( c > max ) {
            max = c;
          }
          return c;
        })
        .each(function(d) {
          var sel = d3.select(this);

          var rg = sel.append('radialGradient')
            .attr('id', 'mcglow' + d.id)
            .attr('class', 'mcglow');

          rg.append('stop')
            .attr('class', 'color')
            .attr('offset', '50%')
            .attr('stop-color', '#ffffff');

          rg.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#888')
            .attr('stop-opacity', 0);

          sel.select('circle').attr('fill', 'url(#mcglow' + d.id + ')' );
        })
        .select('.color')
          .transition()
          .duration(1000)
          .attr('stop-color', function(d) { return overlay.heatColors(d.communications/max); })

      network.nodes()
        .filter(function(d) { return !d.communications; })
        .attr('opacity',1)
        .transition()
        .duration(1000)
        .attr('opacity',0.5);

      network.svg.selectAll('.link')
        .attr('opacity',1)
        .transition()
        .duration(1000)
        .attr('opacity',0.2);

      this.$links = network.svg.selectAll('line.commLink');
      this.$links = this.$links.data(this.links, function(d) { return d.source.id + '-' + d.target.id; });
      this.$links.enter()
        .insert('line', '.node')
          .attr('class', 'commLink')
          .attr('stroke', function(d) { return overlay.heatColors(d.source.communications/max); })

      network.expandLinks(this.$links.filter(function(d) { return d.level <= network.zoomLevel; }), 0, duration );
    },
    deactivate: function() {
      var overlay = this,
          network = overlay.network;

      network.nodes()
        .transition()
        .duration(1000)
        .attr('opacity', 1)
        .select('.color')
          .attr('stop-color', function(d) { return '#fff'; });

      network.svg.selectAll('.link')
        .transition()
        .duration(1000)
        .attr('opacity',1);

      network.collapseLinks(overlay.$links.filter(function(d) { return d.level <= network.zoomLevel; }), 0, duration );
      setTimeout(function() {
        overlay.$links.remove();
        network.$el.find('.mcglow').remove();
        network.$el.find('g.node circle').attr('fill', 'url(#glowGrad)');
      }, duration );
    },
    zoom: function(level) {
      var overlay = this,
          network = overlay.network;

      if ( level > network.zoomLevel ) {
        network.expandLinks( overlay.$links.filter(function(d) { return d.level === level; }), 0, duration);
      } else {
        network.collapseLinks( overlay.$links.filter(function(d) { return d.level === network.zoomLevel; }), 0, duration);
      }
    }
  }

  angular.module('clNetwork')

    /**
     * This service provides overlays for the network-map.
     */
    .service('overlays', [
      function() {

        var overlays = [
          {
            name: 'communication',
            cls: CommunicationOverlay
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

