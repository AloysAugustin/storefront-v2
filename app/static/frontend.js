// $(document).on("click", ".li-left", function() {
//   if $('.li-left').hasClass('active') {
// //     $('.catalog-farm').toggleClass('hide');
// //     $('.catalog-farm').children(".img-container").removeClass('hide');
// //     $('.catalog-farm').removeClass('full-width');
//   }
// });

$(document).on("click", ".catalog-farm", function() {
  $('.catalog-farm').not($(this)).toggleClass('hide');
  $(this).children('.farm-body').children('.farm-description').append($(this).children(".img-container").children(".running-farm-logo"));
  $(this).children(".img-container");
  $(this).toggleClass('full-width');
  $('h3.farm-name').toggleClass('font-size-lg');
});


$(document).on("click", ".running-farm", function() {
  console.log($(this));
  $('.running-farm').not($(this)).toggleClass('hide');
  $('.running-farm').toggleClass('full-width');
  if ($('.running-farm').length > 1 ) {
    $('.running-farm').not($(this)).toggleClass('hide');
  }
  $(this).children(".img-container").toggleClass('hide');
});

