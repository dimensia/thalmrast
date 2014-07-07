'use strict';

describe('Directive E2E: network', function () {

  var ptor = protractor.getInstance();

  beforeEach(function() {
    ptor.get('/#');
  });

  it('should display a graph', function() {

    var svg = $$('network svg');
    expect(svg.count()).toBe(1);
  });

  it('should have 23 nodes and 22 connections', function() {

    var nodes = $$('network g.node');
    expect(nodes.count()).toBe(23);

    var lines = $$('network line');
    expect(lines.count()).toBe(22);
  });

  it('should have 16 images', function() {

    var nodes = $$('network image');
    expect(nodes.count()).toBe(16);
  });

  it('should have 12 circles', function() {

    var nodes = $$('network circle');
    expect(nodes.count()).toBe(12);
  });

  it('should have 3 labels', function() {

    var nodes = $$('network text.label');
    expect(nodes.count()).toBe(3);
  });

  it('should have 3 squares', function() {

    var nodes = $$('network .node rect');
    expect(nodes.count()).toBe(3);
  });
});
