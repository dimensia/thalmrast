
angular.module('clNetworkTest', ['clNetworkDataMock', 'clNetwork'])
  .controller( 'NetworkDemoCtrl', ['$scope', 'networkNodeTypes', 'networkData', 'palantir',
    function($scope, networkNodeTypes, networkData, palantir) {
      $scope.height = Math.round( $(window).height() - 20 );

      $scope.networkNodeTypes = networkNodeTypes;

      var params = {};
      window.location.search.substring(1).split('&').forEach(function(pair) {
        var nv = pair.split('=');
        params[ nv[0] ] = nv[1];
      });

      var dataset = params.dataset || 'intuit';
      if ( dataset !== 'test' ) {

        d3.json(dataset + '.json', function(data) {
          $scope.$apply(function() {
            // crude test to see if the data has been preprocessed already
            if ( data[0].x && !params.palantir ) {
              $scope.nodes = data;
            } else {
              $scope.nodes = palantir.adapt(data);
            }
            window.demoNodes = $scope.nodes;
          });
        });
      } else {
        $scope.nodes = networkData.members();
      }

      $scope.help = false;

      $scope.selected = null;
      $scope.type = null;
      $scope.zoom = 0;

      $scope.api = null;

      $scope.onLoad = function(api) {
        $scope.api = api;
      }

      function select(data) {
        data.fixed = !!data.fixed;
        $scope.selected = data;
        $scope.type = data.type;
      }

      $scope.onClickNode = function(data, i, selected) {
        if ( selected ) {
          select(data);
        } else {
          $scope.selected = null;
        }
      }

      function redraw() {
        if ( $scope.selected ) {
          $scope.api.redraw($scope.selected);
        }
      }

      $scope.$watch( 'selected.name', redraw );
      $scope.$watch( 'selected.img', redraw );

      $scope.$watch( 'selected.type', function(type) {
        if ( $scope.selected ) {
          $scope.api.redraw($scope.selected);
        }
      });

      $scope.$watch( 'selected.scale', function( scale ) {
        if ( $scope.selected ) {
          $scope.selected.scale = parseFloat(scale);
          $scope.api.redraw($scope.selected);
          $scope.api.force.resume();
        }
      });

      $scope.$watch( 'selected.fixed', function( nv ) {
        if ( $scope.selected ) {
          $scope.selected.fixed = nv;

          if ( !nv ) {
            $scope.api.force.resume();
          }
        }
      });

      $scope.fixAll = function() {
        $scope.api.nodes().each(function(d) {
          d.fixed = true;
        });
      }

      $scope.freeAll = function() {
        $scope.api.nodes().each(function(d) {
          delete d[ 'fixed' ];
        });
        $scope.api.force.resume();
      }

      $scope.addNode = function() {
        select( $scope.api.add($scope.selected) );
      }

      $scope.removeNode = function() {
        $scope.api.remove($scope.selected);
        $scope.selected = null;
      }

      $scope.zoomIn = function() {
        $scope.zoom = Math.min( $scope.zoom + 1, 2 );
      }

      $scope.zoomOut = function() {
        $scope.zoom = Math.max( $scope.zoom - 1, 0 );
      }
    }
  ]);

