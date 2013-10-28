function Word(){};
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
/**
 * Встановлює наявність перекладу у слова
 * @param {boolean} status
 */
Word.prototype.setTranslationStatus = function(status){
  this.hasTranslation = status;
};



