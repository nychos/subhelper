<?php

class Application_Model_Subtitles extends Zend_Db_Table_Abstract{
    protected $_name = "Subtitles";
    
    public function addSubtitle($data)
    {
        if(count($data)){
            $row = $this->createRow();
            $row->id_user = $data['id_user'];
            $row->subtitle = $data['subtitle'];
            $id = $row->save();
            return $id;
        }
        return false;
    }
    public function getSubtitleById($id)
    {
        $row = $this->fetchRow($this->select()->where('id = ?', $id));
        return $row;
    }
}
