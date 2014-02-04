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
  //note('Loading instances');
  ajax('/v1/instances').then(done).fail(fail);

  function done(res) {
    renderInstances(res.data);

    //note('Rendered instances');
    if ( cb )
      cb();
  }

  function fail(xhr) {
    alert('Error (' + xhr.status + '): ' + xhr.responseText);
  }
}

function renderInstances(data) {
  //note('Render Instances');
  var hosts = {};

  data.forEach(function(inst) {
    var $elem = instanceElem(inst.id);
    if ( $elem )
    {
      if ( $elem.data('transitioning') != inst.transitioning )
        $elem.css({backgroundColor: instanceColor(inst)});

      return;
    }

    if ( !hosts[inst.requestedHostId] )
      hosts[inst.requestedHostId] = [];

    hosts[inst.requestedHostId].push( instanceTpl(inst) );
  });

  var keys = Object.keys(hosts);
  keys.forEach(function(hostId) {
    var $par = $('#host-'+hostId+' .host-contents');
    $par.append.call($par,hosts[hostId]);
  });
}

var queue = async.queue(_getInstance,4);

function loadInstance(id, cb) {
  queue.push(id, cb);
}

function _getInstance(id, cb) {
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

function instanceElem(id) {
  var $elem = $('#inst-'+id);
  if ( $elem.length > 0 )
    return $elem;
  else
    return null;
}

function instanceColor(inst) {
  if ( inst.transitioning == 'yes' )
    return "#0000ff";
  else if ( inst.transitioning == 'error' )
    return "#ff0000";
  else
    return "#ffffff";
}

function instanceTpl(inst) {
  return '<div data-transitioning="'+inst.transitioning+'" id="inst-' + inst.id + '" class="inst" style="background-color: '+ instanceColor(inst) + ';">' +
    '<div class="inst-name">'+(inst.name || inst.id)+'</div>' +
  '</div>';
}

// ------------------------------------

function connect() {
  var url = 'ws://localhost:8080/v1/subscribe?eventNames=state.change&eventNames=api.change';
  note('Connecting to: '+url);
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
//    console.log('Message:',d);

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
  loadInstance(id);
}
