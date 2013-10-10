
function Subtitle(data){
    if(typeof(data) !== "object"){
        throw new Error("Data is empty");
    }
    this.data = data;
    //console.time("extendWordWithClass");
    this.extendWordObjectsWithWordClass();
    //console.timeEnd("extendWordWithClass");
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
 * TODO: перевірити чи працює набагато швидше ніж getWord
 * @param {Object} obj
 * @returns Object
 */
Subtitle.prototype.getWordByIndex = function(obj){
    return this.data.wordMap[obj.letter][obj.index];
};
/**
 * TODO: розібратись з правильним добавленням та видаленням класів
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
Subtitle.prototype.extendPhraseObjectsWithPhraseAction = function(){
    this.phraseObject = new Phrase();
    for(var i in this.data.phrases){
        //наслідуємо від Prase класу
        this.data.phrases[i].__proto__ =  this.phraseObject;
        this.data.phrases[i].$phrase = this.$phrases[i];
        this.data.phrases[i].init();
    }
};
Subtitle.prototype.getPhrase = function(id){
  return this.data.phrases[id];
};
Subtitle.prototype.updateStorage = function(){
    storage.save("subtitles", this.data);
};




