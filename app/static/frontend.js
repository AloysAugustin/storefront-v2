$(document).on("click", ".catalog-farm", function() {
  $('.catalog-farm').not($(this)).toggleClass('hide');
  $(this).children(".img-container").toggleClass('hide');
  $(this).toggleClass('full-width');
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



