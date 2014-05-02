define([
    'jquery',
    'moddef',
    'canvas-draw',
    'physicsjs',
    'physicsjs/renderers/canvas',
    'physicsjs/behaviors/constant-acceleration',
    'physicsjs/behaviors/verlet-constraints',
    'physicsjs/behaviors/attractor',
    'physicsjs/behaviors/interactive',
    'physicsjs/bodies/circle',
    'raf'
], function(
    $,
    M,
    Draw,

    Physics,
    _pjsc,
    _pjsca,
    _pjsvc,
    _pjsat,
    _pjsin,
    _pjscir,
    _raf
) {
    'use strict';

    // Page-level Mediator
    var Mediator = M({

        // Mediator Constructor
        constructor: function(){

            var self = this;
            self.initEvents();

            $(function(){
                self.onDomReady();
                self.resolve('domready');
            });
        }

        // Initialize events
        ,initEvents: function(){

            var self = this;

            window.addEventListener('resize', function(){
                self.width = window.innerWidth;
                self.height = window.innerHeight;
                self.emit('resize');
            }, true);
        }

        ,initPhysics: function( world ){

            var self = this
                ,viewWidth = self.width
                ,viewHeight = self.height
                // bounds of the window
                ,viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight)
                ,center = Physics.vector( viewWidth, viewHeight ).mult( 0.5 )
                ,renderer
                ;

            // create a renderer
            self.renderer = renderer = Physics.renderer('canvas', {
                el: 'physics'
                ,width: viewWidth
                ,height: viewHeight
            });

            // add the renderer
            world.add(renderer);
            // render on each step
            world.on('step', function () {
                world.render();
            });

            // resize events
            self.on('resize', function() {

                viewWidth = self.width;
                viewHeight = self.height;

                renderer.el.width = viewWidth;
                renderer.el.height = viewHeight;

                center = Physics.vector( viewWidth, viewHeight ).mult( 0.5 );
                viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight);

            });

            // for constraints
            var constraints = Physics.behavior('verlet-constraints', {
                iterations: 2
            });

            // the "cloth"
            var pendulum = self.pendulum = [];
            pendulum[0] = Physics.body('circle', {
                x: center.x
                ,y: center.y
                ,treatment: 'static'
                ,radius: 5
                ,styles: '#fff'
            });

            pendulum[1] = Physics.body('circle', {
                x: center.x
                ,y: center.y + 50
                ,radius: 5
                ,styles: '#fff'
            });
            pendulum[2] = Physics.body('circle', {
                x: center.x
                ,y: center.y + 100
                ,radius: 5
                ,styles: '#fff'
            });

            for ( var i = 1, l = pendulum.length; i < l; i++ ){
                constraints.distanceConstraint( pendulum[i-1], pendulum[i], 0.9 );
            }

            // add things to world
            world.add( pendulum );
            world.add( constraints );

            // add some fun interaction
            var attractor = Physics.behavior('attractor', {
                order: 0,
                strength: 0.002
            });

            world.on({
                'interact:poke': function( pos ){
                    attractor.position( pos );
                    world.add( attractor );
                }
                ,'interact:move': function( pos ){
                    attractor.position( pos );
                }
                ,'interact:release': function(){
                    world.remove( attractor );
                }
            });

            // add things to the world
            world.add([
                Physics.behavior('interactive', { el: renderer.el, moveThrottle: 5 })
                ,Physics.behavior('constant-acceleration')
            ]);

            // subscribe to ticker to advance the simulation
            Physics.util.ticker.on(function( time ) {
                world.step( time );
            });

            // start the ticker
            Physics.util.ticker.start();
        }

        // DomReady Callback
        ,onDomReady: function(){

            var self = this;
            self.width = window.innerWidth;
            self.height = window.innerHeight;

            self.world = Physics( self.initPhysics.bind( self ) );
        }

    }, ['events']);

    return new Mediator();
});
