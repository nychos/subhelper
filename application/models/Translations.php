<?php

class Application_Model_Translations extends Zend_Db_Table_Abstract{
    /**
     * TODO: доробити обєднання таблиць і правильну вибірку
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

            $select = $this->_db->select("t.id", "t.translation", array("user_id" => "ut.id_user"), "t.id_user")
                ->from(array("t" => "translations"))
                ->joinLeft(array('ut' => "users_translations"),'t.id=ut.id_translation', array("referrer" => "ut.id_user"))
                ->joinInner("words", 'words.id=t.id_word', array())
                ->where("word = ?", $word)
                ->order('t.translation ASC');
           $result = $this->getAdapter()->fetchAll($select);
           //var_dump($result);die();
            //якщо є записи
            if(count($result) > 0){
                $arr = array();
                foreach($result as $i => $value){
                    if($value['id_user'] === $id_user || $value['referrer'] === $id_user){
                        $dictionary = 'my';
                    }else {
                        $dictionary = 'common';
                        $arr[$dictionary][$i]['referrer'] = $value['referrer'];
                    }
                        $arr[$dictionary][$i]['id'] = $value['id'];
                        $arr[$dictionary][$i]['translation'] =  trim(iconv('cp1251', 'utf8',$value['translation']));
                        $arr[$dictionary][$i]['id_word'] = $value['id_word'];
                        $arr[$dictionary][$i]['id_user'] = $value['id_user'];
                        $arr[$dictionary][$i]['added'] = $value['added'];
                }
                //var_dump($arr);die();
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
            $result = $db->insert('translations', array(
                'id_user' => $data['id_user'],
                'id_word' => $id_word, 
                'translation' => trim(iconv('utf8', 'cp1251', $data['translation']))
            ));
            if($result){
                return $db->lastInsertId();
            }
        }
        return false;
    }
    /**
     * Використання уже існуючого перекладу
     */
    public function useTranslation($data)
    {
        if(count($data)){
            $db = $this->getAdapter();
            unset($data['word']);// => 3 items : id_user, id_translation, referrer
            $result = $db->insert('users_translations', $data);
            return $result;
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
    public function deleteTranslationConnection($id, $id_user)
    {
        if($id && $id_user){
            $db = $this->getAdapter();
            $where = "id_translation = {$id} AND id_user = {$id_user}";
            $result = $db->delete('users_translations',$where);
            return $result;
        }
        return false;
    }
}
