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
        $db = $this->getAdapter();
        $db->beginTransaction();//розпочинаємо транзакцію
        try{
            $query = 'INSERT INTO ' . $db->quoteIdentifier($this->_name) . ' (`phrase`, `id_subtitle`) VALUES ';
            $queryVals = array();
            foreach ($phrases as $phrase) $queryVals[] = '(' . $db->quote(trim($phrase)) . ', ' . $db->quote(trim($id_sub)) . ')';
            $str = $query . implode(',', $queryVals);
            $result = $db->query($str);
            
            $db->commit();//підтверджуємо транзакцію
            return $result;
            
        }catch(Exception $e){
            $db->rollBack();//в разі неуспішної вставки робимо відкочування
            echo $e->getMessage();//TODO: опрацювати помилку
        }
    }
}

