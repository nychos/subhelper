
function Subtitle(data){
    if(typeof(data) !== "object"){
        throw new Error("Data is empty");
    }
    this.data = data;
    console.time("extendWordWithClass");
    this.extendWordObjectsWithWordClass();
    console.timeEnd("extendWordWithClass");
};
/**
 * Встановлюємо фрази
 * @param {jQuery} $phrases
 */
Subtitle.prototype.setPhrases = function($phrases){
    this.$phrases = $phrases;
};
/**
 * Розширює обєкт Слова необхідним функціоналом
 * 
 */
Subtitle.prototype.extendWordObjectsWithWordClass = function(){
    this.wordObject = new Word();
    for(var letter in this.data.wordMap){
        var word = this.data.wordMap[letter];
        for(var i in word){
            this.data.wordMap[letter][i]['__proto__'] = this.wordObject;
        }
    }
};
/**
 * Пошук слова у WordMap
 * @param {String} word
 * @param {Object} wordMap
 * @returns {undefined}
 */
Subtitle.prototype.getWord = function(word){
    var firstLetter = this.getFirstLetter(word);
    for(var i in this.data.wordMap){
        if(i === firstLetter){
            var wordObj = this.data.wordMap[i];
            for(var j in wordObj){
                if(wordObj[j].word === word){
                    return wordObj[j];
                }
            }
        }
    }
    throw new Error("Word " + word + " not found");
};
/**
 * Витягує Слово по літері на індексу
 * @param {Object} obj
 * @returns Object
 */
Subtitle.prototype.getWordByIndex = function(obj){
    return this.data.wordMap[obj.letter][obj.index];
};
/**
 * 
 * Показує фрази, які містять слово
 * @param {String} word
 * @returns {Object}
 */
Subtitle.prototype.showSimilarPhrases = function(data){
     if(data.source){
         
         this.clearActiveWords();
         
         var sourceLength = data.source.length;
         var length = this.$phrases.length;
         for(var i = 0; i < length; i++){
             this.$phrases[i].style.display = "none";
             for(var j = 0; j < sourceLength; j++){
                var index = data.source[j];
                if(i === index){
                    var phrase = this.$phrases[index];
                    phrase.style.display = 'block';
                    var childLength = phrase.children.length;
                    var children = phrase.children;
                    if(this.phraseChildrenWithActiveWords)
                        this.phraseChildrenWithActiveWords.push(children);
                    else 
                        this.phraseChildrenWithActiveWords = [children];
                    for(var k = 0; k < childLength; k++){
                        if(children[k].textContent.toLowerCase() === data.word){
                            children[k].classList.add("activeWord");
                        }
                    }
                    
                }
             }
         }
    }else {
        throw new Error("source is undefined");
    }
};
Subtitle.prototype.showAllPhrases = function(){
    this.clearActiveWords();
    var length = this.$phrases.length;
    for(var i = 0; i < length; i++){
        this.$phrases[i].style.display = "block";
    }
};
Subtitle.prototype.clearActiveWords = function(){
    console.time("clearActiveWords");
    if(this.phraseChildrenWithActiveWords){
        var length = this.phraseChildrenWithActiveWords.length;
        for(var i = 0; i < length; i++){
            var phraseChildren = this.phraseChildrenWithActiveWords[i];
            var phraseLength = phraseChildren.length;
            for(var j = 0; j < phraseLength; j++){
                phraseChildren[j].classList.remove("activeWord");
            }
        }
        this.phraseChildrenWithActiveWords.length = 0;
    }
    console.timeEnd("clearActiveWords");
};
Subtitle.prototype.getFirstLetter = function(word){
    return word[0].toLowerCase();
};
Subtitle.prototype.extendPhraseObjectsWithPhraseAction = function(callback){
    this.phraseObject = new Phrase();
    for(var i in this.data.phrases){
        //наслідуємо від Prase класу
        this.data.phrases[i].__proto__ =  this.phraseObject;
        this.data.phrases[i].$phrase = this.addStatusContainerToPhrase(this.$phrases[i]);
        if(i == 0){
            console.time("defineValuesForGroupOfSimilarProgressBars");
            this.defineContainerValuesForGroupOfSimilarProgressBars();
            console.timeEnd("defineValuesForGroupOfSimilarProgressBars");
        }
        this.data.phrases[i].index = i;
        this.data.phrases[i].init();
    }
    if(typeof callback === "function")callback.call(this);
};
Subtitle.prototype.addStatusContainerToPhrase = function($elem){
        var div = document.createElement("div");
        div.className = "phraseStatus";
        try{
             $elem.insertBefore(div, $elem.firstChild);
             return $elem;
        }catch(e){
            console.warn(e);
        }
};
Subtitle.prototype.getPhrase = function(id){
  return this.data.phrases[id];
};
Subtitle.prototype.updateStorage = function(){
    storage.save("subtitles", this.data);
};
Subtitle.prototype.sortPhrases = function(type){
    var phrases = this.data.phrases;
    function sort(arr) {
        if(type === 'index'){
            //return arr.slice().sort(function(a,b){return (a.index > b.index) ? 1 : -1;});
            return Array.prototype.slice.call(arr).sort(function(a,b){return (parseInt(a.index) > parseInt(b.index)) ? 1 : -1;});
        }else if(type === 'priority'){
            return arr.slice(0).sort(function(a,b){return (a.priority < b.priority) ? 1 : -1;});
        }
    }
    var sortPhrases = sort(phrases);
    var arr = [];
    for(var i in sortPhrases)arr.push(sortPhrases[i].$phrase);
    var container = document.getElementsByClassName("subtitle")[0];
    var result = document.getElementById("result");
    var div = container.cloneNode(false);
    result.removeChild(container);
    for(var i in arr)div.appendChild(arr[i]);
    result.appendChild(div);
};
/**
 * Визначаємо параметри (ширину та висоту) для елемента фрази, який є загальним
 * @returns {undefined}
 */
