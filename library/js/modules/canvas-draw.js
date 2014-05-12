define(function(){

    var Pi2 = 2 * Math.PI;
    var context;
    var sqrt2 = Math.sqrt(2);
    var hiddenCanvas = document.createElement('canvas');
    var hiddenCtx = hiddenCanvas.getContext('2d');

    var imgCache = {};
    function getImage( src, cb ){
        if ( src in imgCache ){
            return imgCache[ src ];
        }

        imgCache[ src ] = new Image();
        imgCache[ src ].onload = cb;
        imgCache[ src ].src = src;
        return imgCache[ src ];
    }

    var Draw = function( ctx, width, height ){

        if ( ctx === 'hidden' ){
            ctx = hiddenCtx;
        }

        Draw.ctx = ctx;

        if ( width !== undefined ){
            Draw.ctx.canvas.width = width;
            Draw.ctx.canvas.height = height;
        }
        return Draw;
    };

    Draw.defaultStyles = {
        lineWidth: 1
        ,strokeStyle: 'black'
        ,fillStyle: 'black'
        ,shadowBlur: 0
        ,shadowColor: 'rgba(0,0,0,0)'
        ,lineCap: 'square'
        ,lineJoin: 'round'
    };

    Draw.animThrottle = function( fn, scope ){
        var to
            ,call = false
            ,args
            ,cb = function(){
                window.cancelAnimationFrame( to );
                if ( call ){
                    call = false;
                    to = window.requestAnimationFrame( cb );
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
    };

    Draw.offset = function( x, y ){
        Draw.offset.x = x;
        Draw.offset.y = y;
        return Draw;
    };

    Draw.styles = function( styles, val, ctx ){

        var defs = Draw.defaultStyles
            ,str = typeof styles === 'string'
            ,prop
            ;

        ctx = (str ? ctx : val) || Draw.ctx;

        // resets
        for ( prop in defs ){
            ctx[ prop ] = defs[ prop ];
        }

        if ( ctx.setLineDash ){
            ctx.setLineDash( styles.lineDash || [] );
        }

        if ( str ){

            if ( styles === 'lineDash' ){
                if ( ctx.setLineDash ){
                    ctx.setLineDash( val );
                }
            } else {
                ctx[ styles ] = val;
            }

        } else {

            for ( prop in styles ){
                if ( prop !== 'lineDash' ){
                    ctx[ prop ] = styles[ prop ];
                }
            }
        }

        return Draw;
    };

    Draw.line = function( x, y, x2, y2, length, ctx ){

        var len = typeof length === 'number'
            ,n
            ,ox = Draw.offset.x
            ,oy = Draw.offset.y
            ;

        ctx = (len ? ctx : length) || Draw.ctx;
        x += ox;
        y += oy;
        x2 += ox;
        y2 += oy;

        ctx.beginPath();
        ctx.moveTo(x, y);

        // including length
        if ( len ){
            x2 -= x;
            y2 -= y;
            n = Math.sqrt( x2*x2 + y2*y2 );
            length /= n;
            ctx.lineTo( x2 * length + x, y2 * length + y );
        } else {
            ctx.lineTo(x2, y2);
        }

        ctx.closePath();
        ctx.stroke();

        return Draw;
    };

    Draw.lines = function( points, ctx, closed ){
        ctx = ctx || Draw.ctx;
        if ( typeof ctx !== 'object' ){
            closed = ctx;
            ctx = Draw.ctx;
        }

        var i
            ,p = points[ 0 ]
            ,l = points.length
            ,ox = Draw.offset.x
            ,oy = Draw.offset.y
            ;

        ctx.beginPath();

        if ( typeof p === 'number' ){
            p = points;
            ctx.moveTo( p[0] + ox, p[1] + oy );
            for ( i = 2; i < l-1; i+=2 ){
                ctx.lineTo( p[i] + ox, p[i+1] + oy );
            }
        } else if ( p.length <= 2 ){
            ctx.moveTo( p[0] + ox, p[1] + oy );
            for (i = 1; i < l; i++ ){
                p = points[ i ];
                ctx.lineTo( p[0] + ox, p[1] + oy );
            }
        } else {

            for (i = 0; i < l; i++ ){
                p = points[ i ];
                ctx.moveTo( p[0] + ox, p[1] + oy );
                ctx.lineTo( p[2] + ox, p[3] + oy );
            }
        }


        if ( closed ){
            ctx.closePath();
        }
        ctx.stroke();

        return Draw;
    };

    Draw.circle = function( x, y, r, ctx ){

        Draw.arc( x, y, r, Pi2, ctx );

        return Draw;
    };

    Draw.arc = function( x, y, r, ang, ctx ){

        var ox = Draw.offset.x
            ,oy = Draw.offset.y
            ;

        ctx = ctx || Draw.ctx;

        x += ox;
        y += oy;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, ang, false);
        ctx.closePath();
        ctx.stroke();

        return Draw;
    };

    Draw.rect = function( x, y, x2, y2, ctx ){

        var ox = Draw.offset.x
            ,oy = Draw.offset.y
            ;

        ctx = ctx || Draw.ctx;

        ctx.fillRect( x + ox, y + oy, x2-x, y2-y );

        return Draw;
    };

    // only draws half of the first and last line so the line joins are nice and smooth
    Draw.continuousPath = function( points, ctx ){
        ctx = ctx || Draw.ctx;

        var i
            ,prev
            ,p = points[ 0 ]
            ,l = points.length
            ,ox = Draw.offset.x
            ,oy = Draw.offset.y
            ;

        ctx.beginPath();

        if ( typeof p === 'number' ){
            p = points;
            // start at midpoint between first and second dot
            ctx.moveTo( (p[0] + p[ 2 ]) * 0.5 + ox, (p[1] + p[3]) * 0.5 + oy );
            for ( i = 2; i < l-3; i+=2 ){
                ctx.lineTo( p[i] + ox, p[i+1] + oy );
            }

            // draw half the last line
            ctx.lineTo( (p[ i - 2 ] + p[ i ]) * 0.5 + ox, (p[ i - 1 ] + p[ i + 1 ]) * 0.5 + oy );

        } else if ( p.length <= 2 ){
            // start at midpoint between first and second dot
            prev = p;
            p = points[ 1 ];
            ctx.moveTo( (prev[0] + p[0]) * 0.5 + ox, (prev[1] + p[1]) * 0.5 + oy );
            for (i = 1; i < l-2; i++ ){
                p = points[ i ];
                ctx.lineTo( p[0] + ox, p[1] + oy );
            }

            prev = p;
            p = points[ i ];
            ctx.moveTo( (prev[0] + p[0]) * 0.5 + ox, (prev[1] + p[1]) * 0.5 + oy );
        }

        ctx.stroke();

        return Draw;
    };

    Draw.quadratic = function( x1, y1, x2, y2, cx, cy, ctx ){

        var ox = Draw.offset.x
            ,oy = Draw.offset.y
            ;

        ctx = ctx || Draw.ctx;
        cx = cx === undefined ? (x1+x2) * 0.5 + ox : cx + ox;
        cy = cy === undefined ? (y1+y2) * 0.5 + oy : cy + oy;

        x1 += ox;
        y1 += oy;
        x2 += ox;
        y2 += oy;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();

        return Draw;
    };

    Draw.arrowHead = function( dir, x, y, size, ctx ){

        var flip = dir === 'left' || dir === 'up' ? -1 : 1;

        size = size || 5;

        if ( dir === 'up' || dir === 'down' ){
            Draw.lines([
                [ x, y + flip * size ]
                ,[ x + size / sqrt2, y - flip * size / sqrt2 ]
                ,[ x - size / sqrt2, y - flip * size / sqrt2 ]
            ], ctx, true);
        } else {
            Draw.lines([
                [ x + flip * size, y ]
                ,[ x - flip * size / sqrt2, y - size / sqrt2 ]
                ,[ x - flip * size / sqrt2, y + size / sqrt2 ]
            ], ctx, true);
        }

        return Draw;
    };

    Draw.text = function( text, x, y, ctx ){

        var ox = Draw.offset.x
            ,oy = Draw.offset.y
            ;

        ctx = ctx || Draw.ctx;

        ctx.fillText( text, x + ox, y + oy );

        return Draw;
    };

    Draw.image = function( src, x, y, width, height, ctx ){

        var ox = Draw.offset.x
            ,oy = Draw.offset.y
            ;

        x += ox;
        y += oy;

        if ( typeof src === 'string' ){
            src = getImage( src );
        }

        ctx = (typeof width === 'number' ? ctx : width) || Draw.ctx;

        ctx.drawImage( src, x - width/2, y - height/2, width, height );

        return Draw;
    };

    Draw.preload = function( src, cb ){
        var i, l, done;

        if ( typeof src === 'string' ){

            getImage( src, cb );

        } else if ( src.length ){

            done = function(){
                if ( (done.count--) <= 0 ){
                    cb();
                }
            };
            done.count = src.length;
            // assume an array
            for ( i = 0, l = done.count; i < l; i++ ){
                getImage( src[i], done );
            }
        }

        return Draw;
    };

    Draw.fill = function( ctx ){
        ctx = ctx || Draw.ctx;

        ctx.fill();
        return Draw;
    };

    Draw.stroke = function( ctx ){
        ctx = ctx || Draw.ctx;

        ctx.stroke();
        return Draw;
    };

    Draw.clear = function( ctx ){
        ctx = ctx || Draw.ctx;
        var c = ctx.canvas;

        ctx.clearRect( 0, 0, c.width, c.height );
        return Draw;
    };

    return Draw.offset( 0, 0 );
});
