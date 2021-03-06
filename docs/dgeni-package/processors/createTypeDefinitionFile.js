var _ = require('lodash');
var path = require('canonical-path');

module.exports = function createTypeDefinitionFile(log) {

  return {
    $runAfter: ['processing-docs'],
    $runBefore: ['docs-processed'],
    $validate: {
      dtsPath: { presence: true },
      dtsExtension: { presence: true },
      typeDefinitions: { presence: true }
    },
    dtsPath: 'typings',
    dtsExtension: '.d.ts',
    typeDefinitions: [
      {
        id: 'angular2/angular2',
        modules: {
          // The shape of the public API is determined by what is reexported into
          // angular2/angular2, with hacks layered into angular2.api.ts
          'angular2/angular2': 'angular2/angular2.api',
        }
      },
      {
        id: 'angular2/router',
        modules: {
          'angular2/router': 'angular2/router'
        }
      }
    ],
    $process: function(docs) {
      var dtsPath = this.dtsPath;
      var dtsExtension = this.dtsExtension;

      // For each type definition that we wish to create we define a dgeni "doc" for it
      var typeDefDocs = _.map(this.typeDefinitions, function(def) {

        var id = def.id + dtsExtension;
        var docPath = path.join(dtsPath, id);

        return {
          docType: 'type-definition',
          id: id,
          aliases: [id],
          path: docPath,
          outputPath: docPath,
          // A type definition may include a number of top level modules
          // And those modules could be aliased (such as 'angular2/angular2.api' -> 'angular2/angular2')
          moduleDocs: _.transform(def.modules, function(moduleDocs, id, alias) {
            moduleDocs[id] = { id: alias, doc: null };
          })
        };
      });

      // Now add all the module docs to their corresponding type definition doc
      _.forEach(docs, function(doc) {
        _.forEach(typeDefDocs, function(typeDefDoc) {
          if(typeDefDoc.moduleDocs[doc.id]) {
            // Add a copy, because we are going to modify it
            typeDefDoc.moduleDocs[doc.id].doc = doc;
          }
        });
      });

      _.forEach(typeDefDocs, function(doc) {
        _.forEach(doc.moduleDocs, function(modDoc, alias) {
          if (!modDoc.doc) {
            log.error('createTypeDefinitionFile processor: no such module "' + alias + '" (Did you forget to add it to the modules to load?)');
            doc = null;
          }
          _.forEach(modDoc.doc.exports, function(exportDoc) {

            // Search for classes with a constructor marked as `@private`
            if (exportDoc.docType === 'class' && exportDoc.constructorDoc && exportDoc.constructorDoc.private) {

              // Convert this class to an interface with no constructor
              exportDoc.docType = 'interface';
              exportDoc.constructorDoc = null;

              // Add the `declare var SomeClass extends InjectableReference` construct
              modDoc.doc.exports.push({
                docType: 'var',
                name: exportDoc.name,
                id: exportDoc.id,
                heritage: ': InjectableReference'
              });
            }
          });
        });
        if (doc) {
          docs.push(doc);
        }
      });
    }
  };
};