Subtitle.prototype.defineContainerValuesForGroupOfSimilarProgressBars = function(){
    var progressContainer = this.data.phrases[0].$phrase.firstChild;
    //console.log(progressContainer);
    var elementStyle = window.getComputedStyle(progressContainer, null);
    var borderWidth = parseInt(elementStyle.borderLeftWidth);
    if (isNaN(borderWidth)) borderWidth = 0;
    var outerWidth = progressContainer.offsetWidth;
    var outerHeight = progressContainer.offsetHeight; 
    ProgressBar.prototype.cWidth = outerWidth - (borderWidth * 2);
    ProgressBar.prototype.cHeight = outerHeight - (borderWidth * 2);
    //console.log("cWidth" + ProgressBar.prototype.cWidth);
    //console.log("cHeight" + ProgressBar.prototype.cHeight);
};
Subtitle.prototype.sortByStatus = function(status){
    for(var i in this.data.phrases){
        var phrase = this.data.phrases[i];
        if(status === "all"){phrase.$phrase.style.display = "block";continue;}
        (phrase.checkStatus(status)) ? phrase.$phrase.style.display = "block" : phrase.$phrase.style.display = "none";
    }
};
Subtitle.prototype.getPercentOfFinishedPhrases = function(){
    var phrases = this.data.phrases;
    var waiting = 0;
    var total = phrases.length;
    for(var i in phrases){
        if(phrases[i].status === 1)++waiting;
    }
    var percent = waiting *  100 / total;
    //var obj = {waiting: waiting, total : total, process : process};
    return percent;
};
/*
 * Встановлюємо загальний прогрес бар 
 */
Subtitle.prototype.setPhrasesProgressBar = function(container){
    this.phrasesProgressBar = new ProgressBar(container);
    this.phrasesProgressBar.defineContainerParameters();
    this.phrasesProgressBar.init();
};
Subtitle.prototype.triggerPhrasesProgressBar = function(){
    if(!this.phrasesProgressBar instanceof ProgressBar) throw new Error("phrasesProgressBar is not defined!");
    var percent = this.getPercentOfFinishedPhrases();
    console.log(percent);
    this.phrasesProgressBar.setValue(percent);
};