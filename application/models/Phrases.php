<?php

class Application_Model_Phrases extends Zend_Db_Table_Abstract{
    protected $_name = 'phrases';
    protected $_tableStatus = 'phrases_status';
    protected $_tableTranslations = 'phrases_translations';
    
    public function init()
    {
        $this->id_user = $_SESSION['user']['id_user'];
    }
    public function getPhraseTranslation($phrase_id)
    {
        $db = $this->getAdapter();
        $where = $db->quoteInto('id_phrase = ? AND id_user = ?', $phrase_id, $this->id_user);
        $query = $db->select()->from($this->_tableTranslations)->where($where);
        $result = $db->fetchAll($query);
        //var_dump(count($result));die();
        if(count($result)){
            return $result;
        }else {
            return false;
        }
    }
    /**
     * Додавання та оновлення перекладу для фрази
     * @param Integer $phraseId
     * @param String $translation
     * @return boolean
     */
    public function addTranslationForPhrase($phraseId, $translation)
    {
        if(is_numeric($phraseId) && is_string($translation)){
            $db = $this->getAdapter();
            $query = "REPLACE INTO ".$db->quoteIndentifier($this->_tableTranslations). "(`id_phrase`,`translation`, `id_user`) VALUES (`{$phraseId}`, `{$db->quoteIndentifier($translation)}`, {$this->id_user})";
            if($db->query($query)){
                //Оновлюємо також статус фрази на готовий
                if($this->updatePhraseStatus($phraseId))return true;
            }
        }
        return false;
    }
    /**
     * Зміна стану фрази
     * @param type $arr
     */
    public function updatePhraseStatus($phraseId, $status = true)
    {
        $id_user = $_SESSION['user']['id_user'];
        $db = $this->getAdapter();
        
        if($data['status']){
            $query = "INSERT INTO {$this->_tableStatus} (`id_phrase`, `status`, `id_user`) VALUES ({$phraseId}, {$status}, $id_user)";
            if($result = $db->query($query)){
                return $result;
            }
        }else {
            $query = "DELETE FROM {$this->_tableStatus} WHERE id_phrase = {$id_user}";
            if($result = $db->query($query)){
                return $result;
            }
        }
        return false;
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

