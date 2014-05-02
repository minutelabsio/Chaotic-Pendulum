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

    var colors = {
        'grey': 'rgb(220, 220, 220)'
        ,'greyLight': 'rgb(237, 237, 237)'
        ,'greyDark': 'rgb(200, 200, 200)'

        ,'deepGrey': 'rgb(67, 67, 67)'
        ,'deepGreyLight': 'rgb(98, 98, 98)'

        ,'blue': 'rgb(40, 136, 228)'
        ,'blueLight': 'rgb(91, 191, 243)'
        ,'blueDark': 'rgb(18, 84, 151)'

        ,'blueGlass': 'rgb(221, 249, 255)'

        ,'green': 'rgb(121, 229, 0)'
        ,'greenLight': 'rgb(125, 242, 129)'
        ,'greenDark': 'rgb(64, 128, 0)'

        ,'red': 'rgb(233, 63, 51)'
        ,'redLight': 'rgb(244, 183, 168)'
        ,'redDark': 'rgb(167, 42, 34)'

        ,'orange': 'rgb(239, 132, 51)'
        ,'orangeLight': 'rgb(247, 195, 138)'
        ,'orangeDark': 'rgb(159, 80, 31)'
    };

    function lerp(a, b, p) {
        return (b-a)*p + a;
    }

    Physics.behavior('position-tracker', function( parent ){

        return {
            connect: function( world ){

                world.on('integrate:positions', this.behave, this, -100);
            },
            disconnect: function( world ){
                world.off('integrate:positions', this.behave);
            },
            behave: function(){
                var bodies = this.getTargets()
                    ,body
                    ,list
                    ;

                for ( var i = 0, l = bodies.length; i < l; ++i ){

                    body = bodies[ i ];
                    list = body.positionBuffer || (body.positionBuffer = []);
                    if ( list.length > 100 ){
                        list.splice( 0, list.length - 100 );
                        list.push(body.state.old.pos.x, body.state.old.pos.y);
                    } else {
                        list.push(body.state.old.pos.x, body.state.old.pos.y);
                    }
                }
            }
        };
    });

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
                ,vx: 1
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

            function len( x, y, x2, y2 ){
                x -= x2;
                y -= y2;
                return Math.sqrt( x*x + y*y );
            }

            renderer.layer('main').options.zIndex = 2;
            renderer.addLayer('paths', null, { zIndex: 1 }).render = function(){
                var b, p;
                for ( var i = 0, l = pendulum.length; i < l; i++ ){
                    b = pendulum[i];
                    p = b.positionBuffer;
                    if (!p){ continue; }

                    for ( var j = 0, ll = p.length; j < ll; j+=2 ){
                        Draw( this.ctx )
                            .styles('strokeStyle', 'hsl('+ (lerp(100, 4, len( p[j], p[j+1], p[j+2], p[j+3] )/4)|0) +', 81%, 56%)')
                            .line( p[j], p[j+1], p[j+2], p[j+3] );
                    }
                    p[0] = p[ll-2];
                    p[1] = p[ll-1];
                    p.length = 2;
                }
            };

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
                ,Physics.behavior('position-tracker').applyTo( pendulum )
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
