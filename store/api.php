<?php
header('content-type: text/json');
require './class.dwcore.php';
require './config.php';

$m = new MongoClient();
$db = $m->selectDB($dw_config['dbname']);
$storeCol = $db->{$dw_config['webstorecoll']};
if(isset($_REQUEST['drop']) && $_REQUEST['drop'] == $dw_config['dropkey']) { $storeCol->drop(); }

if(isset($_REQUEST['json'])) {
  if(dwcore::test($_REQUEST['json'])
     && is_numeric($_REQUEST['form_save_expiration'])) {

    if(!in_array($_REQUEST['form_save_expiration'], array(31536000, 2592000, 604800, 86400))) {
      http_response_code(406);
      die(json_encode(array(
        'errmsg' => 'Invalid expiration time.'
      )));
    }

    $doc = array(
      'webid' => uniqid('dw'),
      'displayname' => $_REQUEST['form_save_displayname'],
      'exposure' => $_REQUEST['form_save_exposure'],
      'expiration' => time() + (int)$_REQUEST['form_save_expiration'],
      'creationTime' => time(),
      'web' => json_decode($_REQUEST['json']),
      //'username' => $_REQUEST['username']
      'username' => 'guest'
    );
    $storeCol->insert($doc);
    unset($doc['username']);
    echo json_encode($doc);
  } else {
    http_response_code(406);
    echo json_encode(array(
      'errmsg' => 'Invalid depweb json structure'
    ));
  }
}

if(isset($_REQUEST['webid'])) {
  $doc = $storeCol->findOne(array(
    'webid' => $_REQUEST['webid']
  ));
  $tmpObj = json_decode(json_encode($doc['web']));
  $ntmp = array(
    'webid' => @$doc['webid'],
    //'username' => @$doc['username'],
    'creationTime' => @$doc['creationTime'],
    'displayname' => $doc['displayname'],
    'exposure' => $doc['exposure'],
    'expiration' => $doc['expiration'],
    'web' => $tmpObj
  );
  if($ntmp['web'] == null) {
    $ntmp = array('errmsg' => 'Invaid webid');
  }

  echo json_encode($ntmp);
  die();
}

if(isset($_REQUEST['list'])) {
  $page = (isset($_REQUEST['p']) && is_numeric($_REQUEST['p']) && $_REQUEST['p'] < 31) ? (int)$_REQUEST['p'] : 0;
  $filter = array(
    'exposure' => array('$ne' => 'unlisted')
    ,'expiration' => array('$gt' => time()-1)
  );

  $cursor = $storeCol->find($filter)->fields(array('webid' => true, 'creationTime' => true, 'displayname' => true))->sort(array('creationTime' => -1))->limit(30)->skip($page * 30);
  $ar = array();
  foreach ($cursor as $doc) {
    //$tmpObj = json_decode(json_encode($doc['web']));
    $ntmp = array(
      'webid' => @$doc['webid'],
      'displayname' => @$doc['displayname'],
      //'username' => @$doc['username'],
      'creationTime' => @$doc['creationTime']//,
      //'web' => $tmpObj
    );
    array_push($ar, $ntmp);
  }
  echo json_encode($ar);
  die();
}
?>
