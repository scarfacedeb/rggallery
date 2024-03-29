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
			if ( image !== false  )
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
		
			this.$items = this.$el.find('a').clone();
			this.itemsCount	 	= 	this.$items.length;

			this.current = 0;
			this.isAnimating = false;

			// create markup
			this.$rgGallery = $(['<div id="rg-gallery" class="rg-gallery">',
									'<span class="rg-close" title="Close">x</span>',
									'<div class="rg-image-wrapper">',
										'<figure class="rg-image">',
											'<img src="">',
											'<figcaption class="rg-caption"></figcaption>',
										'</figure>',
										'<div class="rg-loading"></div>',
									'</div></div>'
								].join(''));
			
			this.$rgImage = this.$rgGallery.find('.rg-image');
			this.$loader = this.$rgGallery.find('.rg-loading');

			if( this.itemsCount > 1 ) {
				// addNavigation
				this.$nav = $('<nav />').addClass("rg-image-nav");
				this.$navPrev = $('<span />').addClass('rg-image-nav-prev').appendTo(this.$nav);
				this.$navNext = $('<span />').addClass('rg-image-nav-next').appendTo(this.$nav);
				this.$nav.appendTo( this.$rgGallery.find('.rg-image-wrapper') );
			} 
			if ( this.itemsCount < 2 || !this.options.carousel ) {
				// fill empty space for slider
				this.$rgGallery.css('padding-bottom', 50);
			}

			// init history.js if needed
			if ( this.options.history )
				this._initHistory();

			// init social links - socialcount plugin
			if ( this.options.socialLinks )
				this._initSocial();
		},

		_initHistory: function() {
			// to distinguish Back button events from script-triggered events 
			this.timestamps = [];

			// original page title
			this.pageTitle = document.title;

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

		_initSocial: function(){
			// init socialcount plugin
			this.$rgSocial = $( '<div class="rg-social" id="rg-social">' ).prependTo(this.$rgGallery);
			this.$socialCount = $( '<ul />' ).addClass('socialcount')
											.data( 'vk-api', this.options.socialVkApi )
											.socialCount( this.options.socialConfig )
											.appendTo( this.$rgSocial );

			this.$rgGallery.addClass( 'rg-gallery-social' );
		},

		_initCarousel: function() {
			// elastislide plugin:
			// http://tympanus.net/codrops/2011/09/12/elastislide-responsive-carousel/
			if( !this.options.carousel || this.itemsCount < 2 ) return false;

			this.$rgThumbs = $([ '<div id="rg-thumbs" class="rg-thumbs">',
								 	'<div class="es-carousel-wrapper">',
										'<div class="es-carousel"></div>',
								 '</div></div>'
								].join(''));

			// optional separate thumb src for slider
			if ( this.options.dataThumbs ) {
				this.$items.each(function(){
					var $img = $(this).children();
					var thumb = $img.data('thumb');
					
					if ( thumb )
						$img.prop( 'src', thumb ).removeProp('data-thumb');
				});
			}

			// i'm sorry for this weird construction.
			// wrap() doesn't work on cloned items. and it was 6 in the morning.)
			this.$items.appendTo( 
				$('<ul />').appendTo( 
					this.$rgThumbs.find('.es-carousel') 
				)
			).wrap('<li />');

			// call elasticslide
			this.$esCarousel = this.$rgThumbs.children('.es-carousel-wrapper').show()
				.elastislide( $.extend( {}, this.options.elastislide,
					{
						//current: this.current,
						onClick: $.proxy( function( $item ) {
							this.navigate( $item.index() );
						}, this )
					}
				)
			);

			// add scroll
			if ( this.options.scroll )
				this._initSlider();

			// append/prepend slider to gallery
			var position = this.options.thumbsPosition == 'top' ? 'prepend' : 'append';
			this.$rgGallery[position]( this.$rgThumbs );
		},
		
		_initSlider: function(){

			// append rgThumbs to body to determine carousel width
			this.$esSlider = $('<div />').addClass('es-scroll')
							.prependTo( this.$rgThumbs.appendTo('body') )
							.slider({
								orientation	: 'horizontal',
								animate 	: 1000,
								min			: 0,
								value		: 0,
								slide		: $.proxy( function(e, ui) {
									this.$esCarousel.find('ul').css( 'marginLeft', -ui.value );
									// TODO: hide next/prev nav
									// if ( ui.value == 0 ){
									// 	this.$esCarousel.elastislide( 'toggleControls', 'prev' );
									// }
								}, this )
							});

			this.$rgThumbs.detach();

			// window resize
			$(window).on('resize.rgGallery', $.proxy( function( e ) {
					this.$esSlider.slider( 'option' , 'max', this.$esCarousel.find('ul').width() - this.$esCarousel.width() - 13 );
				}, this)
			);

			// add hook for slider
			this.$esCarousel.elastislide( 'setOption', 'onBeforeSlide', $.proxy( function( val ){
					if ( this.$esSlider ) {
						// if next/prev navigation is pressed -> val == '-=100'.
						if ( typeof val == 'string' )
							var val = -( this.$esSlider.slider('value') - parseInt(val.replace('=','')) );
						
						this.$esSlider.slider( 'value', -val );
					}
				}, this ) 
			);
		},

		_initEvents: function(){
			// open gallery
			this.$el.on('click.rgGallery', 'a', $.proxy( function(e){
					e.preventDefault();
					
					this.showGallery( $(e.target).parent().index() );
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
			$(window).on( 'resize.rgGallery', $.proxy( function(){
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

			// set max value for scroll
			// moved this from _initSlider because width() returned different values
			if ( this.options.scroll && this.options.carousel && this.itemsCount > 1 )
				this.$esSlider.slider( 'option', 'max', this.$esCarousel.find('ul').width() - this.$esCarousel.width() - 3 );
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
			var t = new Date().getTime();
			this.timestamps[t] = t;
			
			var url = remove ? location.pathname : "?image=" + this.current; // remove all get params on close
			var title = this.title ? this.pageTitle + ' - ' + this.title : this.pageTitle; // concat original page title with caption
			
			History.pushState( { time: t }, title, url );
		},

		_showImage: function( $item ) {
			// shows the large image that is associated to the $item
				
			this.$loader.show();
				 
			var $thumb = $item.find('img'),
				largesrc = $thumb.data('large');
			
				this.title = $thumb.data('description');
			
			$('<img/>').load( $.proxy( function(e) {
					this.$rgImage.children('img').replaceWith( e.target );
					
					this.$rgImage.children('figcaption').empty().hide();
					if( this.title )
						this.$rgImage.children('figcaption').show().text( this.title );
				
					this.$rgImage.centerBlock(true);

					this.$loader.hide();
					
					if( this.options.carousel && this.itemsCount > 1 ) {
						this.$esCarousel.find('.selected').removeClass('selected');
						$item.parent().addClass('selected');

						this.$esCarousel.elastislide( 'reload' );
						this.$esCarousel.elastislide( 'setCurrent', this.current );
					}
					
					this.isAnimating	= false;
					
				}, this)
			).attr( 'src', largesrc );
			
		}
	};


	$.rgGallery.defaults = {
	    carousel: true, // show carousel
	    thumbsPosition: 'bottom', // position of the carousel
	    dataThumbs: false, // use data-thumb fields as the source of thumbnails
	     // options for carousel
	    elastislide: {
			imageW: 65
		},
		scroll: true, // show scroll with slider
		// events that trigger navigation
		navEvents: {
			arrows: true, // arrow keys: left/right
			mousewheel: true, // mousewheel: up/down
			swipe: true // mobile swipe: left/right
		},
		history: true, // pushState on image change
		historyParam: 'image', // get param for pushState
		socialLinks: true, // add social sites' links
		// config for socialCount
		socialVkApi: '3542794',
		socialConfig: {
			socialSites: [ 'vk', 'odnoklassniki', 'facebook', 'twitter' ]
		}
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