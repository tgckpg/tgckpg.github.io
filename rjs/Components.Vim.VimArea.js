(function(){var BOTANJS_VERSION = "1.0.0b";
/*{{{ Shorthand Functions */
var __extends = function( obj, target ) {
	obj.prototype = Object.create( target.prototype );
	obj.prototype.constructor = obj;
};
var __readOnly = function( prototype, name, callback )
{
	Object.defineProperty( prototype, name, {
		get: callback
		, set: function( v ) {
			throw new Error( "Setting a read-only property: " + this.p );
		}.bind( { p: name } )
	} );
};
var __getter = function( obj, name, callback )
{
	Object.defineProperty( obj, name, {
		get: callback
		, set: function( v ) {
			throw new Error( "Setting a read-only property: " + this.p );
		}.bind( { p: name } )
	} );
};
var __static_method = function( obj, name, callback )
{
	Object.defineProperty( obj, name, {
		get: function(){ return callback; }
		, set: function( v ) {
			throw new Error( "Setting a read-only property: " + this.p );
		}.bind( { p: name } )
	} );
};
var __const = __static_method;
/* End Shorthand Functions }}}*/

/*{{{ BotanEvent & EventDispatcher */
var BotanEvent = function( name, data )
{
	var __propagating = false;
	var __propagated = false;

	__static_method(
	   this, "propagate"
	   , function()
	   {
		   if( !__propagated )
		   {
			   __propagating = true;
		   }
		   __propagated = true;
	   }
	);

	__static_method(
	   this, "stopPropagating"
	   , function()
	   {
		   __propagating = false;
	   }
	);

	__const( this, "type", name );

	__getter(
		this, "propagating"
		, function()
		{
			return __propagating;
		}
	);

	__const( this, "data", data );

	this.setTarget = function( target )
	{
		__const( this, "target", target );
		this.setTarget = undefined;
	}.bind( this );
};

/** @constructor
 *  @extends EventTarget
 **/
var EventDispatcher = function() {
	var events = {};
	var _self = this;

	var getStack = function( name )
	{
		if( !events[ name ] ) events[ name ] = [];
		return events[ name ];
	};

	var _dispatch = function()
	{
		this.evt.propagate();
		for( var i in this.stack )
		{
			if( this.evt.propagating )
			{
				this.stack[ i ]( this.evt );
			}
		}
		this.evt.stopPropagating();
	};

	this.addEventListener = function( type, handler )
	{
		var stack = getStack( type );
		stack[ stack.length ] = handler;
	};

	this.removeEventListener = function( type, handler )
	{
		var stack = getStack( type );
		var i = stack.indexOf( handler );
		if( i < 0 ) return;
		delete stack[ i ];
	};

	/** @type {Function}
	 *  @param {BotanEvent} evt
	 */
	this.dispatchEvent = function( _evt )
	{
		var _stack = getStack( _evt.type );
		if( _evt.setTarget ) _evt.setTarget( _self );
		// Dispatch the event asynchronously
		setTimeout( _dispatch.bind({ evt: _evt, stack: _stack }), 0 );
	};
};

/* End BotanEvent & EventDispatcher }}}*/

/** @type {Array}
 *  @extends {EventDispatcher}
 */
var NamespaceObj = function() {
	EventDispatcher.call( this );
};

NamespaceObj.prototype = new Array();

var packages = {};
var _global = {};
var _NSs = {};
var _cacheIMP = {};

/*{{{ Constants */
var EX_CONST = 0;
var EX_VAR = 1;
var EX_CLASS = 2;
var EX_FUNC = 3;

var EX_READONLY_GETTER = 10;

var NS_INVOKE = 0;
var NS_EXPORT = 1;
var NS_TRIGGER = 10;
var NS_THROW = 11;

var TGR_IMPORT = 0;
/* End Constants }}}*/

/*{{{ Multi-instance handle */
// Check if we are being imported 2nd time
// If yes, we get the instance and overload
// some core methods
var sGarden = window["BotanJS"];

/** @type {BotanJS} */
var BotanJS = null;
var __namespace = null;
var __import = null;

if( sGarden )
{
	BotanJS = sGarden["sg"][0];
	__namespace =  sGarden["sg"][1];
	__import = sGarden["sg"][2];
}
/* End Multi-instance handle }}}*/

/*{{{ Root level bug-free handlers */
BotanJS = BotanJS || (function()
{
	var i = 0;
	var mesg = [];
	var structures = [];
	var edp = new EventDispatcher();

	var log = {};
	log.write = function( m ) { mesg[ mesg.length ] = m; };
	__static_method( log, "read", function() { return mesg[ i ++ ]; } );
	__static_method( log, "end", function() { return ( mesg.length <= i ); } );

	__const( edp, "log", log );

	__static_method( edp, "define", function( f ) { structures[ structures.length ] = f; } );
	__static_method( edp, "getDef", function() { return structures.slice(); } );

	return edp;
})();
/* End Root level bug-free handlers }}}*/

/*{{{ Namespace declarator */
__namespace = __namespace || function( ns )
{
	if( _NSs[ ns ] ) return _NSs[ ns ];

	var p = ns.split(".");
	var l = p.length;

	var target = packages;
	for( var i = 0; i < l; i ++ ) {
		target[ p[i] ] = target[ p[i] ] || {};
		target = target[ p[i] ];
	}

	target.__TRIGGERS = [];

	nsObj = new NamespaceObj;
	nsObj[ NS_EXPORT ] = function( type, name, obj )
	{
		if( this.t[ name ] ) return;
		this.t[ name ] = [ type, obj ];

		/** @type {BotanEvent} */
		var evt = new BotanEvent( "NS_EXPORT", {
			"name": this.n + "." + name
			, "type": type
		});

		BotanJS.dispatchEvent( evt );

	}.bind({ t: target, n: ns });

	nsObj[ NS_INVOKE ] = function( target )
	{
		if( !this.t[ target ] )
		{
			throw new Error(
				"[" + this.n + "] "
				+ "Invoke failed: " + target + " does not exists"
			);
		}

		return this.t[ target ][1];
	}.bind({ t: target, n: ns });

	nsObj[ NS_TRIGGER ] = function( code, func )
	{
		this.__TRIGGERS[ code ] = func;
	}.bind( target );

	nsObj[ NS_THROW ] = function( message, subclass )
	{
		subclass = subclass ? ( "." + subclass ) : "";
		throw new Error(
			"[" + this.n + subclass + "] " + message
		);
	}.bind({ n: ns });

	/** @type {BotanEvent} */
	BotanJS.dispatchEvent( new BotanEvent( "NS_INIT", ns ) );
	return ( _NSs[ ns ] = nsObj );
};
/* End Namespace declarator }}}*/

/*{{{ Import operator */
__import = __import || function( ns, noCache )
{
	var nss = ns.replace( ".*", "" );
	if( _NSs[ nss ] )
	{
		_NSs[ nss ].dispatchEvent( new BotanEvent( "NS_IMPORT", target ) );
	}

	// Read The Cache First
	if( !noCache && _cacheIMP[ ns ] ) return _cacheIMP[ ns ];

	var p = ns.split(".");
	var l = p.length;

	var target = packages;
	var wildcard = false;
	for( var i = 0; i < l; i ++ )
	{
		if( p[i] == "*" )
		{
			wildcard = true;
			break;
		}

		target = target[ p[i] ];

		if( !target )
			throw new Error( "No such class: " + ns );
	}

	if( target instanceof Array && p[i] != "*" )
	{
		var rtarget = null;
		if( target[0] == EX_READONLY_GETTER )
		{
			rtarget = target[1]();
		}
		else
		{
			rtarget = target[1];
		}

		_cacheIMP[ ns ] = rtarget;
		return rtarget;
	}

	var nsObj = {};

	for( var i in target )
	{
		var j = target[i];
		if( j instanceof Array )
		{
			if( wildcard && j[0] == EX_CLASS )
			{
				nsObj[ i ] = j[1];
			}
			else if( j[0] == EX_FUNC )
			{
				nsObj[ i ] = j[1];
			}
		   	else if( j[0] == EX_CONST )
			{
				Object.defineProperty( nsObj, i, {
					get: function() {
						return this.t[ this.p ][1];
					}.bind( { p: i, t: target } )
					, set: function( v ) {
						throw new Error( "Setting a read-only property: " + this.p );
					}.bind( { p: i } )
				});
			}
		   	else if( j[0] == EX_VAR )
			{
				Object.defineProperty( nsObj, i, {
					get: function() {
						return this.t[ this.p ][1]();
					}.bind( { p: i, t: target } )
					, set: function( v ) {
						this.t[ this.p ][1]( v );
					}.bind( { p: i, t: target } )
				});
			}
			else if( j[0] == EX_READONLY_GETTER )
			{
				Object.defineProperty( nsObj, i, {
					get: j[1]
					, set: function( v ) {
						throw new Error( "Setting a read-only property: " + this.p );
					}.bind( { p: i } )
				});
			}
		}
	}

	_cacheIMP[ ns ] = nsObj;
	return nsObj;
};
/* End Import operator }}}*/

window["BotanJS"] = {};
window["BotanJS"]["version"] = BOTANJS_VERSION;
window["BotanJS"]["codename"] = "Botanical framework.js";
window["BotanJS"]["import"] = function( p )
{
	try { return __import( p ); }
	catch( e )
	{
		if( sGarden ) return sGarden["import"]( p );
		throw e;
	}
};
window["BotanJS"]["sg"] = [ BotanJS, __namespace, __import ];
;BotanJS.define( "System.utils.IKey" );(function(){
	var ns = __namespace( "System.utils" );
	var ClassName = "IKey";

	////// Class IKey
	var IKey = function (name, value)
	{
		if ( name && ( typeof name != "string" ) ) return;
		this.keyName = name;

		if( value instanceof IKey )
		{
			this.keyValue = value;
		}
		else
		{
			this.keyValue = (value != undefined) ? String(value) : "";
		}

		this["keyName"] = this.keyName;
		this["keyValue"] = this.keyValue;
	};

	IKey.prototype.keyName = "";
	IKey.prototype.keyValue = "";

	var quickDef = function()
	{
		var l = arguments.length;

		if( l % 2 != 0 )
		{
			ns[ NS_THROW ]( "Invalid Definition Count", ClassName );
		}

		var keys = [];
		for( var i = 0; i < l; i += 2 )
		{
			keys[ keys.length ] = new IKey( arguments[i], arguments[ i + 1 ] );
		}

		return keys;
	};

	__static_method( IKey, "quickDef", quickDef );

	ns[ NS_EXPORT ]( EX_CLASS, "IKey", IKey );

})();
;BotanJS.define( "System.utils.Perf" );(function(){
	// Performance Functions
	var ns = __namespace( "System.utils.Perf" );

	var lut = [];
	for ( var i=0; i < 256; i++ )
	{
		lut[i] = ( i < 16 ? '0' : '' ) + ( i ).toString(16);
	}

	var UUID = function()
	{
		var d0 = Math.random()*0xffffffff|0;
		var d1 = Math.random()*0xffffffff|0;
		var d2 = Math.random()*0xffffffff|0;
		var d3 = Math.random()*0xffffffff|0;
		return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
			lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
			lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
			lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
	};
	/* }}}*/

	// Reverse an array using XOR swap
	var ArrayReverse = function( array )
	{
		var i = null;
		var l = array.length;
		var r = null;
		for (i = 0, r = l - 1; i < r; i += 1, r -= 1)
		{
			var left = array[i];
			var right = array[r];
			left ^= right;
			right ^= left;
			left ^= right;
			array[i] = left;
			array[r] = right;
		}
	};

	// Count Occurance of a string
	var CountSubString = function ( str, search )
	{
		if ( search.length <= 0 )
		{
			return str.length + 1;
		}

		var c = 0;

		for( var i = str.indexOf( search ); 0 <= i ; i = str.indexOf( search, i ) )
		{
			c ++;
			i ++;
		}

		return c;
	};

	ns[ NS_EXPORT ]( EX_READONLY_GETTER, "uuid", UUID );
	ns[ NS_EXPORT ]( EX_FUNC, "CountSubstr", CountSubString );
	ns[ NS_EXPORT ]( EX_FUNC, "ArrayReverse", ArrayReverse );
})();
;BotanJS.define( "System.Global" );(function(){
	var ns = __namespace( "System.Global" );

	var debug = function()
	{
		return window[ "debugEnv" ] && window[ "debugEnv" ];
	};

	// for IE < 10
	var IE = Boolean( document[ "all" ] );
	var ALLOWED_ORIGINS = window[ "allowed_origins" ] || [];

	var SECURE_HTTP = window.location.href.match( /^https:\/\// );

	ns[ NS_EXPORT ]( EX_READONLY_GETTER, "debug", debug );
	ns[ NS_EXPORT ]( EX_CONST, "IE", IE );
	ns[ NS_EXPORT ]( EX_CONST, "ALLOWED_ORIGINS", ALLOWED_ORIGINS );
	ns[ NS_EXPORT ]( EX_CONST, "SECURE_HTTP", SECURE_HTTP );
})();
;BotanJS.define( "Dandelion" );(function(){
	var ns = __namespace( "Dandelion" );
	var IE = __import( "System.Global.IE" );

	/* @type {System.utils.IKey}*/
	var IKey = __import( "System.utils.IKey" );

	/* @type {Dandelion.IDOMElement}*/
	var IDOMElement;

	var appendR = function( container, elements )
	{
		if( elements instanceof Array )
		{
			var l = elements.length;
			for( var i = 0; i < l; i ++ )
			{
				elements[i] && appendR( container, elements[i] );
			}
		}
		else if( typeof elements == "string" )
		{
			container.appendChild( _createTextNode( elements ) );
		}
		// append child, do not do any error handling!
		else if( elements )
		{
			container.appendChild( elements );
		}
	};

	var wrap = function ( wwith, id, wclass, elements, iKeys )
	{
		var tmp = document.createElement( wwith || "div" );
		if( id ) tmp.id = id;
		if( wclass )
		{
   			if( IE )
			{
				tmp.className = wclass;
			}
			else
			{	
				tmp.setAttribute( "class", wclass );
			}
		}

		if ( iKeys )
		{
			if ( iKeys instanceof Array )
			{
				for (var i in iKeys)
				{
					tmp.setAttribute( iKeys[i].keyName, iKeys[i].keyValue );
				}
			}
			else if ( iKeys instanceof IKey )
			{
				tmp.setAttribute( iKeys.keyName, iKeys.keyValue );
			}
		}

		if( elements )
		{
			appendR( tmp, elements );
		}

		return tmp;
	};

	var wrapc = function ( aClass, elements, iKeys ) {
		return wrap( false, false, aClass, elements, iKeys );
	};

	// wrap element afters
	var wrape = function ( elements, iKeys ) {
		return wrap( false, false, false, elements, iKeys );
	};

	// wrap name element after
	var wrapne = function ( name, elements, iKeys ) {
		return wrap( name, false, false, elements, iKeys );
	};

	// wrap name attirbutes after
	var wrapna = function ( name, iKeys ) {
		return wrap( name, false, false, false, iKeys );
	};

	var _createTextNode = function (s)
	{
		return document.createTextNode(s);
	};

	// Bubble up element if <condition>
	var bubbleUp = function ( elem, condition )
	{
		if( condition( elem ) ) return elem;

		return elem.parentNode && bubbleUp( elem.parentNode, condition );
	};

	var chainUpApply = function( elem, func )
	{
		if( !elem ) return;

		var chain = func( elem );

		if( chain && elem.parentNode )
		{
			chainUpApply( elem.parentNode, func );
		}
	};

	var id = function( name, idom )
	{
		var elem = document.getElementById( name );
		if( !elem ) return elem;

		if( idom && runtimeImport() )
		{
			return IDOMElement( elem );
		}

		return elem;
	};

	var elements = function( elem, idom )
	{
		if( idom && runtimeImport() )
		{
			var l = elem.length;
			var ielem = [];
			for( var i = 0; i < l; i ++ )
			{
				ielem[i] = IDOMElement( elem[i] );
			}
			return ielem;
		}

		return elem;
	};

	var tag = function( name, idom, target )
	{
		target = target === undefined ? document : target;
		var elem = target.getElementsByTagName( name );
		return elements( elem, idom );
	};

	var name = function( name, idom, target )
	{
		target = target === undefined ? document : target;
		var elem = target.getElementsByName( name );
		return elements( elem, idom );
	};

	var getClass = function( name, idom, target )
	{
		target = target === undefined ? document : target;
		var elem = target.getElementsByClassName( name );
		return elements( elem, idom );
	};

	var runtimeImport = function()
	{
		if( IDOMElement ) return true;

		try
		{
			var a = "Dandelion.IDOMElement";
			IDOMElement = __import( a );
			return true;
		}
		catch( e ) { }
		return false;
	};

	ns[ NS_EXPORT ]( EX_FUNC, "wrap", wrap );
	ns[ NS_EXPORT ]( EX_FUNC, "wrapc", wrapc );
	ns[ NS_EXPORT ]( EX_FUNC, "wrape", wrape );
	ns[ NS_EXPORT ]( EX_FUNC, "wrapne", wrapne );
	ns[ NS_EXPORT ]( EX_FUNC, "wrapna", wrapna );
	ns[ NS_EXPORT ]( EX_FUNC, "textNode", _createTextNode );
	ns[ NS_EXPORT ]( EX_FUNC, "bubbleUp", bubbleUp );
	ns[ NS_EXPORT ]( EX_FUNC, "chainUpApply", chainUpApply );
	ns[ NS_EXPORT ]( EX_FUNC, "id", id );
	ns[ NS_EXPORT ]( EX_FUNC, "tag", tag );
	ns[ NS_EXPORT ]( EX_FUNC, "name", name );
	ns[ NS_EXPORT ]( EX_FUNC, "glass", getClass );
})();
;BotanJS.define( "System.utils.EventKey" );(function(){
	var ns = __namespace( "System.utils" );
	var IKey = ns[ NS_INVOKE ]( "IKey" );
	// Event key
	var EventKey = function ( eventType, eventHandler )
	{
		IKey.call( this, eventType, eventHandler );

		this.type = eventType.toLowerCase();
		this.handler = eventHandler;
	}

	__extends( EventKey, IKey );

	EventKey.prototype.type = "";
	EventKey.prototype.handler = null;

	ns[ NS_EXPORT ]( EX_CLASS, "EventKey", EventKey );
})();
;BotanJS.define( "Dandelion.IDOMObject" );(function(){
	var ns = __namespace( "Dandelion" );
	/** @type {System.utils.EventKey} */
	var EventKey = __import( "System.utils.EventKey" );

	var EvtsArr = function () { Array.call( this ); };

	/** @param {System.utils.EventKey} e */
	EvtsArr.prototype.indexOf = function( e )
	{
		var l = this.length;
		for( var i = 0; i < l; i ++ )
		{
			/** @type {System.utils.EventKey} */
			var evt = this[i];
			if( evt.type == e.type && evt.handler == e.handler )
			{
				return i;
			}
		}

		return -1;
	};

	__extends( EvtsArr, Array );

	var IDOMObject = function ( obj, sw )
	{
		if ( obj instanceof IDOMObject ) return obj;

		if ( sw )
		{
			this["addEventListener"] = this.addEventListener.bind(obj);
			this["addEventListeners"] = this.addEventListeners.bind(this);
			this["hasListener"] = this.hasListener.bind(obj);
			this["removeEventListener"] = this.removeEventListener.bind(obj);
		}
		else if ( obj )
		{
			return new IDOMObject( obj, true );
		}
		else
		{
			throw new Error( "[Dandelion.IDOMObject] Invalid argument" );
		}
	}

	IDOMObject.prototype.hasListener = function(e)
	{
		if( e instanceof EventKey
			&& this._events
			&& this._events.indexOf(e) != -1
		)
		{
			return this._events[ this._events.indexOf(e) ];
		}
		return null;
	};

	IDOMObject.prototype.addEventListener = function (event, handler)
	{
		var e;
		if (typeof event == "string" && handler)
		{
			e = new EventKey(event, handler);
		}
		else if (event instanceof EventKey)
		{
			e = event;
		}
		else
		{
			return false;
		}

		if ( this._events )
		{
			if ( this._events.indexOf( e ) < 0 )
			{
				this._events.push( e );
			}
			else
			{
				return false;
			}
		}
		else
		{
			this._events = new EvtsArr();
			this._events[0] = e;
		}

		if( this.addEventListener )
		{
			this.addEventListener( e.type, e.handler, false );
		}
		// IE
		else if( this.attachEvent )
		{
			this.attachEvent('on' + e.type, e.handler);
		}
		else
		{
			this['on' + e.type] = e.handler;
		}
		return true;
	};

	IDOMObject.prototype.addEventListeners = function(evtKeys)
	{
		if(evtKeys instanceof Array)
		{
			for (var i in evtKeys)
			{
				this.addEventListener(evtKeys[i]);
			}
		}
	};

	IDOMObject.prototype.removeEventListener = function( e, handler )
	{
		if( handler )
		{
			e = new EventKey( e, handler );
		}

		if( this._events )
		{
			delete this._events[ this._events.indexOf(e) ];
		}

		if( this.removeEventListener )
		{
			this.removeEventListener( e.type, e.handler );
		}
		// IE
		else if( this.detachEvent )
		{
			this.detachEvent( 'on' + e.type, e.handler );
		}
		else
		{
			this['on' + e.type] = null;
		}
	};

	ns[ NS_EXPORT ]( EX_CLASS, "IDOMObject", IDOMObject );
})();

;BotanJS.define( "Dandelion.IDOMElement" );(function(){
	var ns = __namespace( "Dandelion" );

	/** @type {System.utils.IKey} */
	var IKey                         = __import( "System.utils.IKey" );
	/** @type {System.utils.Perf} */
	var Perf                         = __import( "System.utils.Perf" );

	var wrap = ns[ NS_INVOKE ]( "wrap" );
	var IDOMObject = ns[ NS_INVOKE ]( "IDOMObject" );

	// IDOMElement, augmented element wrapper utilizing IKeys
	var IDOMElement = function (element, sw)
	{
		if (element instanceof IDOMElement) return element;

		if (sw)
		{
			IDOMObject.call( this, element, true );

			this["getDAttribute"] = this.getDAttribute.bind(element);

			this["lootChildren"] = this.lootChildren.bind(element);

			this["foreach"] = this.foreach.bind(element);
			this["reverseChild"] = this.reverseChild.bind(element);
			this["first"] = this.first.bind(element);
			this["last"] = this.last.bind(element);
			this["contains"] = this.contains.bind(element);

			// Org values
			this["style"] = element.style;
			this["hasAttribute"] = function ( key ) { this.hasAttribute( key ); }.bind( element );
			this["removeAttribute"] = function ( key ) { this.removeAttribute( key ); }.bind( element );
			this["element"] = element;

			// Overrides
			this["setAttribute"] = this.setAttribute.bind( element );
		}
		else if ( element && element[ "nodeType" ] != undefined && element.nodeType == 1 )
		{
			return new IDOMElement( element, true );
		}
		else if( element === undefined )
		{
			return new IDOMElement( wrap(), true );
		}
		else
		{
			throw new Error( "[Dandelion.IDOMElement] Invalid argument" );
		}
		return this;
	};

	__extends( IDOMElement, IDOMObject );

	IDOMElement.prototype.setAttribute = function( k, v )
	{
		if( k instanceof IKey )
		{
			this.setAttribute( k.keyName, k.keyValue );
		}
		else if( k instanceof Array )
		{
			for ( var i in k )
			{
				if ( k[i] instanceof IKey )
				{
					this.setAttribute( k[i].keyName, k[i].keyValue );
				}
			}
		}
		else
		{
			this.setAttribute( k, v );
		}
	};

	IDOMElement.prototype.lootChildren = function ( element )
	{
		var _nodes = element.childNodes;
		while(_nodes.length)
		{
			this.appendChild( element.removeChild( _nodes[0] ) );
		}
	};

	IDOMElement.prototype.getDAttribute = function(name)
	{
		var i = this.getAttribute("data-" + name);
		return i && decodeURIComponent(i);
	};

	IDOMElement.prototype.foreach = function(type, callback)
	{
		var c = Array.apply( [], this.childNodes ), l = c.length;
		for(var i = 0; i < l; i ++)
		{
			if (c[i].nodeType == type)
			{
				callback(c[i], this);
			}
		}
	};

	var matchNone = function() { return false; };
	var matchType = function( c, t ) { return c.nodeType == t; };
	var matchName = function( c, t ) { return c.nodeName == t; };

	var getMatch = function( type )
	{
		type = typeof( type );
		if( type == "number" ) return matchType;
		else if( type == "string" ) return matchName;

		return matchNone;
	};

	IDOMElement.prototype.first = function ( type, callback )
	{
		var c = this.childNodes;
		var l = c.length;
		var elem = null;
		var tc = getMatch( type );

		for( var i = 0; i < l; i ++ )
		{
			if ( tc( c[i], type ) )
			{
				if( callback === undefined || callback( c[i], this ) )
				{
					elem = c[i];
					break;
				}
			}
		}

		return elem;
	};

	IDOMElement.prototype.last = function ( type, callback )
	{
		var c = this.childNodes;
		var l = c.length - 1;
		var elem = null;
		var tc = getMatch( type );

		for( var i = l; -1 < i ; i -- )
		{
			if ( tc( c[i], type ) )
			{
				if( callback === undefined || callback( c[i], this ) )
				{
					elem = c[i];
					break;
				}
			}
		}

		return elem;
	};

	IDOMElement.prototype.contains = function ( target )
	{
		if( target.parentElement )
		{
			if( target == this )
			{
				return true;
			}
			return this.contains( target.parentElement );
		}
		return false;
	};

	// attribute keys
	IDOMElement.prototype.aKeys = function()
	{
		var ikeys = [];
		var attrs = this.element.attributes;
		var l = attrs.length;
		for( var i = 0; i < l; i ++ )
		{
			ikeys.push( new IKey( attrs[i].name, attrs[i].value ) );
		}
		return ikeys;
	};

	IDOMElement.prototype.reverseChild = function()
	{
		var l = this.childNodes.length - 1;
		while( -1 < -- l )
		{
			this.appendChild( this.childNodes[l] );
		}
	};

	ns[ NS_EXPORT ]( EX_CLASS, "IDOMElement", IDOMElement );
})();
;BotanJS.define( "System.utils.DataKey" );(function(){
	var ns = __namespace( "System.utils" );
	var IKey = ns[ NS_INVOKE ]( "IKey" );
	// Data key
	var DataKey = function ( name, value )
	{
		IKey.call(
			this
			, "data-" + name
			, value ? encodeURIComponent( String( value ) ) : ""
		);
	};

	__extends( DataKey, IKey );

	ns[ NS_EXPORT ]( EX_CLASS, "DataKey", DataKey );
})();
;BotanJS.define( "System.utils" );(function(){
	var ns = __namespace( "System.utils" );
	var Global = __import( "System.Global" );


	// Get prop from obj if obj.<prop> is <type>
	var objGetProp = function ( obj, prop, type )
	{
		if(obj && obj[prop])
		{
			var t = obj[prop].constructor.toString().match(/function ([^\(]+)/);
			if(t && t.length == 2 && t[1].toUpperCase() == type.toUpperCase())
			{
				return obj[prop];
			}
		}
		return null;
	};

	var objSearch = function ( obj, cond, prop )
	{
		for( var i in obj )
		{
			if( cond( obj[i] ) )
			{
				return obj[i][prop] || obj[i];
			}
		}
		return null;
	};

	var objMap = function( obj, callback )
	{
		for( var i in obj )
		{
			obj[i] = callback( obj[i] );
		}
	};

	var SiteProto = function( path )
	{
		if( path.match( /^https?:\/\// ) )
		{
			if( Global.SECURE_HTTP )
			{
				return path.replace( /^http:\/\//, "https://" );
			}
			else
			{
				return path.replace( /^https:\/\//, "http://" );
			}
		}
		else
		{
			return "http" + ( Global.SECURE_HTTP ? "s" : "" ) + "://" + path;;
		}
	};

	ns[ NS_EXPORT ]( EX_FUNC, "objGetProp", objGetProp );
	ns[ NS_EXPORT ]( EX_FUNC, "objSearch", objSearch );
	ns[ NS_EXPORT ]( EX_FUNC, "objMap", objMap );

	ns[ NS_EXPORT ]( EX_FUNC, "siteProto", SiteProto );
})();
;BotanJS.define( "System.Tick" );(function(){
	var ns = __namespace( "System" );

	var Tick = function()
	{
		// cycle counter
		var nc = 0;
		this.__started = false;

		this.loop = function()
		{
			for( var i in this.steppers )
				this.steppers[i]();
			nc ++;
		};

		__readOnly( this, "count", function() { return nc; } );
	};

	Tick.prototype.putStepper = function( stepperCallback )
	{
		var l = this.steppers.length;
		this.steppers[l] = stepperCallback;
		return l;
	};

	Tick.prototype.start = function()
	{
		if( !this.__started )
		{
			this.id = setInterval( this.loop.bind( this ), 0 );
			this.__started = true;
		}
	};

	Tick.prototype.stop = function()
	{
		if( this.__started )
		{
			this.__started = false;
			clearInterval( this.id );
		}
	};

	Tick.prototype.steppers = [];

	__readOnly( Tick.prototype, "started", function() { return this.__started; } );

	ns[ NS_EXPORT ]( EX_CLASS, "Tick", Tick );
})();
;BotanJS.define( "System.Log" );(function(){
	var ns = __namespace( "System.Log" );
	var handler = [];

	var SYSTEM = 1;
	var INFO = 16;
	var ERROR = 32;

	var writeLine = function ( mesg, type )
	{
		type = ( type === undefined ) ? INFO : type;

		var handled = false;
		for( var i in handler )
		{
			handler[i]( mesg, type );
			handled = true;
		}

		if( !handled
			&& window[ "console" ]
			&& console.log
		) console.log( mesg );
	};

	var registerHandler = function( func )
	{
		var index = -1;
		handler[ index = handler.length ] = func;

		return index;
	};

	var removeHandler = function( index )
	{
		delete handler[ index ];
	};

	ns[ NS_EXPORT ]( EX_FUNC, "writeLine", writeLine );
	ns[ NS_EXPORT ]( EX_FUNC, "registerHandler", registerHandler );
	ns[ NS_EXPORT ]( EX_FUNC, "removeHandler", removeHandler );

	ns[ NS_EXPORT ]( EX_CONST, "INFO", INFO );
	ns[ NS_EXPORT ]( EX_CONST, "ERROR", ERROR );
	ns[ NS_EXPORT ]( EX_CONST, "SYSTEM", SYSTEM );
})();
;BotanJS.define( "System.Debug" );(function(){
	var ns = __namespace( "System.Debug" );
	/** @type {System.Log} */
	var Log = __import( "System.Log" );
	/** @type {System.Global} */
	var _global = __import( "System.Global" );

	var st_info = _global.debug;
	var st_error = true;

	var Error = function( e )
	{
		if( st_error )
		Log.writeLine( e.name + "\n\t" + e.message + "\n\t" + e.stack, Log.ERROR );
	};

	var Info = function()
	{
		if( st_info )
		Log.writeLine( Array.prototype.join.call( arguments, " " ), Log.INFO );
	};

	var turnOff = function( what )
	{
		if( what == "info" ) st_info = false;
		else if( what == "error" ) st_error = false;
	};

	var turnOn = function( what )
	{
		if( what == "info" ) st_info = true;
		else if( what == "error" ) st_error = true;
	};

	/* {{{ Root log override */
	BotanJS.log.write = Info;

	while( !BotanJS.log.end() )
		Info( BotanJS.log.read() );
	/* End Root log override }}}*/

	ns[ NS_EXPORT ]( EX_FUNC, "Error", Error );
	ns[ NS_EXPORT ]( EX_FUNC, "Info", Info );
	ns[ NS_EXPORT ]( EX_FUNC, "turnOff", turnOff );
	ns[ NS_EXPORT ]( EX_FUNC, "turnOn", turnOn );
})();
;BotanJS.define( "System.Cycle" );(function(){
	var ns = __namespace( "System.Cycle" );

	/** @type {System.Tick} */
	var utils                   = __import( "System.utils" );
	/** @type {System.Tick} */
	var Tick                    = __import( "System.Tick" );
	/** @type {System.Debug} */
	var debug                   = __import( "System.Debug" );

	var tList = [];

	var C_CALLBACK = 0;
	var C_TIME = 1;
	var C_ONCE = 2;
	var C_ID = 3;
	var C_INTVL = 4;

	var stepper = function()
	{
		var thisTime = new Date().getTime();
		for ( var i in tList )
		{
			var f = tList[i];
			if( f && thisTime > f[ C_TIME ] )
			{
				try
				{
					f[ C_CALLBACK ]();
				}
				catch(e)
				{
					debug.Error(e);
					delete tList[i];
					continue;
				}

				if( f[ C_ONCE ] )
				{
					delete tList[i];
				}
				else
				{
					f[ C_TIME ] = thisTime + f[ C_INTVL ];
				}
			}
		}
	};

	// Should bind "func" before register
	var registerDelay = function (func, milliSec)
	{
		var a = [];
		a[ C_CALLBACK ] = func;
		a[ C_TIME ] = new Date().getTime() + milliSec;
		a[ C_ONCE ] = true;

		tList[ tList.length ] = a;
	};

	var registerPermanentTicker = function ( id, func, interval )
	{
		for ( var i in tList )
		{
			if( tList[i][ C_ID ] == id )
				return false;
		}

		var a = [];
		a[ C_CALLBACK ] = func;
		a[ C_TIME ] = new Date().getTime() + interval;
		a[ C_ONCE ] = false;
		a[ C_ID ] = id;
		a[ C_INTVL ] = interval;

		tList[ tList.length ] = a;
	};

	var deletePermanentTicker = function ( id )
	{
		// 3: id
		for ( var i in tList )
		{
			if( tList[i][ C_ID ] == id )
				delete tList[i];
		}
	};

	var next = function( func )
	{
		var a = [];
		a[ C_CALLBACK ] = func;
		a[ C_TIME ] = 0;
		a[ C_ONCE ] = true;

		tList[ tList.length ] = a;
	};

	var ourTick = new Tick();
	ourTick.putStepper( stepper );

	var gTickStart = function( e )
	{
		e.target.removeEventListener( "NS_IMPORT", gTickStart );

		var TICK = __import( "System.Cycle.TICK", true );

		if( TICK != ourTick && TICK.started )
		{
			debug.Info( "[System.Cycle] Global Tick exists" );
			ourTick = null;
			return;
		}

		debug.Info( "[System.Cycle] Creating global Tick" );
		ourTick.start();
	};

	ns.addEventListener( "NS_IMPORT", gTickStart );

	ns[ NS_EXPORT ]( EX_FUNC, "next", next );
	ns[ NS_EXPORT ]( EX_FUNC, "delay", registerDelay );
	ns[ NS_EXPORT ]( EX_FUNC, "perma", registerPermanentTicker );
	ns[ NS_EXPORT ]( EX_FUNC, "permaRemove", deletePermanentTicker );
	ns[ NS_EXPORT ]( EX_READONLY_GETTER, "TICK", function(){ return ourTick; } );
})();
;BotanJS.define( "Components.Vim.State.Registers" );(function(){
/*  From Vim, :help registers
	There are ten types of registers:
	1. The unnamed register ""
	2. 10 numbered registers "0 to "9
	3. The small delete register "-
	4. 26 named registers "a to "z or "A to "Z
	5. three read-only registers ":, "., "%
	6. alternate buffer register "#
	7. the expression register "=
	8. The selection and drop registers "*, "+ and "~ 
	9. The black hole register "_
	10. Last search pattern register "/
	i.e. 0123456789-abcdefghijklmnopqrstuvwxyz:.%$=*+~_/
*/
	var ns = __namespace( "Components.Vim.State" );

	/** @type {System.Debug} */
	var debug = __import( "System.Debug" );

	var Register = function( str, n )
	{
		this.__str = str + "";
		this.newLine = Boolean( n );
	};

	Register.prototype.newLine = false;

	Register.prototype.toString = function() { return this.__str; };
	Register.prototype.indexOf = function( a, b ) { return this.__str.indexOf( a, b ); };

	__readOnly( Register.prototype, "length", function() { return this.__str.length; } );


	var Registers = function()
	{
		this.__registers = {};
	};

	Registers.prototype.__unnamed = function( reg )
	{
		this.__registers[ "\"" ] = reg;
	};

	Registers.prototype.yank = function( str, newLine )
	{
		var reg = new Register( str, newLine );
		this.__unnamed( reg );
		this.__registers[ this.__selRegister || 0 ] = reg;
		this.__selRegister = false;
	};

	Registers.prototype.change = function( str, newLine )
	{
		var reg = new Register( str, newLine );
		this.__unnamed( reg );
		var r = this.__registers;
		for( var i = 9; 1 < i; i -- )
		{
			if( r[ i - 1 ] != undefined )
			{
				r[ i ] = r[ i - 1 ];
			}
		}

		r[ 1 ] = reg;
		this.__selRegister = false;
	};

	Registers.prototype.get = function( r )
	{
		// 0 is one of the registers
		if( !r && r !== 0  ) r = this.__selRegister || "\"";

		this.__selRegister = false;
		return this.__registers[ r ];
	};

	Registers.prototype.select = function( r )
	{
		debug.Info( "Selecting Register: " + r );
		this.__selRegister = r;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "Registers", Registers );

})();
;BotanJS.define( "Components.Vim.Syntax.Word" );(function(){
	var ns = __namespace( "Components.Vim.Syntax" );

	var KINGDOMS = [
		[ // Numbers
			[ 0x0030, 0x0039 ]
		]
		,
		[ // Latin
			[ 0x0041, 0x005A ], [ 0x0061, 0x007A ] // Basic Latin
			, [ 0x00C0, 0x00FF ] // Latin-1 Supplement
			, [ 0x0100, 0x017F ] // Latin Extended-A
			, [ 0x0180, 0x024F ] // Latin Extended-B
		// Latin-2 supplement
			, [ 0x1D00, 0x1D7F ] // Phonetic Extensions
			, [ 0x1D80, 0x1DBF ] // Phonetic Extensions Supplement
			, [ 0x1DC0, 0x1DFF ] // Combining Diacritical Marks Supplement
			, [ 0x1E00, 0x1EFF ] // Latin extended additional
			, [ 0x1F00, 0x1FFF ] // Greek Extended
		]
		,
		[
			[ 0x0250, 0x02AF ] // IPA Extensions
			, [ 0x02B0, 0x02FF ] // Spacing Modifier Letters
			, [ 0x0300, 0x036F ] // Combining Diacritical Marks
			, [ 0x0370, 0x03FF ] // Greek and Coptic
			, [ 0x0400, 0x04FF ] // Cyrillic
			, [ 0x0500, 0x052F ] // Cyrillic Supplement
			, [ 0x0530, 0x058F ] // Armenian
		]
		,
		[ // Aramaic Scripts
			[ 0x0590, 0x05FF ] // Hebrew
			, [ 0x0600, 0x06FF ] // Arabic
			, [ 0x0700, 0x074F ] // Syriac
			, [ 0x0750, 0x077F ] // Arabic Supplement
			, [ 0x0780, 0x07BF ] // Thaana
			, [ 0x07C0, 0x07FF ] // N'Ko
			, [ 0x0800, 0x083F ] // Samaritan
			, [ 0x0840, 0x085F ] // Mandaic
			, [ 0x08A0, 0x08FF ] // Arabic Extended-A
		]
		,
		[ // Brahmic scripts
			[ 0x0900, 0x097F ] // Devanagari
			, [ 0x0980, 0x09FF ] // Bengali
			, [ 0x0A00, 0x0A7F ] // Gurmukhi
			, [ 0x0A80, 0x0AFF ] // Gujarati
			, [ 0x0B00, 0x0B7F ] // Oriya
			, [ 0x0B80, 0x0BFF ] // Tamil
			, [ 0x0C00, 0x0C7F ] // Telugu
			, [ 0x0C80, 0x0CFF ] // Kannada
			, [ 0x0D00, 0x0D7F ] // Malayalam
			, [ 0x0D80, 0x0DFF ] // Sinhala
			, [ 0x0E00, 0x0E7F ] // Thai
			, [ 0x0E80, 0x0EFF ] // Lao
			, [ 0x0F00, 0x0FFF ] // Tibetan
			, [ 0x1000, 0x109F ] // Myanmar
			, [ 0x10A0, 0x10FF ] // Georgian
			, [ 0x1100, 0x11FF ] // Hangul Jamo
			, [ 0x1200, 0x137F ] // Ethiopic
			, [ 0x1380, 0x139F ] // Ethiopic Supplement
			, [ 0x13A0, 0x13FF ] // Cherokee
			, [ 0x1400, 0x167F ] // Unified Canadian Aboriginal Syllabics
			, [ 0x1680, 0x169F ] // Ogham
			, [ 0x16A0, 0x16FF ] // Runic
		]
		,
		[ // Philippine scripts
			[ 0x1700, 0x171F ] // Tagalog
			, [ 0x1720, 0x173F ] // Hanunoo
			, [ 0x1740, 0x175F ] // Buhid
			, [ 0x1760, 0x177F ] // Tagbanwa
			, [ 0x1780, 0x17FF ] // Khmer
			, [ 0x1800, 0x18AF ] // Mongolian
			, [ 0x18B0, 0x18FF ] // Unified Canadian Aboriginal Syllabics Extended
			, [ 0x1900, 0x194F ] // Limbu
		]
		,
		[ // Tai scripts
			[ 0x1950, 0x197F ] // Tai Le
			, [ 0x1980, 0x19DF ] // Tai Lue
			, [ 0x19E0, 0x19FF ] // Khmer Symbols
			, [ 0x1A00, 0x1A1F ] // Buginese
			, [ 0x1A20, 0x1AAF ] // Tai Tham
			, [ 0x1AB0, 0x1AFF ] // Combining Diacritical Marks Extended
			, [ 0x1B00, 0x1B7F ] // Balinese
			, [ 0x1B80, 0x1BBF ] // Sundanese
			, [ 0x1BC0, 0x1BFF ] // Batak
			, [ 0x1C00, 0x1C4F ] // Lepcha
			, [ 0x1C50, 0x1C7F ] // Ol Chiki
			, [ 0x1CC0, 0x1CCF ] // Sundanese Supplement
			, [ 0x1CD0, 0x1CFF ] // Vedic Extensions
		]
		,
		[ // Symbols
			[ 0x2000, 0x206F ] // General Punctuation
			, [ 0x2070, 0x209F ] // Superscripts and Subscripts
			, [ 0x20A0, 0x20CF ] // Currency Symbols
			, [ 0x20D0, 0x20FF ] // Combining Diacritical Marks for Symbols
			, [ 0x2100, 0x214F ] // Letterlike Symbols
			, [ 0x2150, 0x218F ] // Number Forms
			, [ 0x2190, 0x21FF ] // Arrows
			, [ 0x2200, 0x22FF ] // Mathematical Operators
			, [ 0x2300, 0x23FF ] // Miscellaneous Technical
			, [ 0x2400, 0x243F ] // Control Pictures
			, [ 0x2440, 0x245F ] // Optical Character Recognition
			, [ 0x2460, 0x24FF ] // Enclosed Alphanumerics
			, [ 0x2500, 0x257F ] // Box Drawing
			, [ 0x2580, 0x259F ] // Block Elements
			, [ 0x25A0, 0x25FF ] // Geometric Shapes
			, [ 0x2600, 0x26FF ] // Miscellaneous Symbols
			, [ 0x2700, 0x27BF ] // Dingbats
			, [ 0x27C0, 0x27EF ] // Miscellaneous Mathematical Symbols-A
			, [ 0x27F0, 0x27FF ] // Supplemental Arrows-A
			, [ 0x2800, 0x28FF ] // Braille Patterns
			, [ 0x2900, 0x297F ] // Supplemental Arrows-B
			, [ 0x2980, 0x29FF ] // Miscellaneous Mathematical Symbols-B
			, [ 0x2A00, 0x2AFF ] // Supplemental Mathematical Operators
			, [ 0x2B00, 0x2BFF ] // Miscellaneous Symbols and Arrows
			, [ 0x2C00, 0x2C5F ] // Glagolitic
			, [ 0x2C60, 0x2C7F ] // Latin Extended-C
			, [ 0x2C80, 0x2CFF ] // Coptic
			, [ 0x2D00, 0x2D2F ] // Georgian Supplement
			, [ 0x2D30, 0x2D7F ] // Tifinagh
			, [ 0x2D80, 0x2DDF ] // Ethiopic Extended
			, [ 0x2DE0, 0x2DFF ] // Cyrillic Extended-A
			, [ 0x2E00, 0x2E7F ] // Supplemental Punctuation
		]
		,
		[ // CJK scripts and symbols
			[ 0x2E80, 0x2EFF ] // CJK Radicals Supplement
			, [ 0x2F00, 0x2FDF ] // Kangxi Radicals
			, [ 0x2FF0, 0x2FFF ] // Ideographic Description Characters
			, [ 0x3000, 0x303F ] // CJK Symbols and Punctuation
			, [ 0x3040, 0x309F ] // Hiragana
			, [ 0x30A0, 0x30FF ] // Katakana
			, [ 0x3100, 0x312F ] // Bopomofo
			, [ 0x3130, 0x318F ] // Hangul Compatibility Jamo
			, [ 0x3190, 0x319F ] // Kanbun
			, [ 0x31A0, 0x31BF ] // Bopomofo Extended
			, [ 0x31C0, 0x31EF ] // CJK Strokes
			, [ 0x31F0, 0x31FF ] // Katakana Phonetic Extensions
			, [ 0x3200, 0x32FF ] // Enclosed CJK Letters and Months
			, [ 0x3300, 0x33FF ] // CJK Compatibility
			, [ 0x3400, 0x4DBF ] // CJK Unified Ideographs Extension A
			, [ 0x4DC0, 0x4DFF ] // Yijing Hexagram Symbols
			, [ 0x4E00, 0x9FFF ] // CJK Unified Ideographs
			, [ 0xA000, 0xA48F ] // Yi Syllables
			, [ 0xA490, 0xA4CF ] // Yi Radicals
			, [ 0xA4D0, 0xA4FF ] // Lisu
			, [ 0xA500, 0xA63F ] // Vai
			, [ 0xA640, 0xA69F ] // Cyrillic Extended-B
			, [ 0xA6A0, 0xA6FF ] // Bamum
			, [ 0xA700, 0xA71F ] // Modifier Tone Letters
			, [ 0xA720, 0xA7FF ] // Latin Extended-D
			, [ 0xA800, 0xA82F ] // Syloti Nagri
			, [ 0xA830, 0xA83F ] // Common Indic Number Forms
			, [ 0xA840, 0xA87F ] // Phags-pa
			, [ 0xA880, 0xA8DF ] // Saurashtra
			, [ 0xA8E0, 0xA8FF ] // Devanagari Extended
			, [ 0xA900, 0xA92F ] // Kayah Li
			, [ 0xA930, 0xA95F ] // Rejang
			, [ 0xA960, 0xA97F ] // Hangul Jamo Extended-A
			, [ 0xA980, 0xA9DF ] // Javanese
			, [ 0xA9E0, 0xA9FF ] // Myanmar Extended-B
			, [ 0xAA00, 0xAA5F ] // Cham
			, [ 0xAA60, 0xAA7F ] // Myanmar Extended-A
			, [ 0xAA80, 0xAADF ] // Tai Viet
			, [ 0xAAE0, 0xAAFF ] // Meetei Mayek Extensions
			, [ 0xAB00, 0xAB2F ] // Ethiopic Extended-A
			, [ 0xAB30, 0xAB6F ] // Latin Extended-E
			, [ 0xAB70, 0xABBF ] // Cherokee Supplement
			, [ 0xABC0, 0xABFF ] // Meetei Mayek
			, [ 0xAC00, 0xD7AF ] // Hangul Syllables
			, [ 0xD7B0, 0xD7FF ] // Hangul Jamo Extended-B
		]
		,
		[ // Surrogates
			[ 0xD800, 0xDBFF ] // High Surrogates
			, [ 0xDC00, 0xDFFF ] // Low Surrogates
			, [ 0xE000, 0xF8FF ] // Private Use Area
			, [ 0xF900, 0xFAFF ] // CJK Compatibility Ideographs
			, [ 0xFB00, 0xFB4F ] // Alphabetic Presentation Forms
			, [ 0xFB50, 0xFDFF ] // Arabic Presentation Forms-A
			, [ 0xFE00, 0xFE0F ] // Variation Selectors
			, [ 0xFE10, 0xFE1F ] // Vertical Forms
			, [ 0xFE20, 0xFE2F ] // Combining Half Marks
			, [ 0xFE30, 0xFE4F ] // CJK Compatibility Forms
			, [ 0xFE50, 0xFE6F ] // Small Form Variants
			, [ 0xFE70, 0xFEFF ] // Arabic Presentation Forms-B
			, [ 0xFF00, 0xFFEF ] // Halfwidth and Fullwidth Forms
			, [ 0xFFF0, 0xFFFF ] // Specials
		]
		,
		[ // Symbols
			// Basic Latin
			[ 0x0021, 0x002F ], [ 0x003A, 0x0040 ], [ 0x005B, 0x0060 ], [ 0x007B, 0x007E ],
			// C1 Controls and Latin-1 Supplement (Extended ASCII)
			[ 0x00A1, 0x00AC ], [ 0x00AE, 0x00BF ]
		]
		,
		[ // Spaces & tabs
			[ 0x0020, 0x0020 ], [ 0x0009, 0x0009 ]
		]
	];

	var NUM_KINGDOM = KINGDOMS.length;

	var START = 0;
	var END = 1;

	var GetKingdom = function( Char )
	{
		var charCode = Char.charCodeAt( 0 );
		for( var i = 0; i < NUM_KINGDOM; i ++ )
		{
			var kingdom = KINGDOMS[ i ];
			var zLen = kingdom.length;
			for( var j = 0; j < zLen; j ++ )
			{
				var zone = kingdom[ j ];
				if( zone[ START ] <= charCode && charCode <= zone[ END ] )
				{
					return kingdom;
				}
			}
		}

		return [];
	};

	var Word = function( p )
	{
		this.kingdom = GetKingdom( p );
	};

	Word.prototype.test = function( p )
	{
		if( p == undefined || p == null || !p.charCodeAt ) return false;

		var kingdom = this.kingdom;
		var zLen = kingdom.length;
		var charCode = p.charCodeAt( 0 );

		for( var j = 0; j < zLen; j ++ )
		{
			var zone = kingdom[ j ];
			if( zone[ START ] <= charCode && charCode <= zone[ END ] )
			{
				return true;
			}
		}

		return false;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "Word", Word );
})();
;BotanJS.define( "Components.Vim.Syntax.Analyzer" );(function(){
	var ns = __namespace( "Components.Vim.Syntax" );

	/** @type {System.Debug} */
	var debug                                   = __import( "System.Debug" );

	/** @type {Components.Vim.Syntax.Word} */
	var Word = ns[ NS_INVOKE ]( "Word" );

	var TOK_OPEN = 0;
	var TOK_CLOSED = 1;
	var TOK_LEVEL = 2;
	var TOK_PARENT = 3;

	var TOK_SEP = "\n";

	var TOK_JOIN = function( a, b ) { return a + TOK_SEP + b; };

	/*{{{ Private Class */
	var TokenPairs = function( tok, content, esc )
	{
		var l = content.length;
		var toks = tok.split( TOK_SEP );
		var openToken = toks[0];
		var closeToken = toks[1];

		var opStack = [];

		var unmatchedEd = [];

		var lv = 0;

		var pairs = [];

		var lvUp = function( i )
		{
			opStack[ lv ] = i;
			lv ++;
		};

		var lvDown = function( i )
		{
			if( lv == 0 )
			{
				// Cannot level down. i.e. Unmatched tokens
				unmatchedEd.push( i );
				return;
			}

			var Token = [];
			Token[ TOK_OPEN ] = opStack[ -- lv ];
			Token[ TOK_CLOSED ] = i;
			Token[ TOK_LEVEL ] = lv;
			Token[ TOK_PARENT ] =  0 < lv ? opStack[ lv - 1 ] : -1;

			pairs.push( Token );
		};

		var opLen = openToken.length;
		var edLen = closeToken.length;
		for( var i = 0; i < l; i ++ )
		{
			var opTok = content.substr( i, opLen );
			var edTok = content.substr( i, edLen );
			if( opTok == openToken )
			{
				lvUp( i );
				i += opLen - 1;
			}
			else if( edTok == closeToken )
			{
				lvDown( i );
				i += edLen - 1;
			}
		}

		if( unmatchedEd.length )
		{
			debug.Info( "Unmatched opening \"" + openToken + "\"@" + unmatchedEd.join( ", " ) );
		}

		if( 0 < lv )
		{
			debug.Info( "Unmatched closing \"" + closeToken + "\"@" + opStack.slice( 0, lv ) );
		}

		this.__pairs = pairs;
		this.token = toks;
	};

	TokenPairs.prototype.token = "";

	TokenPairs.prototype.matched = function()
	{
		return this.__pairs.sort(
				function( a, b ) { return a[ TOK_OPEN ] - b[ TOK_OPEN ]; }
				);
	};

	TokenPairs.prototype.find = function( pos, state )
	{
		if( state == undefined ) state = TOK_OPEN;

		var pairs = this.__pairs;
		var l = pairs.length;

		for( var i = 0; i < l; i ++ )
		{
			var pair = pairs[i];
			if( pair[ state ] == pos )
			{
				return pair;
			}
		}

		return null;
	};
	/* End Private Class }}}*/

	var SetParent = function( BracketPairs, pair )
	{
		if( !pair ) throw new Error( "Parent not found" );

		var tMatch = new TokenMatch();
		tMatch.__level = pair[ TOK_LEVEL ];
		tMatch.__open = pair[ TOK_OPEN ];
		tMatch.__close = pair[ TOK_CLOSED ];

		if( -1 < pair[ TOK_PARENT ] )
		{
			var rPair = BracketPairs.find( pair[ TOK_PARENT ] );
			tMatch.__parent = SetParent( BracketPairs, rPair );
		}

		return tMatch;
	};

	var Analyzer = function( feeder )
	{
		/* @type {Components.Vim.LineFeeder} */
		this.__feeder = feeder;
		this.__tokpairs = {};
	};

	Analyzer.prototype.bracketAt = function( p )
	{
		var c = this.__feeder.content;
		var tokState = TOK_CLOSED;

		var BracketPairs = null;
		var cTok = c[ p ];

		switch( cTok )
		{
			case "{": tokState = TOK_OPEN;
			case "}":
					  BracketPairs = this.__getPairs( TOK_JOIN( "{", "}" ) );
				break;

			case "[": tokState = TOK_OPEN;
			case "]":
				BracketPairs = this.__getPairs( TOK_JOIN( "[", "]" ) );
				break;

			case "(": tokState = TOK_OPEN;
			case ")":
				BracketPairs = this.__getPairs( TOK_JOIN( "(", ")" ) );
				break;

			case "/":
				if( c[ p - 1 ] == "*" )
				{
					cTok = "*/";
					p --;
					break;
				}
				else if( c[ p + 1 ] == "*" )
				{
					cTok = "/*";
					break;
				}
				return new TokenMatch();

			case "*":
				if( c[ p - 1 ] == "/" )
				{
					cTok = "/*";
					p --;
					break;
				}
				else if( c[ p + 1 ] == "/" )
				{
					cTok = "*/";
					break;
				}
				return new TokenMatch();

			default:
				return new TokenMatch();
		}

		// Long Switch
		if( !BracketPairs ) switch( cTok )
		{
			case "/*": tokState = TOK_OPEN;
			case "*/":
				BracketPairs = this.__getPairs( TOK_JOIN( "/*", "*/" ) );
				break;

			default:
				return new TokenMatch();
		}

		var rPair = BracketPairs.find( p, tokState );
		var tMatch = SetParent( BracketPairs, rPair )
		tMatch.__selected = p;

		return tMatch;
	};

	Analyzer.prototype.bracketIn = function( b, p )
	{
		var bro = "{[(";
		var brc = "}])";

		var i = bro.indexOf( b );
		if( i < 0 ) i = brc.indexOf( b );
		if( i < 0 ) throw new Error( "Unsupported bracket: " + b );

		var tokPairs = this.__getPairs( TOK_JOIN( bro[i], brc[i] ) );
		var pairs = tokPairs.__pairs;

		var l = pairs.length;

		var highest = null;

		// Find the range of highest level
		for( var i = 0; i < l; i ++ )
		{
			var pair = pairs[ i ];

			if( pair[ TOK_OPEN ] <= p && p <= pair[ TOK_CLOSED ] )
			{
				if( ( highest && highest[ TOK_LEVEL ] < pair[ TOK_LEVEL ] ) || !highest )
				{
					highest = pair;
				}
			}

		}

		if( highest )
		{
			var tMatch = SetParent( tokPairs, highest );
			var oMatch = tMatch;

			do {
				oMatch.__open ++;
				oMatch.__close --;
			} while( oMatch = oMatch.parent )

			return tMatch;
		}

		return new TokenMatch();
	};

	Analyzer.prototype.__getPairs = function( def, reload )
	{
		if( !reload && this.__tokpairs[ def ] )
		{
			return this.__tokpairs[ def ];
		}

		var c = this.__feeder.content;
		var pairs = new TokenPairs( def, c );

		this.__tokpairs[ def ] = pairs;

		return pairs;
	};

	Analyzer.prototype.reset = function()
	{
		this.__tokpairs = {};
	};

	Analyzer.prototype.quoteAt = function( p )
	{
		var c = this.__feeder.content;
		switch( c[ p ] )
		{
			case "`":
			case "\"":
			case "\'":
			default:
				return {
					level: 0
					, open: -1
					, close: -1
				};
		}
	};

	Analyzer.prototype.wordAt = function( p )
	{
		var c = this.__feeder.content;
		var Len = c.length;
		var i = p, j = p;

		var word = new Word( c[ p ] );

		if( 0 < p ) while( word.test( c[ -- i ] ) );
		if( p < Len ) while( word.test( c[ ++ j ] ) );

		var tMatch = new TokenMatch();
		tMatch.__open = 0 < i ? i + 1 : 0;
		tMatch.__close = j - 1;

		return tMatch;
	};

	var TokenMatch = function()
	{
		this.__open = -1;
		this.__close = -1;
		this.__selected = -1;
		this.__level = -1;
		this.__parent = null;
	};

	__readOnly( TokenMatch.prototype, "parent", function() { return this.__parent; } );
	__readOnly( TokenMatch.prototype, "open", function() { return this.__open; } );
	__readOnly( TokenMatch.prototype, "close", function() { return this.__close; } );
	__readOnly( TokenMatch.prototype, "level", function() { return this.__level; } );
	__readOnly( TokenMatch.prototype, "selected", function() { return this.__selected; } );

	ns[ NS_EXPORT ]( EX_CLASS, "Analyzer", Analyzer );
	ns[ NS_EXPORT ]( EX_CLASS, "TokenMatch", TokenMatch );
})();
;BotanJS.define( "Components.Vim.LineBuffer" );(function(){
	var ns = __namespace( "Components.Vim" );

	var debug = __import( "System.Debug" );

	var occurence = __import( "System.utils.Perf.CountSubstr" );

	var LineBuffer = function( cols, nextLineBuffer )
	{
		this.prev = null;
		this.cols = cols;
		this.next = nextLineBuffer;
		this.br = false;
		this.placeholder = true;
		this.lineNum = 0;
		this.tabWidth = 8;

		if( nextLineBuffer )
		{
			nextLineBuffer.prev = this;
		}
	};

	LineBuffer.prototype.Push = function( content, wrap, n )
	{
		this.lineNum = n;
		if( content == undefined || content === "" )
		{
			this.lineNum = ++n;
			this.content = "~";
			this.br = true;
			this.placeholder = true;
			if( this.next ) this.next.Push( content, wrap, n + 1 );
			return;
		}

		this.placeholder = false;

		var line = "";
		var br = false;

		var i = 0;
		var numTabs = 0;
		var tabw = this.tabWidth - 1;
		if( wrap )
		{
			for( ; i < this.cols - numTabs * tabw; i ++ )
			{
				var c = content[i];
				if( c === undefined ) break;

				if( c == "\n" )
				{
					br = true;
					i ++;
					break;
				}
				else if( c == "\t" )
				{
					numTabs ++;
				}

				line += c;
			}

			if( !br && i == this.cols && content[i] == "\n" )
			{
				i ++;
				br = true;
			}
		}
		else
		{
			br = true;
			for( ; true; i ++ )
			{
				var c = content[i];
				if( c === undefined ) break;

				if( c == "\n" )
				{
					i ++;
					break;
				}
				else if( c == "\t" )
				{
					numTabs ++;
				}

				if( i < this.cols - numTabs * tabw )
				{
					line += c;
				}
			}
		}

		if( this.next )
		{
			this.next.br = br;
			this.next.Push( content.substr( i ), wrap, br ? n + 1 : n );
		}

		this.content = line;
	};

	LineBuffer.prototype.toString = function()
	{
		var c = this.cols - occurence( this.content, "\t" ) * ( this.tabWidth - 1 );
		if( this.content.length < c )
		{
			return this.content + " ";
		}

		return this.content || " ";
	};

	__readOnly( LineBuffer.prototype, "nextLine", function()
	{
		var line = this;
		var thisLine = this.lineNum;

		while( ( line = line.next ) && line.lineNum == thisLine );

		return line;
	} );

	__readOnly( LineBuffer.prototype, "visualLines", function()
	{
		var lines = [ this ];
		var line = this;
		while( ( line = line.next ) && !line.br )
		{
			lines.push( line );
		}

		return lines;
	} );

	ns[ NS_EXPORT ]( EX_CLASS, "LineBuffer", LineBuffer );
})();
;BotanJS.define( "Components.Vim.State.Recorder" );(function(){
	var ns = __namespace( "Components.Vim.State" );

	var Recorder = function()
	{
		this.__steps = [];
		this.__stacks = [];
		this.__i = 0;
		this.__j = 0;
		this.__saved = 0;
	};

	Recorder.prototype.undo = function()
	{
		var i = this.__i - 1;
		if( i == -1 || !this.__steps.length ) return null;


		return this.__steps[ this.__i = i ];
	};

	Recorder.prototype.redo = function()
	{
		var State = this.__steps[ this.__i ];

		if( State )
		{
			this.__i ++;
			return State;
		}

		return null;
	};

	Recorder.prototype.save = function()
	{
		this.__saved = this.__i;
	};

	Recorder.prototype.record = function( StateObj )
	{
		this.__steps[ this.__i ++ ] = StateObj;
		this.__stacks[ this.__j ++ ] = StateObj;

		delete this.__steps[ this.__i ];

		StateObj.id = this.__j;
	};

	__readOnly( Recorder.prototype, "changed", function() {
		return this.__saved != this.__i;
	} );

	ns[ NS_EXPORT ]( EX_CLASS, "Recorder", Recorder );
})();
;BotanJS.define( "Components.Vim" );VIMRE_VERSION = "1.0.0b";
(function(){
	var ns = __namespace( "Components.Vim" );

	var messages = {
		"INSERT": "-- INSERT --"
		, "REPLACE": "-- REPLACE --"
		, "MORE": "-- MORE --"
		, "VISUAL": "-- VISUAL  --"
		, "VISLINE": "-- VISUAL LINE --"
		, "REGISTERS": "--- Registers ---"
		, "WRITE": "\"%1\" %2L, %3C written"
		, "WAIT_FOR_INPUT": "Press ENTER or type command to continue"
		, "SEARCH_HIT_BOTTOM": "Seach hit BOTTOM, contining at TOP"
		, "TOP": "Top"
		, "BOTTOM": "Bot"
		, "ALL": "All"
		, "EXIT": "Type :quit<Enter>  to exit Vim"

		, "UNDO_LIMIT": "Already at oldest change"
		, "REDO_LIMIT": "Already at newest change"
		, "NCHANGES": "%1 change(s); before #%2  %3"

		, "LINES_FEWER": "%1 fewer line(s)"
		, "LINES_MORE": "%1 more line(s)"
		, "LINES_YANKED": "%1 line(s) yanked"
		, "LINES_SHIFTED": "%1 line(s) %2ed %3 time(s)"

		, "NO_SHIFT": "No line to %1"

		, "SEARCH_HIT_BOTTOM": "search hit BOTTOM, continuing at TOP"
		, "SEARCH_HIT_TOP": "search hit TOP, continuing at BOTTOM"
		, "REPLACE": "%1 substitution(s) on %2 line(s)"
	};

	var errors = {
		"E35": "No previous regular expression"
		, "E37": "No write since last change (add ! to override)"
		, "E481": "No range allowed"
		, "E492": "Not an editor command: %1"
		, "E486": "Pattern not found: %1"

		// EXtended Errors
		, "EX1": "Pattern Error( %1 )"
		, "EX2": "This pattern is causing infinite loop: %1"

		, "TODO": "%1 is not implemented yet"
		, "MISSING_FEATURE": "Sorry, I thought this command wasn't useful enough to implement. Please file a feature request titled \"Implement %1\" in github if you think this is important."
	};

	var GetString = function( arr, key, restArgs )
	{
		if( arr[ key ] == undefined ) return key;

		var i = 0;
		return arr[ key ].replace( /%\d+/g, function( e )
		{
			return restArgs[ i ++ ];
		} );
	};

	var Message = function( key )
	{
		var restArgs = Array.prototype.slice.call( arguments, 1 );
		return GetString( messages, key, restArgs );
	};

	var Error = function( key )
	{
		var restArgs = Array.prototype.slice.call( arguments, 1 );
		return key + ": " + GetString( errors, key, restArgs );
	};

	var bAudio = new Audio(
		/*{{{ Audio Data */
		"data:audio/ogg;base64,"
		+ "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"
		+ "wNE0QBM9QBNFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAcTQM0UQQ0UQQAAAAAAAAATRQB0VQB0TQBAAAAAAAAQBNFwDNFQDRVAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAcTQM0UQQ0UQQAAAAAAAAATRQBUTUBTzQBAAAAAAAAQBNFQDRNQFRNAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		+ "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"
		+ "AADA+zAAAAAwBVztbAIODg4="
		/*}}}*/
	);

	var Beep = function()
	{
		// Beep Async
		setTimeout(function() {
			bAudio.pause();
			bAudio.currentTime = 0;
			bAudio.play();
		}, 0 );
	};

	ns[ NS_EXPORT ]( EX_FUNC, "Message", Message );
	ns[ NS_EXPORT ]( EX_FUNC, "Error", Error );
	ns[ NS_EXPORT ]( EX_FUNC, "Beep", Beep );
})();
;BotanJS.define( "Components.Vim.Actions.WRITE" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	var Mesg = __import( "Components.Vim.Message" );

	var occurance = __import( "System.utils.Perf.CountSubstr" );

	/** @type {Components.Vim.IAction} */
	var WRITE = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	WRITE.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	WRITE.prototype.handler = function( e, p )
	{
		e.preventDefault();

		var cur = this.__cursor;
		var Vim = cur.Vim;
		Vim.content = cur.feeder.content.slice( 0, -1 );

		var msg = Mesg( "WRITE", Vim.stage.element.id, occurance( Vim.content, "\n" ), Vim.content.length );

		cur.rec.save();

		var l = this.__cursor.feeder.firstBuffer.cols;
		for( var i = msg.length; i < l; i ++ ) msg += " ";

		this.__msg = msg;
	};

	WRITE.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "WRITE", WRITE );
})();
;BotanJS.define( "Components.Vim.DateTime.String" );(function(){
	var ns = __namespace( "Components.Vim.DateTime" );

	var messages = {
		  "AboutAMinuteAgo"                 : "about a minute ago"
		, "AboutAMonthAgo"                  : "about a month ago"
		, "AboutAnHourAgo"                  : "about an hour ago"
		, "AboutAWeekAgo"                   : "about a week ago"
		, "last Friday"                     : "last Friday"
		, "last Monday"                     : "last Monday"
		, "last Saturday"                   : "last Saturday"
		, "last Sunday"                     : "last Sunday"
		, "last Thursday"                   : "last Thursday"
		, "last Tuesday"                    : "last Tuesday"
		, "last Wednesday"                  : "last Wednesday"
		, "on Friday"                       : "on Friday"
		, "on Monday"                       : "on Monday"
		, "on Saturday"                     : "on Saturday"
		, "on Sunday"                       : "on Sunday"
		, "on Thursday"                     : "on Thursday"
		, "on Tuesday"                      : "on Tuesday"
		, "on Wednesday"                    : "on Wednesday"
		, "OverAYearAgo"                    : "over a year ago"
		, "XHoursAgo_2To4"                  : "%1 hours ago"
		, "XHoursAgo_EndsIn1Not11"          : "%1 hours ago"
		, "XHoursAgo_EndsIn2To4Not12To14"   : "%1 hours ago"
		, "XHoursAgo_Other"                 : "%1 hours ago"
		, "XMinutesAgo_2To4"                : "%1 minutes ago"
		, "XMinutesAgo_EndsIn1Not11"        : "%1 minutes ago"
		, "XMinutesAgo_EndsIn2To4Not12To14" : "%1 minutes ago"
		, "XMinutesAgo_Other"               : "%1 minutes ago"
		, "XMonthsAgo_2To4"                 : "%1 months ago"
		, "XMonthsAgo_5To12"                : "%1 months ago"
		, "XSecondsAgo_2To4"                : "%1 seconds ago"
		, "XSecondsAgo_EndsIn1Not11"        : "%1 seconds ago"
		, "XSecondsAgo_EndsIn2To4Not12To14" : "%1 seconds ago"
		, "XSecondsAgo_Other"               : "%1 seconds ago"
		, "XWeeksAgo_2To4"                  : "%1 weeks ago"
	};

	var GetString = function( arr, key, restArgs )
	{
		if( arr[ key ] == undefined ) return key;

		var i = 0;
		return arr[ key ].replace( /%\d+/g, function( e )
		{
			return restArgs[ i ++ ];
		} );
	};

	var DateTimeString = function( key )
	{
		var restArgs = Array.prototype.slice.call( arguments, 1 );
		return GetString( messages, key, restArgs );
	};

	ns[ NS_EXPORT ]( EX_FUNC, "String", DateTimeString );
})();
;BotanJS.define( "Components.Vim.DateTime" );(function(){
	var ns = __namespace( "Components.Vim.DateTime" );

	var Minute = 60;
	var Hour = 60 * Minute;
	var Day = 24 * Hour;
	var Week = 7 * Day;
	var Month = 30.5 * Day;
	var Year = 365 * Day;

	var Mesg = ns[ NS_INVOKE ]( "String" );

	var PluralHourStrings = [
		"XHoursAgo_2To4",
		"XHoursAgo_EndsIn1Not11",
		"XHoursAgo_EndsIn2To4Not12To14",
		"XHoursAgo_Other"
	];

	var PluralMinuteStrings = [
		"XMinutesAgo_2To4",
		"XMinutesAgo_EndsIn1Not11",
		"XMinutesAgo_EndsIn2To4Not12To14",
		"XMinutesAgo_Other"
	];

	var PluralSecondStrings = [
		"XSecondsAgo_2To4",
		"XSecondsAgo_EndsIn1Not11",
		"XSecondsAgo_EndsIn2To4Not12To14",
		"XSecondsAgo_Other"
	];

	var DayOfWeek = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

	var GetPluralMonth = function( month )
	{
		if ( month >= 2 && month <= 4 )
		{
			return Mesg( "XMonthsAgo_2To4", month );
		}
		else if ( month >= 5 && month <= 12 )
		{
			return Mesg( "XMonthsAgo_5To12", month );
		}
		else
		{
			throw new Error( "Invalid number of Months" );
		}
	};

	var GetLastDayOfWeek = function( dow )
	{
		var result;
		switch ( dow )
		{
			case DayOfWeek.Monday:
				result = Mesg( "last Monday" );
				break;
			case DayOfWeek.Tuesday:
				result = Mesg( "last Tuesday" );
				break;
			case DayOfWeek.Wednesday:
				result = Mesg( "last Wednesday" );
				break;
			case DayOfWeek.Thursday:
				result = Mesg( "last Thursday" );
				break;
			case DayOfWeek.Friday:
				result = Mesg( "last Friday" );
				break;
			case DayOfWeek.Saturday:
				result = Mesg( "last Saturday" );
				break;
			case DayOfWeek.Sunday:
				result = Mesg( "last Sunday" );
				break;
			default:
				result = Mesg( "last Sunday" );
				break;
		}

		return result;
	};

	var GetOnDayOfWeek = function( dow )
	{
		var result;

		switch( dow )
		{
			case DayOfWeek.Monday:
				result = Mesg( "on Monday" );
				break;
			case DayOfWeek.Tuesday:
				result = Mesg( "on Tuesday" );
				break;
			case DayOfWeek.Wednesday:
				result = Mesg( "on Wednesday" );
				break;
			case DayOfWeek.Thursday:
				result = Mesg( "on Thursday" );
				break;
			case DayOfWeek.Friday:
				result = Mesg( "on Friday" );
				break;
			case DayOfWeek.Saturday:
				result = Mesg( "on Saturday" );
				break;
			case DayOfWeek.Sunday:
				result = Mesg( "on Sunday" );
				break;
			default:
				result = Mesg( "on Sunday" );
				break;
		}

		return result;
	};

	var GetPluralTimeUnits = function( units, resources )
	{
		var modTen = units % 10;
		var modHundred = units % 100;

		if ( units <= 1 )
		{
			throw new Error( "Invalid number of Time units" );
		}
		else if ( 2 <= units && units <= 4 )
		{
			return Mesg( resources[ 0 ], units );
		}
		else if ( modTen == 1 && modHundred != 11 )
		{
			return Mesg( resources[ 1 ], units );
		}
		else if ( ( 2 <= modTen && modTen <= 4 ) && !( 12 <= modHundred && modHundred <= 14 ) )
		{
			return Mesg( resources[ 2 ], units );
		}
		else
		{
			return Mesg( resources[ 3 ], units );
		}
	};

	var RelativeTime = function( given )
	{
		var diffSecs = Math.round( 0.001 * ( new Date().getTime() - given.getTime() ) );

		if( Year < diffSecs )
		{
			result = Mesg( "OverAYearAgo" );
		}
		else if( ( 1.5 * Month ) < diffSecs )
		{
			var nMonths = Math.round( ( diffSecs + Month / 2 ) / Month );
			result = GetPluralMonth( nMonths );
		}
		else if( ( 3.5 * Week ) <= diffSecs )
		{
			result = Mesg( "AboutAMonthAgo" );
		}
		else if( Week <= diffSecs )
		{
			var nWeeks = Math.round( diffSecs / Week );
			if ( 1 < nWeeks )
			{
				result = Mesg( "XWeeksAgo_2To4", nWeeks );
			}
			else
			{
				result = Mesg( "AboutAWeekAgo" );
			}
		}
		else if ( ( 5 * Day ) <= diffSecs )
		{
			result = GetLastDayOfWeek( given.getDay() );
		}
		else if ( Day <= diffSecs )
		{
			result = GetOnDayOfWeek( given.getDay() );
		}
		else if ( ( 2 * Hour ) <= diffSecs )
		{
			var nHours = Math.round( diffSecs / Hour );
			result = GetPluralTimeUnits( nHours, PluralHourStrings );
		}
		else if ( Hour <= diffSecs )
		{
			result = Mesg( "AboutAnHourAgo" );
		}
		else if ( ( 2 * Minute ) <= diffSecs )
		{
			var nMinutes = Math.round( diffSecs / Minute );
			result = GetPluralTimeUnits( nMinutes, PluralMinuteStrings );
		}
		else if ( Minute <= diffSecs )
		{
			result = Mesg( "AboutAMinuteAgo" );
		}
		else
		{
			var nSeconds =  1 < diffSecs ? diffSecs : 2;
			result = GetPluralTimeUnits( nSeconds, PluralSecondStrings );
		}

		return result;
	};

	ns[ NS_EXPORT ]( EX_FUNC, "RelativeTime", RelativeTime );
})();
;BotanJS.define( "Components.Vim.State.Stack" );(function(){
	var ns = __namespace( "Components.Vim.State" );

	/** @type {Components.Vim.DateTime} */
	var RelativeTime = __import( "Components.Vim.DateTime.RelativeTime" );

	var Stack = function() { };

	Stack.prototype.store = function( handler )
	{
		this.__handler = handler;
		this.__time = new Date();
		this.id = 0;
	};

	Stack.prototype.play = function()
	{
		if( this.__handler ) this.__handler();
	};

	__readOnly( Stack.prototype, "time", function()
	{
		return RelativeTime( this.__time );
	} );

	ns[ NS_EXPORT ]( EX_CLASS, "Stack", Stack );
})();
;BotanJS.define( "Components.Vim.Actions.FIND" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	var VimError = __import( "Components.Vim.Error" );
	var Mesg = __import( "Components.Vim.Message" );

	// Private static
	var PATTERN = [];

	var ParsePattern = function( pattern )
	{
		var parsed = "";
		var l = pattern.length;

		for( var i = 1; i < l; i ++ )
		{
			switch( pattern[ i ] )
			{
				case "^I":
					parsed += "\t";
					break;
				case "\\":
					var tok = pattern[ ++ i ];
					if( "nrts.[]()^".indexOf( tok ) != -1 )
					{
						parsed += "\\" + tok;
					}
					else
					{
						throw new Error( "Missing token impl: \"" + tok + "\"" );
					}
					break;
				default:
					parsed += pattern[ i ];
			}
		}

		// The root bracket as back ref 0
		var RegEx = new RegExp( "(" +  parsed + ")", "gm" );

		return RegEx;
	};

	/** @type {Components.Vim.IAction} */
	var FIND = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	FIND.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	FIND.prototype.handler = function( e, p )
	{
		e.preventDefault();

		if( p )
		{
			if( p.length < 2 )
			{
				if( PATTERN.length < 1 )
				{
					this.__msg = VimError( "E35" );
					return true;
				}
				else p = PATTERN;
			}

			PATTERN = p;
		}

		if( PATTERN.length < 1 )
		{
			this.__msg = VimError( "E35" );
			return true;
		}

		var search;
		try
		{
			search = ParsePattern( PATTERN );
		}
		catch( ex )
		{
			this.__msg = VimError( "EX1", ex.message );
			return true;
		}

		var content = this.__cursor.feeder.content;

		var cur = this.__cursor;
		var p = cur.aPos;

		var r;
		var Hit;
		var FirstHit;
		var PrevStack = [];

		var LoopGuard;
		while( ( r = search.exec( content ) ) !== null )
		{
			if( FirstHit == undefined )
			{
				FirstHit = r.index;
			}

			if( LoopGuard == r.index )
			{
				this.__msg = VimError( "EX2", PATTERN.slice( 1 ).join( "" ) );
				return true;
			}

			if( p < r.index )
			{
				Hit = r.index;
				break;
			}

			PrevStack.push( r.index );
			LoopGuard = r.index;
		}

		this.__msg = PATTERN.join( "" )

		if( e.kMap( "N" ) )
		{
			Hit = PrevStack[ PrevStack.length - 2 ];
			if( Hit == undefined )
			{
				this.__msg = Mesg( "SEARCH_HIT_TOP" );

				while( ( r = search.exec( content ) ) !== null ) Hit = r.index;
			}
		}
		else if( FirstHit != undefined && Hit == undefined )
		{
			// Search Hit Bottom
			Hit = FirstHit;
			this.__msg = Mesg( "SEARCH_HIT_BOTTOM" );
		}

		if( Hit == undefined )
		{
			this.__msg = VimError( "E486", PATTERN.slice( 1 ).join( "" ) );
		}
		else
		{
			cur.moveTo( Hit );
		}
	};

	FIND.prototype.getMessage = function()
	{
		return this.__msg;
	};

	__static_method( FIND, "Pattern", ParsePattern );

	ns[ NS_EXPORT ]( EX_CLASS, "FIND", FIND );
})();
;BotanJS.define( "Components.Vim.Actions.REPLACE" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	/** @type {Components.Vim.State.Stack} */
	var Stack                                  = __import( "Components.Vim.State.Stack" );

	var VimError = __import( "Components.Vim.Error" );
	var Mesg = __import( "Components.Vim.Message" );

	var occurence = __import( "System.utils.Perf.CountSubstr" );

	/** @type {Components.Vim.Actions.FIND} */
	var FIND = ns[ NS_INVOKE ]( "FIND" );

	var REPL_BEFORE = 0;
	var REPL_OFFSET = 1;
	var REPL_LENGTH = 2;

	var ParseReplace = function( repl )
	{
		var parsed = "";
		var l = repl.length;
		var rStack = [ "" ]

		for( var i = 1; i < l; i ++ )
		{
			switch( repl[ i ] )
			{
				case "^I":
					parsed += "\t";
					break;

				case "\\":
					i ++;

					var j = repl[ i ];
					if( "$nrt\\".indexOf( j ) != -1 )
					{
						parsed += JSON.parse( "\"\\" + j + "\"" );
						break;
					}

					// 9 is shifted by 0
					// which I think is more important
					if( "012345678".indexOf( j ) != -1 )
					{
						rStack.push( parsed.length );
						parsed += j;
					}
					else if( j == "9" )
					{
						throw new Error( "Back ref 9 is reserved for back ref 0" );
					}
					else
					{
						throw new Error( "Missing token impl: \"" + tok + "\"" );
					}
					break;

				default:
					parsed += repl[ i ];
			}
		}

		rStack[0] = parsed;
		return rStack;
	};

	/** @type {Components.Vim.IAction} */
	var REPLACE = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";

		this.__repl = "";
		this.__replLen = 0;
		this.__replCallback = this.__replCallback.bind( this );

		this.__pOffset = 0;

		this.__replacedGroups = [];

		Cursor.suppressEvent();
	};

	REPLACE.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	REPLACE.prototype.handler = function( e, p )
	{
		e.preventDefault();

		var search;
		var spattern;

		try
		{
			var slash = p.indexOf( "/", 0 );
			var secSlash = p.indexOf( "/", slash + 1 );
			if( slash == -1 )
			{
				this.__msg = VimError( "MISSING_FEATURE", "REPLACE %s" );
				return true;
			}
			else if( secSlash == -1 )
			{
				search = FIND.Pattern( p );
				spattern = p;
			}
			else
			{
				spattern = p.slice( slash, secSlash );
				search = FIND.Pattern( spattern );

				var thdSlash = p.indexOf( "/", secSlash + 1 );
				if( thdSlash == -1 )
				{
					this.__repl = ParseReplace( p.slice( secSlash ) );
				}
				else
				{
					this.__repl = ParseReplace( p.slice( secSlash, thdSlash ) );
				}

				this.__replLen = this.__repl[0].length;
			}
		}
		catch( ex )
		{
			this.__msg = VimError( "EX1", ex.message );
			return true;
		}

		debug.Info( "Replace: " + search + ", [ " + this.__repl + " ]" );

		var feeder = this.__cursor.feeder;
		var content = feeder.content.slice( 0, -1 )
			.replace( search, this.__replCallback ) + "\n";

		var numSubs = this.__replacedGroups.length;
		if( !numSubs )
		{
			this.__msg = VimError( "E486", spattern.join( "" ) );
		}

		feeder.content = content;

		this.__msg = Mesg( "REPLACE", numSubs, "<TODO>" );

		// Record this step for UNDO / REDO
		this.__rec();

		/* Move the cursor to last replaced line
		var cur = this.__cursor;
		var p = cur.aPos;
		*/

		feeder.pan();
		feeder.softReset();

		return true;
	};

	REPLACE.prototype.__replCallback = function()
	{
		var match = arguments[0];
		var backRefs = Array.prototype.slice.call( arguments, 1, -2 );

		var offset = this.__pOffset + arguments[ arguments.length - 2 ];

		var replacedStr = "";
		var replCand = this.__repl[0];

		for( var i = 0; i < this.__replLen; i ++ )
		{
			var j = this.__repl.indexOf( i, 1 );
			if( j == -1 )
			{
				replacedStr += replCand[ i ];
			}
			else
			{
				replacedStr += backRefs[ replCand[ this.__repl[ j ] ] ];
			}
		}

		var rLen = replacedStr.length;
		this.__pOffset += rLen - match.length;

		var ReplObj = [];
		ReplObj[ REPL_BEFORE ] = match;
		ReplObj[ REPL_OFFSET ] = offset;
		ReplObj[ REPL_LENGTH ] = rLen;

		this.__replacedGroups.push( ReplObj );

		return replacedStr;
	};

	REPLACE.prototype.__rec = function()
	{
		var stack = new Stack();

		var reGroups = this.__replacedGroups;
		var l = reGroups.length;
		var cur = this.__cursor;
		var feeder = cur.feeder;

		stack.store( function()
		{
			var cont = feeder.content;
			var newCont = "";
			var st = 0;

			var curStart = -1;
			for( var i = 0; i < l; i ++ )
			{
				var grp = reGroups[ i ];

				var RO = grp[ REPL_OFFSET ];
				var RL = grp[ REPL_LENGTH ];
				var RB = grp[ REPL_BEFORE ];

				var NRL = RB.length;
				newCont += cont.substring( st, RO ) + RB;

				st = grp[ REPL_OFFSET ] + RL;

				grp[ REPL_BEFORE ] = cont.substr( RO, RL );

				grp[ REPL_OFFSET ] = newCont.length - NRL;
				grp[ REPL_LENGTH ] = NRL;

				if( curStart == -1 )
				{
					curStart = RO;
				}
			}

			newCont += cont.substring( st );

			feeder.content = newCont;
			cur.moveTo( curStart );
			feeder.pan();

		} );

		cur.rec.record( stack );
	};

	REPLACE.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "REPLACE", REPLACE );
})();
;BotanJS.define( "Components.Vim.Actions.YANK" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug = __import( "System.Debug" );

	var Mesg = __import( "Components.Vim.Message" );
	var beep = __import( "Components.Vim.Beep" );

	var occurence = __import( "System.utils.Perf.CountSubstr" );

	/** @type {Components.Vim.IAction} */
	var YANK = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__startX = Cursor.aPos;
		this.__msg = "";

		Cursor.suppressEvent();
	};

	YANK.prototype.allowMovement = true;

	YANK.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	YANK.prototype.handler = function( e, sp, newLine )
	{
		e.preventDefault();

		if( e.ModKeys || e.kMap( "i" ) ) return;

		/** @type {Components.Vim.State.Registers} */
		var reg = e.target.registers;

		var cur = this.__cursor;
		var feeder = cur.feeder;

		var Triggered = false;

		if( sp == undefined )
		{
			Triggered = true;

			sp = this.__startX;

			var currAp = cur.aPos;
			if( this.__startX != currAp )
			{
				if( e.kMap( "^" ) )
				{
					sp --;
				}
				else if( e.kMap( "l" ) )
				{
					cur.moveX( -1 );
				}
				else if( e.kMap( "h" ) )
				{
					sp = currAp;
				}
				else if( e.kMap( "j" ) )
				{
					newLine = true;
					cur.lineEnd( true );
					sp = cur.aPos;
					cur.moveY( -1 );
					cur.lineStart();
					this.__startX = cur.aPos;
				}
				else if( e.kMap( "k" ) )
				{
					newLine = true;
					cur.moveY( 1 );
					cur.lineEnd( true );
					sp = cur.aPos;
					cur.moveY( -1 );
					cur.lineStart();
				}
				else if( this.__startX < currAp )
				{
					// Swap the movement
					// This is to move the REDO / UNDO Cursor
					// position to the earlier position
					sp = currAp;
					cur.moveTo( this.__startX );
				}
			}
			else
			{
				if( e.kMap( "y" ) )
				{
					newLine = true;
					cur.lineEnd( true );
					sp = cur.aPos;
					cur.lineStart();
				}
				else if( e.range )
				{
					sp = e.range.close;
					cur.moveTo( e.range.open, true );
				}
				else if( e.kMap( "^" ) )
				{
					return true;
				}
				// this is the same as kMap( "h" ) above
				else if( e.kMap( "$" ) )
				{
					sp = cur.aPos;
				}
				else
				{
					beep();
					return true;
				}
			}
		}

		var s = sp;
		var e = cur.aPos;

		if( e < s )
		{
			s = cur.aPos;
			e = sp;
		}

		cur.moveTo( s );

		var yText = cur.feeder.content.substring( s, e + 1 );

		reg.yank( yText, newLine );

		var nline = occurence( yText, "\n" );
		if( nline )
		{
			this.__msg = Mesg( "LINES_YANKED", nline );
		}

		return Triggered;
	};

	YANK.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "YANK", YANK );
})();
;BotanJS.define( "Components.Vim.State.Stator" );(function(){
	var ns = __namespace( "Components.Vim.State" );

	var Stator = function( cur, start )
	{
		this.__cursor = cur;
		this.__startPosition = start == undefined ? cur.aPos : start;
		this.__startState = this.__saveCur();
	};

	Stator.prototype.save = function( insertLength, contentUndo, removeLen )
	{
		if( removeLen == undefined ) removeLen = 0;
		var cur = this.__cursor;
		var feeder = cur.feeder;
		var startPos = this.__startPosition - removeLen;

		var sSt = this.__startState;
		var eSt = this.__saveCur();

		var st = sSt;
		// Calling this repeatedly will swap between UNDO / REDO state
		return function() {
			var contentRedo = feeder.content.substr( startPos, insertLength );
			feeder.content =
				feeder.content.substring( 0, startPos )
				+ contentUndo
				+ feeder.content.substring( startPos + insertLength );
			insertLength = contentUndo.length;
			contentUndo = contentRedo;

			cur.PStart = st.p;
			cur.PEnd = st.p + 1;
			cur.X = st.x;
			cur.Y = st.y;
			cur.pX = st.cpX - 1;
			feeder.panX = st.px;
			feeder.panY = st.py;

			feeder.pan();

			st = ( st == sSt ) ? eSt : sSt;
		};
	};

	Stator.prototype.__saveCur = function()
	{
		var c = this.__cursor;
		var obj = {
			p: c.PStart
			, x: c.X
			, y: c.Y
			, cpX: c.pX
			, px: c.feeder.panX
			, py: c.feeder.panY
		};

		if( 0 < obj.x )
		{
			obj.p -= 1;
			obj.x -= 1;
		}

		return obj;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "Stator", Stator );
})();
;BotanJS.define( "Components.Vim.Actions.DELETE" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug = __import( "System.Debug" );

	/** @type {Components.Vim.State.Stator} */
	var Stator                                 = __import( "Components.Vim.State.Stator" );
	/** @type {Components.Vim.State.Stack} */
	var Stack                                  = __import( "Components.Vim.State.Stack" );

	var Mesg = __import( "Components.Vim.Message" );
	var beep = __import( "Components.Vim.Beep" );

	var occurence = __import( "System.utils.Perf.CountSubstr" );

	/** @type {Components.Vim.IAction} */
	var DELETE = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__nline = 0;
		this.__startX = Cursor.aPos;
		this.__panY = this.__cursor.feeder.panY;

		Cursor.suppressEvent();
	};

	DELETE.prototype.allowMovement = true;

	DELETE.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	DELETE.prototype.handler = function( e, sp, newLine )
	{
		e.preventDefault();

		if( e.ModKeys ) return;

		/** @type {Components.Vim.State.Registers} */
		var reg = e.target.registers;

		var cur = this.__cursor;
		var feeder = cur.feeder;

		// Do nothing if content is considered empty
		if( feeder.firstBuffer.next.placeholder && feeder.content.length < 2 )
		{
			debug.Info( "Content is empty" );
			return true;
		}

		var Triggered = false;

		if( sp == undefined )
		{
			Triggered = true;

			sp = this.__startX;

			var currAp = cur.aPos;
			if( this.__startX != currAp )
			{
				// Remove to start
				if( e.kMap( "^" ) )
				{
					sp --;
				}
				// Remove char in cursor
				else if( e.kMap( "l" ) )
				{
					cur.moveX( -1 );
				}
				// Remove char before cursor
				else if( e.kMap( "h" ) )
				{
					sp = currAp;
				}
				// Remove the current and the following line
				else if( e.kMap( "j" ) )
				{
					newLine = true;
					cur.lineEnd( true );
					sp = cur.aPos;
					cur.moveY( -1 );
					cur.lineStart();
					this.__startX = cur.aPos;
				}
				// Remove the current and the preceding line
				else if( e.kMap( "k" ) )
				{
					newLine = true;
					cur.moveY( 1 );
					cur.lineEnd( true );
					sp = cur.aPos;
					cur.moveY( -1 );
					cur.lineStart();
				}
				else if( this.__startX < currAp )
				{
					// Swap the movement
					// This is to move the REDO / UNDO Cursor
					// position to the earlier position
					sp = currAp;
					cur.moveTo( this.__startX );
				}
			}
			// Remove the current line
			else
			{
				if( e.kMap( "d" ) )
				{
					newLine = true;
					cur.lineEnd( true );
					sp = cur.aPos;
					cur.lineStart();
				}
				else if( e.range )
				{
					sp = e.range.close;
					cur.moveTo( e.range.open, true );
				}
				else if( e.kMap( "^" ) )
				{
					// Do nothing as nothing can be removed
					// since there is no successful movement
					return true;
				}
				// this is the same as kMap( "h" ) above
				else if( e.kMap( "$" ) )
				{
					sp = cur.aPos;
				}
				else
				{
					beep();
					return true;
				}
			}
		}

		// last "\n" padding
		var c = feeder.content.slice( 0, -1 );

		var s = sp;
		var e = cur.aPos;

		if( e < s )
		{
			s = cur.aPos;
			e = sp;
		}

		var removed = c.substring( s, e + 1 );
		reg.change( removed, newLine );

		this.__nline = occurence( removed, "\n" );

		feeder.content = c.substring( 0, s ) + c.substring( e + 1 ) + "\n";

		// Try to keep the original panning if possible
		feeder.pan( undefined
			, this.__panY < feeder.panY
				? this.__panY - feeder.panY
				: undefined
		);
		cur.moveTo( s );

		var stator = new Stator( cur, s );
		var stack = new Stack();

		var f = stator.save( 0, removed );
		stack.store( function() {
			f();
			// Offset correction after REDO / UNDO
			cur.moveX( 1 );
		} );

		cur.rec.record( stack );

		return Triggered;
	};

	DELETE.prototype.getMessage = function()
	{
		if( this.__nline )
		{
			return Mesg( "LINES_FEWER", this.__nline );
		}

		return "";
	};

	ns[ NS_EXPORT ]( EX_CLASS, "DELETE", DELETE );
})();
;BotanJS.define( "Components.Vim.Actions.SHIFT_LINES" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );
	var beep = __import( "Components.Vim.Beep" );

	/** @type {Components.Vim.State.Stator} */
	var Stator                                 = __import( "Components.Vim.State.Stator" );
	/** @type {Components.Vim.State.Stack} */
	var Stack                                  = __import( "Components.Vim.State.Stack" );

	var VimError = __import( "Components.Vim.Error" );
	var Mesg = __import( "Components.Vim.Message" );

	var occurence = __import( "System.utils.Perf.CountSubstr" );

	/** @type {Components.Vim.IAction}
	 *  Cursor @param {Components.Vim.Cursor}
	 *  e @param {Components.Vim.ActionEvent}
	 **/
	var SHIFT_LINES = function( Cursor, e )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__startX = Cursor.aPos;
		this.__msg = "<LINE_SHIFT>";

		this.__slineNum = Cursor.getLine().lineNum;

		this.__lines = e.count - 1;
		debug.Info( "Open shift: " + this.__lines + " line(s) from the cursor" );

		this.__direction = e.kMap( ">" ) ? 1 : -1;
		debug.Info( "Direction is: " + ( this.__direction == 1 ? ">" : "<" ) );

		Cursor.suppressEvent();
	};

	SHIFT_LINES.prototype.allowMovement = true;

	SHIFT_LINES.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	SHIFT_LINES.prototype.handler = function( e, sp )
	{
		e.preventDefault();

		if( e.ModKeys || e.kMap( "i" ) ) return;

		var cur = this.__cursor;
		var feeder = cur.feeder;

		var Triggered = false;
		var dir = this.__direction;

		var start = this.__slineNum;
		var nline = this.__lines;
		var indentMult = 1;

		if( 1 < e.count )
		{
			nline += ( e.count - 1 );
		}

		// default: >>, <<, >l, <h
		var end = start;

		var shiftCount = 1;
		if( sp == undefined )
		{
			Triggered = true;

			sp = this.__startX;

			var currAp = cur.aPos;

			if( this.__startX != currAp )
			{
				start = 0; end = 0;

				if( nline )
				{
					if( currAp < sp )
					{
						start -= ( nline - 1 );
					}
					else
					{
						end += ( nline - 1 );
					}
					console.log( start, end );
				}

				if( currAp < sp )
				{
					sp = sp + currAp;
					currAp = sp - currAp;
					sp = sp - currAp;
				}

				for( var i = 0; i < currAp; i ++ )
				{
					if( feeder.content[ i ] == "\n" )
					{
						end ++;
						if( i < sp )
						{
							start ++;
						}
					}
				}
			}
			else
			{
				if( e.range )
				{
					sp = e.range.close;

					start = 1; end = -1;
					for( var i = 0; i < sp; i ++ )
					{
						if( feeder.content[ i ] == "\n" )
						{
							end ++;
							if( i < e.range.open )
							{
								start ++;
							}
						}
					}

					if( end == -1 )
					{
						start = end = 0;
					}

					if( end < start )
					{
						end = -- start;
					}

					indentMult = e.count;
				}
				else if( 0 < dir && ( e.kMap( ">" ) || e.kMap( "l" ) ) );
				else if( dir < 0 && ( e.kMap( "<" ) || e.kMap( "h" ) ) );
				else
				{
					beep();
					return true;
				}
			}
		}
		// VISUAL Mode
		else
		{
			start = 0;
			for( var i = 0; i < sp; i ++ )
			{
				if( feeder.content[ i ] == "\n" ) start ++;
			}

			end = this.__slineNum;

			indentMult = e.count;
		}

		if( end < start )
		{
			start = start + end;
			end = start - end;
			start = start - end;
		}

		// last "\n" padding
		var c = feeder.content.slice( 0, -1 );

		var indents = c.match( /^[\t ]+/gm );
		var indentChar = "\t";
		var tabwidth = feeder.firstBuffer.tabWidth;

		if( indents )
		{
			var l = indents.length - 1;

			if( 1 < l )
			{
				debug.Info( "Guessing the tabstop:" );
				var tabOccr = 0;
				var spOccr = 0;

				// Guess indent
				var tabStat = [];

				for( var i = 0; i < l; i ++ )
				{
					var ind = indents[ i ];
					var indNext = indents[ i + 1 ];
					tabOccr += occurence( ind, "\t" );
					spOccr += occurence( ind, " " );
					var d = indNext.length - ind.length;
					if( d == 0 ) continue;

					d = d < 0 ? -d : d;

					if( !tabStat[ d ] ) tabStat[ d ] = 0;

					tabStat[ d ] ++;
				}

				var upperDiff = 0;
				var indentCLen = 0;
				for( var i in tabStat )
				{
					i = Number( i );
					var p = tabStat[ i ];
					if( upperDiff < p )
					{
						upperDiff = p;
						indentCLen = i;
					}
				}

				spOccr /= indentCLen;

				if( tabOccr < spOccr )
				{
					indentChar = "";
					for( var i = 0; i < indentCLen; i ++ ) indentChar += " ";
				}

				tabwidth = indentCLen;

				debug.Info( "\tTab count: " + tabOccr );
				debug.Info( "\tSpace count: " + spOccr );
				debug.Info( "\ti.e. indent using " + JSON.stringify( indentChar ) );
			}
			else
			{
				debug.Info( "Not enough tabs to determine the tabstop, using default" );
			}
		}

		debug.Info( "Start: " + start, "End: " + end );
		var rBlock = "";
		var nLen = 0;

		var started = false;

		var recStart = 0;

		feeder.content = "";
		nline = 0;

		var indented = "";
		for( var i = 0; i < indentMult; i ++ ) indented += indentChar;

		for( var i = 0, j = 0; 0 <= i; i = c.indexOf( "\n", i ), j ++ )
		{
			i ++;

			if( j < start ) continue;
			else if( !started )
			{
				started = true;
				feeder.content = c.substring( 0, i - 1 );
				recStart = feeder.content.length;
			}

			if( end < j ) break;

			var line = c.indexOf( "\n", i );
			if( ~line )
			{
				line = c.substring( 1 < i ? i : i - 1, line );
			}
			else
			{
				line = c.substring( 1 < i ? i : i - 1 );
			}

			if( 1 < i )
			{
				feeder.content += "\n";
				rBlock += "\n";
				nLen ++;
			}

			rBlock += line;

			if( line !== "" )
			{
				var indentedLine;
				if( 0 < dir )
				{
					indentedLine = indented + line;
				}
				else
				{
					for( var si = 0, sj = 0; si < indentMult; si ++ )
					{
						var startC = line[ sj ];
						if( startC == " " )
						{
							for( var swidth = tabwidth + ( sj ++ ); sj < swidth; sj ++ )
							{
								if( !~"\t ".indexOf( line[ sj ] ) ) break;
							}
						}
						else if( startC == "\t" )
						{
							sj ++;
						}
						else break;
					}

					indentedLine = line.substring( sj );
				}

				feeder.content += indentedLine;

				nLen += indentedLine.length;
				nline ++;
			}
		}
 
		var nPos = feeder.content.length;
		feeder.content += "\n";

		if( ~i ) feeder.content += c.substring( i ) + "\n";
		feeder.pan();

		cur.moveTo( nPos );

		var stator = new Stator( cur, recStart );
		var stack = new Stack();

		recStart ++;
		for( ; ~"\t ".indexOf( feeder.content[ recStart ] ); recStart ++ );

		var f = stator.save( nLen, rBlock );
		stack.store( function() {
			f();
			// Offset correction after REDO / UNDO
			cur.moveTo( recStart );
			cur.lineStart();
		} );

		cur.moveTo( recStart );

		cur.rec.record( stack );

		if( nline )
		{
			this.__msg = Mesg( "LINES_SHIFTED", nline, dir < 0 ? "<" : ">", indentMult );
		}
		else
		{
			this.__msg = Mesg( "NO_SHIFT", dir < 0 ? "<" : ">" );
		}

		return Triggered;
	};

	SHIFT_LINES.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "SHIFT_LINES", SHIFT_LINES );
})();
;BotanJS.define( "Components.Vim.Actions.VISUAL" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug = __import( "System.Debug" );

	var Mesg = __import( "Components.Vim.Message" );

	/** @type {Components.Vim.IAction} */
	var YANK = ns[ NS_INVOKE ]( "YANK" );
	/** @type {Components.Vim.IAction} */
	var DELETE = ns[ NS_INVOKE ]( "DELETE" );
	/** @type {Components.Vim.IAction} */
	var SHIFT_LINES = ns[ NS_INVOKE ]( "SHIFT_LINES" );

	var MODE_NULL = -1;
	var MODE_VISUAL = 0;
	var MODE_LINE = 1;

	// The offset of given line relative to content
	var offsetY = function( cur, l )
	{
		if( l == 0 ) return 0;

		var f = cur.feeder;

		var j = 0;

		var last = -1;
		for( var i = f.content.indexOf( "\n" ); 0 <= i; i = f.content.indexOf( "\n", i + 1 ) )
		{
			last = i;
			j ++;
			if( l <= j ) break;
		}

		if( f.EOF ) i = last;

		// "\n" compensation
		var c = f.content[ i + 1 ];
		if(!( c == undefined || c == "\n" ))
		{
			i ++;
		}

		return i;
	};

	/** @type {Components.Vim.IAction} */
	var VISUAL = function( Cursor )
	{
		this.__reset( Cursor );
		this.__msg = "";
		Cursor.blink = false;
		Cursor.pSpace = true;
	};

	VISUAL.prototype.__reset = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;

		var s = {
			lineNum: Cursor.getLine().lineNum
			, X: Cursor.X
			, aPos: Cursor.aPos
			, pstart: Cursor.PStart
		};

		s.aStart = s.aPos - Cursor.aX;

		Cursor.suppressEvent();
		Cursor.lineEnd( true );

		s.aEnd = Cursor.aPos;

		Cursor.moveTo( s.aPos );
		Cursor.unsuppressEvent();

		this.__startLine = s;
	};

	VISUAL.prototype.allowMovement = true;

	VISUAL.prototype.dispose = function()
	{
		var c = this.__cursor;

		c.blink = true;
		c.pSpace = false;
		c.updatePosition();

		// This fix the highlighting position of missing phantomSpace
		// for maximum filled line
		if( c.feeder.wrap && 0 < c.X )
		{
			c.suppressEvent();
			c.moveX( -1 );
			c.moveX( 1 );
			c.unsuppressEvent();
		}
	};

	VISUAL.prototype.handler = function( e, done )
	{
		e.preventDefault();

		if( e.ModKeys ) return;

		var cur = this.__cursor;
		var feeder = cur.feeder;
		var Action = null;

		var dispatchUpdate = false;

		if( e.kMap( "y" ) )
		{
			Action = new YANK( cur );
		}
		else if( e.kMap( "d" ) )
		{
			Action = new DELETE( cur );
		}
		else if( e.kMap( "V" ) )
		{
			if( this.__mode == MODE_LINE ) return true;
			else
			{
				dispatchUpdate = true;
				this.__mode = MODE_LINE;
				this.__msg = Mesg( "VISLINE" );
			}
		}
		else if( e.kMap( "<" ) || e.kMap( ">" ) )
		{
			Action = new SHIFT_LINES( cur, e );
		}
		else if( e.kMap( "v" ) )
		{
			if( this.__mode == MODE_VISUAL ) return true;
			else
			{
				dispatchUpdate = true;
				this.__mode = MODE_VISUAL;
				this.__msg = Mesg( "VISUAL" );

				cur.updatePosition();
			}
		}

		if( dispatchUpdate )
			feeder.dispatcher.dispatchEvent( new BotanEvent( "VisualUpdate" ) );

		if( this.__mode == MODE_NULL )
		{
			debug.Error( new Error( "Mode is undefined" ) );
			return true;
		}

		var startLine = this.__startLine;
		if( Action )
		{
			cur.suppressEvent();

			var lineMode = this.__mode == MODE_LINE;
			if( lineMode )
			{
				if( startLine.aPos < cur.aPos )
				{
					cur.lineEnd( true );
					startLine.aPos = startLine.aStart;
				}
				else
				{
					cur.lineStart();
					startLine.aPos = startLine.aEnd;
				}
			}
			// Cursor position adjustment
			// this swap the cursor direction from LTR to RTL
			// i.e. treat all delete as "e<----s" flow
			// to keep the cursor position as the top on UNDO / REDO
			if( Action.constructor == DELETE && startLine.aPos < cur.aPos )
			{
				var o = cur.aPos;
				cur.moveTo( startLine.aPos, true );
				startLine.aPos = o;
			}

			Action.handler( e, startLine.aPos, lineMode );

			if( Action.constructor != DELETE )
			{
				cur.moveTo( startLine.aPos );
			}

			this.__msg = Action.getMessage();

			Action.dispose();
			cur.unsuppressEvent();

			startLine.pstart = cur.PStart;

			return true;
		}
		else
		{
			if( e.range )
			{
				cur.suppressEvent();

				var r = e.range;

				if( cur.aPos == startLine.aPos )
				{
					cur.moveTo( r.open, true );
					this.__reset( cur );
					startLine = this.__startLine;
				}

				cur.unsuppressEvent();
				cur.moveTo( r.close, true );
			}

			var currAp = cur.aPos;

			// Calculate the visible max min aPos of the current screen
			var line = feeder.firstBuffer;
			var firstLine = line.lineNum;
			var minAp = offsetY( cur, firstLine );
			var maxAp = offsetY( cur, firstLine + feeder.moreAt + 1 ) - 1;

			debug.Info( "Min aPos: " + minAp, "Max aPos: " + maxAp );

			var pstart = startLine.X;
			var nstart = cur.PStart;

			// highlight from the start
			if( startLine.aPos < minAp )
			{
				pstart = 0;

				if( this.__mode == MODE_LINE )
				{
					cur.suppressEvent();

					cur.lineEnd( true );
					nstart = cur.PStart;

					cur.moveTo( currAp, true );

					cur.unsuppressEvent();
				}
			}
			// highlight from the end
			else if( maxAp < startLine.aPos )
			{
				pstart = -2;
				var i = 0;
				do
				{
					if( line.placeholder ) break;
					if( i <= feeder.moreAt )
					{
						pstart += line.toString().length + 1;
					}
					i ++;
				}
				while( line = line.next );
			}
			else
			{
				var l = startLine.lineNum;
				if( this.__mode == MODE_LINE )
				{
					cur.suppressEvent();
					pstart = 0;

					if( currAp < startLine.aPos )
					{
						pstart = -1;
						l ++;

						cur.lineStart();
						nstart = cur.PStart;
					}
					else if( startLine.aPos < currAp )
					{
						cur.lineEnd( true );
						nstart = cur.PStart;
					}
					// aPos == currPos
					else
					{
						cur.lineStart();
						nstart = cur.PStart;
						cur.lineEnd( true );
						pstart = cur.PStart;
						l = line.lineNum;
					}

					cur.moveTo( currAp, true );

					cur.unsuppressEvent();
				}
				else if( this.__mode == MODE_VISUAL )
				{
					if( currAp == startLine.aPos ) return;
				}

				// Append the Y offset
				var i = 0;
				do
				{
					if( line.lineNum == l || line.placeholder ) break;
					pstart += line.toString().length + 1;
				}
				while( line = line.next );
			}

			var prevPos = pstart;
			var newPos = nstart;

			var posDiff = newPos - prevPos;

			var currAp = cur.aPos;

			// Sets the visual position
			// s-->e
			if( 0 <= posDiff )
			{
				newPos = newPos + 1;
			}
			// e<--s
			else if( posDiff < 0 )
			{
				prevPos += posDiff;
				newPos = pstart + 1;
			}

			cur.PStart = prevPos;
			cur.PEnd = newPos;
		}
	};

	VISUAL.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "VISUAL", VISUAL );
})();
;BotanJS.define( "Components.Vim.Actions.JOIN_LINES" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                  = __import( "System.Debug" );
	/** @type {Components.Vim.State.Stator} */
	var Stator                                 = __import( "Components.Vim.State.Stator" );
	/** @type {Components.Vim.State.Stack} */
	var Stack                                  = __import( "Components.Vim.State.Stack" );

	var beep = __import( "Components.Vim.Beep" );
	var Mesg = __import( "Components.Vim.Message" );

	var occurance = __import( "System.utils.Perf.CountSubstr" );

	/** @type {Components.Vim.IAction} */
	var JOIN_LINES = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	JOIN_LINES.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	JOIN_LINES.prototype.handler = function( e, range )
	{
		e.preventDefault();

		var cur = this.__cursor;
		var feeder = cur.feeder;

		var start;
		var end;

		var stack;
		var stator;

		var contentUndo;
		if( range )
		{
			start = range.start;
			end = range.close;
		}
		else
		{
			var oPos = cur.aPos;
			cur.lineEnd( true );
			stator = new Stator( cur );
			start = cur.aPos;
			cur.moveY( 1 );
			cur.lineStart();
			end = cur.aPos;

			// This happens on the last line
			if( end < start )
			{
				cur.moveTo( oPos );
				beep();
				return true;
			}

			var content = feeder.content;

			contentUndo = feeder.content.substring( start, end );
			feeder.content = content.substring( 0, start ) + " " + content.substr( end );
		}

		feeder.pan();

		cur.moveTo( start );

		var stack = new Stack();
		stack.store( stator.save( 1, contentUndo ) );

		cur.rec.record( stack );
	};

	JOIN_LINES.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "JOIN_LINES", JOIN_LINES );
})();
;BotanJS.define( "Components.Vim.Actions.EDITOR_COMMAND" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	var VimError = __import( "Components.Vim.Error" );

	var CMD_RANGE = 0;
	var CMD_TYPE = 1;
	var CMD_ARGS = 2;
	var CMD_ERR = 3;

	var ParseCommand = function( pattern )
	{
		var i = 1;

		var range = "";
		var out = [];

		if( ".$%".indexOf( pattern[ i ] ) != -1 )
		{
			range = pattern[ i ++ ];
		}
		else
		{
			for( ; "0123456789".indexOf( pattern[ i ] ) != -1; i ++ )
			{
				range += pattern[ i ];
			}
		}

		var command = "";

		if( "/?".indexOf( pattern[ i ] ) != -1 )
		{
			command = pattern[ i ];
		}
		else
		{
			var cmdReg = /\w/g;
			for( var j = pattern[ i ]; j = pattern[ i ]; i ++ )
			{
				if( j.match( cmdReg ) )
				{
					command += j;
				}
				else break;
			}
		}

		var allowRange = false;
		switch( command )
		{
			case "s":
			case "su":
			case "substitute":
				allowRange = true;
				out[ CMD_TYPE ] = "REPLACE";
				break;
			case "/":
				allowRange = true;
				out[ CMD_TYPE ] = "FIND";
				break;

			case "buffers":
			case "ls":
				out[ CMD_TYPE ] = "BUFFERS";
				break;
			case "w":
			case "write":
				out[ CMD_TYPE ] = "WRITE";
				break;
			case "q":
			case "quit":
				out[ CMD_TYPE ] = "QUIT";
				break;
			case "register":
			case "registers":
				out[ CMD_TYPE ] = "REGISTERS";
				break;
			case "ver":
			case "version":
				out[ CMD_TYPE ] = "VERSION";
				break;
			case "h":
			case "help":
				out[ CMD_TYPE ] = "HELP";
				break;
		}

		if( range !== "" )
		{
			if( allowRange ) out[ CMD_RANGE ] = range;
			else out[ CMD_ERR ] = VimError( "E481" );
		}

		out[ CMD_ARGS ] = pattern.slice( i );
		return out;
	};

	/** @type {Components.Vim.IAction} */
	var EDITOR_COMMAND = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	EDITOR_COMMAND.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	EDITOR_COMMAND.prototype.handler = function( e, p )
	{
		e.preventDefault();

		var cmd = ParseCommand( p );

		if( cmd[ CMD_ERR ] )
		{
			this.__msg = cmd[ CMD_ERR ];
			return true;
		}
		else if( !cmd[ CMD_TYPE ] )
		{
			this.__msg = VimError( "E492", p.slice( 1 ).join( "" ) );
			return true;
		}

		try
		{
			ns[ NS_INVOKE ]( cmd[ CMD_TYPE ] );
		}
		catch( ex )
		{
			this.__msg = VimError( "TODO", cmd[ CMD_TYPE ] );
			return true;
		}

		try
		{
			this.__cursor.openRunAction(
				cmd[ CMD_TYPE ], e, cmd[ CMD_ARGS ], cmd[ CMD_RANGE ]
			);
			this.__msg = this.__cursor.message;
		}
		catch( ex )
		{
			debug.Error( ex );
		}

		return true;
	};

	EDITOR_COMMAND.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "EDITOR_COMMAND", EDITOR_COMMAND );
})();
;BotanJS.define( "Components.Vim.Actions.TO" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	var beep = __import( "Components.Vim.Beep" );

	/** @type {Components.Vim.IAction} */
	var TO = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "<TO COMMAND>";
		Cursor.suppressEvent();
	};

	TO.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	TO.prototype.handler = function( em, et )
	{
		et.preventDefault();

		var cur = this.__cursor;
		var f = cur.feeder;
		var n = cur.getLine().lineNum;

		var p = 0;
		for( i = 0; p != -1 && i < n; i ++ )
		{
			p = f.content.indexOf( "\n", p + 1 );
		}

		var upperLimit = f.content.indexOf( "\n", p + 1 );

		if( 0 < n ) p ++;

		var lowerLimmit = p;

		var Char = et.key;
		if( et.kMap( "Tab" ) )
		{
			Char = "\t";
		}

		if( 1 < Char.length )
		{
			beep();
			return;
		}

		var tX = -1;
		// Forward
		if( em.kMap( "t" ) || em.kMap( "f" ) )
		{
			tX = f.content.indexOf( Char, cur.aPos + 1 );
		}
		// backward
		else
		{
			tX = f.content.lastIndexOf( Char, cur.aPos - 1 );
		}

		if( lowerLimmit <= tX && tX < upperLimit )
		{
			cur.moveTo( tX );
		}
		else beep();
	};

	TO.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "TO", TO );
})();
;BotanJS.define( "Components.Vim.Actions.QUIT" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	var VimError = __import( "Components.Vim.Error" );

	var occurance = __import( "System.utils.Perf.CountSubstr" );

	var ESCAPE = function( reg )
	{
		var str = reg.toString();
		return str.replace( "\t", "^I" ).replace( "\n", "^J" );
	};

	/** @type {Components.Vim.IAction} */
	var QUIT = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	QUIT.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	QUIT.prototype.handler = function( e, p )
	{
		e.preventDefault();

		var cur = this.__cursor;
		var Vim = cur.Vim;

		if( cur.rec.changed )
		{
			var msg = VimError( "E37" );

			var l = this.__cursor.feeder.firstBuffer.cols;
			for( var i = msg.length; i < l; i ++ ) msg += " ";

			this.__msg = msg;
		}
		else
		{
			Vim.dispose();
			return true;
		}
	};

	QUIT.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "QUIT", QUIT );
})();
;BotanJS.define( "Components.Vim.Actions.BUFFERS" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                             = __import( "System.Debug" );
	/** @type {Dandelion} */
	var Dand                              = __import( "Dandelion" );

	var Mesg = __import( "Components.Vim.Message" );

	var occurance = __import( "System.utils.Perf.CountSubstr" );

	var shadowImport = __import;

	var ESCAPE = function( reg )
	{
		var str = reg.toString();
		return str.replace( "\t", "^I" ).replace( "\n", "^J" );
	};

	/** @type {Components.Vim.IAction} */
	var BUFFERS = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	BUFFERS.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	BUFFERS.prototype.handler = function( e, p )
	{
		e.preventDefault();

		var areas = Dand.tag( "textarea" );

		var cur = this.__cursor;
		var Vim = cur.Vim;

		/** @type {Components.Vim.VimArea} */
		var VimArea = shadowImport( "Components.Vim.VimArea" );
		var Insts = VimArea.Instances;


		var msg = ":buffers";

		for( var i in Insts )
		{
			/** @type {Components.Vim.VimArea} */
			var inst = Insts[ i ];

			var b = inst.index + " ";
			var icur = inst.contentFeeder.cursor;
			b += ( inst == Vim ? "%a" : "  " ) + " ";
			b += ( icur.rec.changed ? "+" : " " ) + " ";

			b += "\"" + inst.stage.element.id + "\"" + " line " + ( icur.getLine().lineNum + 1 );


			msg += "\n  " + b;
		}

		var lastLine = Mesg( "WAIT_FOR_INPUT" );

		var l = this.__cursor.feeder.firstBuffer.cols;
		for( var i = msg.length; i < l; i ++ ) msg += " ";

		this.__msg = msg + "\n" + lastLine;
	};

	BUFFERS.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "BUFFERS", BUFFERS );
})();
;BotanJS.define( "Components.Vim.Actions.UNDO" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	var Mesg = __import( "Components.Vim.Message" );

	/** @type {Components.Vim.IAction} */
	var UNDO = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__message = "UNDO COMMAND";
	};

	UNDO.prototype.dispose = function()
	{

	};

	UNDO.prototype.handler = function( e )
	{
		e.preventDefault();

		/** @type {Components.Vim.State.Stack} */
		var stack = this.__cursor.rec.undo();
		if( stack )
		{
			this.__cursor.suppressEvent();
			stack.play();
			this.__cursor.unsuppressEvent();
			this.__message = Mesg( "NCHANGES", "<TODO>", stack.id, stack.time );
		}
		else
		{
			this.__message = Mesg( "UNDO_LIMIT" );
		}
	};

	UNDO.prototype.getMessage = function()
	{
		return this.__message;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "UNDO", UNDO );
})();
;BotanJS.define( "Components.Vim.Actions.REGISTERS" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	var VimError = __import( "Components.Vim.Error" );
	var Mesg = __import( "Components.Vim.Message" );

	var ESCAPE = function( reg )
	{
		var str = reg.toString();
		return str.replace( "\t", "^I" ).replace( "\n", "^J" );
	};

	/** @type {Components.Vim.IAction} */
	var REGISTERS = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	REGISTERS.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	REGISTERS.prototype.handler = function( e, p )
	{
		e.preventDefault();

		/** @type {Components.Vim.State.Registers} */
		var reg = e.target.registers;

		var msg = ":register";
		msg += "\n" + Mesg( "REGISTERS" );

		var regs = "\"0123456789abcdefghijklmnopqrstuvwxyz-.:%/=";
		for( var i = 0, j = regs[ i ]; j != undefined; i ++, j = regs[ i ] )
		{
			var r = reg.get( j );
			if( r )
			{
				msg += "\n\"" + j + "   " + ESCAPE( r );
			}
		}

		var lastLine = Mesg( "WAIT_FOR_INPUT" );

		var l = this.__cursor.feeder.firstBuffer.cols;
		for( var i = msg.length; i < l; i ++ ) msg += " ";

		this.__msg = msg + "\n" + lastLine;
	};

	REGISTERS.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "REGISTERS", REGISTERS );
})();
;BotanJS.define( "Components.Vim.Actions.PRINT_HEX" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	/** @type {Components.Vim.IAction} */
	var PRINT_HEX = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
	};

	PRINT_HEX.prototype.dispose = function()
	{
	};

	PRINT_HEX.prototype.handler = function( e )
	{
		e.preventDefault();
		var str = unescape( encodeURIComponent( this.__cursor.feeder.content[ this.__cursor.aPos ] ) );
		var l = str.length;
		var msg = [];
		for( var i = 0; i < l; i ++ )
		{
			 msg[i] = str[i] == "\n"
				 ? "a"
				 : str.charCodeAt( i ).toString( 16 )
				 ;

			 if( msg[i].length == 1 )
			 {
				 msg[i] = "0" + msg[i];
			 }
			 else if( msg[i].length == 0 )
			 {
				 msg[i] = "00";
			 }
		}

		this.__msg = msg.join( " " );
	};

	PRINT_HEX.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "PRINT_HEX", PRINT_HEX );
})();
;BotanJS.define( "Components.Vim.Actions.WORD" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	/** @type {Components.Vim.IAction} */
	var WORD = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "<WORD COMMAND>";
		Cursor.suppressEvent();
	};

	WORD.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	WORD.prototype.handler = function( e )
	{
		e.preventDefault();

		var cur = this.__cursor;
		var feeder = cur.feeder;

		var analyzer = cur.Vim.contentAnalyzer;
		var p = cur.aPos;


		var d = 1;
		// forward
		if( e.kMap( "w" ) || e.kMap( "W" ) )
		{
			if( feeder.content[ p + 1 ] == "\n" )
			{
				p ++;
			}

			var wordRange = analyzer.wordAt( p );
			if( wordRange.open != -1 )
			{
				p = wordRange.close + 1;
			}
		}
		// Backward
		if( e.kMap( "b" ) || e.kMap( "B" ) )
		{
			if( p == 0 ) return;
			d = -1;

			var wordRange = analyzer.wordAt( p - 1 );
			if( wordRange.open != -1 )
			{
				p = wordRange.open;
			}
		}

		while( " \t".indexOf( feeder.content[ p ] ) != -1 )
		{
			p += d;
		}

		cur.moveTo( p );
	};

	WORD.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "WORD", WORD );
})();
;BotanJS.define( "Components.Vim.Actions.VERSION" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {System.Debug} */
	var debug                                 = __import( "System.Debug" );

	var VimError = __import( "Components.Vim.Error" );
	var Mesg = __import( "Components.Vim.Message" );

	var ESCAPE = function( reg )
	{
		var str = reg.toString();
		return str.replace( "\t", "^I" ).replace( "\n", "^J" );
	};

	/** @type {Components.Vim.IAction} */
	var VERSION = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	VERSION.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	VERSION.prototype.handler = function( e, p )
	{
		e.preventDefault();

		/** @type {Components.Vim.State.Registers} */
		var reg = e.target.registers;

		var msg = ":version";
		msg += "\nVim;Re - Vim; Reverse Engineered for textarea v" + VIMRE_VERSION;
		msg += "\n  + BotanJS - v" + BOTANJS_VERSION;
		msg += "\nProject home - https://github.com/tgckpg/BotanJS-vim";
		msg += "\n  by \u659F\u914C\u9D6C\u5144 (penguin) - https://blog.astropenguin.net/";
		msg += "\n";

		var lastLine = Mesg( "WAIT_FOR_INPUT" );

		var l = this.__cursor.feeder.firstBuffer.cols;
		for( var i = msg.length; i < l; i ++ ) msg += " ";

		this.__msg = msg + "\n" + lastLine;
	};

	VERSION.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "VERSION", VERSION );
})();
;BotanJS.define( "Components.Vim.Actions.REDO" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	var Mesg = __import( "Components.Vim.Message" );

	/** @type {Components.Vim.IAction} */
	var REDO = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__message = "REDO COMMAND";
	};

	REDO.prototype.dispose = function()
	{

	};

	REDO.prototype.handler = function( e )
	{
		e.preventDefault();

		/** @type {Components.Vim.State.Stack} */
		var stack = this.__cursor.rec.redo();
		if( stack )
		{
			this.__cursor.suppressEvent();
			stack.play();
			this.__cursor.unsuppressEvent();
			this.__message = Mesg( "NCHANGES", "<TODO>", stack.id, stack.time );
		}
		else
		{
			this.__message = Mesg( "REDO_LIMIT" );
		}
	};

	REDO.prototype.getMessage = function()
	{
		return this.__message;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "REDO", REDO );
})();
;BotanJS.define( "Components.Vim.Actions.PUT" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {Components.Vim.State.Stator} */
	var Stator                                 = __import( "Components.Vim.State.Stator" );
	/** @type {Components.Vim.State.Stack} */
	var Stack                                  = __import( "Components.Vim.State.Stack" );

	var Mesg = __import( "Components.Vim.Message" );
	var occurence = __import( "System.utils.Perf.CountSubstr" );

	/** @type {Components.Vim.IAction} */
	var PUT = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;
		this.__msg = "";
		Cursor.suppressEvent();
	};

	PUT.prototype.allowMovement = false;

	PUT.prototype.dispose = function()
	{
		this.__cursor.unsuppressEvent();
	};

	PUT.prototype.handler = function( e )
	{
		e.preventDefault();

		var cput = this.__cursor.Vim.registers.get();
		if( !cput ) return true;

		var cur = this.__cursor;
		var feeder = cur.feeder;

		var newLine = cput.newLine;

		if( 1 < e.count )
		{
			var oput = cput;
			for( var i = 1; i < e.count; i ++ )
			{
				oput += cput;
			}

			cput = oput;
			oput = null;
		}

		var nLines = occurence( cput, "\n" );
		var clen = cput.length;

		// Compensation
		var c = e.kMap( "P" ) ? 0 : -1;

		if( newLine )
		{
			cur.moveY( -c );
			cur.lineStart();
		}

		var stator = new Stator( cur );
		var aP = cur.aPos;

		feeder.content = feeder.content.substring( 0, aP )
			+ cput
			+ feeder.content.substring( aP );

		feeder.pan();

		cur.moveTo( 0 < nLines ? aP : aP + clen, true );

		var stack = new Stack();

		if( newLine )
		{
			var f = stator.save( clen, "" );
			stack.store( function()
			{
				f();
				cur.moveY( c );
			} );
		}
		else
		{
			stack.store( stator.save( clen, "" ) );
		}
		cur.rec.record( stack );

		this.__put = cput;

		if( nLines )
		{
			this.__msg = Mesg( "LINES_MORE", nLines );
		}

		cur.moveX( -1 );

		return true;
	};

	PUT.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "PUT", PUT );
})();
;BotanJS.define( "Components.Vim.Actions.INSERT" );(function(){
	var ns = __namespace( "Components.Vim.Actions" );

	/** @type {Components.Vim.State.Stack} */
	var Stack                                  = __import( "Components.Vim.State.Stack" );
	/** @type {Components.Vim.State.Stator} */
	var Stator                                 = __import( "Components.Vim.State.Stator" );
	/** @type {System.Debug} */
	var debug                                  = __import( "System.Debug" );

	var Mesg = __import( "Components.Vim.Message" );

	// Phantom indent
	var IN_START = 0;
	var IN_END = 1;
	var IN_DEL = 2;

	var Translate = function( c )
	{
		switch( c )
		{
			case "Tab":
				return "\t";
			case "Enter":
				return "\n";
			default:
				return c;
		}
	};

	/** @type {Components.Vim.IAction} */
	var INSERT = function( Cursor )
	{
		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;

		this.__stator = new Stator( Cursor );
		this.__minReach = 0;
		this.__insertLen = 0;
		this.__chopIndent = false;

		// Initialize this stack
		this.__rec( "", true );

		var l = this.__cursor.feeder.firstBuffer.cols;
		var msg = Mesg( "INSERT" );

		for( var i = msg.length; i < l; i ++ ) msg += " ";
		this.__msg = msg;
	};

	INSERT.prototype.allowMovement = false;

	INSERT.prototype.dispose = function()
	{
		if( this.__chopIndent ) this.__realizeIndent();
		if( this.__cancelIndent() )
		{
			this.__cursor.feeder.pan();
		}
		this.__msg = "";
		this.__rec( "", true );
		this.__cursor.moveX( -1 );
	};

	INSERT.prototype.__rec = function( c, newRec )
	{
		if( newRec || !this.__stack )
		{
			if( this.__stack )
			{
				// If nothings changed
				if( this.__minReach == 0
					&& this.__punch == 0
					&& this.__contentUndo === ""
				) return;

				if( this.__punch < this.__minReach )
				{
					this.__minReach = this.__punch;
				}

				this.__stack.store(
					this.__stator.save(
						this.__insertLen
						, this.__contentUndo
						, -this.__minReach )
				);

				this.__cursor.rec.record( this.__stack );
			}

			this.__punch = 0;
			this.__contentUndo = "";
			this.__stack = new Stack();
		}

		if( c == "\n" )
		{
			// todo
		}

		if( this.__punch < this.__minReach )
		{
			this.__insertLen = 0;
			this.__minReach = this.__punch;
		}

		this.__punch += c.length;
		this.__insertLen += c.length;
	};

	INSERT.prototype.__specialKey = function( e, inputChar )
	{
		var cur = this.__cursor;
		var feeder = cur.feeder;

		// Backspace
		if( e.kMap( "BS" ) || e.kMap( "S-BS" ) )
		{
			this.__realizeIndent();
			var oY = feeder.panY + cur.Y;
			if( cur.X == 0 && feeder.panY == 0 && cur.Y == 0 ) return;

			var f = cur.aPos - 1;

			if( this.__punch <= this.__minReach )
			{
				this.__contentUndo = feeder.content.substr( f, 1 ) + this.__contentUndo;
			}

			feeder.content =
				feeder.content.substring( 0, f )
				+ feeder.content.substring( f + 1 );

			feeder.pan();

			cur.moveX( -1, true, true );

			if( 0 < this.__insertLen ) this.__insertLen --;
			this.__punch --;
		}
		else if( e.kMap( "Del" ) || e.kMap( "S-Del" ) )
		{
			this.__realizeIndent();
			var f = cur.aPos;

			this.__contentUndo += feeder.content.substr( f, 1 );

			feeder.content =
				feeder.content.substring( 0, f )
				+ feeder.content.substring( f + 1 );

			feeder.pan();
		}
		else return;

		feeder.dispatcher.dispatchEvent( new BotanEvent( "VisualUpdate" ) );
	};

	INSERT.prototype.handler = function( e )
	{
		e.preventDefault();

		if( e.ModKeys ) return;

		var inputChar = Translate( e.key );

		if( inputChar.length != 1 )
		{
			this.__specialKey( e, inputChar );
			return;
		}

		var cur = this.__cursor;
		var feeder = cur.feeder;

		var f = cur.aPos;

		var chopIndent = feeder.content[ f ] != "\n";

		feeder.content =
			feeder.content.substring( 0, f )
			+ inputChar
			+ feeder.content.substring( f );

		if( inputChar == "\n" )
		{
			feeder.softReset();
			feeder.pan();
			cur.moveY( 1 );
			cur.lineStart();
			this.__autoIndent( e );
			this.__chopIndent = chopIndent;
		}
		else
		{
			this.__realizeIndent();
			feeder.pan();
			cur.moveX( 1, false, true );
		}

		feeder.dispatcher.dispatchEvent( new BotanEvent( "VisualUpdate" ) );

		this.__rec( inputChar );
	};

	INSERT.prototype.__realizeIndent = function()
	{
		var ind = this.__phantomIndent;
		if( !this.__phantomIndent ) return;

		debug.Info( "Realize Indentation: " + ind );

		l = ind[ IN_END ];
		for( var i = ind[ IN_START ]; i < l; i ++ )
		{
			this.__rec( this.__cursor.feeder.content[ i ] );
		}
		this.__contentUndo = ind[ IN_DEL ] + this.__contentUndo;
		this.__phantomIndent = null;
	};

	INSERT.prototype.__autoIndent = function( e )
	{
		var oInd = this.__phantomIndent;
		var carried = this.__cancelIndent();

		var cur = this.__cursor;
		var feeder = cur.feeder;

		var f = cur.aPos;

		// Get the last indent
		var i = feeder.content.lastIndexOf( "\n", f - 2 );
		var line = feeder.content.substring( i + 1, f - 1 ) || carried;

		// Find Last indent
		while( line == "" && 0 < i )
		{
			var j = i;
			i = feeder.content.lastIndexOf( "\n", j - 2 );
			line = feeder.content.substring( i + 1, j - 1 );
		}

		var inDel = carried ? oInd[ IN_DEL ] : "";
		// Indent removed
		for( var ir = f; "\t ".indexOf( feeder.content[ ir ] ) != -1; ir ++ )
		{
			inDel += feeder.content[ ir ];
		}

		// Copy the indentation
		for( i = 0; "\t ".indexOf( line[i] ) != -1; i ++ );

		if( line )
		{
			feeder.content =
				feeder.content.substring( 0, f )
				+ line.substr( 0, i )
				+ feeder.content.substring( ir );

			feeder.softReset();
			feeder.pan();
			cur.moveX( i, false, true );

			var a = [];
			a[ IN_START ] = f;
			a[ IN_END ] = f + i;
			a[ IN_DEL ] = inDel;

			this.__phantomIndent = a;
			debug.Info( "Phantom indent: " + a );
		}
	};

	INSERT.prototype.__cancelIndent = function()
	{
		var ind = this.__phantomIndent;
		if( !ind ) return "";

		debug.Info( "Erase phantom indent: " + ind );

		var cur = this.__cursor;
		var feeder = cur.feeder;

		var canceled = feeder.content.substring( ind[ IN_START ], ind[ IN_END ] );
		feeder.content =
			feeder.content.substring( 0, ind[ IN_START ] )
			+ feeder.content.substring( ind[ IN_END ] );

		this.__phantomIndent = null;

		return canceled;
	}

	INSERT.prototype.getMessage = function()
	{
		return this.__msg;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "INSERT", INSERT );
})();
;BotanJS.define( "Components.Vim.Cursor" );(function(){
	var ns = __namespace( "Components.Vim" );

	/** @type {System.Debug} */
	var debug = __import( "System.Debug" );

	/** @type {Components.Vim.State.Recorder} */
	var Recorder = __import( "Components.Vim.State.Recorder" );

	var Actions = __import( "Components.Vim.Actions.*" );

	var LineOffset = function( buffs, l )
	{
		/** @type {Components.Vim.LineBuffer} */
		var offset = 0;

		LineLoop:
		for( var i = 0, line = buffs[0];
			line && i < l; i ++ )
		{
			while( line )
			{
				if( line.next && line.next.placeholder )
					break LineLoop;

				// Using toString because tab is 1 byte 
				// but variable width
				offset += line.toString().length + 1;
				line = line.next;

				if( line && line.br ) break;
			}
		}

		return offset;
	};

	// Rush cursor to wanted position "d" then get the actual position
	var GetRushPos = function( c, d )
	{
		var line = c.getLine();
		var l = c.Y + d;
		var i = c.Y;

		if( !line )
		{
			line = c.feeder.firstBuffer;
			i = 0;
			l = d;
		}

		// First line ( visual ) does not count
		if( line != c.feeder.firstBuffer ) i --;

		for( ; i < l; line = line.nextLine )
		{
			if( line.placeholder ) break;
			if( line.br ) i ++;
		}

		return i;
	};

	var Cursor = function( feeder )
	{
		/** @type {Components.Vim.LineFeeder} */
		this.feeder = feeder;

		this.cols = feeder.firstBuffer.cols;

		// The preferred X position
		this.pX = 0;

		// The displaying X position
		this.X = 0;

		// The current line resided
		this.Y = 0;

		// The resulting position
		this.PStart = 0;
		this.PEnd = 1;

		// State recorder
		this.rec = new Recorder();

		this.action = null;

		this.blink = true;
		this.pSpace = false;

		this.__suppEvt = 0;

		// Offset compensation for max filled wrapped line
		this.__off = 0;
	};

	// Set by VimArea
	Cursor.prototype.Vim;

	// Move to an absolute position
	Cursor.prototype.moveTo = function( aPos, phantomSpace )
	{
		var content = this.feeder.content;
		var pline = this.getLine();
		var lastLineNum = pline.lineNum;

		if( pline.placeholder )
		{
			lastLineNum = 0;
			this.Y = 0;
		}

		var expLineNum = 0;
		var lineStart = 0;
		for( var i = content.indexOf( "\n" ); 0 <= i ; i = content.indexOf( "\n", i ) )
		{
			if( aPos <= i )
			{
				break;
			}

			lineStart = i;
			i ++;
			expLineNum ++;
		}

		var jumpY = expLineNum - lastLineNum;
		var jumpX = aPos < lineStart ? lineStart - aPos : aPos - lineStart;

		jumpX += Math.ceil( jumpX / pline.cols ) - 1;

		if( jumpY ) this.moveY( jumpY );

		// This needed because first line does not contain first "\n" character
		if( 0 < this.getLine().lineNum && lineStart <= aPos ) jumpX --;

		this.moveX( - Number.MAX_VALUE );
		this.moveX( jumpX, false, phantomSpace );
	};

	// 0 will be treated as default ( 1 )
	Cursor.prototype.moveX = function( d, penetrate, phantomSpace )
	{
		var x = this.pX;
		var updatePx = Boolean( d );

		if( 0 < this.__off )
		{
			if( 0 < d && phantomSpace )
				d += this.__off;

			this.__off = 0;
		}

		if( updatePx ) x = this.X + d;

		if( !d ) d = 1;

		var feeder = this.feeder;
		var buffs = feeder.lineBuffers;

		if( penetrate )
		{
			if( x < 0 && ( 0 < this.feeder.panY || 0 < this.Y ) )
			{
				this.moveY( -1 );
				this.lineEnd( phantomSpace );
				return;
			}
		}

		/** @type {Components.Vim.LineBuffer} */
		var line = this.getLine();
		var content = line.visualLines.join( "\n" );
		var cLen = content.length;

		var lineEnd = 0;
		var hasPhantomSpace = true;

		// Empty lines has length of 1
		// If length larger than a, need to compensate the lineEnd
		// for phantomSpace
		if( 1 < cLen )
		{
			// Begin check if whether this line contains phantomSpace
			var lineNum = line.lineNum - 1;
			var str = feeder.content;
			for( var i = str.indexOf( "\n" ), j = 0; 0 <= i; i = str.indexOf( "\n", i ), j ++ )
			{
				if( lineNum == j ) break;
				i ++;
			}

			if( j == 0 && i == -1 ) i = 0;

			var end = str.indexOf( "\n", i + 1 );
			end = end == -1 ? str.length : end;

			// Actual LineLength
			var hasPhantomSpace = 0 < ( end - i - 1 ) % line.cols;

			if( hasPhantomSpace )
			{
				lineEnd = phantomSpace ? cLen - 1 : cLen - 2;
			}
			else
			{
				lineEnd = phantomSpace ? cLen : cLen - 1;
			}
		}

		var c = content[ x ];

		// Whether x is at line boundary
		var boundary = c == undefined || ( cLen == x + 1 && c == " " );

		if( boundary )
		{
			x = 0 < x ? lineEnd : 0;
		}
		else if( c == "\n" )
		{
			x += d;
		}

		// Wordwrap phantomSpace movement compensation on max filled lines
		if( feeder.wrap && boundary && !hasPhantomSpace && phantomSpace )
		{
			this.__off = 1;
		}

		this.X = x;

		if( updatePx )
		{
			this.pX = x;
			this.updatePosition();
		}

	};

	Cursor.prototype.lineStart = function()
	{
		this.pX = 0;
		this.moveX();
		this.updatePosition();
	};

	Cursor.prototype.lineEnd = function( phantomSpace )
	{
		this.moveX( Number.MAX_VALUE, false, phantomSpace );
	};

	Cursor.prototype.updatePosition = function()
	{
		var feeder = this.feeder;
		var P = this.X + LineOffset( feeder.lineBuffers, this.Y ) + this.__off;

		this.PStart = P;
		this.PEnd = P + 1;

		this.__visualUpdate();
	};

	Cursor.prototype.__visualUpdate = function()
	{
		if( 0 < this.__suppEvt )
		{
			debug.Info( "Event suppressed, suppression level is: " + this.__suppEvt );
			return;
		}
		this.feeder.dispatcher.dispatchEvent( new BotanEvent( "VisualUpdate" ) );
	};

	Cursor.prototype.moveY = function( d )
	{
		var i;
		var Y = this.Y + d;
		var feeder = this.feeder;
		var line;

		if( Y < 0 )
		{
			feeder.pan( undefined, Y );

			this.Y = 0;
			this.moveX();
			this.updatePosition();

			feeder.softReset();
			return;
		}
		// More at bottom, start panning
		else if( !feeder.EOF && feeder.moreAt < Y )
		{
			var feeder = this.feeder;

			if( feeder.linesTotal < Y )
			{
				while( !feeder.EOF )
				{
					feeder.pan( undefined, 1 );
				}

				i = GetRushPos( this, d );
			}
			else
			{
				var lastLine = feeder.lastBuffer.lineNum;
				var lineShift = Y - feeder.moreAt;
				var thisLine = this.getLine().lineNum;

				if( !feeder.EOF )
					feeder.pan( undefined, lineShift );

				// The line number cursor need to be in
				Y = thisLine + d;

				// if it turns out to be the same line
				// OR the cursor can not reside on the needed line
				// before after panning
				// we keep scrolling it ( panning )
				// until the entire line cosumes the screen
				while( !feeder.EOF && (
					feeder.lastBuffer.lineNum == lastLine
					||  feeder.lastBuffer.lineNum < Y
				) )
				{
					feeder.pan( undefined, 1 );
				}

				i = this.Y;
				this.Y = 0;
				// Calculate the visual line position "i"
				for( var line = this.getLine();
					line && line.lineNum != Y && !line.placeholder;
					this.Y ++, line = this.getLine() )
				{
				}

				i = this.Y;

				// Check if this line is collapsed
				if( !feeder.EOF && feeder.lastBuffer.next.lineNum == line.lineNum )
				{
					// If yes, step back to last visible line
					i --;
				}
			}

			this.Y = i;
			// Keep original position after panning
			this.moveX();
			this.updatePosition();

			// Because it is panned, soft reset is needed
			feeder.softReset();

			return;
		}
		else if ( 0 < d )
		{
			var line = this.getLine();
			// If already at bottom
			if( line.nextLine.placeholder ) return;

			Y = GetRushPos( this, d );
		}

		this.Y = Y;

		this.moveX();
		this.updatePosition();
	};

	// Open an action handler
	// i.e. YANK, VISUAL, INSERT, UNDO, etc.
	Cursor.prototype.openAction = function( name, e )
	{
		if( this.action ) this.action.dispose();

		debug.Info( "openAction: " + name );

		this.action = new (Actions[ name ])( this, e );
		this.__pulseMsg = null;

		this.__visualUpdate();
	};

	Cursor.prototype.closeAction = function()
	{
		if( !this.action ) return;
		this.action.dispose();
		this.__pulseMsg = this.action.getMessage();
		this.action = null;

		debug.Info( "closeAction: " + this.__pulseMsg );

		// Reset the analyzed content
		this.Vim.contentAnalyzer.reset();

		this.__visualUpdate();
	};

	// Open, Run, then close an action
	Cursor.prototype.openRunAction = function( name, e, arg1, arg2, arg3, arg4, arg5 )
	{
		debug.Info( "OpenRunAction: " + name );
		/** @type {Components.Vim.IAction} */
		var action = new (Actions[ name ])( this );
		action.handler( e, arg1, arg2, arg3, arg4, arg5 );
		this.__pulseMsg = action.getMessage();
		action.dispose();

		this.Vim.contentAnalyzer.reset();

		this.__visualUpdate();
	};

	Cursor.prototype.suppressEvent = function() { ++ this.__suppEvt; };
	Cursor.prototype.unsuppressEvent = function() { -- this.__suppEvt; };

	Cursor.prototype.getLine = function()
	{
		var feeder = this.feeder;
		var line = feeder.firstBuffer;
		var eBuffer = feeder.lastBuffer.next;
		for( var i = 0;
			line != eBuffer;
			line = line.next )
		{
			if( line.br ) i ++;
			if( this.Y == i ) return line;
		}

		return null;
	};

	// The position offset relative to current line
	__readOnly( Cursor.prototype, "aX", function()
	{
		var X = this.X;
		var f = this.feeder;

		var w = 1;

		// Calculate wordwrap offset
		if( f.wrap )
		{
			var lines = this.getLine().visualLines;

			for( var i in lines )
			{
				/** @type {Components.Vim.LineBuffer} */
				var vline = lines[ i ];

				// Actual length
				var aLen = vline.content.toString().length;

				// Visual length
				var vLen = vline.toString().length;

				// Plus the "\n" character
				X -= vLen + 1;

				if( 0 <= X )
				{
					w += aLen;
				}
				else if( X < 0 )
				{
					w += X + vLen;
					break;
				}
			}
		}
		else return this.X;

		return w;
	} );

	// The absolute content position
	__readOnly( Cursor.prototype, "aPos", function()
	{
		var f = this.feeder;
		var line = this.getLine();
		var n = line.lineNum;

		var p = 0;
		if( 0 < n )
		{
			p = f.content.indexOf( "\n" );
			for( i = 1; p != -1 && i < n; i ++ )
			{
				p = f.content.indexOf( "\n", p + 1 );
			}

			if( f.wrap )
			{
				// wordwrap offset
				p ++;
			}
		}

		p += this.aX;
		return p;
	} );

	__readOnly( Cursor.prototype, "face", function() { return "\u2588"; } );

	__readOnly( Cursor.prototype, "message", function()
	{
		if( this.__pulseMsg )
		{
			var m = this.__pulseMsg;
			this.__pulseMsg = null;

			return m;
		}

		return this.action && this.action.getMessage();
	} );

	__readOnly( Cursor.prototype, "position", function()
	{
		return {
			start: this.PStart
			, end: this.PEnd
		};
	} );

	ns[ NS_EXPORT ]( EX_CLASS, "Cursor", Cursor );
})();
;BotanJS.define( "Components.Vim.LineFeeder" );(function(){
	var ns = __namespace( "Components.Vim" );

	/** @type {System.Debug} */
	var debug = __import( "System.Debug" );

	/** @type {Components.Vim.LineBuffer} */
	var LineBuffer = ns[ NS_INVOKE ]( "LineBuffer" );
	/** @type {Components.Vim.Cursor} */
	var Cursor = ns[ NS_INVOKE ]( "Cursor" );

	var occurence = __import( "System.utils.Perf.CountSubstr" );

	var Feeder = function( rows, cols )
	{
		var lineBuffers = [];

		// Last line, hidden buffer that won't be rendered
		this.__xBuffer = lineBuffers[ rows ] = new LineBuffer( cols );

		for( var i = rows - 1; 0 <= i; i -- )
		{
			lineBuffers[ i ] = new LineBuffer( cols, lineBuffers[ i + 1 ] );
		}

		this.lineBuffers = lineBuffers;

		this.panX = 0;
		this.panY = 0;

		this.wrap = true;

		this.setRender();

		this.cursor = new Cursor( this );
		this.dispatcher = new EventDispatcher();

		this.__clseLine = null;
		this.__moreAt = -1;
		this.__rows = rows;
	};

	Feeder.prototype.init = function( content, wrap )
	{
		this.content = content;
		this.setWrap( wrap );

		this.firstBuffer.Push( content, this.wrap, 0 ); 
	};

	Feeder.prototype.setWrap = function( wrap )
	{
		if( wrap == undefined ) return;
		this.wrap = wrap;

		// TODO: Update
	};

	Feeder.prototype.setRender = function( placeholder )
	{
		if( placeholder == undefined ) placeholder = true;

		var _self = this;

		var placeholdCond = placeholder
			? function( line ) { return true; }
			:  function( line ) { return !line.placeholder; }
			;

			this.__render = function( line, steps )
			{
				var display = ( line == undefined ? "" : line ) + "";

				var atSpace = false;

				for( var i = 0;
						line && i < steps && ( line = line.next ) && placeholdCond( line );
						i ++ )
				{
					if( atSpace || ( line.br && steps < ( i + line.visualLines.length ) ) )
					{
						if( !atSpace ) _self.__clseLine = line;
						atSpace = true;
						display += "\n@";
						continue;
					}

					display += "\n" + line;
				}

				return display;
			};

			this.__softRender = function()
			{
				var line = _self.lineBuffers[ _self.__rStart ];
				var steps = _self.__rLength + 1;

				for( var i = 0;
						line && i < steps && ( line = line.next ) && placeholdCond( line );
						i ++ )
				{
					if( line.br && steps < ( i + line.visualLines.length ) )
					{
						_self.__clseLine = line;
						break;
					}
				}
			};
	}

	Feeder.prototype.render = function( start, length )
	{
		var buffs = this.lineBuffers;

		if( start == undefined ) start = 0;
		else if( this.__rows < start ) return "";

		if( length == undefined || ( this.__rows - start ) < length ) 
			length = this.rows - start;

		if( length == 0 ) return "";

		this.__rStart = start;
		this.__rLength = length - 1;
		return this.__render( buffs[ start ], this.__rLength );
	};

	// Performs a line panning
	Feeder.prototype.pan = function( dX, dY )
	{
		if( dX == undefined ) dX = 0;
		if( dY == undefined ) dY = 0;

		var X = this.panX + dX;
		var Y = this.panY + dY;

		var f = -1;
		var i = 0;

		// Y cannot be negative
		if( Y < 0 ) Y = 0;

		// Compensate the last "\n" content placeholder
		var cont = this.content.slice( 0, -1 );
		if( 0 < Y )
		{
			f = cont.indexOf( "\n" );
			for( i = 1; f != -1 && i < Y; i ++ )
			{
				var a = cont.indexOf( "\n", f + 1 );
				if( a == -1 )
				{
					Y = i;
					break;
				}
				f = a;
			}
		}

		this.firstBuffer.Push(
			this.content.substr( f + 1 )
			, this.wrap, i );

		this.panX = X;
		this.panY = Y;
	};

	Feeder.prototype.softReset = function()
	{
		this.__moreAt = -1;
		this.__clseLine = null;
		this.__softRender();
	};

	__readOnly( Feeder.prototype, "linesTotal", function() {
		return occurence( this.content, "\n" );
	} );

	__readOnly( Feeder.prototype, "firstBuffer", function() {
		return this.lineBuffers[ 0 ];
	} );

	__readOnly( Feeder.prototype, "lastBuffer", function() {
		return this.lineBuffers[ this.__rows - 1 ];
	} );

	__readOnly( Feeder.prototype, "EOF", function() {
		return this.lineBuffers[ this.__rows ].placeholder;
	} );

	__readOnly( Feeder.prototype, "moreAt", function() {
		if( 0 < this.__moreAt ) return this.__moreAt;

		var line = this.firstBuffer;
		if( line.placeholder ) return 0;

		var i = 0;
		do
		{
			if( this.__clseLine == line ) break;
			if( line.br ) i ++;
		}
		while( line = line.next );

		if( line == undefined ) i --;

		return ( this.__moreAt = i );
	} );

	__readOnly( Feeder.prototype, "lineStat", function() {
		var X = this.cursor.aX + 1;
		var line = this.cursor.getLine();
		var tabStat = "";

		var tabs = line.content.match( /\t/g );

		if( tabs )
		{
			tabStat = "-" + ( X + tabs.length * ( line.tabWidth - 1 ) );
		}

		return ( line.lineNum + 1 ) + "," + X + tabStat;
	} );

	__readOnly( Feeder.prototype, "docPos", function() {
		var pos = "ALL";

		if( 0 < this.panY )
		{
			if( this.EOF )
			{
				pos = "BOTTOM";
			}
			else
			{
				pos = Math.floor( ( this.panY / ( this.linesTotal - ( this.__rows - 1 ) ) ) * 100 ) + "%";
			}
		}
		else
		{
			if( this.__clseLine || !this.EOF )
			{
				pos = "TOP";
			}
		}

		return pos;
	} );

	__readOnly( Feeder.prototype, "linesOccupied", function() {
		var line = this.firstBuffer;
		if( line.placeholder ) return 0;

		var i = 0;
		do i ++;
		while( ( line = line.next ) && !line.placeholder );
		return i;
	} );

	ns[ NS_EXPORT ]( EX_CLASS, "LineFeeder", Feeder );
})();
;BotanJS.define( "Components.Vim.StatusBar" );(function(){
	var ns = __namespace( "Components.Vim" );

	var debug = __import( "System.Debug" );

	/** @type {Components.VimArea.LineFeeder} */
	var LineFeeder = ns[ NS_INVOKE ]( "LineFeeder" );

	var StatusBar = function( cols )
	{
		this.cols = cols;
		this.statStamp = {};
		this.override = null;
	};

	StatusBar.prototype.stamp = function( pos, func )
	{
		this.statStamp[ pos ] = func;
	};

	StatusBar.prototype.override;

	__readOnly( StatusBar.prototype, "statusText", function()
	{
		if( this.override ) return this.override();

		var display = "";
		var l = this.cols;

		for( var i = 0; i < l; i ++ )
		{
			var avail = l - i;
			var text = this.statStamp[ i ] || this.statStamp[ - avail ];
			if( text )
			{
				text = text();
				if( text == undefined || text === "" ) continue;

				if( i == 0 && l <= text.length ) return text;

				display += text.substr( 0, avail );
				i = display.length;
			}
			else display += " ";
		}

		return display;
	} );

	ns[ NS_EXPORT ]( EX_CLASS, "StatusBar", StatusBar );
})();
;BotanJS.define( "Components.Vim.State.History" );(function(){
	var ns = __namespace( "Components.Vim.State" );

	/** @type {System.Debug} */
	var debug                        = __import( "System.Debug" );

	// private static
	var Zones = {};

	var PartialBA = function( a, b )
	{
		var l = b.length;
		if( a.length < l ) return false;

		for( var i = 0; i < l; i ++ )
		{
			if( a[ i ] != b[ i ] ) return false;
		}

		return true;
	};

	var ExactAB = function( a, b )
	{
		var l = a.length < b.length ? b.length : a.length;
		for( var i = 0; i < l; i ++ )
		{
			if( a[ i ] != b[ i ] ) return false;
		}

		return true;
	}

	var History = function( z )
	{
		if( !Zones[ z ] ) Zones[ z ] = [];

		this.__pi = 0;
		this.__zone = Zones[ z ];
		this.reset();
	};

	History.prototype.push = function( stack )
	{
		if( this.__zone.length
			&& ExactAB( this.__zone[ this.__zone.length - 1 ], stack )
		) {
			debug.Info( "This is the previous command, skipping" );
			return;
		}
		this.__zone.push( stack );
	};

	History.prototype.prev = function( stack )
	{
		if( this.__zone.length <= this.__i ) this.reset();

		while( -1 < this.__i )
		{
			var st = this.__zone[ this.__i -- ];
			if( st && PartialBA( st, stack ) )
			{
				return st.slice();
			}
		}

		return null;
	};

	History.prototype.next = function( stack )
	{
		if( this.__i < 0 )
		{
			this.__i ++;
			this.next( stack );
		}

		while( this.__i < this.__zone.length )
		{
			var st = this.__zone[ this.__i ++ ];
			if( st && PartialBA( st, stack ) )
			{
				return st.slice();
			}
		}

		return null;
	};

	History.prototype.reset =  function()
	{
		this.__i = this.__zone.length - 1;
	};

	ns[ NS_EXPORT ]( EX_CLASS, "History", History );
})();
;BotanJS.define( "Components.Vim.Ex.Command" );(function(){
	var ns = __namespace( "Components.Vim.Ex" );

	/** @type {System.Cycle} */
	var Cycle                        = __import( "System.Cycle" );
	/** @type {System.Debug} */
	var debug                        = __import( "System.Debug" );
	/** @type {System.utils.Perf} */
	var Perf                         = __import( "System.utils.Perf" );

	/** @type {Components.Vim.State.History} */
	var History                                 = __import( "Components.Vim.State.History" );
	var Mesg                                    = __import( "Components.Vim.Message" );
	var beep                                    = __import( "Components.Vim.Beep" );

	// This is for security & privacy concerns?
	var ZMap = {
		"/": Perf.uuid
		, ":" : Perf.uuid
	};

	/** @type {Components.Vim.IAction} */
	var Command = function( Cursor, Mode )
	{
		var _self = this;
		if( !ZMap[ Mode ] ) throw new Error( "Unsupport mode: " + Mode );

		/** @type {Components.Vim.Cursor} */
		this.__cursor = Cursor;

		this.__statusBar = Cursor.Vim.statusBar;

		this.__mode = Mode;
		this.__hist = new History( ZMap[ Mode ] );

		this.__command = [];
		this.__currentCommand = null;
		this.__blinkId = "ExCommandBlinkCycle" + Perf.uuid;
		this.__curPos = 0;

		var feeder = Cursor.feeder;

		var __blink = false;
		var __holdBlink = false;
		this.__blink = function()
		{
			__blink = true;
			__holdBlink = true
		};

		Cycle.perma( this.__blinkId, function()
		{
			if( __holdBlink ) __holdBlink = false;
			else __blink = !__blink;

			feeder.dispatcher.dispatchEvent( new BotanEvent( "VisualUpdate" ) );
		}, 600 );

		this.__doBlink = function()
		{
			var c = "";
			var comm = _self.__command;
			var pos = _self.__curPos;
			var cLen = comm.length;
			var faced = true;

			for( var i = 0; i < cLen; i ++ )
			{
				var v = comm[i];
				if( __blink && i == pos )
				{
					face = true;
					v = Cursor.face + v.substr( 1 );
				}

				c+= v;
			}

			if( __blink && cLen <= pos )
			{
				c += Cursor.face;
			}

			return c;
		};

		this.__statusBar.override = this.__doBlink;
	};

	Command.prototype.dispose = function()
	{
		this.__statusBar.override = null;

		Cycle.permaRemove( this.__blinkId );
		var feeder = this.__cursor.feeder;
		feeder.dispatcher.dispatchEvent( new BotanEvent( "VisualUpdate" ) );
	};

	Command.prototype.handler = function( e )
	{
		e.preventDefault();

		if( e.ModKeys ) return;

		this.__blink();

		var InputKey = null;

		var histNav = false;

		if( e.kMap( "Tab" ) )
		{
			InputKey = "^I";
		}
		else if( e.kMap( "C-v" ) )
		{
			this.__direct = true;
		}
		else if( e.kMap( "BS" ) )
		{
			if( this.__curPos == 1 && 1 < this.__command.length )
				return false;

			this.__command.splice( --this.__curPos, 1 );
			if( this.__command.length == 0 )
			{
				e.cancel();
				return true;
			}
		}
		else if( e.kMap( "Del" ) )
		{
			this.__command.splice( this.__curPos, 1 );
		}
		else if( e.kMap( "Enter" ) )
		{
			this.__process( e );
			return true;
		}
		else if( e.kMap( "Left" ) )
		{
			if( 1 < this.__curPos ) this.__curPos --;
		}
		else if( e.kMap( "Right" ) )
		{
			if( this.__curPos < this.__command.length )
				this.__curPos ++;
		}

		// History stepping
		else if( histNav = e.kMap( "Up" ) ) // History navigations
		{
			if( !this.__currentCommand )
			{
				this.__currentCommand = this.__command;
			}

			var n = this.__hist.prev( this.__currentCommand );

			if( n )
			{
				this.__command = n;
				this.__curPos = n.length;
			}
			else
			{
				beep();
			}
		}
		else if( histNav = e.kMap( "Down" ) )
		{
			var n = this.__hist.next( this.__currentCommand );

			if( n )
			{
				this.__command = n;
				this.__curPos = n.length;
			}
			else if( this.__currentCommand )
			{
				this.__command = this.__currentCommand;
				this.__currentCommand = null;
			}

			else beep();
		}
		else
		{
			InputKey = e.key;
		}

		if( InputKey != null )
		{
			this.__command.splice( this.__curPos ++, 0, InputKey );
		}

		if( !histNav )
		{
			this.__hist.reset();
			if( this.__currentCommand ) this.__currentCommand = this.__command;
		}

		e.cancel();

		var feeder = this.__cursor.feeder;
		feeder.dispatcher.dispatchEvent( new BotanEvent( "VisualUpdate" ) );
	};

	Command.prototype.__process = function( e )
	{
		this.__hist.push( this.__command );

		var action = "";
		switch( this.__mode )
		{
			case "/":
				action = "FIND";
				break;
			case ":":
				action = "EDITOR_COMMAND";
				break;
		}

		var cur = this.__cursor;

		cur.suppressEvent();
		this.__cursor.openRunAction( action, e, this.__command.slice() );
		cur.unsuppressEvent();
	};

	ns[ NS_EXPORT ]( EX_CLASS, "Command", Command );
})();
;BotanJS.define( "Components.Vim.Controls" );(function(){
	var ns = __namespace( "Components.Vim" );

	/** @type {System.Debug} */
	var debug = __import( "System.Debug" );

	/** @type {Components.Vim.Ex.Command} */
	var ExCommand = __import( "Components.Vim.Ex.Command" );

	var beep = ns[ NS_INVOKE ]( "Beep" );

	var SHIFT = 1 << 9;
	var CTRL = 1 << 10;
	var ALT = 1 << 11;

	var KEY_SHIFT = 16;
	var KEY_CTRL = 17;
	var KEY_ALT = 18;

	var BACKSPACE = 8;
	var TAB = 9;
	var ENTER = 13;
	var DELETE = 46;
	var SPACE = 32;

	var UP = 38; var DOWN = 40; var LEFT = 37; var RIGHT = 39;

	var _0 = 48; var _1 = 49; var _2 = 50; var _3 = 51; var _4 = 52;
	var _5 = 53; var _6 = 54; var _7 = 55; var _8 = 56; var _9 = 57;

	var SEMI_COLON = 59; var GECKO_SEMI_COLON = 186;

	var EQUAL = 61; var GECKO_EQUAL = 187;

	var A = 65; var B = 66; var C = 67; var D = 68; var E = 69;
	var F = 70; var G = 71; var H = 72; var I = 73; var J = 74;
	var K = 75; var L = 76; var M = 77; var N = 78; var O = 79;
	var P = 80; var Q = 81; var R = 82; var S = 83; var T = 84;
	var U = 85; var V = 86; var W = 87; var X = 88; var Y = 89;
	var Z = 90;

	var S_BRACKET_L = 219; var S_BRACKET_R = 221;

	var ESC = 27;

	var F1 = 112; var F2 = 113; var F3 = 114; var F4 = 115; var F5 = 116;
	var F6 = 117; var F7 = 118; var F8 = 119; var F9 = 120; var F10 = 121;
	var F11 = 122; var F12 = 123;

	var DASH = 173; var GECKO_DASH = 189;
	var COMMA = 188; var FULLSTOP = 190;
	var SLASH = 191; var BACK_SLASH = 220;

	var QUOTE = 222;

	var ANY_KEY = -1;

	var __maps = {};
	var Map = function( str )
	{
		if( __maps[ str ] ) return __maps[ str ];

		// C-Left, A-Up ...
		var Code = str.split( "-" );
		var sCode = Code[0];

		var Mod = 0;
		if( Code.length == 2 )
		{
			var m = true;
			switch( Code[0] )
			{
				case "C": Mod = CTRL; break;
				case "A": Mod = ALT; break;
				case "S": Mod = SHIFT; break;
				default:
					m = false;
			}

			if( m )
			{
				sCode = Code[1];
			}
		}

		var kCode;
		switch( sCode )
		{
			case "BS": kCode = Mod + BACKSPACE; break;
			case "Del": kCode = Mod + DELETE; break;
			case "Enter": kCode = Mod + ENTER; break;
			case "Tab": kCode = Mod + TAB; break;

			case "Up": kCode = Mod + UP; break;
			case "Down": kCode = Mod + DOWN; break;
			case "Left": kCode = Mod + LEFT; break;
			case "Right": kCode = Mod + RIGHT; break;

			case "A": Mod = SHIFT; case "a": kCode = Mod + A; break;
			case "B": Mod = SHIFT; case "b": kCode = Mod + B; break;
			case "C": Mod = SHIFT; case "c": kCode = Mod + C; break;
			case "D": Mod = SHIFT; case "d": kCode = Mod + D; break;
			case "E": Mod = SHIFT; case "e": kCode = Mod + E; break;
			case "F": Mod = SHIFT; case "f": kCode = Mod + F; break;
			case "G": Mod = SHIFT; case "g": kCode = Mod + G; break;
			case "H": Mod = SHIFT; case "h": kCode = Mod + H; break;
			case "I": Mod = SHIFT; case "i": kCode = Mod + I; break;
			case "J": Mod = SHIFT; case "j": kCode = Mod + J; break;
			case "K": Mod = SHIFT; case "k": kCode = Mod + K; break;
			case "L": Mod = SHIFT; case "l": kCode = Mod + L; break;
			case "M": Mod = SHIFT; case "m": kCode = Mod + M; break;
			case "N": Mod = SHIFT; case "n": kCode = Mod + N; break;
			case "O": Mod = SHIFT; case "o": kCode = Mod + O; break;
			case "P": Mod = SHIFT; case "p": kCode = Mod + P; break;
			case "Q": Mod = SHIFT; case "q": kCode = Mod + Q; break;
			case "R": Mod = SHIFT; case "r": kCode = Mod + R; break;
			case "S": Mod = SHIFT; case "s": kCode = Mod + S; break;
			case "T": Mod = SHIFT; case "t": kCode = Mod + T; break;
			case "U": Mod = SHIFT; case "u": kCode = Mod + U; break;
			case "V": Mod = SHIFT; case "v": kCode = Mod + V; break;
			case "W": Mod = SHIFT; case "w": kCode = Mod + W; break;
			case "X": Mod = SHIFT; case "x": kCode = Mod + X; break;
			case "Y": Mod = SHIFT; case "y": kCode = Mod + Y; break;
			case "Z": Mod = SHIFT; case "z": kCode = Mod + Z; break;

			case "!": Mod = SHIFT; case "1": kCode = Mod + _1; break;
			case "@": Mod = SHIFT; case "2": kCode = Mod + _2; break;
			case "#": Mod = SHIFT; case "3": kCode = Mod + _3; break;
			case "$": Mod = SHIFT; case "4": kCode = Mod + _4; break;
			case "%": Mod = SHIFT; case "5": kCode = Mod + _5; break;
			case "^": Mod = SHIFT; case "6": kCode = Mod + _6; break;
			case "&": Mod = SHIFT; case "7": kCode = Mod + _7; break;
			case "*": Mod = SHIFT; case "8": kCode = Mod + _8; break;
			case "(": Mod = SHIFT; case "9": kCode = Mod + _9; break;
			case ")": Mod = SHIFT; case "0": kCode = Mod + _0; break;
			case "<": Mod = SHIFT; case ",": kCode = Mod + COMMA; break;
			case ">": Mod = SHIFT; case ".": kCode = Mod + FULLSTOP; break;

			default:
				throw new Error( "Unsupport keys: " + str );
		}

		return __maps[ str ] = kCode;
	};

	// Polyfill for Chrome < 51
	var RMap = function( kCode )
	{
		switch( kCode )
		{
			case SPACE: return " ";
			case A: return "a"; case B: return "b"; case C: return "c"; case D: return "d";
			case E: return "e"; case F: return "f"; case G: return "g"; case H: return "h";
			case I: return "i"; case J: return "j"; case K: return "k"; case L: return "l";
			case M: return "m"; case N: return "n"; case O: return "o"; case P: return "p";
			case Q: return "q"; case R: return "r"; case S: return "s"; case T: return "t";
			case U: return "u"; case V: return "v"; case W: return "w"; case X: return "x";
			case Y: return "y"; case Z: return "z";
			case _1: return "1"; case _2: return "2"; case _3: return "3";
			case _4: return "4"; case _5: return "5"; case _6: return "6"; case _7: return "7";
			case _8: return "8"; case _9: return "9"; case _0: return "0";

			case S_BRACKET_L: return "["; case S_BRACKET_R: return "]";
			case SEMI_COLON: case GECKO_SEMI_COLON: return ";";
			case QUOTE: return "'"; case COMMA: return ",";
			case FULLSTOP: return "."; case SLASH: return "/"; case BACK_SLASH: return "\\";
			case DASH: case GECKO_DASH: return "-"; case EQUAL: case GECKO_EQUAL: return "=";

			case SHIFT + _1: return "!"; case SHIFT + _2: return "@"; case SHIFT + _3: return "#";
			case SHIFT + _4: return "$"; case SHIFT + _5: return "%"; case SHIFT + _6: return "^";
			case SHIFT + _7: return "&"; case SHIFT + _8: return "*"; case SHIFT + _9: return "(";
			case SHIFT + _0: return ")";

			case SHIFT + S_BRACKET_L: return "{"; case SHIFT + S_BRACKET_R: return "}";
			case SHIFT + SEMI_COLON: case SHIFT + GECKO_SEMI_COLON: return ":";
			case SHIFT + QUOTE: return "\"";
			case SHIFT + COMMA: return "<"; case SHIFT + FULLSTOP: return ">";
			case SHIFT + SLASH: return "?"; case SHIFT + BACK_SLASH: return "|";
			case SHIFT + DASH: case SHIFT + GECKO_DASH: return "_";
			case SHIFT + EQUAL: case SHIFT + GECKO_EQUAL: return "+";

			case SHIFT + A: return "A"; case SHIFT + B: return "B"; case SHIFT + C: return "C";
			case SHIFT + D: return "D"; case SHIFT + E: return "E"; case SHIFT + F: return "F";
			case SHIFT + G: return "G"; case SHIFT + H: return "H"; case SHIFT + I: return "I";
			case SHIFT + J: return "J"; case SHIFT + K: return "K"; case SHIFT + L: return "L";
			case SHIFT + M: return "M"; case SHIFT + N: return "N"; case SHIFT + O: return "O";
			case SHIFT + P: return "P"; case SHIFT + Q: return "Q"; case SHIFT + R: return "R";
			case SHIFT + S: return "S"; case SHIFT + T: return "T"; case SHIFT + U: return "U";
			case SHIFT + V: return "V"; case SHIFT + W: return "W"; case SHIFT + X: return "X";
			case SHIFT + Y: return "Y"; case SHIFT + Z: return "Z";
			case ESC: return "Escape"; case BACKSPACE: return "Backspace"; case DELETE: return "Delete";
			case SHIFT: return "Shift"; case ALT: return "Alt"; case CTRL: return "Control";
			case ENTER: return "Enter"; case TAB: return "Tab";
		}

		return "?";
	};

	var Controls = function( vimArea )
	{
		/** @type {Components.Vim.VimArea} */
		this.__vimArea = vimArea

		this.__cfeeder = vimArea.contentFeeder;
		this.__sfeeder = vimArea.statusFeeder;

		this.__ccur = this.__cfeeder.cursor;

		// Dived composite command handler
		// Has full control of the key input, except Esc
		this.__divedCCmd = null;
	};

	Controls.prototype.__composite = function( e, handler )
	{
		if( handler )
		{
			if( !this.__compositeReg ) this.__compositeReg = [];
			this.__compositeReg.push({
				keys: Array.prototype.slice.call( arguments, 2 )
				, handler: handler
				, i: 0
			});
			return true;
		}

		var kCode = e.keyCode;

		for( var i = 0; i < this.__compositeReg.length; i ++ )
		{
			var compReg = this.__compositeReg[i];
			var keys = compReg.keys;
			var key = keys[ compReg.i ++ ];

			if( key == ANY_KEY || key == kCode )
			{
				if( compReg.i == keys.length )
				{
					this.__compositeReg = null;
					compReg.handler( e );
				}

				return true;
			}
		}

		if( this.__compositeReg ) beep();
		this.__compositeReg = null;
		return false;
	};

	Controls.prototype.__actionCommand = function( e )
	{
		var ActionHandled = true;
		var ccur = this.__ccur;

		// Action Command
		switch( e.keyCode )
		{
			case SHIFT + A: // Append at the line end
				ccur.lineEnd();
			case A: // Append
				ccur.moveX( 1, true, true );
			case I: // Insert
				ccur.openAction( "INSERT", e );
				break;

			case S: // Delete Char and start insert
				if( ccur.getLine().content != "" )
				{
					ccur.openRunAction( "DELETE", e, ccur.aPos );
				}
				ccur.openAction( "INSERT", e );
				break;

			case SHIFT + O: // new line before insert
				ccur.lineStart();
				ccur.openAction( "INSERT", e );
				ccur.action.handler( new ActionEvent( e.sender, "Enter" ) );
				ccur.moveY( -1 );
				break;
			case O: // new line insert
				ccur.lineEnd( true );
				ccur.openAction( "INSERT", e );
				ccur.action.handler( new ActionEvent( e.sender, "Enter" ) );
				break;

			case U: // Undo
				ccur.openRunAction( "UNDO", e );
				break;
			case CTRL + R: // Redo
				ccur.openRunAction( "REDO", e );
				break;

			case D: // Del with motion
				ccur.openAction( "DELETE", e );
				break;
			case Y: // Yank with motion
				ccur.openAction( "YANK", e );
				break;

			case P: // Put
				ccur.suppressEvent();
				ccur.moveX( 1, false, true );
				ccur.unsuppressEvent();
			case SHIFT + P: // Put before
				ccur.openRunAction( "PUT", e );
				break;

			case SHIFT + X: // Delete before
				if( !this.__cMoveX( -1 ) ) break;
			case X: // Del
				if( ccur.getLine().content == "" )
				{
					beep();
					break;
				}
				ccur.openRunAction( "DELETE", e, ccur.aPos );
				break;
			case SHIFT + U: // Undo previous changes in oneline
				break;
			case SHIFT + I: // Append before the line start, after spaces
				break;
			case SHIFT + J: // Join lines
				ccur.openRunAction( "JOIN_LINES", e );
				break;
			case SHIFT + K: // Find the manual entry
				break;

			case V: // Visual
			case SHIFT + V: // Visual line
				ccur.openAction( "VISUAL", e );
				ccur.action.handler( e );
				break;

			case SHIFT + SEMI_COLON: // ":" Command line
			case SHIFT + GECKO_SEMI_COLON:
				this.__divedCCmd = new ExCommand( ccur, ":" );
				this.__divedCCmd.handler( e );
				break;

			case SHIFT + COMMA: // <
			case SHIFT + FULLSTOP: // >
				ccur.openAction( "SHIFT_LINES", e );
				break;

			case F1: // F1, help
				break;
			default:
				ActionHandled = false;
		}

		return ActionHandled;
	};

	Controls.prototype.__cMoveX = function( a, b, c )
	{
		var ccur = this.__ccur;

		var x = ccur.X;
		var y = ccur.Y;
		ccur.moveX( a, b, c || ccur.pSpace );
		if( ccur.X == x && ccur.Y == y )
		{
			beep();
			return false;
		}
		return true;
	};

	Controls.prototype.__cMoveY = function( a )
	{
		var ccur = this.__ccur;
		var cfeeder = this.__cfeeder;

		var y = ccur.Y + cfeeder.panY;
		ccur.moveY( a );
		if( y == ( ccur.Y + cfeeder.panY ) )
		{
			if( 0 < a && !cfeeder.EOF ) return true;
			beep();
		}

		return false;
	};

	Controls.prototype.__modCommand = function( e )
	{
		if( this.__mod )
		{
			e.preventDefault();
			this.__composite( e );
			return;
		}

		var _self = this;
		var mod = true;

		var cur = this.__cursor;
		switch( e.keyCode )
		{
			case SHIFT + QUOTE:
				this.__composite( e, function( e2 ) {
					e2.target.registers.select( e2.key );
					e2.cancel();

					_self.__mod = false;
				}, ANY_KEY );
				break;
			case _0: // No 0 for first count
				if( !this.__compositeReg )
				{
					mod = false;
					break;
				}
			case _1: case _2: case _3: case _4:
			case _5: case _6: case _7: case _8: case _9:

				var Count = e.key;
				var recurNum = function( e )
				{
					var intercept = e.ModKeys;
					switch( e.keyCode )
					{
						case _0: case _1: case _2:
						case _3: case _4: case _5:
						case _6: case _7: case _8: case _9:
							Count += e.key;
							intercept = true;
					}

					if( intercept )
					{
						_self.__composite( e, recurNum, ANY_KEY );
						e.cancel();
						return;
					}

					e.__count = Number( Count );
					debug.Info( "Count is: " + Count );
					_self.__mod = false;
				};

				this.__composite( e, recurNum, ANY_KEY );
				break;
			default:
				mod = false;
		}

		this.__mod = mod;
		if( mod )
		{
			e.cancel();
		}
	};

	Controls.prototype.__cursorCommand = function( e )
	{
		var kCode = e.keyCode;

		if( this.__cMovement )
		{
			if( !e.ModKeys )
			{
				this.__composite( e );
				this.__cMovement = false;
				return true;
			}
		}

		var ccur = this.__ccur;
		var vima = this.__vimArea;
		var cfeeder = ccur.feeder;

		var cursorHandled = true;
		switch( kCode )
		{
			case BACKSPACE: this.__cMoveX( -1, true ); break; // Backspace, go back 1 char
			case H: this.__cMoveX( - e.count ); break; // Left
			case L: this.__cMoveX( e.count ); break; // Right
			case DASH: case GECKO_DASH:
			case K: this.__cMoveY( - e.count ); break; // Up
			case ENTER:
			case J: this.__cMoveY( e.count ); break; // Down

			case CTRL + F: // Page Down
				if( cfeeder.firstBuffer.nextLine.placeholder )
				{
					beep();
					break;
				}

				var oPan = cfeeder.panY;
				cfeeder.pan( undefined, cfeeder.moreAt );
				cfeeder.softReset();

				ccur.moveY( -ccur.Y );

				break;
			case CTRL + B: // Page Up
				if( cfeeder.panY == 0 )
				{
					beep();
					break;
				}
				cfeeder.pan( undefined, -cfeeder.moreAt );
				cfeeder.softReset();

				ccur.moveY( -ccur.Y );
				if( !cfeeder.EOF ) ccur.moveY( cfeeder.moreAt );
				break;

			case SHIFT + H: // First line buffer
				break;
			case SHIFT + L: // Last line buffer
				break;

			case _0: // Really - line Start
				ccur.lineStart();
				break;
			case SHIFT + _6: // ^, line Start, XXX: skip tabs
				ccur.lineStart();
				break;
			case SHIFT + _4: // $, End
				ccur.lineEnd( ccur.pSpace );
				break;
			case SHIFT + G: // Goto last line
				ccur.moveY( Number.MAX_VALUE );
				ccur.moveX( Number.MAX_VALUE, true );
				break

			case SHIFT + _5: // %, Find next item
				var analyzer = this.__vimArea.contentAnalyzer;

				/** @type {Components.Vim.Syntax.TokenMatch} */
				var bracketMatch = analyzer.bracketAt( ccur.aPos );

				if( bracketMatch.open == -1 )
				{
					beep();
					break;
				}

				ccur.moveTo(
					bracketMatch.selected == bracketMatch.close
						? bracketMatch.open
						: bracketMatch.close
				);

				break;


			case SHIFT + T: // To
			case T: // To
				this.__cMovement = true;

				this.__composite( e, function( e2 ) {
					var oX = ccur.X;
					ccur.openRunAction( "TO", e, e2 );

					if( ccur.X < oX )
					{
						ccur.moveX( 1 );
					}
					else if( oX < ccur.X )
					{
						ccur.moveX( -1 );
					}
				}, ANY_KEY );

				break;
			case SHIFT + F: // To
			case F: // To
				this.__cMovement = true;

				this.__composite( e, function( e2 ) {
					ccur.openRunAction( "TO", e, e2 );
				}, ANY_KEY );

				break;

			case W: // word
			case SHIFT + W:
			case B:
			case SHIFT + B:
				ccur.openRunAction( "WORD", e );
				break


			case I: // In between boundary
				if( !ccur.action )
				{
					cursorHandled = false;
					break;
				}

				var analyzer = this.__vimArea.contentAnalyzer;

				this.__cMovement = true;

				// Word boundary
				this.__composite( e, function( e2 ) {
					var WordMatch = analyzer.wordAt( ccur.aPos );
					e2.__range = WordMatch;
				}, W );

				var bracket = function( e2 ) {
					var BracketMatch = analyzer.bracketIn( "(", ccur.aPos );
					e2.__range = BracketMatch;
				};
				var curlyBracket = function( e2 ) {
					var BracketMatch = analyzer.bracketIn( "{", ccur.aPos );
					e2.__range = BracketMatch;
				};
				var squareBracket = function( e2 ) {
					var BracketMatch = analyzer.bracketIn( "[", ccur.aPos );
					e2.__range = BracketMatch;
				};

				// Bracket boundaries
				this.__composite( e, bracket , SHIFT + _0 );
				this.__composite( e, bracket, SHIFT + _9 );
				this.__composite( e, squareBracket, S_BRACKET_L );
				this.__composite( e, squareBracket, S_BRACKET_R );
				this.__composite( e, curlyBracket, SHIFT + S_BRACKET_L );
				this.__composite( e, curlyBracket, SHIFT + S_BRACKET_R );
				break;

			case G:

				this.__cMovement = true;

				// Go to top
				this.__composite( e, function() {
					ccur.moveY( -Number.MAX_VALUE );
					ccur.moveX( -Number.MAX_VALUE, true );
				}, G );

				// Print Hex
				this.__composite( e, function() {
					ccur.openRunAction( "PRINT_HEX", e );
				}, _8 );

				// to lowercase
				this.__composite( e, function( e2 ) {
					if( ccur.action ) { beep(); return; }
					// TODO
				}, U );

				// to uppercase
				this.__composite( e, function( e2 ) {
					if( ccur.action ) { beep(); return; }
					// TODO
				}, SHIFT + U );
				break;

			case SHIFT + N: // Next Search
			case N: // Next Search
				ccur.openRunAction( "FIND", e );
				break;

			case SLASH: // "/" Search movement
				this.__cMovement = true;

				this.__divedCCmd = new ExCommand( ccur, "/" );
				this.__divedCCmd.handler( e );
				break;
			default:
				cursorHandled = false;
		}

		return cursorHandled;
	};

	/**
	 * sender @param  {Components.Vim.VimArea}
	 * e @param {Components.Vim.Controls.ActionEvent}
	 * */
	Controls.prototype.handler = function( sender, e )
	{
		// Never capture these keys
		if( e.keyCode == ( ALT + D )
			// F2 - F12
			|| ( F1 < e.keyCode && e.keyCode <= F12 )
		) return;

		// Clear composite command
		if( e.Escape )
		{
			var b = false;
			this.__cMovement = false;

			if( this.__compositeReg )
			{
				b = true;
				this.__compositeReg = null;
			}
			else if( this.__divedCCmd )
			{
				b = true;
				this.__divedCCmd.dispose();
				this.__divedCCmd = null;
			}

			if( b )
			{
				beep();
				return;
			}
		}

		if( this.__divedCCmd )
		{
			if( this.__divedCCmd.handler( e ) )
			{
				this.__divedCCmd.dispose();
				this.__cMovement = false;
				this.__divedCCmd = null;
				return;
			}

			if( e.canceled ) return;
		}

		var cfeeder = this.__cfeeder;
		var ccur = this.__ccur;

		if( !ccur.action || ccur.action.allowMovement )
		{
			this.__modCommand( e );
			if( e.canceled ) return;
		}

		var kCode = e.keyCode;

		// Action commands are handled by the actions themselves
		if( ccur.action )
		{
			if( e.Escape )
			{
				e.preventDefault();
				ccur.closeAction();
			}
			else
			{
				if( ccur.action.allowMovement )
				{
					var SubCommand = !this.__compositeReg;
					this.__cursorCommand( e, kCode );
					if( SubCommand && this.__compositeReg )
					{
						e.preventDefault();
						return;
					}
				}

				if( ccur.action.handler( e ) )
				{
					ccur.closeAction();
				}
			}
			return;
		}

		e.preventDefault();

		if( this.__cursorCommand( e ) ) return;
		if( this.__actionCommand( e ) ) return;
	};

	var ActionEvent = function( sender, e )
	{
		this.__target = sender;
		this.__canceled = false;

		if( typeof( e ) == "string" )
		{
			this.__key = e;
			this.__modKeys = 0;
			this.__kCode = Map( e );
			this.__escape = this.__kCode == ESC;
		}
		else
		{
			this.__e = e;

			// KeyCode HotFix
			if( e.key == ";" || e.key == ":" )
			{
				SEMI_COLON = e.keyCode;
			}

			var c = this.__e.keyCode;

			this.__escape = c == ESC || ( e.ctrlKey && c == C );
			this.__kCode = c
				+ ( e.shiftKey || e.getModifierState( "CapsLock" ) ? SHIFT : 0 )
				+ ( e.ctrlKey ? CTRL : 0 )
				+ ( e.altKey ? ALT : 0 );

			this.__modKeys = c == KEY_SHIFT || c == KEY_CTRL || c == KEY_ALT;
			this.__key = e.key || RMap( this.__kCode );
		}

		this.__count = 1;
		this.__range = null;
	};

	__readOnly( ActionEvent.prototype, "target", function() { return this.__target; } );
	__readOnly( ActionEvent.prototype, "key", function() { return this.__key; } );
	__readOnly( ActionEvent.prototype, "keyCode", function() { return this.__kCode; } );
	__readOnly( ActionEvent.prototype, "ModKeys", function() { return this.__modKeys; } );
	__readOnly( ActionEvent.prototype, "Escape", function() { return this.__escape; } );
	__readOnly( ActionEvent.prototype, "canceled", function() { return this.__canceled; } );

	__readOnly( ActionEvent.prototype, "range", function() {

		/** @type {Components.Vim.Syntax.TokenMatch} */
		var r = this.__range;

		if( r && r.open == -1 && r.close == -1 )
		{
			return null;
		}

		return r;
	} );

	__readOnly( ActionEvent.prototype, "count", function() {
		return this.__count;
	} );

	ActionEvent.prototype.kMap = function( map )
	{
		return this.__kCode == Map( map );
	};

	ActionEvent.prototype.cancel = function()
	{
		this.preventDefault();
		this.__canceled = true;
	};

	ActionEvent.prototype.preventDefault = function()
	{
		if( this.__e ) this.__e.preventDefault();
	};

	ns[ NS_EXPORT ]( EX_CLASS, "Controls", Controls );
	ns[ NS_EXPORT ]( EX_CLASS, "ActionEvent", ActionEvent );
})();
;BotanJS.define( "Components.Vim.VimArea" );(function(){
	var ns = __namespace( "Components.Vim" );

	/** @type {Dandelion.IDOMElement} */
	var IDOMElement                               = __import( "Dandelion.IDOMElement" );
	/** @type {System.utils.DataKey} */
	var DataKey                                   = __import( "System.utils.DataKey" );
	/** @type {System.utils.EventKey} */
	var EventKey                                  = __import( "System.utils.EventKey" );
	/** @type {System.Cycle} */
	var Cycle                                     = __import( "System.Cycle" );
	/** @type {System.Debug} */
	var debug                                     = __import( "System.Debug" );

	/** @type {Components.Vim.State.Registers} */
	var Registers                                 = __import( "Components.Vim.State.Registers" );
	/** @type {Components.Vim.Syntax.Analyzer} */
	var SyntaxAnalyzer                            = __import( "Components.Vim.Syntax.Analyzer" );

	/** @type {Components.Vim.LineFeeder} */
	var LineFeeder = ns[ NS_INVOKE ]( "LineFeeder" );
	/** @type {Components.Vim.StatusBar} */
	var StatusBar = ns[ NS_INVOKE ]( "StatusBar" );

	var VimControls = ns[ NS_INVOKE ]( "Controls" );
	var ActionEvent = ns[ NS_INVOKE ]( "ActionEvent" );
	var mesg = ns[ NS_INVOKE ]( "Message" );

	var Insts = [];
	var InstIndex = 0;

	var KeyHandler = function( sender, handler )
	{
		return function( e )
		{
			sender.__active = true;
			e = e || window.event;
			if ( e.keyCode ) code = e.keyCode;
			else if ( e.which ) code = e.which;

			handler( sender, new ActionEvent( sender, e ) );
		};
	};

	/* stage @param {Dandelion.IDOMElement} */
	var VimArea = function( stage, detectScreenSize )
	{
		if( !stage ) throw new Error( "Invalid argument" );

		stage = IDOMElement( stage );

		var element = stage.element;

		if(!( element && element.nodeName == "TEXTAREA" ))
		{
			throw new Error( "This element is not compatible for VimArea" );
		}

		for( var i in Insts )
		{
			var inst = Insts[ i ];
			if( inst.stage.element == element )
			{
				debug.Info( "Instance exists" );
				return inst;
			}
		}

		stage.setAttribute( new DataKey( "vimarea", 1 ) );

		this.stage = stage;
		this.rows = element.rows;
		this.cols = element.cols;

		this.__active = false;

		var _self = this;

		this.__stagedEvents = [
			new EventKey( "Focus", function() { _self.__active = true; }  )
			, new EventKey( "Blur", function() { _self.__active = false; } )
		];


		if( detectScreenSize )
		{
			var val = element.value;
			this.__testScreen(function() { _self.VisualizeVimFrame( val ); });
		}
		else
		{
			this.VisualizeVimFrame( element.value );
		}

		// Set buffer index
		this.__instIndex = InstIndex ++;

		// Push this instance
		Insts[ this.__instIndex ] = this;
	};

	VimArea.prototype.__testScreen = function( handler )
	{
		var area = this.stage.element;
		area.value = "";

		var msg = "Please wait while Vim;Re is testing for screen dimensions";
		var m = function() { return msg[ i ++ ] || "."; };

		var i = 0;

		var oX = area.style.overflowX;
		var oY = area.style.overflowY;

		area.style.whiteSpace = "nowrap";

		var oWidth = area.scrollWidth;
		var testWidth = function()
		{
			area.value += m();
			if( oWidth == area.scrollWidth )
			{
				Cycle.next( testWidth );
			}
			else
			{
				var t = "";
				-- i;
				for( var k = 0; k < i; k ++ ) t += ".";
				area.value = t;

				area.style.whiteSpace = "";
				m = function() { return "\n" + t; };
				testHeight();
			}
		};

		testWidth();

		var oHeight = area.scrollHeight;

		var l = 0;

		var _self = this;

		var testHeight = function() {
			area.value += m();
			++ l;

			if( oHeight == area.scrollHeight )
			{
				Cycle.next( testHeight );
			}
			else
			{
				_self.rows = l;
				_self.cols = i;

				handler();
			}
		};
	};

	VimArea.prototype.select = function( sel )
	{
		if( !this.__active ) return;
		var textarea = this.stage.element;

		if( sel )
		{
			textarea.selectionStart = sel.start;
			textarea.selectionEnd = sel.end;
		}
	};

	VimArea.prototype.VisualizeVimFrame = function( content )
	{
		var _self = this;
		this.content = content;

		var element = this.stage.element;
		var r = this.rows;
		var c = this.cols;

		// StatusFeeder always consumes at least 1 line
		var cRange = r - 1;

		// Content feeder
		var cfeeder = new LineFeeder( cRange, c );
		var contentAnalyzer = new SyntaxAnalyzer( cfeeder );

		// Feed the contents to content feeder
		// This "\n" fixes the last line "\n" not displaying
		// it will be trimmed after saving
		cfeeder.init( content + "\n" );

		// Status can consumes up to full screen, I think
		var sfeeder = new LineFeeder( r, c );
		sfeeder.setRender( false );

		// Set the Vim instance
		cfeeder.cursor.Vim = this;
		sfeeder.cursor.Vim = this;

		// Set the stamps
		var statusBar = new StatusBar( c );
		statusBar.stamp( -18, function(){ return cfeeder.lineStat; } );
		statusBar.stamp( -3, function(){ return mesg( cfeeder.docPos ); } );
		statusBar.stamp( 0, function(){ return cfeeder.cursor.message; } );

		sfeeder.init( statusBar.statusText );

		var Update = function()
		{
			sfeeder.init( statusBar.statusText );

			var sLine = sfeeder.linesOccupied;
			element.value =
				cfeeder.render( sLine - 1, r - sLine )
				+ "\n" + sfeeder.render( 0, sLine < r ? sLine : r );

			_self.__blink = false;
			_self.select( cfeeder.cursor.position );
		};

		cfeeder.dispatcher.addEventListener( "SelectionChanged", function()
		{
			_self.select( cfeeder.cursor.position );
		} );

		cfeeder.dispatcher.addEventListener( "VisualUpdate", Update );
		element.value = "Please wait ...";
		Cycle.delay( Update, 70 );

		this.__visualUpdate = Update;

		this.contentFeeder = cfeeder;
		this.contentAnalyzer = contentAnalyzer;
		this.statusFeeder = sfeeder;
		this.statusBar = statusBar;
		this.registers = new Registers();

		this.__cursor = cfeeder.cursor;

		this.__blink = true;
		Cycle.perma( "VimCursorBlinkCycle" + element.id, function()
		{
			_self.select(
				!_self.__cursor.blink || ( _self.__blink = !_self.__blink )
					? _self.__cursor.position
					: { start: 0, end: 0 }
			);
		}, 600 );

		var controls = new VimControls( this );

		this.__stagedEvents.push(
			new EventKey( "KeyDown", KeyHandler( this, controls.handler.bind( controls ) ) )
		);

		this.stage.addEventListeners( this.__stagedEvents );
	};

	VimArea.prototype.dispose = function()
	{
		var stage = this.stage;
		var evts = this.__stagedEvents;
		var feeder = this.contentFeeder;

		var id = stage.element.id;

		debug.Info( "Destroy instance: " + id );

		feeder.dispatcher.removeEventListener( "VisualUpdate", this.__visualUpdate );

		stage.removeAttribute( "data-vimarea" );

		Cycle.permaRemove( "VimCursorBlinkCycle" + id );
		for( var i in evts )
		{
			stage.removeEventListener( evts[ i ] );
		}

		stage.element.value = this.content;

		delete Insts[ this.__instIndex ];
	};

	__readOnly( VimArea.prototype, "index", function()
	{
		return this.__instIndex + 1;
	} );

	__readOnly( VimArea, "Instances", function() {
		var clone = [];
		for( var i in Insts ) clone.push( Insts[ i ] );
		return clone;
	} );

	ns[ NS_EXPORT ]( EX_CLASS, "VimArea", VimArea );
})();
})();