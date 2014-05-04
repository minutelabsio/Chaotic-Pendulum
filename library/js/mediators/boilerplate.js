define([
    'jquery',
    'hammer.jquery',
    'moddef',
    'jscolor',
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
    _jscolor,
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

    function throttle( fn, delay, scope ){
        var to
            ,call = false
            ,args
            ,cb = function(){
                clearTimeout( to );
                if ( call ){
                    call = false;
                    to = setTimeout(cb, delay);
                    fn.apply(scope, args);
                } else {
                    to = false;
                }
            }
            ;

        scope = scope || null;

        return function(){
            call = true;
            args = arguments;
            if ( !to ){
                cb();
            }
        };
    }

    $.fn.slider = function( opts ){
        var startevent = window.Modernizr.touch ? 'touchstart' : 'mousedown';
        var moveevent = window.Modernizr.touch ? 'touchmove' : 'mousemove';
        var endevent = window.Modernizr.touch ? 'touchend' : 'mouseup';
        var options = $.extend({
            min: 0
            ,max: 1
            ,value: 0.5
        }, opts);

        return $(this).each(function(){
            var $this = $(this).addClass('slider')
                ,factor = options.max - options.min
                ,val = (options.value - options.min) / factor
                ,$handle = $('<div>').appendTo($this).addClass('handle')
                ,$meter = $('<div>').appendTo($this).addClass('meter')
                ;

            function set( x ){
                var width = $this.width();
                if ( x !== undefined ){
                    x = Math.max(0, Math.min(width, x));
                    val = x / width;
                } else {
                    x = val * width;
                }

                $handle.css('left', x);
                $meter.css('width', (val * 100) + '%');

                $this.trigger('change', val * factor + options.min);
            }

            $this.css({
                position: this.style.position || 'relative'
            });

            $meter.css({
                display: 'block'
                ,position: 'absolute'
                ,top: '0'
                ,left: '0'
                ,bottom: '0'
            });

            $handle.css({
                position: 'absolute'
                ,top: '50%'
                ,marginLeft: -$handle.outerWidth() * 0.5
                ,marginTop: -$handle.outerHeight() * 0.5
            });

            var dragging = false;
            var drag = throttle(function( e ){

                if ( dragging ){

                    e.preventDefault();

                    if ( e.originalEvent.targetTouches ){
                        e = e.originalEvent.targetTouches[0];
                    }

                    var offset = $this.offset()
                        ,x = e.pageX - offset.left
                        ,y = e.pageY - offset.top
                        ;

                    set( x );
                }

            }, 20);

            $this.on(startevent, function( e ){
                dragging = true;
                drag( e );
            });
            $this.on(moveevent, drag);
            $this.on(endevent, function(){
                dragging = false;
            });

            $this.on('mousedown', function(){
                return false;
            });

            $this.on('refresh', function( e, v ){
                val = (v - options.min) / factor;
                set();
            });

            set( val * $this.width() );
        });
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
        ,pathStyles = {
            lineWidth: 1
            ,shadowBlur: 2
        }
        ,selectedStyles = {
            lineWidth: 3
            ,strokeStyle: colors.red
            ,fillStyle: colors.red
        }
        ,defaultPathColor = '#b9770b'
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

            this.colors = [ colors.red, colors.blue, colors.yellow, colors.green, colors.grey ];

            this.view = world.renderer().createView( this.center.geometry, pendulumStyles );

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
                ,view: this.view
                ,initial: v
                ,color: this.colors[ l - 1 ] || defaultPathColor
                ,path: true
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
                var ctrls = $('#controls')

                ctrls.hammer()
                    .on('touch', '.ctrl-edit', function( e ){
                        e.preventDefault();
                        var $this = $(this);
                        self.edit = !self.edit;

                        ctrls.toggleClass('edit', self.edit);

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

                                self.emit('select', body);
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

            self.selectedView = renderer.createView( pendulum.center.geometry, selectedStyles );

            self.on({
                create: function( e, pos ){
                    var p = pendulum.addVertex( pos.x, pos.y );
                    tracker.applyTo( pendulum.bodies );
                    self.contextualMenu( p );
                    // pos.body = p;
                    // self.emit( 'grab', pos );
                }
                ,grab: function( e, body ){
                    var drag;
                    if ( body && body.initial ){
                        drag = function( e, g ){
                            body.state.vel.set( g.deltaX, g.deltaY ).mult( 1/vFactor );
                            body.initial.vel.x = body.state.vel.x;
                            body.initial.vel.y = body.state.vel.y;
                        };
                        self.on('drag', drag);
                        self.on('release', function( e ){
                            self.off(e.topic, e.handler);
                            self.off('drag', drag);
                            self.$ctxMenu.show();
                        });
                        self.$ctxMenu.hide();
                    }
                }
                ,select: function( e, body ){
                    if ( body.initial ){
                        self.contextualMenu( body );
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
                    self.contextualMenu( null );
                    world.unpause();
                }
                ,remove: function(){
                    pendulum.removeVertex();
                }
            });

            var first = pendulum.addVertex( 100, 0 )
            first.mass = 20;
            first.state.vel.set( 0, 0.4 );
            first.initial.vel.y = 0.4;
            first.path = false;
            pendulum.addVertex( 200, 0 );
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

                Draw( this.ctx )
                    .offset( center.x, center.y )
                    ;

                for ( var i = 0, l = pendulum.bodies.length; i < l; i++ ){
                    b = pendulum.bodies[i];
                    p = b.positionBuffer;
                    if (!p){ continue; }

                    if ( b.path ){
                        for ( var j = 0, ll = p.length; j < ll; j+=2 ){
                            pathStyles.strokeStyle = pathStyles.shadowColor = b.color;
                            Draw
                                .styles(pathStyles)
                                .line( p[j], p[j+1], p[j+2], p[j+3] )
                                ;
                        }
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

        ,contextualMenu: function( body ){

            var self = this
                ,el = self.$ctxMenu || (self.$ctxMenu = $('#ctx-menu'))
                ,oldBody = el.data('body')
                ;

            if ( oldBody ){
                oldBody.view = oldBody.oldView || oldBody.view;
            }

            if ( !body ){
                el.data('body', null).hide();
                return;
            }

            var x = body.state.pos.x + self.width / 2 + 10
                ,y = body.state.pos.y + self.height / 2 + 10
                ;

            body.oldView = body.view;
            body.view = self.selectedView;

            if ( oldBody === body ){
                el.toggle();
                return;
            }

            el.data('body', body).show().css({
                top: y
                ,left: x
            });

            el.find('#ctrl-mass').trigger('refresh', body.mass);
            el.find('#ctrl-color').val( body.color || defaultPathColor ).css('background', body.color || defaultPathColor);
            el.find('#ctrl-path').toggleClass( 'on', body.path );
        }

        // DomReady Callback
        ,onDomReady: function(){

            var self = this;
            self.width = window.innerWidth;
            self.height = window.innerHeight;
            self.$ctxMenu = $('#ctx-menu');
            var massLabel;
            $('#ctrl-mass').slider({ min: 0.1, max: 100, val: 1 }).on('change', function( e, val ){
                var b = self.$ctxMenu.data('body');
                massLabel.attr( 'data-val', val.toFixed(2) );
                if ( b ){
                    b.mass = val;
                }
            });
            massLabel = $('#ctrl-mass .handle');

            $('#ctrl-color').on('change', function( e ){
                var b = self.$ctxMenu.data('body');
                if ( b ){
                    b.color = $(this).val();
                }
            });

            $('#ctrl-path').hammer().on('touch', function( e ){
                var b = self.$ctxMenu.data('body');
                $(this).toggleClass('on');
                if ( b ){
                    b.path = !!$(this).hasClass('on');
                }
            });


            self.world = Physics( self.initPhysics.bind( self ) );
        }

    }, ['events']);

    return new Mediator();
});
