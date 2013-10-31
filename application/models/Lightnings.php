<?php

class Application_Model_Lightnings extends Zend_Db_Table_Abstract{
    public function init()
    {
        $this->id_user = 1; //TODO: from Session
        $this->_table = 'users';
    }
    /**
     * Зменшує або збільшує кіл-ть блискавок
     * @param type $flage
     * @return Array || boolean Повертає масив з НОВОЮ кількістю блискавок після зміни
     */
    public function doLightning($flag = true)
    {
        $db = Zend_Db_Table_Abstract::getDefaultAdapter();
        ($flag) ? $expression = new Zend_Db_Expr('lightnings + 1') : $expression = new Zend_Db_Expr('lightnings - 1');
        $where = $db->quoteInto('id = ?', $this->id_user);
        $result = $db->update($this->_table, array('lightnings' => $expression),array($where));
        if($result){
            return $this->getLightings();
        }else {
            return false;
        }
    }
    /**
     * Витягує кіл-ть блискавок для користувача
     * @return Array
     */
    public function getLightings()
    {
        $db = Zend_Db_Table_Abstract::getDefaultAdapter();
        $where = $db->quoteInto('id = ?', $this->id_user);
        $query = $db->select()->from($this->_table)->where($where);
        $result = $db->fetchRow($query);
        if($result){
            return array(
                'id_user' => $result['id'],
                'lightnings' => $result['lightnings']
            );
        }else {return false;}
    }
    
}
