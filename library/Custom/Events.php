<?php

class Custom_Events{
    protected static $coordinator;
    /**
     * Зв'язує подію з методом
     * @param array $arr
     *      $arr['location'] Class name or object
     *      $arr['method'] action
     *      $arr['event'] name of event
     *      $arr['data'] parameters for method
     *          $arr['data']['id_location']
     *          $arr['data']['id_word']
     *          $arr['data']['table']
     */
    public static function bind(Array $arr)
    {
        //1.Перевіряємо чи подія з даним іменем уже існує
        $event = $arr['event'];
        self::$coordinator = new Zend_Session_Namespace('eventsCoordinator');
        if(!self::isRegistered($event) || self::clear($event)){
            self::$coordinator->events[] = $arr;
            return count(self::$coordinator->events);
        }
        throw new Exception("Cannot bind an event!");
    }
    /**
     * Призводить певну функцію в рух
     * @param String $event
     */
    public static function trigger($event)
    {
       if($index = self::isRegistered($event)){
           $value = self::$coordinator->events[$index['index']];
           $result = call_user_func(array($value['location'],$value['method']),$value['data']);
           if($result)self::clear($event);
           return $result;
       }
       return false;
       //throw new Exception("no such event atached!");
    }
    /**
     * Перевіряє чи подія зареєстрована
     * @param String $event
     * @return boolean
     */
    public static function isRegistered($event)
    {
        self::$coordinator = new Zend_Session_Namespace('eventsCoordinator');
        if(isset(self::$coordinator->events) && isset(self::$coordinator->events)){
            foreach(self::$coordinator->events as $index => $value){
                if($value['event'] === $event){
                    return array('index' => $index);
                }
            }
        }
        return false;
    }
    public static function clear($event)
    {
        if($index = self::isRegistered($event)){
            $i = $index['index'];
            unset(self::$coordinator->events[$i]);
            return true;
        }
        return false;
    }
    public static function getEvents()
    {
        self::$coordinator = new Zend_Session_Namespace('eventsCoordinator');
        return self::$coordinator->events;
    }
}