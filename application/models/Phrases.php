<?php

class Application_Model_Phrases extends Zend_Db_Table_Abstract{
    protected $_name = 'phrases';
    
    /**
     * Перевіряє чи фрази від даного субтитра вже містяться в базі
     * @param type $id ідентифікатор субтитра
     * @return Boolean
     */
    public function getPhrases($id)
    {
        $result = $this->fetchAll($this->select("phrase")->where('id_subtitle = ?', $id));
        if(count($result))return $result;
        return false;
    }
    /**
     * Добавляє фрази конкретного субтитра у базу
     * @param Array $phrases
     * @param Integer $id_sub
     */
    public function addPhrases($phrases, $id_sub)
    {
        if($phrases && $id_sub){
            foreach($phrases as $phrase){
                $row = $this->createRow();
                $row->phrase = $phrase;
                $row->id_subtitle = $id_sub;
                if(!$row->save())return false;
            }
        }else return false;
    }
}

