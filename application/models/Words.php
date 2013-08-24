<?php

class Application_Model_Words extends Zend_Db_Table_Abstract{
    protected $_name = "Words";
    /**
     * Шукає слово та переклад до нього у власному словнику
     * @param String $word
     * @param Integer $id_user
     * @return boolean | Array - повертає масив з даними про слово або false в разі його відсутності
     */
    public function findMyWord($word, $id_user)
    {
        if($word){
            $word = strtolower($word);
            $row = $this->fetchRow(
                    $this->select()
                    ->where('word = ?', $word)
                    ->where('id_user = ?', $id_user)
                    );
            //не знайшли у власному, шукаємо в загальному
            if(count($row) === 1){
                //переводимо в правильне кодування
                $row['translation'] = trim(iconv('cp1251', 'utf8',$row['translation']));
                return array(
                    "translation" => $row['translation'],
                    "id_user" => $row['id_user'],
                    "id_subtitle" => $row['id_subtitle'],
                    "added" => $row['added']
                );
            }
        }
        return false;
    }
    /* пошук слова в загальному словнику, якщо хтось з користувачів уже переклав дане слово
     * тоді нема потреби шукати значення, а лише використати уже готовий переклад.
     * Таким чином зростатиме Народний переклад, в якому слова перевірятимуть люди, а не машини
     */
    public function findUsersWord($word, $id_user)
    {
        if($word){
            $word = strtolower($word);
            $row = $this->fetchAll($this->select()->where('word = ?', $word)->where('id_user != ?',$id_user));
            if(count($row) > 0){
                $arr = array();
                foreach($row as $i =>$value){
                    $arr[$i]['translation'] =  trim(iconv('cp1251', 'utf8',$value['translation']));
                    $arr[$i]['word'] = $value['word'];
                    $arr[$i]['id_user'] = $value['id_user'];
                    $arr[$i]['id_subtitle'] = $value['id_subtitle'];
                    $arr[$i]['added'] = $value['added'];
                }
                return $arr;
            }
        }
        return false;
    }
}
