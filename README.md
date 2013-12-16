# Build System That Doesn't Suck

What we use to build assets for Bloglovin.com

## Requirements
 
 * Should work on server using the same techonologies as the live environment (ie node)
 * Should work well with dev environment
 * Fast and smart watching during dev
   * Don't compile if not needed

## What it needs to do

* Compile Ember templates
* Concatenate and minify JavaScript - generate source maps
* Compile "Bling"
* Handle concept of "many apps" and shared components between those

## Application

An application is a directory with JavaScript files that together makes an
Ember application.


