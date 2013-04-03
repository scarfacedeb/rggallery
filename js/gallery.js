;(function( $, window, document, undefined ) {
	/// source: http://jsfiddle.net/DerekL/GbDw9/
	jQuery.fn.centerBlock = function(parent) {
      parent = parent ? this.parent() : window;

	    this.css({
	        "position": "absolute",
	        "top": ((($(parent).height() - this.outerHeight()) / 2) + $(parent).scrollTop() + "px")
	    });
	    //"left": ((($(parent).width() - this.outerWidth()) / 2) + $(parent).scrollLeft() + "px")
		return this;
	}
	
	var Modernizr = window.Modernizr,
		History = window.History;

	$.rgGallery = function( options, el ){
		this.$el = $( el );
		this._init( options );

		// link to particular image
		if ( this.options.history ) {
			var image = this._imageFromUrl();
			if ( image )
				this.showGallery( image );
		}
	}


	$.rgGallery.prototype = {
		_init: function( options ) {
			this.options = $.extend( {}, $.rgGallery.defaults, options),

			// create markup and bind events
			this._config();

			// initialize the carousel
			this._initCarousel();

			// add events 
			this._initEvents();
		},

		_config: function() {
		
			this.$items = this.$el.find('li').clone();
			this.itemsCount	 	= 	this.$items.length;

			this.current = 0;
			this.isAnimating = false;

			// create markup from template
			this.$rgGallery = $('#rg-gallery').detach();
			this.$rgImage = this.$rgGallery.find('.rg-image');
			this.$loader = this.$rgGallery.find('.rg-loading');

			if( this.itemsCount > 1 ) {
				// addNavigation
				this.$navPrev	= this.$rgGallery.find('.rg-image-nav-prev');
				this.$navNext = this.$rgGallery.find('.rg-image-nav-next');
			} else {
				// fill empty space for slider
				this.$rgGallery.css('padding-bottom', 50);
			}

			// init history.js if needed
			if ( this.options.history )
				this._initHistory();
		},

		_initHistory: function() {
			// to distinguish Back button events from script-triggered events 
			this.timestamps = [];

			// Bind to StateChange Event
			History.Adapter.bind( window,'statechange', $.proxy( function(){
				    var State = History.getState();
				    
				    if ( State.data.time in this.timestamps ) {
				    	// from script
				    	delete this.timestamps[State.data.time];
				    } else {
				    	// from Back button
				    	this.navigate( this._imageFromUrl(), true );
				    }
				}, this )
			);
		},

		_imageFromUrl: function(){
			var url = Modernizr.history ? window.location.search : window.location.hash;
			var image = new RegExp( this.options.historyParam + "=(\\d+)" ).exec( url );
			if ( image ) {
				image = parseInt(image[1]);
				if ( image <= this.itemsCount )
					return image;
			}
			return false;

		},

		_initCarousel: function() {
			// elastislide plugin:
			// http://tympanus.net/codrops/2011/09/12/elastislide-responsive-carousel/
			if( this.options.mode !== 'carousel' || this.itemsCount < 2 ) return false;

			this.$rgThumbs = $('#rg-thumbs').detach();

			// optional separate thumb src for slider
			if ( this.options.dataThumbs ) {
				this.$items.each(function(){
					var $this = $(this);
					$this.prop( 'src', $this.data('thumb') ).removeProp('data-thumb');
				});
			}
			this.$rgThumbs.find('.es-carousel').append( $('<ul>').append( this.$items ) );


			this.$rgSlider = $rgThumbs.children('.es-carousel-wrapper').show()
				.elastislide( $.extend( {}, this.options.elastislide,
					{
						onClick: $.proxy( function( $item ) {
							this.navigate( $item.index() );
						}, this )
					}
				)
			);
			// append/prepend slider to gallery
			var position = this.options.thumbsPosition == 'top' ? 'prepend' : 'append';
			this.$rgGallery[position]( this.$rgThumbs );
		},
		
						
			// set elastislide's current to current
			this.$rgSlider.elastislide( 'setCurrent', this.current );
		},
		
		_initEvents: function(){
			// open gallery
			this.$el.on('click.rgGallery', 'a', $.proxy( function(e){
					e.preventDefault();
					
					this.showGallery( $(e.target).closest('li').index() );
					return false;
				}, this )
			);

			// close button
			this.$rgGallery.on('click.rgGallery', '.rg-close', $.proxy( function(e){
					this.hideGallery();
				}, this )
			);

			// close on Escape
			$(document).on('keyup.rgGallery', $.proxy( function(e){
					if (e.keyCode == 27)
						this.hideGallery();
				}, this )
			);

			// responsive vertical align for images
			$(window).resize( $.proxy( function(){
					this.$rgImage.centerBlock(true);
				}, this )
			);

			if ( this.itemsCount > 1 ) {
				// left/right arrows
				if ( this.options.navEvents.arrows ) {
					$(document).on('keyup.rgGallery', $.proxy( function(e){
							if (e.keyCode == 39)
								this.navigate( 'right' );
							else if (e.keyCode == 37)
								this.navigate( 'left' );
						}, this)
					);
				}

				// mouse scroll
				if ( this.options.navEvents.mousewheel ) {
					this.$rgImage.on('mousewheel.rgGallery', $.proxy( function(e){
						if ( e.originalEvent.wheelDelta/120 > 0 )
							this.navigate( 'left' );
						else
							this.navigate( 'right' );
						}, this)
					);
				}

				// add touchwipe events on the large image wrapper
				if ( this.options.navEvents.swipe ) {
					this.$rgImage.touchwipe({
						wipeLeft: $.proxy( function(){
							this.navigate( 'right' );
						}, this ),
						wipeRight: $.proxy( function(){
							this.navigate( 'left' );
						}, this),
						preventDefaultEvents: false
					});
				}
				

				// navigation
				this.$navPrev.on('click.rgGallery', $.proxy( function(e){
						this.navigate( 'left' );
					}, this )
				);	
				this.$navNext.on('click.rgGallery', $.proxy( function(e){
						this.navigate( 'right' );
					}, this )
				);
			}
		},

		showGallery: function( target ){
			if ( typeof target == undefined ) target = 0;
			this.$rgGallery.appendTo('body').show();
			this.navigate(target);
		
			// hide scroll
			$('body').css('overflow', 'hidden');
		},

		hideGallery: function(){
			this.$rgGallery.detach().hide();
			this.current = 0;

			// show scroll
			$('body').css('overflow', '');

			// remove all get/hash params
			this._pushState( true );
		},

		navigate: function( target, skipHistory ) {
			// navigate through the large images

			if ( this.isAnimating ) return false;
			this.isAnimating	= true;
			
			if ( typeof target === 'number' ) {
				this.current = target;
			} else if ( target === 'right' ) {
				if( this.current + 1 >= this.itemsCount )
					this.current = 0;
				else
					++this.current;
			} else if ( target === 'left' ) {
				if( this.current - 1 < 0 )
					this.current = this.itemsCount - 1;
				else
					--this.current;
			}
			
			this._showImage( this.$items.eq( this.current ) );

			// update state
			if ( this.options.history && !skipHistory ) {
				this._pushState();
			}
		},

		_pushState: function( remove ) {
			var url = remove ? location.pathname : "?image=" + this.current; // remove all get params on close
			var t = new Date().getTime();
			this.timestamps[t] = t;
			History.pushState( { time: t }, null, url );
		},

		_showImage: function( $item ) {
			// shows the large image that is associated to the $item
				
			this.$loader.show();
				 
			var $thumb = $item.find('img'),
				largesrc = $thumb.data('large'),
				title = $thumb.data('description');
			
			$('<img/>').load( $.proxy( function() {
					this.$rgImage.children('img').replaceWith('<img src="' + largesrc + '"/>').next('figcaption').empty();
					this.$rgImage.centerBlock(true);
				
					if( title )
						this.$rgImage.children('figcaption').show().text( title );
				
					this.$loader.hide();
					
					if( this.options.mode === 'carousel' && this.itemsCount > 1 ) {
						this.$items.removeClass('selected');
						$item.addClass('selected');

						this.$rgSlider.elastislide( 'reload' );
						this.$rgSlider.elastislide( 'setCurrent', this.current );
					}
					
					this.isAnimating	= false;
					
				}, this)
			).attr( 'src', largesrc );
			
		}
	};


	$.rgGallery.defaults = {
	    mode: 'carousel',
	    sliderPosition: 'bottom',
	    dataThumbs: false,
	    elastislide: {
			imageW: 65
		},
		// events that trigger navigation
		navEvents: {
			arrows: true, // arrow keys: left/right
			mousewheel: true, // mousewheel: up/down
			swipe: true // mobile swipe: left/right
		},
		history: true, // pushState on image change
		historyParam: 'image' // get param for pushState
	};

	var logError = function( message ) {
		if ( window.console ) {
			window.console.error( message );
		}
	};

	//rgGallery: Plugin Function
	$.fn.rgGallery = function(options) {
		if ( typeof options === 'string' ) {
			var args = Array.prototype.slice.call( arguments, 1 );
			this.each(function() {
				var instance = $.data( this, 'rgGallery' );
				if ( !instance ) {
					logError( "cannot call methods on rgGallery prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				}
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for rgGallery instance" );
					return;
				}
				instance[ options ].apply( instance, args );
			});
		} else {
			this.each(function() {	
				var instance = $.data( this, 'rgGallery' );
				if ( instance ) {
					instance._init();
				} else {
					instance = $.data( this, 'rgGallery', new $.rgGallery( options, this ) );
				}
			});
		}
		return this;
  }

})(jQuery, window, document);