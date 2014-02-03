updateShowNames();
loadHosts(connect);

$('#show-names').on('click', updateShowNames);

// ------------------------------------

function updateShowNames() {
  var show = $('#show-names')[0].checked;
  $('#hosts').toggleClass('hide-names', !show);
};

function loadHosts(cb) {
  note('Loading hosts');
  ajax('/v1/hosts').then(done).fail(fail);
  
  function done(res) {
    var html = [];

    res.data.forEach(function(host) {
      html.push(
        '<div id="host-' + host.id + '" class="host-wrapper">' +
          '<div class="host-name">'+(host.name || host.id)+'</div>' +
          '<div class="host-contents clearfix"></div>' +
        '</div>'
      );
    });

    var $hosts = $('#hosts');
    $hosts.empty();
    $hosts.append.call($hosts,html);

    note('Loaded hosts');
    loadInstances(cb);
  }

  function fail(xhr) {
    alert('Error (' + xhr.status + '): ' + xhr.responseText);
  }
}

function loadInstances(cb) {
  note('Loading instances');
  ajax('/v1/instances').then(done).fail(fail);

  function done(res) {
    renderInstances(res.data);

    note('Rendered instances');
    if ( cb )
      cb();
  }

  function fail(xhr) {
    alert('Error (' + xhr.status + '): ' + xhr.responseText);
  }
}

function renderInstances(data) {
  note('Render Instances');
  var hosts = {};

  data.forEach(function(inst) {
//    console.log(inst);

    if ( instanceExists(inst.id) )
      return;

    if ( !hosts[inst.requestedHostId] )
      hosts[inst.requestedHostId] = [];

    hosts[inst.requestedHostId].push( tplInstance(inst) );
  });

  var keys = Object.keys(hosts);
  keys.forEach(function(hostId) {
    var $elem = $('#host-'+hostId+' .host-contents');
    $elem.append.call($elem,hosts[hostId]);
  });
}

function loadInstance(id, cb) {
  ajax('/v1/instances/'+id).then(done).fail(fail);

  function done(res) {
    renderInstances([res]);

    if ( cb )
      cb(res);
  }

  function fail(xhr) {
    alert('Error (' + xhr.status + '): ' + xhr.responseText);
  }
}

function instanceExists(id) {
  return $('#inst-'+id).length > 0;
}

function tplInstance(inst) {
  return '<div id="inst-' + inst.id + '" class="inst">' +
    '<div class="inst-name">'+(inst.name || inst.id)+'</div>' +
  '</div>';
}

// ------------------------------------

function connect() {
  var url = 'ws://localhost:8080/v1/subscribe?eventNames=state.change&eventNames=api.change';
  console.log('Connecting to',url);
  var sock = new WebSocket(url);

  sock.onmessage = function(event) {
    var d = JSON.parse(event.data);
    var str = d.name;
    if ( d.resourceType )
    {
      str += ' ' + d.resourceType;

      if ( d.resourceId )
        str += ' ' + d.resourceId;
    }

    note(str);
    console.log('Message:',d);

    if ( d.resourceType == 'host' )
      hostChanged(d.resourceId, d);
    else if ( d.resourceType == 'instance' )
      instanceChanged(d.resourceId, d);
  }
}

function hostChanged(id, change) {
  var $elem = $('#host-'+id);
  if ( ! $elem.length )
  {
    note("Heard about host "+ id + " but I don't have a box for that, reloading");
    loadHosts();
  }
}

function instanceChanged(id, transitioning) {
  var $elem = $('#host-'+id);
  if ( $elem.length )
  {
    if ( transitioning == 'yes' )
      $elem.animate({backgroundColor: "#0000ff"}, 1000);
    else if ( transitioning == 'error' )
      $elem.animate({backgroundColor: "#ff0000"}, 1000);
    else
      $elem.animate({backgroundColor: "#ffffff"}, 1000);
  }
  else
  {
    loadInstance(id, function(inst) {
//      instanceChanged(id, inst.transitioning);
    });

//    note("Heard about instance "+ id + " but I don't have a box for that, reloading");
  }
}
