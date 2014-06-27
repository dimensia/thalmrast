'use strict';

/**
 * Provides testing data for the network diagram.
 */
angular.module('clNetworkDataMock', [])
  .service('networkData', function() {
    var service = this;

    service.members = function() {
      // there is no significance to groups starting at % 1000, it's just done here to make the test data easier to read

      return [
        { id: 1000,               name: 'CEO',                      type: 'black-square', img: 'https://www.apple.com/uk/pr/bios/images/cook_thumb20110204.jpg', root: true },
        { id: 1001, parent: 1000, name: 'Sr VP, Retail',            type: 'blue-circle', img: 'https://www.apple.com/uk/pr/bios/images/ahrendts_thumb.jpg' },
        { id: 1002, parent: 1000, name: 'Sr VP, Design',            type: 'blue-circle', img: 'https://www.apple.com/uk/pr/bios/images/ive_thumb20110204.jpg' },
        { id: 1003, parent: 1000, name: 'Apple',                    type: 'cluster' },
        { id: 1004, parent: 1002, name: 'Sr Designer',              type: 'person' },
        { id: 1005, parent: 1002, name: 'Sr Designer',              type: 'person' },

        { id: 2000, parent: 1000, name: 'Sr Manager',               type: 'red-circle', root: true },
        { id: 2001, parent: 2000, name: 'Sr Representative',        type: 'yellow-circle' }, 
        { id: 2002, parent: 2000, name: 'Sr Representative',        type: 'yellow-circle' }, 
        { id: 2003, parent: 2000, name: 'Sr Representative',        type: 'yellow-circle' }, 

        { id: 3000, parent: 2000, name: 'CEO',                      type: 'blue-square', img: 'http://www.microsoft.com/global/en-us/news/publishingimages/exec/nadella_thumb.png', root: true },
        { id: 3001, parent: 3000, name: 'Sr Representative',        type: 'red-circle' },
        { id: 3002, parent: 3000, name: 'Representative',           type: 'red-circle' },
        { id: 3003, parent: 3000, name: 'Microsoft',                type: 'cluster' },

        { id: 4000, parent: 2000, name: 'CEO',                      type: 'red-circle', img: 'https://lh5.googleusercontent.com/-Hd7tBkTtdAE/UaffxXmYA1I/AAAAAAAAMcc/517pftQN84A/s640/Larry_4x3_use.jpg', root: true },
        { id: 4001, parent: 4000, name: 'Staff Analyst',            type: 'person' },
        { id: 4002, parent: 4000, name: 'Staff Analyst',            type: 'person' },
        { id: 4003, parent: 4000, name: 'Sr Analyst',               type: 'person' },
        { id: 4004, parent: 4000, name: 'Sr Analyst',               type: 'person' },
        { id: 4005, parent: 4000, name: 'Sr Analyst',               type: 'person' },
        { id: 4006, parent: 4000, name: 'Google',                   type: 'cluster' },
        { id: 4007, parent: 4000, name: 'Sr VP, Android',           type: 'red-circle', img: 'https://www.google.com/about/company/images/mgmt-sundar-pichai.jpg', root: true },
        { id: 4008, parent: 4007, name: 'Director, Android Design', type: 'red-circle', img: 'https://lh3.googleusercontent.com/-UxbxdEwXL7Y/AAAAAAAAAAI/AAAAAAAAHIo/ndTyMECeaX0/photo.jpg' },
        { id: 4009, parent: 4008, name: 'Sr Designer',              type: 'person' },
        { id: 4010, parent: 4008, name: 'Sr Designer',              type: 'person' },

        { id: 5000, parent: 2000, name: 'Sr Director',              type: 'blue-square', root: true }
      ];
    };
  });

