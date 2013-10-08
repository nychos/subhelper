function Word(obj){
    //TODO: цього не потрібно
    if(typeof obj === 'object'){
        this.word = obj.word;
        this.source = obj.source;
        this.hasTranslation = obj.hasTranslation;
    }
};
/**
 * Кіл-ть фраз, де слово зустрілось
 * @returns Int
 */
Word.prototype.getCountOfPhrases = function(){
    return this.source.length;
};
Word.prototype.getPhrasesIndexes = function(){
    return this.source;
};
/**
 * Наявність перекладу
 * @returns boolean
 */
Word.prototype.getTranslationAvailability = function(){
  return this.hasTranslation;  
};



