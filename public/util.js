function ajax(url) {
  return $.ajax({
    url: url,
    dataType: 'json',
    headers: {
      'Accept': 'application/json'
    },
  });
}

var MAX_NOTES = 20;
var FADE_MS = 500;
function note(str) {
  if ( ! $('#show-messages')[0].checked )
    return;

  var neu = $('<div/>', {'class': 'note'}).text(str).fadeIn(FADE_MS, limit);
  $('#note').prepend(neu);

  function limit() {
    var elems = $('#note .note').slice(Math.max(MAX_NOTES-1,0));
    elems.fadeOut(FADE_MS, function() { this.remove() });
  }
}
