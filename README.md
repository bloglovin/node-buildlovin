# Buildlovin

What we use to build assets for Bloglovin.com

Builds multiple Ember applications and compiles CSS.

## Application Structure

The file structure should look a little something like this:

```
apps/
  config.yml         // Main config, describes what vendor scripts all bundles should include
  _vendor/           // Contains shared third party scripts
  _shared/           // Contains shared "local" scripts and styles
  app_name/          // One app
  foobar/            // Another app
    templates/       // Should contain any handlebar files
    styles/          // Any .css file (not in subdir) here will be compiled using bling
    other/           // Any other folder will be considered part of the Ember
                     // application. Like controllers, models, routes.
                     // Any .js file inside the application dir will be
                     // minified into one file.

    config.yml       // Appliation configuration. Extra vendor scripts etc
```

