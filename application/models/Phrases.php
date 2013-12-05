<?php

class Application_Model_Phrases extends Zend_Db_Table_Abstract{
    protected $_name = 'phrases';
    protected $_tableStatus = 'phrases_statuses';
    
    /**
     * Зміна стану фрази
     * @param type $arr
     */
    public function updatePhraseStatus($arr)
    {
        $id_user = $_SESSION['user']['id_user'];
        $db = $this->getAdapter();
        //$arr[0]['id_phrase'] - ідентифікатор фрази
        //$arr[0]['status'] - змінений стан фрази
        //***************************************
        // 1. Перевірка наявності стану фрази
        
        // 2. Якщо є, тоді оновлюємо, якщо ні вставляємо, використовуємо функцію replace
        $query = 'REPLACE INTO ' . $db->quoteIdentifier($this->_tableStatus) . ' (`id_phrase`, `status`, `id_user`) VALUES ';
        $queryVals = array();
        foreach ($arr as $phrase){
            if($phrase['status'] !== 'progress'){
                $queryVals[] = '(' . $db->quote(trim($phrase['id_phrase'])) . ', ' . $db->quote(trim($phrase['status'])) . ', ' . $db->quote(trim($id_user)) . ')';
            }else {
                //формуємо запит на видалення групових даних
            }
        }
        $str = $query . implode(',', $queryVals);
        $result = $db->query($str);
        var_dump($result);die();
        // replace into table (column1, column2) values (value1, value2)
        // 3. Якщо стан з очікування або готовності змінився на прогрес, видаляємо комірку з бази
    }
    /**
     * Перевіряє чи фрази від даного субтитра вже містяться в базі
     * @param type $id ідентифікатор субтитра
     * @return Boolean
     */
    public function getPhrases($id)
    {
        $result = $this->fetchAll($this->select()->where('id_subtitle = ?', $id));
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

