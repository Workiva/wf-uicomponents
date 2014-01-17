WebFilings JavaScript UI Components
================================================================================

> Mobile-optimized, composable UI components that support a rich HTML5 user experience.

#### Goals

The goal is to have, by v1.0, a suite of composable objects
inspired by the Spark/Flex 4 component architecture:

- **Viewport**: Clipping container that supprots touch and mouse interactions
to pan, zoom, and swipe content.
- **Scroller**: Decorator for Viewport that adds scroll bars to the container.
- **Lists**: Memory-efficient, fast-performing virtualized lists for rendering any number of items.
- **Layouts**: Vertical, horizontal, tiled and carousel layouts.
- **Renderers**: Pluggable item renderers for rendering any type of content.
- **Transitions**: Customizable transitions between states.


Components
--------------------------------------------------------------------------------

#### AwesomeMap

The AwesomeMap defines a viewport that supports direct interactions via touch and mouse,
and simulated interactions view its public API.
Available interactions include panning, swiping and zooming.

An AwesomeMap is also highly extensible through the use of interceptors.
Interceptors subscribe to events in the AwesomeMap and modify transformations
before they are executed, making it easy to encapsulate transformation behavior.
There are three interceptors provided out of the box:

- **BoundaryInterceptor**: Restricts panning of content to the viewport boundaries.
- **ScaleInterceptor**: Restricts zooming of content to specified scale limits.
- **SwipeInterceptor**: Animates a swipe when swipe events are transformed.

[Demo](https://webfilings.box.com/shared/static/4aj3gfi3u2hmkqueashm.mov)

#### ScrollList

The ScrollList renders a virtualized list of items in its host element.
The list can be scrolled and zoomed using both touch and mouse interactions
or via methods on instances of the object.


Consuming This Library
--------------------------------------------------------------------------------

- Distribution is through bower. _Don't forget to add the version to the end of the URL!_

```bash
# install bower if you haven't already
$ npm install -g bower

# install this package
$ bower install git@github.com:WebFilings/wf-js-uicomponents.git#{version}
```

- In your requirejs configuration, ensure the following config exists
for both wf-js-uicomponents and its dependencies:

```javascript
requirejs.config({
    paths: {
        'wf-js-uicomponents': 'path-to-bower_components/wf-js-uicomponents/src/',
        'wf-js-common': 'path-to-bower_components/wf-js-common/src/',

        hammerjs: 'path-to-bower_components/hammerjs/dist/hammer',
        lodash: 'path-to-bower_components/lodash/dist/lodash',
        modernizr: 'path-to-bower_components/modernizr/modernizr'
    },
    shim: {
        hammerjs: {
            exports: 'Hammer'
        },
        modernizr: {
            exports: 'Modernizr'
        }
    }
});
```


Development: Getting Started
--------------------------------------------------------------------------------

```bash
# clone the repo
$ git clone git@github.com:WebFilings/wf-js-uicomponents.git
$ cd wf-js-uicomponents

# install global tools if you haven't already
$ npm install -g bower
$ npm install -g grunt-cli

# run init script
$ ./init.sh
```

The init script will initialize your local environment
and ensure that you have all global and local dependencies installed.

#### Quality Assurance

##### For Developers

To get started developing:

```bash
# ensure everything is working when checking out a new branch:
$ grunt qa

# setup lint and test watches and serve as you develop:
$ grunt dev
```

##### For QA

There's a special grunt task for you! It will:

- lint the code
- run the tests
- report on code coverage
- generate the API docs
- open the project web site so you can get going fast!

```bash
$ grunt qa
```

_You should run this every time you checkout a branch_.
It will do everything to get you going.

#### Project Structure

- `bower_components` libraries distributed by [Bower][Bower]
- `docs` project design and API documentation
- `examples` sample applications and such
- `node_modules` libraries distributed by [NPM][NPM]
- `out` output from build tasks
- `src` source files
- `test` test files
- `tools` supporting tools for code quality, builds, etc.

#### Managing Dependencies

Familiarize yourself with the package managers we use:

- [NPM][NPM] manages [Node][Node] dependencies.
- [Bower][Bower] manages web dependencies (like jquery, lodash, etc.).


Development: Process
--------------------------------------------------------------------------------

This project uses [wf-grunt](https://github.com/WebFilings/wf-grunt#task-reference).
Please see that repo for more information.

[Node]: http://nodejs.org/api/
[NPM]: https://npmjs.org/
[Bower]: http://bower.io/

