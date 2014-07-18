
angular.module('clNetworkTest', ['clNetworkDataMock', 'clNetwork', 'ngAnimate'])
  .controller('NetworkDemoCtrl', ['$scope', 'networkData', 'palantir', '$window',
    function($scope, networkData, palantir, $window) {
      $scope.height = Math.round($(window).height());
      $scope.network = null;

      function updateSize() {
        $scope.$apply(function() {
          $scope.height = Math.round($(window).height());
        });
      }

      window.onorientationchange = window.onresize = function() {
        updateSize();
        setTimeout(updateSize, 50);
      }

      var params = {};
      window.location.search.substring(1).split('&').forEach(function(pair) {
        var nv = pair.split('=');
        params[nv[0]] = nv[1];
      });

      var dataset = params.dataset || 'intuit';
      var groupDataset = params.groupDataset || 'intuitGroups';
      // Only do group mappings if explicitly set. No easy crude
      // check since not all nodes are in groups
      var groupMappings = params.groupMapping;
      if (dataset !== 'test') {

        async.parallel({
            nodes: function(callback) {
              d3.json(dataset + '.json', function(data) {
                // crude test to see if the data has been preprocessed already
                if (data[0].x && !params.palantir) {
                  callback(null, data);
                } else {
                  callback(null, palantir.adapt(data));
                }
              });
            },
            groups: function(callback) {
              d3.json(groupDataset + '.json', function(groupData) {
                callback(null, groupData);
              });
            }
          },
          function(err, results) {
            if (err) {
              throw new Error(err);
            } else {
              // Now we've processed both nodes and groups. See if we should do mappings.
              $scope.groups = results.groups;
              if (groupMappings) {
                d3.json(groupMappings + '.json', function(mappings) {
                  $scope.$apply(function() {
                    $scope.nodes = palantir.mapNodeGroups(results.nodes, mappings);
                    window.demoNodes = $scope.nodes;
                  });
                });
              } else {
                $scope.$apply(function() {
                  $scope.nodes = results.nodes;
                  window.demoNodes = $scope.nodes;
                });
              }
            }
          }
        );
      } else {
        $scope.nodes = networkData.members();
      }

      $scope.network = null;

      $scope.onLoad = function(network) {
        $scope.network = network;
      }
    }
  ]);
