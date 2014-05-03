define([
    'jquery',
    'hammer.jquery',
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
    _hjq,
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

    var pendulumStyles = {
            lineWidth: 3
            ,strokeStyle: colors.greyDark
            ,fillStyle: colors.greyDark
            ,shadowBlur: 1
        }
        ,vectorStyles = {
            strokeStyle: colors.blueDark
            ,fillStyle: colors.blueDark
            ,lineWidth: 2
        }
        ;

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
            clear: function(){
                var bodies = this.getTargets()
                    ,body
                    ;
                for ( var i = 0, l = bodies.length; i < l; ++i ){

                    body = bodies[ i ];
                    body.positionBuffer = [];
                }
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

    var Pendulum = function( world, x, y ){
        this.init( world, x, y );
    };

    Pendulum.prototype = {
        init: function( world, x, y ){
            this.center = Physics.body('circle', {
                x: x
                ,y: y
                ,treatment: 'static'
                ,radius: 5
                ,styles: $.extend({}, pendulumStyles, { fillStyle: colors.blueDark, strokeStyle: colors.blueDark })
            });

            this.constraints = Physics.behavior('verlet-constraints', {
                iterations: 2
            });

            world.add( this.center ).add( this.constraints );
            this.world = world;
            this.bodies = [ this.center ];
        }
        ,addVertex: function( x, y ){

            var l = this.bodies.length;
            var v = { x: x, y: y, vel: { x: 0, y: 0 } };
            var b = Physics.body('circle', {
                x: x
                ,y: y
                ,radius: 5
                ,styles: pendulumStyles
                ,initial: v
            });

            this.bodies.push( b );
            this.world.add( b );
            this.constraints.distanceConstraint( this.bodies[ l - 1 ], b, 0.9 );

            return b;
        }
        ,removeVertex: function(){
            var self = this;
            if ( this.bodies.length > 1 ){
                var b = this.bodies.pop();
                this.world.remove( b );
                var constrs = Physics.util.filter(this.constraints.getConstraints().distanceConstraints, Physics.query({
                    $or: [
                        { bodyA: b }
                        ,{ bodyB: b }
                    ]
                }));
                $.each(constrs, function( i, c ){
                    self.constraints.remove( c );
                });
            }
        }
        ,reset: function(){
            var v, b;
            for ( var i = 1, l = this.bodies.length; i < l; i++ ){
                b = this.bodies[ i ];
                v = b.initial;
                b.state.pos.clone( v );
                b.state.old.pos.clone( v );
                b.state.vel.clone( v.vel );
            }
            return this;
        }
    };

    // Page-level Mediator
    var Mediator = M({

        // Mediator Constructor
        constructor: function(){

            var self = this;
            self.edit = false;
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

            $(function(){
                $('#controls').hammer()
                    .on('touch', '.ctrl-edit', function( e ){
                        e.preventDefault();
                        var $this = $(this);
                        self.edit = !self.edit;

                        $this
                            .html( self.edit ? 'Play' : 'Edit' )
                            .toggleClass('ok', self.edit)
                            .toggleClass('pop', !self.edit)
                            ;

                        self.emit(self.edit ? 'edit' : 'start');
                    })
                    .on('touch', '.ctrl-remove', function( e ){
                        e.preventDefault();
                        self.emit('remove');
                    })
                    ;

                var body;

                $('#viewport').hammer()
                    .on('touch', 'canvas', function( e ){
                        var pos = e.gesture.center;
                        pos = { x: pos.pageX - self.width / 2, y: pos.pageY - self.height/2 };
                        e.preventDefault();
                        if ( self.edit ){

                            body = self.world.findOne({ $at: pos });

                            if ( body ){
                                // pos.body = body;
                                // self.emit( 'grab', pos );
                            } else {

                                self.emit( 'create', pos );
                            }
                        }
                    })
                    .on('dragstart', function( e ){
                        self.emit('grab', body);
                    })
                    .on('drag', function( e ){
                        e.preventDefault();
                        self.emit('drag', e.gesture);
                    })
                    .on('dragend', function( e ){
                        body = false;
                        e.preventDefault();
                        self.emit('release', e.gesture);
                    })
                    ;
            });
        }

        ,initPhysics: function( world ){

            var self = this
                ,vFactor = 200 // scale the velocity rendering
                ,viewWidth = self.width
                ,viewHeight = self.height
                // bounds of the window
                ,viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight)
                ,center = Physics.vector( viewWidth, viewHeight ).mult( 0.5 )
                ,renderer
                ,tracker = Physics.behavior('position-tracker')
                ,startT = Date.now()
                ;

            // create a renderer
            self.renderer = renderer = Physics.renderer('canvas', {
                el: 'physics'
                ,width: viewWidth
                ,height: viewHeight
                ,offset: center
            });

            // add the renderer
            world.add(renderer);

            // resize events
            self.on('resize', function() {

                viewWidth = self.width;
                viewHeight = self.height;

                renderer.el.width = viewWidth;
                renderer.el.height = viewHeight;

                center = Physics.vector( viewWidth, viewHeight ).mult( 0.5 );
                renderer.layer('main').options.offset = center;

            });

            // pendulum
            var pendulum = self.pendulum = new Pendulum( world, 0, 0 );

            self.on({
                create: function( e, pos ){
                    var p = pendulum.addVertex( pos.x, pos.y );
                    tracker.applyTo( pendulum.bodies );
                    // pos.body = p;
                    // self.emit( 'grab', pos );
                }
                ,grab: function( e, body ){
                    var drag;
                    if ( body ){
                        drag = function( e, g ){
                            body.state.vel.set( g.deltaX, g.deltaY ).mult( 1/vFactor );
                            body.initial.vel.x = body.state.vel.x;
                            body.initial.vel.y = body.state.vel.y;
                        };
                        self.on('drag', drag);
                        self.on('release', function( e ){
                            self.off(e.topic, e.handler);
                            self.off('drag', drag);
                        });
                    }
                }
                ,edit: function(){
                    world.pause();
                    setTimeout(function(){
                        world._meta.interpolateTime = 0;
                        pendulum.reset();
                        tracker.clear();
                        Draw.clear( renderer.layer('paths').ctx );
                        world.render();
                    }, 100);
                }
                ,start: function(){
                    world.unpause();
                }
                ,remove: function(){
                    pendulum.removeVertex();
                }
            });

            pendulum.addVertex( 0, 50 );
            pendulum.addVertex( 0, 100 );
            tracker.applyTo( pendulum.bodies );

            function len( x, y, x2, y2 ){
                x -= x2;
                y -= y2;
                return Math.sqrt( x*x + y*y );
            }

            renderer.layer('main').options.zIndex = 2;
            renderer.layer('main').options.offset = center;
            var oldrender = renderer.layer('main').render;
            renderer.layer('main').render = function(){
                var b, p, points = [];
                var t = world._meta.interpolateTime || 0;
                for ( var i = 0, l = pendulum.bodies.length; i < l; i++ ){
                    b = pendulum.bodies[i];
                    points.push([ b.state.pos.x + b.state.vel.x * t , b.state.pos.y + b.state.vel.y * t ]);
                }

                Draw( this.ctx )
                    .offset( center.x, center.y )
                    .clear()
                    .styles( pendulumStyles )
                    .lines( points )
                    ;

                oldrender.call(this, false);

            };

            renderer.addLayer('paths', null, { zIndex: 1, offset: center }).render = function(){
                var b, p;
                for ( var i = 0, l = pendulum.bodies.length; i < l; i++ ){
                    b = pendulum.bodies[i];
                    p = b.positionBuffer;
                    if (!p){ continue; }

                    Draw( this.ctx )
                        .offset( center.x, center.y )
                        ;

                    for ( var j = 0, ll = p.length; j < ll; j+=2 ){
                        Draw
                            .styles('strokeStyle', 'hsl('+ (lerp(100, 4, len( p[j], p[j+1], p[j+2], p[j+3] )/4)|0) +', 81%, 56%)')
                            .line( p[j], p[j+1], p[j+2], p[j+3] )
                            ;
                    }
                    p[0] = p[ll-2];
                    p[1] = p[ll-1];
                    p.length = 2;
                }
            };

            renderer.addLayer('vectors', null, { zIndex: 1, offset: center }).render = function(){
                var b
                    ,p
                    ,scratch = Physics.scratchpad()
                    ,v = scratch.vector()
                    ,int = scratch.vector()
                    ,t = renderer.interpolateTime || 0
                    ,ang
                    ;

                Draw( this.ctx ).offset( 0, 0 ).styles( vectorStyles ).clear();

                for ( var i = 0, l = pendulum.bodies.length; i < l; i++ ){
                    b = pendulum.bodies[i];
                    v.clone( b.state.vel )
                        .mult( vFactor )
                        .vadd( int.clone(b.state.vel).mult(t).vadd(b.state.pos) )
                        .vadd( center )
                        ;

                    Draw
                        .line( center.x + int.x, center.y + int.y, v.x, v.y )
                        ;

                    ang = b.state.vel.angle();
                    this.ctx.translate( v.x, v.y );
                    this.ctx.rotate( ang );
                    Draw.arrowHead( 'right', 0, 0, 5 ).fill();
                    this.ctx.rotate( -ang );
                    this.ctx.translate( -v.x, -v.y );
                }

                scratch.done();
            };

            // add some fun interaction
            var attractor = Physics.behavior('attractor', {
                order: 0,
                strength: 0.002
            });

            // add things to the world
            world.add([
                Physics.behavior('constant-acceleration')
                ,tracker
            ]);

            // subscribe to ticker to advance the simulation
            Physics.util.ticker.on(function( time ) {
                world.step( time );
                world.render();
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
