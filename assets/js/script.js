///////////////////////////////
// One page Smooth Scrolling
///////////////////////////////
$('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
        if (target.length) {
            $('html,body').animate({
                scrollTop: target.offset().top
            }, 1000);
            return false;
        }
    }
});



$(document).ready(function() {

    // static navigationbar
    var changeStyle = $('#navigation-bar');

    function scroll() {
        if ($(window).scrollTop() > 640) {
            changeStyle.addClass('navbar-fixed-top');
            changeStyle.addClass('one-page-nav');
        } else {
            changeStyle.removeClass('navbar-fixed-top');
            changeStyle.removeClass('one-page-nav');
        }
    }

    document.onscroll = scroll;

    $('.testimonial-owl').owlCarousel({
        items: 1
    });

    $('.add-owl').owlCarousel({
        items: 4,
        nav: true,
        navText: false,
        dots: false,
        loop: true
    });

    $('.products-owl').owlCarousel({
        items: 1,
        nav: true,
        navText: [
            '<i class="ion-chevron-left" aria-label="Previous product"></i>',
            '<i class="ion-chevron-right" aria-label="Next product"></i>'
        ],
        dots: false,
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: true
    });

});