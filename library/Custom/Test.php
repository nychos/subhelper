<?php

class Custom_Test{
    public static function getLightnings(){
        $lightning = new Application_Model_Lightnings();
        Custom_Events::bind(array('location' => $lightning, 'method' => 'doLightning', 'event' => 'myEvent', 'data' => true));
        //Custom_Events::bind(array('location' => $lightning, 'method' => 'doLightning', 'event' => 'yourEvent', 'data' => false));
        //$result = $lightning->doLightning();
        //var_dump(count(Custom_Events::getEvents()));die();
        echo "<pre>";
        var_dump(Custom_Events::trigger('myEvent'));
        echo "</pre>";
        return false;
    }
}