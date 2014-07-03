'use strict';

angular.module('clNetwork')

  /**
   * This service converts palantir data to network-graph data.
   *
   * TODO:  Eventually this could should probably live on the server-side rather than in the client, but it's in the client for the demo.
   *
   * The general steps taken to convert an XLS ingest file into data supported by the network graph is:
   *
   * 1.  export the ingest data as a CSV file
   * 2.  convert the CSV file to a JSON file with csvtojson (npm install -g csvtojson).
   * 3.  invoke palantir.adapt( json ) on the JSON data
   *
   * Step 3 can be repeated multiple times as the adapt algorithm is modified as we add more fields (the adapt algorithm is idempotent).
   * 
   * Note:  csvtojson can also be invoked from inside node.js, so if this code is moved to the server that step could be incorporated into
   *        this algorithm directly, reducing a manual step.  Furthermore, there is also a node.js xlsjs library which could be hooked up
   *        to directly convert XLS files to JSON files.  So both steps 1 and 2 could be eliminated if this code is moved to the server,
   *        making it possible for end-users to just upload an XLS file.
   *
   * Note:  Currently the data is kept in JSON but I am guessing eventually we will store it in MySQL.  JSON as the final storage medium is only
   *        temporary, for the demo.
   */
  .service('palantir', [
    function() {

      function lower(s) {
        return s.toLowerCase();
      }

      // Example:  detailedMatch( 'John Arthur Doe', 'John Doe' ) returns true
      function detailedMatch( source, match ) {
        var swords = source.split(' ').map(lower),
            mwords = match.split(' ').map(lower);

        return mwords.every(function(word) { return swords.indexOf(word) >= 0; });
      }

      function findByName( metadata, name ) {
        var exact = metadata.indices.name[ name ];
        if ( exact )
          return exact;

        var data = metadata.data;
        for ( var di=0, dlen=data.length; di<dlen; di++ ) {
          var d = data[di];

          if ( detailedMatch(d.name, name) ) {
            return d;
          }
        }

        return null;
      }

      function isExecutive(data) {
        return !data.svp && !data.vp && !data.seniorDirector;
      }

      function parentOf(metadata, data) {
        return data.parent ? metadata.indices.id[ data.parent ] : null;
      }

      function ancestorCount(metadata, data) {
        var c;
        for ( c = 0; data.parent && c < 10; c++ ) {
          data = parentOf(metadata, data);
        }
        return c;
      }


      //
      // Transforms
      //

      function rename(transform, metadata, data) {
        var value = data[ transform.field ];

        if ( value !== undefined ) {
          delete data[ transform.field ];
          data[ transform.rename ] = value;
        }
      }

      /**
       * Converts names like "Doe, John " or "John  Doe" to "John Doe"
       */
      function normalizeName(transform, metadata, data) {
        var name = data[ transform.field ];

        if ( name ) {
          var comma = name.indexOf(',');
          if ( comma >= 0 ) {
            name = name.substring( comma + 1 ).trim() + ' ' + name.substring( 0, comma ).trim();
          } else {
            name = name.trim();
          }

          data[ transform.field ] = name;
        }
      }

      function generateId(transform, metadata, data) {
        var value = data[ transform.field ];

        if ( !value ) {
          if ( !metadata.nextId ) {
            metadata.nextId = ( d3.max( metadata.data, function(d) { return d[ transform.field ]; }) || 0 ) + 1;
          }

          data[ transform.field ] = metadata.nextId++;
        }
      }

      function index(transform, metadata, data) {
        var by = transform.field,
            indices = metadata.indices;

        if ( !indices[ by ] )
          indices[ by ] = {};
        indices[ by ][ data[ by ] ] = data;
      }

      function executives(transform, metadata, data) {
        if ( isExecutive(data) ) {
          if ( data.position.match( /chairman of the board of directors/i ) )
            metadata.chairman = data;
          else if ( data.position.match( /ceo/i ) )
            metadata.ceo = data;
        }
      }

      function setParent(transform, metadata, data) {
        function assign(parent) {
          data.parent = parent.id;
          parent.children = ( parent.children || 0 ) + 1;
        }

        if ( !data.parent ) {
          var fields = transform.fields;
          for ( var fi=0, flen=fields.length; fi<flen; fi++ ) {
            var field = fields[fi];
            var name = data[ field ];

            if ( name ) {
              var parent = findByName(metadata, name);

              if ( parent ) {
                return assign( parent );
              }
            }
          }

          if ( data.position.match( /svp/i ) )
            assign( metadata.ceo );
          else if ( data != metadata.chairman )
            assign( metadata.chairman );
        }
      }

      function setType(transform, metadata, data) {
        if ( !data.type ) {
          var ac = ancestorCount( metadata, data );

          if ( ac <= 1 )
            data.type = 'black-square';
          else if ( ac <= 2 )
            data.type = 'blue-circle';
          else if ( ac <= 3 )
            data.type = 'red-circle';
          else if ( data.children )
            data.type = 'yellow-circle';
          else
            data.type = 'person';

          if ( !data.img && !data.children )
            data.type = 'person';
        }
      }

      var x = 10, y = 10;
      function setGrid(transform, metadata, data) {
        data.x = x;
        data.y = y;
        y += 100;
        if ( y > 1500 ) {
          y = 10;
          x += 40;
        }
      }

      var transforms = [
        { func: rename,        field: 'Business Unit',    rename: 'businessUnit' },
        { func: rename,        field: 'Company - Name',   rename: 'company' },
        { func: rename,        field: 'Department',       rename: 'department' },
        { func: rename,        field: 'Employee Group',   rename: 'employeeGroup' },
        { func: rename,        field: 'Hire Date',        rename: 'hireDate' },
        { func: rename,        field: 'Location',         rename: 'location' },
        { func: rename,        field: 'Name',             rename: 'name' },
        { func: rename,        field: 'Position',         rename: 'position' },
        { func: rename,        field: 'Profession',       rename: 'profession' },
        { func: rename,        field: 'Senior Director',  rename: 'seniorDirector' },
        { func: rename,        field: 'SVP',              rename: 'svp' },
        { func: rename,        field: 'VP',               rename: 'vp' },
        { func: generateId,    field: 'id' },
        { func: normalizeName, field: 'name' },
        { func: normalizeName, field: 'seniorDirector' },
        { func: normalizeName, field: 'svp' },
        { func: normalizeName, field: 'vp' },
        { func: index,         field: 'name' },
        { func: index,         field: 'id' },
        { func: executives },
        { func: setParent,     fields: [ 'seniorDirector', 'vp', 'svp' ] },
        { func: setType,       field: 'type' },
        { func: setType,       field: 'type' },
        { func: setGrid }
      ];

      return {
        /**
         * This function adapts palantir data into network-graph format data in-place idempotently.
         */
        adapt: function( data ) {
          var metadata = { data: data, indices: {} };

          transforms.forEach( function( transform ) {
            data.forEach( function( rec ) {
              transform.func( transform, metadata, rec );
            });
          });

          return data;
        }
      };
    }
  ])

