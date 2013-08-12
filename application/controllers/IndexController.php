<?php

class IndexController extends Zend_Controller_Action
{   
    protected $_words = array();//масив усіх слів субтитра
    public function preDispatch() 
    {
        //turn off views for all actions
        $this->_helper->viewRenderer->setNoRender(true);
    }

    public function init()
    {
        /* Initialize action controller here */
    }

    public function indexAction()
    {
        // action body
    }
    /**
     * Розбиває субтитри на фрази
     * @param String $subtitle
     * @return Array - масив з фразами
     */
    public function breakIntoPhrases($subtitle)
    {
        //$sentence = "~[!?.]*[\s]*([a-zA-Z'][\s,]*-*)+[!?,.]*[\s]*~"; //finds sentance
        $sentence = "~[!?.]*[\s]*([a-zA-Z'][\s,-]*-*)+[0-9]*[-\s]*([a-zA-Z'][\s,-]*-*)+[!?,.]*[\s]*~";
        $time = "~([0-9]*\s*)([0-9]*\s*[-><,:]+\s*[0-9]+)+\s~";
        $tags = "~(<[/*a-z]+\s*([a-z]*=[\"a-z0-9#\"]*\s*)*\s*/*>)*~"; //cut all html tags
        $sites = "~(?:http(s)?://||ftp://)?www.(([a-zA-Z_-]+).)+[a-z]{2,4}(/?[a-z]*/+)*([a-z]*.[a-z]{3,5})?[?]?([0-9a-zA-Z_=&])*~"; //cut all web adresses

        $patterns = array($tags, $sites, $time); //array of patterns

        $contex = preg_replace($patterns, "", $subtitle);
        preg_match_all($sentence, $contex, $out);
        return $out[0];
    }
    public function getWords()
    {
        return $this->_words;
    }
    /**
     * Створює карту слів
     * @param String $phrases
     */
    public function breakPhrasesIntoWords($phrases)
    {
        $pattern = "~[a-zA-Z]+(['-][a-zA-Z]+)*~i";
        foreach($phrases as $index => $phrase){
            preg_match($pattern, $phrase, $words, PREG_OFFSET_CAPTURE);//пошук підстроки
            foreach($words[0] as $word){
                 $this->checkWordList($word, $index);
            }
        }
        return $this->getWords();
    }
    /**
     * Шукає слово у словнику, якщо знаходить, дописує номер строки
     * @param String $word - слово
     * @param Integer $index - номер строки, де дане слово міститься
     * @return boolean | Array
     */
    public function checkWordList($word, $index){
        
        if(!(is_string($word) && strlen($word) > 0))return false;
        $hasIndex = is_numeric($index);
        $wordIsInDictionary = false;
        $word = strtolower($word);
        if(count($this->_words)){
            foreach($this->_words as $i => $wordData){
               
                if(strtolower($wordData['word']) === $word){
                   $wordIsInDictionary = true;
                   if($hasIndex){
                       array_push($this->_words[$i]['source'], $index);
                   }else {
                       return $wordData;
                   }
                }
            }
        }
        //добавляємо слово в словник, якщо йому нема еквівалентів
        if($hasIndex === true && $wordIsInDictionary === false){
            $this->_words[] = array('word' => $word, 'source' => array($index));
        }
        return false;
    }
    public function getsubtitleAction()
    {   
//        $sub = new Application_Model_Subtitles();
//        echo "<pre>";
//        var_dump(count($sub->getSubtitleById($this->getRequest()->getParam('id'))));
//        echo "</pre>";
//        die();
         //виключає layout
         $this->_helper->layout()->disableLayout();
         //якщо запит прийшов по ajax
         if($this->getRequest()->isXmlHttpRequest()){
             $id =   $image = $this->getRequest()->getParam('id');
             $sub = new Application_Model_Subtitles();
             $row = $sub->getSubtitleById($id);
             //1. витягнули субтитри
             $subtitle = file_get_contents(PUBLIC_PATH.$row->subtitle);
             //2. розбили у фрази
             $phrases = $this->breakIntoPhrases($subtitle);
             //3. витягнули карту слів
             $words = $this->breakPhrasesIntoWords($phrases);
             $data = array(
                 'id' => $row->id,
                 'title' => $row->subtitle,
                 'created' => $row->created,
                 'id_user' => $row->id_user,
                 'subtitle' => $subtitle,
                 'result' => json_encode($words)
             );
             if(count($row)){
                 $this->message("Subtitle successfully fetched", $data);
             }else {
                 $this->message("Couldn't fetch subtitle. Maybe there are no subtitles with such id", $row, "error");
             }
         }
    }
    
    public function message($message, $data, $status = "success")
    {
         echo json_encode(array("status" => $status, "message" => $message, "data" => $data), JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
         die();
    }
    public function uploadAction()
    {   
        //показує результат завантаження файлу
        function showMessage($upload){
               $messages = $upload->getMessages();
               $message = implode("\n", $messages);
               $this->message($message, false, "error");
         }
         $this->_helper->layout()->disableLayout();
         $this->_helper->viewRenderer->setNoRender(true);
         if($this->getRequest()->isPost()){
            $upload = new Zend_File_Transfer();
           // Returns all known internal file information
           
           $upload->setDestination(PUBLIC_PATH.'/uploads/');
           $upload->addValidator('Count', false, 1)
                  //TODO:: add validator for .srt and .sub formats
                  ->addValidator('Size', false, "1MB");
           $fileInfo = $upload->getFileInfo();
           if(!$upload->isValid()){
               showMessage($upload);//в разі помилки показуємо причину
           }
           //якщо успішно отримали субтитри
           if($upload->receive()){
               $filename = $fileInfo['subtitle']['name'];//імя файлу
               //$destination = $fileInfo['subtitle']['destination'];//папка де міститься завантаження
               //$file = $destination."/".$filename;//повний шлях до файлу
               $data['subtitle'] = '/uploads/'.$filename;
               $data['id_user'] = 1;//з сесії витягуватимо змінну
                $subtitles = new Application_Model_Subtitles();
                $response = $subtitles->addSubtitle($data);
                if($response){
                    $this->message("item was successfully added", "id: ".$response);
                }else {
                    //error
                    $this->message("item insertion failed", $response, "error");
                }
           }else {
               showMessage($upload);
           }
         }
    }
}

