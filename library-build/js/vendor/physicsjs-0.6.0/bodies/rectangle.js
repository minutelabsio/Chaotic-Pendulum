/**
 * PhysicsJS v0.6.0 - 2014-04-22
 * A modular, extendable, and easy-to-use physics engine for javascript
 * http://wellcaffeinated.net/PhysicsJS
 *
 * Copyright (c) 2014 Jasper Palfree <jasper@wellcaffeinated.net>
 * Licensed MIT
 */

(function(e,t){typeof define=="function"&&define.amd?define(["physicsjs","../geometries/rectangle"],t):typeof exports=="object"?module.exports=t.apply(e,["physicsjs","../geometries/rectangle"].map(require)):t.call(e,e.Physics)})(this,function(e){return e.body("rectangle",function(t){var n={};return{init:function(r){t.init.call(this,r),r=e.util.extend({},n,r),this.geometry=e.geometry("rectangle",{width:r.width,height:r.height}),this.recalc()},recalc:function(){var e=this.geometry.width,n=this.geometry.height;t.recalc.call(this),this.moi=(e*e+n*n)*this.mass/12}}}),e});