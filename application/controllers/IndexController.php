<?php

class IndexController extends Zend_Controller_Action
{   
    protected $_words = array();//масив усіх слів субтитра
    protected $_wordPattern =  "~[a-zA-Z]+(['-][a-zA-Z]+)*~i";
    
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
        if(Zend_Registry::isRegistered('words')){
            return Zend_Registry::get('words');
        }
        return false;
    }
    public function removeTranslationAction()
    {
         $this->_helper->layout()->disableLayout();
         if($this->getRequest()->isXmlHttpRequest()){
             $id = $this->getRequest()->getParam('id');
             $word = $this->getRequest()->getParam('word');
             $id_user = 1;//TODO: Zend_Session implement
             $translations = new Application_Model_Translations();
             $result = $translations->deleteTranslationConnection($id,$word, $id_user);
             if($result){
                 $this->message("Successfully removed", "id: ".$result);
             }else {
                 $this->message("There are no entries to remove", $result, "error");
             }
         }
    }
    /**
     * Добавлення перекладу в словник
     */
    public function addTranslationAction()
    {
        
         $this->_helper->layout()->disableLayout();
         if($this->getRequest()->isXmlHttpRequest()){
            $data = array();
            $translation = trim($this->getRequest()->getParam('translation'));
            $data['word'] = $this->getRequest()->getParam('word');
            $id_translation = $this->getRequest()->getParam('id_translation');
            $referrer = $this->getRequest()->getParam('id_user');
            $data['id_user'] = 1; //TODO : from Session
            $package = array("id" => $id_translation);//для переміщення слова у власний словник
            ($referrer) ? $package['id_user'] = $referrer : $package['id_user'] = $data['id_user'];
            $translations = new Application_Model_Translations();
            if($id_translation){
                $data['id_translation'] = $id_translation;
                //використовуємо переклад
                if($referrer)$data['referrer'] = $referrer;
                if($result = $translations->useTranslation($data)){
                    $this->message("Successfully used translation", $package);
                }else {
                    $this->message("Adding translation failed", $result, "error");
                }
            }else {
                (strlen($translation) > 0) ? $data['translation'] = $translation : $this->message("Translation not defined", $translation, "error");
                //добавлення нового перекладу
                if($result = $translations->addTranslation($data)){
                    $this->message("Successfully added new translation", array("id" => $result, "id_user" => $data['id_user']));
                }else {
                    $this->message("Translation adding failed", $result, "error");
                }
            }
         }
    }
    /**
     * Шукає слово та переклад до нього в словнику користувача та загальномус словнику
     * @param String $word
     */
    public function findTranslationAction()
    {
         $this->_helper->layout()->disableLayout();
         if($this->getRequest()->isXmlHttpRequest()){
            $translation = trim($this->getRequest()->getParam('translation'));
            $word = $this->getRequest()->getParam('word');
            $id_user = 1; //TODO : from Session
            $translations = new Application_Model_Translations();
            $package = array();
            //перевіряє чи переклад співпав з тим що в користувацькій базі
            function isTranslationCorrect($self, $translation, $wordData, $matchedMessage, $notMatchedMessage){
                 $isMatched = $self->checkTranslation($wordData, $translation);
                 if($isMatched){
                     return array('match' => 1, 'message' => $matchedMessage);
                 }else {
                     return array('match' => 0, 'message' => $notMatchedMessage);
                 }
            }
            $result = $translations->findTranslations($word, $id_user);
            //var_dump($result);die();
            //якщо знайдено у власному словнику
            if($result){
                if(isset($result['my'])){
                     $data = $result['my'];
                    //перевірити на правильність
                    $isMatched = isTranslationCorrect($this, $translation,$data, "Переклад співпав з вашим власним", "Переклад не співпав, добавте новий або перевірте правильність");
                    $data['isMatched'] = $isMatched;
                    $package['my'] = $data;
                }
                if(isset($result['common'])){
                    //робимо пошук в загальному словнику
                    //перевірити на правильність
                    $data = $result['common'];
                    $isMatched = isTranslationCorrect($this, $translation,  $data, "Переклад, знайдений в загальному словнику, співпав", "Переклад не співпав з тими що містяться в загальному словнику");
                    $data['isMatched'] = $isMatched;
                    $package['common'] = $data;
                }
            }//no results
            //var_dump($result);die();
            if(count($package)){
                $this->message("Переклади витягнені з ".count($package). " джерел", $package);
            }else {
                $this->message("Переклад не знайдено в базі", array("word" => $word, "translation" => $translation));
            }
         }//end xmlrequest
    }
    /**
     * Перевіряє чи переклад введений користувачем являється правильним
     * @param Array $arr - масив з перекладами
     * @param String $translation - переклад введений користувачем
     * @return boolean
     */
    public function checkTranslation($arr, $translation)
    {
        foreach($arr as $value) if($translation === $value['translation'])return true;
        return false;
    }
    /**
     * Створює карту слів
     * @param String $phrases
     * @return Array карта слів, містить посилання на номери фраз
     */
    public function breakPhrasesIntoWords($phrases)
    {
        $testArr = array();
        foreach($phrases as $index => $phrase){
            preg_match_all($this->_wordPattern, $phrase, $words, PREG_OFFSET_CAPTURE);//пошук підстроки
            foreach($words[0] as $word){
                 $word = $word[0];
                 if(!is_numeric($word))$testArr[] = $this->checkWordList($word, $index);
            }
        }
        return $this->getWords();
    }
    /**
     * Обгортає слова у фразах тегами, щоб можна потім було їх ідентифікувати
     * на клієнтській стороні.
     * Можна було це зробити на клієнті, але я надав перевагу серверу
     * @param type $phrases
     * @return Array - масив з фразами, слова в яких обгорнуті тегами
     */
    public function wrapWordsInPhrases($phrases)
    {
        $newPhrasesWithWrappedWords = [];
        foreach($phrases as $i => $phrase){
            $replacement = "<span>$0</span>";
            $newPhrasesWithWrappedWords[] = preg_replace($this->_wordPattern, $replacement, $phrase);
        }
        return $newPhrasesWithWrappedWords;
    }
    /**
     * Шукає слово у словнику, якщо знаходить, дописує номер строки
     * @param String $word - слово
     * @param Integer $index - номер строки, де дане слово міститься
     * @return boolean | Array
     */
    public function checkWordList($word, $index = false)
    {
        if(!(is_string($word) && strlen($word) > 0))return false;
        $hasIndex = is_numeric($index);
        $wordIsInDictionary = false;
        $word = strtolower($word);
        $registry = Zend_Registry::getInstance();
        
        if(Zend_Registry::isRegistered('words')){
            
            $words = $registry['words'];
            if(count($words)){
                foreach($words as $i => $wordData){

                    if(strtolower($wordData['word']) === $word){
                       $wordIsInDictionary = true;
                       if($hasIndex){
                           array_push($registry['words'][$i]['source'], $index);
                       }else {
                           return $wordData;
                       }
                    }
                }
            }
        }
        //добавляємо слово в словник, якщо йому нема еквівалентів
        if($hasIndex === true && $wordIsInDictionary === false){
            $registry['words'][] = array('word' => $word, 'source' => array($index));
        }
        return "Count is : ".count($registry['words']);
    }
    /**
     * Витягує субтитр та формує фрази і слова з нього
     * якщо клієнт має локальне сховище, тоді записуємо дані в нього, в інакшому випадку
     * в Сесію
     */
    public function getSubtitleAction()
    {
         //виключає layout
         $this->_helper->layout()->disableLayout();
         //якщо запит прийшов по ajax
         if($this->getRequest()->isXmlHttpRequest()){
             $id = $this->getRequest()->getParam('id');
             //if session entry exists with such subtitle id fetched that data otherwise fetched from db
             $sub = new Application_Model_Subtitles();   
             $row = $sub->getSubtitleById($id);
             //1. витягнули субтитри
             $subtitle = file_get_contents(PUBLIC_PATH.$row->subtitle);
             //2. розбили у фрази
             $phrases = $this->breakIntoPhrases($subtitle);
             //3. витягнули карту слів
             $words = $this->breakPhrasesIntoWords($phrases);
             $newPhrases = $this->wrapWordsInPhrases($phrases);
             $title = str_replace("/uploads/", "", $row->subtitle);
             //ці дані потрібно записати в сесію
             $data = array(
                 'id' => $row->id,
                 'title' => $title,
                 'created' => $row->created,
                 'id_user' => $row->id_user,
                 'subtitle' => $subtitle,
                 'phrases' => $newPhrases,
                 'wordMap' => $words,
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
//    public function log()
//    {
//       //TODO: Zend_Log and Zend_Debug use
//    }
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

