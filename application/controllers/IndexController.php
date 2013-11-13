<?php

class IndexController extends Zend_Controller_Action
{   
    protected $_words = array();//масив усіх слів субтитра
    protected $_wordPattern =  "~[a-zA-Z]+(['-][a-zA-Z]+)*~i";
    protected $time = array();
    protected $wordMap = array();
    
    public function preDispatch() 
    {
        //turn off views for all actions
        $this->_helper->viewRenderer->setNoRender(true);
    }

    public function init()
    {
        /* Initialize action controller here */
        $this->user = new Zend_Session_Namespace('user');
        $this->user->id_user = 3;
        $this->lightning = new Application_Model_Lightnings();
        $this->charge = new Application_Model_Charges();
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
    public function getmicrotime()
    {
        list($usec, $sec) = explode(" ",microtime());
        return ((float)$usec + (float)$sec);
    }
    public function removeTranslationAction()
    {
         $this->_helper->layout()->disableLayout();
         if($this->getRequest()->isXmlHttpRequest()){
             $id = $this->getRequest()->getParam('id');
             $word = $this->getRequest()->getParam('word');
             $id_user = $this->user->id_user;//TODO: Zend_Session implement
             $translations = new Application_Model_Translations();
             $result = $translations->deleteTranslationConnection($id,$word, $id_user);
             if($result){
                 $this->message("Successfully removed", "id: ".$result);
             }else {
                 $this->message("There are no entries to remove", $result, "error");
             }
         }
    }
    public function findWordInOnlineDictionary($word){
        $yandex = "https://translate.yandex.net/api/v1.5/tr.json/translate?";
        $yandex .= "key=trnsl.1.1.20131015T171502Z.d0a108edfd08efd8.b4b32462ed18e007414f408ca65a03d2a3342e85&";
        $yandex .= "text=".$word."&";
        $yandex .= "lang=uk";
        
            $response = file_get_contents($yandex);
            $result = json_decode($response);
            //TODO: перевірити чи текст на тій мові на якій вказаний параметр lang
            if($result->code === 200){
                $translation = $result->text[0];
                if(!preg_match("/.*[a-z].*/i", $translation)){
                    return $translation;//TODO: словник повертає один переклад поки що
                }
            }
        return false;
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
            $useOnlineTranslationFlag = false;
            if(intval($referrer) === 2)$useOnlineTranslationFlag = true;
            $data['id_user'] = $this->user->id_user; //TODO : from Session
            $package = array("id" => $id_translation);//для переміщення слова у власний словник
            ($referrer) ? $package['id_user'] = $referrer : $package['id_user'] = $data['id_user'];
            $translations = new Application_Model_Translations();
            $result = NULL;
            if($id_translation){
                $data['id_translation'] = $id_translation;
                //використовуємо переклад
                if($referrer)$data['referrer'] = $referrer;
                if($result = $translations->useTranslation($data)){
                    $result = Custom_Events::trigger("user-added-translation");
                    if($result)$data['lightnings'] = $result;
                    $this->message("Successfully used translation", $package);
                }else {
                    $this->message("Adding translation failed", $result, "error");
                }
            }else {
                (strlen($translation) > 0) ? $data['translation'] = $translation : $this->message("Translation not defined", $translation, "error");
                if($referrer)$data['referrer'] = $referrer;
                ($useOnlineTranslationFlag) ? $result = $translations->useOnlineTranslation($data) : $result = $translations->addTranslation($data);
                if($result){
                    $data = array("id" => $result, "id_user" => $data['id_user'], "word" => $data['word'], "translation" => $translation);
                    $result = Custom_Events::trigger("user-added-translation");
                    if($result)$data['lightnings'] = $result;
                    $this->message("Successfully added new translation", $data);
                }else {
                    $this->message("Translation adding failed", $result, "error");
                }
            }
         }
    }
    //перевіряє чи переклад співпав з тим що в користувацькій базі
    public function isTranslationCorrect($translation, $wordData, $matchedMessage, $notMatchedMessage){
         $isMatched = $this->checkTranslation($translation, $wordData);
         if($isMatched){
             return array('match' => $isMatched, 'message' => $matchedMessage);
         }else {
             return array('match' => 0, 'message' => $notMatchedMessage);
         }
    }
    /**
     * Шукає слово та переклад до нього в словнику користувача та загальному словнику
     * @param String $word
     */
    public function findTranslationAction()
    {
         $this->_helper->layout()->disableLayout();
         if($this->getRequest()->isXmlHttpRequest()){
            $translation = trim($this->getRequest()->getParam('translation'));
            $word = $this->getRequest()->getParam('word');
            $id_user = $this->user->id_user; //TODO : from Session
            $translations = new Application_Model_Translations();
            $package = array();
            $result = $translations->findTranslations($word, $id_user);
            //якщо знайдено у власному словнику або загальному, в інакшому випадку шукаємо в онлайн словнику
            if($result){
                if(isset($result['my'])){
                    $data = $result['my'];
                    //перевірити на правильність
                    $isMatched = $this->isTranslationCorrect($translation,$data, "Переклад співпав з вашим власним", "Переклад не співпав, добавте новий або перевірте правильність");
                    $data['isMatched'] = $isMatched;
                    $package['my'] = $data;
                }
                if(isset($result['common'])){
                    //робимо пошук в загальному словнику
                    //перевірити на правильність
                    $data = $result['common'];
                    $isMatched = $this->isTranslationCorrect($translation,  $data, "Переклад, знайдений в загальному словнику, співпав", "Переклад не співпав з тими що містяться в загальному словнику");
                    $data['isMatched'] = $isMatched;
                    $package['common'] = $data;
                }
            }//else {
                //TODO: вкл/викл назад підтримку словника
                $onlineTranslation = $this->findWordInOnlineDictionary($word);
                //var_dump($onlineTranslation);die();
                if($onlineTranslation){
                    $isOnlineUnique = $this->checkOnlineTranslationForDuplicates($onlineTranslation, $result);
                    if($isOnlineUnique){
                        $package['online']['translation'] = $onlineTranslation;
                        $package['online']['id_user'] = 2;//TODO: забрати hardcode yandex user
                        $isMatched = $this->isTranslationCorrect($translation,  $onlineTranslation, "Переклад, знайдений в онлайн словнику, співпав", "Переклад не співпав з тими що містяться в онлайн словнику");
                        $package['online']['isMatched'] = $isMatched;
                        if(isset($package['my'][0]['id_word']))$id_word = $package['my'][0]['id_word'];
                        if(isset($package['common'][0]['id_word']))$id_word = $package['common'][0]['id_word'];
                        if(isset($id_word))$package['online']['id_word'] = $id_word;
                    }
                }
            //}
            /**
             * Формуємо дані для бонусної системи нарахування
             */
            $info = array();
            $info['my'] = isset($package['my']);
            $info['common'] = isset($package['common']);
            $info['online'] = isset($package['online']);
            $info['myMatch'] = $info['my'] && $package['my']['isMatched']['match'];
            $info['commonMatch'] = $info['common'] && $package['common']['isMatched']['match'];
            $info['onlineMatch'] = $info['online'] && $package['online']['isMatched']['match'];
            
            //влучання в переклад Словників
            if(!$info['my'] && ($info['commonMatch'] || $info['onlineMatch'])){
               $result = Custom_Events::bind(array(
                    'location' => $this->lightning,
                    'method' => 'doLightning',
                    'event' => 'user-added-translation',
                    'data' => true)
                );
            //додатковий переклад
            }else if($info['my'] && !$info['myMatch']){
                Custom_Events::bind(array(
                   'location' => $this->lightning,
                    'method' => 'doLightning',
                    'event' => 'user-added-translation',
                    'data' => false)
                );
            //збільшення заряду при вказанні правильного перекладу    
            }else if($info['myMatch']){
                $id = $package['my']['isMatched']['match'];
                if($data = $this->compareMatchedTranslation($package['my'], $id)){
                    $data['increase'] = 1; //for discharging
                    if($charge = $this->charge->doCharge($data)){
                            $package['charge']['word'] = $word;
                            $package['charge']['charge'] = $charge;
                            $package['charge']['translation'] = $translation;
                    }
                }
            }
            $package['info'] = $info;
            
            if(count($package)){
                $this->message("Переклади витягнені з ".count($package). " джерел", $package);
            }else {
                $this->message("Переклад не знайдено в базі", array("word" => $word, "translation" => $translation));
            }
         }//end xmlrequest
    }
    /**
     * 
     * @param array $arr
     * @param type $id
     * @return boolean
     */
    public function compareMatchedTranslation(Array $arr, $id){
        foreach($arr as $value){
            if(intval($value['id']) === intval($id))return $value;
        }
        return false;
    }
    /**
     * Перевіряє чи такий переклад уже міститься в Народному словнику
     * @param type $onlineTranslation
     * @param type $result
     * @return boolean
     */
    public function checkOnlineTranslationForDuplicates($onlineTranslation, $result){
        if($result){
            foreach($result as $value){
                foreach($value as $i => $translation){
                    if($onlineTranslation === $translation['translation'])return false;
                }
            }
        }
        return true;
    }
    /**
     * Перевіряє чи переклад введений користувачем являється правильним
     * @param Array $arr - масив з перекладами
     * @param String $translation - переклад введений користувачем
     * @return boolean
     */
    public function checkTranslation($translation, $arr)
    {
        if(is_array($arr)){
            foreach($arr as $value) if($translation === $value['translation'])return $value['id'];//true;   
        }else{
            if($translation === $arr)return true;
        }
        return false;
    }
    /**
     * Створює карту слів
     * @param String $phrases
     * @return Array карта слів, містить посилання на номери фраз
     */
    public function breakPhrasesIntoWords($phrases)
    {
        $newPhrases = array();
        foreach($phrases as $index => $phrase){
            if(isset($phrase['phrase']))$phrase = $phrase['phrase'];
            $newPhrases[$index]['phrase'] = $this->wrapWordsInPhrase($phrase);//обгортає слова в фразі
            preg_match_all($this->_wordPattern, $phrase, $words, PREG_OFFSET_CAPTURE);//пошук підстроки

            //проходиться по всім словам у фразі
            foreach($words[0] as $word){
                 $word = $word[0];
                 if(!is_numeric($word)){
                     //$this->checkWordList($word, $index);
                     $wordIndex = $this->addPhraseIndexToWord($word, $index);
                     $newPhrases[$index]['words'][] = $wordIndex;
                 }
            }
        }
        return array('words' => $this->wordMap, 'phrases' => $newPhrases);
    }
    /**
     * Обгортає слова у фразах тегами, щоб можна потім було їх ідентифікувати
     * на клієнтській стороні.
     * Можна було це зробити на клієнті, але я надав перевагу серверу
     * @param type $phrases
     * @return Array - масив з фразами, слова в яких обгорнуті тегами
     */
    public function wrapWordsInPhrase($phrase)
    {
       $replacement = "<span>$0</span>";
       return preg_replace($this->_wordPattern, $replacement, trim($phrase));
    }
    /**
     * Формування wordMap
     * @param String $word
     * @param Int $phraseIndex
     * @return Array $letter => $index
     */
    public function addPhraseIndexToWord($word, $phraseIndex)
    {
        //1.перевіряємо отримані параметри
        if(!strlen($word) > 0 || !is_numeric($phraseIndex)) return false;
        //2. пошук слова у wordMap
        $word = strtolower($word);
        $firstLetter = $word[0];
        $wordIsInDictionary = false;
        if(count($this->wordMap)){
            foreach($this->wordMap as $i => $letter){
                 if($firstLetter === $i){
                    foreach($letter as $j => $wordArr){
                        //знаходимо потрібне слово
                        if($wordArr['word'] === $word){
                            //добавляємо індекс фрази і виходимо
                            $wordIsInDictionary = true;//виставляємо прапорець, що слово є у словнику
                            //записуємо індекс фрази до вказаного слова
                            array_push($this->wordMap[$firstLetter][$j]['source'], $phraseIndex);
                            return array('letter' => $i, 'index' => $j);// example 'p' => 3
                        }
                    }
                 }
            }
        }
         //записуємо слово у wordMap
        if(!$wordIsInDictionary){
            //добавляємо 3 поле translation яке вказуватиме що переклад є у користувача для даного слова
            $hasTranslation = $this->findTranslationForWordInDictionary($word);
            $this->wordMap[$firstLetter][] = array('word' => $word, 'source' => array($phraseIndex), 'hasTranslation' => $hasTranslation);
            end($this->wordMap[$firstLetter]);
            $last_key = key($this->wordMap[$firstLetter]);
            return array('letter' => $firstLetter, 'index' => $last_key);
        }
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
             $start = $this->getmicrotime();
             $row = $sub->getSubtitleById($id);
             $end = $this->getmicrotime();
             $this->time['db']['getSubtitleById']['duration'] = round(($end - $start) * 1000, 3);
             //var_dump($row);die();
             //1. витягнули субтитри
             $start = $this->getmicrotime();
             $subtitle = file_get_contents(PUBLIC_PATH.$row->subtitle);
             $end = $this->getmicrotime();
             $this->time['file']['subtitle']['duration'] = round(($end - $start) * 1000, 3);
             //2. розбили у фрази та записали їх у базу
             /*
              * Перевіряємо чи в базі є фрази з ідентифікатором субтитрів, якщо є витягуємо їх
              * якщо нема формуємо фрази та записуємо в базу
              */
             $phrase = new Application_Model_Phrases();
             $start = $this->getmicrotime();
             $phrases = $phrase->getPhrases($id);
             $end = $this->getmicrotime();
             $this->time['db']['getPhrases']['duration'] = round(($end - $start) * 1000, 3);
             
             if(!$phrases){
                $start = $this->getmicrotime();
                $phrases = $this->breakIntoPhrases($subtitle);// розбиваємо на фрази
                $end = $this->getmicrotime();
                $this->time['method']['breakIntoPhrases']['duration'] = round(($end - $start) * 1000, 3);
                
                $start = $this->getmicrotime();
                $addPhrases = $phrase->addPhrases($phrases, $id);
                $end = $this->getmicrotime();
                $this->time['db']['addPhrases']['duration'] = round(($end - $start) * 1000, 3);
                
                if(!$addPhrases)$this->message("Помилка при добавленні фраз", false, "error");
             }
             
             //3. витягнули користувацький словник
             $translations = new Application_Model_Translations();
             $userTranslations = $translations->getUserTranslations();
             $start = $this->getmicrotime();
             $dictionary = $this->orderUserTranslations($userTranslations);
             $end = $this->getmicrotime();
             $this->time['method']['orderUserTranslations']['duration'] =round(($end - $start) * 1000, 3);
             
             //4. витягнули карту слів разом з фразами, в яких слова обгорнуті тегами
             $start = $this->getmicrotime();
             $arr = $this->breakPhrasesIntoWords($phrases);
             $end = $this->getmicrotime();
             $this->time['method']['breakPhrasesIntoWords']['duration'] = round(($end - $start) * 1000, 3);
             //var_dump($arr);die();
             
             //5. витягнули блискавки користувача
             $start = $this->getmicrotime();
             $lightnings = new Application_Model_Lightnings();
             $userLightnings = $lightnings->getLightings();
             $end = $this->getmicrotime();
             $this->time['db']['getLightnings']['duration'] = round(($end - $start) * 1000, 3);
             //var_dump($dictionary);die();
             $words = $arr['words'];
             $phrases = $arr['phrases'];
             
             $start = $this->getmicrotime();
             $title = str_replace("/uploads/", "", $row->subtitle);
             $end = $this->getmicrotime();
             $this->time['php']['str_replace']['duration'] =round(($end - $start) * 1000, 3);
             //ці дані потрібно записати в сесію
             $data = array(
                 'id' => $row->id,
                 'title' => $title,
                 'created' => $row->created,
                 'id_user' => $row->id_user,
                 //'subtitle' => $subtitle,
                 'phrases' => $phrases,
                 'wordMap' => $words,
                 'dictionary' => $dictionary,
                 'timeProcess' => $this->time,
                 'lightnings' => $userLightnings
             );
             if(count($row)){
                 $this->message("Subtitle successfully fetched", $data);
             }else {
                 $this->message("Couldn't fetch subtitle. Maybe there are no subtitles with such id", $row, "error");
             }
         }
    }
    /**
     * Формуванння словника користувача добавлення індексів слів відповідних слів у wordMap
     * @param array $translations
     * @return Array
     */
    public function orderUserTranslations(Array $translations)
    {
        if(count($translations)){
            $newArr = array();
            foreach($translations as $i => $value){
                $word = $value['word'];
                $firstLetter = $this->getFirstLowerLetter($word);
                //здійснити пошук слова у wordMap і добавити звязок
                $translation = iconv('cp1251', 'utf8', $value['translation']);
                $charge = $value['charge'];
                
                if(isset($newArr[$firstLetter][$word]))
                    array_push($newArr[$firstLetter][$word],array("translation" => $translation, "charge" => $charge));
                else 
                    $newArr[$firstLetter][$word][] = array("translation" => $translation, "charge" => $charge);
            }
            $this->dictionary = $newArr;
            return $newArr;
        }
    }
    /**
     * Вказує чи слово у wordMap уже перекладено користувачем чи ні
     * @param type $word
     * @returns boolean
     */
    public function findTranslationForWordInDictionary($word)
    {
        $firstLetter = $this->getFirstLowerLetter($word);
        if(isset($this->dictionary[$firstLetter][$word]))
            return true;
        else 
            return false;
    }
    public function getFirstLowerLetter($word)
    {
        if(strlen($word) > 0)return strtolower($word[0]);
        return false;
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
               $data['id_user'] = $this->user->id_user;//з сесії витягуватимо змінну
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

