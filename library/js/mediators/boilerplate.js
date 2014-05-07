define([
    'jquery',
    'hammer.jquery',
    'moddef',
    'minicolors',
    'vendor/chroma',
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
    _jqminicolors,
    chroma,
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

    var minuteLabsLogo = new Image();
    minuteLabsLogo.src = 'data:image/png;base64,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';

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

        ,'blueFire': '#626ead'

        ,'green': 'rgb(121, 229, 0)'
        ,'greenLight': 'rgb(125, 242, 129)'
        ,'greenDark': 'rgb(64, 128, 0)'

        ,'red': 'rgb(233, 63, 51)'
        ,'redLight': 'rgb(244, 183, 168)'
        ,'redDark': 'rgb(167, 42, 34)'

        ,'orange': 'rgb(239, 132, 51)'
        ,'orangeLight': 'rgb(247, 195, 138)'
        ,'orangeDark': 'rgb(159, 80, 31)'

        ,'yellow': 'rgb(228, 212, 44)'
        ,'yellowLight': 'rgb(242, 232, 110)'
        ,'yellowDark': 'rgb(139, 129, 23)'

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
            lineWidth: 3
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

    Physics.body.mixin({
        'color': function( hex ){
            if ( !hex ){
                return this._color;
            }

            this._color = chroma(hex).hex();
            this.colorScale = getColorScale( this );
        }
    });

    function getColorScale( body ){
        var c = chroma( body._color );

        return function( v ){
            v += 1;
            v *= v;
            v -= 1;
            return c.alpha( Math.max(1 - v/2, 0.1) ).css();
        }
    }

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

            this.colors = [ '#fff', colors.blueFire, colors.red, colors.yellow, colors.green, colors.grey, colors.blue ];

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
                ,radius: 15
                ,view: this.view
                ,initial: v
                ,path: true
            });

            b.color( this.colors[ l - 1 ] || defaultPathColor );
            this.bodies.push( b );
            this.world.add( b );
            this.constraints.distanceConstraint( this.bodies[ l - 1 ], b, 1 );

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
        ,resetConstraints: function(){
            var v, b;
            this.constraints.drop();
            for ( var i = 1, l = this.bodies.length; i < l; i++ ){
                this.constraints.distanceConstraint( this.bodies[ i - 1 ], this.bodies[ i ], 1 );
            }
            return this;
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

            self.on({
                pause: function(){
                    $('#controls .ctrl-pause')
                        .addClass('paused')
                        .html('Unpause')
                        ;
                }
                ,unpause: function(){
                    $('#controls .ctrl-pause')
                        .removeClass('paused')
                        .html('Pause')
                        ;
                }
            })

            $(function(){
                var ctrls = $('#controls')

                ctrls.hammer()
                    .on('touch', '.ctrl-download', function( e ){
                        var img = self.getImage();
                        this.href = img;
                        this.download = 'minutelabs-chaotic-pendulum.png';
                    })
                    .on('touch', '.ctrl-pause', function( e ){
                        e.preventDefault();
                        var $this = $(this)
                            ,paused = $this.hasClass('paused')
                            ;

                        self.emit(paused ? 'unpause' : 'pause');
                    })
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
                    .on('touch', '.ctrl-add', function( e ){
                        e.preventDefault();
                        var on = ctrls.toggleClass('state-add').is('.state-add');
                        $(this).html( on ? 'Done' : 'Add Vertices' );
                        self.addVertex = on;
                        self.contextualMenu( null );
                    })
                    .on('touch', '.ctrl-edit-velocities', function( e ){
                        e.preventDefault();
                        var on = ctrls.toggleClass('state-edit-velocities').is('.state-edit-velocities');
                        $(this).html( on ? 'Done' : 'Velocity Editor' );
                        self.editVelocities = on;
                        self.contextualMenu( null );
                    })
                    ;

                var body;

                $('#viewport').hammer()
                    .on('touchstart', function( e ){
                        e.preventDefault();
                    })
                    .on('touch', 'canvas', function( e ){
                        var pos = e.gesture.center;
                        pos = { x: pos.pageX - self.width / 2, y: pos.pageY - self.height/2 };
                        e.preventDefault();
                        if ( self.edit ){

                            body = self.world.findOne({ $at: pos });

                            if ( body ){
                                // pos.body = body;

                                // self.emit('select', body);
                            } else if ( self.addVertex ) {

                                self.emit( 'create', pos );
                            }
                        }
                    })
                    .on('tap', 'canvas', function( e ){
                        var pos = e.gesture.center;
                        pos = { x: pos.pageX - self.width / 2, y: pos.pageY - self.height/2 };
                        e.preventDefault();
                        if ( self.edit && !self.addVertex ){

                            body = self.world.findOne({ $at: pos });

                            if ( body ){
                                self.emit('select', body);
                            }
                        }
                    })
                    .on('dragstart', 'canvas', function( e ){
                        self.emit('grab', body);
                    })
                    .on('drag', 'canvas', function( e ){
                        e.preventDefault();
                        self.emit('drag', e.gesture);
                    })
                    .on('dragend', 'canvas', function( e ){
                        body = false;
                        e.preventDefault();
                        self.emit('release', e.gesture);
                    })
                    ;
            });
        }

        ,getImage: function(){
            var layers = ['paths']
                ,el = this.renderer.layer('paths').hdel
                ,ctx = this.renderer.hiddenCtx
                ,canvas = this.renderer.hiddenCanvas
                ,opacity
                ,w = el.width
                ,h = el.height
                ;

            canvas.width = w;
            canvas.height = h;
            ctx.fillStyle = colors.deepGreyDark;
            ctx.fillRect( 0, 0, w, h );
            ctx.drawImage( el, 0, 0 );
            ctx.drawImage( minuteLabsLogo, 0, h - 96 );
            Draw( ctx )
                .styles({
                    fillStyle: colors.grey,
                    font: '40px "latin-modern-mono-light", Courier, monospace'
                })
                ;
            ctx.fillText('MinuteLabs.io', 96 + 30, h - 96/2 + 10 )

            // for ( var i = 0, l = layers.length; i < l; ++i ){
            //
            //     el = this.renderer.layer( layers[i] ).el;
            //     opacity = parseFloat(el.style.opacity, 10);
            //     ctx.globalAlpha = isNaN(opacity) ? 1 : opacity;
            //     ctx.drawImage(el, 0, 0);
            // }
            ctx.globalAlpha = 1;
            return canvas.toDataURL('image/png');
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

            // pendulum
            var pendulum = self.pendulum = new Pendulum( world, 0, 0 );

            self.selectedView = renderer.createView( pendulum.center.geometry, selectedStyles );

            self.on({
                resize: function() {

                    var img = renderer.layer('paths').ctx.getImageData(0, 0, viewWidth, viewHeight);
                    var dx = (self.width - viewWidth)/2;
                    var dy = (self.height - viewHeight)/2;

                    viewWidth = self.width;
                    viewHeight = self.height;

                    renderer.resize( viewWidth, viewHeight );

                    renderer.layer('paths').ctx.putImageData( img, dx, dy );

                    center = Physics.vector( viewWidth, viewHeight ).mult( 0.5 );
                    renderer.layer('main').options.offset = center;
                }
                ,create: function( e, pos ){
                    var p = pendulum.addVertex( pos.x, pos.y );
                    tracker.applyTo( pendulum.bodies );
                }
                ,grab: function( e, body ){
                    var drag, orig, vis = self.$ctxMenu.is(':visible');

                    if ( body && body.initial ){
                        if ( self.editVelocities ){

                            drag = function( e, g ){
                                body.state.vel.set( g.deltaX, g.deltaY ).mult( 1/vFactor );
                                body.initial.vel.x = body.state.vel.x;
                                body.initial.vel.y = body.state.vel.y;
                            };

                        } else {
                            orig = body.state.pos.clone();
                            drag = function( e, g ){
                                body.state.pos.set( g.deltaX, g.deltaY ).vadd( orig );
                                body.initial.x = body.state.pos.x;
                                body.initial.y = body.state.pos.y;
                                pendulum.resetConstraints();
                            };
                        }

                        self.on('drag', drag);
                        self.on('release', function( e ){
                            self.off(e.topic, e.handler);
                            self.off('drag', drag);
                            if ( vis ){
                                self.contextualMenu( body );
                            }
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
                    self.emit('pause');
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
                    self.emit('unpause');
                }
                ,pause: function(){
                    world.pause();
                }
                ,unpause: function(){
                    world.unpause();
                }
                ,remove: function(){
                    self.contextualMenu( null );
                    pendulum.removeVertex();
                }
            });

            var first = pendulum.addVertex( 100, 0 )
            first.mass = 20;
            first.state.vel.set( 0, 0.5 );
            first.initial.vel.y = 0.5;
            first.path = false;
            pendulum.addVertex( 240, 0 );
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

            var pathRenderer = renderer.addLayer('paths', null, { zIndex: 1, offset: center });
            pathRenderer.hdel = document.createElement('canvas');
            pathRenderer.hdel.width = viewWidth * 2;
            pathRenderer.hdel.height = viewHeight * 2;
            pathRenderer.hdctx = pathRenderer.hdel.getContext('2d');
            pathRenderer.render = function(){
                var b, p, grad, c, oldc, j, ll;

                Draw( this.ctx )
                    .offset( center.x, center.y )
                    ;

                this.ctx.globalCompositeOperation = 'color-dodge';
                this.hdctx.globalCompositeOperation = 'color-dodge';
                this.hdctx.save();
                this.hdctx.translate( this.hdel.width/4 - center.x, this.hdel.height/4 - center.y );
                this.hdctx.scale( 2, 2 );

                for ( var i = 0, l = pendulum.bodies.length; i < l; i++ ){
                    b = pendulum.bodies[i];
                    p = b.positionBuffer;
                    if (!p){ continue; }

                    ll = p.length;
                    if ( b.path && ll >= 4 ){

                        oldc = b.oldColor;
                        c = b.colorScale( b.state.vel.norm() );
                        grad = this.ctx.createLinearGradient( p[0], p[1], p[ll-2], p[ll-1] );
                        grad.addColorStop( 0, oldc || c );
                        grad.addColorStop( 1, c );
                        pathStyles.strokeStyle = pathStyles.shadowColor = grad || c;

                        Draw( this.ctx )
                            .styles( pathStyles )
                            ;

                        Draw( this.hdctx )
                            .styles( pathStyles )
                            ;

                        b.oldColor = c;

                        for ( j = 0; j < ll - 2; j+=2 ){

                            Draw( this.ctx )
                                .line( p[j], p[j+1], p[j+2], p[j+3] )
                                ;

                            // draw to HD canvas
                            Draw( this.hdctx )
                                .line( p[j], p[j+1], p[j+2], p[j+3] )
                                ;
                        }
                    }

                    p[0] = p[ll-2];
                    p[1] = p[ll-1];
                    p.length = 2;
                }

                this.hdctx.restore();
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
                ,y = body.state.pos.y + self.height / 2 + 20
                ;

            if ( x > (self.width - el.outerWidth()) ){
                x -= (x + el.outerWidth() - self.width + 20);
            }
            if ( y > (self.height - el.outerHeight()) ){
                y -= el.outerHeight() + 20;
            }

            body.oldView = body.view;
            body.view = self.selectedView;

            el.data('body', body).show().css({
                top: y
                ,left: x
            });

            el.find('#ctrl-mass').trigger('refresh', body.mass);
            el.find('#ctrl-color').minicolors( 'value', body.color() );
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

            $('input.color').on('touchstart', function( e ){
                e.preventDefault();
                $(this).focus();
            });

            $('#ctrl-color').minicolors({
                'change': function( hex ){
                    var b = self.$ctxMenu.data('body');
                    if ( b ){
                        b.color(hex);
                    }
                }
            });

            $('#ctrl-path').hammer().on('touch', function( e ){
                var b = self.$ctxMenu.data('body');
                $(this).toggleClass('on');
                if ( b ){
                    b.path = !!$(this).hasClass('on');
                }
            });

            self.$ctxMenu.hammer().on('touch', '.ctrl-close', function( e ){
                e.preventDefault();
                self.contextualMenu( null );
            });


            self.world = Physics( self.initPhysics.bind( self ) );
        }

    }, ['events']);

    return new Mediator();
});
