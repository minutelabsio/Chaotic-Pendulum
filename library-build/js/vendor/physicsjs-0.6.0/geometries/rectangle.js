/**
 * PhysicsJS v0.6.0 - 2014-04-22
 * A modular, extendable, and easy-to-use physics engine for javascript
 * http://wellcaffeinated.net/PhysicsJS
 *
 * Copyright (c) 2014 Jasper Palfree <jasper@wellcaffeinated.net>
 * Licensed MIT
 */

(function(e,t){typeof define=="function"&&define.amd?define(["physicsjs"],t):typeof exports=="object"?module.exports=t.apply(e,["physicsjs"].map(require)):t.call(e,e.Physics)})(this,function(e){return e.geometry("rectangle",function(t){var n={};return{init:function(e){var r=this;t.init.call(this,e),this.options.defaults(n),this.options.onChange(function(e){r.width=r.options.width||1,r.height=r.options.height||1}),this.options(e)},aabb:function(t){if(!t)return e.aabb(this.width,this.height);var n=e.scratchpad(),r=n.vector(),i=n.transform().setRotation(t||0),s=n.vector().set(1,0).rotateInv(i),o=n.vector().set(0,1).rotateInv(i),u=this.getFarthestHullPoint(s,r).proj(s),a=-this.getFarthestHullPoint(s.negate(),r).proj(s),f=this.getFarthestHullPoint(o,r).proj(o),l=-this.getFarthestHullPoint(o.negate(),r).proj(o);return n.done(),e.aabb(a,l,u,f)},getFarthestHullPoint:function(t,n){n=n||new e.vector;var r=t.x,i=t.y;return r=r===0?0:r<0?-this.width*.5:this.width*.5,i=i===0?0:i<0?-this.height*.5:this.height*.5,n.set(r,i)},getFarthestCorePoint:function(e,t,n){var r,i;return t=this.getFarthestHullPoint(e,t),r=t.x,i=t.y,t.x=r===0?0:r<0?r+n:r-n,t.y=i===0?0:i<0?i+n:i-n,t}}}),e});