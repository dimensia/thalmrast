'use strict';

describe('Directive: network', function () {
  var element,
      $scope;

  beforeEach(module('clNetwork'));

  describe('network with one node', function () {
    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope;

      $scope.nodes = [
        { id: 1000, name: 'CEO', type: 'black-square' }
      ];

      element = angular.element('<network width="100%" height="400" nodes="nodes"></network>');
      $compile(element)($rootScope);
    }));

    it('should create an svg', function () {
      expect(element[0].childNodes.length).toBe(1);
      expect(element[0].childNodes[0].tagName).toBe('svg');
    });

    it('should have 1 node and 0 lines', function () {
      expect(element.find('g.node').length).toBe(1);
      expect(element.find('line').length).toBe(0);
    });
  });

  describe('network with many nodes', function () {
    beforeEach(module('clNetworkDataMock'));
    beforeEach(inject(function($compile, $rootScope, networkData) {
      $scope = $rootScope;

      $scope.nodes = networkData.members();

      element = angular.element('<network width="100%" height="400" nodes="nodes"></network>');
      $compile(element)($rootScope);
    }));

    it('should create an svg', function () {
      expect(element[0].childNodes.length).toBe(1);
      expect(element[0].childNodes[0].tagName).toBe('svg');
    });

    it('should have 23 nodes and 22 lines', function () {
      expect(element.find('g.node').length).toBe(23);
      expect(element.find('line').length).toBe(22);
    });
  });
});
