<?php

class Application_Model_Translations extends Zend_Db_Table_Abstract{
    /**
     * 
     * Шукає слово та переклад до нього у власному словнику
     * @param String $word
     * @param Integer $id_user
     * @return boolean | Array - повертає масив з даними про слово або false в разі його відсутності
     */
    public function findTranslations($word, $id_user)
    {
        if($word){
            $word = strtolower($word);
            //id_word => select t.id, t.translation, ut.id_user as user_id, t.id_user from translations as t  left join users_translations as ut on t.id=ut.id_translation where t.id_word = 2;
            //word => select t.id_word, t.id, t.translation, ut.id_user as user_id, t.id_user from translations as t  left join users_translations as ut on t.id=ut.id_translation cross join words on t.id_word=words.id where t.id_word = words.id AND word = "out";
            //SELECT t.id, translation, id_word, t.id_user, 'referrer', 'translations' FROM translations as t
//            INNER JOIN words ON words.id=t.id_word
//            WHERE word='help'
//            UNION
//            SELECT t.id, translation, words.id, t.id_user, ut.referrer, 'users_translations' FROM users_translations as ut
//            INNER JOIN words ON words.id=ut.id_word
//            INNER JOIN translations as t ON t.id=ut.id_translation
//            WHERE word='help'
            //TODO: правильний запит сформувати
            $id_user = 1;
            $select = $this->_db->select("t.*")
                ->distinct()
                ->from(array("t" => "translations"))
                ->joinLeft(array('ut' => "users_translations"),'t.id=ut.id_translation', array("tuser" => "ut.id_user"))
                ->joinInner("words", 'words.id=ut.id_word OR words.id=t.id_word', array())
                ->where("word = ?", $word)
                //->group('tuser')
                ->order('t.translation ASC');
           $str = $select->__toString();
          
           $result = $this->getAdapter()->fetchAll($select);
           var_dump($str);die();
          
            //якщо є записи
            if(count($result) > 0){
                $arr = array();
                $unique = NULL;
                //TODO: remove duplicate entries, if id_user = tuser others remove
                foreach($result as $i => $value){
                    //якщо є використаний переклад тоді беремо його
                    if(isset($value['tuser'])){
                        $user = $value['tuser'];
                        if($value['tuser'] == $value['id_user'])$unique = $value;
                    }else{//якщо це переклад добавлений
                        $user = $value['id_user'];
                    }
                    if($user === $id_user){
                            $dictionary = 'my';
                            $arr[$dictionary][$i]['id_user'] = $user;
                    }else{
                        $dictionary = 'common';
                        if(isset($value['referrer'])){$arr[$dictionary][$i]['referrer'] = $value['referrer'];}
                        $arr[$dictionary][$i]['id_user'] = $user;
                    }
                        $arr[$dictionary][$i]['id'] = $value['id'];
                        $arr[$dictionary][$i]['translation'] =  trim(iconv('cp1251', 'utf8',$value['translation']));
                        $arr[$dictionary][$i]['id_word'] = $value['id_word'];
                        $arr[$dictionary][$i]['added'] = $value['added'];
                }
                //var_dump($arr);die();
                //if tuser = id_user remove another 
                if($unique){
                    var_dump($unique);die();
                    foreach($arr as $j => $dictionary){
                        foreach($dictionary as $value){
                            if($unique['id'] == $value['id'] && $unique['tuser'] != $id_user){
                                unset($arr[$j][$value]);
                                return $arr[$j][$value];
                            }
                        }
                    }
                }
                return $arr;
            }
        }
        return false;
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
     * Добавлення нового перекладу
     */
    public function addTranslation($data)
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
                $result = $db->insert('translations', array(
                    'id_user' => $data['id_user'],
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
                $result = $db->insert('users_translations', $data);
                return $result;
            }
            //var_dump($rows);die();//TODO: протестувати
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
