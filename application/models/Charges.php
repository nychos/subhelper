<?php

class Application_Model_Charges extends Zend_Db_Table_Abstract{
    
    const CAPACITY = 10;//вмістимість заряду
    const FULLCHARGE = 20; //кіл-ть перекладів для заповнення заряду
    const DISCHARGERATIO = 2;//співвідношення заряду до розряду e.g. 2 : 1    
    protected $chargeItem; // одиниця заряду = 1 перекладу ~ 0.5
    protected $dischargeItem; // одиниця розряду ~ 0.25

    public function init()
    {
        $this->id_user = $_SESSION['user']['id_user']; //TODO: from Session
        $this->dbAdapter = $this->getAdapter();
        $this->defineChargeItem();
    }
    public function defineChargeItem()
    {
        $this->chargeItem = self::CAPACITY / self::FULLCHARGE;
        $this->dischargeItem = $this->chargeItem / self::DISCHARGERATIO;
    }
    /**
     * Перевіряє чи заряд не перейшов норми
     * 
     * @param array $arr
     */
    public function getChargeState(Array $arr)
    {
        /**
         * 1. Витягуємо поточний стан заряду
         * 2. Поточний заряд + одиниця заряду = прогнозований обєм заряду
         * 3. Звіряємо з CAPACITY якщо прогнозований заряд менше оновлюємо
         *      якщо більше значення стає рівним CAPACITY
         * 
         */
        $select = $this->dbAdapter->select("charge")->from($arr['table'])->where($arr['where']);
         $str = $select->__toString();
         //var_dump($str);die();
        if($row = $this->dbAdapter->fetchRow($select)){
            $charge = floatval($row['charge']);
            if($arr['increase']){
                $newCharge = $charge + $this->chargeItem;
                if($newCharge >= self::CAPACITY)$newCharge = self::CAPACITY;
            }else {
                $newCharge = $charge - $this->dischargeItem;
                if($newCharge < 0)$newCharge = 0.00;
            }
            return $newCharge;
        }else {
            throw new Exception("result not found");
        }
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
       list($arr['table'], $arr['where']) = $this->getTableConditions($arr);
       //перевіряємо чи заряд не перейшов межі
       $charge = floatval($this->getChargeState($arr));
       if(is_numeric($charge)){
           //var_dump($charge);die();
            $data = array('charge' => $charge);
            try{
                 if($result = $this->dbAdapter->update($arr['table'], $data, $arr['where']))return $charge;
            }catch(Exception $e){
                echo $e->getMessage();
                return false;
            }
       }else {throw new Exception("getChargeState didn't return value!");}
    }
}
