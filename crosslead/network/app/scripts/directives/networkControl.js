'use strict';

(function() {

  angular.module('clNetwork')
    /**
     * This directive manages the network-maps controls.
     */
    .directive('networkControl', [ 'overlays', 'networkNodeTypes',
      function(overlays, networkNodeTypes) {
        return {
          restrict: 'E',
          templateUrl: 'app/views/networkControl.html',
          scope: {
            network: '='
          },
          controller: function($scope) {
            $scope.networkNodeTypes = networkNodeTypes;

            var network = $scope.network;

            $scope.expanded = false;



            //
            // Controls
            //

            $scope.zoom = 0;

            $scope.zoomIn = function() {
              $scope.zoom = Math.min( $scope.zoom + 1, 2 );
              network.zoom($scope.zoom);
            }

            $scope.zoomOut = function() {
              $scope.zoom = Math.max( $scope.zoom - 1, 0 );
              network.zoom($scope.zoom);
            }


            //
            // Overlays
            //

            $scope.communication = false;

            network.overlays( [] );
 
            $scope.toggleCommunication = function() {
              $scope.communication = !$scope.communication;
              network.overlays( $scope.communication ?
                [ overlays.byName.communication ] :
                []
              )
            }


            //
            // Node Editor and Viewer
            //

            $scope.selected = null;
            $scope.type = null;

            function select(data) {
              data.fixed = !!data.fixed;
              $scope.selected = data;
              $scope.type = data.type;
            }

            network.onClickNode(function(e) {
              if ( e.selected ) {
                select(e.data);
              } else {
                $scope.selected = null;
              }
            });

            function redraw() {
              if ( $scope.selected ) {
                $scope.network.redraw($scope.selected);
              }
            }

            $scope.$watch( 'selected.name', redraw );
            $scope.$watch( 'selected.img', redraw );

            $scope.$watch( 'selected.type', function(type) {
              if ( $scope.selected ) {
                $scope.network.redraw($scope.selected);
              }
            });

            $scope.$watch( 'selected.scale', function(scale) {
              if ( $scope.selected ) {
                //$scope.selected.scale = parseFloat(scale);
                $scope.network.redraw($scope.selected);
                $scope.network.force.resume();
              }
            });

            $scope.$watch( 'selected.fixed', function(nv) {
              if ( $scope.selected ) {
                $scope.selected.fixed = nv;

                if ( !nv ) {
                  $scope.network.force.resume();
                }
              }
            });

            $scope.addNode = function() {
              select( $scope.network.add($scope.selected) );
            }

            $scope.removeNode = function() {
              $scope.network.remove($scope.selected);
              $scope.selected = null;
            }


            //
            // Help Pane
            //

            $scope.fixAll = function() {
              $scope.network.nodes().each(function(d) {
                d.fixed = true;
              });
            }

            $scope.freeAll = function() {
              $scope.network.nodes().each(function(d) {
                delete d[ 'fixed' ];
              });
              $scope.network.force.resume();
            }
          }
        };
      }
    ]);
})();

