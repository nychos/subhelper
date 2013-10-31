<?php

class Application_Model_Charges extends Zend_Db_Table_Abstract{
    public function init()
    {
        $this->id_user = 1; //TODO: from Session
        $this->dbAdapter = $this->getAdapter();
    }
    /**
     * Формує строку запиту
     * @param Integer $id_translation
     * @param String $table
     * @param Integer $id_word
     * @return Array
     */
    public function getTableConditions(Array $arr)
    {
       $id_translation = $arr['id'];
       $table = $arr['location'];
       $id_word = $arr['id_word'];
       
       //var_dump(array('id' => $id_translation, 'table' => $table, 'id_word' => $id_word));die();
       
       if($table === 't'){
           $table = 'translations';
           $where = $this->dbAdapter->quoteInto("id = ? AND ", $id_translation);
           $where .= $this->dbAdapter->quoteInto("id_user = ? AND ", $this->id_user);
           $where .= $this->dbAdapter->quoteInto("id_word = ?", $id_word);
       }else if($table === 'ut'){
           $table = 'users_translations';
           $where = $this->dbAdapter->quoteInto("id_translation = ? AND ", $id_translation);
           $where .= $this->dbAdapter->quoteInto("id_user = ? AND ", $this->id_user);
           $where .= $this->dbAdapter->quoteInto("id_word = ?", $id_word);
       }
       //var_dump($where);die();
       return array($table, $where);
    }
    /**
     * Збільшення або зменшення заряду перекладу користувача
     * @param Integer $id_translation id of translation
     * @param String $table translations or users_translations table
     * @return boolean 
     */
    public function doCharge($arr)
    {
       (!isset($arr['increase'])) ? $increase = 1 : $increase = $arr['increase'];
       $expression = NULL;
       list($table, $where) = $this->getTableConditions($arr);
       ($increase) ? $expression = new Zend_Db_Expr('charge + 1') : $expression = new Zend_Db_Expr('charge - 1');
       $data = array('charge' => $expression);
       try{
            if($result = $this->dbAdapter->update($table, $data, $where))return $result;
       }catch(Exception $e){
           return false;
       }
    }
    /**
     * TODO: перенести на клієнт
     * Витягує інформацію про заряд для перекладу
     * @param  $id_translation
     * @param String $table
     * @return Array
     */
//    public function getChargeInfo($id_translation, $table, $id_word)
//    {
//        list($table, $where) = $this->getTableConditions($table, $id_translation, $id_word);
//        $query = $this->dbAdapter->select()->from($table)->where($where);
//        $result = $this->dbAdapter->fetchRow($query);
//        return $result;
//    }
//    /**
//     * //TODO: витягувати при формуванні словника користувача
//     * Заряд словника користувача
//     * @return Array масив з даними про заряд словника
//     */
//    public function getDictionaryCharge()
//    {
//    }
}
