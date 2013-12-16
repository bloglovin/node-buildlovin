//
// # Buildlovin
//
// ## The anatomy of one "app".
//
// One app is a directory that contains one "app.js" main Ember entry point
// script, one (optional) "config.yml" file to describe what shared components
// this particular app uses as well as a few special directories. The special
// directories are:
//
//  * styles: contains css files to be compiled using "bling"
//  * templates: contains handlebars templates
//
// Other directories are used to separate Ember components (routes, models etc)
// into a structured file hierarchy.
//

var fs     = require('fs');
var bling  = require('bling-css');
var uglify = require('uglify-js2');
var path   = require('path');
var clean  = require('clean-css');
var crypto = require('crypto');
var hbscom = require('ember-template-compiler');
var yaml   = require('js-yaml');
var _      = require('lodash');

function buildAppCSS(app, options) {
  // Read each individual file in app/styles
  var appn  = app.split(path.sep).pop();
  var base  = path.join(app, 'styles');
  if (!fs.existsSync(base)) return;
  var files = fs.readdirSync(base).filter(function (file) {
    return (/\.css$/).test(file);
  });

  var css = {};
  files.forEach(function (file) {
    var input = path.join(base, file);
    var data  = fs.readFileSync(input, 'utf8');
    var comp  = bling(data, base);

    // Minify if option not set to false
    if (options.minify !== false) {
      comp = clean({
        keepSpecialComments: 1,
        selectorsMergeMode: 'ie8' // @TODO: Check if really needed
      }).minify(comp);
    }

    css[file] = comp;
  });

  // Write to output dir
  Object.keys(css).forEach(function (key) {
    // Create filename
    var md5 = crypto.createHash('md5');
    md5.update(css[key]);
    var hash = md5.digest('hex');

    var filename = [appn, key.replace('.css', ''), hash].join('-') + '.css';
    fs.writeFileSync(path.join(options.output, filename), css[key], 'utf8');
  });
}

function buildAppJS(app, options) {
  var conf = loadConf(app);
  var appn = app.split(path.sep).pop();

  // Precompile templates
  var templates = path.join(app, 'templates');
  if (!fs.existsSync(templates)) return;
  var toutput   = [];
  var tfiles    = walk(templates).map(function (file) {
    return file.substr(templates.length + 1);
  }).forEach(function (template) {
    var data = fs.readFileSync(path.join(templates, template), 'utf8');
    var comp = hbscom.precompile(data).toString();
    var name = template.replace(/\.(hbs|handlebars)$/, '');
    toutput.push('Ember.TEMPLATES[\'' + name + '\'] = Ember.Handlebars.template(' + comp + ');');
  });

  var tmpfile = options.tmptemplate || '/tmp/bltemplates';
  if (toutput.length) {
    fs.writeFileSync(tmpfile, toutput.join('\n'), 'utf8');
  }

  // Concatenate JavaScript
  var files = walk(app).filter(function (file) {
    // Only include JS-files
    return (/\.js/).test(file);
  });

  if (toutput.length) {
    files.unshift(tmpfile);
  }

  if (typeof conf.defaultVendor === 'undefined' || conf.defaultVendor !== false) {
    var vendor = conf.vendor || {};
    Object.keys(vendor).forEach(function (key) {
      files.unshift(path.resolve(app, '..', vendor[key]));
    });
  }

  var opts = { };
  if (options.srcmaps) {
    opts.outSourceMap = appn + '.map.js';
  }
  var result = uglify.minify(files, opts);

  // Create filename
  var md5 = crypto.createHash('md5');
  md5.update(result.code);
  var hash = md5.digest('hex');
  var filename = [appn, hash].join('-');
  fs.writeFileSync(path.join(options.output, filename + '.js'), result.code, 'utf8');
  if (result.map) {
    fs.writeFileSync(path.join(options.output, filename + '.map.js'), result.map, 'utf8');
  }
}

function buildApp(app, options) {
  buildAppCSS(app, options);
  buildAppJS(app, options);
}

module.exports.buildAppCSS = buildAppCSS;
module.exports.buildAppJS  = buildAppJS;
module.exports.buildApp    = buildApp;

// -- Utilities --

function walk(dir) {
  var results = [];
  fs.readdirSync(dir).forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      results = results.concat(walk(path.join(dir, file)));
    }
    else {
      results.push(path.join(dir, file));
    }
  });

  return results;
}

function loadConf(app) {
  var aconf, conf;

  try {
    aconf = require(path.join(app, 'config.yml'));
  } catch (e) {
    aconf = {};
  }

  try {
    conf  = require(path.resolve(app, '..', 'config.yml'));
  } catch (e) {
    conf = {};
  }

  return _.merge(conf, aconf);
}

