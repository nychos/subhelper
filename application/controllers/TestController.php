<?php

class TestController extends Zend_Controller_Action{
    
    private $time = array();
    public function init()
    {
        $this->_helper->layout->setLayout('test');
         $alphabet = array();
        
        $phrase = new Application_Model_Phrases();
        $phrases = $phrase->getPhrases(3);
        $words = $this->breakPhrasesIntoWords($phrases);
        //echo "<pre>";var_dump($words); echo "</pre>";die();
        
        foreach($words as $word){
            $firstLetter = strtolower($word[0]);
            $alphabet[$firstLetter][] = $word;
            //$alphabet[$firstLetter] maybe some sorting here
        }
        //echo "<pre>";var_dump($alphabet); echo "</pre>";die();
        $this->words = $words;
        $this->alphabet = $alphabet;
    }
    public function getmicrotime()
    {
        list($usec, $sec) = explode(" ",microtime());
        return ((float)$usec + (float)$sec);
    }
    public function indexAction()
    {
       
        $this->view->words = $this->words;
        /*$start = $this->getmicrotime();
        sleep(2);
        $end = $this->getmicrotime();
        
        echo "Start : ".$start."<br />";
        echo "End: ".$end."<br />";
        echo (float)$end - (float)$start."<br />";*/
    }
    
    public function checkAction()
    {
        //$this->_helper->layout()->disableLayout();
        //$this->_helper->viewRenderer->setNoRender(true);
         //if($this->getRequest()->isGet()){
            $word = $this->getRequest()->getParam('word');
            $this->findWord($word, $this->words);
            $this->findWordInAlphabet($word, $this->alphabet);
            echo "<pre>"; var_dump($this->time); echo "</pre>";
            $dif = $this->time['brutforce']['time'] - $this->time['alphabet']['time'];
            echo round($dif * 1000, 2);
            echo " miliseconds<br />";
         //}
    }
    public function breakPhrasesIntoWords($phrases)
    {
        $wordsArr = array();
        $wordPattern =  "~[a-zA-Z]+(['-][a-zA-Z]+)*~i";
        foreach($phrases as $index => $phrase){
            if(isset($phrase['phrase']))$phrase = $phrase['phrase'];
            preg_match_all($wordPattern, $phrase, $words, PREG_OFFSET_CAPTURE);//пошук підстроки
            
            foreach($words[0] as $word){
                 $word = $word[0];
                 //if(!is_numeric($word))$this->checkWordList($word, $index);
                 $wordsArr[] = $word;
            }
        }
        return array_unique($wordsArr);
    }
    public function findWordInAlphabet($word, $arr)
    {
        $outerArray = 0;
        $innerArray = 0;
       $start = $this->getmicrotime();
        foreach($arr as $i => $letter){
            $firstLetter = strtolower($word[0]);
            
             if($firstLetter === $i){
                 echo "<h1>".$outerArray."</h1>";
                foreach($letter as $value){
                    
                    if($value === $word){
                        echo "<hr />Found word ".$word. "!<br />";
                        echo "Outer: ".$outerArray."<br />";
                        echo "Inner: ".$innerArray."<br />";
                        echo "<hr />";
                        $this->time['alphabet']['time'] = $this->getmicrotime() - $start;
                        echo $this->getmicrotime() - $start;
                        return;
                    }
                    $innerArray++;
                  }
              }
            $outerArray++;
        }
    }
    
    public function findWord($word, $arr)
    {
        $count = 0;
        $start = $this->getmicrotime();
        foreach($arr as $value){
            if($value === $word){
                echo "found ".$word. " !<br />";
                echo $count."<br />";
                $this->time['brutforce']['time'] = $this->getmicrotime() - $start;
                echo $this->getmicrotime() - $start;
                return;
            }
            $count++;
        }
    }
}
