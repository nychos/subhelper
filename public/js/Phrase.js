/*
 * Phrase API
 * 
 * Фраза може знаходитись в 3-ьох станах:
 *     1. в процесі
 *     2. в очікуванні
 *     3. завершена
 * 
 * */
function Phrase(obj){
    //this.index = obj.index;
    this.words = obj.words;
    this.phrase = obj.phrase;
    this.statuses = ['process', 'waiting', 'done'];
    this.ready = false;
    this.defineCountOfWords();
};
Phrase.prototype.getPhrase = function(){
    return this.phrase;
};
Phrase.prototype.getCountOfWords = function(){
        return this.total;
};
Phrase.prototype.defineCountOfWords = function(){
    this.total = this.words.length;
};
Phrase.prototype.getCountOfTranslatedWords = function(){
    /*
     * 1.пробігаємся по this.words 
     * 2.співставляємо слова з wordMap 
     * 3.зчитуємо параметр hasTranslation 
     * 4.повертаємо кіл-ть
     */
};
Phrase.prototype.getStatus = function(){
    return this.status;
};
Phrase.prototype.getTranslatedPercent = function(){
    return this.total / 100 * this.translated;
};
/**
 * Перевіряє чи кіл-ть перекладених слів досягла 100%
 * Дивиться в якому поточному стані фраза та в які стани вона може перейти
 * @returns {undefined}
 */
Phrase.prototype.statusListener = function(){
    /**
     * Дивимся в якому поточному стані фраза: 
     * status process може змінитиьс на waiting тільки різницею загальних слів до перекладених
     * status waiting можу змінитись на done тільки якщо юзер підтвердить кліком, а також може змінитись
     */
    if(this.total === this.translated){
        if(this.status === 0)this.changeStatus();
    }
};
Phrase.prototype.changeStatus = function(){
    try{
        var previous = this.statuses[this.status];
        var current = this.statuses[++this.status];
        console.log("Status from %s to %s has been changed!", previous, current);
    }catch(e){
      console.warn(e.getMessage());  
    };
};
