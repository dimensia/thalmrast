
angular.module('clNetworkTest', ['clNetworkDataMock', 'clNetwork'])
  .controller( 'NetworkDemoCtrl', ['$scope', 'networkNodeTypes', 'networkData', 'palantir',
    function($scope, networkNodeTypes, networkData, palantir) {
      $scope.height = Math.round( $(window).height() - 246 );

      $scope.networkNodeTypes = networkNodeTypes;

      if ( true ) {
        d3.json('intuit.json', function(data) {
          $scope.$apply(function() {
            if ( true ) {
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

      $scope.selected = null;
      $scope.nodeType = null;
      $scope.fixed = false;
      $scope.scale = 1.0;
      $scope.zoom = 0;

      $scope.api = null;

      $scope.onLoad = function(api) {
        $scope.api = api;
      }

      function select(member) {
        $scope.selected = member;
        $scope.name = member.name;
        $scope.nodeType = networkNodeTypes.byName[ member.type ];
        $scope.fixed = !!member.fixed;
        $scope.scale = member.scale;
      }

      $scope.onClickNode = function(data) {
        if ( data.type === 'label' ) {
          $scope.selected = null;
          return;
        }

        select(data);
      }

      function redraw() {
        if ( $scope.selected ) {
          $scope.api.redraw($scope.selected);
        }
      }

      $scope.$watch( 'selected.name', redraw );
      $scope.$watch( 'selected.img', redraw );

      $scope.$watch( 'nodeType', function( nv ) {
        if ( $scope.selected && nv !== $scope.selected.type ) {
          $scope.selected.type = nv.name;
          $scope.api.redraw($scope.selected);
        }
      });

      $scope.$watch( 'scale', function( scale ) {
        if ( $scope.selected && scale !== $scope.selected.scale ) {
          $scope.selected.scale = parseFloat(scale);
          $scope.api.redraw($scope.selected);
          $scope.api.force.resume();
        }
      });

      $scope.$watch( 'fixed', function( nv ) {
        if ( $scope.selected && nv !== $scope.selected.type ) {
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
      }

      $scope.zoomIn = function() {
        $scope.zoom = Math.min( $scope.zoom + 1, 2 );
      }

      $scope.zoomOut = function() {
        $scope.zoom = Math.max( $scope.zoom - 1, 0 );
      }
    }
  ]);

