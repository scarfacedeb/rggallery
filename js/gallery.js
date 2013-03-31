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
	
	$.rgGallery = function( options, el ){
		this.$el = $( el );
		this._init( options );
	}


	$.rgGallery.prototype = {
		_init: function( options ) {
				this.options = $.extend( {}, $.rgGallery.defaults, options),

				// create markup and bind events
				this._config();

				this._initCarousel();

				this._initEvents();
				
				// initialize the carousel
		},

		_config: function() {
			//this.$triggers = this.$el.find('a');
			
			this.$items = this.$el.find('li').clone();
			this.itemsCount	 	= 	this.$items.length;

			this.current = 0;
			this.isAnimating = false;

			// adds the structure for the large image and the navigation buttons (if total items > 1)
			// also initializes the navigation events
			
			this.$rgGallery = $('#rg-gallery-tmpl').tmpl( {itemsCount : this.itemsCount} );
			this.$rgImage = this.$rgGallery.find('.rg-image');

			if( this.itemsCount > 1 ) {
				// addNavigation
				this.$navPrev	= this.$rgGallery.find('.rg-image-nav-prev');
				this.$navNext = this.$rgGallery.find('.rg-image-nav-next');
			}
			
			this.$rgGallery.appendTo('body');
		},

		_initCarousel: function() {
			// elastislide plugin:
			// http://tympanus.net/codrops/2011/09/12/elastislide-responsive-carousel/
			if( this.options.mode !== 'carousel' ) return false;

			$rgThumbs = $('#rg-thumbs').detach();

			//separate thumb src for slider
			if ( this.options.dataThumbs ) {
				this.$items.each(function(){
					var $this = $(this);
					$this.prop( 'src', $this.data('thumb') ).removeProp('data-thumb');
				});
			}

			var position = this.options.sliderPosition == 'top' ? 'prepend' : 'append';
			$rgThumbs.find('.es-carousel').append( $('<ul>').append( this.$items ) );
			this.$rgGallery[position]( $rgThumbs );

			this.$rgSlider = $rgThumbs.children('.es-carousel-wrapper').show()
				.elastislide( $.extend( {}, this.options.elastislide,
					{
						onClick: $.proxy( function( $item, e, x ) {
							if( this.isAnimating ) return false;
							this.isAnimating = true;
							// on click show image
							this._showImage( $item );
							// change current
							this.current = $item.index();
						}, this )
					}
				)
			);
						
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

			// close on Escape
			$(document).on('keyup.rgGallery', $.proxy( function(e){
					if (e.keyCode == 27)
						this.hideGallery();
				}, this )
			);	

			// left/right arrows
			$(document).on('keyup.rgGallery', $.proxy( function(e){
					if (e.keyCode == 39)
						this.navigate( 'right' );
					else if (e.keyCode == 37)
						this.navigate( 'left' );
				}, this)
			);

			// add touchwipe events on the large image wrapper
			this.$rgImage.touchwipe({
				wipeLeft: $.proxy( function(){
					this.navigate( 'right' );
				}, this ),
				wipeRight: $.proxy( function(){
					this.navigate( 'left' );
				}, this),
				preventDefaultEvents: false
			});
			
			// responsive vertical align for images
			$(window).resize( $.proxy( function(){
					this.$rgImage.centerBlock(true);
				}, this )
			);

			// navigation
			this.$navPrev.on('click.rgGallery', $.proxy( function(e){
					this.navigate( 'left' );
					return false;
				}, this )
			);	
			this.$navNext.on('click.rgGallery', $.proxy( function(e){
					this.navigate( 'right' );
					return false;
				}, this )
			);

			//handlers for slider
			if( this.options.mode === 'carousel' ) {

			}
		},

		showGallery: function( target ){
			if ( typeof target == undefined ) target = 0;
			
			this.$rgGallery.show();
			this.navigate(target);
		},

		hideGallery: function(){
			this.$rgGallery.hide();
			this.current = 0;
		},

		navigate: function( target ) {
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
			
		},

		_showImage: function( $item ) {
				
			// shows the large image that is associated to the $item
			
			var $loader	= this.$rgGallery.find('.rg-loading').show();
				 
			var $thumb = $item.find('img'),
				largesrc = $thumb.data('large'),
				title = $thumb.data('description');
			
			$('<img/>').load( $.proxy( function() {
					this.$rgImage.empty().append('<img src="' + largesrc + '"/>').centerBlock(true);
					
					if( title )
						this.$rgGallery.find('div.rg-caption').show().children('p').empty().text( title );
					
					$loader.hide();
					
					if( this.options.mode === 'carousel' ) {
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