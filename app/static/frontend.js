$(document).on("click", ".farm", function() {
  $('.farm').not($(this)).toggleClass('hide');
  $(this).children(".img-container").toggleClass('hide');
  $(this).toggleClass('full-width');
});
