<?php
class dwcore {
  public static function test($json) {
    $obj = json_decode($json);
    foreach ($obj as $v) {
      if(!isset($v->name)) {
        throw new Exception("No name");
      }

      if(isset($v->needs) && !is_array($v->needs)) {
        throw new Exception("Need is not an array");
      }

      if(isset($v->pneeds) && !is_object($v->pneeds)) {
        throw new Exception("PNeed is not an object");
      } else if(isset($v->pneeds) && is_object($v->pneeds)) {
        foreach ($v->pneeds as $vj) {
          if(!is_array($vj)) {
            throw new Exception("PNeed item is not an string");
          }
        }
      }

      if(isset($v->fneeds) && !is_object($v->fneeds)) {
        throw new Exception("FNeed is not an object");
      } else if(isset($v->fneeds) && is_object($v->fneeds)) {
        foreach ($v->fneeds as $vj) {
          if(!is_array($vj)) {
            throw new Exception("FNeed item is not an string". $vj);
          }
        }
      }
    }
    return true;
  }
}
?>
