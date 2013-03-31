;(function( $, window, document, undefined ) {
	// ======================= imagesLoaded Plugin ===============================
	// https://github.com/desandro/imagesloaded

	// original: mit license. paul irish. 2010.
	// contributors: Oren Solomianik, David DeSandro, Yiannis Chatzikonstantinou

	$.fn.imagesLoaded 		= function( callback ) {
		var $images = this.find('img'),
			len 	= $images.length,
			_this 	= this,
			blank 	= 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

		function triggerCallback() {
			callback.call( _this, $images );
		}

		function imgLoaded() {
			if ( --len <= 0 && this.src !== blank ){
				setTimeout( triggerCallback );
				$images.off( 'load error', imgLoaded );
			}
		}

		if ( !len ) {
			triggerCallback();
		}

		$images.on( 'load error',  imgLoaded ).each( function() {
			// cached images don't fire load sometimes, so we reset src.
			if (this.complete || this.complete === undefined){
				var src = this.src;
				// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
				// data uri bypasses webkit log warning (thx doug jones)
				this.src = blank;
				this.src = src;
			}
		});

		return this;
	};

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
	var pluginName = 'rgGallery';

	$.rgGallery = function( el, options ){
		
		var self				 	= 	this,
				options 		 	= 	$.extend( {}, $.rgGallery.defaults, options),
				$triggersWrap	= 	$(el),
				$items			 	= 	$triggersWrap.find('li'),
				itemsCount	 	= 	$items.length,
				$rgGallery,
				$rgImage,
				$rgThumbs 	 	=		$('#rg-thumbs').detach(),
				$esCarousel,
				current 		 	=		0,
				anim				 	= 	false; // control if one image is being loaded
		
		
		function init() {
			// (not necessary) preloading the images here...
			//$items.add('<img src="images/ajax-loader.gif"/><img src="images/black.png"/>').imagesLoaded( function() {
				// add options
				//_addViewModes();
				
				// create markup and bind events
				initGallery();
				
				// initialize the carousel
				if( options.mode === 'carousel' )
					initCarousel();
				
				// show first image
				//showImage( $items.eq( current ) );
			//});
		}

		function initGallery() {
			// adds the structure for the large image and the navigation buttons (if total items > 1)
			// also initializes the navigation events
			
			$rgGallery = $('#rg-gallery-tmpl').tmpl( {itemsCount : itemsCount} );
			$rgImage = $rgGallery.find('div.rg-image');

			$triggersWrap.on('click.rgGallery', 'a', function(event){
				event.preventDefault();
				
				self.showGallery( $(this).parent().index() );
				return false;
			});

			$(document).on('keyup.rgGallery', function( event ) {
				if (event.keyCode == 27)
					self.hideGallery();
			});	

			$(window).resize(function(){
				$rgImage.centerBlock(true);
			});

			if( itemsCount > 1 ) {
				// addNavigation
				var $navPrev			= $rgGallery.find('.rg-image-nav-prev'),
					 	$navNext			= $rgGallery.find('.rg-image-nav-next'),
						$imgWrapper		= $rgGallery.find('.rg-image');
					
				$navPrev.on('click.rgGallery', function( event ) {
					self.navigate( 'left' );
					return false;
				});	
				
				$navNext.on('click.rgGallery', function( event ) {
					self.navigate( 'right' );
					return false;
				});
			
				// add touchwipe events on the large image wrapper
				$imgWrapper.touchwipe({
					wipeLeft			: function() {
						self.navigate( 'right' );
					},
					wipeRight			: function() {
						self.navigate( 'left' );
					},
					preventDefaultEvents: false
				});
			
				$(document).on('keyup.rgGallery', function( event ) {
					if (event.keyCode == 39)
						self.navigate( 'right' );
					else if (event.keyCode == 37)
						self.navigate( 'left' );
				});	
			}
			
			$rgGallery.appendTo('body');
		}

		function initCarousel() {
			// elastislide plugin:
			// http://tympanus.net/codrops/2011/09/12/elastislide-responsive-carousel/
			$rgThumbs.find('.es-carousel').append( $triggersWrap.clone().removeAttr('id') );
			if ( options.sliderPosition == 'top' )
				$rgGallery.prepend( $rgThumbs );
			else
				$rgGallery.append( $rgThumbs );

			$esCarousel = $rgThumbs.children('.es-carousel-wrapper').show().elastislide({
				imageW 	: 65,
				onClick	: function( $item ) {
					if( anim ) return false;
					anim	= true;
					// on click show image
					showImage($item);
					// change current
					current	= $item.index();
				}
			});
			$items = $esCarousel.find('li');
			
			// set elastislide's current to current
			$esCarousel.elastislide( 'setCurrent', current );
		};
		

		this.showGallery = function( target ){
			if ( typeof target == undefined ) target = 0;
			
			$rgGallery.show();
			self.navigate(target);
		};

		this.hideGallery = function(){
			$rgGallery.hide();
			current = 0;
		}

		this.navigate = function( target ) {
			// navigate through the large images
			
			if ( anim ) return false;
			anim	= true;
			
			if ( typeof target === 'number' ) {
				current = target;
			} else if ( target === 'right' ) {
				if( current + 1 >= itemsCount )
					current = 0;
				else
					++current;
			} else if ( target === 'left' ) {
				if( current - 1 < 0 )
					current = itemsCount - 1;
				else
					--current;
			}
			
			showImage( $items.eq( current ) );
			
		};


		function showImage( $item ) {
				
			// shows the large image that is associated to the $item
			
			var $loader	= $rgGallery.find('div.rg-loading').show();
				 
			var $thumb		= $item.find('img'),
					largesrc	= $thumb.data('large'),
						title		= $thumb.data('description');
			
			$('<img/>').load( function() {
				
				$rgImage.empty().append('<img src="' + largesrc + '"/>').centerBlock(true);
				
				if( title )
					$rgGallery.find('div.rg-caption').show().children('p').empty().text( title );
				
				$loader.hide();
				
				if( options.mode === 'carousel' ) {
					$items.removeClass('selected');
					$item.addClass('selected');

					$esCarousel.elastislide( 'reload' );
					$esCarousel.elastislide( 'setCurrent', current );
				}
				
				anim	= false;
				
			}).attr( 'src', largesrc );
			
		}

		init();
	};


	$.rgGallery.defaults = {
	    mode 	: 'carousel',
	    sliderPosition : 'bottom'
	};

	//rgGallery: Plugin Function
	$.fn[pluginName] = function(options) {
    return this.each(function() {
      if ( !$.data(this, pluginName) ) {
        $.data(this, pluginName, new $.rgGallery(this, options));
      }
    });
	}
})(jQuery, window, document);