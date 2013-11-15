<?php

class Application_Model_Translations extends Zend_Db_Table_Abstract{
    /**
     * TODO: переписати нормально SQL запит, без дублювання!
     * Шукає слово та переклад до нього у власному словнику
     * @param String $word
     * @param Integer $id_user
     * @return boolean | Array - повертає масив з даними про слово або false в разі його відсутності
     */
    public function findTranslations($word, $id_user)
    {
        if($word){
            $word = strtolower($word);
            $id_user = $_SESSION['user']['id_user'];
            $query = $this->getAdapter()->query("
                SELECT DISTINCT `t`.*, `ut`.`id_user` AS `tuser`, words.id as word_id,
                IF(t.id_user = {$id_user}, t.charge, ut.charge) as right_charge,
                IF(t.id_user = {$id_user}, 't', 'ut') as location 
                FROM `translations` AS `t`
                LEFT JOIN `users_translations` AS `ut` ON t.id=ut.id_translation
                INNER JOIN `words` ON words.id=ut.id_word OR words.id=t.id_word WHERE (word = '{$word}') AND (ut.id_user = {$id_user} OR NOT EXISTS (
                        SELECT b.id_user as tuser FROM translations as t2
                        LEFT JOIN `users_translations` AS `b` ON t2.id=b.id_translation
                        INNER JOIN `words` ON words.id=b.id_word OR words.id=t2.id_word
                        WHERE b.id_user = {$id_user}
                        AND b.id_translation = ut.id_translation
                        )) ORDER BY `t`.`translation` ASC"/*, array($word, $id_user, $id_user)*/);
              
            /*$select = $this->_db->select("t.*")
                ->distinct()
                ->from(array("t" => "translations"))
                ->joinLeft(array('ut' => "users_translations"),'t.id=ut.id_translation', array("tuser" => "ut.id_user"))
                ->joinInner("words", 'words.id=ut.id_word OR words.id=t.id_word', array())
                ->where("word = ?", $word)
                ->where("ut.id_user = ? OR NOT EXISTS (
                        SELECT b.id_user as tuser FROM translations as t2
                        LEFT JOIN `users_translations` AS `b` ON t2.id=b.id_translation
                        INNER JOIN `words` ON words.id=b.id_word OR words.id=t2.id_word
                        WHERE b.id_user = ?
                        AND b.id_translation = ut.id_translation
                        )"
                , $id_user)
                ->order('t.translation ASC');
           $str = $select->__toString();*/
           
           $result = $query->fetchall();
           //var_dump($result);
            //якщо є записи
            if(count($result) > 0){
                $arr = array();
                foreach($result as $i => $value){
                    //якщо є використаний переклад тоді беремо його
                    if(isset($value['tuser']) && $value['id_user'] !== $id_user){
                        $user = $value['tuser'];
                    }else{//якщо це переклад добавлений
                        $user = $value['id_user'];
                    }
                    if($user === $id_user){
                            $dictionary = 'my';
                            $arr[$dictionary][$i]['id_user'] = $user;
                    }else{
                        $dictionary = 'common';
                        if($user != NULL)$arr[$dictionary][$i]['referrer'] = $user;
                        $arr[$dictionary][$i]['id_user'] = $user;
                    }
                        $arr[$dictionary][$i]['id'] = $value['id'];
                        $arr[$dictionary][$i]['translation'] =  trim(iconv('cp1251', 'utf8',$value['translation']));
                        $arr[$dictionary][$i]['id_word'] = $value['word_id'];
                        $arr[$dictionary][$i]['added'] = $value['added'];
                        $arr[$dictionary][$i]['location'] = $value['location'];
                        $arr[$dictionary][$i]['charge'] = $value['right_charge'];
                }
                return $arr;
            }
        }
        return false;
    }
    /**
     * Витягує всі переклади користувача
     * @return boolean
     */
    public function getUserTranslations()
    {
        $id_user = $_SESSION['user']['id_user'];//TODO: from SESSION
        $db = $this->getAdapter();
        
        $query = " SELECT DISTINCT `t`.`translation`, `words`.`word`, 
            IF(t.charge IS NULL, ut.charge, t.charge) as 'charge',
            IF(ut.id_translation IS NULL, 't', 'ut') as location,
            IF(ut.id_user IS NULL, t.id_user, ut.id_user) as id_user 
            FROM `translations` AS `t`
            LEFT JOIN `users_translations` AS `ut` ON t.id=ut.id_translation
            INNER JOIN `words` ON words.id=ut.id_word OR words.id=t.id_word
            WHERE  (ut.id_user = 1 OR NOT EXISTS ( SELECT b.id_user as tuser FROM translations as t2 LEFT JOIN `users_translations` AS `b` ON t2.id=b.id_translation INNER JOIN `words` ON words.id=b.id_word OR words.id=t2.id_word WHERE b.id_user = 1 AND b.id_translation = ut.id_translation))
            ORDER BY `t`.`translation` ASC";
//         $select = $this->_db->select()
//                ->distinct()
//                ->from(array("t" => "translations"), array("t.translation"))
//                ->joinLeft(array('ut' => "users_translations"),'t.id=ut.id_translation', array())
//                ->joinInner("words", 'words.id=ut.id_word OR words.id=t.id_word', array("word"))
//                ->where("ut.id_user = ? OR NOT EXISTS (
//                        SELECT b.id_user as tuser FROM translations as t2
//                        LEFT JOIN `users_translations` AS `b` ON t2.id=b.id_translation
//                        INNER JOIN `words` ON words.id=b.id_word OR words.id=t2.id_word
//                        WHERE b.id_user = ?
//                        AND b.id_translation = ut.id_translation
//                        )"
//                , $id_user)
//                ->order('t.translation ASC');
        
        $result = $db->fetchAll($query);
        //var_dump($result);die();
        //$str = $select->__toString();var_dump($str);die();
        if(count($result))return $result;
        return false;
    }
    public function findUserTranslation($word)
    {
        if($word){
            $id_user = $_SESSION['user']['id_user'];//TODO: fetch user id from SESSION
            $select = $this->_db->select("*")
                        ->from(array("t" => "translations"))
                        ->distinct()
                        ->joinLeft(array("ut" => "users_translations"), "t.id=ut.id_translation")
                        ->joinInner("words", "t.id_word=words.id")
                        ->where("word = ? AND t.id_user = ?", $word, $id_user);
            
            $rows = $db->fetchAll($select);
            if(count($rows) !== 0) return $rows;
        }
            return NULL;
    }
    public function getWordId($word)
    {
        $select = $this->_db->select()->from('words')->where('word = ?', $word);
        $db = $this->getAdapter();
        $result = $db->fetchRow($select);
        if($result){
            return $result['id'];
        }else {
            //insert word into words table and return last_inserted_id
            if($insert = $db->insert('words', array("word" => $word))){
                return $db->lastInsertId();
            }
        }
        return $result;
    }
    /**
     * Добавляє унікальний переклад онлайн словника, а тоді звязує його з користувацьким
     * @param Array $data
     * @return Integer
     */
    public function useOnlineTranslation($data)
    {
        
        if($lastId = intval($this->addTranslation($data, true))){
            $data['id_translation'] = $lastId;
            if($this->useTranslation($data))return $lastId;
        }
        return false;
    }
    /**
     * Добавлення нового перекладу
     */
    public function addTranslation($data, $flag = false)
    {
        if(count($data)){
            //1. витягнути ідентифікатор
            $id_word = $this->getWordId($data['word']);
            //2. вставити в translations id_word, translation, id_user
            $db = $this->getAdapter();
            $translation = $data['translation'];
            $id_translation = $this->checkTranslation($translation);
            if($id_translation){
                $data['id_translation'] = $id_translation;
                $data['id_word'] = $id_word;
                unset($data['translation']);
                unset($data['word']);
                $result = $this->useTranslation($data);
                //var_dump($result);die();
                if($result){
                    return $id_translation;
                }
            }else {
                $id_user = NULL;
                ($flag) ? $id_user = $data['referrer'] : $id_user = $data['id_user'];
                $result = $db->insert('translations', array(
                    'id_user' => $id_user,//$data['id_user'],
                    'id_word' => $id_word, 
                    'translation' => trim(iconv('utf8', 'cp1251', $data['translation']))
                ));
                if($result){
                    return $db->lastInsertId();
                }
                return $result;
            }
        }
        return false;
    }
    /**
     * Перевіряє чи переклад уже міститься в базі
     * @param String $translation
     * @return boolean повертає false якщо ні, якщо є тоді ідентифікатор
     */
    public function checkTranslation($translation)
    {
        if($translation){
            $translation = trim(iconv('utf8', 'cp1251', $translation));
            $select = $this->_db->select()->from('translations')->where('translation = ?', $translation);
            $db = $this->getAdapter();
            $result = $db->fetchRow($select);
            if(count($result) === 0){
                return false;
            }else {
               return $result['id'];
            }
        }
        return "no translation";
    }
    /**
     * Використання уже існуючого перекладу
     */
    public function useTranslation($data)
    {
        if(count($data)){
            $db = $this->getAdapter();
            unset($data['translation']);
            //if(isset($data['id_word']))unset($data['word']);
            if(isset($data['word'])){
                $data['id_word'] = $this->getWordId($data['word']);// => 3 items : id_user, id_translation, referrer
                unset($data['word']);
            }
            $select = $this->_db->select()->from('users_translations')
                        ->where('id_translation = ?', $data['id_translation'])
                        ->where('id_user = ?', $data['id_user'])
                        ->where('id_word = ?', $data['id_word']);
            $rows = $db->fetchAll($select);
            if(count($rows) === 0){
                if($db->insert('users_translations', $data))return true;
            }
        }
        return false;
    }
    /**
     * Видаляє зв'язок користувача та перекладу,
     * НЕ видаляючи сам переклад
     * @param Integer $id
     * @param Integer $id_user
     * @return boolean
     */
    public function deleteTranslationConnection($id,$word, $id_user)
    {
        if($id && $word && $id_user){
            $db = $this->getAdapter();
            $id_word = $this->getWordId($word);
            $where = "id_translation = {$id} AND id_user = {$id_user} AND id_word = {$id_word}";
            $result = $db->delete('users_translations',$where);
            return $result;
        }
        return false;
    }
}
